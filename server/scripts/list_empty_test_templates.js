const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

async function getAllEmpty() {
  const all = (sql, p=[]) => new Promise((resolve, reject) => db.all(sql, p, (err, rows) => err ? reject(err) : resolve(rows)));
  const allTemplates = await all(`
    SELECT ot.id, ot.title, ot.joint_name, ot.cluster_id,
           (SELECT COUNT(*) FROM ortho_template_tests WHERE template_id = ot.id) as tests_cnt
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
    AND (SELECT COUNT(*) FROM ortho_template_tests WHERE template_id = ot.id) = 0
    ORDER BY ot.id ASC
  `);
  console.log('Total empty templates:', allTemplates.length);
  console.log(JSON.stringify(allTemplates, null, 2));
  db.close();
}
getAllEmpty();
