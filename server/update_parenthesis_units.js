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
      
      // Match pattern like "1 уп(5 ампул)", "1 уп(10 ампул-10мл)", "1 уп(100шт)"
      const matchParenthesis = row.unit_of_measure.match(/\(\s*(\d+)\s*(ампул|шт)[^\)]*\)/i);
      if (matchParenthesis) {
        count = parseInt(matchParenthesis[1], 10);
      } 
      // Also match something like "100 шт(1 уп)"
      else if (row.unit_of_measure.match(/^(\d+)\s*шт\s*\(\s*1\s*уп\s*\)/i)) {
        const m = row.unit_of_measure.match(/^(\d+)\s*шт/i);
        if (m) count = parseInt(m[1], 10);
      }

      if (count && count > 1) {
        let pkgCost = row.package_cost;
        let unitCost = row.current_unit_cost;
        
        // If package_cost hasn't been set yet (or is 0)
        if (!pkgCost || pkgCost === 0) {
          pkgCost = unitCost;
          unitCost = parseFloat((pkgCost / count).toFixed(2));
          newUom = `${count} шт`; // update unit of measure to "N шт" as requested
          
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
