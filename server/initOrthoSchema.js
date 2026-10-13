const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Initializes Orthopedic Workstation 2.0 schema in SQLite:
 * 1. protocols table enhancements (protocol_json, vas_score, etc.)
 * 2. patient_clinical_profiles (orthopedic passport)
 * 3. patient_media_attachments (X-ray, MRI, CT, ultrasound, photos, video)
 * 4. ortho_treatment_prescriptions (injections, orthotics, SIS, UWT, servdict links)
 * 5. joint_biomechanics_history (longitudinal ROM and VAS recovery tracking)
 * 6. ortho_templates (clinical fast-fill templates)
 * 7. ortho_audit_logs (Serilog-compatible audit trail)
 * 8. protocols_fts (SQLite FTS5 virtual table for full-text search)
 * 9. Uploads directory setup
 * 
 * @param {sqlite3.Database} db 
 * @param {Function} [callback]
 */
function initOrthoSchema(db, callback) {
  // Ensure uploads directory exists
  const uploadsDir = path.resolve(__dirname, '../uploads/patient_media');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {
      console.warn('Could not create uploads directory:', e.message);
    }
  }

  db.serialize(() => {
    // -------------------------------------------------------------------------
    // 1. Column migrations for existing 'protocols' table
    // -------------------------------------------------------------------------
    const protocolCols = [
      "ALTER TABLE protocols ADD COLUMN protocol_json TEXT",
      "ALTER TABLE protocols ADD COLUMN schema_version TEXT DEFAULT '2.0'",
      "ALTER TABLE protocols ADD COLUMN appointment_id INTEGER",
      "ALTER TABLE protocols ADD COLUMN status TEXT DEFAULT 'signed'",
      "ALTER TABLE protocols ADD COLUMN vas_score INTEGER DEFAULT 0",
      "ALTER TABLE protocols ADD COLUMN primary_joint TEXT",
      "ALTER TABLE protocols ADD COLUMN side TEXT",
      "ALTER TABLE protocols ADD COLUMN is_signed INTEGER DEFAULT 1",
      "ALTER TABLE protocols ADD COLUMN signed_at TEXT",
      "ALTER TABLE protocols ADD COLUMN signed_by_docn INTEGER",
      "ALTER TABLE protocols ADD COLUMN signature_hash TEXT",
      "ALTER TABLE protocols ADD COLUMN revocation_reason TEXT"
    ];

    protocolCols.forEach((colSql) => {
      db.run(colSql, () => {
        // Silently ignore if column already exists
      });
    });

    // -------------------------------------------------------------------------
    // 2. Patient Clinical Profiles (Ортопедический паспорт пациента)
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS patient_clinical_profiles (
      patient_id INTEGER PRIMARY KEY,
      allergies TEXT,
      implants_endoprosthetics TEXT,
      has_pacemaker INTEGER DEFAULT 0,
      dominant_limb TEXT DEFAULT 'right',
      chronic_conditions TEXT,
      blood_group TEXT,
      ortho_anamnesis_notes TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_by TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    )`);

    // -------------------------------------------------------------------------
    // 3. Patient Media Attachments (Клинические медиафайлы: рентген, МРТ, КТ, фото)
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS patient_media_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      protocol_id INTEGER,
      appointment_id INTEGER,
      media_category TEXT NOT NULL,
      joint_area TEXT,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      thumbnail_path TEXT,
      description TEXT,
      study_date TEXT,
      sha256_hash TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      created_by TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(protocol_id) REFERENCES protocols(id)
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_pma_patient ON patient_media_attachments(patient_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_pma_protocol ON patient_media_attachments(protocol_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_pma_joint ON patient_media_attachments(joint_area);");

    // -------------------------------------------------------------------------
    // 4. Orthopedic Treatment Prescriptions (Назначения манипуляций, стелек, физио)
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS ortho_treatment_prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_id INTEGER NOT NULL,
      appointment_id INTEGER,
      patient_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      service_id INTEGER,
      service_code TEXT,
      title TEXT NOT NULL,
      details_json TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      is_transferred_to_cashier INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(protocol_id) REFERENCES protocols(id),
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_otp_protocol ON ortho_treatment_prescriptions(protocol_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_otp_patient ON ortho_treatment_prescriptions(patient_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_servplan_pr_id ON servplan(pr_id);");

    // -------------------------------------------------------------------------
    // 5. Joint Biomechanics History (Хронология ROM и боли ВАШ для трендов)
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS joint_biomechanics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      protocol_id INTEGER NOT NULL,
      recorded_date TEXT NOT NULL,
      joint_name TEXT NOT NULL,
      side TEXT NOT NULL,
      flexion_active INTEGER,
      flexion_passive INTEGER,
      extension_deficit INTEGER,
      rotation_ext INTEGER,
      rotation_int INTEGER,
      effusion_grade INTEGER DEFAULT 0,
      vas_score INTEGER DEFAULT 0,
      key_findings TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(protocol_id) REFERENCES protocols(id)
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_jbh_patient ON joint_biomechanics_history(patient_id, joint_name, side);");

    // -------------------------------------------------------------------------
    // 6. Orthopedic Clinical Fast-Fill Templates (Шаблоны приёма врача)
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS ortho_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER,
      title TEXT NOT NULL,
      joint_name TEXT NOT NULL,
      template_json TEXT NOT NULL,
      default_mkb_code TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);

    // Seed default standard clinic templates if empty
    db.get("SELECT COUNT(*) AS cnt FROM ortho_templates", (err, row) => {
      if (!err && row && row.cnt === 0) {
        const seedTemplates = [
          {
            title: 'Первичный гонартроз II стадии с умеренным выпотом',
            joint_name: 'knee',
            default_mkb_code: 'M17.1',
            template_json: JSON.stringify({
              complaints: 'Умеренная боль в коленном суставе при физической нагрузке, спуске по лестнице и начале ходьбы (стартовые боли).',
              vas_score: 4,
              pain_triggers: ['load', 'start'],
              joint_area: 'knee_r',
              side: 'right',
              axis: 'norm',
              effusion: 2,
              rom: { flexion_active: 110, flexion_passive: 120, extension_deficit: -5 },
              tests: { lachman: 'negative', anterior_drawer: 'negative', posterior_drawer: 'negative', pivot_shift: 'negative', mcmurray: 'positive_medial', appley: 'negative', patella_ballottement: 'positive' },
              diagnosis: { mkb_code: 'M17.1', mkb_name: 'Первичный гонартроз прочий односторонний', side: 'right', stage: 'Kellgren-Lawrence II' },
              prescriptions: [
                { category: 'manipulation', title: 'Пункция коленного сустава с эвакуацией выпота и введением гиалуроновой кислоты', unit_price: 3500, quantity: 1 },
                { category: 'orthotics', title: 'Индивидуальные ортопедические стельки (термоформовка)', unit_price: 4500, quantity: 1 },
                { category: 'physio', title: 'Высокоинтенсивная магнитотерапия SIS №5', unit_price: 7500, quantity: 1 }
              ]
            })
          },
          {
            title: 'Повреждение вращательной манжеты плеча (импиджмент)',
            joint_name: 'shoulder',
            default_mkb_code: 'M75.1',
            template_json: JSON.stringify({
              complaints: 'Ноющая боль в плечевом суставе при отведении руки выше 90°, дискомфорт при сне на больной стороне.',
              vas_score: 5,
              pain_triggers: ['load', 'night'],
              joint_area: 'shoulder_r',
              side: 'right',
              axis: 'norm',
              effusion: 0,
              rom: { abduction: 80, flexion_active: 100, rotation_ext: 40, rotation_int: 50 },
              tests: { neer: 'positive', hawkins: 'positive', empty_can_jobe: 'positive', drop_arm: 'negative', apprehension: 'negative' },
              diagnosis: { mkb_code: 'M75.1', mkb_name: 'Синдром сдавления ротатора плеча', side: 'right', stage: 'Субакромиальный импиджмент' },
              prescriptions: [
                { category: 'manipulation', title: 'Субакромиальная лечебно-медикаментозная блокада', unit_price: 3000, quantity: 1 },
                { category: 'physio', title: 'Радиальная ударно-волновая терапия УВТ №4', unit_price: 6000, quantity: 1 }
              ]
            })
          },
          {
            title: 'Плантарный фасциит (пяточная шпора)',
            joint_name: 'ankle',
            default_mkb_code: 'M77.3',
            template_json: JSON.stringify({
              complaints: 'Острая жгучая боль в области пятки при первых утренних шагах, уменьшающаяся после расхаживания.',
              vas_score: 6,
              pain_triggers: ['start', 'load'],
              joint_area: 'foot_r',
              side: 'right',
              axis: 'norm',
              effusion: 0,
              rom: { dorsiflexion: 15, plantarflexion: 40 },
              tests: { windlass: 'positive', talar_tilt: 'negative', anterior_drawer_ankle: 'negative', thompson: 'negative' },
              diagnosis: { mkb_code: 'M77.3', mkb_name: 'Пяточная шпора', side: 'right', stage: 'Плантарный фасциит' },
              prescriptions: [
                { category: 'physio', title: 'Фокусированная ударно-волновая терапия (УВТ) пяточной зоны №5', unit_price: 7500, quantity: 1 },
                { category: 'orthotics', title: 'Индивидуальные ортопедические стельки с разгрузкой пятки', unit_price: 4500, quantity: 1 }
              ]
            })
          }
        ];

        const stmt = db.prepare("INSERT INTO ortho_templates (title, joint_name, default_mkb_code, template_json) VALUES (?, ?, ?, ?)");
        seedTemplates.forEach((tpl) => {
          stmt.run([tpl.title, tpl.joint_name, tpl.default_mkb_code, tpl.template_json]);
        });
        stmt.finalize();
      }
    });

    // -------------------------------------------------------------------------
    // 7. Serilog-Compatible Operation Audit Log Table
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS ortho_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      level TEXT NOT NULL,
      event_type TEXT NOT NULL,
      appointment_id INTEGER,
      protocol_id INTEGER,
      patient_id INTEGER,
      doctor_id INTEGER,
      duration_ms INTEGER DEFAULT 0,
      message TEXT NOT NULL,
      properties_json TEXT,
      client_ip TEXT,
      exception TEXT
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_oal_appointment ON ortho_audit_logs(appointment_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_oal_protocol ON ortho_audit_logs(protocol_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_oal_event ON ortho_audit_logs(event_type);");

    // -------------------------------------------------------------------------
    // 8. SQLite FTS5 Full-Text Search Virtual Table
    // -------------------------------------------------------------------------
    db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS protocols_fts USING fts5(
      protocol_id UNINDEXED,
      patient_id UNINDEXED,
      patient_name,
      doctor_name,
      joint_area,
      mkb_codes,
      mkb_names,
      complaints,
      status_localis,
      full_content,
      prescriptions_text,
      tokenize = 'unicode61 remove_diacritics 2'
    )`, (ftsErr) => {
      if (ftsErr) {
        console.warn('FTS5 virtual table initialization warning:', ftsErr.message);
      } else {
        // Check if FTS is populated; if empty, seed from existing protocols
        db.get("SELECT COUNT(*) AS ftsCount FROM protocols_fts", (countErr, countRow) => {
          if (!countErr && countRow && countRow.ftsCount === 0) {
            console.log('[OrthoSchema] Indexing existing protocols into protocols_fts...');
            db.run(`
              INSERT INTO protocols_fts (protocol_id, patient_id, patient_name, doctor_name, joint_area, mkb_codes, mkb_names, full_content)
              SELECT 
                p.id,
                p.pt_id,
                COALESCE(pt.full_name, ''),
                'Врач ортопед',
                COALESCE(p.title, ''),
                COALESCE(diag.mkb_codes, ''),
                COALESCE(diag.mkb_names, ''),
                COALESCE(p.content, '')
              FROM protocols p
              LEFT JOIN patients pt ON pt.id = p.pt_id
              LEFT JOIN (
                SELECT pr_id, 
                       GROUP_CONCAT(mkb_code, ', ') AS mkb_codes,
                       GROUP_CONCAT(mkb_name, '; ') AS mkb_names
                FROM diagnoses
                GROUP BY pr_id
              ) diag ON diag.pr_id = p.id
            `, (seedErr) => {
              if (seedErr) {
                console.warn('[OrthoSchema] Initial FTS5 indexing error:', seedErr.message);
              } else {
                console.log('[OrthoSchema] Successfully indexed historical protocols into FTS5!');
              }
            });
          }
        });
      }
    });

    if (callback) callback();
  });
}

module.exports = { initOrthoSchema };
