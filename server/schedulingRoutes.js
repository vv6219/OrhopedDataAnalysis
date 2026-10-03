const express = require('express');
const router = express.Router();
const db = require('./database');

// Helper to calculate end time from start time and duration
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Number(durationMinutes);
  const endHours = Math.floor(totalMinutes / 60);
  const endMins = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// 1. GET /api/scheduling/calendar - Fetch appointments with filter by date/doctor
// -----------------------------------------------------------------------------
router.get('/calendar', (req, res) => {
  const { date, view = 'day', doctorId } = req.query;
  const targetDate = date || new Date().toISOString().slice(0, 10);

  let query = `
    SELECT 
      a.id,
      a.patient_id,
      a.doctor_id,
      a.operation_id,
      a.appointment_date,
      a.start_time,
      a.end_time,
      a.duration_minutes,
      a.room_number,
      a.joint_area,
      a.urgency_level,
      a.status,
      a.arrival_time,
      a.cancellation_reason,
      a.notes,
      a.visit_id,
      a.transaction_id,
      a.created_at,
      p.full_name AS patient_name,
      p.mednum AS patient_mednum,
      p.age AS patient_age,
      p.sphone AS patient_phone,
      p.dms_insurer AS patient_dms,
      s.full_name AS doctor_name,
      s.role AS doctor_role,
      o.name AS operation_name,
      o.price AS operation_price
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN staff s ON a.doctor_id = s.id
    LEFT JOIN operations o ON a.operation_id = o.id
    WHERE 1=1
  `;
  const params = [];

  if (view === 'day') {
    query += ` AND a.appointment_date = ?`;
    params.push(targetDate);
  } else if (view === 'week') {
    // 7 days window starting from targetDate
    query += ` AND a.appointment_date >= ? AND a.appointment_date <= date(?, '+6 day')`;
    params.push(targetDate, targetDate);
  }

  if (doctorId && doctorId !== 'all') {
    query += ` AND a.doctor_id = ?`;
    params.push(Number(doctorId));
  }

  query += ` ORDER BY a.appointment_date ASC, a.start_time ASC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      targetDate,
      count: rows.length,
      appointments: rows
    });
  });
});

// -----------------------------------------------------------------------------
// 2. GET /api/scheduling/summary - Daily KPIs and Occupancy Rate
// -----------------------------------------------------------------------------
router.get('/summary', (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().slice(0, 10);

  const query = `
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status IN ('cancelled', 'no_show') THEN 1 ELSE 0 END) AS cancelled
    FROM appointments
    WHERE appointment_date = ?
  `;

  db.get(query, [targetDate], (err, row) => {
    if (err) {
      console.error('Error fetching scheduling summary:', err);
      return res.status(500).json({ success: false, error: err.message });
    }

    const total = row ? row.total || 0 : 0;
    // Clinic working day: 09:00 - 19:00 = 10 hours * 2 doctors = 20 total hours = 40 half-hour slots
    const maxCapacitySlots = 40;
    const occupancyRate = total > 0 ? Math.min(100, Math.round((total / maxCapacitySlots) * 100)) : 0;

    res.json({
      success: true,
      targetDate,
      summary: {
        total,
        scheduled: row ? row.scheduled || 0 : 0,
        confirmed: row ? row.confirmed || 0 : 0,
        waiting: row ? row.waiting || 0 : 0,
        in_progress: row ? row.in_progress || 0 : 0,
        completed: row ? row.completed || 0 : 0,
        cancelled: row ? row.cancelled || 0 : 0,
        occupancyRate
      }
    });
  });
});

// -----------------------------------------------------------------------------
// 3. GET /api/scheduling/doctors - Active orthopedic doctors & rooms
// -----------------------------------------------------------------------------
router.get('/doctors', (req, res) => {
  const query = `
    SELECT id, full_name, role, specialization, contact_phone, email
    FROM staff
    WHERE role LIKE '%врач%' OR role LIKE '%ортопед%' OR id IN (2, 4)
    ORDER BY id ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    // Enrich with default clinic rooms
    const doctors = rows.map((doc) => ({
      ...doc,
      roomNumber: doc.id === 2 ? 'Кабинет №1 (Добрушкин)' : 'Кабинет №2 (Петров)'
    }));
    res.json({ success: true, doctors });
  });
});

