/**
 * Serilog-compatible SQLite Audit Logger for Atol 91F operations.
 * Records structured event telemetry to 'fiscal_audit_logs' matching the Serilog schema.
 */
const db = require('./database');

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
  REPEAT_PRINT: 'repeat_print'
};

/**
 * Write a structured audit log entry to SQLite
 * @param {Object} entry
 * @param {string} entry.level - Log level (Debug, Information, Warning, Error, Fatal)
 * @param {string} entry.message - Human-readable message
 * @param {string} entry.eventType - Event type constant
 * @param {number} [entry.receiptId] - ID in fiscal_receipts table
 * @param {number} [entry.transactionId] - ID in operation_transactions table
 * @param {string} [entry.devicePort='COM3'] - Serial COM port or interface
 * @param {number} [entry.durationMs=0] - Elapsed milliseconds
 * @param {Object} [entry.properties] - Additional structured context (JSON)
 * @param {string|Error} [entry.exception] - Exception message/stack trace
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
  exception = null
}) {
  const exceptionDetails = exception instanceof Error 
    ? `${exception.name}: ${exception.message}\n${exception.stack || ''}` 
    : (exception ? String(exception) : null);

  const enrichedProps = {
    Application: 'OrthoErp.FiscalDaemon',
    Component: 'Atol91F',
    ThreadId: process.pid,
    ...properties
  };

  const propertiesJson = JSON.stringify(enrichedProps);

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

  // Also print to console with color-coded tags
  const timestamp = new Date().toLocaleTimeString('ru-RU');
  const levelTag = level === LogLevels.ERROR || level === LogLevels.FATAL 
    ? `\x1b[31m[${level.toUpperCase()}]\x1b[0m` 
    : level === LogLevels.WARN 
      ? `\x1b[33m[${level.toUpperCase()}]\x1b[0m` 
      : `\x1b[32m[${level.toUpperCase()}]\x1b[0m`;

  console.log(`[${timestamp}] ${levelTag} [${eventType}] ${message}`);
}

module.exports = {
  logFiscalAudit,
  LogLevels,
  EventTypes
};
