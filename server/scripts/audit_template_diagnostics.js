const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

async function inspectDiags() {
  const all = (sql, p=[]) => new Promise((resolve, reject) => db.all(sql, p, (err, rows) => err ? reject(err) : resolve(rows)));

  const diags = await all('SELECT code, name, modality, target_joint FROM diagnostic_methods_catalog ORDER BY modality, code');
  console.log('Total diagnostics in catalog:', diags.length);

  const modalityCounts = {};
  diags.forEach(d => { modalityCounts[d.modality || 'other'] = (modalityCounts[d.modality || 'other'] || 0) + 1; });
  console.log('Diagnostics by modality:', modalityCounts);

  const allTemplates = await all(`
    SELECT ot.id, ot.title, ot.joint_name, ot.cluster_id,
           (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE template_id = ot.id) as diags_cnt
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
    ORDER BY diags_cnt ASC, ot.id ASC
  `);

  const emptyDiags = allTemplates.filter(t => t.diags_cnt === 0);
  console.log('Templates with 0 diagnostics:', emptyDiags.length);
  if (emptyDiags.length > 0) {
    console.log('Empty diagnostic templates:', JSON.stringify(emptyDiags, null, 2));
  }

  const lowDiags = allTemplates.filter(t => t.diags_cnt === 1);
  console.log('Templates with 1 diagnostic:', lowDiags.length);

  db.close();
}
inspectDiags();
