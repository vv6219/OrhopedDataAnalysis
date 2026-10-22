const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'medwork_local.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  console.log('[ReferralsMigration] Creating tables...');

  db.run(`CREATE TABLE IF NOT EXISTS ortho_referral_performers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    is_internal INTEGER NOT NULL DEFAULT 1,
    performer_category TEXT NOT NULL,
    organization_address TEXT,
    contact_phone TEXT,
    target_domains TEXT,
    is_default INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );`);

  db.run("CREATE INDEX IF NOT EXISTS idx_orp_internal ON ortho_referral_performers(is_internal);");
  db.run("CREATE INDEX IF NOT EXISTS idx_orp_active ON ortho_referral_performers(is_active);");

  db.run(`CREATE TABLE IF NOT EXISTS ortho_referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_number TEXT UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL,
    appointment_id INTEGER,
    protocol_id INTEGER,
    doctor_name TEXT NOT NULL DEFAULT 'Врач травматолог-ортопед',
    issue_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    valid_days INTEGER NOT NULL DEFAULT 90,
    expires_at TEXT NOT NULL,
    performer_id INTEGER NOT NULL,
    performer_name TEXT NOT NULL,
    performer_is_internal INTEGER NOT NULL DEFAULT 1,
    performer_address TEXT,
    icd10_code TEXT NOT NULL,
    icd10_name TEXT,
    clinical_diagnosis TEXT NOT NULL,
    target_joint TEXT,
    target_side TEXT,
    anamnesis_summary TEXT,
    preparation_instructions TEXT,
    special_notes TEXT,
    status TEXT NOT NULL DEFAULT 'issued',
    verification_hash TEXT NOT NULL,
    printed_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY(performer_id) REFERENCES ortho_referral_performers(id),
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  );`);

  db.run("CREATE INDEX IF NOT EXISTS idx_ref_patient ON ortho_referrals(patient_id);");
  db.run("CREATE INDEX IF NOT EXISTS idx_ref_status ON ortho_referrals(status);");
  db.run("CREATE INDEX IF NOT EXISTS idx_ref_number ON ortho_referrals(referral_number);");
  db.run("CREATE INDEX IF NOT EXISTS idx_ref_expires ON ortho_referrals(expires_at);");

  db.run(`CREATE TABLE IF NOT EXISTS ortho_referral_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    domain TEXT NOT NULL,
    service_code TEXT,
    item_title TEXT NOT NULL,
    item_details TEXT,
    formula_latex TEXT,
    preparation_notes TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(referral_id) REFERENCES ortho_referrals(id) ON DELETE CASCADE
  );`);

  db.run("CREATE INDEX IF NOT EXISTS idx_ref_item_ref ON ortho_referral_items(referral_id);");
  db.run("CREATE INDEX IF NOT EXISTS idx_ref_item_domain ON ortho_referral_items(domain);");

  db.run(`CREATE TABLE IF NOT EXISTS ortho_referral_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    performed_by_name TEXT NOT NULL DEFAULT 'Сотрудник клиники',
    details_json TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY(referral_id) REFERENCES ortho_referrals(id) ON DELETE CASCADE
  );`);

  db.run("CREATE INDEX IF NOT EXISTS idx_ref_audit_ref ON ortho_referral_audit_log(referral_id);");

  db.get("SELECT COUNT(*) AS pCount FROM ortho_referral_performers", (err, row) => {
    if (err) {
      console.error('Count error:', err);
      return;
    }
    if (row && row.pCount === 0) {
      console.log('Seeding performers...');
      const initialPerformers = [
        ['Центр Ортопедии и Травматологии Добрушкина — Процедурный кабинет', 'Процедурный кабинет Центра', 1, 'clinic_procedure_room', 'г. Сочи, ул. Навагинская, д. 9Д', '+7 (862) 295-00-55', '["manipulation","surgery"]', 1, 10],
        ['Центр Ортопедии и Травматологии Добрушкина — Отделение кинезиотерапии и ЛФК', 'Отделение ЛФК Центра', 1, 'rehab_department', 'г. Сочи, ул. Навагинская, д. 9Д', '+7 (862) 295-00-55', '["lfk"]', 0, 20],
        ['Центр Ортопедии и Травматологии Добрушкина — Физиотерапевтический кабинет', 'Кабинет физиотерапии Центра', 1, 'physiotherapy', 'г. Сочи, ул. Навагинская, д. 9Д', '+7 (862) 295-00-55', '["physio"]', 0, 30],
        ['Центр Ортопедии и Травматологии Добрушкина — Кабинет индивидуального ортезирования и подологии', 'Кабинет ортезирования Центра', 1, 'orthotics', 'г. Сочи, ул. Навагинская, д. 9Д', '+7 (862) 295-00-55', '["orthotics"]', 0, 40],
        ['Любая аккредитованная организация лучевой диагностики (МРТ / КТ / Рентгенография) РФ', 'Внешний МРТ/КТ/Рентген центр', 0, 'mri_ct_center', 'По выбору пациента (РФ)', '—', '["diagnostics"]', 1, 50],
        ['ГБ №4 г. Сочи — Травматолого-ортопедическое отделение', 'ГБ №4 г. Сочи (Стационар)', 0, 'hospital_surgery', 'г. Сочи, ул. Дагомысская, д. 42', '+7 (862) 261-42-12', '["surgery","manipulation"]', 0, 60],
        ['Клинико-диагностическая лаборатория (по выбору пациента)', 'Внешняя КДЛ', 0, 'lab', 'По выбору пациента (РФ)', '—', '["diagnostics"]', 0, 70],
        ['Федеральный научно-клинический центр травматологии и ортопедии', 'Федеральный центр травматологии', 0, 'hospital_surgery', 'РФ, специализированный стационар', '—', '["surgery","diagnostics"]', 0, 80]
      ];

      const stmt = db.prepare(`
        INSERT INTO ortho_referral_performers 
        (name, short_name, is_internal, performer_category, organization_address, contact_phone, target_domains, is_default, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      initialPerformers.forEach((pRow) => {
        stmt.run(pRow);
      });
      stmt.finalize(() => {
        console.log('[ReferralsMigration] Performers seeded successfully!');
        db.close();
      });
    } else {
      console.log(`[ReferralsMigration] Performers already seeded (${row.pCount} items).`);
      db.close();
    }
  });
});
