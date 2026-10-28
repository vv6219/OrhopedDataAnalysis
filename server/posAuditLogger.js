/**
 * Serilog-compatible SQLite and File Audit Logger for Alfa-Bank POS Terminal (Arcus-2 / INPAS).
 * Records structured event telemetry to 'pos_audit_logs' and rolling .clef files configured via appsettings.json.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const db = require('./database');
const { getSerilogConfig } = require('./config');

const PosLogLevels = {
  DEBUG: 'Debug',
  INFO: 'Information',
  WARN: 'Warning',
  ERROR: 'Error',
  FATAL: 'Fatal'
};

const PosEventTypes = {
  POS_CONNECT: 'pos_connect',
  POS_STATUS: 'pos_status',
  POS_ERROR: 'pos_error',
  TEST_HOST: 'test_host',
  AUTH_START: 'auth_start',
  AUTH_SUCCESS: 'auth_success',
  AUTH_DECLINE: 'auth_decline',
  REVERSAL_START: 'reversal_start',
  REVERSAL_SUCCESS: 'reversal_success',
  REVERSAL_FAIL: 'reversal_fail',
  SETTLEMENT_START: 'settlement_start',
  SETTLEMENT_SUCCESS: 'settlement_success',
  SETTLEMENT_FAIL: 'settlement_fail',
  SETTINGS_UPDATED: 'settings_updated',
  SETTINGS_CREATED: 'settings_created',
  SETTINGS_DELETED: 'settings_deleted',
  SETTINGS_ACTIVATED: 'settings_activated'
};

/**
 * Returns rolling interval file suffix based on appsettings.json Serilog.RollingInterval
 */
function getRollingFileSuffix(interval) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');

  switch ((interval || 'Day').toLowerCase()) {
    case 'hour':
      return `${year}-${month}-${day}_${hour}`;
    case 'month':
      return `${year}-${month}`;
    case 'year':
      return `${year}`;
    case 'infinite':
      return 'rolling';
    case 'day':
    default:
      return `${year}-${month}-${day}`;
  }
}

function getLogsDirectory() {
  const cfg = getSerilogConfig();
  const relOrAbs = cfg.LogsDirectory || '../logs';
  const resolved = path.isAbsolute(relOrAbs) ? relOrAbs : path.resolve(__dirname, relOrAbs);
  if (!fs.existsSync(resolved)) {
    try {
      fs.mkdirSync(resolved, { recursive: true });
    } catch (e) {
      // ignore
    }
  }
  return resolved;
}

/**
 * Write a structured audit log entry to SQLite and rolling CLEF file
 * @param {Object} entry
 */
function logPosAudit({
  level = PosLogLevels.INFO,
  message,
  eventType,
  terminalId = 'ALFA_770192',
  transactionUuid = null,
  amount = null,
  rrn = null,
  authCode = null,
  devicePort = 'COM4',
  durationMs = 0,
  properties = {},
  exception = null,
  userId = null,
  username = null,
  clientIp = '127.0.0.1'
}) {
  const serilogCfg = getSerilogConfig();

  const exceptionDetails = exception instanceof Error 
    ? `${exception.name}: ${exception.message}\n${exception.stack}` 
    : (exception ? String(exception) : null);

  const cleanIp = (clientIp || '127.0.0.1').replace(/^::ffff:/, '');

  // Dynamic Serilog enrichments from appsettings.json
  const enrichedProps = {
    Application: serilogCfg.Properties?.Application || 'OrthoERP.AlfaPos',
    Environment: serilogCfg.Properties?.Environment || 'Production',
    Version: serilogCfg.Properties?.Version || '2.0.1',
    MachineName: os.hostname(),
    ProcessId: process.pid,
    ThreadId: process.pid,
    EnvironmentUserName: (function() {
      try { return os.userInfo()?.username || process.env.USERNAME || ''; } catch (e) { return ''; }
    })(),
    SourceContext: 'OrthoErp.AlfaPos',
    TerminalId: terminalId,
    TransactionUuid: transactionUuid,
    Amount: amount,
    Rrn: rrn,
    AuthCode: authCode,
    DevicePort: devicePort,
    DurationMs: durationMs,
    UserId: userId,
    Username: username,
    ClientIp: cleanIp,
    ...properties,
    level,
    eventType,
    timestamp: new Date().toISOString()
  };

  const payloadJson = JSON.stringify(enrichedProps);

  const sql = `
    INSERT INTO pos_audit_logs (
      timestamp, level, message, event_type, terminal_id, transaction_uuid,
      amount, rrn, auth_code, device_port, duration_ms, properties_json, exception_details
    ) VALUES (
      datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `;

  db.run(sql, [
    level,
    message,
    eventType,
    terminalId,
    transactionUuid,
    amount,
    rrn,
    authCode,
    devicePort,
    durationMs,
    payloadJson,
    exceptionDetails
  ], (err) => {
    if (err) {
      console.error('[PosAuditLogger] Failed to write audit record:', err.message);
    }
  });

  // Also write to unified master serilog table
  db.run(`
    INSERT INTO serilog (
      timestamp, level, event_type, source_context, message, properties_json,
      duration_ms, client_ip, exception, user_id, username
    ) VALUES (datetime('now', 'localtime'), ?, ?, 'OrthoErp.AlfaPos', ?, ?, ?, ?, ?, ?, ?)
  `, [
    level,
    eventType,
    message,
    payloadJson,
    Math.round(durationMs || 0),
    cleanIp,
    exceptionDetails,
    userId,
    username
  ], () => {});

  // Rolling CLEF file sink
  if (serilogCfg.Sinks?.File?.Enabled !== false) {
    try {
      const logsDir = getLogsDirectory();
      const rollingInterval = serilogCfg.RollingInterval || serilogCfg.Sinks?.File?.RollingInterval || 'Day';
      const suffix = getRollingFileSuffix(rollingInterval);
      const clefFilePath = path.join(logsDir, `pos_audit_${suffix}.clef`);

      const clefEntry = {
        '@t': new Date().toISOString(),
        '@m': message,
        '@l': level,
        EventType: eventType,
        ...enrichedProps
      };
      if (exceptionDetails) {
        clefEntry['@x'] = exceptionDetails;
      }
      fs.appendFile(clefFilePath, JSON.stringify(clefEntry) + '\n', () => {});
    } catch (fsErr) {
      // Non-blocking file error
    }
  }

  // Console output if enabled
  if (serilogCfg.Sinks?.Console?.Enabled !== false) {
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    console.log(`[${timestamp}] [${level.toUpperCase()}] [POS:${eventType}] [PID:${process.pid}] ${message}`);
  }
}

module.exports = {
  logPosAudit,
  PosLogLevels,
  PosEventTypes
};