// -----------------------------------------------------------------------------
// 4. GET /api/scheduling/available-slots - Calculate open slots and buffers
// -----------------------------------------------------------------------------
router.get('/available-slots', (req, res) => {
  const { date, doctorId, duration = 30 } = req.query;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const targetDoc = Number(doctorId) || 2;
  const reqDuration = Number(duration);

  // Clinic working hours: 09:00 to 19:00 in 15-minute increments
  const allIntervals = [];
  for (let hour = 9; hour < 19; hour++) {
    for (let min = 0; min < 60; min += 15) {
      allIntervals.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }
  }

  // Get current bookings for that doctor
  const query = `
    SELECT start_time, end_time, duration_minutes, status, urgency_level
    FROM appointments
    WHERE appointment_date = ? AND doctor_id = ? AND status NOT IN ('cancelled', 'no_show')
  `;

  db.all(query, [targetDate, targetDoc], (err, bookings) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    const slots = [];
    for (let i = 0; i < allIntervals.length; i++) {
      const slotStart = allIntervals[i];
      const slotEnd = calculateEndTime(slotStart, reqDuration);

      // Check if slot falls outside clinic hours
      const [endH] = slotEnd.split(':').map(Number);
      if (endH > 19 || (endH === 19 && slotEnd !== '19:00')) {
        continue;
      }

      // Check collision with bookings
      let collision = false;
      let bufferConflict = false;
      let matchedBooking = null;

      for (const b of bookings) {
        // Direct overlap: (slotStart < b.end_time) && (slotEnd > b.start_time)
        if (slotStart < b.end_time && slotEnd > b.start_time) {
          collision = true;
          matchedBooking = b;
          break;
        }
        // 15-minute sterilization buffer after appointment
        const bBufferEnd = calculateEndTime(b.end_time, 15);
        if (slotStart < bBufferEnd && slotEnd > b.end_time) {
          bufferConflict = true;
          break;
        }
      }

      slots.push({
        time: slotStart,
        endTime: slotEnd,
        isAvailable: !collision && !bufferConflict,
        isBuffer: bufferConflict,
        booking: matchedBooking ? { status: matchedBooking.status, urgency: matchedBooking.urgency_level } : null
      });
    }

    res.json({
      success: true,
      targetDate,
      doctorId: targetDoc,
      duration: reqDuration,
      slots
    });
  });
});

// -----------------------------------------------------------------------------
// 5. GET /api/scheduling/patients/search - Fast autocomplete over 61k patients
// -----------------------------------------------------------------------------
router.get('/patients/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ success: true, patients: [] });
  }

  const cleanTerm = q.trim();
  const isNumeric = /^\d+$/.test(cleanTerm);

  let query = '';
  let params = [];

  if (isNumeric) {
    // Search by mednum or phone digits
    query = `
      SELECT id, mednum, full_name, brief_name, sex_display, bdate, age, sphone, email, dms_insurer, total_visits, last_visit_date
      FROM patients
      WHERE mednum = ? OR phone LIKE ? OR sphone LIKE ?
      LIMIT 25
    `;
    params = [Number(cleanTerm), `%${cleanTerm}%`, `%${cleanTerm}%`];
  } else {
    // Search by full_name or brief_name
    query = `
      SELECT id, mednum, full_name, brief_name, sex_display, bdate, age, sphone, email, dms_insurer, total_visits, last_visit_date
      FROM patients
      WHERE full_name LIKE ? OR brief_name LIKE ?
      ORDER BY last_visit_date DESC
      LIMIT 25
    `;
    params = [`%${cleanTerm}%`, `%${cleanTerm}%`];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error searching patients:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, patients: rows });
  });
});

