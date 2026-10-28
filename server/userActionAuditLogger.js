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
  PATIENT_QUICK_CREATED: 'patient_quick_created',
  APPOINTMENT_SCHEDULED: 'appointment_scheduled',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_STATUS_CHANGED: 'appointment_status_changed',
  APPOINTMENT_PATIENT_ARRIVED: 'appointment_patient_arrived',
  APPOINTMENT_NO_SHOW: 'appointment_no_show',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  APPOINTMENT_COLLISION_DETECTED: 'appointment_collision_detected',
  APPOINTMENT_NOTIFICATION_ACTION: 'appointment_notification_action',
  CLINIC_SCHEDULE_CONFIG_UPDATED: 'clinic_schedule_config_updated',
  QUEUE_STATUS_CHANGED: 'queue_status_changed',
  PROTOCOL_SIGNED: 'protocol_signed',
  PROTOCOL_REVOKED: 'protocol_revoked',
  PROTOCOL_PRINTED: 'protocol_printed',
  PROTOCOL_DELETED: 'protocol_deleted',
  PROTOCOL_ACCESS_GRANTED: 'protocol_access_granted',
  PROTOCOL_ACCESS_REVOKED: 'protocol_access_revoked',
  REFERRAL_ISSUED: 'referral_issued',
  REFERRAL_PRINTED: 'referral_printed',
  REFERRAL_STATUS_CHANGED: 'referral_status_changed',
  PATIENT_DOCUMENT_ISSUED: 'patient_document_issued',
  PATIENT_DOCUMENT_PRINTED: 'patient_document_printed',

  // Clinical Templates & Catalogs 2.0
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_UPDATED: 'template_updated',
  TEMPLATE_CLONED: 'template_cloned',
  TEMPLATE_DELETED: 'template_deleted',
  CATALOG_ITEM_CREATED: 'catalog_item_created',
  CATALOG_ITEM_UPDATED: 'catalog_item_updated',
  CATALOG_ITEM_ARCHIVED: 'catalog_item_archived',

  // Visit Checkout & Cashier
  VISIT_CHECKOUT_COMPLETED: 'visit_checkout_completed',
  VISIT_CHECKOUT_FAILED: 'visit_checkout_failed',
  VISIT_MATERIALS_CONSUMED: 'visit_materials_consumed',
  VISIT_TRANSFERRED_TO_CHECKOUT: 'visit_transferred_to_checkout',
  VISIT_RECEIPT_REPEAT_PRINTED: 'visit_receipt_repeat_printed',

  // Fiscal Shifts & Reports (АТОЛ 91Ф)
  FISCAL_SHIFT_OPENED: 'fiscal_shift_opened',
  FISCAL_SHIFT_CLOSED: 'fiscal_shift_closed',
  FISCAL_X_REPORT_PRINTED: 'fiscal_x_report_printed',
  FISCAL_Z_REPORT_PRINTED: 'fiscal_z_report_printed',
  FISCAL_SHIFT_RECONCILED: 'fiscal_shift_reconciled',
  FISCAL_SHIFT_AUDIT_EXPORT: 'fiscal_shift_audit_export',

  // Fiscal Devices & Settings (АТОЛ 91Ф)
  FISCAL_RECEIPT_ISSUED: 'fiscal_receipt_issued',
  FISCAL_RECEIPT_FAILED: 'fiscal_receipt_failed',
  FISCAL_RECEIPT_REFUND: 'fiscal_receipt_refund',
  FISCAL_SETTINGS_CREATED: 'fiscal_settings_created',
  FISCAL_SETTINGS_UPDATED: 'fiscal_settings_updated',
  FISCAL_SETTINGS_ACTIVATED: 'fiscal_settings_activated',
  FISCAL_SETTINGS_DELETED: 'fiscal_settings_deleted',
  FISCAL_MODE_CHANGED: 'fiscal_mode_changed',
  FISCAL_TEST_CONNECTION: 'fiscal_test_connection',

  // Staff Payouts & Payroll (Расчет выплат)
  PAYOUT_SCHEME_CREATED: 'payout_scheme_created',
  PAYOUT_SCHEME_UPDATED: 'payout_scheme_updated',
  PAYOUT_STAFF_RATES_UPDATED: 'payout_staff_rates_updated',
  PAYOUT_SERVICES_LOCKED: 'payout_services_locked',
  PAYOUT_SERVICES_UNLOCKED: 'payout_services_unlocked',
  PAYOUT_PREVIEW_CALCULATED: 'payout_preview_calculated',
  PAYOUT_CALCULATION_COMMITTED: 'payout_calculation_committed',
  PAYOUT_ACCRUAL_UPDATED: 'payout_accrual_updated',
  PAYOUT_ACCRUAL_DELETED: 'payout_accrual_deleted',
  PAYOUT_ACCRUALS_BULK_ACTION: 'payout_accruals_bulk_action',
  PAYOUT_SHEET_CREATED: 'payout_sheet_created',
  PAYOUT_SHEET_STATUS_CHANGED: 'payout_sheet_status_changed',
  PAYOUT_SHEET_EXPORTED: 'payout_sheet_exported',

  // Services & BOM (Каталог сервисов и технологических карт)
  OPERATION_CREATED: 'operation_created',
  OPERATION_UPDATED: 'operation_updated',
  OPERATION_DELETED: 'operation_deleted',
  OPERATION_BOM_UPDATED: 'operation_bom_updated',

  // Warehouse & Inventory (Склад материалов и медикаментов)
  INVENTORY_ITEM_CREATED: 'inventory_item_created',
  INVENTORY_ITEM_UPDATED: 'inventory_item_updated',
  INVENTORY_ITEM_DELETED: 'inventory_item_deleted',
  INVENTORY_STOCK_ADJUSTED: 'inventory_stock_adjusted',

  // Calculation Parameters (Параметры расчетов)
  CALCULATION_PARAMETER_UPDATED: 'calculation_parameter_updated',
  CALCULATION_PARAMETER_DELETED: 'calculation_parameter_deleted',

  // POS Acquiring Terminal (Банковский POS-терминал эквайринга)
  POS_AUTH_SUCCESS: 'pos_auth_success',
  POS_AUTH_DECLINE: 'pos_auth_decline',
  POS_REVERSAL_SUCCESS: 'pos_reversal_success',
  POS_REVERSAL_FAIL: 'pos_reversal_fail',
  POS_SETTLEMENT_SUCCESS: 'pos_settlement_success',
  POS_SETTLEMENT_FAIL: 'pos_settlement_fail',
  POS_TEST_HOST: 'pos_test_host',
  POS_SETTINGS_UPDATED: 'pos_settings_updated',
  POS_SETTINGS_CREATED: 'pos_settings_created',
  POS_SETTINGS_ACTIVATED: 'pos_settings_activated',
  POS_SETTINGS_DELETED: 'pos_settings_deleted',
  POS_MODE_CHANGED: 'pos_mode_changed',
  POS_SERVICE_ACTION: 'pos_service_action'
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
  if (!req) return '127.0.0.1';
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(s => s.trim());
    return ips[0].replace(/^::ffff:/, '');
  }
  return (req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1').replace(/^::ffff:/, '');
}

/**
 * Extracts authenticated user context safely from request
 */
function getUserContext(req) {
  if (!req) return { userId: null, username: null, user: null, role: null };
  try {
    const authHeader = req.headers?.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.query?.token) {
      token = String(req.query.token).trim();
    }

    if (token) {
      const parts = token.split('.');
      if (parts.length === 2) {
        const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
        if (payload && (!payload.exp || payload.exp > Date.now())) {
          return {
            userId: payload.userId || null,
            username: payload.username || payload.user || null,
            user: payload.user || payload.username || null,
            role: payload.role || null,
            staffId: payload.staffId || null
          };
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return {
    userId: req.user?.id || req.userId || null,
    username: req.user?.username || req.username || null,
    user: req.user?.name || req.user?.user || null,
    role: req.user?.role || null,
    staffId: req.user?.staffId || null
  };
}

module.exports = {
  LogLevels,
  UserActionEvents,
  logUserAction,
  getClientIp,
  getUserContext
};

