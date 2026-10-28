/**
 * Serilog-compatible Dual-Sink Audit Logger for MedFlex Synchronization Service.
 * Writes structured telemetry to SQLite 'medflex_audit_logs' and rolling daily .clef files.
 * Includes Sliding Window Duplicate Suppressor to prevent log flooding during retries.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

const MedflexEventTypes = {
  PING_RECEIVED: 'mf_ping_received',
  HEARTBEAT_OK: 'mf_heartbeat_ok',
  HEARTBEAT_FAIL: 'mf_heartbeat_fail',
  BOOKING_RECEIVED: 'mf_booking_received',
  BOOKING_CREATED: 'mf_booking_created',
  BOOKING_CONFLICT: 'mf_booking_conflict',
  BOOKING_CANCELLED: 'mf_booking_cancelled',
  SLOT_PUSHED: 'mf_slot_pushed',
  SCHEDULE_SENT: 'mf_schedule_sent',
  ENQUEUED_OFFLINE: 'mf_enqueued_offline',
  QUEUE_DRAINED: 'mf_queue_drained',
  CONNECTION_DEGRADED: 'mf_connection_degraded',
  CONNECTION_LOST: 'mf_connection_lost',
  CONNECTION_RESTORED: 'mf_connection_restored',
  DUPLICATE_SUPPRESSED: 'mf_duplicate_suppressed',
  WEBHOOK_REJECTED: 'mf_webhook_rejected',
  AUTH_FAILED: 'mf_auth_failed',
  RCA_INCIDENT_CREATED: 'mf_rca_incident_created',
  PULL_APPOINTMENTS_STARTED: 'mf_pull_appointments_started',
  PULL_APPOINTMENTS_COMPLETED: 'mf_pull_appointments_completed',
  PULL_APPOINTMENTS_FAILED: 'mf_pull_appointments_failed'
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

// In-Memory Sliding Window Duplicate Suppressor
const suppressionMap = new Map();
const SUPPRESSION_WINDOW_MS = 10000; // 10 seconds

function cleanExpiredSuppression() {
  const now = Date.now();
  for (const [key, item] of suppressionMap.entries()) {
    if (now - item.firstSeen > SUPPRESSION_WINDOW_MS) {
      if (item.count > 1) {
        // Emit summary record
        writeRawAudit({
          level: LogLevels.WARN,
          message: `Event '${item.eventType}' repeated ${item.count} times in last 10s. Repetitive entries suppressed.`,
          eventType: MedflexEventTypes.DUPLICATE_SUPPRESSED,
          direction: item.direction || 'Internal',
          claimId: item.claimId,
          appointmentId: item.appointmentId,
          doctorId: item.doctorId,
          httpStatus: item.httpStatus,
          durationMs: 0,
          endpoint: item.endpoint,
          properties: {
            OriginalEventType: item.eventType,
            DuplicateCount: item.count,
            WindowMs: SUPPRESSION_WINDOW_MS,
            DeduplicationFingerprint: key
          },
          isDuplicate: 1,
          isSimulation: item.isSimulation || 0,
          sandboxDirection: item.sandboxDirection || 'none'
        });
      }
      suppressionMap.delete(key);
    }
  }
}

// Periodically clean suppression window
setInterval(cleanExpiredSuppression, 5000).unref();

/**
 * Raw write to SQLite and CLEF file
 */
