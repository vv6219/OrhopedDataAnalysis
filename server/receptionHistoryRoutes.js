const express = require('express');
const router = express.Router();
const db = require('./database');

// Helper mapping for joint areas
const JOINT_LABELS = {
  knee: 'Коленный сустав',
  hip: 'Тазобедренный сустав',
  spine: 'Позвоночник (дорсопатия)',
  shoulder: 'Плечевой сустав',
  ankle: 'Голеностоп и стопа',
  elbow: 'Локтевой сустав',
  wrist: 'Лучезапястный сустав',
  general: 'Общая ортопедия'
};

const STATUS_CONFIG = {
  completed: { label: 'Завершён', color: '#16A34A' },
  protocol_signed: { label: 'Протокол подписан', color: '#0F3C64' },
  in_progress: { label: 'В кабинете', color: '#0284C7' },
  waiting: { label: 'В холле клиники', color: '#D97706' },
  confirmed: { label: 'Подтверждён', color: '#6366F1' },
  scheduled: { label: 'Запланирован', color: '#64748B' },
  cancelled: { label: 'Отменён', color: '#DC2626' },
  no_show: { label: 'Неявка пациента', color: '#9333EA' }
};

// Calculate wait time in minutes between arrival_time and start_time
function calculateWaitTime(startTime, arrivalTime) {
  if (!arrivalTime || !startTime) return null;
  try {
    const [startH, startM] = startTime.split(':').map(Number);
    const [arrH, arrM] = arrivalTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const arrTotal = arrH * 60 + arrM;
    const diff = startTotal - arrTotal;
    return diff > 0 ? diff : 0;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// 1. GET /api/analytics/reception-history - Main Multi-dimensional BI Endpoint
// -----------------------------------------------------------------------------
router.get('/', (req, res) => {
  const {
    startDate = '2026-09-01',
    endDate = '2026-10-25',
    doctorId,
    status,
    jointArea
  } = req.query;

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
      COALESCE(o.price, 2500) AS operation_price
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    LEFT JOIN staff s ON a.doctor_id = s.id
    LEFT JOIN operations o ON a.operation_id = o.id
    WHERE a.appointment_date >= ? AND a.appointment_date <= ?
  `;
  const params = [startDate, endDate];

  if (doctorId && doctorId !== 'all') {
    query += ` AND a.doctor_id = ?`;
    params.push(Number(doctorId));
  }

  if (status && status !== 'all') {
    if (status === 'completed_group') {
      query += ` AND a.status IN ('completed', 'protocol_signed')`;
    } else if (status === 'cancelled_group') {
      query += ` AND a.status IN ('cancelled', 'no_show')`;
    } else {
      query += ` AND a.status = ?`;
      params.push(status);
    }
  }

  if (jointArea && jointArea !== 'all') {
    query += ` AND a.joint_area = ?`;
    params.push(jointArea);
  }

  query += ` ORDER BY a.appointment_date DESC, a.start_time DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error in reception history query:', err);
      return res.status(500).json({ success: false, error: err.message });
    }

    const appointments = (rows || []).map((r) => {
      const waitTime = calculateWaitTime(r.start_time, r.arrival_time);
      return {
        ...r,
        wait_time_minutes: waitTime,
        joint_label: JOINT_LABELS[r.joint_area] || r.joint_area || 'Общая ортопедия',
        status_info: STATUS_CONFIG[r.status] || { label: r.status, color: '#64748B' }
      };
    });

    // 1. KPI Summary Aggregations
    const totalAppointments = appointments.length;
    let completedVisits = 0;
    let cancelledVisits = 0;
    let noShowVisits = 0;
    let waitingVisits = 0;
    let inProgressVisits = 0;
    let scheduledVisits = 0;
    let totalRevenue = 0;
    let totalDurationMinutes = 0;
    let completedWithDuration = 0;
    let totalWaitMinutes = 0;
    let countWithWait = 0;
    let primaryVisits = 0;
    let followUpVisits = 0;

    const timelineMap = {};
    const staffMap = {};
    const statusMap = {};
    const jointMap = {};
    const hourlyMatrix = {}; // hour -> count

    for (let h = 9; h <= 19; h++) {
      hourlyMatrix[h] = 0;
    }

    appointments.forEach((a) => {
      const isCompleted = a.status === 'completed' || a.status === 'protocol_signed';
      const isCancelled = a.status === 'cancelled';
      const isNoShow = a.status === 'no_show';

      if (isCompleted) {
        completedVisits++;
        totalRevenue += Number(a.operation_price) || 0;
        if (a.duration_minutes) {
          totalDurationMinutes += Number(a.duration_minutes);
          completedWithDuration++;
        }
      } else if (isCancelled) {
        cancelledVisits++;
      } else if (isNoShow) {
        noShowVisits++;
      } else if (a.status === 'waiting') {
        waitingVisits++;
      } else if (a.status === 'in_progress') {
        inProgressVisits++;
      } else {
        scheduledVisits++;
      }

      if (a.wait_time_minutes !== null && a.wait_time_minutes !== undefined) {
        totalWaitMinutes += a.wait_time_minutes;
        countWithWait++;
      }

      // Check Primary vs Follow-up
      const noteStr = `${a.notes || ''} ${a.operation_name || ''}`.toLowerCase();
      if (noteStr.includes('первичн') || noteStr.includes('первый')) {
        primaryVisits++;
      } else {
        followUpVisits++;
      }

      // Hour breakdown
      if (a.start_time) {
        const hour = parseInt(a.start_time.split(':')[0], 10);
        if (hourlyMatrix[hour] !== undefined) {
          hourlyMatrix[hour]++;
        }
      }

      // Timeline aggregation
      const dateKey = a.appointment_date;
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = {
          date: dateKey,
          total: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0
        };
      }
      timelineMap[dateKey].total++;
      if (isCompleted) {
        timelineMap[dateKey].completed++;
        timelineMap[dateKey].revenue += Number(a.operation_price) || 0;
      }
      if (isCancelled || isNoShow) {
        timelineMap[dateKey].cancelled++;
      }

      // Staff aggregation
      const docId = a.doctor_id || 0;
      if (!staffMap[docId]) {
        staffMap[docId] = {
          doctorId: docId,
          doctorName: a.doctor_name || 'Врач не назначен',
          doctorRole: a.doctor_role || 'Специалист',
          roomNumber: a.room_number || 'Кабинет №1',
          totalAppointments: 0,
          completedVisits: 0,
          cancelledVisits: 0,
          noShowVisits: 0,
          totalRevenue: 0,
          totalDuration: 0,
          countDuration: 0,
          totalWait: 0,
          countWait: 0
        };
      }
      staffMap[docId].totalAppointments++;
      if (isCompleted) {
        staffMap[docId].completedVisits++;
        staffMap[docId].totalRevenue += Number(a.operation_price) || 0;
        if (a.duration_minutes) {
          staffMap[docId].totalDuration += Number(a.duration_minutes);
          staffMap[docId].countDuration++;
        }
      }
      if (isCancelled) staffMap[docId].cancelledVisits++;
      if (isNoShow) staffMap[docId].noShowVisits++;
      if (a.wait_time_minutes !== null) {
        staffMap[docId].totalWait += a.wait_time_minutes;
        staffMap[docId].countWait++;
      }

      // Status breakdown
      const statKey = a.status;
      statusMap[statKey] = (statusMap[statKey] || 0) + 1;

      // Joint breakdown
      const jKey = a.joint_area || 'general';
      if (!jointMap[jKey]) {
        jointMap[jKey] = {
          joint_area: jKey,
          label: JOINT_LABELS[jKey] || jKey,
          count: 0,
          revenue: 0
        };
      }
      jointMap[jKey].count++;
      if (isCompleted) {
        jointMap[jKey].revenue += Number(a.operation_price) || 0;
      }
    });

    const avgCheck = completedVisits > 0 ? Math.round(totalRevenue / completedVisits) : 0;
    const showRate = totalAppointments > 0 ? Math.round((completedVisits / totalAppointments) * 100) : 0;
    const cancellationRate = totalAppointments > 0 ? Math.round((cancelledVisits / totalAppointments) * 100) : 0;
    const noShowRate = totalAppointments > 0 ? Math.round((noShowVisits / totalAppointments) * 100) : 0;
    const avgDuration = completedWithDuration > 0 ? Math.round(totalDurationMinutes / completedWithDuration) : 30;
    const avgWaitTime = countWithWait > 0 ? Math.round(totalWaitMinutes / countWithWait) : 10;
    const retentionRate = totalAppointments > 0 ? Math.round((followUpVisits / totalAppointments) * 100) : 0;

    // Timeline array sorted chronologically
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Staff breakdown formatted
    const staffBreakdown = Object.values(staffMap).map((s) => {
      const docShowRate = s.totalAppointments > 0 ? Math.round((s.completedVisits / s.totalAppointments) * 100) : 0;
      const docAvgCheck = s.completedVisits > 0 ? Math.round(s.totalRevenue / s.completedVisits) : 0;
      const docAvgDuration = s.countDuration > 0 ? Math.round(s.totalDuration / s.countDuration) : 30;
      const docAvgWait = s.countWait > 0 ? Math.round(s.totalWait / s.countWait) : 8;
      const shareOfClinicRevenue = totalRevenue > 0 ? Math.round((s.totalRevenue / totalRevenue) * 100) : 0;
      const shareOfClinicVisits = totalAppointments > 0 ? Math.round((s.totalAppointments / totalAppointments) * 100) : 0;

      // Slot occupancy estimate based on 10 available 30-min slots per day
      const occupancyRate = Math.min(100, Math.round((s.totalAppointments / 40) * 100) || 75);

      return {
        doctorId: s.doctorId,
        doctorName: s.doctorName,
        doctorRole: s.doctorRole,
        roomNumber: s.roomNumber,
        totalAppointments: s.totalAppointments,
        completedVisits: s.completedVisits,
        cancelledVisits: s.cancelledVisits,
        noShowVisits: s.noShowVisits,
        showRate: docShowRate,
        totalRevenue: s.totalRevenue,
        avgCheck: docAvgCheck,
        avgDuration: docAvgDuration,
        avgWaitTime: docAvgWait,
        occupancyRate,
        shareOfClinicRevenue,
        shareOfClinicVisits
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Status list
    const statusBreakdown = Object.keys(statusMap).map((k) => ({
      status: k,
      label: STATUS_CONFIG[k]?.label || k,
      color: STATUS_CONFIG[k]?.color || '#64748B',
      count: statusMap[k],
      percent: totalAppointments > 0 ? Math.round((statusMap[k] / totalAppointments) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Joint list
    const jointBreakdown = Object.values(jointMap).map((j) => ({
      ...j,
      percent: totalAppointments > 0 ? Math.round((j.count / totalAppointments) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Hourly heatmap list
    const hourlyHeatmap = Object.entries(hourlyMatrix).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      hourNumber: Number(hour),
      count
    }));

    res.json({
      success: true,
      period: { startDate, endDate },
      summary: {
        totalAppointments,
        completedVisits,
        cancelledVisits,
        noShowVisits,
        waitingVisits,
        inProgressVisits,
        scheduledVisits,
        totalRevenue,
        avgCheck,
        showRate,
        cancellationRate,
        noShowRate,
        avgDuration,
        avgWaitTime,
        primaryVisits,
        followUpVisits,
        retentionRate
      },
      timeline,
      staffBreakdown,
      statusBreakdown,
      jointBreakdown,
      hourlyHeatmap,
      appointments
    });
  });
});

// -----------------------------------------------------------------------------
// 2. POST /api/analytics/reception-history/seed-mock - [TEST_DAEMON] Seed Mock Data
// -----------------------------------------------------------------------------
router.post('/seed-mock', (req, res) => {
  const seedAppointments = [];
  const doctors = [
    { id: 2, name: 'Добрушкин Александр Моисеевич', room: 'Кабинет №1 (Добрушкин)' },
    { id: 4, name: 'Петров Сергей', room: 'Кабинет №2 (Петров)' }
  ];

  const jointAreas = ['knee', 'spine', 'hip', 'shoulder', 'ankle'];
  const times = ['09:00', '09:45', '10:30', '11:15', '12:00', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45'];

  const services = [
    { id: 2, name: 'Первичный приём травматолога-ортопеда', price: 3500 },
    { id: 5, name: 'Повторный консультативный приём ортопеда', price: 2500 },
    { id: 7, name: 'Внутрисуставная блокада / PRP-терапия', price: 5500 },
    { id: 10, name: 'Консилиум ведущих специалистов клиники', price: 6000 },
    { id: 12, name: 'УЗИ суставов экспертного класса', price: 2800 },
    { id: 15, name: 'Изготовление ортопедических стелек Formthotics', price: 7500 }
  ];

  const patientComplaints = [
    'Болевой синдром при нагрузке, артроз II ст.',
    'Консультация по реабилитации после травмы мениска',
    'Остеохондроз пояснично-крестцового отдела позвоночника',
    'Повторный контроль после курса инъекционной терапии',
    'Плечелопаточный периартрит, ограничение подвижности',
    'Плоскостопие III ст., плантарный фасциит, подбор стелек',
    'Коксартроз тазобедренного сустава, мониторинг угла движения',
    'Синдром ротаторной манжеты плеча, первичная диагностика'
  ];

  // Generate 120 appointments across dates from 2026-09-15 to 2026-10-25
  const startDate = new Date('2026-09-15');
  const endDate = new Date('2026-10-25');
  let patId = 1;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip Sundays
    if (d.getDay() === 0) continue;

    const dateStr = d.toISOString().slice(0, 10);
    const slotsCount = d.getDay() === 6 ? 4 : 6; // Saturdays lighter

    for (let i = 0; i < slotsCount; i++) {
      const doc = doctors[i % doctors.length];
      const time = times[i % times.length];
      const joint = jointAreas[(i + d.getDate()) % jointAreas.length];
      const serv = services[(i * 3 + d.getDate()) % services.length];
      const complaint = patientComplaints[(i + d.getDate()) % patientComplaints.length];

      // Status distribution: 75% completed/protocol_signed, 10% scheduled, 8% cancelled, 7% no_show
      let status = 'completed';
      let arrivalTime = null;
      let cancelReason = null;

      const rand = Math.random();
      if (d > new Date('2026-10-21')) {
        status = rand < 0.6 ? 'scheduled' : rand < 0.85 ? 'confirmed' : 'waiting';
      } else if (rand < 0.72) {
        status = rand < 0.4 ? 'protocol_signed' : 'completed';
        const [h, m] = time.split(':').map(Number);
        const arrM = Math.max(0, m - Math.floor(Math.random() * 15 + 5));
        arrivalTime = `${String(h).padStart(2, '0')}:${String(arrM).padStart(2, '0')}:00`;
      } else if (rand < 0.82) {
        status = 'cancelled';
        cancelReason = 'Пациент перенёс приём по семейным обстоятельствам';
      } else if (rand < 0.90) {
        status = 'no_show';
        cancelReason = 'Не отвечает на звонки администратора, не явился';
      } else {
        status = 'completed';
        arrivalTime = `${time}:00`;
      }

      seedAppointments.push({
        patient_id: ((patId++) % 50) + 1,
        doctor_id: doc.id,
        operation_id: serv.id,
        appointment_date: dateStr,
        start_time: time,
        end_time: `${time.split(':')[0]}:45`,
        duration_minutes: 30,
        room_number: doc.room,
        joint_area: joint,
        urgency_level: i === 0 ? 'cito' : 'routine',
        status,
        arrival_time: arrivalTime,
        cancellation_reason: cancelReason,
        notes: `[TEST_DAEMON] ${serv.name}. ${complaint}`
      });
    }
  }

  // Insert into DB
  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT INTO appointments (
        patient_id, doctor_id, operation_id, appointment_date, start_time, end_time,
        duration_minutes, room_number, joint_area, urgency_level, status,
        arrival_time, cancellation_reason, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    seedAppointments.forEach((a) => {
      stmt.run(
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
        a.notes
      );
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Error inserting mock appointments:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({
        success: true,
        message: `Успешно сгенерировано и добавлено ${seedAppointments.length} тестовых приёмов для [TEST_DAEMON]`,
        insertedCount: seedAppointments.length
      });
    });
  });
});

// -----------------------------------------------------------------------------
// 3. POST / DELETE /api/analytics/reception-history/clean-mock - Clean [TEST_DAEMON] Data
// -----------------------------------------------------------------------------
const cleanMockHandler = (req, res) => {
  const query = "DELETE FROM appointments WHERE notes LIKE '%[TEST_DAEMON]%' OR id >= 65";
  db.run(query, [], function (err) {
    if (err) {
      console.error('Error cleaning mock appointments:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    const deletedCount = this.changes || 0;
    res.json({
      success: true,
      message: `Успешно удалено ${deletedCount} смоделированных тестовых записей [TEST_DAEMON]`,
      deletedCount
    });
  });
};

router.post('/clean-mock', cleanMockHandler);
router.delete('/clean-mock', cleanMockHandler);

module.exports = router;

