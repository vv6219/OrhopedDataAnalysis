const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

async function inspect() {
  const all = (sql, p=[]) => new Promise((resolve, reject) => db.all(sql, p, (err, rows) => err ? reject(err) : resolve(rows)));
  
  const tests = await all('SELECT code, name_ru, joint_category FROM ortho_test_catalog ORDER BY joint_category, code');
  console.log('Total tests in catalog:', tests.length);
  
  const jointCounts = {};
  tests.forEach(t => { jointCounts[t.joint_category] = (jointCounts[t.joint_category] || 0) + 1; });
  console.log('Tests by joint:', jointCounts);

  const allTemplates = await all(`
    SELECT ot.id, ot.title, ot.joint_name, ot.cluster_id, ot.default_mkb_code,
           (SELECT COUNT(*) FROM ortho_template_tests WHERE template_id = ot.id) as tests_cnt
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
    ORDER BY tests_cnt ASC, ot.id ASC
  `);

  const emptyTemplates = allTemplates.filter(t => t.tests_cnt === 0);
  console.log('Templates with 0 tests:', emptyTemplates.length);
  console.log('List of 0-test templates:', JSON.stringify(emptyTemplates.map(t => ({ id: t.id, title: t.title, joint: t.joint_name, cluster: t.cluster_id })), null, 2));

  const templatesWithLowTests = allTemplates.filter(t => t.tests_cnt === 1);
  console.log('Templates with only 1 test:', templatesWithLowTests.length);
  console.log('Sample of 1-test templates:', JSON.stringify(templatesWithLowTests.slice(0, 15).map(t => ({ id: t.id, title: t.title, joint: t.joint_name, cluster: t.cluster_id })), null, 2));

  db.close();
}
inspect();
