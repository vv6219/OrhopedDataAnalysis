/**
 * Unified Serilog-compatible User Action and System Audit Logger.
 * Records audit telemetry to SQLite 'serilog' master table, SQLite FTS5 index,
 * and rolling .clef files configured in appsettings.json.
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

const UserActionEvents = {
  // Authentication & Security
  AUTH_LOGIN_SUCCESS: 'auth_login_success',
  AUTH_LOGIN_FAILED: 'auth_login_failed',
  AUTH_LOGOUT: 'auth_logout',
  SECURITY_ACCESS_DENIED: 'security_access_denied',
  AUTH_SESSION_EXPIRED: 'auth_session_expired',

  // User Management
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_LOCKED: 'user_locked',
  USER_UNLOCKED: 'user_unlocked',
  USER_PASSWORD_CHANGED: 'user_password_changed',
  USER_PERMISSIONS_UPDATED: 'user_permissions_updated',

  // Menu & Configuration
  MENU_CONFIG_UPDATED: 'menu_config_updated',
  MENU_BACKUP_RESTORED: 'menu_backup_restored',
  APPSETTINGS_UPDATED: 'appsettings_updated',

  // System Administration
  SQLITE_STUDIO_QUERY: 'sqlite_studio_query',
  DB_BACKUP_CREATED: 'db_backup_created',
  SERVICE_HEALTH_CHECK: 'service_health_check',

  // Clinical & Patient
  PATIENT_CREATED: 'patient_created',
  PATIENT_UPDATED: 'patient_updated',
  APPOINTMENT_SCHEDULED: 'appointment_scheduled',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_STATUS_CHANGED: 'appointment_status_changed',
  PROTOCOL_SIGNED: 'protocol_signed',
  PROTOCOL_REVOKED: 'protocol_revoked',
  PATIENT_DOCUMENT_ISSUED: 'patient_document_issued',
  PATIENT_DOCUMENT_PRINTED: 'patient_document_printed',

  // Cashier & Financial
  FISCAL_SHIFT_OPENED: 'fiscal_shift_opened',
  FISCAL_SHIFT_CLOSED: 'fiscal_shift_closed',
  FISCAL_RECEIPT_ISSUED: 'fiscal_receipt_issued',
  FISCAL_RECEIPT_REFUND: 'fiscal_receipt_refund',
  POS_AUTH_SUCCESS: 'pos_auth_success',
  POS_AUTH_DECLINE: 'pos_auth_decline',
  POS_SETTLEMENT_SUCCESS: 'pos_settlement_success'
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

// Initialize tables, columns, indexes, and FTS5 virtual table
db.serialize(() => {
  // 1. Ensure master serilog table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS serilog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      level TEXT NOT NULL,
      event_type TEXT NOT NULL,
      source_context TEXT NOT NULL DEFAULT 'OrthoErp.Workstation',
      message TEXT NOT NULL,
      properties_json TEXT,
      protocol_id INTEGER,
      appointment_id INTEGER,
      patient_id INTEGER,
      doctor_id INTEGER,
      user_id INTEGER,
      username TEXT,
      duration_ms INTEGER DEFAULT 0,
      client_ip TEXT,
      exception TEXT
    )
  `);

  // 2. Safely add user_id and username columns if existing schema lacks them
  db.all(`PRAGMA table_info(serilog)`, (err, cols) => {
    if (!err && Array.isArray(cols)) {
      const colNames = cols.map(c => c.name);
      if (!colNames.includes('user_id')) {
        db.run(`ALTER TABLE serilog ADD COLUMN user_id INTEGER`);
      }
      if (!colNames.includes('username')) {
        db.run(`ALTER TABLE serilog ADD COLUMN username TEXT`);
      }
    }
  });

  // 3. Create performance indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_ts ON serilog(timestamp DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_lvl ON serilog(level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_src ON serilog(source_context)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_evt ON serilog(event_type)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_usr ON serilog(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_proto ON serilog(protocol_id)`);

  // 4. Create FTS5 virtual table and triggers for full-text search
  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS serilog_fts USING fts5(
      message,
      properties_json,
      exception,
      username,
      event_type,
      content=serilog,
      content_rowid=id,
      tokenize='unicode61'
    )
  `);

  db.run(`
    CREATE TRIGGER IF NOT EXISTS trg_serilog_ai AFTER INSERT ON serilog BEGIN
      INSERT INTO serilog_fts(rowid, message, properties_json, exception, username, event_type)
      VALUES (new.id, new.message, new.properties_json, new.exception, new.username, new.event_type);
    END
  `);

  db.run(`
    CREATE TRIGGER IF NOT EXISTS trg_serilog_ad AFTER DELETE ON serilog BEGIN
      INSERT INTO serilog_fts(serilog_fts, rowid, message, properties_json, exception, username, event_type)
      VALUES('delete', old.id, old.message, old.properties_json, old.exception, old.username, old.event_type);
    END
  `);
});

/**
 * Log a structured user action or backend event into Serilog
 */
