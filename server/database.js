const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/orthopedic_data_center.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath, err.message);
  } else {
    console.log('Connected to the SQLite database at ' + dbPath);
    // Create tables if they don't exist (just to ensure development works if db is empty)
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS materials_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_name TEXT,
        unit_of_measure TEXT,
        current_unit_cost REAL
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
