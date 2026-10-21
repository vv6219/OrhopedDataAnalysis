/**
 * Administration, Diagnostics, and Sandbox Simulator API for MedFlex.
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const medflexClient = require('./medflexClient');
const mockServer = require('./medflexMockServer');
const { circuitBreaker } = require('./medflexCircuitBreaker');
const heartbeatWorker = require('./medflexHeartbeatWorker');
const queueService = require('./medflexQueueService');
const syncService = require('./medflexSyncService');
const { diagnosticEngine, ProblemCodes } = require('./medflexDiagnosticEngine');

// -----------------------------------------------------------------------------
// 1. GET /api/medflex/admin/live-status - Real-time telemetry for Live Status Bar
// -----------------------------------------------------------------------------
router.get('/live-status', async (req, res) => {
  try {
    const config = await medflexClient.getConfig();
    const circuitState = circuitBreaker.getState();
    const queueStats = await queueService.getQueueStats();

    // Check open incidents count
    db.get(
      "SELECT COUNT(*) AS openCount FROM medflex_sync_incidents WHERE status = 'open'",
      [],
      (err, incRow) => {
        res.json({
          success: true,
          mode: config.mode, // 'production', 'sandbox', 'disabled'
          sandboxDirection: config.sandbox_direction, // 'dual', 'request_only', 'response_only'
          enabled: config.enabled,
          circuitState: circuitState.state, // 'healthy', 'degraded', 'offline', 'recovering'
          isOnline: circuitBreaker.isOnline(),
          lastLatencyMs: circuitState.lastLatencyMs,
          lastPingAt: circuitState.lastPingAt,
          lastSuccessAt: circuitState.lastSuccessAt,
          lastFailureAt: circuitState.lastFailureAt,
          lastError: circuitState.lastError,
          queueStats,
          openIncidentsCount: incRow ? incRow.openCount || 0 : 0,
          simulatedFailureActive: mockServer.forceConnectionFailure,
          pingIntervalSec: config.ping_interval_sec || 60,
          scheduleSyncIntervalMin: config.schedule_sync_interval_min || 30
        });
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. POST /api/medflex/admin/ping-test - On-demand latency probe
// -----------------------------------------------------------------------------
router.post('/ping-test', async (req, res) => {
  try {
    const probeRes = await heartbeatWorker.probe();
    res.json({
      success: true,
      probeResult: probeRes,
      circuitState: circuitBreaker.getState()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. GET /api/medflex/admin/settings & PUT /api/medflex/admin/settings
// -----------------------------------------------------------------------------
router.get('/settings', async (req, res) => {
  try {
    const config = await medflexClient.getConfig();
    res.json({ success: true, settings: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// POST /api/medflex/admin/toggle-active - Activate / Inactivate MedFlex service
// -----------------------------------------------------------------------------
router.post('/toggle-active', (req, res) => {
  const { enabled } = req.body;
  const isEnabled = enabled === true || enabled === 'true' || enabled === 1 || enabled === '1';
  const val = isEnabled ? 'true' : 'false';

  db.run(
    'INSERT OR REPLACE INTO calculation_parameters (param_name, param_value) VALUES (?, ?)',
    ['medflex_enabled', val],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true,
        enabled: isEnabled,
        message: `Сервис MedFlex ${isEnabled ? 'успешно активирован' : 'деактивирован'}`
      });
    }
  );
});

router.put('/settings', (req, res) => {
  const {
    enabled,
    mode,
    sandbox_direction,
    clinic_token,
    webhook_secret,
    filial_id,
    filial_name,
    api_url,
    partner_api_url,
    ping_interval_sec,
    schedule_sync_interval_min,
    auto_confirm
  } = req.body;

  const updates = [];
  if (enabled !== undefined) updates.push(['medflex_enabled', String(enabled)]);
  if (mode !== undefined) updates.push(['medflex_mode', String(mode)]);
  if (sandbox_direction !== undefined) updates.push(['medflex_sandbox_direction', String(sandbox_direction)]);
  if (clinic_token !== undefined) updates.push(['medflex_clinic_token', String(clinic_token)]);
  if (webhook_secret !== undefined) updates.push(['medflex_webhook_secret', String(webhook_secret)]);
  if (filial_id !== undefined) updates.push(['medflex_filial_id', String(filial_id)]);
  if (filial_name !== undefined) updates.push(['medflex_filial_name', String(filial_name)]);
  if (api_url !== undefined) updates.push(['medflex_api_url', String(api_url)]);
  if (partner_api_url !== undefined) updates.push(['medflex_partner_api_url', String(partner_api_url)]);
  if (ping_interval_sec !== undefined) updates.push(['medflex_ping_interval_sec', String(ping_interval_sec)]);
  if (schedule_sync_interval_min !== undefined) updates.push(['medflex_schedule_sync_interval_min', String(schedule_sync_interval_min)]);
  if (auto_confirm !== undefined) updates.push(['medflex_auto_confirm', String(auto_confirm)]);

  if (updates.length === 0) {
    return res.json({ success: true, message: 'Нет изменений для сохранения' });
  }

  db.serialize(() => {
    const stmt = db.prepare('INSERT OR REPLACE INTO calculation_parameters (param_name, param_value) VALUES (?, ?)');
    updates.forEach(([name, val]) => stmt.run(name, val));
    stmt.finalize((err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      // Dynamically update background heartbeat and sync intervals
      heartbeatWorker.updateIntervals({
        pingIntervalSec: ping_interval_sec,
        scheduleSyncIntervalMin: schedule_sync_interval_min
      });

      res.json({ success: true, message: 'Настройки MedFlex успешно сохранены' });
    });
  });
});

// -----------------------------------------------------------------------------
// 4. GET /api/medflex/admin/doctors - Doctor mapping directory
// -----------------------------------------------------------------------------
router.get('/doctors', async (req, res) => {
  try {
    // 1. Fetch clinic staff
    const staffQuery = `
      SELECT id, full_name, role, specialization, contact_phone, email,
             medflex_doctor_id, medflex_sync_enabled
      FROM staff
      WHERE role LIKE '%врач%' OR role LIKE '%ортопед%' OR medflex_doctor_id IS NOT NULL
      ORDER BY id ASC
    `;

    db.all(staffQuery, [], async (err, staffDocs) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      // 2. Fetch MedFlex doctors catalog (live or mock)
      let medflexDoctors = [];
      try {
        const mfCatalog = await medflexClient.getDoctors({ limit: 50 });
        medflexDoctors = mfCatalog.results || [];
      } catch (e) {
        console.warn('[MedflexAdminRoutes] Fetch MedFlex doctors warning:', e.message);
      }

      res.json({
        success: true,
        staffDoctors: staffDocs || [],
        medflexCatalog: medflexDoctors
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4.1. PUT /api/medflex/admin/doctors/:id/mapping
router.put('/doctors/:id/mapping', (req, res) => {
  const { id } = req.params;
  const { medflex_doctor_id, medflex_sync_enabled } = req.body;

  db.run(
    "UPDATE staff SET medflex_doctor_id = ?, medflex_sync_enabled = ? WHERE id = ?",
    [medflex_doctor_id || null, medflex_sync_enabled !== undefined ? (medflex_sync_enabled ? 1 : 0) : 1, id],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: `Сопоставление для врача #${id} успешно сохранено` });
    }
  );
});

// -----------------------------------------------------------------------------
// 5. Offline Queue: GET /queue & POST /queue/flush
// -----------------------------------------------------------------------------
router.get('/queue', (req, res) => {
  db.all(
    "SELECT * FROM medflex_offline_queue ORDER BY id DESC LIMIT 50",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, queue: rows || [] });
    }
  );
});

router.post('/queue/flush', async (req, res) => {
  try {
    const drainRes = await queueService.drainQueue();
    res.json({ success: true, result: drainRes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. POST /api/medflex/admin/sync-schedule - Manual bulk 30-day schedule export
// -----------------------------------------------------------------------------
router.post('/sync-schedule', async (req, res) => {
  try {
    const syncRes = await syncService.syncFullSchedule(30);
    res.json({ success: true, result: syncRes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6.1. POST /api/medflex/admin/pull-appointments - Pull & reconcile current appointments
// -----------------------------------------------------------------------------
router.post('/pull-appointments', async (req, res) => {
  try {
    const { date } = req.body || {};
    const result = await syncService.pullCurrentAppointments(date);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. [TEST_DAEMON] SIMULATORS
// -----------------------------------------------------------------------------

// 7.1. Simulate incoming booking from ProDoctorov
router.post('/simulate/booking', async (req, res) => {
  try {
    const mockWebhook = mockServer.generateSimulatedBookingWebhook(req.body);
    const result = await syncService.processIncomingBooking(mockWebhook);
    res.json({
      success: true,
      message: 'Тестовая онлайн-запись с «ПроДокторов» успешно сгенерирована и обработана в календаре!',
      webhook: mockWebhook,
      result
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode
    });
  }
});

// 7.1b. Simulate incoming cancellation from ProDoctorov / MedFlex
router.post('/simulate/cancel', async (req, res) => {
  try {
    const { claim_id, appointment_id } = req.body || {};
    let targetClaimId = claim_id;

    if (!targetClaimId && appointment_id) {
      const app = await new Promise((resolve) => {
        db.get("SELECT medflex_claim_id FROM appointments WHERE id = ?", [appointment_id], (err, row) => resolve(row));
      });
      targetClaimId = app?.medflex_claim_id;
    }

    if (!targetClaimId) {
      // Pick latest active MedFlex appointment
      const activeApp = await new Promise((resolve) => {
        db.get(
          "SELECT id, medflex_claim_id FROM appointments WHERE medflex_claim_id IS NOT NULL AND status NOT IN ('cancelled', 'no_show') ORDER BY id DESC LIMIT 1",
          [],
          (err, row) => resolve(row)
        );
      });

      if (!activeApp) {
        return res.status(400).json({
          success: false,
          error: 'В календаре нет активных онлайн-записей MedFlex для отмены. Создайте тестовую бронь кнопкой «[TEST] Бронь с ПроДокторов».'
        });
      }
      targetClaimId = activeApp.medflex_claim_id;
    }

    const cancelPayload = {
      claim_id: targetClaimId,
      reason: 'Пациент отменил приём через онлайн-агрегатор ПроДокторов'
    };

    const result = await syncService.processIncomingCancel(cancelPayload);
    res.json({
      success: true,
      message: `Онлайн-запись успешно отменена со стороны агрегатора (Claim: ${targetClaimId})! Слот в расписании освобождён.`,
      result,
      claim_id: targetClaimId
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// 7.2. Toggle simulated connection failure (drop/restore connection)
router.post('/simulate/connection-drop', (req, res) => {
  const { force } = req.body || {};
  if (force !== undefined) {
    mockServer.forceConnectionFailure = Boolean(force);
  } else {
    mockServer.forceConnectionFailure = !mockServer.forceConnectionFailure;
  }

  if (mockServer.forceConnectionFailure) {
    circuitBreaker.recordFailure(new Error('Simulated network drop [TEST_DAEMON]'), 3000);
  } else {
    circuitBreaker.recordSuccess(42);
    queueService.drainQueue();
  }

  res.json({
    success: true,
    simulatedFailureActive: mockServer.forceConnectionFailure,
    circuitState: circuitBreaker.getState(),
    message: mockServer.forceConnectionFailure
      ? '⚠️ Искусственный обрыв связи активирован! Circuit Breaker переведен в OFFLINE.'
      : '✅ Связь с MedFlex восстановлена! Circuit Breaker стабилизирован, запущена отправка оффлайн-очереди.'
  });
});

// 7.3. Simulate Double-Booking Collision
router.post('/simulate/collision', async (req, res) => {
  try {
    // Pick first existing appointment
    const existing = await new Promise((resolve) => {
      db.get(
        "SELECT a.*, s.medflex_doctor_id FROM appointments a JOIN staff s ON a.doctor_id = s.id WHERE a.status NOT IN ('cancelled', 'no_show') ORDER BY a.id DESC LIMIT 1",
        [],
        (err, row) => resolve(row)
      );
    });

    if (!existing) {
      return res.status(400).json({ success: false, error: 'В календаре нет активных записей для эмуляции коллизии' });
    }

    // Try booking exact same slot
    const mockWebhook = {
      doctor: { id: existing.medflex_doctor_id || 10452, lpu_id: 1, specialty: 'Травматолог-ортопед' },
      appointment: {
        dt_start: `${existing.appointment_date}T${existing.start_time}:00`,
        dt_end: `${existing.appointment_date}T${existing.end_time}:00`,
        comment: '[ТЕСТ КОЛЛИЗИИ] Попытка записи на уже занятое время',
        price: 3500
      },
      client: {
        first_name: 'Виктор',
        last_name: 'Коллизиев',
        mobile_phone: '+79189998877',
        birthday: '1984-05-10'
      },
      appointment_source: 'ПроДокторов (Симуляция)'
    };

    try {
      await syncService.processIncomingBooking(mockWebhook);
      res.json({ success: false, message: 'Коллизия не сработала (слот не был занят)' });
    } catch (collisionErr) {
      res.json({
        success: true,
        collisionCaught: true,
        message: 'Коллизия двойной записи успешно перехвачена! Сформирован инцидент с RCA-анализом.',
        error: collisionErr.message
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
