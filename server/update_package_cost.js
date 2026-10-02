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
    const updateStmt = db.prepare("UPDATE materials_catalog SET current_unit_cost = ?, package_cost = ? WHERE id = ?");

    rows.forEach(row => {
      if (!row.unit_of_measure) return;
      
      // Match pattern like "10 шт", "5шт", "12 шт."
      const match = row.unit_of_measure.trim().match(/^(\d+)\s*шт\.?$/i);
      
      if (match) {
        const count = parseInt(match[1], 10);
        
        if (count > 1) {
          // Move current_unit_cost to package_cost if not already set, 
          // or just unconditionally overwrite it based on the prompt logic.
          // "Стоимость единицы value move to Стоимость упаковки field and calculate Стоимость единицы=Стоимость упаковки/Ед. измерения"
          
          let pkgCost = row.package_cost;
          let unitCost = row.current_unit_cost;
          
          // Only do this if it hasn't been migrated yet. We can guess it hasn't been migrated if package_cost is null or 0
          // But to strictly follow instructions:
          if (!pkgCost || pkgCost === 0) {
            pkgCost = unitCost;
            unitCost = parseFloat((pkgCost / count).toFixed(2));
            
            console.log(`Updating [ID: ${row.id}] ${row.material_name}:`);
            console.log(`  unit_of_measure: '${row.unit_of_measure}'`);
            console.log(`  old current_unit_cost: ${row.current_unit_cost}`);
            console.log(`  new package_cost: ${pkgCost}`);
            console.log(`  new current_unit_cost: ${unitCost}`);
            
            updateStmt.run([unitCost, pkgCost, row.id]);
            updatedCount++;
          }
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
