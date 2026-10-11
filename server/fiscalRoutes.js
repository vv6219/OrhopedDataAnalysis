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
    // Parse properties_json for convenience
    const parsed = rows.map(r => ({
      ...r,
      properties: r.properties_json ? JSON.parse(r.properties_json) : null
    }));
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

module.exports = router;
