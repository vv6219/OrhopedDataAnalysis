/**
 * Serilog-compatible SQLite Audit Logger for Alfa-Bank POS Terminal (Arcus-2 / INPAS).
 * Records structured event telemetry to 'pos_audit_logs' matching the Serilog schema.
 */
const db = require('./database');

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
 * Write a structured audit log entry to SQLite
 * @param {Object} entry
 * @param {string} entry.level - Log level (Debug, Information, Warning, Error, Fatal)
 * @param {string} entry.message - Human-readable message
 * @param {string} entry.eventType - Event type constant
 * @param {string} [entry.terminalId='ALFA_770192'] - TID of terminal
 * @param {string} [entry.transactionUuid] - UUID of the transaction
 * @param {number} [entry.amount] - Transaction amount in rubles
 * @param {string} [entry.rrn] - Bank Retrieval Reference Number
 * @param {string} [entry.authCode] - Bank authorization code
 * @param {string} [entry.devicePort='COM4'] - Physical COM port or IP
 * @param {number} [entry.durationMs=0] - Elapsed duration in milliseconds
 * @param {Object} [entry.properties] - Additional structured context (JSON)
 * @param {string|Error} [entry.exception] - Exception message/stack trace
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
  exception = null
}) {
  const exceptionDetails = exception instanceof Error 
    ? `${exception.name}: ${exception.message}\n${exception.stack}` 
    : (exception ? String(exception) : null);

  const payloadJson = JSON.stringify({
    ...properties,
    level,
    eventType,
    timestamp: new Date().toISOString()
  });

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
}

module.exports = {
  logPosAudit,
  PosLogLevels,
  PosEventTypes
};
