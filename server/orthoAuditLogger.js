/**
 * Serilog-compatible SQLite and File Audit Logger for Orthopedic Workstation operations.
 * Records structured telemetry to 'ortho_audit_logs' and rolling daily .clef files.
 */
const fs = require('fs');
const path = require('path');
const db = require('./database');

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
  PROTOCOL_PRINTED: 'protocol_printed'
};

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (e) {
    // ignore
  }
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
 * Prune log records older than 6 months (180 days) from SQLite serilog and ortho_audit_logs tables
 */
let lastPruneTime = 0;
function pruneOldSerilogLogs() {
  const now = Date.now();
  // Throttle pruning check to once per hour
  if (now - lastPruneTime < 3600 * 1000) return;
  lastPruneTime = now;

  db.run(`DELETE FROM serilog WHERE timestamp < datetime('now', '-180 days', 'localtime')`, function(err) {
    if (!err && this.changes > 0) {
      console.log(`[Serilog 6-Month Retention] Purged ${this.changes} log entries older than 180 days from serilog table`);
    }
  });

  db.run(`DELETE FROM ortho_audit_logs WHERE timestamp < datetime('now', '-180 days', 'localtime')`, function(err) {
    if (!err && this.changes > 0) {
      console.log(`[Serilog 6-Month Retention] Purged ${this.changes} log entries older than 180 days from ortho_audit_logs table`);
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

  const exceptionDetails = exception instanceof Error 
    ? `${exception.name}: ${exception.message}\n${exception.stack || ''}` 
    : (exception ? String(exception) : null);

  const enrichedProps = {
    Application: 'OrthoErp.Workstation',
    Component: 'OrthoExam',
    ThreadId: process.pid,
    AppointmentId: appointmentId,
    ProtocolId: protocolId,
    PatientId: patientId,
    DoctorId: doctorId,
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

  // 2. Write to unified Serilog table (with 6-month retention policy)
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

  // 3. Write Serilog CLEF formatted line to rolling file
  try {
    const today = new Date().toISOString().slice(0, 10);
    const clefFilePath = path.join(logsDir, `ortho_audit_${today}.clef`);
    const clefRecord = {
      "@t": new Date().toISOString(),
      "@m": message,
      "@l": level,
      EventType: eventType,
      AppointmentId: appointmentId,
      ProtocolId: protocolId,
      PatientId: patientId,
      DoctorId: doctorId,
      DurationMs: Math.round(durationMs),
      ClientIp: clientIp,
      ...enrichedProps
    };
    if (exceptionDetails) {
      clefRecord["@x"] = exceptionDetails;
    }
    fs.appendFile(clefFilePath, JSON.stringify(clefRecord) + '\n', () => {});
  } catch (fileErr) {
    // Non-blocking file error
  }

  // 4. Colored Console Log
  const timestamp = new Date().toLocaleTimeString('ru-RU');
  const levelTag = level === LogLevels.ERROR || level === LogLevels.FATAL 
    ? `\x1b[31m[${level.toUpperCase()}]\x1b[0m` 
    : level === LogLevels.WARN 
      ? `\x1b[33m[${level.toUpperCase()}]\x1b[0m` 
      : `\x1b[36m[${level.toUpperCase()}]\x1b[0m`;

  console.log(`[${timestamp}] ${levelTag} [ORTHO:${eventType}] ${message}`);
}

module.exports = {
  logOrthoAudit,
  pruneOldSerilogLogs,
  LogLevels,
  EventTypes
};
