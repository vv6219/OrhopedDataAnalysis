const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

const workbook = xlsx.readFile('C:/Users/vladimir/source/repos/Data Analysis/Excel/Прайс-лист 02.10.2026.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
let headers = data[0];

// The first row might be a main title, so we need to find the actual header row
let headerRowIdx = 0;
for(let i=0; i<5; i++) {
  if (data[i] && data[i].includes('Название услуги')) {
    headers = data[i];
    headerRowIdx = i;
    break;
  }
}

const nameIdx = headers.indexOf('Название услуги');
const priceIdx = headers.indexOf('Цена');

if (nameIdx === -1 || priceIdx === -1) {
  console.error("Columns not found in header:", headers);
  process.exit(1);
}

// Add package_cost column if not exists
db.run("ALTER TABLE materials_catalog ADD COLUMN package_cost REAL", (err) => {
  // Ignore error if column already exists
});

db.serialize(() => {
  const materials = new Map();
  // Read rows after header
  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[nameIdx]) continue;
    let name = row[nameIdx];
    let price = row[priceIdx];
    
    if (typeof name !== 'string') name = String(name);
    name = name.trim();
    if (!name) continue;
    
    if (typeof price === 'string') {
      price = parseFloat(price.replace(/[^\d.-]/g, ''));
    }
    if (isNaN(price)) price = 0;
    
    // Use latest occurrence / priority
    materials.set(name, price);
  }

  const items = Array.from(materials.entries());
  console.log(`Found ${items.length} distinct materials to update/insert.`);

  db.run("BEGIN TRANSACTION");
  const updateStmt = db.prepare("UPDATE materials_catalog SET current_unit_cost = ? WHERE material_name = ?");
  const insertStmt = db.prepare("INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost) VALUES (?, 'шт', ?)");

  db.all("SELECT id, material_name FROM materials_catalog", (err, existingRows) => {
    const existingNames = new Set((existingRows || []).map(r => r.material_name));
    
    for (const [name, price] of items) {
      if (existingNames.has(name)) {
        updateStmt.run([price, name]);
      } else {
        insertStmt.run([name, price]);
      }
    }
    
    updateStmt.finalize();
    insertStmt.finalize();
    
    db.run("COMMIT", () => {
      console.log("Import completed!");
      db.close();
    });
  });
});
