const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT id, material_name, unit_of_measure, current_unit_cost, package_cost FROM materials_catalog", (err, rows) => {
    if (err) return console.error(err);

    let updatedCount = 0;
    db.run("BEGIN TRANSACTION");
    const updateStmt = db.prepare("UPDATE materials_catalog SET current_unit_cost = ?, package_cost = ?, unit_of_measure = ? WHERE id = ?");

    rows.forEach(row => {
      if (!row.unit_of_measure) return;
      if (row.package_cost && row.package_cost > 0) return; // already processed
      
      let count = null;
      let newUom = row.unit_of_measure;
      let uomClean = String(row.unit_of_measure).trim().toLowerCase();

      // Common patterns:
      // "5 пар", "20 пачек", "5*5 -20 уп" -> extract 20, "200 шт(100 пар)" -> extract 200 шт
      
      if (uomClean === '200 шт(100 пар)') {
        count = 100;
        newUom = '100 пар';
      } else if (uomClean === '500 л(5уп)') {
        count = 5;
        newUom = '5 уп';
      } else if (uomClean.includes('-20 уп')) {
        count = 20;
        newUom = '20 уп';
      } else {
        const match = uomClean.match(/^(\d+)\s*(пар|пачек|раковины|шт)$/);
        if (match) {
          count = parseInt(match[1], 10);
          newUom = `${count} ${match[2] === 'раковины' ? 'шт' : match[2]}`; // normalize
        }
      }

      if (count && count > 1) {
        let pkgCost = row.current_unit_cost;
        let unitCost = parseFloat((pkgCost / count).toFixed(2));
        
        console.log(`Updating [ID: ${row.id}] ${row.material_name}:`);
        console.log(`  old unit: '${row.unit_of_measure}' -> new unit: '${newUom}'`);
        console.log(`  old unit_cost: ${row.current_unit_cost}`);
        console.log(`  new pkg_cost: ${pkgCost}`);
        console.log(`  new unit_cost: ${unitCost}`);
        
        updateStmt.run([unitCost, pkgCost, newUom, row.id]);
        updatedCount++;
      }
    });

    updateStmt.finalize();
    db.run("COMMIT", () => {
      console.log(`\nSuccessfully updated ${updatedCount} records.`);
      db.close();
    });
  });
});
