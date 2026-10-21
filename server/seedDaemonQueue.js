/**
 * seedDaemonQueue.js
 * Генератор тестовой очереди приемов [TEST_DAEMON] на 5 дней:
 * Для доктора Добрушкин Александр Моисеевич (doctor_id: 2, Кабинет №1)
 * и контрольные приемы для доктора Петров Сергей (doctor_id: 4, Кабинет №2)
 * для демонстрации многоврачебного режима администратора.
 */

const db = require('./database');

const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

async function seedDaemonQueue() {
  console.log('>>> [TEST_DAEMON] Генерация очереди приемов на 5 дней для д-ра Добрушкина А.М. <<<');

  // Удаляем старые записи очереди [TEST_DAEMON]
  await runAsync(`DELETE FROM appointments WHERE notes LIKE '%[TEST_DAEMON]%'`);

  const baseDate = new Date('2026-10-21'); // Сегодня в тестовом контуре

  // Шаблон слотов для доктора Добрушкина А.М. (doctor_id: 2)
  const dobrouchkinSlots = [
    {
      time: '09:00', end: '09:30', duration: 30, patientId: 1, opId: 2,
      joint: 'knee', status: 'completed', arrival: '08:48:10', urgency: 'routine',
      notes: '[TEST_DAEMON] Первичный приём. Выполнена диагностическая пункция, протокол подписан'
    },
    {
      time: '09:40', end: '10:20', duration: 40, patientId: 2, opId: 10,
      joint: 'knee', status: 'in_progress', arrival: '09:31:40', urgency: 'routine',
      notes: '[TEST_DAEMON] PRP-терапия коленного сустава под УЗИ-навигацией. Идет клинический осмотр'
    },
    {
      time: '10:30', end: '11:00', duration: 30, patientId: 4, opId: 5,
      joint: 'hip', status: 'waiting', arrival: '10:14:22', urgency: 'routine',
      notes: '[TEST_DAEMON] Коксартроз III ст., оценка эффективности кинезиотерапии. Пациент в холле'
    },
    {
      time: '11:15', end: '12:00', duration: 45, patientId: 9, opId: 2,
      joint: 'shoulder', status: 'waiting', arrival: '11:04:15', urgency: 'routine',
      notes: '[TEST_DAEMON] Плечелопаточный периартрит, импиджмент-синдром. Пациент ожидает вызова'
    },
    {
      time: '12:15', end: '13:00', duration: 45, patientId: 8, opId: 2,
      joint: 'ankle', status: 'scheduled', arrival: null, urgency: 'cito',
      notes: '[TEST_DAEMON] [CITO] Острая спортивная травма голеностопа, подозрение на надрыв связок'
    },
    {
      time: '14:00', end: '14:45', duration: 45, patientId: 10, opId: 2,
      joint: 'foot', status: 'scheduled', arrival: null, urgency: 'routine',
      notes: '[TEST_DAEMON] Плантарный фасциит. Моделирование индивидуальных ортопедических стелек Formthotics'
    },
    {
      time: '15:00', end: '15:30', duration: 30, patientId: 3, opId: 4,
      joint: 'spine', status: 'scheduled', arrival: null, urgency: 'routine',
      notes: '[TEST_DAEMON] Нарушение осанки, сколиотическая деформация. Контроль динамики курса ЛФК'
    },
    {
      time: '15:45', end: '16:15', duration: 30, patientId: 7, opId: 5,
      joint: 'knee', status: 'scheduled', arrival: null, urgency: 'routine',
      notes: '[TEST_DAEMON] Повторная консультация после МРТ. Выбор тактики консервативного лечения'
    }
  ];

  // Дополнительные приемы для второго врача (д-р Петров С., doctor_id: 4) для мульти-врачебного обзора администратора
  const petrovSlots = [
    {
      time: '09:30', end: '10:00', duration: 30, patientId: 6, opId: 2,
      joint: 'spine', status: 'in_progress', arrival: '09:22:10', urgency: 'routine',
      notes: '[TEST_DAEMON] Дорсопатия поясничного отдела. Подбор ортопедического корсета'
    },
    {
      time: '10:15', end: '10:45', duration: 30, patientId: 1, opId: 5,
      joint: 'elbow', status: 'waiting', arrival: '10:05:00', urgency: 'routine',
      notes: '[TEST_DAEMON] Эпикондилит латеральный (локоть теннисиста). Тейпирование'
    },
    {
      time: '11:30', end: '12:15', duration: 45, patientId: 4, opId: 2,
      joint: 'knee', status: 'scheduled', arrival: null, urgency: 'routine',
      notes: '[TEST_DAEMON] Гонартроз II ст. Консультация по реабилитации'
    }
  ];

  let totalInserted = 0;

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const curDate = new Date(baseDate);
    curDate.setDate(curDate.getDate() + dayOffset);
    const dateStr = curDate.toISOString().slice(0, 10);

    // 1. Приемы д-ра Добрушкина А.М.
    for (let i = 0; i < dobrouchkinSlots.length; i++) {
      const slot = dobrouchkinSlots[i];
      let status = slot.status;
      let arrival = slot.arrival;

      // Для будущих дней статусы сдвигаются в scheduled
      if (dayOffset > 0) {
        status = i === 1 ? 'waiting' : 'scheduled';
        arrival = i === 1 ? `${slot.time.slice(0, 2)}:15:00` : null;
      }

      const res = await runAsync(`
        INSERT INTO appointments (
          patient_id, doctor_id, operation_id, appointment_date, 
          start_time, end_time, duration_minutes, room_number, 
          joint_area, urgency_level, status, arrival_time, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        slot.patientId, 2, slot.opId, dateStr,
        slot.time, slot.end, slot.duration, 'Кабинет №1 (Добрушкин)',
        slot.joint, slot.urgency, status, arrival, slot.notes
      ]);

      // Для завершенного утреннего приема на сегодня свяжем существующий протокол
      if (dayOffset === 0 && slot.status === 'completed') {
        const proto = await allAsync(`SELECT id FROM protocols WHERE pt_id = ? ORDER BY id DESC LIMIT 1`, [slot.patientId]);
        if (proto && proto.length > 0) {
          await runAsync(`UPDATE protocols SET appointment_id = ? WHERE id = ?`, [res.lastID, proto[0].id]);
        }
      }

      totalInserted++;
    }

    // 2. Приемы д-ра Петрова С. (для администратора)
    for (const slot of petrovSlots) {
      let status = dayOffset === 0 ? slot.status : 'scheduled';
      let arrival = dayOffset === 0 ? slot.arrival : null;

      await runAsync(`
        INSERT INTO appointments (
          patient_id, doctor_id, operation_id, appointment_date, 
          start_time, end_time, duration_minutes, room_number, 
          joint_area, urgency_level, status, arrival_time, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        slot.patientId, 4, slot.opId, dateStr,
        slot.time, slot.end, slot.duration, 'Кабинет №2 (Петров)',
        slot.joint, slot.urgency, status, arrival, slot.notes
      ]);
      totalInserted++;
    }
  }

  console.log(`✓ Успешно сгенерировано ${totalInserted} приемов [TEST_DAEMON] на 5 дней (2026-10-21 .. 2026-10-25).`);
  return totalInserted;
}

if (require.main === module) {
  seedDaemonQueue()
    .then((count) => {
      console.log(`Готово: ${count} записей создано.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Ошибка генерации очереди:', err);
      process.exit(1);
    });
}

module.exports = { seedDaemonQueue };
