/**
 * Serilog-compatible SQLite and File Audit Logger for Orthopedic Workstation operations.
 * Records structured telemetry to 'ortho_audit_logs' and rolling .clef files configured via appsettings.json.
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
  VISIT_INITIATED: 'visit_initiated',
  EXAM_DRAFT_SAVED: 'exam_draft_saved',
  EXAM_DRAFT_AUTOSAVED: 'exam_draft_autosaved',
  SHABLON_ACTION_SYNC: 'shablon_action_sync',
  TEST_EVALUATED: 'test_evaluated',
  DIAGNOSIS_ATTACHED: 'diagnosis_attached',
  TREATMENT_PRESCRIBED: 'treatment_prescribed',
  PROTOCOL_SIGNED: 'protocol_signed',
  PROTOCOL_RETURNED_TO_DRAFT: 'protocol_returned_to_draft',
  MEDIA_UPLOADED: 'media_uploaded',
  MEDIA_DELETED: 'media_deleted',
  EXPORT_GENERATED: 'export_generated',
  TRANSFERRED_TO_CHECKOUT: 'transferred_to_checkout',
  PROTOCOL_REVOKED: 'protocol_revoked',
  FTS_SEARCH_PERFORMED: 'fts_search_performed',
  PROTOCOL_ACCESS_GRANTED: 'protocol_access_granted',
  PROTOCOL_ACCESS_REVOKED: 'protocol_access_revoked',
  PROTOCOL_DELETED: 'protocol_deleted',
  PROTOCOL_UPDATED: 'protocol_updated',
  PROTOCOL_PRINTED: 'protocol_printed',
  PATIENT_DOCUMENT_ISSUED: 'patient_document_issued',
  PATIENT_DOCUMENT_PRINTED: 'patient_document_printed',
  PATIENT_DOCUMENT_REVOKED: 'patient_document_revoked',
  SECURITY_ACCESS_DENIED: 'security_access_denied'
};

/**
 * Returns rolling interval file suffix based on appsettings.json Serilog.RollingInterval
 * Options: 'Day', 'Hour', 'Month', 'Year', 'Infinite'
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

// Ensure logs directory exists from appsettings.json
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

// Initialize serilog and protocol doctor access tables in SQLite
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS serilog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      level TEXT NOT NULL,
      event_type TEXT,
      source_context TEXT DEFAULT 'OrthoErp.Workstation',
      message TEXT NOT NULL,
      properties_json TEXT,
      protocol_id INTEGER,
      appointment_id INTEGER,
      patient_id INTEGER,
      doctor_id INTEGER,
      duration_ms INTEGER DEFAULT 0,
      client_ip TEXT,
      exception TEXT
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_ts ON serilog(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_proto ON serilog(protocol_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_serilog_event ON serilog(event_type)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS ortho_protocol_doctor_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      granted_by_user_id INTEGER NOT NULL,
      granted_by_name TEXT NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      reason TEXT,
      is_active INTEGER DEFAULT 1,
      UNIQUE(protocol_id, doctor_id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_proto_doc_access ON ortho_protocol_doctor_access(protocol_id, doctor_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_doc_proto_access ON ortho_protocol_doctor_access(doctor_id)`);
});

/**
 * Prune log records based on Serilog.RetentionDays in appsettings.json (default 180 days)
 */
let lastPruneTime = 0;
function pruneOldSerilogLogs() {
  const now = Date.now();
  if (now - lastPruneTime < 3600 * 1000) return;
  lastPruneTime = now;

  const serilogCfg = getSerilogConfig();
  const retentionDays = Number(serilogCfg.RetentionDays || serilogCfg.Sinks?.SQLite?.RetentionDays || 180);

  db.run(`DELETE FROM serilog WHERE timestamp < datetime('now', '-${retentionDays} days', 'localtime')`, function(err) {
    if (!err && this.changes > 0) {
      console.log(`[Serilog ${retentionDays}-Day Retention] Purged ${this.changes} log entries from serilog table`);
    }
  });

  db.run(`DELETE FROM ortho_audit_logs WHERE timestamp < datetime('now', '-${retentionDays} days', 'localtime')`, function(err) {
    if (!err && this.changes > 0) {
      console.log(`[Serilog ${retentionDays}-Day Retention] Purged ${this.changes} log entries from ortho_audit_logs table`);
    }
  });
}

// Initial prune check on load
setTimeout(pruneOldSerilogLogs, 3000);

/**
 * Write a structured audit log entry to SQLite serilog tables and rolling Serilog CLEF file
 * @param {Object} entry
 */
