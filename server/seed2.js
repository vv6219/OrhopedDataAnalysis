const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

const workbook = xlsx.readFile('data2.xlsx');
const uniqueMaterials = new Map();

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  
  json.forEach(row => {
    // Determine column names dynamically based on what's available
    const nameCol = Object.keys(row).find(k => k.includes('Наименование') || k.includes('Услуга'));
    const unitCol = Object.keys(row).find(k => k.includes('Единица закупки'));
    const priceCol = Object.keys(row).find(k => k.includes('Стоимость') || k.includes('Цена'));

    if (!nameCol) return;

    let name = row[nameCol];
    if (typeof name === 'string') name = name.trim();
    if (!name) return; // Skip empty
    
    // Ignore categories like "Всего оказано услуг"
    if (name.includes('Всего') || name.includes('Итого')) return;

    let unit = unitCol ? String(row[unitCol]).trim().substring(0, 20) : 'шт';
    let unitCost = priceCol ? parseFloat(row[priceCol]) || 0 : 0;

    if (!uniqueMaterials.has(name)) {
      uniqueMaterials.set(name, {
        material_name: name,
        unit_of_measure: unit || 'шт',
        current_unit_cost: Math.round(unitCost)
      });
    }
  });
});

console.log(`Found ${uniqueMaterials.size} unique materials/services.`);

db.serialize(() => {
  const stmt = db.prepare("INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM materials_catalog WHERE material_name = ?)");
  
  let count = 0;
  for (const item of uniqueMaterials.values()) {
    // Using INSERT ... WHERE NOT EXISTS to avoid exact duplicates
    stmt.run(item.material_name, item.unit_of_measure, item.current_unit_cost, item.material_name);
    count++;
  }
  
  stmt.finalize(() => {
    console.log(`Processed ${count} items. Distinct new items were added to materials_catalog.`);
    db.close();
  });
});
