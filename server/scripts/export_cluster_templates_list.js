const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT ot.id, ot.cluster_id, ot.cluster_name, ot.title, ot.default_mkb_code, ot.joint_name,
         (SELECT COUNT(*) FROM ortho_template_tests WHERE template_id = ot.id) as tests_count,
         (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE template_id = ot.id) as diags_count
  FROM ortho_templates ot
  WHERE ot.is_active = 1 OR ot.is_active IS NULL
  ORDER BY ot.cluster_id, ot.sort_order, ot.id
`, (err, rows) => {
  if (err) {
    console.error(err);
    db.close();
    return;
  }

  const clusters = {
    'cluster_knee': '1. Коленный сустав',
    'cluster_shoulder': '2. Плечевой пояс',
    'cluster_hip_pelvis': '3. Таз и ТБС',
    'cluster_foot_ankle': '4. Стопа и голеностоп',
    'cluster_elbow': '5. Локтевой сустав',
    'cluster_wrist_hand': '6. Кисть и запястье',
    'cluster_spine': '7. Позвоночник и торакс',
    'cluster_pediatric': '8. Детская ортопедия',
    'cluster_systemic': '9. Системные синдромы',
    'cluster_postop': '10. Постоперационный контроль',
    'null': 'Авторские / Прочие'
  };

  const grouped = {};
  for (const c in clusters) grouped[c] = [];

  rows.forEach(r => {
    const key = r.cluster_id || 'null';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  for (const key in grouped) {
    const list = grouped[key];
    console.log(`\n### ${clusters[key] || key} (${list.length} шаблонов)`);
    list.forEach((item, idx) => {
      console.log(`${idx + 1}. [ID #${item.id}] ${item.title} | МКБ: ${item.default_mkb_code || 'Без МКБ'} | Тестов: ${item.tests_count} | Диагностика: ${item.diags_count}`);
    });
  }

  db.close();
});