function writeRawAudit({
  level,
  message,
  eventType,
  direction = 'Internal',
  claimId = null,
  appointmentId = null,
  doctorId = null,
  httpStatus = 200,
  durationMs = 0,
  endpoint = null,
  properties = {},
  exception = null,
  isDuplicate = 0,
  isSimulation = 0,
  sandboxDirection = 'none'
}) {
  const timestamp = new Date().toISOString();
  const exceptionDetails = exception instanceof Error
    ? `${exception.name}: ${exception.message}\n${exception.stack || ''}`
    : (exception ? String(exception) : null);

  const serilogCfg = getSerilogConfig();

  const enrichedProps = {
    Application: serilogCfg.Properties?.Application || 'OrthoERP.MedFlexSync',
    Environment: isSimulation ? 'Sandbox' : (serilogCfg.Properties?.Environment || 'Production'),
    Version: serilogCfg.Properties?.Version || '2.0.1',
    MachineName: os.hostname(),
    ProcessId: process.pid,
    ThreadId: process.pid,
    EnvironmentUserName: (function() {
      try { return os.userInfo()?.username || process.env.USERNAME || ''; } catch (e) { return ''; }
    })(),
    EventType: eventType,
    Direction: direction,
    ClaimId: claimId,
    AppointmentId: appointmentId,
    DoctorId: doctorId,
    HttpStatus: httpStatus,
    DurationMs: durationMs,
    Endpoint: endpoint,
    IsDuplicate: Boolean(isDuplicate),
    IsSimulation: Boolean(isSimulation),
    SandboxDirection: sandboxDirection,
    ...properties
  };

  // 1. Write CLEF formatted line to rolling file
  if (serilogCfg.Sinks?.File?.Enabled !== false) {
    try {
      const dateStr = timestamp.slice(0, 10);
      const clefFilePath = path.join(logsDir, `medflex-sync-${dateStr}.clef`);
      const clefEntry = {
        '@t': timestamp,
        '@mt': message,
        '@l': level,
        ...enrichedProps
      };
      if (exceptionDetails) {
        clefEntry['@x'] = exceptionDetails;
      }
      fs.appendFileSync(clefFilePath, JSON.stringify(clefEntry) + '\n', 'utf8');
    } catch (fsErr) {
      console.error('[medflexAuditLogger] CLEF file write error:', fsErr.message);
    }
  }

  // 2. Write to SQLite table 'medflex_audit_logs'
  const propsJson = JSON.stringify(enrichedProps);
  const insertSql = `
    INSERT INTO medflex_audit_logs (
      timestamp, level, message, event_type, direction, claim_id, appointment_id,
      doctor_id, http_status, duration_ms, endpoint, properties_json, exception,
      is_duplicate, is_simulation, sandbox_direction
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    insertSql,
    [
      timestamp, level, message, eventType, direction, claimId, appointmentId,
      doctorId, httpStatus, durationMs, endpoint, propsJson, exceptionDetails,
      isDuplicate ? 1 : 0, isSimulation ? 1 : 0, sandboxDirection
    ],
    function (dbErr) {
      if (dbErr) {
        console.error('[medflexAuditLogger] SQLite insert error:', dbErr.message);
      }
    }
  );

  // 3. Also write to unified master serilog table
  db.run(`
    INSERT INTO serilog (
      timestamp, level, event_type, source_context, message, properties_json,
      appointment_id, doctor_id, duration_ms, client_ip, exception
    ) VALUES (datetime('now', 'localtime'), ?, ?, 'OrthoErp.MedFlexSync', ?, ?, ?, ?, ?, '127.0.0.1', ?)
  `, [
    level,
    eventType,
    message,
    propsJson,
    appointmentId,
    doctorId,
    Math.round(durationMs || 0),
    exceptionDetails
  ], () => {});
}

/**
 * Public Log method with Sliding Window Deduplication
 */
function logMedflexAudit({
  level = LogLevels.INFO,
  message,
  eventType = MedflexEventTypes.HEARTBEAT_OK,
  direction = 'Internal',
  claimId = null,
  appointmentId = null,
  doctorId = null,
  httpStatus = 200,
  durationMs = 0,
  endpoint = null,
  properties = {},
  exception = null,
  isSimulation = 0,
  sandboxDirection = 'none',
  skipSuppression = false
}) {
  if (skipSuppression) {
    return writeRawAudit({
      level, message, eventType, direction, claimId, appointmentId, doctorId,
      httpStatus, durationMs, endpoint, properties, exception,
      isDuplicate: 0, isSimulation, sandboxDirection
    });
  }

  // Generate fingerprint for sliding window
  const fingerprint = crypto
    .createHash('md5')
    .update(`${eventType}|${level}|${message}|${doctorId || ''}|${claimId || ''}|${httpStatus}`)
    .digest('hex');

  const now = Date.now();
  const existing = suppressionMap.get(fingerprint);

  if (existing && now - existing.firstSeen < SUPPRESSION_WINDOW_MS) {
    // Within window: suppress and increment count
    existing.count += 1;
    existing.lastSeen = now;
    return;
  }

  // Not in window or expired: record and write first occurrence
  suppressionMap.set(fingerprint, {
    firstSeen: now,
    lastSeen: now,
    count: 1,
    level, message, eventType, direction, claimId, appointmentId, doctorId,
    httpStatus, durationMs, endpoint, isSimulation, sandboxDirection
  });

  writeRawAudit({
    level, message, eventType, direction, claimId, appointmentId, doctorId,
    httpStatus, durationMs, endpoint, properties, exception,
    isDuplicate: 0, isSimulation, sandboxDirection
  });
}

/**
 * Auto-cleans Serilog records in SQLite and rolling CLEF files older than retentionMonths (default 3 months)
 * @param {number} retentionMonths - Number of months of records to retain (default: 3)
 * @returns {Promise<{ success: boolean, deletedDbRows: number, deletedFiles: number, cutoffDate: string }>}
 */
async function autoCleanOldAuditLogs(retentionMonths = 3) {
  return new Promise((resolve) => {
    const months = Number(retentionMonths) > 0 ? Number(retentionMonths) : 3;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffIso = cutoff.toISOString();
    const cutoffDateStr = cutoffIso.slice(0, 10);

    // 1. Delete expired records from SQLite medflex_audit_logs
    db.run(
      "DELETE FROM medflex_audit_logs WHERE timestamp < ?",
      [cutoffIso],
      function (err) {
        const deletedDbRows = this ? (this.changes || 0) : 0;
        if (err) {
          console.error('[medflexAuditLogger] Error auto-cleaning SQLite audit logs:', err.message);
        } else if (deletedDbRows > 0) {
          console.log(`[medflexAuditLogger] Auto-cleaned ${deletedDbRows} audit log rows older than ${months} months (before ${cutoffIso})`);
        }

        // 2. Delete rolling CLEF files older than cutoff
        let deletedFiles = 0;
        try {
          if (fs.existsSync(logsDir)) {
            const files = fs.readdirSync(logsDir);
            for (const file of files) {
              const match = file.match(/^medflex-sync-(\d{4}-\d{2}-\d{2})\.clef$/);
              if (match) {
                const fileDateStr = match[1];
                if (fileDateStr < cutoffDateStr) {
                  const filePath = path.join(logsDir, file);
                  try {
                    fs.unlinkSync(filePath);
                    deletedFiles += 1;
                    console.log(`[medflexAuditLogger] Removed expired CLEF log file: ${file}`);
                  } catch (delErr) {
                    console.warn(`[medflexAuditLogger] Failed to unlink file ${file}:`, delErr.message);
                  }
                }
              }
            }
          }
        } catch (fsErr) {
          console.error('[medflexAuditLogger] Error auto-cleaning CLEF log files:', fsErr.message);
        }

        resolve({
          success: !err,
          deletedDbRows,
          deletedFiles,
          cutoffDate: cutoffIso
        });
      }
    );
  });
}

// Daily auto-cleanup interval (every 24 hours)
const DAILY_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  autoCleanOldAuditLogs(3).catch((e) => console.warn('[medflexAuditLogger] Daily cleanup error:', e.message));
}, DAILY_CLEANUP_INTERVAL_MS).unref();

// Initial cleanup on server start (after 5s delay)
setTimeout(() => {
  autoCleanOldAuditLogs(3).catch((e) => console.warn('[medflexAuditLogger] Initial startup cleanup error:', e.message));
}, 5000).unref();

module.exports = {
  LogLevels,
  MedflexEventTypes,
  logMedflexAudit,
  autoCleanOldAuditLogs
};

