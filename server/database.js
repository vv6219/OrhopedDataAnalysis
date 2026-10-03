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
    });
  }
});

module.exports = db;
