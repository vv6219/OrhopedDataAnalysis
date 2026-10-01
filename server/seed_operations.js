const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../db/orthopedic_data_center.sqlite');
const dishesPath = 'C:/Users/vladimir.dobrouchkin/.gemini/antigravity-ide/brain/4e5e7cd8-1b4f-4d16-9008-91585b3b1628/scratch/dishes.json';

const dishesData = JSON.parse(fs.readFileSync(dishesPath, 'utf8'));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath, err.message);
    process.exit(1);
  }
  
  console.log('Connected to the SQLite database.');
  
  db.serialize(() => {
    db.run("DELETE FROM operations");
    
    const stmt = db.prepare("INSERT INTO operations (name, price) VALUES (?, ?)");
    
    let count = 0;
    for (const dish of dishesData) {
      const name = dish.title;
      // Price format usually comes as string like '3500' or '18 000' (NBSP)
      const priceStr = dish.cost ? dish.cost.replace(/\s+/g, '').replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]/g,'') : "0";
      const price = parseFloat(priceStr);
      
      stmt.run(name, price, (err) => {
          if (err) console.error(err);
      });
      count++;
    }
    
    stmt.finalize(() => {
        console.log(`Inserted ${count} operations into the database.`);
        db.close();
    });
  });
});
