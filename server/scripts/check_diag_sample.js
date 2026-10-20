const db = require('../database');

db.all("SELECT code, name, modality, protocol_phrase, patient_preparation, technique_details FROM diagnostic_methods_catalog LIMIT 10", [], (err, rows) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
});
