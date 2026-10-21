/**
 * MedFlex Bidirectional Sync Service.
 * Implements:
 *  - Multilayer Idempotency & Deduplication Guard (UUID + SHA256 Fingerprint)
 *  - Collision detection & Doctor mapping validation
 *  - Patient matching (by phone & birthdate) and auto-creation
 *  - Appointment creation, status synchronization, and cancellation
 *  - Real-time slot toggle with automatic offline queue fallback
 *  - Full 30-day schedule window builder
 */

const crypto = require('crypto');
function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}
const db = require('../database');
const medflexClient = require('./medflexClient');
const queueService = require('./medflexQueueService');
const { diagnosticEngine, ProblemCodes } = require('./medflexDiagnosticEngine');
const { logMedflexAudit, LogLevels, MedflexEventTypes } = require('../medflexAuditLogger');

// 10-minute sliding window cache for cryptographic deduplication
const recentBookingFingerprints = new Map();
const FINGERPRINT_TTL_MS = 10 * 60 * 1000;

function cleanFingerprintCache() {
  const now = Date.now();
  for (const [hash, timestamp] of recentBookingFingerprints.entries()) {
    if (now - timestamp > FINGERPRINT_TTL_MS) {
      recentBookingFingerprints.delete(hash);
    }
  }
}
setInterval(cleanFingerprintCache, 60000).unref();

function formatPhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '+7' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '+7' + digits;
  }
  return raw.trim();
}

class MedflexSyncService {
  /**
   * 1. Push slot occupancy state (used in appointment creation/edit/cancel hooks)
   */
  async pushSlotStatus({ doctorId, appointmentDate, startTime, endTime, isFree = false }) {
    return new Promise((resolve) => {
      // Find doctor's medflex_doctor_id
      db.get(
        "SELECT id, full_name, medflex_doctor_id, medflex_sync_enabled FROM staff WHERE id = ?",
        [doctorId],
        async (err, doc) => {
          if (err || !doc || !doc.medflex_doctor_id || doc.medflex_sync_enabled === 0) {
            // Doctor not synced with MedFlex, ignore
            return resolve({ skipped: true, reason: 'Doctor not mapped to MedFlex' });
          }

          try {
            const res = await medflexClient.pushOccupiedSlot({
              doctorId: doc.medflex_doctor_id,
              date: appointmentDate,
              timeStart: startTime,
              timeEnd: endTime,
              isFree
            });
            resolve({ success: true, result: res });
          } catch (pushErr) {
            console.warn('[MedflexSyncService] Push slot failed, saving to offline queue:', pushErr.message);

            // Enqueue for background retry
            const qRes = await queueService.enqueue({
              operationType: isFree ? 'release_slot' : 'occupy_slot',
              doctorId: doc.medflex_doctor_id,
              payload: {
                date: appointmentDate,
                time_start: startTime,
                time_end: endTime
              }
            });

            resolve({ enqueued: true, queueId: qRes.queueId });
          }
        }
      );
    });
  }

  /**
   * 2. Cancel online appointment on MedFlex side
   */
  async cancelMedflexAppointment(claimId) {
    if (!claimId) return { skipped: true };

    try {
      const res = await medflexClient.cancelOnlineAppointment(claimId);
      return { success: true, result: res };
    } catch (cancelErr) {
      console.warn('[MedflexSyncService] Cancel MedFlex appointment failed, saving to offline queue:', cancelErr.message);

      const qRes = await queueService.enqueue({
        operationType: 'cancel_appointment',
        claimId,
        doctorId: 0,
        payload: { claimId }
      });

      return { enqueued: true, queueId: qRes.queueId };
    }
  }