function logOrthoAudit({
  level = LogLevels.INFO,
  message,
  eventType,
  appointmentId = null,
  protocolId = null,
  patientId = null,
  doctorId = null,
  durationMs = 0,
  properties = {},
  clientIp = '127.0.0.1',
  exception = null
}) {
  pruneOldSerilogLogs();

  const serilogCfg = getSerilogConfig();

  const exceptionDetails = exception instanceof Error 
    ? `${exception.name}: ${exception.message}\n${exception.stack || ''}` 
    : (exception ? String(exception) : null);

  // Dynamic Serilog enrichments from appsettings.json
  const enrichedProps = {
    Application: serilogCfg.Properties?.Application || 'OrthoERP.Workstation',
    Environment: serilogCfg.Properties?.Environment || 'Production',
    Version: serilogCfg.Properties?.Version || '2.0.1',
    MachineName: os.hostname(),
    ProcessId: process.pid,
    ThreadId: process.pid,
    EnvironmentUserName: (function() {
      try { return os.userInfo()?.username || process.env.USERNAME || ''; } catch (e) { return ''; }
    })(),
    Component: 'OrthoExam',
    AppointmentId: appointmentId,
    ProtocolId: protocolId,
    PatientId: patientId,
    DoctorId: doctorId,
    DurationMs: Math.round(durationMs),
    ClientIp: clientIp,
    ...properties
  };

  const propertiesJson = JSON.stringify(enrichedProps);

  // 1. Write to ortho_audit_logs table
  db.run(
    `INSERT INTO ortho_audit_logs (
      timestamp, level, event_type, appointment_id, protocol_id, patient_id, doctor_id, duration_ms, message, properties_json, client_ip, exception
    ) VALUES (datetime('now', 'localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      level,
      eventType,
      appointmentId,
      protocolId,
      patientId,
      doctorId,
      Math.round(durationMs),
      message,
      propertiesJson,
      clientIp,
      exceptionDetails
    ],
    function(err) {
      if (err) {
        console.error('[OrthoAuditLogger] DB Insert Error (ortho_audit_logs):', err.message);
      }
    }
  );

  // 2. Write to unified Serilog table (with retention policy from appsettings)
  db.run(
    `INSERT INTO serilog (
      timestamp, level, event_type, source_context, message, properties_json, protocol_id, appointment_id, patient_id, doctor_id, duration_ms, client_ip, exception
    ) VALUES (datetime('now', 'localtime'), ?, ?, 'OrthoErp.Workstation', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      level,
      eventType,
      message,
      propertiesJson,
      protocolId,
      appointmentId,
      patientId,
      doctorId,
      Math.round(durationMs),
      clientIp,
      exceptionDetails
    ],
    function(err) {
      if (err) {
        console.error('[OrthoAuditLogger] DB Insert Error (serilog):', err.message);
      }
    }
  );

  // 3. Write Serilog CLEF formatted line to rolling file based on appsettings.json RollingInterval
  if (serilogCfg.Sinks?.File?.Enabled !== false) {
    try {
      const logsDir = getLogsDirectory();
      const rollingInterval = serilogCfg.RollingInterval || serilogCfg.Sinks?.File?.RollingInterval || 'Day';
      const suffix = getRollingFileSuffix(rollingInterval);
      const clefFilePath = path.join(logsDir, `ortho_audit_${suffix}.clef`);

      const clefRecord = {
        "@t": new Date().toISOString(),
        "@m": message,
        "@l": level,
        EventType: eventType,
        ...enrichedProps
      };
      if (exceptionDetails) {
        clefRecord["@x"] = exceptionDetails;
      }
      fs.appendFile(clefFilePath, JSON.stringify(clefRecord) + '\n', () => {});
    } catch (fileErr) {
      // Non-blocking file error
    }
  }

  // 4. Colored Console Log if enabled in appsettings.json
  if (serilogCfg.Sinks?.Console?.Enabled !== false) {
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    const levelTag = level === LogLevels.ERROR || level === LogLevels.FATAL 
      ? `\x1b[31m[${level.toUpperCase()}]\x1b[0m` 
      : level === LogLevels.WARN 
        ? `\x1b[33m[${level.toUpperCase()}]\x1b[0m` 
        : `\x1b[36m[${level.toUpperCase()}]\x1b[0m`;

    console.log(`[${timestamp}] ${levelTag} [ORTHO:${eventType}] [PID:${process.pid}] ${message}`);
  }
}

module.exports = {
  logOrthoAudit,
  pruneOldSerilogLogs,
  getRollingFileSuffix,
  LogLevels,
  EventTypes
};
