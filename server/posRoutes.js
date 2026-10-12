const express = require('express');
const router = express.Router();
const db = require('./database');
const { posService, inspectPortDevice } = require('./posService');
const { logPosAudit, PosLogLevels, PosEventTypes } = require('./posAuditLogger');
const { exec } = require('child_process');

// ============================================================================
// REAL-TIME STATUS & DIAGNOSTICS
// ============================================================================

/**
 * GET /api/pos/status (and alias /health)
 * Returns real-time status of Alfa-Bank Acquiring POS Terminal.
 */
router.get(['/status', '/health'], async (req, res) => {
  try {
    const status = await posService.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/test-host
 * Executes diagnostic host ping and key verification with Alfa-Bank processing (Command 05 / 26).
 */
router.post('/test-host', async (req, res) => {
  try {
    const result = await posService.testHost();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/hardware-inspect
 * Inspects physical port/device in Windows PnP
 */
router.get('/hardware-inspect', async (req, res) => {
  const port = req.query.port || posService.port || 'COM4';
  try {
    const info = await inspectPortDevice(port);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/hardware-ports
 * Returns list of physical serial COM ports in Windows
 */
router.get('/hardware-ports', (req, res) => {
  if (process.platform !== 'win32') {
    return res.json([
      { port: 'COM1', name: 'COM1 (Serial Port)', isReady: true },
      { port: 'COM4', name: 'COM4 (Alfa POS)', isReady: true }
    ]);
  }

  const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_PnPEntity | Where-Object { $_.Name -match '\\(COM\\d+\\)' } | Select-Object Name, DeviceID | ConvertTo-Json -Compress"`;
  exec(psCmd, { timeout: 3500 }, (err, stdout) => {
    if (err || !stdout) {
      return res.json([
        { port: 'COM1', name: 'COM1 (Системный порт)' },
        { port: 'COM4', name: 'COM4 (Эквайринг Альфа-Банк)' }
      ]);
    }
    try {
      const parsed = JSON.parse(stdout.trim());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const list = arr.map(item => {
        const match = (item.Name || '').match(/\((COM\d+)\)/);
        const portName = match ? match[1] : '';
        return {
          port: portName,
          name: item.Name,
          deviceId: item.DeviceID
        };
      }).filter(p => p.port);
      res.json(list.length > 0 ? list : [{ port: 'COM4', name: 'COM4' }]);
    } catch (e) {
      res.json([{ port: 'COM4', name: 'COM4 (По умолчанию)' }]);
    }
  });
});

// ============================================================================
// TRANSACTIONAL FINANCIAL OPERATIONS
// ============================================================================

/**
 * POST /api/pos/pay
 * Executes card authorization on terminal (or mock simulation).
 */
router.post('/pay', async (req, res) => {
  const {
    transaction_uuid,
    transactionUuid,
    amount,
    patient_name,
    patientName,
    patient_contact,
    patientContact,
    scenario
  } = req.body;

  const txUuid = transactionUuid || transaction_uuid || ('tx_' + Date.now());
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Сумма платежа должна быть больше 0' });
  }

  try {
    const result = await posService.processPayment({
      transactionUuid: txUuid,
      amount: numAmount,
      patientName: patientName || patient_name,
      patientContact: patientContact || patient_contact,
      scenario
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/reversal
 * Reverses/cancels an authorized card transaction (Reversal / Void).
 */
router.post('/reversal', async (req, res) => {
  const {
    transaction_uuid,
    transactionUuid,
    bank_rrn,
    bankRrn,
    amount
  } = req.body;

  const rrn = bankRrn || bank_rrn;
  const txUuid = transactionUuid || transaction_uuid;

  if (!rrn) {
    return res.status(400).json({ error: 'Параметр bankRrn (RRN) обязателен для отмены' });
  }

  try {
    const result = await posService.processReversal({
      transactionUuid: txUuid,
      bankRrn: rrn,
      amount: amount ? Number(amount) : null
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/settlement
 * Closes shift totals on POS terminal (Сверка итогов дня).
 */
router.post('/settlement', async (req, res) => {
  const { fiscal_shift_id, fiscalShiftId, fiscal_card_amount, fiscalCardAmount } = req.body;
  try {
    const result = await posService.closeSettlement({
      fiscalShiftId: fiscalShiftId || fiscal_shift_id || null,
      fiscalCardAmount: Number(fiscalCardAmount || fiscal_card_amount || 0)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/transactions
 * Returns list of card transactions with filtering and pagination.
 */
router.get('/transactions', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  const search = req.query.search ? `%${req.query.search}%` : null;
  const status = req.query.status || null;
  const operationType = req.query.operation_type || null;

  let sql = 'SELECT * FROM pos_transactions WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (transaction_uuid LIKE ? OR rrn LIKE ? OR auth_code LIKE ? OR masked_pan LIKE ?)';
    params.push(search, search, search, search);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (operationType) {
    sql += ' AND operation_type = ?';
    params.push(operationType);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * GET /api/pos/transactions/:id
 */
router.get('/transactions/:id', (req, res) => {
  db.get('SELECT * FROM pos_transactions WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Транзакция не найдена' });
    res.json(row);
  });
});

/**
 * GET /api/pos/settlements
 * Returns list of all POS settlements.
 */
router.get('/settlements', (req, res) => {
  db.all('SELECT * FROM pos_settlements ORDER BY id DESC LIMIT 50', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ============================================================================
// SETTINGS PROFILES (CRUD with Serilog Audit)
// ============================================================================

/**
 * GET /api/pos/settings
 * Retrieves all POS terminal settings profiles.
 */
router.get('/settings', (req, res) => {
  db.all('SELECT * FROM pos_terminal_settings ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * GET /api/pos/settings/active
 * Retrieves the currently active POS profile.
 */
router.get('/settings/active', (req, res) => {
  db.get('SELECT * FROM pos_terminal_settings WHERE is_active = 1 LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Активный профиль не найден' });
    res.json(row);
  });
});

/**
 * GET /api/pos/settings/:id
 */
router.get('/settings/:id', (req, res) => {
  db.get('SELECT * FROM pos_terminal_settings WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Профиль не найден' });
    res.json(row);
  });
});

/**
 * POST /api/pos/settings
 * Creates a new POS terminal settings profile.
 */
router.post('/settings', async (req, res) => {
  const {
    profile_name,
    is_mock_mode = 1,
    driver_type = 'Arcus-2',
    connection_type = 'COM',
    port = 'COM4',
    baud_rate = 115200,
    ip_address = '192.168.1.150',
    ip_port = 8888,
    terminal_id = 'ALFA_770192',
    merchant_id = 'MERCH_884102',
    bank_name = 'АО «АЛЬФА-БАНК»',
    currency_code = '643',
    execution_timeout_seconds = 60,
    driver_executable_path = 'C:\\Arcus2\\pos.exe',
    enable_sbp_qr = 1,
    mock_scenario = 'success',
    mock_delay_seconds = 2,
    is_active = 0,
    notes = '',
    updated_by = 'Администратор'
  } = req.body;

  if (!profile_name || !profile_name.trim()) {
    return res.status(400).json({ error: 'Название профиля обязательно' });
  }

  try {
    if (Number(is_active) === 1) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE pos_terminal_settings SET is_active = 0', (err) => err ? reject(err) : resolve());
      });
    }

    const sql = `
      INSERT INTO pos_terminal_settings (
        profile_name, is_mock_mode, driver_type, connection_type, port, baud_rate,
        ip_address, ip_port, terminal_id, merchant_id, bank_name, currency_code,
        execution_timeout_seconds, driver_executable_path, enable_sbp_qr, mock_scenario,
        mock_delay_seconds, is_active, notes, updated_at, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)
    `;

    db.run(sql, [
      profile_name.trim(),
      is_mock_mode ? 1 : 0,
      driver_type,
      connection_type,
      port,
      Number(baud_rate) || 115200,
      ip_address,
      Number(ip_port) || 8888,
      terminal_id,
      merchant_id,
      bank_name,
      currency_code,
      Number(execution_timeout_seconds) || 60,
      driver_executable_path,
      enable_sbp_qr ? 1 : 0,
      mock_scenario,
      Number(mock_delay_seconds) || 2,
      is_active ? 1 : 0,
      notes,
      updated_by
    ], async function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const newId = this.lastID;

      logPosAudit({
        level: PosLogLevels.INFO,
        message: `Создан новый профиль настроек эквайринга: «${profile_name}» (ID: ${newId})`,
        eventType: PosEventTypes.SETTINGS_CREATED,
        terminalId: terminal_id,
        properties: { profileId: newId, isMockMode: Boolean(is_mock_mode) }
      });

      await posService.refreshFromDb();
      res.json({ success: true, id: newId, message: 'Профиль успешно создан' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/settings/:id
 * Updates an existing POS settings profile.
 */
router.put('/settings/:id', async (req, res) => {
  const id = Number(req.params.id);
  const {
    profile_name,
    is_mock_mode,
    driver_type,
    connection_type,
    port,
    baud_rate,
    ip_address,
    ip_port,
    terminal_id,
    merchant_id,
    bank_name,
    currency_code,
    execution_timeout_seconds,
    driver_executable_path,
    enable_sbp_qr,
    mock_scenario,
    mock_delay_seconds,
    is_active,
    notes,
    updated_by = 'Администратор'
  } = req.body;

  try {
    if (Number(is_active) === 1) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE pos_terminal_settings SET is_active = 0 WHERE id != ?', [id], (err) => err ? reject(err) : resolve());
      });
    }

    const sql = `
      UPDATE pos_terminal_settings SET
        profile_name = COALESCE(?, profile_name),
        is_mock_mode = COALESCE(?, is_mock_mode),
        driver_type = COALESCE(?, driver_type),
        connection_type = COALESCE(?, connection_type),
        port = COALESCE(?, port),
        baud_rate = COALESCE(?, baud_rate),
        ip_address = COALESCE(?, ip_address),
        ip_port = COALESCE(?, ip_port),
        terminal_id = COALESCE(?, terminal_id),
        merchant_id = COALESCE(?, merchant_id),
        bank_name = COALESCE(?, bank_name),
        currency_code = COALESCE(?, currency_code),
        execution_timeout_seconds = COALESCE(?, execution_timeout_seconds),
        driver_executable_path = COALESCE(?, driver_executable_path),
        enable_sbp_qr = COALESCE(?, enable_sbp_qr),
        mock_scenario = COALESCE(?, mock_scenario),
        mock_delay_seconds = COALESCE(?, mock_delay_seconds),
        is_active = COALESCE(?, is_active),
        notes = COALESCE(?, notes),
        updated_at = datetime('now', 'localtime'),
        updated_by = ?
      WHERE id = ?
    `;

    db.run(sql, [
      profile_name ? profile_name.trim() : null,
      is_mock_mode !== undefined ? (is_mock_mode ? 1 : 0) : null,
      driver_type || null,
      connection_type || null,
      port || null,
      baud_rate ? Number(baud_rate) : null,
      ip_address || null,
      ip_port ? Number(ip_port) : null,
      terminal_id || null,
      merchant_id || null,
      bank_name || null,
      currency_code || null,
      execution_timeout_seconds ? Number(execution_timeout_seconds) : null,
      driver_executable_path || null,
      enable_sbp_qr !== undefined ? (enable_sbp_qr ? 1 : 0) : null,
      mock_scenario || null,
      mock_delay_seconds ? Number(mock_delay_seconds) : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      notes !== undefined ? notes : null,
      updated_by,
      id
    ], async function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Профиль не найден' });

      logPosAudit({
        level: PosLogLevels.INFO,
        message: `Обновлен профиль настроек эквайринга ID: ${id} (${profile_name || 'без имени'})`,
        eventType: PosEventTypes.SETTINGS_UPDATED,
        terminalId: terminal_id || 'ALFA_770192',
        properties: { profileId: id }
      });

      await posService.refreshFromDb();
      res.json({ success: true, message: 'Профиль успешно обновлен' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/settings/:id/activate
 * Activates a profile, deactivating all others.
 */
router.post('/settings/:id/activate', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await new Promise((resolve, reject) => {
      db.run('UPDATE pos_terminal_settings SET is_active = 0', (err) => err ? reject(err) : resolve());
    });
    db.run('UPDATE pos_terminal_settings SET is_active = 1, updated_at = datetime("now", "localtime") WHERE id = ?', [id], async function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Профиль не найден' });

      logPosAudit({
        level: PosLogLevels.INFO,
        message: `Активирован профиль настроек эквайринга ID: ${id}`,
        eventType: PosEventTypes.SETTINGS_ACTIVATED,
        properties: { profileId: id }
      });

      await posService.refreshFromDb();
      res.json({ success: true, message: `Профиль ID ${id} активирован` });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/pos/settings/:id
 */
router.delete('/settings/:id', (req, res) => {
  const id = Number(req.params.id);
  db.get('SELECT is_active, profile_name FROM pos_terminal_settings WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Профиль не найден' });
    if (row.is_active === 1) {
      return res.status(400).json({ error: 'Нельзя удалить активный профиль настроек. Сначала активируйте другой профиль.' });
    }

    db.run('DELETE FROM pos_terminal_settings WHERE id = ?', [id], function (delErr) {
      if (delErr) return res.status(500).json({ error: delErr.message });
      logPosAudit({
        level: PosLogLevels.WARN,
        message: `Удален профиль настроек эквайринга: «${row.profile_name}» (ID: ${id})`,
        eventType: PosEventTypes.SETTINGS_DELETED,
        properties: { profileId: id }
      });
      res.json({ success: true, message: 'Профиль удален' });
    });
  });
});
/**
 * POST /api/pos/mode
 * Instant switch between Mock / Emulator and Real Hardware connection across the active profile.
 */
router.post('/mode', async (req, res) => {
  try {
    const { is_mock_mode, updated_by, profile_id } = req.body;
    if (is_mock_mode === undefined) {
      return res.status(400).json({ error: 'Параметр is_mock_mode обязателен' });
    }
    const result = await posService.setMockMode(Boolean(is_mock_mode), updated_by || 'Администратор', profile_id || null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// AUDIT LOGS
// ============================================================================

/**
 * GET /api/pos/audit-logs
 * Retrieves Serilog audit log records for POS terminal.
 */
router.get('/audit-logs', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 300);
  const offset = Number(req.query.offset) || 0;
  const level = req.query.level;
  const eventType = req.query.event_type;

  let sql = 'SELECT * FROM pos_audit_logs WHERE 1=1';
  const params = [];

  if (level) {
    sql += ' AND level = ?';
    params.push(level);
  }
  if (eventType) {
    sql += ' AND event_type = ?';
    params.push(eventType);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