// -----------------------------------------------------------------------------
// 6. POST /api/scheduling/patients/quick-create - Quick patient registration
// -----------------------------------------------------------------------------
router.post('/patients/quick-create', (req, res) => {
  const { full_name, sphone, bdate, age, sex_display } = req.body;

  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ success: false, error: 'Укажите ФИО пациента' });
  }

  // Generate next mednum
  db.get("SELECT MAX(mednum) AS maxMednum FROM patients", (err, row) => {
    const nextMednum = row && row.maxMednum ? row.maxMednum + 1 : 70001;
    const today = new Date().toISOString().slice(0, 10);

    const insertSql = `
      INSERT INTO patients (
        full_name, sphone, phone, bdate, age, sex_display, mednum, rdate, total_visits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    db.run(
      insertSql,
      [full_name.trim(), sphone || '', sphone || '', bdate || '', Number(age) || 0, sex_display || 'Мужской', nextMednum, today],
      function (err2) {
        if (err2) {
          console.error('Error creating quick patient:', err2);
          return res.status(500).json({ success: false, error: err2.message });
        }

        const newPatientId = this.lastID;
        res.json({
          success: true,
          patient: {
            id: newPatientId,
            mednum: nextMednum,
            full_name: full_name.trim(),
            sphone: sphone || '',
            bdate: bdate || '',
            age: Number(age) || 0,
            sex_display: sex_display || 'Мужской',
            total_visits: 0
          }
        });
      }
    );
  });
});

// -----------------------------------------------------------------------------
// 7. POST /api/scheduling/appointments - Create new booking
// -----------------------------------------------------------------------------
router.post('/appointments', (req, res) => {
  const {
    patient_id,
    doctor_id,
    operation_id,
    appointment_date,
    start_time,
    duration_minutes = 30,
    room_number,
    joint_area,
    urgency_level = 'routine',
    notes,
    notification_channel = 'telegram'
  } = req.body;

  if (!patient_id || !doctor_id || !appointment_date || !start_time) {
    return res.status(400).json({
      success: false,
      error: 'Необходимо указать пациента, врача, дату и время приёма'
    });
  }

  const end_time = calculateEndTime(start_time, duration_minutes);
  const targetRoom = room_number || (Number(doctor_id) === 2 ? 'Кабинет №1 (Добрушкин)' : 'Кабинет №2 (Петров)');

  // Check collision for the doctor
  const collisionQuery = `
    SELECT id, start_time, end_time
    FROM appointments
    WHERE appointment_date = ? AND doctor_id = ? AND status NOT IN ('cancelled', 'no_show')
      AND start_time < ? AND end_time > ?
  `;

  db.all(collisionQuery, [appointment_date, doctor_id, end_time, start_time], (err, collisions) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (collisions && collisions.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Выбранное время пересекается с существующей записью (${collisions[0].start_time} - ${collisions[0].end_time})`
      });
    }

    const insertSql = `
      INSERT INTO appointments (
        patient_id, doctor_id, operation_id, appointment_date, start_time, end_time,
        duration_minutes, room_number, joint_area, urgency_level, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `;

    db.run(
      insertSql,
      [
        patient_id, doctor_id, operation_id || null, appointment_date, start_time, end_time,
        duration_minutes, targetRoom, joint_area || 'knee', urgency_level, notes || ''
      ],
      function (err2) {
        if (err2) {
          console.error('Error inserting appointment:', err2);
          return res.status(500).json({ success: false, error: err2.message });
        }

        const appointmentId = this.lastID;

        // Fetch patient and doctor info to build notification
        db.get(
          `SELECT p.full_name AS p_name, p.sphone, s.full_name AS doc_name 
           FROM patients p, staff s 
           WHERE p.id = ? AND s.id = ?`,
          [patient_id, doctor_id],
          (notifErr, info) => {
            if (!notifErr && info) {
              const pName = info.p_name || 'Пациент';
              const docName = info.doc_name || 'Врач ортопед';
              const phone = info.sphone || '+7 (988) 123-45-67';

              let msg = '';
              if (notification_channel === 'telegram') {
                msg = `Здравствуйте, ${pName}! Вы записаны в «Центр Ортопедии Добрушкина» на ${appointment_date} в ${start_time}.\nВрач: ${docName}, ${targetRoom}.\nПожалуйста, подтвердите визит кнопкой ниже.`;
              } else if (notification_channel === 'max') {
                msg = `«Центр Ортопедии Добрушкина»: Электронный талон записи №${appointmentId}.\nПациент: ${pName}.\nПриём: ${appointment_date} в ${start_time}, ${targetRoom} (${docName}). Нажмите для подтверждения визита.`;
              } else {
                msg = `Центр Ортопедии Добрушкина: запись на ${appointment_date} в ${start_time}. Врач: ${docName}. Тел: +7(862)267-00-00.`;
              }

              db.run(
                `INSERT INTO appointment_notifications (
                  appointment_id, recipient_type, recipient_name, recipient_contact, channel, chat_id,
                  template_type, message_text, has_inline_buttons, status
                ) VALUES (?, 'patient', ?, ?, ?, ?, 'booking_confirmation', ?, 1, 'sent')`,
                [appointmentId, pName, phone, notification_channel, `@chat_${appointmentId}`, msg]
              );
            }
          }
        );

        res.json({
          success: true,
          appointmentId,
          message: 'Запись успешно создана и уведомление отправлено'
        });
      }
    );
  });
});

