/**
 * Persistent Offline Queue Service for MedFlex Operations (FIFO with Backoff Retry).
 * Guarantees that any outbound slot update, cancellation, or schedule push that fails
 * due to network outage is safely preserved and automatically flushed upon reconnection.
 */

const db = require('../database');
const medflexClient = require('./medflexClient');
const { diagnosticEngine, ProblemCodes } = require('./medflexDiagnosticEngine');
const { logMedflexAudit, LogLevels, MedflexEventTypes } = require('../medflexAuditLogger');

class MedflexQueueService {
  constructor() {
    this.isDraining = false;
    this.retryDelaysSec = [5, 15, 45, 120, 300, 600, 1800, 3600]; // Exponential backoff steps
  }

  /**
   * Enqueue outbound operation for deferred processing
   */
  async enqueue({ operationType, claimId = null, doctorId = 0, payload = {} }) {
    const payloadJson = JSON.stringify(payload);
    const nextRetryAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO medflex_offline_queue (
          operation_type, claim_id, doctor_id, payload_json, attempt_count,
          max_attempts, next_retry_at, status
        ) VALUES (?, ?, ?, ?, 0, 10, ?, 'pending')
      `;

      db.run(sql, [operationType, claimId, doctorId, payloadJson, nextRetryAt], function (err) {
        if (err) {
          console.error('[MedflexQueueService] Enqueue error:', err.message);
          return reject(err);
        }

        const queueId = this.lastID;

        logMedflexAudit({
          level: LogLevels.WARN,
          message: `Enqueued deferred MedFlex operation #${queueId} (${operationType}) for doctor ${doctorId}`,
          eventType: MedflexEventTypes.ENQUEUED_OFFLINE,
          direction: 'Internal',
          claimId,
          doctorId,
          properties: {
            QueueId: queueId,
            OperationType: operationType,
            Payload: payload
          }
        });

        resolve({ queueId, operationType, status: 'pending' });
      });
    });
  }

  /**
   * Drain pending items in FIFO order
   */
  async drainQueue() {
    if (this.isDraining) return;
    this.isDraining = true;

    try {
      const nowIso = new Date().toISOString();
      const items = await new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM medflex_offline_queue 
           WHERE status IN ('pending', 'processing') AND next_retry_at <= ? 
           ORDER BY id ASC LIMIT 20`,
          [nowIso],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
          }
        );
      });

      if (items.length === 0) {
        this.isDraining = false;
        return { processed: 0, successful: 0, failed: 0 };
      }

      console.log(`[MedflexQueueService] Draining ${items.length} deferred queue items...`);
      let successCount = 0;
      let failCount = 0;

      for (const item of items) {
        let payload = {};
        try {
          payload = JSON.parse(item.payload_json || '{}');
        } catch (e) {
          payload = {};
        }

        try {
          // Execute specific operation
          if (item.operation_type === 'occupy_slot' || item.operation_type === 'release_slot') {
            await medflexClient.pushOccupiedSlot({
              filialId: payload.filial_id || 1,
              doctorId: item.doctor_id,
              date: payload.date,
              timeStart: payload.time_start,
              timeEnd: payload.time_end,
              isFree: item.operation_type === 'release_slot'
            });
          } else if (item.operation_type === 'cancel_appointment') {
            await medflexClient.cancelOnlineAppointment(item.claim_id);
          } else if (item.operation_type === 'full_schedule') {
            await medflexClient.sendSchedule(payload);
          }

          // Mark completed
          await new Promise((resolve) => {
            db.run(
              "UPDATE medflex_offline_queue SET status = 'completed', last_error = NULL WHERE id = ?",
              [item.id],
              resolve
            );
          });

          successCount++;

          logMedflexAudit({
            level: LogLevels.INFO,
            message: `Successfully flushed deferred MedFlex queue item #${item.id} (${item.operation_type})`,
            eventType: MedflexEventTypes.QUEUE_DRAINED,
            direction: 'Outbound',
            claimId: item.claim_id,
            doctorId: item.doctor_id,
            properties: { QueueId: item.id, OperationType: item.operation_type }
          });
        } catch (execErr) {
          failCount++;
          const newAttemptCount = (item.attempt_count || 0) + 1;
          const delaySec = this.retryDelaysSec[Math.min(newAttemptCount - 1, this.retryDelaysSec.length - 1)];
          const nextDate = new Date(Date.now() + delaySec * 1000).toISOString();
          const isExhausted = newAttemptCount >= item.max_attempts;
          const nextStatus = isExhausted ? 'failed' : 'pending';

          await new Promise((resolve) => {
            db.run(
              `UPDATE medflex_offline_queue 
               SET attempt_count = ?, next_retry_at = ?, last_error = ?, status = ? 
               WHERE id = ?`,
              [newAttemptCount, nextDate, execErr.message, nextStatus, item.id],
              resolve
            );
          });

          if (isExhausted) {
            // Register critical incident
            await diagnosticEngine.registerIncident({
              problemCode: ProblemCodes.QUEUE_MAX_ATTEMPTS,
              claimId: item.claim_id,
              doctorId: item.doctor_id,
              technicalContext: {
                queueId: item.id,
                operationType: item.operation_type,
                attempts: newAttemptCount,
                lastError: execErr.message
              },
              customDetails: `Задача #${item.id} (${item.operation_type}) не смогла выполниться после ${newAttemptCount} попыток: ${execErr.message}`
            });
          }
        }
      }

      this.isDraining = false;
      return { processed: items.length, successful: successCount, failed: failCount };
    } catch (drainErr) {
      this.isDraining = false;
      console.error('[MedflexQueueService] Drain queue exception:', drainErr.message);
      return { error: drainErr.message };
    }
  }

  /**
   * Get summary statistics of the queue
   */
  async getQueueStats() {
    return new Promise((resolve) => {
      db.get(
        `SELECT 
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
         FROM medflex_offline_queue`,
        [],
        (err, row) => {
          resolve({
            total: row ? row.total || 0 : 0,
            pending: row ? row.pending || 0 : 0,
            processing: row ? row.processing || 0 : 0,
            failed: row ? row.failed || 0 : 0,
            completed: row ? row.completed || 0 : 0
          });
        }
      );
    });
  }

  async getStats() {
    return this.getQueueStats();
  }
}

const queueService = new MedflexQueueService();
// Inject into heartbeat worker
const heartbeatWorker = require('./medflexHeartbeatWorker');
heartbeatWorker.setQueueService(queueService);

module.exports = queueService;
