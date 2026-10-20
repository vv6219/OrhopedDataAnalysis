const db = require('../database');

async function inspectSamples() {
  db.all('SELECT id, referral_id, domain, service_code, item_title, item_details, formula_latex, preparation_notes FROM ortho_referral_items LIMIT 10', [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('=== SAMPLE REFERRAL ITEMS ===');
      rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    }
  });

  db.all('SELECT id, referral_number, preparation_instructions FROM ortho_referrals LIMIT 5', [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('=== SAMPLE REFERRALS ===');
      rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    }
  });

  db.all('SELECT name, regimen_standard, technique_details, patient_preparation FROM ortho_physiotherapy_catalog LIMIT 3', [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('=== SAMPLE PHYSIO CATALOG ===');
      rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    }
  });

  db.all('SELECT name, regimen_standard, technique_details, patient_preparation FROM ortho_manipulations_catalog LIMIT 3', [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('=== SAMPLE MANIPULATION CATALOG ===');
      rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    }
  });

  setTimeout(() => process.exit(0), 1000);
}

inspectSamples();
