/**
 * Inbound Webhook Gateway for MedFlex Integration.
 * Endpoints:
 *  - GET  /api/medflex/webhook/appointment  -> 15-minute SLA Healthcheck (Fast-path HTTP 204)
 *  - POST /api/medflex/webhook/appointment  -> Online booking intake with idempotency guard
 *  - POST /api/medflex/webhook/cancel       -> Patient online cancellation
 */

const express = require('express');
const router = express.Router();
const syncService = require('./medflexSyncService');
const medflexClient = require('./medflexClient');
const { logMedflexAudit, LogLevels, MedflexEventTypes } = require('../medflexAuditLogger');

// Middleware to authenticate MedFlex incoming webhooks
async function authenticateMedflexWebhook(req, res, next) {
  const config = await medflexClient.getConfig();
  if (!config.enabled) {
    return res.status(503).json({ error: 'Интеграция MedFlex временно отключена' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^(Token|Bearer)\s+/i, '').trim();

  // In sandbox mode with default secret, permit demo tokens
  if (config.mode === 'sandbox') {
    return next();
  }

  // Live verification against configured webhook_secret or clinic_token
  if (token && (token === config.webhook_secret || token === config.clinic_token)) {
    return next();
  }

  logMedflexAudit({
    level: LogLevels.WARN,
    message: `Unauthorized webhook attempt from IP ${req.ip || 'unknown'}. Auth header: ${authHeader}`,
    eventType: MedflexEventTypes.WEBHOOK_REJECTED,
    direction: 'Inbound',
    httpStatus: 401,
    endpoint: req.originalUrl,
    skipSuppression: true
  });

  return res.status(401).json({ error: 'Неверный токен авторизации вебхука' });
}

// -----------------------------------------------------------------------------
// 1. GET /api/medflex/webhook/appointment - 15-minute Periodic Healthcheck
// -----------------------------------------------------------------------------
router.get('/appointment', authenticateMedflexWebhook, (req, res) => {
  const startTime = Date.now();

  logMedflexAudit({
    level: LogLevels.INFO,
    message: 'Received 15-minute MedFlex Healthcheck ping. Responded 204 No Content.',
    eventType: MedflexEventTypes.PING_RECEIVED,
    direction: 'Inbound',
    httpStatus: 204,
    durationMs: Date.now() - startTime,
    endpoint: '/api/medflex/webhook/appointment'
  });

  // Strict requirement: return HTTP 204 No Content fast
  res.status(204).end();
});

// -----------------------------------------------------------------------------
// 2. POST /api/medflex/webhook/appointment - Online Booking Webhook
// -----------------------------------------------------------------------------
router.post('/appointment', authenticateMedflexWebhook, async (req, res) => {
  const config = await medflexClient.getConfig();

  // Check Sandbox direction: in 'response_only' sandbox, inbound live bookings are ignored
  if (config.mode === 'sandbox' && config.sandbox_direction === 'response_only') {
    return res.status(200).json({
      status: 'ignored_in_sandbox',
      message: 'Inbound live bookings are ignored in Response-Only sandbox mode'
    });
  }

  try {
    const result = await syncService.processIncomingBooking(req.body);

    // MedFlex specification expects status_code: 204 with claim_id
    res.status(204).json({
      status_code: 204,
      claim_id: result.claim_id,
      appointment_id: result.appointmentId,
      is_duplicate: result.isDuplicate || false
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      status_code: statusCode,
      error: err.message
    });
  }
});

// -----------------------------------------------------------------------------
// 3. POST /api/medflex/webhook/cancel - Online Cancellation Webhook
// -----------------------------------------------------------------------------
router.post('/cancel', authenticateMedflexWebhook, async (req, res) => {
  try {
    const result = await syncService.processIncomingCancel(req.body);
    res.status(204).json({
      status_code: 204,
      appointment_id: result.appointmentId
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      status_code: statusCode,
      error: err.message
    });
  }
});

module.exports = router;
