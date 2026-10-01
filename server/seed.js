const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

const workbook = xlsx.readFile('data.xlsx');
const uniqueMaterials = new Map();

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  
  json.forEach(row => {
    let name = row['Название товара/счета'];
    if (typeof name === 'string') name = name.trim();
    if (!name) return; // Skip empty
    
    // Ignore obviously non-material things (rough heuristic for expenses)
    const lower = name.toLowerCase();
    if (lower.includes('связь') || lower.includes('авито') || lower.includes('ростелеком') || lower.includes('налог') || lower.includes('зарплата')) {
      return;
    }

    const qtyStr = String(row['Кол-во товара/номер счета'] || '1').trim();
    let qty = 1;
    let unit = 'шт';
    
    // Try to parse quantity if it's a simple number
    if (/^\d+$/.test(qtyStr)) {
      qty = parseInt(qtyStr, 10);
    } else if (qtyStr.includes('уп')) {
      unit = 'уп';
    } else if (qtyStr) {
       unit = qtyStr.substring(0, 20); // Just capture what they wrote
    }

    let totalCost = parseFloat(row['Цена товара/сумма счета']) || 0;
    let unitCost = qty > 0 ? (totalCost / qty) : totalCost;

    if (!uniqueMaterials.has(name)) {
      uniqueMaterials.set(name, {
        material_name: name,
        unit_of_measure: unit,
        current_unit_cost: Math.round(unitCost)
      });
    }
  });
});

console.log(`Found ${uniqueMaterials.size} unique materials/expenses.`);

db.serialize(() => {
  // Clear the existing mock materials (optional, but requested to 'fill' from sheets)
  // We won't clear to preserve mock data, we will just insert unique new ones.
  
  const stmt = db.prepare("INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost) VALUES (?, ?, ?)");
  
  let count = 0;
  for (const item of uniqueMaterials.values()) {
    stmt.run(item.material_name, item.unit_of_measure, item.current_unit_cost);
    count++;
  }
  
  stmt.finalize(() => {
    console.log(`Successfully inserted ${count} items into materials_catalog.`);
    db.close();
  });
});
