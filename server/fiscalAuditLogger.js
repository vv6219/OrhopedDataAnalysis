/**
 * Serilog-compatible SQLite Audit Logger for Atol 91F operations.
 * Records structured event telemetry to 'fiscal_audit_logs' and master 'serilog' table.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const db = require('./database');
const { getSerilogConfig } = require('./config');

const LogLevels = {
  DEBUG: 'Debug',
  INFO: 'Information',
  WARN: 'Warning',
  ERROR: 'Error',
  FATAL: 'Fatal'
};

const EventTypes = {
  DEVICE_CONNECT: 'device_connect',
  DEVICE_STATUS: 'device_status',
  DEVICE_ERROR: 'device_error',
  STATE_RECOVERY: 'state_recovery',
  RECEIPT_QUEUED: 'receipt_queued',
  RECEIPT_OPEN: 'receipt_open',
  ITEM_REGISTERED: 'item_registered',
  PAYMENT_REGISTERED: 'payment_registered',
  RECEIPT_CLOSED: 'receipt_closed',
  FISCAL_COMPLETE: 'fiscal_complete',
  PAPER_ERROR: 'paper_error',
  FN_ERROR: 'fn_error',
  CANCELLED: 'cancelled',
  REPEAT_PRINT: 'repeat_print',
  SETTINGS_UPDATED: 'settings_updated',
  SETTINGS_CREATED: 'settings_created',
  SETTINGS_DELETED: 'settings_deleted',
  SETTINGS_ACTIVATED: 'settings_activated',
  SHIFT_OPENED: 'fiscal_shift_opened',
  SHIFT_CLOSED: 'fiscal_shift_closed',
  X_REPORT: 'fiscal_x_report_printed',
  Z_REPORT: 'fiscal_z_report_printed',
  MODE_CHANGED: 'fiscal_mode_changed'
};

function getRollingFileSuffix(interval) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLogsDirectory() {
  const cfg = getSerilogConfig();
  const relOrAbs = cfg.LogsDirectory || '../logs';
  const resolved = path.isAbsolute(relOrAbs) ? relOrAbs : path.resolve(__dirname, relOrAbs);
  if (!fs.existsSync(resolved)) {
    try { fs.mkdirSync(resolved, { recursive: true }); } catch (e) {}
  }
  return resolved;
}

/**
 * Write a structured audit log entry to SQLite and rolling CLEF
 * @param {Object} entry
 */
function logFiscalAudit({
  level = LogLevels.INFO,
  message,
  eventType,
  receiptId = null,
  transactionId = null,
  devicePort = 'COM3',
  durationMs = 0,
  properties = {},
  exception = null,
  userId = null,
  username = null,
  clientIp = '127.0.0.1',
  sourceContext = 'OrthoErp.FiscalAtol'
}) {
  const serilogCfg = getSerilogConfig();
  const exceptionDetails = exception instanceof Error 
    ? `${exception.name}: ${exception.message}\n${exception.stack || ''}` 
    : (exception ? String(exception) : null);

  const cleanIp = (clientIp || '127.0.0.1').replace(/^::ffff:/, '');

  const enrichedProps = {
    Application: serilogCfg.Properties?.Application || 'OrthoErp.FiscalDaemon',
    Component: 'Atol91F',
    Environment: serilogCfg.Properties?.Environment || 'Production',
    Version: serilogCfg.Properties?.Version || '2.0.1',
    MachineName: os.hostname(),
    ProcessId: process.pid,
    ThreadId: process.pid,
    EnvironmentUserName: (function() {
      try { return os.userInfo()?.username || process.env.USERNAME || ''; } catch (e) { return ''; }
    })(),
    SourceContext: sourceContext,
    EventType: eventType,
    DevicePort: devicePort,
    ReceiptId: receiptId,
    TransactionId: transactionId,
    UserId: userId,
    Username: username,
    ClientIp: cleanIp,
    DurationMs: durationMs,
    ...properties
  };

  const propertiesJson = JSON.stringify(enrichedProps);

  // 1. Insert into dedicated fiscal_audit_logs table
  db.run(
    `INSERT INTO fiscal_audit_logs (
      timestamp, level, message, event_type, receipt_id, transaction_id, device_port, duration_ms, properties_json, exception_details
    ) VALUES (datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      level,
      message,
      eventType,
      receiptId,
      transactionId,
      devicePort,
      Math.round(durationMs),
      propertiesJson,
      exceptionDetails
    ],
    function(err) {
      if (err) {
        console.error('[FiscalAuditLogger] DB Insert Error:', err.message);
      }
    }
  );

  // 2. Insert into central serilog table (with FTS5 and indexing)
  db.run(
    `INSERT INTO serilog (
      timestamp, level, event_type, source_context, message, properties_json,
      duration_ms, client_ip, exception, user_id, username
    ) VALUES (datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      level,
      eventType,
      sourceContext,
      message,
      propertiesJson,
      Math.round(durationMs || 0),
      cleanIp,
      exceptionDetails,
      userId,
      username
    ],
    function(err) {
      if (err) {
        console.error('[FiscalAuditLogger] Master serilog Insert Error:', err.message);
      }
    }
  );

  // 3. Write to rolling .clef file
  if (serilogCfg.Sinks?.File?.Enabled !== false) {
    try {
      const logsDir = getLogsDirectory();
      const rollingInterval = serilogCfg.RollingInterval || serilogCfg.Sinks?.File?.RollingInterval || 'Day';
      const suffix = getRollingFileSuffix(rollingInterval);
      const clefFilePath = path.join(logsDir, `fiscal_audit_${suffix}.clef`);

      const clefEntry = {
        '@t': new Date().toISOString(),
        '@mt': message,
        '@l': level,
        EventType: eventType,
        ...enrichedProps
      };
      if (exceptionDetails) {
        clefEntry['@x'] = exceptionDetails;
      }
      fs.appendFile(clefFilePath, JSON.stringify(clefEntry) + '\n', () => {});
    } catch (fsErr) {
      // ignore
    }
  }

  // Also print to console with color-coded tags
  const timestamp = new Date().toLocaleTimeString('ru-RU');
  const levelTag = level === LogLevels.ERROR || level === LogLevels.FATAL 
    ? `\x1b[31m[${level.toUpperCase()}]\x1b[0m` 
    : level === LogLevels.WARN 
      ? `\x1b[33m[${level.toUpperCase()}]\x1b[0m` 
      : `\x1b[32m[${level.toUpperCase()}]\x1b[0m`;

  console.log(`[${timestamp}] ${levelTag} [${sourceContext}:${eventType}] ${message}`);
}

module.exports = {
  logFiscalAudit,
  LogLevels,
  EventTypes
};