  /**
   * 3. Process incoming online booking from aggregators (ПроДокторов, СберЗдоровье, etc.)
   */
  async processIncomingBooking(payload) {
    const { doctor, appointment, client, appointment_source } = payload || {};

    if (!doctor || !doctor.id || !appointment || !appointment.dt_start || !client || !client.mobile_phone) {
      await diagnosticEngine.registerIncident({
        problemCode: ProblemCodes.PAYLOAD_VALIDATION,
        technicalContext: { payload },
        customDetails: 'Отсутствуют обязательные поля: doctor.id, appointment.dt_start или client.mobile_phone'
      });
      const err = new Error('Некорректный формат данных в вебхуке онлайн-записи');
      err.statusCode = 400;
      throw err;
    }

    const medflexDoctorId = Number(doctor.id);
    const cleanPhone = formatPhone(client.mobile_phone);
    const dtStart = new Date(appointment.dt_start);
    const appointmentDate = dtStart.toISOString().slice(0, 10);
    const startTime = dtStart.toTimeString().slice(0, 5); // HH:MM

    let endTime = '';
    let durationMinutes = 30;
    if (appointment.dt_end) {
      const dtEnd = new Date(appointment.dt_end);
      endTime = dtEnd.toTimeString().slice(0, 5);
      durationMinutes = Math.max(15, Math.round((dtEnd - dtStart) / (1000 * 60)));
    } else {
      const [h, m] = startTime.split(':').map(Number);
      const totalM = h * 60 + m + 30;
      endTime = `${String(Math.floor(totalM / 60)).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;
    }

    // -------------------------------------------------------------
    // DEDUPLICATION LAYER 1 & 2: UUID & Cryptographic Fingerprint
    // -------------------------------------------------------------
    const claimUuid = payload.claim_id || uuidv4();

    // Check if claim_id already exists in database
    const existingBooking = await new Promise((resolve) => {
      db.get(
        "SELECT id, status, appointment_date, start_time FROM appointments WHERE medflex_claim_id = ?",
        [claimUuid],
        (err, row) => resolve(row)
      );
    });

    if (existingBooking) {
      logMedflexAudit({
        level: LogLevels.WARN,
        message: `Duplicate webhook received for existing claim ${claimUuid}. Returning 204 idempotently.`,
        eventType: MedflexEventTypes.DUPLICATE_SUPPRESSED,
        direction: 'Inbound',
        claimId: claimUuid,
        appointmentId: existingBooking.id,
        doctorId: medflexDoctorId,
        properties: { IsDuplicate: true, ClaimId: claimUuid }
      });

      return {
        isDuplicate: true,
        statusCode: 204,
        claim_id: claimUuid,
        appointmentId: existingBooking.id
      };
    }

    // Cryptographic Fingerprint: SHA256(doctorId + date + startTime + cleanPhone)
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${medflexDoctorId}|${appointmentDate}|${startTime}|${cleanPhone}`)
      .digest('hex');

    if (recentBookingFingerprints.has(fingerprint)) {
      logMedflexAudit({
        level: LogLevels.WARN,
        message: `Duplicate slot fingerprint detected for phone ${cleanPhone} on ${appointmentDate} ${startTime}.`,
        eventType: MedflexEventTypes.BOOKING_CONFLICT,
        direction: 'Inbound',
        claimId: claimUuid,
        doctorId: medflexDoctorId,
        properties: { Fingerprint: fingerprint }
      });

      return {
        isDuplicate: true,
        statusCode: 204,
        claim_id: claimUuid,
        message: 'Заявка с данным временем и пациентом уже была принята ранее'
      };
    }
    recentBookingFingerprints.set(fingerprint, Date.now());

    // -------------------------------------------------------------
    // DOCTOR MAPPING CHECK
    // -------------------------------------------------------------
    const staffDoctor = await new Promise((resolve) => {
      db.get(
        "SELECT id, full_name, specialization FROM staff WHERE medflex_doctor_id = ? AND status != 'deleted'",
        [medflexDoctorId],
        (err, row) => resolve(row)
      );
    });

    if (!staffDoctor) {
      await diagnosticEngine.registerIncident({
        problemCode: ProblemCodes.DOCTOR_UNMAPPED,
        claimId: claimUuid,
        patientPhone: cleanPhone,
        patientName: `${client.last_name || ''} ${client.first_name || ''}`.trim(),
        technicalContext: { medflexDoctorId, appointmentDate, startTime, payload },
        customDetails: `Внешний ID доктора ${medflexDoctorId} не привязан в МИС`
      });

      const err = new Error(`Врач MedFlex ID ${medflexDoctorId} не сопоставлен с сотрудниками МИС`);
      err.statusCode = 400;
      throw err;
    }

    const localDoctorId = staffDoctor.id;

    // -------------------------------------------------------------
    // COLLISION CHECK (Double-booking protection)
    // -------------------------------------------------------------
    const collision = await new Promise((resolve) => {
      const sql = `
        SELECT id, start_time, end_time, status, urgency_level 
        FROM appointments 
        WHERE appointment_date = ? AND doctor_id = ? AND status NOT IN ('cancelled', 'no_show')
          AND start_time < ? AND end_time > ?
        LIMIT 1
      `;
      db.get(sql, [appointmentDate, localDoctorId, endTime, startTime], (err, row) => resolve(row));
    });

    if (collision) {
      await diagnosticEngine.registerIncident({
        problemCode: ProblemCodes.COLLISION_DOUBLE_BOOKING,
        claimId: claimUuid,
        appointmentId: collision.id,
        doctorId: localDoctorId,
        patientPhone: cleanPhone,
        patientName: `${client.last_name || ''} ${client.first_name || ''}`.trim(),
        technicalContext: {
          conflictingAppointmentId: collision.id,
          requestedStart: startTime,
          requestedEnd: endTime,
          existingStart: collision.start_time,
          existingEnd: collision.end_time
        },
        customDetails: `Слот ${startTime}-${endTime} пересекается с записью #${collision.id} (${collision.start_time}-${collision.end_time})`
      });

      const err = new Error(
        `Выбранное время приёма (${startTime} - ${endTime}) уже занято в клинике (Запись #${collision.id})`
      );
      err.statusCode = 409;
      throw err;
    }

    // -------------------------------------------------------------
    // PATIENT MATCHING OR QUICK CREATION
    // -------------------------------------------------------------
    const patientFullName = `${client.last_name || ''} ${client.first_name || ''} ${client.second_name || ''}`.trim();
    const patientBdate = client.birthday || '';

    let patientId = await new Promise((resolve) => {
      db.all(
        "SELECT id, full_name, bdate FROM patients WHERE sphone = ? OR phone = ?",
        [cleanPhone, cleanPhone],
        (err, rows) => {
          if (!rows || rows.length === 0) return resolve(null);
          if (rows.length === 1) return resolve(rows[0].id);

          // Multiple patients with same phone: try match by birthdate or last name
          const exact = rows.find(
            (p) =>
              (patientBdate && p.bdate === patientBdate) ||
              (client.last_name && p.full_name && p.full_name.includes(client.last_name))
          );
          resolve(exact ? exact.id : rows[0].id);
        }
      );
    });

    if (!patientId) {
      // Auto-create patient in SQLite
      patientId = await new Promise((resolve, reject) => {
        db.get("SELECT MAX(mednum) AS maxMednum FROM patients", (err, row) => {
          const nextMednum = row && row.maxMednum ? row.maxMednum + 1 : 70001;
          const today = new Date().toISOString().slice(0, 10);

          const insertSql = `
            INSERT INTO patients (
              full_name, surname, name, patron, sphone, phone, bdate, sex_display,
              mednum, rdate, total_visits
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Не указан', ?, ?, 0)
          `;

          db.run(
            insertSql,
            [
              patientFullName,
              client.last_name || '',
              client.first_name || '',
              client.second_name || '',
              cleanPhone,
              cleanPhone,
              patientBdate,
              nextMednum,
              today
            ],
            function (err2) {
              if (err2) return reject(err2);
              resolve(this.lastID);
            }
          );
        });
      });
    }

    // -------------------------------------------------------------
    // CREATE APPOINTMENT
    // -------------------------------------------------------------
    const sourceLabel = appointment_source || 'ПроДокторов';
    const notes = `[Онлайн-запись MedFlex / ${sourceLabel}] ${appointment.comment || ''}`.trim();
    const roomNumber = localDoctorId === 2 ? 'Кабинет №1 (Добрушкин)' : 'Кабинет №2 (Петров)';

    const appointmentId = await new Promise((resolve, reject) => {
      const insertSql = `
        INSERT INTO appointments (
          patient_id, doctor_id, appointment_date, start_time, end_time,
          duration_minutes, room_number, joint_area, urgency_level, status,
          notes, medflex_claim_id, medflex_source, medflex_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'knee', 'routine', 'confirmed', ?, ?, ?, datetime('now', 'localtime'))
      `;

      db.run(
        insertSql,
        [
          patientId,
          localDoctorId,
          appointmentDate,
          startTime,
          endTime,
          durationMinutes,
          roomNumber,
          notes,
          claimUuid,
          sourceLabel
        ],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });

    // -------------------------------------------------------------
    // LOG & NOTIFICATION
    // -------------------------------------------------------------
    logMedflexAudit({
      level: LogLevels.INFO,
      message: `Online appointment #${appointmentId} successfully registered for patient ${patientFullName} (Doctor: ${staffDoctor.full_name}, Source: ${sourceLabel})`,
      eventType: MedflexEventTypes.BOOKING_CREATED,
      direction: 'Inbound',
      claimId: claimUuid,
      appointmentId,
      doctorId: localDoctorId,
      properties: {
        ClaimId: claimUuid,
        AppointmentId: appointmentId,
        PatientId: patientId,
        Slot: `${appointmentDate} ${startTime}-${endTime}`,
        Source: sourceLabel
      }
    });

    // Queue booking confirmation SMS / Telegram notification
    const msgText = `Здравствуйте, ${patientFullName}! Ваша онлайн-запись через ${sourceLabel} в «Центр Ортопедии Добрушкина» подтверждена.\nДата: ${appointmentDate} в ${startTime}, ${roomNumber} (${staffDoctor.full_name}).`;
    db.run(
      `INSERT INTO appointment_notifications (
        appointment_id, recipient_type, recipient_name, recipient_contact,
        channel, chat_id, template_type, message_text, has_inline_buttons, status
      ) VALUES (?, 'patient', ?, ?, 'telegram', ?, 'medflex_booking_confirmed', ?, 1, 'sent')`,
      [appointmentId, patientFullName, cleanPhone, `@online_${claimUuid.slice(0, 8)}`, msgText]
    );

    return {
      success: true,
      statusCode: 204,
      claim_id: claimUuid,
      appointmentId,
      patientId
    };
  }

  /**
   * 4. Process incoming cancellation from MedFlex / aggregator
   */
  async processIncomingCancel(payload) {
    const claimId = payload ? (payload.claim_id || payload.uuid || payload.claim_uuid || payload.appointment?.claim_id || payload.appointment?.uuid) : null;
    if (!claimId) {
      const err = new Error('Не указан обязательный параметр claim_id (или uuid) для отмены');
      err.statusCode = 400;
      throw err;
    }

    const app = await new Promise((resolve) => {
      db.get("SELECT * FROM appointments WHERE medflex_claim_id = ?", [claimId], (err, row) => resolve(row));
    });

    if (!app) {
      await diagnosticEngine.registerIncident({
        problemCode: ProblemCodes.ORPHAN_CANCELLATION,
        claimId,
        technicalContext: { payload },
        customDetails: `Бронь с UUID ${claimId} не найдена в базе МИС`
      });

      return { success: true, statusCode: 204, message: 'Запись не найдена в клинике, отмена принята' };
    }

    const reason = (payload && (payload.reason || payload.cancellation_reason || payload.comment)) || 'Отменено пациентом через ПроДокторов / MedFlex';

    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE appointments SET status = 'cancelled', cancellation_reason = ? WHERE id = ?",
        [reason, app.id],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // Auto-resolve any open incidents related to this claim (e.g. collision or orphan alerts)
    db.run(
      "UPDATE medflex_sync_incidents SET status = 'resolved', resolved_at = datetime('now', 'localtime'), resolved_by = 'MedFlex Webhook Auto-Resolver' WHERE claim_id = ? AND status = 'open'",
      [claimId]
    );

    logMedflexAudit({
      level: LogLevels.INFO,
      message: `Appointment #${app.id} cancelled via MedFlex webhook by patient (Claim: ${claimId})`,
      eventType: MedflexEventTypes.BOOKING_CANCELLED,
      direction: 'Inbound',
      claimId,
      appointmentId: app.id,
      doctorId: app.doctor_id,
      properties: { ClaimId: claimId, AppointmentId: app.id, Reason: reason }
    });

    return { success: true, statusCode: 204, appointmentId: app.id, claimId };
  }

  /**
   * 5. Generate and export 30-day schedule window (send_schedule)
   */
  async syncFullSchedule(daysAhead = 30) {
    const doctors = await new Promise((resolve) => {
      db.all(
        "SELECT id, full_name, medflex_doctor_id FROM staff WHERE medflex_doctor_id IS NOT NULL AND medflex_sync_enabled = 1",
        [],
        (err, rows) => resolve(rows || [])
      );
    });

    if (doctors.length === 0) {
      return { success: false, message: 'Нет врачей с заполненным medflex_doctor_id' };
    }

    const startDate = new Date();
    const endDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    const startIso = startDate.toISOString().slice(0, 10);
    const endIso = endDate.toISOString().slice(0, 10);

    const appointments = await new Promise((resolve) => {
      db.all(
        `SELECT doctor_id, appointment_date, start_time, end_time 
         FROM appointments 
         WHERE appointment_date BETWEEN ? AND ? AND status NOT IN ('cancelled', 'no_show')`,
        [startIso, endIso],
        (err, rows) => resolve(rows || [])
      );
    });

    // Build cells: 09:00 - 19:00 in 30-min increments
    const timeSlots = [];
    for (let h = 9; h < 19; h++) {
      timeSlots.push({
        start: `${String(h).padStart(2, '0')}:00`,
        end: `${String(h).padStart(2, '0')}:30`
      });
      timeSlots.push({
        start: `${String(h).padStart(2, '0')}:30`,
        end: `${String(h + 1).padStart(2, '0')}:00`
      });
    }

    const scheduleData = { 1: {} };

    for (const doc of doctors) {
      const docCells = [];

      for (let d = 0; d < daysAhead; d++) {
        const curDate = new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        for (const slot of timeSlots) {
          const isBusy = appointments.some(
            (a) =>
              a.doctor_id === doc.id &&
              a.appointment_date === curDate &&
              a.start_time < slot.end &&
              a.end_time > slot.start
          );

          docCells.push({
            dt: curDate,
            time_start: slot.start,
            time_end: slot.end,
            free: !isBusy
          });
        }
      }

      scheduleData[1][String(doc.medflex_doctor_id)] = {
        efio: doc.full_name,
        cells: docCells
      };
    }

    const payload = {
      schedule: {
        1: 'Центр Ортопедии Добрушкина, Сочи',
        data: scheduleData
      }
    };

    const res = await medflexClient.sendSchedule(payload);
    return { success: true, result: res, totalDoctors: doctors.length, daysAhead };
  }

  /**
   * 6. Pull and reconcile current appointments from MedFlex
   */
  async pullCurrentAppointments(targetDate) {
    const dateStr = targetDate || new Date().toISOString().slice(0, 10);
    const config = await medflexClient.getConfig();

    logMedflexAudit({
      level: LogLevels.INFO,
      message: `Initiating pull of current appointments from MedFlex for ${dateStr}`,
      eventType: MedflexEventTypes.PULL_APPOINTMENTS_STARTED,
      direction: 'Inbound',
      properties: { TargetDate: dateStr, Mode: config.mode, SandboxDirection: config.sandbox_direction }
    });

    let remoteData;
    try {
      remoteData = await medflexClient.getCurrentAppointments({ date: dateStr });
    } catch (err) {
      logMedflexAudit({
        level: LogLevels.ERROR,
        message: `Failed to pull current appointments from MedFlex: ${err.message}`,
        eventType: MedflexEventTypes.PULL_APPOINTMENTS_FAILED,
        direction: 'Inbound',
        exception: err
      });
      throw err;
    }

    const items = (remoteData && remoteData.results) || [];
    let importedCount = 0;
    let existingCount = 0;
    let collisionCount = 0;
    let errorCount = 0;
    const details = [];

    for (const item of items) {
      try {
        const res = await this.processIncomingBooking(item);
        if (res.isDuplicate) {
          existingCount++;
          details.push({
            claim_id: item.claim_id || res.claim_id,
            status: 'duplicate',
            message: 'Запись уже присутствует в календаре (дубликат отфильтрован)'
          });
        } else {
          importedCount++;
          details.push({
            claim_id: item.claim_id || res.claim_id,
            appointmentId: res.appointmentId,
            status: 'imported',
            message: `Запись успешно импортирована (#${res.appointmentId})`
          });
        }
      } catch (itemErr) {
        if (itemErr.statusCode === 409) {
          collisionCount++;
          details.push({
            claim_id: item.claim_id,
            status: 'collision',
            error: itemErr.message
          });
        } else {
          errorCount++;
          details.push({
            claim_id: item.claim_id,
            status: 'error',
            error: itemErr.message
          });
        }
      }
    }

    logMedflexAudit({
      level: LogLevels.INFO,
      message: `Pull of current appointments finished for ${dateStr}: total=${items.length}, imported=${importedCount}, existing=${existingCount}, collisions=${collisionCount}, errors=${errorCount}`,
      eventType: MedflexEventTypes.PULL_APPOINTMENTS_COMPLETED,
      direction: 'Inbound',
      properties: {
        TargetDate: dateStr,
        Total: items.length,
        Imported: importedCount,
        Existing: existingCount,
        Collisions: collisionCount,
        Errors: errorCount
      }
    });

    return {
      success: true,
      targetDate: dateStr,
      total: items.length,
      importedCount,
      existingCount,
      collisionCount,
      errorCount,
      details
    };
  }
}

module.exports = new MedflexSyncService();