// -----------------------------------------------------------------------------
// 8. PUT /api/scheduling/appointments/:id/status - Update Status & Sync Visits
// -----------------------------------------------------------------------------
router.put('/appointments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, cancellation_reason } = req.body;

  const validStatuses = ['scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Недопустимый статус приёма' });
  }

  // Get current appointment
  db.get("SELECT * FROM appointments WHERE id = ?", [id], (err, app) => {
    if (err || !app) {
      return res.status(404).json({ success: false, error: 'Запись не найдена' });
    }

    let updateSql = `UPDATE appointments SET status = ?`;
    const params = [status];

    // If patient arrived in hall, mark arrival_time
    if (status === 'waiting' && !app.arrival_time) {
      updateSql += `, arrival_time = time('now', 'localtime')`;
    }

    if (status === 'cancelled') {
      updateSql += `, cancellation_reason = ?`;
      params.push(cancellation_reason || 'Отменено пациентом');
    }

    updateSql += ` WHERE id = ?`;
    params.push(id);

    db.run(updateSql, params, function (err2) {
      if (err2) {
        return res.status(500).json({ success: false, error: err2.message });
      }

      // If status changed to completed, sync with patient_visits and patient history
      if (status === 'completed' && !app.visit_id) {
        const visitDate = app.appointment_date;
        const visitTimeS = app.start_time;
        const docn = app.doctor_id;
        const patientId = app.patient_id;
        const remark = `Ортопедический приём. ${app.notes || ''}`.trim();

        // Insert into patient_visits
        db.run(
          `INSERT INTO patient_visits (patient_id, docn, visit_date, visit_time_s, remark, moduser, moddate)
           VALUES (?, ?, ?, ?, ?, 'scheduling_wizard', datetime('now', 'localtime'))`,
          [patientId, docn, visitDate, visitTimeS, remark],
          function (visitErr) {
            if (!visitErr && this.lastID) {
              const newVisitId = this.lastID;
              // Link visit to appointment
              db.run(`UPDATE appointments SET visit_id = ? WHERE id = ?`, [newVisitId, id]);

              // Update patient last_visit_date and total_visits
              db.run(
                `UPDATE patients 
                 SET total_visits = COALESCE(total_visits, 0) + 1, 
                     last_visit_date = ? 
                 WHERE id = ?`,
                [visitDate, patientId]
              );
            }
          }
        );
      }

      res.json({
        success: true,
        message: `Статус записи #${id} обновлён на "${status}"`
      });
    });
  });
});

// -----------------------------------------------------------------------------
// 9. GET /api/scheduling/notifications - Notification delivery log
// -----------------------------------------------------------------------------
router.get('/notifications', (req, res) => {
  const { limit = 50, channel, appointmentId } = req.query;

  let query = `
    SELECT 
      n.id,
      n.appointment_id,
      n.recipient_type,
      n.recipient_name,
      n.recipient_contact,
      n.channel,
      n.chat_id,
      n.template_type,
      n.message_text,
      n.has_inline_buttons,
      n.status,
      n.sent_at,
      n.delivery_status_updated_at,
      a.appointment_date,
      a.start_time,
      a.room_number,
      s.full_name AS doctor_name,
      p.full_name AS patient_name,
      p.mednum AS patient_mednum
    FROM appointment_notifications n
    LEFT JOIN appointments a ON n.appointment_id = a.id
    LEFT JOIN staff s ON a.doctor_id = s.id
    LEFT JOIN patients p ON a.patient_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (channel && channel !== 'all') {
    query += ` AND n.channel = ?`;
    params.push(channel);
  }

  if (appointmentId) {
    query += ` AND n.appointment_id = ?`;
    params.push(Number(appointmentId));
  }

  query += ` ORDER BY n.sent_at DESC, n.id DESC LIMIT ?`;
  params.push(Number(limit));

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, count: rows.length, notifications: rows });
  });
});

// -----------------------------------------------------------------------------
// 10. POST /api/scheduling/notifications/simulate-action - Interactive inline buttons
// -----------------------------------------------------------------------------
router.post('/notifications/:id/simulate-action', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'confirm' | 'cancel' | 'reschedule'

  db.get("SELECT * FROM appointment_notifications WHERE id = ?", [id], (err, notif) => {
    if (err || !notif) {
      return res.status(404).json({ success: false, error: 'Уведомление не найдено' });
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (action === 'confirm') {
      db.run(
        `UPDATE appointment_notifications 
         SET status = 'confirmed_by_user', delivery_status_updated_at = ? 
         WHERE id = ?`,
        [now, id]
      );
      db.run(
        `UPDATE appointments 
         SET status = 'confirmed' 
         WHERE id = ? AND status = 'scheduled'`,
        [notif.appointment_id]
      );
      return res.json({
        success: true,
        message: 'Пациент подтвердил запись через мессенджер'
      });
    }

    if (action === 'cancel') {
      db.run(
        `UPDATE appointment_notifications 
         SET status = 'delivered', delivery_status_updated_at = ? 
         WHERE id = ?`,
        [now, id]
      );
      db.run(
        `UPDATE appointments 
         SET status = 'cancelled', cancellation_reason = 'Отменено пациентом в мессенджере' 
         WHERE id = ?`,
        [notif.appointment_id]
      );
      return res.json({
        success: true,
        message: 'Запись отменена по запросу пациента'
      });
    }

    res.json({ success: true, message: 'Действие обработано' });
  });
});

module.exports = router;
