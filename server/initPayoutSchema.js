const sqlite3 = require('sqlite3').verbose();

/**
 * Initializes tables, views, indexes, and seed data for the Staff Payout module.
 * @param {sqlite3.Database} db 
 * @param {Function} [callback] 
 */
function initPayoutSchema(db, callback) {
  db.serialize(() => {
    // 1. Schemes table
    db.run(`CREATE TABLE IF NOT EXISTS staff_payout_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_name TEXT NOT NULL UNIQUE,
      description TEXT,
      default_rate_percent REAL NOT NULL DEFAULT 20.0,
      revenue_basis_policy TEXT NOT NULL DEFAULT 'from_actual_billed',
      max_brigade_pct_cap REAL NOT NULL DEFAULT 60.0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);

    // 2. Individual operation rates per staff member
    db.run(`CREATE TABLE IF NOT EXISTS staff_operation_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      operation_id INTEGER NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
      role_in_procedure TEXT NOT NULL DEFAULT 'primary_doctor',
      payout_percent REAL NOT NULL CHECK(payout_percent >= 0 AND payout_percent <= 100),
      fixed_min_payout REAL DEFAULT 0.0 CHECK(fixed_min_payout >= 0),
      fixed_bonus REAL DEFAULT 0.0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(staff_id, operation_id, role_in_procedure)
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_sor_staff ON staff_operation_rates(staff_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_sor_op ON staff_operation_rates(operation_id)`);

    // 3. Staff payout settings (scheme link, tax rate, base salary)
    db.run(`CREATE TABLE IF NOT EXISTS staff_payout_settings (
      staff_id INTEGER PRIMARY KEY REFERENCES staff(id) ON DELETE CASCADE,
      scheme_id INTEGER REFERENCES staff_payout_schemes(id),
      tax_rate_percent REAL DEFAULT 0.0 CHECK(tax_rate_percent >= 0 AND tax_rate_percent <= 50),
      fixed_base_salary REAL DEFAULT 0.0,
      payout_account_info TEXT,
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);

    // 4. Master procedure execution records ("Для процедуры")
    db.run(`CREATE TABLE IF NOT EXISTS procedure_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL CHECK(source_type IN ('transaction', 'appointment', 'visit', 'manual')),
      source_id INTEGER NOT NULL,
      dedup_hash TEXT NOT NULL UNIQUE,
      visit_id INTEGER REFERENCES patient_visits(id),
      transaction_id INTEGER REFERENCES operation_transactions(id),
      appointment_id INTEGER REFERENCES appointments(id),
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      operation_id INTEGER NOT NULL REFERENCES operations(id),
      execution_date TEXT NOT NULL,
      billed_price REAL NOT NULL CHECK(billed_price >= 0),
      catalog_price REAL NOT NULL CHECK(catalog_price >= 0),
      materials_cost REAL NOT NULL DEFAULT 0.0 CHECK(materials_cost >= 0),
      material_cost_factor REAL NOT NULL DEFAULT 1.15 CHECK(material_cost_factor >= 1.0),
      margin_base REAL NOT NULL CHECK(margin_base >= 0),
      total_staff_payouts REAL DEFAULT 0.0 CHECK(total_staff_payouts >= 0),
      clinic_profit REAL DEFAULT 0.0,
      accrual_status TEXT NOT NULL DEFAULT 'unbilled' CHECK(accrual_status IN ('unbilled', 'in_draft', 'accrued', 'in_sheet', 'paid', 'storno')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_prec_date ON procedure_records(execution_date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_prec_status ON procedure_records(accrual_status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_prec_patient ON procedure_records(patient_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_prec_op ON procedure_records(operation_id)`);

    // 5. Payout sheets ("Ведомости выплат")
    db.run(`CREATE TABLE IF NOT EXISTS staff_payout_sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheet_number TEXT UNIQUE NOT NULL,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_operations_count INTEGER DEFAULT 0 CHECK(total_operations_count >= 0),
      total_margin_base REAL DEFAULT 0.0 CHECK(total_margin_base >= 0),
      total_payout_amount REAL DEFAULT 0.0 CHECK(total_payout_amount >= 0),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'paid', 'cancelled')),
      approved_by TEXT,
      approved_at TEXT,
      paid_at TEXT,
      payment_order_number TEXT,
      notes TEXT,
      created_by TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_psheet_staff ON staff_payout_sheets(staff_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_psheet_status ON staff_payout_sheets(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_psheet_period ON staff_payout_sheets(period_start, period_end)`);

    // 6. Detailed staff accruals ("Для сотрудника")
    db.run(`CREATE TABLE IF NOT EXISTS staff_payout_accruals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      procedure_record_id INTEGER NOT NULL REFERENCES procedure_records(id) ON DELETE CASCADE,
      doctor_or_staff_id INTEGER NOT NULL REFERENCES staff(id),
      role_in_procedure TEXT NOT NULL,
      sheet_id INTEGER REFERENCES staff_payout_sheets(id) ON DELETE SET NULL,
      service_date TEXT NOT NULL,
      margin_base REAL NOT NULL,
      payout_percent REAL NOT NULL CHECK(payout_percent >= 0 AND payout_percent <= 100),
      calculated_payout REAL NOT NULL CHECK(calculated_payout >= 0),
      applied_min_guarantee INTEGER NOT NULL DEFAULT 0,
      manual_adjustment REAL DEFAULT 0.0,
      final_payout REAL NOT NULL CHECK(final_payout >= 0),
      status TEXT NOT NULL DEFAULT 'accrued' CHECK(status IN ('accrued', 'in_sheet', 'paid', 'storno')),
      is_storno INTEGER NOT NULL DEFAULT 0,
      reversal_of_id INTEGER REFERENCES staff_payout_accruals(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_accr_proc ON staff_payout_accruals(procedure_record_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_accr_staff ON staff_payout_accruals(doctor_or_staff_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_accr_sheet ON staff_payout_accruals(sheet_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_accr_date ON staff_payout_accruals(service_date)`);

    // 7. Temporary Soft-Locks for concurrent wizard calculation
    db.run(`CREATE TABLE IF NOT EXISTS service_calculation_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL,
      source_id INTEGER NOT NULL,
      lock_token TEXT NOT NULL,
      locked_by TEXT NOT NULL,
      locked_at TEXT DEFAULT (datetime('now', 'localtime')),
      expires_at TEXT NOT NULL,
      UNIQUE(source_type, source_id)
    )`);

    // Ensure operation_transaction_items table exists
    db.run(`CREATE TABLE IF NOT EXISTS operation_transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      operation_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY(transaction_id) REFERENCES operation_transactions(id) ON DELETE CASCADE,
      FOREIGN KEY(operation_id) REFERENCES operations(id)
    )`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_oti_trans ON operation_transaction_items(transaction_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_oti_op ON operation_transaction_items(operation_id)`);

    // 8. SQL View for unbilled services pipeline
    db.run(`DROP VIEW IF EXISTS v_unbilled_services`);
    db.run(`CREATE VIEW v_unbilled_services AS
      -- 1a. Source: Multi-operation items in transactions
      SELECT 
        'transaction' AS source_type,
        ot.id AS source_id,
        'tr:' || ot.id || ':' || oti.operation_id AS dedup_hash,
        ot.transaction_date AS service_date,
        ot.patient_id,
        COALESCE(p.full_name, (p.surname || ' ' || p.name)) AS patient_name,
        p.phone AS patient_phone,
        COALESCE(tsr_doc.staff_id, 2) AS primary_doctor_id,
        COALESCE(s_doc.full_name, 'Добрушкин Александр Моисеевич') AS doctor_name,
        oti.operation_id,
        o.name AS operation_name,
        oti.subtotal AS revenue,
        o.price AS catalog_price,
        COALESCE(
          (SELECT ROUND(SUM(om.quantity * COALESCE(mc.current_unit_cost, 0) * oti.quantity), 2)
           FROM operation_materials om
           JOIN materials_catalog mc ON om.material_id = mc.id
           WHERE om.operation_id = oti.operation_id),
          0.0
        ) AS materials_cost,
        1.15 AS material_cost_factor,
        MAX(0.0, ROUND(oti.subtotal - COALESCE(
          (SELECT SUM(om.quantity * COALESCE(mc.current_unit_cost, 0) * oti.quantity)
           FROM operation_materials om
           JOIN materials_catalog mc ON om.material_id = mc.id
           WHERE om.operation_id = oti.operation_id),
          0.0
        ) * 1.15, 2)) AS margin_base,
        CASE WHEN scl.expires_at > datetime('now', 'localtime') THEN 1 ELSE 0 END AS is_locked,
        scl.locked_by AS locked_by_user
      FROM operation_transactions ot
      JOIN operation_transaction_items oti ON ot.id = oti.transaction_id
      JOIN patients p ON ot.patient_id = p.id
      JOIN operations o ON oti.operation_id = o.id
      LEFT JOIN transaction_staff_roles tsr_doc ON ot.id = tsr_doc.transaction_id AND (tsr_doc.manipulation_role LIKE '%Surgeon%' OR tsr_doc.manipulation_role LIKE '%Врач%')
      LEFT JOIN staff s_doc ON tsr_doc.staff_id = s_doc.id
      LEFT JOIN procedure_records pr ON pr.source_type = 'transaction' AND pr.source_id = ot.id AND pr.operation_id = oti.operation_id
      LEFT JOIN service_calculation_locks scl ON scl.source_type = 'transaction' AND scl.source_id = ot.id
      WHERE pr.id IS NULL

      UNION ALL

      -- 1b. Source: Legacy Operation transactions without items
      SELECT 
        'transaction' AS source_type,
        ot.id AS source_id,
        'tr:' || ot.id || ':' || ot.operation_id AS dedup_hash,
        ot.transaction_date AS service_date,
        ot.patient_id,
        COALESCE(p.full_name, (p.surname || ' ' || p.name)) AS patient_name,
        p.phone AS patient_phone,
        COALESCE(tsr.staff_id, 2) AS primary_doctor_id,
        COALESCE(s.full_name, 'Добрушкин Александр Моисеевич') AS doctor_name,
        ot.operation_id,
        o.name AS operation_name,
        ot.billed_price AS revenue,
        o.price AS catalog_price,
        COALESCE(
          (SELECT ROUND(SUM(tam.quantity_used * tam.actual_cost_at_time), 2) FROM transaction_actual_materials tam WHERE tam.transaction_id = ot.id),
          (SELECT ROUND(SUM(om.quantity * COALESCE(mc.current_unit_cost, 0)), 2) FROM operation_materials om JOIN materials_catalog mc ON om.material_id = mc.id WHERE om.operation_id = ot.operation_id),
          0.0
        ) AS materials_cost,
        1.15 AS material_cost_factor,
        MAX(0.0, ROUND(ot.billed_price - COALESCE(
          (SELECT SUM(tam.quantity_used * tam.actual_cost_at_time) FROM transaction_actual_materials tam WHERE tam.transaction_id = ot.id),
          (SELECT SUM(om.quantity * COALESCE(mc.current_unit_cost, 0)) FROM operation_materials om JOIN materials_catalog mc ON om.material_id = mc.id WHERE om.operation_id = ot.operation_id),
          0.0
        ) * 1.15, 2)) AS margin_base,
        CASE WHEN scl.expires_at > datetime('now', 'localtime') THEN 1 ELSE 0 END AS is_locked,
        scl.locked_by AS locked_by_user
      FROM operation_transactions ot
      JOIN patients p ON ot.patient_id = p.id
      JOIN operations o ON ot.operation_id = o.id
      LEFT JOIN transaction_staff_roles tsr ON ot.id = tsr.transaction_id
      LEFT JOIN staff s ON tsr.staff_id = s.id
      LEFT JOIN procedure_records pr ON pr.source_type = 'transaction' AND pr.source_id = ot.id
      LEFT JOIN service_calculation_locks scl ON scl.source_type = 'transaction' AND scl.source_id = ot.id
      WHERE pr.id IS NULL
        AND NOT EXISTS (SELECT 1 FROM operation_transaction_items oti2 WHERE oti2.transaction_id = ot.id)

      UNION ALL

      -- 2. Source: Completed Appointments without transactions (Завершенные приемы)
      SELECT 
        'appointment' AS source_type,
        a.id AS source_id,
        'app:' || a.id || ':' || a.operation_id AS dedup_hash,
        a.appointment_date || ' ' || a.start_time AS service_date,
        a.patient_id,
        COALESCE(p.full_name, (p.surname || ' ' || p.name)) AS patient_name,
        p.phone AS patient_phone,
        a.doctor_id AS primary_doctor_id,
        COALESCE(s.full_name, 'Врач клиники') AS doctor_name,
        a.operation_id,
        o.name AS operation_name,
        o.price AS revenue,
        o.price AS catalog_price,
        COALESCE(
          (SELECT ROUND(SUM(om.quantity * COALESCE(mc.current_unit_cost, 0)), 2) FROM operation_materials om JOIN materials_catalog mc ON om.material_id = mc.id WHERE om.operation_id = a.operation_id),
          0.0
        ) AS materials_cost,
        1.15 AS material_cost_factor,
        MAX(0.0, ROUND(o.price - COALESCE(
          (SELECT SUM(om.quantity * COALESCE(mc.current_unit_cost, 0)) FROM operation_materials om JOIN materials_catalog mc ON om.material_id = mc.id WHERE om.operation_id = a.operation_id),
          0.0
        ) * 1.15, 2)) AS margin_base,
        CASE WHEN scl.expires_at > datetime('now', 'localtime') THEN 1 ELSE 0 END AS is_locked,
        scl.locked_by AS locked_by_user
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN staff s ON a.doctor_id = s.id
      JOIN operations o ON a.operation_id = o.id
      LEFT JOIN procedure_records pr ON pr.source_type = 'appointment' AND pr.source_id = a.id
      LEFT JOIN service_calculation_locks scl ON scl.source_type = 'appointment' AND scl.source_id = a.id
      WHERE a.status = 'completed'
        AND a.transaction_id IS NULL
        AND pr.id IS NULL
    `);

    // 9. Initial Seed Data: Schemes
    const defaultSchemes = [
      {
        id: 1,
        name: 'Хирургия и инвазивные процедуры (Врачи)',
        desc: 'Стандартная схема хирургов-ортопедов и травматологов для операций и пункций',
        default_rate: 35.0,
        policy: 'from_actual_billed',
        max_cap: 60.0
      },
      {
        id: 2,
        name: 'Амбулаторно-консультативный прием',
        desc: 'Схема для первичных и повторных консультаций врачей-специалистов',
        default_rate: 25.0,
        policy: 'from_actual_billed',
        max_cap: 50.0
      },
      {
        id: 3,
        name: 'Сестринское ассистирование и манипуляции',
        desc: 'Схема для операционных медицинских сестер и процедурных сотрудников',
        default_rate: 10.0,
        policy: 'from_actual_billed',
        max_cap: 25.0
      }
    ];

    defaultSchemes.forEach(sch => {
      db.run(
        `INSERT OR IGNORE INTO staff_payout_schemes (id, scheme_name, description, default_rate_percent, revenue_basis_policy, max_brigade_pct_cap)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sch.id, sch.name, sch.desc, sch.default_rate, sch.policy, sch.max_cap]
      );
    });

    // 10. Initial Seed Data: Staff Payout Settings
    // Doctors: 2 -> Добрушкин (Scheme 1), 4 -> Петров (Scheme 1)
    // Nurse: 5 -> Кузнецова (Scheme 3)
    const staffSettings = [
      { staff_id: 2, scheme_id: 1, tax_rate: 13.0, salary: 0, notes: 'Главный врач, ортопед-травматолог' },
      { staff_id: 4, scheme_id: 1, tax_rate: 13.0, salary: 0, notes: 'Врач травматолог-ортопед' },
      { staff_id: 5, scheme_id: 3, tax_rate: 13.0, salary: 25000, notes: 'Старшая медицинская сестра' }
    ];

    staffSettings.forEach(s => {
      db.run(
        `INSERT OR IGNORE INTO staff_payout_settings (staff_id, scheme_id, tax_rate_percent, fixed_base_salary, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [s.staff_id, s.scheme_id, s.tax_rate, s.salary, s.notes]
      );
    });

    // 11. Initial Seed Data: Customized per-operation rates for Doctors & Nurses
    // Doctor rates for PRP (id 10), Artro (id 122), Consultation (id 2)
    const initialRates = [
      // Добрушкин А.М. (staff_id: 2)
      { staff_id: 2, operation_id: 2, role: 'primary_doctor', percent: 30.0, fixed_min: 800, notes: 'Первичный приём' },
      { staff_id: 2, operation_id: 5, role: 'primary_doctor', percent: 35.0, fixed_min: 1000, notes: 'Повторный приём' },
      { staff_id: 2, operation_id: 8, role: 'primary_doctor', percent: 35.0, fixed_min: 1200, notes: 'УЗИ мягких тканей' },
      { staff_id: 2, operation_id: 10, role: 'primary_doctor', percent: 35.0, fixed_min: 1500, notes: 'PRP-терапия' },
      { staff_id: 2, operation_id: 122, role: 'primary_doctor', percent: 40.0, fixed_min: 5000, notes: 'Сложная операция' },

      // Петров С.В. (staff_id: 4)
      { staff_id: 4, operation_id: 2, role: 'primary_doctor', percent: 25.0, fixed_min: 700, notes: 'Первичный приём' },
      { staff_id: 4, operation_id: 5, role: 'primary_doctor', percent: 30.0, fixed_min: 900, notes: 'Повторный приём' },
      { staff_id: 4, operation_id: 10, role: 'primary_doctor', percent: 30.0, fixed_min: 1200, notes: 'PRP-терапия' },

      // Кузнецова А.В. (staff_id: 5 - Nurse)
      { staff_id: 5, operation_id: 2, role: 'nurse', percent: 5.0, fixed_min: 200, notes: 'Ассистирование на первичном приеме' },
      { staff_id: 5, operation_id: 10, role: 'nurse', percent: 10.0, fixed_min: 400, notes: 'Подготовка пробирок PRP' },
      { staff_id: 5, operation_id: 122, role: 'nurse', percent: 12.0, fixed_min: 1500, notes: 'Операционная медсестра' }
    ];

    initialRates.forEach(r => {
      db.run(
        `INSERT OR IGNORE INTO staff_operation_rates (staff_id, operation_id, role_in_procedure, payout_percent, fixed_min_payout, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [r.staff_id, r.operation_id, r.role, r.percent, r.fixed_min, r.notes]
      );
    });

    db.get("SELECT 1", (err) => {
      if (err) {
        console.error('Error during initPayoutSchema:', err);
      } else {
        console.log('✓ Staff Payout module schema and seed data initialized successfully!');
      }
      if (typeof callback === 'function') {
        callback(err);
      }
    });
  });
}

// Allow standalone execution: node server/initPayoutSchema.js
if (require.main === module) {
  const db = require('./database');
  initPayoutSchema(db, (err) => {
    if (err) console.error('Error during initPayoutSchema:', err);
    process.exit(err ? 1 : 0);
  });
}

module.exports = initPayoutSchema;
