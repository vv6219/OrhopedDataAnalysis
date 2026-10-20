const db = require('../database');

async function inspectCatalogs() {
  const tables = [
    'ortho_manipulations_catalog',
    'ortho_physiotherapy_catalog',
    'ortho_orthotics_catalog',
    'diagnostic_methods_catalog',
    'ortho_referrals',
    'ortho_referral_items'
  ];

  for (const t of tables) {
    await new Promise((res) => {
      db.all(`PRAGMA table_info(${t})`, [], (err, cols) => {
        if (err) console.error(err);
        else {
          console.log(`\nTable: ${t}`);
          console.log(cols.map(c => c.name).join(', '));
        }
        res();
      });
    });

    await new Promise((res) => {
      db.get(`SELECT COUNT(*) as cnt FROM ${t}`, [], (err, row) => {
        if (!err && row) console.log(`Row count: ${row.cnt}`);
        res();
      });
    });
  }

  process.exit(0);
}

inspectCatalogs();
