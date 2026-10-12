const sqlite3 = require('sqlite3').verbose();

/**
 * Initializes tables, triggers, indexes, and initial seed profiles for 
 * Alfa-Bank Acquiring POS Terminal (Arcus-2 / INPAS) and Serilog Audit Logging.
 * Guarantees strict relational data integrity (ACID) with appointments,
 * operation_transactions, and fiscal_shifts.
 * 
 * @param {sqlite3.Database} db 
 * @param {Function} [callback] 
 */
function initPosSchema(db, callback) {
  db.serialize(() => {
    // 1. Table for Acquiring Terminal & Profile Operational Settings
    db.run(`CREATE TABLE IF NOT EXISTS pos_terminal_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name TEXT NOT NULL UNIQUE DEFAULT 'default',
      is_mock_mode INTEGER NOT NULL DEFAULT 1,          -- 1 = Mock Emulation, 0 = Real Physical POS
      driver_type TEXT NOT NULL DEFAULT 'Arcus-2',      -- 'Arcus-2', 'INPAS', 'UCS', 'Mock'
      connection_type TEXT NOT NULL DEFAULT 'COM',      -- 'COM', 'TCP_IP', 'USB_HID'
      port TEXT NOT NULL DEFAULT 'COM4',                -- Serial COM port (e.g. COM4)
      baud_rate INTEGER NOT NULL DEFAULT 115200,        -- Serial baud rate
      ip_address TEXT DEFAULT '192.168.1.150',          -- Terminal IP for Ethernet connection
      ip_port INTEGER DEFAULT 8888,                     -- Terminal TCP port
      terminal_id TEXT NOT NULL DEFAULT 'ALFA_770192',  -- Terminal ID (TID) in Alfa-Bank processing
      merchant_id TEXT NOT NULL DEFAULT 'MERCH_884102', -- Merchant ID (MID)
      bank_name TEXT NOT NULL DEFAULT 'АО «АЛЬФА-БАНК»',
      currency_code TEXT NOT NULL DEFAULT '643',        -- 643 = RUB
      execution_timeout_seconds INTEGER NOT NULL DEFAULT 60 CHECK(execution_timeout_seconds BETWEEN 15 AND 180),
      driver_executable_path TEXT DEFAULT 'C:\\Arcus2\\pos.exe',
      enable_sbp_qr INTEGER NOT NULL DEFAULT 1,         -- SBP dynamic QR display on PIN-pad
      mock_scenario TEXT DEFAULT 'success',             -- 'success', 'insufficient_funds', 'cancelled', 'timeout'
      mock_delay_seconds INTEGER DEFAULT 2,             -- Simulated delay in seconds
      is_active INTEGER NOT NULL DEFAULT 1,             -- 1 = Active Profile
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_by TEXT DEFAULT 'Администратор'
    )`);

    // 2. Trigger: Single Active Profile constraint
    // When activating one profile, all other profiles are automatically set to is_active = 0
    db.run(`
      CREATE TRIGGER IF NOT EXISTS trg_pos_single_active_profile
      AFTER UPDATE OF is_active ON pos_terminal_settings
      WHEN NEW.is_active = 1
      BEGIN
        UPDATE pos_terminal_settings
        SET is_active = 0
        WHERE id != NEW.id;
      END
    `);

    // 3. Table for Acquiring Shift Settlements (Сверка итогов эквайринга)
    db.run(`CREATE TABLE IF NOT EXISTS pos_settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscal_shift_id INTEGER REFERENCES fiscal_shifts(id) ON DELETE SET NULL,
      terminal_id TEXT NOT NULL,
      merchant_id TEXT,
      settlement_sequence_number INTEGER DEFAULT 1,
      
      -- Финансовые итоги по банковскому отчету
      total_transactions_count INTEGER NOT NULL DEFAULT 0,
      total_authorized_amount REAL NOT NULL DEFAULT 0.0 CHECK(total_authorized_amount >= 0),
      
      -- Контрольная фискальная сверка
      fiscal_card_amount REAL NOT NULL DEFAULT 0.0 CHECK(fiscal_card_amount >= 0),
      discrepancy_amount REAL NOT NULL DEFAULT 0.0, -- total_authorized_amount - fiscal_card_amount
      
      status TEXT NOT NULL DEFAULT 'matched',       -- 'matched', 'discrepancy', 'failed'
      settlement_slip_text TEXT,                    -- Полный текст слип-чека сверки итогов
      discrepancy_reason TEXT,
      settled_at TEXT DEFAULT (datetime('now', 'localtime')),
      settled_by TEXT DEFAULT 'Администратор'
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_settlements_shift ON pos_settlements(fiscal_shift_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_settlements_date ON pos_settlements(settled_at)`);

    // 4. Table for POS Terminal Card Transactions (Журнал эквайринга)
    db.run(`CREATE TABLE IF NOT EXISTS pos_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_uuid TEXT NOT NULL UNIQUE,        -- Ключ идемпотентности из React/Frontend
      operation_transaction_id INTEGER REFERENCES operation_transactions(id) ON DELETE SET NULL,
      appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
      patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
      pos_settlement_id INTEGER REFERENCES pos_settlements(id) ON DELETE SET NULL,
      original_pos_transaction_id INTEGER REFERENCES pos_transactions(id) ON DELETE RESTRICT, -- Связка для Reversal
      
      operation_type TEXT NOT NULL DEFAULT 'pay',   -- 'pay', 'reversal', 'refund'
      amount REAL NOT NULL CHECK(amount > 0),       -- Сумма в рублях (строго > 0)
      currency_code TEXT DEFAULT '643',
      
      -- Банковские реквизиты авторизации
      terminal_id TEXT NOT NULL,
      merchant_id TEXT,
      rrn TEXT,                                     -- Retrieval Reference Number (12 символов)
      auth_code TEXT,                               -- Код авторизации процессинга
      card_type TEXT DEFAULT 'MIR',                 -- 'MIR', 'VISA', 'MASTERCARD', 'SBP_QR'
      masked_pan TEXT DEFAULT '4276********1094',
      response_code TEXT DEFAULT '00',              -- '00' = Одобрено, '51' = Недостаточно средств и т.д.
      
      -- Жизненный цикл операции
      status TEXT NOT NULL DEFAULT 'pending',       -- 'pending', 'authorized', 'declined', 'completed', 'reversed', 'bank_success_fiscal_failed'
      is_mock INTEGER NOT NULL DEFAULT 1,           -- 1 = Эмуляция, 0 = Физический терминал
      slip_text TEXT,                               -- Полный текст банковского слип-чека
      error_message TEXT,
      
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      authorized_at TEXT,
      completed_at TEXT
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_tx_uuid ON pos_transactions(transaction_uuid)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_tx_rrn ON pos_transactions(terminal_id, rrn)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_tx_op_tx ON pos_transactions(operation_transaction_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_tx_status ON pos_transactions(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_tx_settlement ON pos_transactions(pos_settlement_id)`);

    // 5. Table for Serilog-compatible POS Audit Logs
    db.run(`CREATE TABLE IF NOT EXISTS pos_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime')),
      level TEXT NOT NULL,                          -- 'Information', 'Warning', 'Error', 'Fatal'
      event_type TEXT NOT NULL,                     -- 'POS_CONNECT', 'AUTH_START', 'AUTH_SUCCESS', 'AUTH_DECLINE', 'REVERSAL', 'SETTLEMENT', 'SETTINGS_UPDATED'
      terminal_id TEXT DEFAULT 'ALFA_770192',
      transaction_uuid TEXT,
      amount REAL,
      rrn TEXT,
      auth_code TEXT,
      message TEXT NOT NULL,
      device_port TEXT DEFAULT 'COM4',
      duration_ms INTEGER DEFAULT 0,
      properties_json TEXT,                         -- Структурированный контекст Serilog
      exception_details TEXT
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_audit_ts ON pos_audit_logs(timestamp)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_audit_event ON pos_audit_logs(event_type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pos_audit_tx ON pos_audit_logs(transaction_uuid)`);

    // 6. Seed default POS Terminal Settings Profile if table is empty
    db.get('SELECT COUNT(*) as cnt FROM pos_terminal_settings', (err, row) => {
      if (!err && row && row.cnt === 0) {
        db.run(`
          INSERT INTO pos_terminal_settings (
            profile_name, is_mock_mode, driver_type, connection_type, port, baud_rate,
            ip_address, ip_port, terminal_id, merchant_id, bank_name, currency_code,
            execution_timeout_seconds, driver_executable_path, enable_sbp_qr, mock_scenario,
            mock_delay_seconds, is_active, notes, updated_at, updated_by
          ) VALUES (
            'Основной терминал эквайринга (Альфа-Банк)', 1, 'Arcus-2', 'COM', 'COM4', 115200,
            '192.168.1.150', 8888, 'ALFA_770192', 'MERCH_884102', 'АО «АЛЬФА-БАНК»', '643',
            60, 'C:\\Arcus2\\pos.exe', 1, 'success', 2, 1,
            'Штатный терминал на стойке регистратора клиники. Режим: Эмуляция (Mock). Протокол: Arcus-2.',
            datetime('now', 'localtime'), 'Система'
          )
        `);

        // Seed initial sample POS audit log
        db.run(`
          INSERT INTO pos_audit_logs (
            level, event_type, terminal_id, message, properties_json
          ) VALUES (
            'Information', 'POS_CONNECT', 'ALFA_770192',
            'Инициализирован сервис эквайринга «АО «АЛЬФА-БАНК»» для терминала ALFA_770192 (Режим: Эмуляция Mock)',
            '{"isMockMode":true,"driver":"Arcus-2","port":"COM4","baudRate":115200}'
          )
        `);
      }
    });

    if (callback) callback();
  });
}

module.exports = initPosSchema;
