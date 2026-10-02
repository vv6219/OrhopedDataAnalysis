const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT id, material_name, unit_of_measure, current_unit_cost, package_cost FROM materials_catalog", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }

    let updatedCount = 0;
    
    db.run("BEGIN TRANSACTION");
    const updateStmt = db.prepare("UPDATE materials_catalog SET current_unit_cost = ?, package_cost = ?, unit_of_measure = ? WHERE id = ?");

    rows.forEach(row => {
      if (!row.unit_of_measure) return;
      
      let count = null;
      let newUom = row.unit_of_measure;
      const trimmedUnit = String(row.unit_of_measure).trim();
      
      // Match pattern "100 in"
      const match = trimmedUnit.match(/^(\d+)\s*in$/i);
      if (match) {
        count = parseInt(match[1], 10);
      }
      
      if (count && count > 1) {
        let pkgCost = row.package_cost;
        let unitCost = row.current_unit_cost;
        
        // If package_cost hasn't been set yet (or is 0)
        if (!pkgCost || pkgCost === 0) {
          pkgCost = unitCost;
          unitCost = parseFloat((pkgCost / count).toFixed(2));
          newUom = `${count} шт`; 
          
          console.log(`Updating [ID: ${row.id}] ${row.material_name}:`);
          console.log(`  old unit: '${row.unit_of_measure}' -> new unit: '${newUom}'`);
          console.log(`  old unit_cost: ${row.current_unit_cost}`);
          console.log(`  new pkg_cost: ${pkgCost}`);
          console.log(`  new unit_cost: ${unitCost}`);
          
          updateStmt.run([unitCost, pkgCost, newUom, row.id]);
          updatedCount++;
        }
      }
    });

    updateStmt.finalize();
    
    db.run("COMMIT", () => {
      console.log(`\nSuccessfully updated ${updatedCount} records.`);
      db.close();
    });
  });
});
