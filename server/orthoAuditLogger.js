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
  TEST_EVALUATED: 'test_evaluated',
  DIAGNOSIS_ATTACHED: 'diagnosis_attached',
  TREATMENT_PRESCRIBED: 'treatment_prescribed',
  PROTOCOL_SIGNED: 'protocol_signed',
  MEDIA_UPLOADED: 'media_uploaded',
  MEDIA_DELETED: 'media_deleted',
  EXPORT_GENERATED: 'export_generated',
  TRANSFERRED_TO_CHECKOUT: 'transferred_to_checkout',
  PROTOCOL_REVOKED: 'protocol_revoked',
  FTS_SEARCH_PERFORMED: 'fts_search_performed'
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

/**
 * Write a structured audit log entry to SQLite and rolling Serilog CLEF file
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

  // 1. Write to SQLite
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
        console.error('[OrthoAuditLogger] DB Insert Error:', err.message);
      }
    }
  );

  // 2. Write Serilog CLEF formatted line to rolling file
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

  // 3. Colored Console Log
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
  LogLevels,
  EventTypes
};
