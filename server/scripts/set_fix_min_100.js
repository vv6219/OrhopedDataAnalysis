const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

const sql = `
INSERT INTO staff_operation_rates (staff_id, operation_id, role_in_procedure, payout_percent, fixed_min_payout, notes)
SELECT s.id, o.id, 
  CASE WHEN s.role LIKE '%сестра%' THEN 'nurse' ELSE 'primary_doctor' END,
  COALESCE(sch.default_rate_percent, CASE WHEN s.role LIKE '%сестра%' THEN 10.0 ELSE 35.0 END),
  100.0,
  'Стандартный фикс-минимум 100 руб.'
FROM staff s
CROSS JOIN operations o
LEFT JOIN staff_payout_settings sps ON sps.staff_id = s.id
LEFT JOIN staff_payout_schemes sch ON sps.scheme_id = sch.id
WHERE s.id IN (2, 4, 5, 29, 30, 31)
ON CONFLICT(staff_id, operation_id, role_in_procedure) DO UPDATE SET
  fixed_min_payout = 100.0;
`;

db.serialize(() => {
  db.run('UPDATE staff_operation_rates SET fixed_min_payout = 100.0', function(err) {
    if (err) console.error('Error updating existing:', err);
    else console.log('Updated existing rates count:', this.changes);
  });

  db.run(sql, function(err) {
    if (err) console.error('Error upserting all:', err);
    else console.log('Upserted for all staff & operations. Changes:', this.changes);
  });

  db.all('SELECT staff_id, count(*) as cnt, min(fixed_min_payout) as min_val, max(fixed_min_payout) as max_val FROM staff_operation_rates GROUP BY staff_id', (err, rows) => {
    if (err) console.error(err);
    else console.log('Rates per staff after setup:', rows);
    db.close();
  });
});
