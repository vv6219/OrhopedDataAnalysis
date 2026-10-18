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
      "ALTER TABLE protocols ADD COLUMN revocation_reason TEXT",
      "ALTER TABLE protocols ADD COLUMN anamnesis_vitae TEXT",
      "ALTER TABLE protocols ADD COLUMN objective_status TEXT",
      "ALTER TABLE protocols ADD COLUMN special_studies TEXT",
      "ALTER TABLE protocols ADD COLUMN performed_manipulations TEXT",
      "ALTER TABLE protocols ADD COLUMN active_sections_mask TEXT"
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
    // 6. Orthopedic Clinical Fast-Fill Templates & Knowledge Base Catalogs
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS ortho_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER,
      title TEXT NOT NULL,
      joint_name TEXT NOT NULL,
      template_json TEXT NOT NULL,
      default_mkb_code TEXT,
      category TEXT,
      default_side TEXT DEFAULT 'right',
      complaints_template TEXT,
      anamnesis_template TEXT,
      objective_template TEXT,
      rom_norm_preset TEXT,
      rom_priority TEXT DEFAULT 'P2',
      rom_sftr_preview TEXT DEFAULT '',
      rom_end_feel TEXT DEFAULT '',
      rom_has_stop_warning INTEGER DEFAULT 0,
      recommendations_template TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);

    // Column migrations for existing ortho_templates
    const tmplCols = [
      "ALTER TABLE ortho_templates ADD COLUMN category TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN default_side TEXT DEFAULT 'right'",
      "ALTER TABLE ortho_templates ADD COLUMN complaints_template TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN anamnesis_template TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN objective_template TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN rom_norm_preset TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN rom_priority TEXT DEFAULT 'P2'",
      "ALTER TABLE ortho_templates ADD COLUMN rom_sftr_preview TEXT DEFAULT ''",
      "ALTER TABLE ortho_templates ADD COLUMN rom_end_feel TEXT DEFAULT ''",
      "ALTER TABLE ortho_templates ADD COLUMN rom_has_stop_warning INTEGER DEFAULT 0",
      "ALTER TABLE ortho_templates ADD COLUMN recommendations_template TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE ortho_templates ADD COLUMN sort_order INTEGER DEFAULT 0",
      "ALTER TABLE ortho_templates ADD COLUMN cluster_id TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN cluster_name TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN stage_or_severity TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN clinical_tags TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN anamnesis_vitae_template TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN objective_status_template TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN special_studies_template TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN performed_manipulations_template TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN default_sections_mask TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN is_custom INTEGER DEFAULT 0",
      "ALTER TABLE ortho_templates ADD COLUMN author_doctor_name TEXT",
      "ALTER TABLE ortho_templates ADD COLUMN manipulations_priority TEXT DEFAULT 'P2'",
      "ALTER TABLE ortho_templates ADD COLUMN manipulations_summary TEXT DEFAULT ''",
      "ALTER TABLE ortho_templates ADD COLUMN manipulations_has_stop INTEGER DEFAULT 0",
      "ALTER TABLE ortho_templates ADD COLUMN manipulations_stop_rationale TEXT DEFAULT ''"
    ];
    tmplCols.forEach((colSql) => {
      db.run(colSql, () => {});
    });
    db.run("CREATE INDEX IF NOT EXISTS idx_ot_cluster_id ON ortho_templates(cluster_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_ot_is_custom ON ortho_templates(is_custom);");
    db.run("CREATE INDEX IF NOT EXISTS idx_ot_rom_priority ON ortho_templates(rom_priority);");
    db.run("CREATE INDEX IF NOT EXISTS idx_ot_man_priority ON ortho_templates(manipulations_priority);");
    db.run("CREATE INDEX IF NOT EXISTS idx_ot_man_stop ON ortho_templates(manipulations_has_stop);");

    // 6.0. Clinical Clusters Classification (10 Master Clusters)
    db.run(`CREATE TABLE IF NOT EXISTS ortho_clusters (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name_ru TEXT NOT NULL,
      joint_affinity TEXT NOT NULL,
      description TEXT,
      badge_color TEXT DEFAULT '#0F3C64',
      icon_name TEXT DEFAULT 'Healing',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_oc_joint ON ortho_clusters(joint_affinity);");
    db.run("CREATE INDEX IF NOT EXISTS idx_oc_active ON ortho_clusters(is_active);");

    // Seed 10 Default Master Clusters if empty
    db.get("SELECT COUNT(*) as count FROM ortho_clusters", (err, row) => {
      if (!err && row && row.count === 0) {
        const defaultClusters = [
          { id: 'cluster_knee', code: 'KNEE', name_ru: 'Коленный сустав: артрозы, связки и мениски', joint_affinity: 'knee', description: 'Гонартроз, повреждения менисков, ПКС, ЗКС, связок, киста Бейкера, пателлофеморальный артроз', badge_color: '#0284C7', icon_name: 'Healing', sort_order: 10 },
          { id: 'cluster_shoulder', code: 'SHOULDER', name_ru: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи', joint_affinity: 'shoulder', description: 'Субакромиальный импинджмент, разрывы ротаторной манжеты, адгезивный капсулит, SLAP, вывихи, АКС', badge_color: '#9333EA', icon_name: 'AccessibilityNew', sort_order: 20 },
          { id: 'cluster_hip_pelvis', code: 'HIP_PELVIS', name_ru: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит', joint_affinity: 'hip', description: 'Коксартроз I-III ст., вертлужный трохантерит, FAI-импинджмент, АНГБК, синдром грушевидной мышцы, сакроилеит', badge_color: '#16A34A', icon_name: 'DirectionsWalk', sort_order: 30 },
          { id: 'cluster_foot_ankle', code: 'FOOT_ANKLE', name_ru: 'Стопа и голеностоп: деформации, связки, плантарная фасция', joint_affinity: 'ankle', description: 'Плантарный фасциит, разрывы связок голеностопа, ахиллодиния, Hallux Valgus, неврома Мортона, PTTD', badge_color: '#0D9488', icon_name: 'RunCircle', sort_order: 40 },
          { id: 'cluster_elbow', code: 'ELBOW', name_ru: 'Локтевой сустав: эпикондилиты, бурситы, туннели', joint_affinity: 'elbow', description: 'Латеральный и медиальный эпикондилит, бурсит олекранона, синдром кубитального канала, травмы бицепса', badge_color: '#EA580C', icon_name: 'FitnessCenter', sort_order: 50 },
          { id: 'cluster_wrist_hand', code: 'WRIST_HAND', name_ru: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы', joint_affinity: 'wrist', description: 'Синдром запястного канала, болезнь де Кервена, ризартроз, TFCC, щелкающий палец, контрактура Дюпюитрена', badge_color: '#DB2777', icon_name: 'PanTool', sort_order: 60 },
          { id: 'cluster_spine', code: 'SPINE', name_ru: 'Позвоночник и торакс: радикулопатии, деформации, стеноз', joint_affinity: 'spine', description: 'Люмбалгия с ишиасом, цервикобрахиалгия, торакалгия, сколиоз, спондилолистез, стеноз, синдром Титце', badge_color: '#475569', icon_name: 'AirlineSeatReclineNormal', sort_order: 70 },
          { id: 'cluster_pediatric', code: 'PEDIATRIC', name_ru: 'Остеохондропатии и ювенильная ортопедия', joint_affinity: 'general', description: 'Болезнь Осгуда-Шлаттера, болезнь Севера, Келлера I и II, дисплазия ТБС по Graf', badge_color: '#D97706', icon_name: 'ChildCare', sort_order: 80 },
          { id: 'cluster_systemic', code: 'SYSTEMIC', name_ru: 'Системные, метаболические и нейродистрофические синдромы', joint_affinity: 'general', description: 'Системный остеопороз (DEXA), подагра, ревматоидный полиартрит, шкала Бейтона, КРБС (Зудек)', badge_color: '#4F46E5', icon_name: 'Biotech', sort_order: 90 },
          { id: 'cluster_postop', code: 'POSTOP', name_ru: 'Амбулаторный контроль эндопротезирования и остеосинтеза', joint_affinity: 'general', description: 'Наблюдение после эндопротезирования ТБС, коленного и плечевого суставов, удаление металлоконструкций', badge_color: '#059669', icon_name: 'LocalHospital', sort_order: 100 }
        ];

        const stmt = db.prepare("INSERT INTO ortho_clusters (id, code, name_ru, joint_affinity, description, badge_color, icon_name, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        defaultClusters.forEach(c => {
          stmt.run([c.id, c.code, c.name_ru, c.joint_affinity, c.description, c.badge_color, c.icon_name, c.sort_order]);
        });
        stmt.finalize();
        console.log('Seeded 10 master orthopedic clusters.');
      }
    });

    // 6.1. Validated Orthopedic Tests Catalog
    db.run(`CREATE TABLE IF NOT EXISTS ortho_test_catalog (
      code TEXT PRIMARY KEY,
      name_ru TEXT NOT NULL,
      name_lat TEXT NOT NULL,
      joint_category TEXT NOT NULL,
      target_structure TEXT NOT NULL,
      methodology TEXT NOT NULL,
      positive_criteria TEXT NOT NULL,
      sensitivity_specificity TEXT,
      icon_type TEXT DEFAULT 'joint_stress',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_otc_joint ON ortho_test_catalog(joint_category);");
    db.run("CREATE INDEX IF NOT EXISTS idx_otc_active ON ortho_test_catalog(is_active);");

    const testCols = [
      "ALTER TABLE ortho_test_catalog ADD COLUMN sensitivity_pct REAL",
      "ALTER TABLE ortho_test_catalog ADD COLUMN specificity_pct REAL",
      "ALTER TABLE ortho_test_catalog ADD COLUMN evidence_level TEXT DEFAULT 'B'",
      "ALTER TABLE ortho_test_catalog ADD COLUMN patient_position TEXT",
      "ALTER TABLE ortho_test_catalog ADD COLUMN doctor_hand_placement TEXT",
      "ALTER TABLE ortho_test_catalog ADD COLUMN applied_force_direction TEXT",
      "ALTER TABLE ortho_test_catalog ADD COLUMN false_positive_factors TEXT",
      "ALTER TABLE ortho_test_catalog ADD COLUMN clinical_interpretation TEXT",
      "ALTER TABLE ortho_test_catalog ADD COLUMN illustration_key TEXT DEFAULT 'default_joint'",
      "ALTER TABLE ortho_test_catalog ADD COLUMN test_type TEXT DEFAULT 'provocative'",
      "ALTER TABLE ortho_test_catalog ADD COLUMN is_supplemented INTEGER DEFAULT 0"
    ];
    testCols.forEach((colSql) => {
      db.run(colSql, () => {});
    });
    db.run("CREATE INDEX IF NOT EXISTS idx_otc_type ON ortho_test_catalog(test_type);");
    db.run("CREATE INDEX IF NOT EXISTS idx_otc_suppl ON ortho_test_catalog(is_supplemented);");

    db.all("SELECT code, sensitivity_specificity FROM ortho_test_catalog WHERE sensitivity_pct IS NULL AND sensitivity_specificity IS NOT NULL", (err, rows) => {
      if (!err && rows && rows.length > 0) {
        rows.forEach(r => {
          const seMatch = (r.sensitivity_specificity || '').match(/Se:\s*(\d+)/i);
          const spMatch = (r.sensitivity_specificity || '').match(/Sp:\s*(\d+)/i);
          const se = seMatch ? Number(seMatch[1]) : null;
          const sp = spMatch ? Number(spMatch[1]) : null;
          if (se !== null || sp !== null) {
            db.run("UPDATE ortho_test_catalog SET sensitivity_pct = ?, specificity_pct = ?, evidence_level = 'B' WHERE code = ?", [se, sp, r.code], () => {});
          }
        });
      }
    });

    // 6.2. Diagnostic and Laboratory Methods Catalog
    db.run(`CREATE TABLE IF NOT EXISTS diagnostic_methods_catalog (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      modality TEXT NOT NULL,
      target_joint TEXT NOT NULL,
      servdict_id INTEGER,
      clinical_indications TEXT,
      protocol_phrase TEXT NOT NULL,
      priority_level TEXT DEFAULT 'primary',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      description TEXT,
      technique_details TEXT,
      patient_preparation TEXT,
      diagnostic_criteria TEXT,
      contraindications TEXT,
      FOREIGN KEY(servdict_id) REFERENCES servdict(id) ON DELETE SET NULL
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_dmc_joint ON diagnostic_methods_catalog(target_joint);");
    db.run("CREATE INDEX IF NOT EXISTS idx_dmc_serv ON diagnostic_methods_catalog(servdict_id);");

    const dmcCols = [
      "ALTER TABLE diagnostic_methods_catalog ADD COLUMN description TEXT",
      "ALTER TABLE diagnostic_methods_catalog ADD COLUMN technique_details TEXT",
      "ALTER TABLE diagnostic_methods_catalog ADD COLUMN patient_preparation TEXT",
      "ALTER TABLE diagnostic_methods_catalog ADD COLUMN diagnostic_criteria TEXT",
      "ALTER TABLE diagnostic_methods_catalog ADD COLUMN contraindications TEXT"
    ];
    dmcCols.forEach((colSql) => {
      db.run(colSql, () => {});
    });

    // 6.3. Template -> Orthopedic Tests Relation
    db.run(`CREATE TABLE IF NOT EXISTS ortho_template_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      test_code TEXT NOT NULL,
      expected_result TEXT DEFAULT 'positive',
      is_mandatory INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      priority_level TEXT DEFAULT 'high',
      test_type_tag TEXT,
      is_supplemented INTEGER DEFAULT 0,
      FOREIGN KEY(template_id) REFERENCES ortho_templates(id) ON DELETE CASCADE,
      FOREIGN KEY(test_code) REFERENCES ortho_test_catalog(code) ON DELETE CASCADE
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_ott_tmpl ON ortho_template_tests(template_id);");

    const ottCols = [
      "ALTER TABLE ortho_template_tests ADD COLUMN priority_level TEXT DEFAULT 'high'",
      "ALTER TABLE ortho_template_tests ADD COLUMN test_type_tag TEXT",
      "ALTER TABLE ortho_template_tests ADD COLUMN is_supplemented INTEGER DEFAULT 0"
    ];
    ottCols.forEach(sql => db.run(sql, () => {}));
    db.run("CREATE INDEX IF NOT EXISTS idx_ott_priority ON ortho_template_tests(priority_level);");
    db.run("CREATE INDEX IF NOT EXISTS idx_ott_type ON ortho_template_tests(test_type_tag);");

    // 6.4. Template -> Diagnostic Methods Relation
    db.run(`CREATE TABLE IF NOT EXISTS ortho_template_diagnostics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      diagnostic_code TEXT NOT NULL,
      urgency TEXT DEFAULT 'routine',
      default_side TEXT DEFAULT 'affected',
      is_primary INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      priority_level TEXT DEFAULT 'high',
      FOREIGN KEY(template_id) REFERENCES ortho_templates(id) ON DELETE CASCADE,
      FOREIGN KEY(diagnostic_code) REFERENCES diagnostic_methods_catalog(code) ON DELETE CASCADE
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_otd_tmpl ON ortho_template_diagnostics(template_id);");

    const otdCols = [
      "ALTER TABLE ortho_template_diagnostics ADD COLUMN priority_level TEXT DEFAULT 'high'"
    ];
    otdCols.forEach(sql => db.run(sql, () => {}));
    db.run("CREATE INDEX IF NOT EXISTS idx_otd_priority ON ortho_template_diagnostics(priority_level);");

    // -------------------------------------------------------------------------
    // 6.5. Manipulations & Injections Catalog & Template Junction
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS ortho_manipulations_catalog (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      target_joint TEXT NOT NULL,
      service_scope TEXT NOT NULL DEFAULT 'internal',
      default_priority TEXT NOT NULL DEFAULT 'high',
      description TEXT NOT NULL,
      technique_details TEXT NOT NULL,
      regimen_standard TEXT NOT NULL,
      patient_preparation TEXT NOT NULL,
      post_procedure_care TEXT NOT NULL,
      clinical_indications TEXT NOT NULL,
      contraindications TEXT NOT NULL,
      servdict_id INTEGER,
      servdict_code TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (servdict_id) REFERENCES servdict(id) ON DELETE SET NULL
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_man_joint ON ortho_manipulations_catalog(target_joint);");
    db.run("CREATE INDEX IF NOT EXISTS idx_man_scope ON ortho_manipulations_catalog(service_scope);");
    db.run("CREATE INDEX IF NOT EXISTS idx_man_subcat ON ortho_manipulations_catalog(subcategory);");

    const manCols = [
      "ALTER TABLE ortho_manipulations_catalog ADD COLUMN ebm_priority TEXT DEFAULT 'P2'",
      "ALTER TABLE ortho_manipulations_catalog ADD COLUMN navigation_type TEXT DEFAULT 'us_guided'",
      "ALTER TABLE ortho_manipulations_catalog ADD COLUMN anatomical_access TEXT DEFAULT ''",
      "ALTER TABLE ortho_manipulations_catalog ADD COLUMN drug_class TEXT DEFAULT ''",
      "ALTER TABLE ortho_manipulations_catalog ADD COLUMN is_stop_warning INTEGER DEFAULT 0",
      "ALTER TABLE ortho_manipulations_catalog ADD COLUMN stop_rationale TEXT DEFAULT ''",
      "ALTER TABLE ortho_manipulations_catalog ADD COLUMN cdss_contraindication_tags TEXT DEFAULT ''"
    ];
    manCols.forEach(sql => db.run(sql, () => {}));
    db.run("CREATE INDEX IF NOT EXISTS idx_man_ebm_prio ON ortho_manipulations_catalog(ebm_priority);");
    db.run("CREATE INDEX IF NOT EXISTS idx_man_nav ON ortho_manipulations_catalog(navigation_type);");
    db.run("CREATE INDEX IF NOT EXISTS idx_man_drug ON ortho_manipulations_catalog(drug_class);");

    db.run(`CREATE TABLE IF NOT EXISTS ortho_template_manipulations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      manipulation_code TEXT NOT NULL,
      dosage_or_regimen TEXT,
      is_mandatory INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      priority_level TEXT DEFAULT 'high',
      service_scope TEXT DEFAULT 'internal',
      FOREIGN KEY(template_id) REFERENCES ortho_templates(id) ON DELETE CASCADE,
      FOREIGN KEY(manipulation_code) REFERENCES ortho_manipulations_catalog(code) ON DELETE CASCADE
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_otm_tmpl ON ortho_template_manipulations(template_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_otm_code ON ortho_template_manipulations(manipulation_code);");

    const otmCols = [
      "ALTER TABLE ortho_template_manipulations ADD COLUMN ebm_priority TEXT DEFAULT 'P2'",
      "ALTER TABLE ortho_template_manipulations ADD COLUMN navigation_type TEXT DEFAULT 'us_guided'",
      "ALTER TABLE ortho_template_manipulations ADD COLUMN anatomical_access TEXT DEFAULT ''",
      "ALTER TABLE ortho_template_manipulations ADD COLUMN drug_class TEXT DEFAULT ''",
      "ALTER TABLE ortho_template_manipulations ADD COLUMN is_stop_warning INTEGER DEFAULT 0",
      "ALTER TABLE ortho_template_manipulations ADD COLUMN stop_rationale TEXT DEFAULT ''",
      "ALTER TABLE ortho_template_manipulations ADD COLUMN clinical_indications TEXT DEFAULT ''"
    ];
    otmCols.forEach(sql => db.run(sql, () => {}));
    db.run("CREATE INDEX IF NOT EXISTS idx_otm_ebm ON ortho_template_manipulations(ebm_priority);");
    db.run("CREATE INDEX IF NOT EXISTS idx_otm_stop ON ortho_template_manipulations(is_stop_warning);");

    // -------------------------------------------------------------------------
    // 6.6. Physiotherapy & Instrument Treatments Catalog & Template Junction
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS ortho_physiotherapy_catalog (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      target_joint TEXT NOT NULL,
      service_scope TEXT NOT NULL DEFAULT 'internal',
      default_priority TEXT NOT NULL DEFAULT 'high',
      modality_tag TEXT,
      biophysical_profile TEXT,
      evidence_level TEXT DEFAULT '1A',
      cdss_contraindication_tags TEXT,
      apparatus_examples TEXT,
      description TEXT NOT NULL,
      technique_details TEXT NOT NULL,
      regimen_standard TEXT NOT NULL,
      patient_preparation TEXT NOT NULL,
      post_procedure_care TEXT NOT NULL,
      clinical_indications TEXT NOT NULL,
      contraindications TEXT NOT NULL,
      servdict_id INTEGER,
      servdict_code TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (servdict_id) REFERENCES servdict(id) ON DELETE SET NULL
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_phys_joint ON ortho_physiotherapy_catalog(target_joint);");
    db.run("CREATE INDEX IF NOT EXISTS idx_phys_scope ON ortho_physiotherapy_catalog(service_scope);");
    db.run("CREATE INDEX IF NOT EXISTS idx_phys_subcat ON ortho_physiotherapy_catalog(subcategory);");

    db.run(`CREATE TABLE IF NOT EXISTS ortho_template_physiotherapy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      physiotherapy_code TEXT NOT NULL,
      dosage_or_regimen TEXT,
      is_mandatory INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      priority_level TEXT DEFAULT 'high',
      service_scope TEXT DEFAULT 'internal',
      ebm_priority TEXT DEFAULT 'P1',
      line_order INTEGER DEFAULT 1,
      target_anatomical_landmark TEXT,
      exact_dosimetry TEXT,
      is_stop_warning INTEGER DEFAULT 0,
      stop_rationale TEXT,
      FOREIGN KEY(template_id) REFERENCES ortho_templates(id) ON DELETE CASCADE,
      FOREIGN KEY(physiotherapy_code) REFERENCES ortho_physiotherapy_catalog(code) ON DELETE CASCADE
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_otp_tmpl ON ortho_template_physiotherapy(template_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_otp_code ON ortho_template_physiotherapy(physiotherapy_code);");

    // -------------------------------------------------------------------------
    // 6.6.1. CDSS Safety Constraints Matrix (Physiotherapy & Hardware Locks)
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS ortho_cdss_physio_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      risk_category_code TEXT NOT NULL UNIQUE,
      risk_category_name TEXT NOT NULL,
      affected_template_ids TEXT NOT NULL,
      blocked_modality_tags TEXT NOT NULL,
      allowed_modality_tags TEXT,
      cdss_message_ru TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'danger',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_cdss_risk ON ortho_cdss_physio_blocks(risk_category_code);");

    // Dynamic Column Migration for existing databases
    db.all("PRAGMA table_info(ortho_physiotherapy_catalog)", (err, cols) => {
      if (!err && cols) {
        const colNames = cols.map(c => c.name);
        const addCol = (col, type) => {
          if (!colNames.includes(col)) {
            db.run(`ALTER TABLE ortho_physiotherapy_catalog ADD COLUMN ${col} ${type};`);
          }
        };
        addCol('modality_tag', 'TEXT');
        addCol('biophysical_profile', 'TEXT');
        addCol('evidence_level', "TEXT DEFAULT '1A'");
        addCol('cdss_contraindication_tags', 'TEXT');
        addCol('apparatus_examples', 'TEXT');

        setTimeout(() => {
          db.run("CREATE INDEX IF NOT EXISTS idx_phys_modtag ON ortho_physiotherapy_catalog(modality_tag);");
        }, 300);
      }
    });

    db.all("PRAGMA table_info(ortho_template_physiotherapy)", (err, cols) => {
      if (!err && cols) {
        const colNames = cols.map(c => c.name);
        const addCol = (col, type) => {
          if (!colNames.includes(col)) {
            db.run(`ALTER TABLE ortho_template_physiotherapy ADD COLUMN ${col} ${type};`);
          }
        };
        addCol('ebm_priority', "TEXT DEFAULT 'P1'");
        addCol('line_order', 'INTEGER DEFAULT 1');
        addCol('target_anatomical_landmark', 'TEXT');
        addCol('exact_dosimetry', 'TEXT');
        addCol('is_stop_warning', 'INTEGER DEFAULT 0');
        addCol('stop_rationale', 'TEXT');

        setTimeout(() => {
          db.run("CREATE INDEX IF NOT EXISTS idx_otp_ebm ON ortho_template_physiotherapy(ebm_priority);");
        }, 300);
      }
    });

    // -------------------------------------------------------------------------
    // 6.7. Orthotic Devices & Offloading Catalog & Template Junction
    // -------------------------------------------------------------------------
    db.run(`CREATE TABLE IF NOT EXISTS ortho_orthotics_catalog (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      target_joint TEXT NOT NULL,
      service_scope TEXT NOT NULL DEFAULT 'internal',
      default_priority TEXT NOT NULL DEFAULT 'high',
      description TEXT NOT NULL,
      technique_details TEXT NOT NULL,
      regimen_standard TEXT NOT NULL,
      patient_preparation TEXT NOT NULL,
      post_procedure_care TEXT NOT NULL,
      clinical_indications TEXT NOT NULL,
      contraindications TEXT NOT NULL,
      servdict_id INTEGER,
      servdict_code TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (servdict_id) REFERENCES servdict(id) ON DELETE SET NULL
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_orth_joint ON ortho_orthotics_catalog(target_joint);");
    db.run("CREATE INDEX IF NOT EXISTS idx_orth_scope ON ortho_orthotics_catalog(service_scope);");
    db.run("CREATE INDEX IF NOT EXISTS idx_orth_subcat ON ortho_orthotics_catalog(subcategory);");

    db.run(`CREATE TABLE IF NOT EXISTS ortho_template_orthotics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      orthotics_code TEXT NOT NULL,
      dosage_or_regimen TEXT,
      is_mandatory INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      priority_level TEXT DEFAULT 'high',
      service_scope TEXT DEFAULT 'internal',
      FOREIGN KEY(template_id) REFERENCES ortho_templates(id) ON DELETE CASCADE,
      FOREIGN KEY(orthotics_code) REFERENCES ortho_orthotics_catalog(code) ON DELETE CASCADE
    )`);
    db.run("CREATE INDEX IF NOT EXISTS idx_oto_tmpl ON ortho_template_orthotics(template_id);");
    db.run("CREATE INDEX IF NOT EXISTS idx_oto_code ON ortho_template_orthotics(orthotics_code);");

    // Seed/sync 180 master clinical templates across clusters if not already populated
    db.get("SELECT COUNT(*) AS count FROM ortho_templates WHERE is_active = 1", (cntErr, row) => {
      if (!cntErr && (!row || row.count < 180)) {
        try {
          const { syncAll180TemplatesKnowledgeBase } = require('./scripts/syncAll180TemplatesKnowledgeBase');
          if (syncAll180TemplatesKnowledgeBase) {
            syncAll180TemplatesKnowledgeBase(db);
          }
        } catch (e) {
          console.warn('[OrthoSchema] 180 Templates sync warning:', e.message);
        }
      }
    });

    // Seed/sync 3 treatment catalogs and template links if empty
    db.get("SELECT COUNT(*) AS count FROM ortho_manipulations_catalog", (cntErr, row) => {
      if (!cntErr && (!row || row.count < 10)) {
        try {
          const { syncTreatmentsKnowledgeBase180 } = require('./scripts/syncTreatmentsKnowledgeBase180');
          if (syncTreatmentsKnowledgeBase180) {
            syncTreatmentsKnowledgeBase180(db);
          }
        } catch (e) {
          console.warn('[OrthoSchema] Treatments catalog sync warning:', e.message);
        }
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
