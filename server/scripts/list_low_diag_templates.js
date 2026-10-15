const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

async function findLowDiagTemplates() {
  const all = (sql, p=[]) => new Promise((resolve, reject) => db.all(sql, p, (err, rows) => err ? reject(err) : resolve(rows)));
  const rows = await all(`
    SELECT ot.id, ot.title, ot.joint_name, ot.cluster_id,
           (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE template_id = ot.id) as diags_cnt
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
    AND (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE template_id = ot.id) <= 1
    ORDER BY ot.id ASC
  `);
  console.log('Templates with <= 1 diagnostic:', rows.length);
  console.log(JSON.stringify(rows, null, 2));
  db.close();
}
findLowDiagTemplates();
