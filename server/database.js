const sqlite3 = require('sqlite3').verbose();
const { getSqliteDbPath, getSqliteConfig } = require('./config');

const dbPath = getSqliteDbPath();
const sqliteConfig = getSqliteConfig();

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath, err.message);
  } else {
    console.log('Connected to the SQLite database at ' + dbPath + ' (from appsettings.json)');
    if (sqliteConfig.JournalMode) {
      db.run(`PRAGMA journal_mode = ${sqliteConfig.JournalMode};`);
    }
    if (sqliteConfig.Synchronous) {
      db.run(`PRAGMA synchronous = ${sqliteConfig.Synchronous};`);
    }
    if (sqliteConfig.BusyTimeoutMs) {
      db.run(`PRAGMA busy_timeout = ${sqliteConfig.BusyTimeoutMs};`);
    }
    if (sqliteConfig.ForeignKeys) {
      db.run(`PRAGMA foreign_keys = ON;`);
    }
    // Create tables if they don't exist (just to ensure development works if db is empty)
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS materials_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_name TEXT,
        unit_of_measure TEXT,
        current_unit_cost REAL
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        moduser TEXT,
        moddate TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS insurers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        briefly TEXT,
        moduser TEXT,
        moddate TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS dms_cards (
        id INTEGER PRIMARY KEY,
        patient_id INTEGER,
        referral TEXT,
        reg_date TEXT,
        policy TEXT,
        insurer_id INTEGER,
        insurer_name TEXT,
        limit_amount REAL,
        accrued REAL,
        rest_amount REAL,
        barcode TEXT,
        moduser TEXT,
        moddate TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS patient_visits (
        id INTEGER PRIMARY KEY,
        patient_id INTEGER,
        docn INTEGER,
        visit_date TEXT,
        visit_time INTEGER,
        visit_time_s TEXT,
        remark TEXT,
        moduser TEXT,
        moddate TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surname TEXT,
        name TEXT,
        patron TEXT,
        full_name TEXT,
        brief_name TEXT,
        sex INTEGER,
        sex_display TEXT,
        bdate TEXT,
        age INTEGER,
        weight REAL,
        height REAL,
        phone TEXT,
        phones TEXT,
        sphone TEXT,
        email TEXT,
        address TEXT,
        subject TEXT,
        region TEXT,
        city TEXT,
        area TEXT,
        street TEXT,
        house TEXT,
        flat TEXT,
        pseries TEXT,
        pnumber TEXT,
        pdate TEXT,
        pauthor TEXT,
        parent TEXT,
        mednum INTEGER,
        dms_flag INTEGER DEFAULT 0,
        dms_policy TEXT,
        dms_insurer TEXT,
        ignor_flag INTEGER DEFAULT 0,
        unch_flag INTEGER DEFAULT 0,
        ch_id INTEGER,
        channel_name TEXT,
        rdate TEXT,
        last_visit_date TEXT,
        total_visits INTEGER DEFAULT 0,
        total_spent REAL DEFAULT 0,
        moduser TEXT,
        moddate TEXT,
        first_name TEXT,
        last_name TEXT,
        contact_phone TEXT,
        date_of_birth TEXT,
        medical_history_notes TEXT,
        firstName TEXT,
        lastName TEXT,
        contact TEXT,
        lastVisit TEXT
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS operation_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id INTEGER,
        material_id INTEGER,
        quantity REAL,
        FOREIGN KEY(operation_id) REFERENCES operations(id),
        FOREIGN KEY(material_id) REFERENCES materials_catalog(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        operation_id INTEGER,
        appointment_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        room_number TEXT DEFAULT 'Кабинет №1',
        joint_area TEXT,
        urgency_level TEXT DEFAULT 'routine',
        status TEXT DEFAULT 'scheduled',
        arrival_time TEXT,
        cancellation_reason TEXT,
        notes TEXT,
        visit_id INTEGER,
        transaction_id INTEGER,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY(patient_id) REFERENCES patients(id),
        FOREIGN KEY(doctor_id) REFERENCES staff(id),
        FOREIGN KEY(operation_id) REFERENCES operations(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS appointment_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER NOT NULL,
        recipient_type TEXT DEFAULT 'patient',
        recipient_name TEXT NOT NULL,
        recipient_contact TEXT NOT NULL,
        channel TEXT NOT NULL,
        chat_id TEXT,
        template_type TEXT NOT NULL,
        message_text TEXT NOT NULL,
        has_inline_buttons INTEGER DEFAULT 1,
        status TEXT DEFAULT 'sent',
        sent_at TEXT DEFAULT (datetime('now', 'localtime')),
        delivery_status_updated_at TEXT,
        FOREIGN KEY(appointment_id) REFERENCES appointments(id)
      )`);
      
      // Ensure there is some default mock data for operations and materials if empty
      db.get("SELECT COUNT(*) AS count FROM materials_catalog", (err, row) => {
        if (row && row.count === 0) {
          console.log("Seeding initial materials...");
          const stmt = db.prepare("INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost) VALUES (?, ?, ?)");
          stmt.run('Титановый винт 5мм', 'шт', 1200);
          stmt.run('Пробирка PRP', 'шт', 850);
          stmt.run('Шприц гиалуроновой кислоты', 'шт', 3200);
          stmt.run('Стерильный бинт', 'рулон', 50);
          stmt.finalize();
        }
      });

      // Seed realistic appointments if empty
      db.get("SELECT COUNT(*) AS count FROM appointments", (err, row) => {
        if (!err && row && row.count === 0) {
          console.log("Seeding initial appointments & notifications...");
          const today = new Date().toISOString().slice(0, 10);
          
          const seedApps = [
            {
              patient_id: 1,
              doctor_id: 2,
              operation_id: 2,
              appointment_date: today,
              start_time: '09:00',
              end_time: '09:30',
              duration_minutes: 30,
              room_number: 'Кабинет №1 (Добрушкин)',
              joint_area: 'knee',
              urgency_level: 'routine',
              status: 'completed',
              arrival_time: '08:52:10',
              notes: 'Первичный приём. Жалобы на боли в правом коленном суставе при спуске по лестнице.'
            },
            {
              patient_id: 2,
              doctor_id: 2,
              operation_id: 10,
              appointment_date: today,
              start_time: '09:45',
              end_time: '10:30',
              duration_minutes: 45,
              room_number: 'Кабинет №1 (Добрушкин)',
              joint_area: 'knee',
              urgency_level: 'urgent',
              status: 'in_progress',
              arrival_time: '09:38:40',
              notes: 'Внутрисуставная инъекция гиалуроновой кислоты под УЗИ-навигацией.'
            },
            {
              patient_id: 4,
              doctor_id: 2,
              operation_id: 5,
              appointment_date: today,
              start_time: '10:45',
              end_time: '11:15',
              duration_minutes: 30,
              room_number: 'Кабинет №1 (Добрушкин)',
              joint_area: 'hip',
              urgency_level: 'routine',
              status: 'waiting',
              arrival_time: '10:35:12',
              notes: 'Повторный осмотр после курса физиотерапии тазобедренного сустава. Пациент в холле.'
            },
            {
              patient_id: 7,
              doctor_id: 2,
              operation_id: 8,
              appointment_date: today,
              start_time: '11:30',
              end_time: '12:00',
              duration_minutes: 30,
              room_number: 'Кабинет №1 (Добрушкин)',
              joint_area: 'shoulder',
              urgency_level: 'routine',
              status: 'confirmed',
              notes: 'УЗИ мягких тканей плечевого пояса. Запись подтверждена через Telegram.'
            },
            {
              patient_id: 8,
              doctor_id: 4,
              operation_id: 2,
              appointment_date: today,
              start_time: '09:30',
              end_time: '10:00',
              duration_minutes: 30,
              room_number: 'Кабинет №2 (Петров)',
              joint_area: 'ankle',
              urgency_level: 'urgent',
              status: 'completed',
              arrival_time: '09:20:05',
              notes: 'Травма голеностопного сустава. Подтверждён частичный надрыв связок.'
            },
            {
              patient_id: 1,
              doctor_id: 4,
              operation_id: 5,
              appointment_date: today,
              start_time: '10:15',
              end_time: '10:45',
              duration_minutes: 30,
              room_number: 'Кабинет №2 (Петров)',
              joint_area: 'spine',
              urgency_level: 'routine',
              status: 'waiting',
              arrival_time: '10:08:22',
              notes: 'Боли в поясничном отделе. Консультация по подбору корсета ТРИВЕС.'
            },
            {
              patient_id: 2,
              doctor_id: 4,
              operation_id: 2,
              appointment_date: today,
              start_time: '11:00',
              end_time: '11:45',
              duration_minutes: 45,
              room_number: 'Кабинет №2 (Петров)',
              joint_area: 'foot',
              urgency_level: 'routine',
              status: 'scheduled',
              notes: 'Моделирование индивидуальных ортопедических стелек Formthotics.'
            }
          ];

          seedApps.forEach((app) => {
            db.run(
              `INSERT INTO appointments (
                patient_id, doctor_id, operation_id, appointment_date, start_time, end_time,
                duration_minutes, room_number, joint_area, urgency_level, status, arrival_time, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                app.patient_id, app.doctor_id, app.operation_id, app.appointment_date,
                app.start_time, app.end_time, app.duration_minutes, app.room_number,
                app.joint_area, app.urgency_level, app.status, app.arrival_time || null, app.notes
              ],
              function(err) {
                if (!err && this.lastID) {
                  const appId = this.lastID;
                  db.run(
                    `INSERT INTO appointment_notifications (
                      appointment_id, recipient_type, recipient_name, recipient_contact, channel, chat_id,
                      template_type, message_text, has_inline_buttons, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      appId, 'patient', 'Пациент клиники', '+7 (988) 189-13-62', 'telegram', '@ortho_patient',
                      'booking_confirmation',
                      `Здравствуйте! Вы записаны в «Центр Ортопедии Добрушкина» на ${app.appointment_date} в ${app.start_time}. Врач: ${app.doctor_id === 2 ? 'Добрушкин А.М.' : 'Петров С.В.'}. Пожалуйста, подтвердите визит.`,
                      1, app.status === 'confirmed' ? 'confirmed_by_user' : 'delivered'
                    ]
                  );
                  db.run(
                    `INSERT INTO appointment_notifications (
                      appointment_id, recipient_type, recipient_name, recipient_contact, channel, chat_id,
                      template_type, message_text, has_inline_buttons, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      appId, 'patient', 'Пациент клиники', '+7 (988) 189-13-62', 'max', 'MAX-USER-7739',
                      'reminder_24h',
                      `«Центр Ортопедии Добрушкина»: Напоминаем о визите ${app.appointment_date} в ${app.start_time}. Кабинет: ${app.room_number}. Нажмите для подтверждения или связи с координатором.`,
                      1, 'delivered'
                    ]
                  );
                }
              }
            );
          });
        }
      });
    });
  }
});

module.exports = db;
