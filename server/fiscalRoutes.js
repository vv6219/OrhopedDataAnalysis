const express = require('express');
const router = express.Router();
const db = require('./database');
const fiscalService = require('./fiscalService');
const { logFiscalAudit, LogLevels, EventTypes } = require('./fiscalAuditLogger');

/**
 * GET /api/fiscal/status
 * Returns real-time status of Atol 91F cash register.
 */
router.get('/status', async (req, res) => {
  try {
    const status = await fiscalService.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fiscal/receipt
 * Enqueues a receipt for fiscalization.
 */
router.post('/receipt', async (req, res) => {
  const {
    transaction_id,
    visit_id,
    patient_id,
    patient_contact,
    items,
    payment_type,
    total_amount
  } = req.body;

  if (!total_amount || total_amount <= 0) {
    return res.status(400).json({ error: 'Сумма чека должна быть больше 0' });
  }

  try {
    const result = await fiscalService.enqueueReceipt({
      transactionId: transaction_id,
      visitId: visit_id,
      patientId: patient_id,
      patientContact: patient_contact,
      items: items || [],
      paymentType: payment_type || 'card',
      totalAmount: Number(total_amount)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// FISCAL DEVICE SETTINGS (CRUD with Serilog Audit)
// ============================================================================

/**
 * GET /api/fiscal/settings
 * Retrieves all fiscal settings profiles.
 */
router.get('/settings', (req, res) => {
  db.all('SELECT * FROM fiscal_device_settings ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * GET /api/fiscal/settings/:id
 * Retrieves a single settings profile.
 */
router.get('/settings/:id', (req, res) => {
  db.get('SELECT * FROM fiscal_device_settings WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Профиль настроек не найден' });
    res.json(row);
  });
});

/**
 * POST /api/fiscal/settings
 * Creates a new fiscal settings profile.
 */
router.post('/settings', async (req, res) => {
  const {
    profile_name,
    port = 'COM3',
    baud_rate = 115200,
    device_model = 'АТОЛ 91Ф',
    is_mock_mode = 1,
    single_consumer_queue = 1,
    execution_timeout_seconds = 35,
    fn_number = '9960440301984210',
    kkt_reg_number = '0004928103049182',
    default_tax_type = 6,
    tax_regime_name = 'Без НДС (пп. 2 п. 2 ст. 149 НК РФ — медицинские услуги)',
    payment_subject_type = 4,
    payment_method_type = 4,
    default_shift_number = 14,
    base_fiscal_document_number = 1041,
    external_daemon_url = 'http://localhost:5050',
    org_name = 'ИЧП Добрушкин А.М.',
    clinic_subname = 'Центр Ортопедии и Травматологии',
    org_address = 'г. Сочи, ул. Транспортная 65',
    org_inn = '450107060083',
    org_ogrnip = '323237500208220',
    fns_site = 'www.nalog.gov.ru',
    is_active = 0,
    notes = '',
    updated_by = 'Администратор'
  } = req.body;

  if (!profile_name || !profile_name.trim()) {
    return res.status(400).json({ error: 'Название профиля обязательно' });
  }

  const taxNum = Number(default_tax_type);
  if (isNaN(taxNum) || taxNum < 0 || taxNum > 99) {
    return res.status(400).json({ error: 'Код ставки НДС должен быть целым числом от 0 до 99' });
  }
  const cleanTaxType = Math.floor(taxNum);

  try {
    if (Number(is_active) === 1) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE fiscal_device_settings SET is_active = 0', (err) => err ? reject(err) : resolve());
      });
    }

    const sql = `
      INSERT INTO fiscal_device_settings (
        profile_name, port, baud_rate, device_model, is_mock_mode, single_consumer_queue,
        execution_timeout_seconds, fn_number, kkt_reg_number, default_tax_type, tax_regime_name,
        payment_subject_type, payment_method_type, default_shift_number, base_fiscal_document_number,
        external_daemon_url, org_name, clinic_subname, org_address, org_inn, org_ogrnip, fns_site,
        is_active, notes, updated_at, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), ?)
    `;

    db.run(sql, [
      profile_name.trim(),
      port,
      Number(baud_rate) || 115200,
      device_model,
      is_mock_mode ? 1 : 0,
      single_consumer_queue ? 1 : 0,
      Number(execution_timeout_seconds) || 35,
      fn_number,
      kkt_reg_number,
      cleanTaxType,
      tax_regime_name,
      Number(payment_subject_type) || 4,
      Number(payment_method_type) || 4,
      Number(default_shift_number) || 14,
      Number(base_fiscal_document_number) || 1041,
      external_daemon_url,
      org_name,
      clinic_subname,
      org_address,
      org_inn,
      org_ogrnip,
      fns_site,
      is_active ? 1 : 0,
      notes || '',
      updated_by || 'Администратор'
    ], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const createdId = this.lastID;

      // Serilog audit logging
      logFiscalAudit({
        level: LogLevels.INFO,
        message: `Создан новый профиль настроек ККТ: "${profile_name}" [ID: ${createdId}]`,
        eventType: EventTypes.SETTINGS_CREATED,
        devicePort: port,
        properties: {
          profileId: createdId,
          profileName: profile_name,
          port,
          baudRate: baud_rate,
          isMockMode: Boolean(is_mock_mode),
          isActive: Boolean(is_active),
          createdUser: updated_by
        }
      });

      if (is_active) {
        fiscalService.refreshFromDb();
      }

      res.status(201).json({ id: createdId, message: 'Профиль успешно создан' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/fiscal/settings/:id
 * Updates an existing fiscal settings profile with full field diff in Serilog audit log.
 */
router.put('/settings/:id', (req, res) => {
  const profileId = Number(req.params.id);

  db.get('SELECT * FROM fiscal_device_settings WHERE id = ?', [profileId], async (err, oldRow) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!oldRow) return res.status(404).json({ error: 'Профиль настроек не найден' });

    const newValues = {
      profile_name: req.body.profile_name !== undefined ? req.body.profile_name.trim() : oldRow.profile_name,
      port: req.body.port !== undefined ? req.body.port : oldRow.port,
      baud_rate: req.body.baud_rate !== undefined ? Number(req.body.baud_rate) : oldRow.baud_rate,
      device_model: req.body.device_model !== undefined ? req.body.device_model : oldRow.device_model,
      is_mock_mode: req.body.is_mock_mode !== undefined ? (req.body.is_mock_mode ? 1 : 0) : oldRow.is_mock_mode,
      single_consumer_queue: req.body.single_consumer_queue !== undefined ? (req.body.single_consumer_queue ? 1 : 0) : oldRow.single_consumer_queue,
      execution_timeout_seconds: req.body.execution_timeout_seconds !== undefined ? Number(req.body.execution_timeout_seconds) : oldRow.execution_timeout_seconds,
      fn_number: req.body.fn_number !== undefined ? req.body.fn_number : oldRow.fn_number,
      kkt_reg_number: req.body.kkt_reg_number !== undefined ? req.body.kkt_reg_number : oldRow.kkt_reg_number,
      default_tax_type: req.body.default_tax_type !== undefined ? Number(req.body.default_tax_type) : oldRow.default_tax_type,
      tax_regime_name: req.body.tax_regime_name !== undefined ? req.body.tax_regime_name : oldRow.tax_regime_name,
      payment_subject_type: req.body.payment_subject_type !== undefined ? Number(req.body.payment_subject_type) : oldRow.payment_subject_type,
      payment_method_type: req.body.payment_method_type !== undefined ? Number(req.body.payment_method_type) : oldRow.payment_method_type,
      default_shift_number: req.body.default_shift_number !== undefined ? Number(req.body.default_shift_number) : oldRow.default_shift_number,
      base_fiscal_document_number: req.body.base_fiscal_document_number !== undefined ? Number(req.body.base_fiscal_document_number) : oldRow.base_fiscal_document_number,
      external_daemon_url: req.body.external_daemon_url !== undefined ? req.body.external_daemon_url : oldRow.external_daemon_url,
      org_name: req.body.org_name !== undefined ? req.body.org_name : oldRow.org_name,
      clinic_subname: req.body.clinic_subname !== undefined ? req.body.clinic_subname : oldRow.clinic_subname,
      org_address: req.body.org_address !== undefined ? req.body.org_address : oldRow.org_address,
      org_inn: req.body.org_inn !== undefined ? req.body.org_inn : oldRow.org_inn,
      org_ogrnip: req.body.org_ogrnip !== undefined ? req.body.org_ogrnip : oldRow.org_ogrnip,
      fns_site: req.body.fns_site !== undefined ? req.body.fns_site : oldRow.fns_site,
      is_active: req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : oldRow.is_active,
      notes: req.body.notes !== undefined ? req.body.notes : oldRow.notes,
      updated_by: req.body.updated_by || 'Администратор'
    };

    if (newValues.default_tax_type !== undefined) {
      const taxNum = Number(newValues.default_tax_type);
      if (isNaN(taxNum) || taxNum < 0 || taxNum > 99) {
        return res.status(400).json({ error: 'Код ставки НДС должен быть целым числом от 0 до 99' });
      }
      newValues.default_tax_type = Math.floor(taxNum);
    }

    // Calculate diff for audit
    const changedFields = [];
    const diff = {};
    for (const key of Object.keys(newValues)) {
      if (key !== 'updated_by' && String(oldRow[key]) !== String(newValues[key])) {
        changedFields.push(key);
        diff[key] = { old: oldRow[key], new: newValues[key] };
      }
    }

    try {
      if (newValues.is_active === 1 && oldRow.is_active !== 1) {
        await new Promise((resolve, reject) => {
          db.run('UPDATE fiscal_device_settings SET is_active = 0', (err) => err ? reject(err) : resolve());
        });
      }

      const updateSql = `
        UPDATE fiscal_device_settings SET
          profile_name = ?, port = ?, baud_rate = ?, device_model = ?,
          is_mock_mode = ?, single_consumer_queue = ?, execution_timeout_seconds = ?,
          fn_number = ?, kkt_reg_number = ?, default_tax_type = ?, tax_regime_name = ?,
          payment_subject_type = ?, payment_method_type = ?, default_shift_number = ?,
          base_fiscal_document_number = ?, external_daemon_url = ?,
          org_name = ?, clinic_subname = ?, org_address = ?, org_inn = ?, org_ogrnip = ?, fns_site = ?,
          is_active = ?, notes = ?, updated_at = datetime('now', 'localtime'), updated_by = ?
        WHERE id = ?
      `;

      db.run(updateSql, [
        newValues.profile_name,
        newValues.port,
        newValues.baud_rate,
        newValues.device_model,
        newValues.is_mock_mode,
        newValues.single_consumer_queue,
        newValues.execution_timeout_seconds,
        newValues.fn_number,
        newValues.kkt_reg_number,
        newValues.default_tax_type,
        newValues.tax_regime_name,
        newValues.payment_subject_type,
        newValues.payment_method_type,
        newValues.default_shift_number,
        newValues.base_fiscal_document_number,
        newValues.external_daemon_url,
        newValues.org_name,
        newValues.clinic_subname,
        newValues.org_address,
        newValues.org_inn,
        newValues.org_ogrnip,
        newValues.fns_site,
        newValues.is_active,
        newValues.notes,
        newValues.updated_by,
        profileId
      ], async function (updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });

        // Serilog audit logging
        const logLevel = (diff.is_mock_mode || diff.port) ? LogLevels.WARN : LogLevels.INFO;
        logFiscalAudit({
          level: logLevel,
          message: `Изменение параметров ККТ [${newValues.profile_name}]: ${changedFields.length > 0 ? changedFields.join(', ') : 'без изменений'}`,
          eventType: EventTypes.SETTINGS_UPDATED,
          devicePort: newValues.port,
          properties: {
            profileId,
            profileName: newValues.profile_name,
            changedCount: changedFields.length,
            changedFields,
            diff,
            updatedBy: newValues.updated_by
          }
        });

        // Live refresh in fiscalService instance
        await fiscalService.refreshFromDb();

        res.json({
          success: true,
          message: 'Параметры успешно обновлены',
          changedFields,
          profile: newValues
        });
      });
    } catch (err2) {
      res.status(500).json({ error: err2.message });
    }
  });
});

/**
 * POST /api/fiscal/settings/:id/activate
 * Sets the specified profile as active and refreshes the service.
 */
router.post('/settings/:id/activate', (req, res) => {
  const profileId = Number(req.params.id);

  db.get('SELECT * FROM fiscal_device_settings WHERE id = ?', [profileId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Профиль настроек не найден' });

    db.serialize(() => {
      db.run('UPDATE fiscal_device_settings SET is_active = 0');
      db.run(
        `UPDATE fiscal_device_settings 
         SET is_active = 1, updated_at = datetime('now', 'localtime'), updated_by = ? 
         WHERE id = ?`,
        [req.body.updated_by || 'Администратор', profileId],
        async function (actErr) {
          if (actErr) return res.status(500).json({ error: actErr.message });

          logFiscalAudit({
            level: LogLevels.INFO,
            message: `Активирован профиль параметров ККТ: "${row.profile_name}" (${row.port}, mock=${row.is_mock_mode})`,
            eventType: EventTypes.SETTINGS_ACTIVATED,
            devicePort: row.port,
            properties: {
              profileId,
              profileName: row.profile_name,
              activatedBy: req.body.updated_by || 'Администратор'
            }
          });

          await fiscalService.refreshFromDb();

          res.json({
            success: true,
            message: `Профиль "${row.profile_name}" активирован`
          });
        }
      );
    });
  });
});

/**
 * DELETE /api/fiscal/settings/:id
 * Deletes a settings profile (cannot delete active profile).
 */
router.delete('/settings/:id', (req, res) => {
  const profileId = Number(req.params.id);

  db.get('SELECT * FROM fiscal_device_settings WHERE id = ?', [profileId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Профиль настроек не найден' });

    if (row.is_active === 1) {
      return res.status(400).json({ error: 'Нельзя удалить активный профиль настроек. Сначала активируйте другой профиль.' });
    }

    db.run('DELETE FROM fiscal_device_settings WHERE id = ?', [profileId], function (delErr) {
      if (delErr) return res.status(500).json({ error: delErr.message });

      logFiscalAudit({
        level: LogLevels.WARN,
        message: `Удален профиль параметров ККТ: "${row.profile_name}" [ID: ${profileId}]`,
        eventType: EventTypes.SETTINGS_DELETED,
        devicePort: row.port,
        properties: {
          profileId,
          profileName: row.profile_name,
          deletedBy: req.body.deleted_by || 'Администратор'
        }
      });

      res.json({ success: true, message: `Профиль "${row.profile_name}" удален` });
    });
  });
});

/**
 * GET /api/fiscal/audit-logs
 * Retrieves structured Serilog audit logs from SQLite table 'fiscal_audit_logs'.
 */
router.get('/audit-logs', (req, res) => {
  const { limit = 50, receipt_id, level, event_type } = req.query;
  let query = 'SELECT * FROM fiscal_audit_logs WHERE 1=1';
  const params = [];

  if (receipt_id) {
    query += ' AND receipt_id = ?';
    params.push(receipt_id);
  }
  if (level) {
    query += ' AND level = ?';
    params.push(level);
  }
  if (event_type) {
    query += ' AND event_type = ?';
    params.push(event_type);
  }

  query += ' ORDER BY id DESC LIMIT ?';
  params.push(Number(limit) || 50);

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse properties_json safely for convenience
    const parsed = rows.map(r => {
      let props = null;
      if (r.properties_json) {
        try {
          props = JSON.parse(r.properties_json);
        } catch (_) {
          props = { raw: r.properties_json };
        }
      }
      return {
        ...r,
        properties: props
      };
    });
    res.json(parsed);
  });
});

/**
 * GET /api/fiscal/receipts
 * Retrieves list of fiscal receipts.
 */
router.get('/receipts', (req, res) => {
  const { limit = 50 } = req.query;
  db.all(
    `SELECT * FROM fiscal_receipts ORDER BY id DESC LIMIT ?`,
    [Number(limit) || 50],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/**
 * GET /api/fiscal/receipt/:id
 * Retrieves specific fiscal receipt.
 */
router.get('/receipt/:id', (req, res) => {
  db.get('SELECT * FROM fiscal_receipts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Чек не найден' });
    res.json(row);
  });
});

/**
 * POST /api/fiscal/repeat-print
 * Retries printing of a fiscal receipt after paper refilled.
 */
router.post('/repeat-print', async (req, res) => {
  const { receipt_id } = req.body;
  if (!receipt_id) return res.status(400).json({ error: 'Не указан receipt_id' });

  try {
    const result = await fiscalService.repeatPrint(receipt_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// [TEST_DAEMON] TEST & MOCK DATA WIZARD ENDPOINTS
// ============================================================================
const {
  createFiscalDaemonData,
  purgeFiscalDaemonData,
  runFiscalTestWizard,
  getFiscalDaemonStatus
} = require('./fiscalDaemonTestData');

/**
 * GET /api/fiscal/test-data/status
 * Returns count of test receipts and recent records
 */
router.get('/test-data/status', async (req, res) => {
  try {
    const status = await getFiscalDaemonStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fiscal/test-data/create
 * Seeds isolated [TEST_DAEMON] fiscal receipts and Serilog audit records
 */
router.post('/test-data/create', async (req, res) => {
  try {
    const result = await createFiscalDaemonData();
    res.json({
      success: true,
      message: `Сгенерировано ${result.createdCount} тестовых фискальных чеков [TEST_DAEMON] и журнал аудита Serilog`,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fiscal/test-data/remove
 * Removes all [TEST_DAEMON] fiscal records
 */
router.post('/test-data/remove', async (req, res) => {
  try {
    const result = await purgeFiscalDaemonData();
    res.json({
      success: true,
      message: `Удалено ${result.purgedReceipts} тестовых чеков и ${result.purgedAuditLogs} записей аудита [TEST_DAEMON]`,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fiscal/test-data/run-wizard
 * Runs the live 5-scenario fiscal testing suite
 */
router.post('/test-data/run-wizard', async (req, res) => {
  try {
    const result = await runFiscalTestWizard();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fiscal/test-data/export
 * Exports [TEST_DAEMON] data in JSON or CSV
 */
router.get('/test-data/export', async (req, res) => {
  const { format = 'json' } = req.query;
  try {
    const status = await getFiscalDaemonStatus();
    if (format === 'csv') {
      const rows = status.recentTestReceipts || [];
      const headers = ['id', 'patient_contact', 'payment_type', 'total_amount', 'fiscal_document_number', 'fiscal_sign', 'shift_number', 'status', 'created_at'];
      let csv = headers.join(';') + '\n';
      rows.forEach(r => {
        csv += `${r.id};"${r.patient_contact || ''}";${r.payment_type};${r.total_amount};${r.fiscal_document_number || ''};${r.fiscal_sign || ''};${r.shift_number || ''};${r.status};${r.created_at}\n`;
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="fiscal_test_daemon_export.csv"');
      return res.send(csv);
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
