const db = require('../database');
const { migrateExistingReferralItems } = require('../clinicalProtocolHelper');

async function run() {
  console.log('Running migration for ortho_referral_items and ortho_referrals...');
  const res = await migrateExistingReferralItems(db);
  console.log(`Migration completed successfully! Updated items: ${res.updatedCount}`);

  // Also verify samples
  db.all('SELECT id, item_title, item_details, preparation_notes FROM ortho_referral_items LIMIT 5', [], (err, rows) => {
    if (err) console.error(err);
    else {
      console.log('\n--- VERIFICATION SAMPLE ITEMS ---');
      rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
    }

    db.all('SELECT id, referral_number, preparation_instructions FROM ortho_referrals LIMIT 3', [], (err2, refs) => {
      if (err2) console.error(err2);
      else {
        console.log('\n--- VERIFICATION SAMPLE REFERRALS ---');
        refs.forEach(r => console.log(JSON.stringify(r, null, 2)));
      }
      setTimeout(() => process.exit(0), 500);
    });
  });
}

run();
