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
      items_json TEXT,                         -- Детализированный список товарных позиций / услуг (JSON)
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

    // 3. Table for Fiscal Service Device & Operational Settings
    db.run(`CREATE TABLE IF NOT EXISTS fiscal_device_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name TEXT NOT NULL UNIQUE DEFAULT 'default',
      port TEXT NOT NULL DEFAULT 'COM3',
      baud_rate INTEGER NOT NULL DEFAULT 115200,
      device_model TEXT NOT NULL DEFAULT 'АТОЛ 91Ф',
      is_mock_mode INTEGER NOT NULL DEFAULT 1,
      single_consumer_queue INTEGER NOT NULL DEFAULT 1,
      execution_timeout_seconds INTEGER NOT NULL DEFAULT 35,
      fn_number TEXT NOT NULL DEFAULT '9960440301984210',
      kkt_reg_number TEXT NOT NULL DEFAULT '0004928103049182',
      default_tax_type INTEGER NOT NULL DEFAULT 6,
      tax_regime_name TEXT NOT NULL DEFAULT 'Без НДС (пп. 2 п. 2 ст. 149 НК РФ — медицинские услуги)',
      payment_subject_type INTEGER NOT NULL DEFAULT 4,
      payment_method_type INTEGER NOT NULL DEFAULT 4,
      default_shift_number INTEGER NOT NULL DEFAULT 14,
      base_fiscal_document_number INTEGER NOT NULL DEFAULT 1041,
      org_name TEXT NOT NULL DEFAULT 'ИЧП Добрушкин А.М.',
      clinic_subname TEXT NOT NULL DEFAULT 'Центр Ортопедии и Травматологии',
      org_address TEXT NOT NULL DEFAULT 'г. Сочи, ул. Транспортная 65',
      org_inn TEXT NOT NULL DEFAULT '450107060083',
      org_ogrnip TEXT NOT NULL DEFAULT '323237500208220',
      fns_site TEXT NOT NULL DEFAULT 'www.nalog.gov.ru',
      external_daemon_url TEXT NOT NULL DEFAULT 'http://localhost:5050',
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_by TEXT DEFAULT 'Администратор'
    )`);

    // Seed default settings profile if table is empty
    db.get('SELECT COUNT(*) as cnt FROM fiscal_device_settings', (err, row) => {
      if (!err && row && row.cnt === 0) {
        db.run(`
          INSERT INTO fiscal_device_settings (
            profile_name, port, baud_rate, device_model, is_mock_mode, single_consumer_queue,
            execution_timeout_seconds, fn_number, kkt_reg_number, default_tax_type, tax_regime_name,
            payment_subject_type, payment_method_type, default_shift_number, base_fiscal_document_number,
            org_name, clinic_subname, org_address, org_inn, org_ogrnip, fns_site,
            external_daemon_url, is_active, notes, updated_at, updated_by
          ) VALUES (
            'Основной профиль (АТОЛ 91Ф)', 'COM3', 115200, 'АТОЛ 91Ф', 1, 1,
            35, '9960440301984210', '0004928103049182', 6, 'Без НДС (пп. 2 п. 2 ст. 149 НК РФ — медицинские услуги)',
            4, 4, 14, 1041,
            'ИЧП Добрушкин А.М.', 'Центр Ортопедии и Травматологии', 'г. Сочи, ул. Транспортная 65', '450107060083', '323237500208220', 'www.nalog.gov.ru',
            'http://localhost:5050', 1, 'Штатная конфигурация кассы клиники по 54-ФЗ', datetime('now', 'localtime'), 'Система'
          )
        `);
      }
    });

    if (callback) callback();
  });
}

module.exports = initFiscalSchema;
