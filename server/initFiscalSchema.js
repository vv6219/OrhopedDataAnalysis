const sqlite3 = require('sqlite3').verbose();

/**
 * Initializes tables, views, and indexes for Atol 91F fiscal registration and Serilog audit logging.
 * @param {sqlite3.Database} db 
 * @param {Function} [callback] 
 */
function initFiscalSchema(db, callback) {
  db.serialize(() => {
    // 1. Table for fiscal receipts
    db.run(`CREATE TABLE IF NOT EXISTS fiscal_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER REFERENCES operation_transactions(id) ON DELETE SET NULL,
      visit_id INTEGER REFERENCES patient_visits(id) ON DELETE SET NULL,
      patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
      patient_contact TEXT,                    -- Тег 1008 (Телефон / Email)
      receipt_type TEXT NOT NULL DEFAULT 'sell', -- 'sell' (приход), 'sell_return' (возврат)
      payment_type TEXT NOT NULL,              -- 'card', 'cash', 'sbp', 'invoice'
      total_amount REAL NOT NULL,              -- Сумма чека (₽)
      tax_type INTEGER DEFAULT 6,              -- LIBFPTR_TAX_NO (Без НДС пп. 2 п. 2 ст. 149 НК РФ)
      payment_subject_type INTEGER DEFAULT 4,  -- LIBFPTR_PS_SERVICE (Услуга)
      payment_method_type INTEGER DEFAULT 4,   -- LIBFPTR_PM_FULL_PAYMENT (Полный расчет)
      fiscal_document_number INTEGER,          -- Номер ФД (тег 1040)
      fiscal_sign TEXT,                        -- ФПД (фискальный признак документа, тег 1077)
      fiscal_drive_number TEXT,                -- Номер ФН (тег 1041)
      shift_number INTEGER,                    -- Номер смены (тег 1038)
      receipt_number INTEGER,                  -- Номер чека за смену (тег 1042)
      kkt_reg_number TEXT,                     -- Регистрационный номер ККТ (РН ККТ)
      status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'fiscalized', 'paper_error', 'failed', 'cancelled'
      is_fiscalized INTEGER DEFAULT 0,         -- 1 = успешно записан в ФН
      is_printed INTEGER DEFAULT 0,            -- 1 = физически распечатан на ленте
      error_code INTEGER DEFAULT 0,
      error_message TEXT,
      device_model TEXT DEFAULT 'АТОЛ 91Ф',
      port TEXT DEFAULT 'COM3',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      fiscalized_at TEXT
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_tx ON fiscal_receipts(transaction_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_status ON fiscal_receipts(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_created ON fiscal_receipts(created_at)`);

    // 2. Table for detailed Serilog audit logs
    db.run(`CREATE TABLE IF NOT EXISTS fiscal_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime')),
      level TEXT NOT NULL,                     -- 'Debug', 'Information', 'Warning', 'Error', 'Fatal'
      message TEXT NOT NULL,
      event_type TEXT NOT NULL,                -- 'command_sent', 'response_received', 'state_recovery', 'receipt_open', 'item_registered', 'payment_registered', 'receipt_closed', 'fiscal_complete', 'paper_jam', 'fn_error', 'cancelled'
      receipt_id INTEGER REFERENCES fiscal_receipts(id) ON DELETE SET NULL,
      transaction_id INTEGER,
      device_port TEXT DEFAULT 'COM3',
      duration_ms INTEGER DEFAULT 0,
      properties_json TEXT,                    -- Структурированный контекст Serilog (JSON)
      exception_details TEXT
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_fiscal_audit_time ON fiscal_audit_logs(timestamp)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_fiscal_audit_event ON fiscal_audit_logs(event_type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_fiscal_audit_receipt ON fiscal_audit_logs(receipt_id)`);

    if (callback) callback();
  });
}

module.exports = initFiscalSchema;