function logUserAction({
  level = LogLevels.INFO,
  eventType = UserActionEvents.SERVICE_HEALTH_CHECK,
  sourceContext = 'OrthoErp.Auth',
  message,
  properties = {},
  protocolId = null,
  appointmentId = null,
  patientId = null,
  doctorId = null,
  userId = null,
  username = null,
  clientIp = '127.0.0.1',
  durationMs = 0,
  exception = null
}) {
  const serilogCfg = getSerilogConfig();

  const exceptionDetails = exception instanceof Error
    ? `${exception.name}: ${exception.message}\n${exception.stack || ''}`
    : (exception ? String(exception) : null);

  const cleanIp = (clientIp || '127.0.0.1').replace(/^::ffff:/, '');

  const enrichedProps = {
    Application: serilogCfg.Properties?.Application || 'OrthoERP.Central',
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
    UserId: userId,
    Username: username,
    DoctorId: doctorId,
    PatientId: patientId,
    ProtocolId: protocolId,
    AppointmentId: appointmentId,
    ClientIp: cleanIp,
    DurationMs: Math.round(durationMs || 0),
    ...properties
  };

  const propertiesJson = JSON.stringify(enrichedProps);

  // 1. Write to SQLite unified table
  const insertSql = `
    INSERT INTO serilog (
      timestamp, level, event_type, source_context, message, properties_json,
      protocol_id, appointment_id, patient_id, doctor_id, user_id, username,
      duration_ms, client_ip, exception
    ) VALUES (datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    insertSql,
    [
      level,
      eventType,
      sourceContext,
      message,
      propertiesJson,
      protocolId,
      appointmentId,
      patientId,
      doctorId,
      userId,
      username,
      Math.round(durationMs || 0),
      cleanIp,
      exceptionDetails
    ],
    function(err) {
      if (err) {
        console.error('[userActionAuditLogger] SQLite Insert Error:', err.message);
      }
    }
  );

  // 2. Write to rolling CLEF file
  if (serilogCfg.Sinks?.File?.Enabled !== false) {
    try {
      const logsDirectory = getLogsDirectory();
      const rollingInterval = serilogCfg.RollingInterval || 'Day';
      const suffix = getRollingFileSuffix(rollingInterval);
      const filename = `user-actions-${suffix}.clef`;
      const fullPath = path.join(logsDirectory, filename);

      const clefEntry = {
        '@t': new Date().toISOString(),
        '@mt': message,
        '@l': level,
        ...enrichedProps
      };
      if (exceptionDetails) {
        clefEntry['@x'] = exceptionDetails;
      }
      fs.appendFileSync(fullPath, JSON.stringify(clefEntry) + '\n', 'utf8');
    } catch (fsErr) {
      console.error('[userActionAuditLogger] CLEF file write error:', fsErr.message);
    }
  }
}

/**
 * Express middleware helper to extract client IP
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(s => s.trim());
    return ips[0].replace(/^::ffff:/, '');
  }
  return (req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');
}

module.exports = {
  LogLevels,
  UserActionEvents,
  logUserAction,
  getClientIp
};

