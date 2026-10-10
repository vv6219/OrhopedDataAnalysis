const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('./database');

// Helper for Promisified DB queries
const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
  });
});

// Helper for material cost factor
async function getMaterialCostFactor() {
  try {
    const row = await getAsync("SELECT param_value FROM calculation_parameters WHERE param_name = 'material_cost_factor'");
    return row && row.param_value ? Number(row.param_value) : 1.15;
  } catch {
    return 1.15;
  }
}

// -----------------------------------------------------------------------------
// 1. SCHEMES & STAFF SETTINGS
// -----------------------------------------------------------------------------

// GET /api/payouts/schemes - List payout schemes with assigned staff count
router.get('/schemes', async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.*,
        COUNT(sps.staff_id) AS assigned_staff_count
      FROM staff_payout_schemes s
      LEFT JOIN staff_payout_settings sps ON s.id = sps.scheme_id
      GROUP BY s.id
      ORDER BY s.id ASC
    `;
    const rows = await allAsync(sql);
    res.json({ success: true, schemes: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/schemes - Create new payout scheme
router.post('/schemes', async (req, res) => {
  const { scheme_name, description, default_rate_percent, revenue_basis_policy, max_brigade_pct_cap } = req.body;
  if (!scheme_name) {
    return res.status(400).json({ success: false, error: 'Название схемы обязательно' });
  }
  try {
    const sql = `
      INSERT INTO staff_payout_schemes (scheme_name, description, default_rate_percent, revenue_basis_policy, max_brigade_pct_cap)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await runAsync(sql, [
      scheme_name,
      description || '',
      default_rate_percent || 20.0,
      revenue_basis_policy || 'from_actual_billed',
      max_brigade_pct_cap || 60.0
    ]);
    res.json({ success: true, schemeId: result.lastID });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/payouts/schemes/:id - Update scheme
router.put('/schemes/:id', async (req, res) => {
  const { id } = req.params;
  const { scheme_name, description, default_rate_percent, revenue_basis_policy, max_brigade_pct_cap, is_active } = req.body;
  try {
    const sql = `
      UPDATE staff_payout_schemes
      SET scheme_name = COALESCE(?, scheme_name),
          description = COALESCE(?, description),
          default_rate_percent = COALESCE(?, default_rate_percent),
          revenue_basis_policy = COALESCE(?, revenue_basis_policy),
          max_brigade_pct_cap = COALESCE(?, max_brigade_pct_cap),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `;
    await runAsync(sql, [scheme_name, description, default_rate_percent, revenue_basis_policy, max_brigade_pct_cap, is_active, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payouts/staff-settings - List all staff with their payout settings & schemes
router.get('/staff-settings', async (req, res) => {
  try {
    const sql = `
      SELECT 
        st.id AS staff_id,
        st.full_name,
        st.role,
        st.specialization,
        st.contact_phone,
        st.status,
        sps.scheme_id,
        sch.scheme_name,
        sch.default_rate_percent AS scheme_default_rate,
        sch.revenue_basis_policy,
        sch.max_brigade_pct_cap,
        COALESCE(sps.tax_rate_percent, 13.0) AS tax_rate_percent,
        COALESCE(sps.fixed_base_salary, 0.0) AS fixed_base_salary,
        sps.payout_account_info,
        sps.notes AS settings_notes
      FROM staff st
      LEFT JOIN staff_payout_settings sps ON st.id = sps.staff_id
      LEFT JOIN staff_payout_schemes sch ON sps.scheme_id = sch.id
      ORDER BY st.id ASC
    `;
    const rows = await allAsync(sql);
    res.json({ success: true, staffSettings: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/payouts/staff-settings/:staffId - Update staff payout settings
router.put('/staff-settings/:staffId', async (req, res) => {
  const { staffId } = req.params;
  const { scheme_id, tax_rate_percent, fixed_base_salary, payout_account_info, notes } = req.body;
  try {
    const sql = `
      INSERT INTO staff_payout_settings (staff_id, scheme_id, tax_rate_percent, fixed_base_salary, payout_account_info, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(staff_id) DO UPDATE SET
        scheme_id = excluded.scheme_id,
        tax_rate_percent = excluded.tax_rate_percent,
        fixed_base_salary = excluded.fixed_base_salary,
        payout_account_info = excluded.payout_account_info,
        notes = excluded.notes,
        updated_at = datetime('now', 'localtime')
    `;
    await runAsync(sql, [staffId, scheme_id || null, tax_rate_percent || 0.0, fixed_base_salary || 0.0, payout_account_info || '', notes || '']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payouts/staff-rates/:staffId - Get custom operation rates for a staff member
router.get('/staff-rates/:staffId', async (req, res) => {
  const { staffId } = req.params;
  try {
    const sql = `
      SELECT 
        o.id AS operation_id,
        o.name AS operation_name,
        o.price AS operation_price,
        sor.id AS rate_id,
        sor.role_in_procedure,
        COALESCE(sor.payout_percent, sch.default_rate_percent, 20.0) AS effective_percent,
        sor.payout_percent AS custom_percent,
        COALESCE(sor.fixed_min_payout, 100.0) AS fixed_min_payout,
        COALESCE(sor.fixed_bonus, 0.0) AS fixed_bonus,
        sor.notes AS rate_notes
      FROM operations o
      LEFT JOIN staff_payout_settings sps ON sps.staff_id = ?
      LEFT JOIN staff_payout_schemes sch ON sps.scheme_id = sch.id
      LEFT JOIN staff_operation_rates sor ON sor.operation_id = o.id AND sor.staff_id = ?
      ORDER BY o.id ASC
    `;
    const rows = await allAsync(sql, [staffId, staffId]);
    res.json({ success: true, rates: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/staff-rates/bulk-set-min - Bulk set minimum guarantee for staff or all
router.post('/staff-rates/bulk-set-min', async (req, res) => {
  const { staffId, min_value = 100, apply_to_all_staff = false } = req.body;
  try {
    const val = Number(min_value);
    if (apply_to_all_staff) {
      await runAsync("UPDATE staff_operation_rates SET fixed_min_payout = ?", [val]);
    } else if (staffId) {
      await runAsync("UPDATE staff_operation_rates SET fixed_min_payout = ? WHERE staff_id = ?", [val, staffId]);
    }
    res.json({ success: true, min_value: val });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/payouts/staff-rates/:staffId - Batch save customized operation rates
router.put('/staff-rates/:staffId', async (req, res) => {
  const { staffId } = req.params;
  const { rates } = req.body; // Array of { operation_id, role_in_procedure, payout_percent, fixed_min_payout, fixed_bonus, notes }

  if (!Array.isArray(rates)) {
    return res.status(400).json({ success: false, error: 'Rates array is required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO staff_operation_rates (staff_id, operation_id, role_in_procedure, payout_percent, fixed_min_payout, fixed_bonus, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(staff_id, operation_id, role_in_procedure) DO UPDATE SET
        payout_percent = excluded.payout_percent,
        fixed_min_payout = excluded.fixed_min_payout,
        fixed_bonus = excluded.fixed_bonus,
        notes = excluded.notes
    `);

    db.serialize(() => {
      rates.forEach(r => {
        if (r.operation_id && r.payout_percent !== undefined) {
          stmt.run(
            staffId,
            r.operation_id,
            r.role_in_procedure || 'primary_doctor',
            Number(r.payout_percent),
            Number(r.fixed_min_payout || 0),
            Number(r.fixed_bonus || 0),
            r.notes || ''
          );
        }
      });
      stmt.finalize();
    });

    res.json({ success: true, count: rates.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. UNBILLED SERVICES QUEUE & SOFT LOCKS
// -----------------------------------------------------------------------------

// GET /api/payouts/unbilled-services - Fetch candidate services from v_unbilled_services
router.get('/unbilled-services', async (req, res) => {
  const { startDate, endDate, doctorId, search, limit = 200 } = req.query;

  try {
    let whereClauses = [];
    let params = [];

    if (startDate) {
      whereClauses.push("service_date >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push("service_date <= ?");
      params.push(endDate + ' 23:59:59');
    }
    if (doctorId) {
      whereClauses.push("primary_doctor_id = ?");
      params.push(doctorId);
    }
    if (search) {
      whereClauses.push("(patient_name LIKE ? OR operation_name LIKE ? OR doctor_name LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `
      SELECT * FROM v_unbilled_services
      ${whereSql}
      ORDER BY service_date DESC
      LIMIT ?
    `;
    params.push(Number(limit));

    const rows = await allAsync(sql, params);
    res.json({ success: true, count: rows.length, services: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/lock-services - Acquire soft lock on services for wizard
router.post('/lock-services', async (req, res) => {
  const { services, userName } = req.body; // Array of { source_type, source_id }
  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ success: false, error: 'Services array is required' });
  }

  const lockToken = crypto.randomUUID();
  const lockedBy = userName || 'Бухгалтер';
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

  try {
    // Delete expired locks first
    await runAsync("DELETE FROM service_calculation_locks WHERE expires_at < datetime('now', 'localtime')");

    await new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO service_calculation_locks (source_type, source_id, lock_token, locked_by, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      db.serialize(() => {
        services.forEach(s => {
          stmt.run(s.source_type, s.source_id, lockToken, lockedBy, expiresAt);
        });
        stmt.finalize((err) => (err ? reject(err) : resolve(null)));
      });
    });

    res.json({ success: true, lockToken, expiresAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/unlock-services - Release soft lock
router.post('/unlock-services', async (req, res) => {
  const { lockToken } = req.body;
  if (!lockToken) {
    return res.json({ success: true });
  }
  try {
    await runAsync("DELETE FROM service_calculation_locks WHERE lock_token = ?", [lockToken]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. PREVIEW CALCULATION & COMMIT (WIZARD ENGINE)
// -----------------------------------------------------------------------------

// POST /api/payouts/preview-calculation - Interactive simulation of brigade payout
router.post('/preview-calculation', async (req, res) => {
  const { services, brigade } = req.body;
  // services: Array of { source_type, source_id, operation_id, revenue, materials_cost, ... }
  // brigade: { primary_doctor_id, nurse_id, custom_doctor_pct, custom_nurse_pct }

  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ success: false, error: 'Услуги не выбраны' });
  }

  try {
    const factor = await getMaterialCostFactor();
    const docId = brigade ? Number(brigade.primary_doctor_id || 2) : 2;
    const nurseId = brigade && brigade.nurse_id ? Number(brigade.nurse_id) : 5;

    // Fetch doctor and nurse rates for these operations
    const opIds = services.map(s => Number(s.operation_id)).filter(id => !isNaN(id));
    const placeholders = opIds.map(() => '?').join(',');

    const doctorRatesRows = await allAsync(
      `SELECT operation_id, payout_percent, fixed_min_payout FROM staff_operation_rates WHERE staff_id = ? AND operation_id IN (${placeholders})`,
      [docId, ...opIds]
    );
    const nurseRatesRows = await allAsync(
      `SELECT operation_id, payout_percent, fixed_min_payout FROM staff_operation_rates WHERE staff_id = ? AND operation_id IN (${placeholders})`,
      [nurseId, ...opIds]
    );

    const docRatesMap = {};
    doctorRatesRows.forEach(r => docRatesMap[r.operation_id] = r);
    const nurseRatesMap = {};
    nurseRatesRows.forEach(r => nurseRatesMap[r.operation_id] = r);

    // Doctor & Nurse scheme default rates
    const docSettings = await getAsync(
      "SELECT sch.default_rate_percent FROM staff_payout_settings sps JOIN staff_payout_schemes sch ON sps.scheme_id = sch.id WHERE sps.staff_id = ?",
      [docId]
    );
    const nurseSettings = await getAsync(
      "SELECT sch.default_rate_percent FROM staff_payout_settings sps JOIN staff_payout_schemes sch ON sps.scheme_id = sch.id WHERE sps.staff_id = ?",
      [nurseId]
    );

    const defaultDocRate = docSettings ? docSettings.default_rate_percent : 35.0;
    const defaultNurseRate = nurseSettings ? nurseSettings.default_rate_percent : 10.0;

    let totalRevenue = 0;
    let totalMaterialsCost = 0;
    let totalMarginBase = 0;
    let totalDoctorPayout = 0;
    let totalNursePayout = 0;
    let totalStaffPayouts = 0;
    let totalClinicProfit = 0;

    const calculatedItems = services.map(svc => {
      const rev = Number(svc.revenue || 0);
      const matCost = Number(svc.materials_cost || 0);
      const margin = Math.max(0, Math.round((rev - matCost * factor) * 100) / 100);

      // Determine Doctor % and amount
      let docRate = brigade && brigade.custom_doctor_pct !== undefined && brigade.custom_doctor_pct !== null
        ? Number(brigade.custom_doctor_pct)
        : (docRatesMap[svc.operation_id] ? docRatesMap[svc.operation_id].payout_percent : defaultDocRate);
      
      let docMin = docRatesMap[svc.operation_id] ? Number(docRatesMap[svc.operation_id].fixed_min_payout ?? 100) : 100;
      let calculatedDocPayout = Math.round((margin * (docRate / 100)) * 100) / 100;
      let appliedDocMin = false;
      if (docMin > 0 && calculatedDocPayout < docMin) {
        calculatedDocPayout = docMin;
        appliedDocMin = true;
      }

      // Determine Nurse % and amount
      let nurseRate = 0;
      let calculatedNursePayout = 0;
      let appliedNurseMin = false;

      if (nurseId) {
        nurseRate = brigade && brigade.custom_nurse_pct !== undefined && brigade.custom_nurse_pct !== null
          ? Number(brigade.custom_nurse_pct)
          : (nurseRatesMap[svc.operation_id] ? nurseRatesMap[svc.operation_id].payout_percent : defaultNurseRate);
        
        let nurseMin = nurseRatesMap[svc.operation_id] ? Number(nurseRatesMap[svc.operation_id].fixed_min_payout ?? 100) : 100;
        calculatedNursePayout = Math.round((margin * (nurseRate / 100)) * 100) / 100;
        if (nurseMin > 0 && calculatedNursePayout < nurseMin) {
          calculatedNursePayout = nurseMin;
          appliedNurseMin = true;
        }
      }

      const totalItemPayout = Math.round((calculatedDocPayout + calculatedNursePayout) * 100) / 100;
      const clinicProfit = Math.round((margin - totalItemPayout) * 100) / 100;

      totalRevenue += rev;
      totalMaterialsCost += matCost;
      totalMarginBase += margin;
      totalDoctorPayout += calculatedDocPayout;
      totalNursePayout += calculatedNursePayout;
      totalStaffPayouts += totalItemPayout;
      totalClinicProfit += clinicProfit;

      return {
        ...svc,
        material_cost_factor: factor,
        margin_base: margin,
        doctor_id: docId,
        doctor_rate: docRate,
        doctor_payout: calculatedDocPayout,
        doctor_applied_min: appliedDocMin,
        nurse_id: nurseId,
        nurse_rate: nurseRate,
        nurse_payout: calculatedNursePayout,
        nurse_applied_min: appliedNurseMin,
        total_payout: totalItemPayout,
        clinic_profit: clinicProfit,
        brigade_total_pct: docRate + nurseRate
      };
    });

    const brigadePctCap = 60.0;
    const isExceedingCap = calculatedItems.some(i => i.brigade_total_pct > brigadePctCap);

    res.json({
      success: true,
      summary: {
        operationsCount: calculatedItems.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalMaterialsCost: Math.round(totalMaterialsCost * 100) / 100,
        materialCostFactor: factor,
        totalMarginBase: Math.round(totalMarginBase * 100) / 100,
        totalDoctorPayout: Math.round(totalDoctorPayout * 100) / 100,
        totalNursePayout: Math.round(totalNursePayout * 100) / 100,
        totalStaffPayouts: Math.round(totalStaffPayouts * 100) / 100,
        totalClinicProfit: Math.round(totalClinicProfit * 100) / 100,
        effectiveFotPercentage: totalMarginBase > 0 ? Math.round((totalStaffPayouts / totalMarginBase) * 1000) / 10 : 0,
        isExceedingCap
      },
      items: calculatedItems
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/commit-calculation - ACID transaction committing procedure records & accruals
router.post('/commit-calculation', async (req, res) => {
  const { calculatedItems, lockToken, notes } = req.body;

  if (!Array.isArray(calculatedItems) || calculatedItems.length === 0) {
    return res.status(400).json({ success: false, error: 'Calculated items are required' });
  }

  // Execute in SQLite transaction
  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION;", async (beginErr) => {
      if (beginErr) {
        return res.status(500).json({ success: false, error: 'Transaction start error: ' + beginErr.message });
      }

      try {
        const factor = await getMaterialCostFactor();
        let createdAccrualIds = [];
        let committedProceduresCount = 0;

        for (const item of calculatedItems) {
          const dedupHash = item.dedup_hash || `${item.source_type}:${item.source_id}:${item.operation_id}`;
          const serviceDate = item.service_date ? item.service_date.slice(0, 19) : new Date().toISOString().slice(0, 19).replace('T', ' ');

          // Check if already accrued (Deduplication Guard)
          const existing = await getAsync("SELECT id FROM procedure_records WHERE dedup_hash = ?", [dedupHash]);
          if (existing) {
            continue; // Skip already accrued service safely
          }

          // Insert into procedure_records
          const procSql = `
            INSERT INTO procedure_records (
              source_type, source_id, dedup_hash, visit_id, transaction_id, appointment_id,
              patient_id, operation_id, execution_date, billed_price, catalog_price,
              materials_cost, material_cost_factor, margin_base, total_staff_payouts,
              clinic_profit, accrual_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accrued', ?)
          `;
          const procResult = await runAsync(procSql, [
            item.source_type || 'transaction',
            item.source_id || 0,
            dedupHash,
            item.visit_id || null,
            item.source_type === 'transaction' ? item.source_id : null,
            item.source_type === 'appointment' ? item.source_id : null,
            item.patient_id,
            item.operation_id,
            serviceDate,
            item.revenue || 0,
            item.catalog_price || item.revenue || 0,
            item.materials_cost || 0,
            factor,
            item.margin_base || 0,
            item.total_payout || 0,
            item.clinic_profit || 0,
            notes || ''
          ]);

          const procId = procResult.lastID;
          committedProceduresCount++;

          // Insert Doctor accrual
          if (item.doctor_id && item.doctor_payout > 0) {
            const docAccrResult = await runAsync(`
              INSERT INTO staff_payout_accruals (
                procedure_record_id, doctor_or_staff_id, role_in_procedure, service_date,
                margin_base, payout_percent, calculated_payout, applied_min_guarantee,
                manual_adjustment, final_payout, status, notes
              ) VALUES (?, ?, 'Врач', ?, ?, ?, ?, ?, 0.0, ?, 'accrued', ?)
            `, [
              procId,
              item.doctor_id,
              serviceDate,
              item.margin_base,
              item.doctor_rate,
              item.doctor_payout,
              item.doctor_applied_min ? 1 : 0,
              item.doctor_payout,
              `Начисление врачу за процедуру: ${item.operation_name || ''}`
            ]);
            createdAccrualIds.push(docAccrResult.lastID);
          }

          // Insert Nurse accrual
          if (item.nurse_id && item.nurse_payout > 0) {
            const nurseAccrResult = await runAsync(`
              INSERT INTO staff_payout_accruals (
                procedure_record_id, doctor_or_staff_id, role_in_procedure, service_date,
                margin_base, payout_percent, calculated_payout, applied_min_guarantee,
                manual_adjustment, final_payout, status, notes
              ) VALUES (?, ?, 'Операционная сестра', ?, ?, ?, ?, ?, 0.0, ?, 'accrued', ?)
            `, [
              procId,
              item.nurse_id,
              serviceDate,
              item.margin_base,
              item.nurse_rate,
              item.nurse_payout,
              item.nurse_applied_min ? 1 : 0,
              item.nurse_payout,
              `Начисление медсестре за ассистирование: ${item.operation_name || ''}`
            ]);
            createdAccrualIds.push(nurseAccrResult.lastID);
          }
        }

        // Release soft-locks if lockToken was provided
        if (lockToken) {
          await runAsync("DELETE FROM service_calculation_locks WHERE lock_token = ?", [lockToken]);
        }

        db.run("COMMIT;", (commitErr) => {
          if (commitErr) {
            db.run("ROLLBACK;");
            return res.status(500).json({ success: false, error: 'Commit error: ' + commitErr.message });
          }
          res.json({
            success: true,
            committedProceduresCount: committedProceduresCount,
            createdAccrualsCount: createdAccrualIds.length
          });
        });
      } catch (txErr) {
        db.run("ROLLBACK;");
        res.status(500).json({ success: false, error: 'Transaction error: ' + txErr.message });
      }
    });
  });
});

// -----------------------------------------------------------------------------
// 4. ACCRUALS REGISTRY (DATAGRID) & CRUD
// -----------------------------------------------------------------------------

// GET /api/payouts/accruals - Fetch accrued payout records for DataGrid
router.get('/accruals', async (req, res) => {
  const { view = 'procedures', staffId, status, startDate, endDate, sheetId } = req.query;

  try {
    let whereClauses = [];
    let params = [];

    if (staffId) {
      whereClauses.push("spa.doctor_or_staff_id = ?");
      params.push(staffId);
    }
    if (status) {
      whereClauses.push("spa.status = ?");
      params.push(status);
    }
    if (sheetId) {
      whereClauses.push("spa.sheet_id = ?");
      params.push(sheetId);
    }
    if (startDate) {
      whereClauses.push("spa.service_date >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push("spa.service_date <= ?");
      params.push(endDate + ' 23:59:59');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    if (view === 'staff') {
      // Per-Staff Flat Accruals View
      const sql = `
        SELECT 
          spa.id,
          spa.procedure_record_id,
          spa.doctor_or_staff_id,
          st.full_name AS staff_name,
          spa.role_in_procedure,
          spa.service_date,
          spa.sheet_id,
          sps.sheet_number,
          p.full_name AS patient_name,
          o.name AS operation_name,
          pr.billed_price AS revenue,
          pr.materials_cost,
          pr.material_cost_factor,
          spa.margin_base,
          spa.payout_percent,
          spa.calculated_payout,
          spa.applied_min_guarantee,
          spa.manual_adjustment,
          spa.final_payout,
          spa.status,
          spa.is_storno,
          spa.notes
        FROM staff_payout_accruals spa
        JOIN staff st ON spa.doctor_or_staff_id = st.id
        JOIN procedure_records pr ON spa.procedure_record_id = pr.id
        JOIN patients p ON pr.patient_id = p.id
        JOIN operations o ON pr.operation_id = o.id
        LEFT JOIN staff_payout_sheets sps ON spa.sheet_id = sps.id
        ${whereSql}
        ORDER BY spa.service_date DESC, spa.id DESC
      `;
      const rows = await allAsync(sql, params);
      return res.json({ success: true, view: 'staff', count: rows.length, data: rows });
    } else {
      // Per-Procedure Brigade Aggregated View
      const procWhere = whereClauses.length > 0 ? `WHERE pr.id IN (SELECT DISTINCT procedure_record_id FROM staff_payout_accruals spa ${whereSql})` : '';
      const sql = `
        SELECT 
          pr.id,
          pr.execution_date AS service_date,
          pr.source_type,
          pr.source_id,
          pr.patient_id,
          p.full_name AS patient_name,
          p.phone AS patient_phone,
          pr.operation_id,
          o.name AS operation_name,
          pr.billed_price AS revenue,
          pr.materials_cost,
          pr.material_cost_factor,
          pr.margin_base,
          pr.total_staff_payouts,
          pr.clinic_profit,
          pr.accrual_status AS status,
          pr.notes,
          (
            SELECT json_group_array(
              json_object(
                'accrual_id', spa2.id,
                'staff_id', spa2.doctor_or_staff_id,
                'staff_name', st2.full_name,
                'role', spa2.role_in_procedure,
                'percent', spa2.payout_percent,
                'payout', spa2.final_payout,
                'status', spa2.status
              )
            )
            FROM staff_payout_accruals spa2
            JOIN staff st2 ON spa2.doctor_or_staff_id = st2.id
            WHERE spa2.procedure_record_id = pr.id
          ) AS brigade_details_json
        FROM procedure_records pr
        JOIN patients p ON pr.patient_id = p.id
        JOIN operations o ON pr.operation_id = o.id
        ${procWhere}
        ORDER BY pr.execution_date DESC, pr.id DESC
      `;
      const rows = await allAsync(sql, params);
      const parsedRows = rows.map(r => ({
        ...r,
        brigade_details: r.brigade_details_json ? JSON.parse(r.brigade_details_json) : []
      }));
      return res.json({ success: true, view: 'procedures', count: parsedRows.length, data: parsedRows });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/payouts/accruals/:id - Update single accrual (percentage, adjustment, notes, status)
router.put('/accruals/:id', async (req, res) => {
  const { id } = req.params;
  const { payout_percent, manual_adjustment, status, notes } = req.body;

  try {
    const current = await getAsync("SELECT * FROM staff_payout_accruals WHERE id = ?", [id]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Начисление не найдено' });
    }
    if (current.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Нельзя редактировать выплаченное начисление (Read-Only)' });
    }

    const newPct = payout_percent !== undefined ? Number(payout_percent) : current.payout_percent;
    const newAdj = manual_adjustment !== undefined ? Number(manual_adjustment) : current.manual_adjustment;
    const calculated = Math.round((current.margin_base * (newPct / 100)) * 100) / 100;
    const finalPayout = Math.max(0, Math.round((calculated + newAdj) * 100) / 100);

    const sql = `
      UPDATE staff_payout_accruals
      SET payout_percent = ?,
          calculated_payout = ?,
          manual_adjustment = ?,
          final_payout = ?,
          status = COALESCE(?, status),
          notes = COALESCE(?, notes)
      WHERE id = ?
    `;
    await runAsync(sql, [newPct, calculated, newAdj, finalPayout, status, notes, id]);

    // Recalculate procedure_records totals
    await runAsync(`
      UPDATE procedure_records
      SET total_staff_payouts = (SELECT COALESCE(SUM(final_payout), 0) FROM staff_payout_accruals WHERE procedure_record_id = ?),
          clinic_profit = margin_base - (SELECT COALESCE(SUM(final_payout), 0) FROM staff_payout_accruals WHERE procedure_record_id = ?)
      WHERE id = ?
    `, [current.procedure_record_id, current.procedure_record_id, current.procedure_record_id]);

    res.json({ success: true, updatedFinalPayout: finalPayout });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/payouts/accruals/:id - Cancel/annul accrual (sets status to 'cancelled')
router.delete('/accruals/:id', async (req, res) => {
  const { id } = req.params;
  const { hardDelete } = req.query;
  try {
    const current = await getAsync("SELECT * FROM staff_payout_accruals WHERE id = ?", [id]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Начисление не найдено' });
    }
    if (current.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Нельзя аннулировать выплаченное начисление' });
    }

    const procId = current.procedure_record_id;
    let newStatus = 'storno';

    if (hardDelete === 'true') {
      await runAsync("DELETE FROM staff_payout_accruals WHERE id = ?", [id]);
      const remaining = await getAsync("SELECT count(*) as count FROM staff_payout_accruals WHERE procedure_record_id = ?", [procId]);
      if (remaining.count === 0) {
        await runAsync("DELETE FROM procedure_records WHERE id = ?", [procId]);
      }
      newStatus = 'deleted';
    } else {
      // Toggle cancellation status (if already storno -> restore to accrued)
      newStatus = current.status === 'storno' ? 'accrued' : 'storno';
      const isStorno = newStatus === 'storno' ? 1 : 0;
      await runAsync("UPDATE staff_payout_accruals SET status = ?, is_storno = ? WHERE id = ?", [newStatus, isStorno, id]);
    }

    // Recalculate procedure totals excluding storno
    await runAsync(`
      UPDATE procedure_records
      SET total_staff_payouts = (SELECT COALESCE(SUM(final_payout), 0) FROM staff_payout_accruals WHERE procedure_record_id = ? AND status != 'storno'),
          clinic_profit = margin_base - (SELECT COALESCE(SUM(final_payout), 0) FROM staff_payout_accruals WHERE procedure_record_id = ? AND status != 'storno'),
          accrual_status = CASE 
            WHEN (SELECT COUNT(*) FROM staff_payout_accruals WHERE procedure_record_id = ? AND status != 'storno') = 0 THEN 'storno'
            ELSE 'accrued'
          END
      WHERE id = ?
    `, [procId, procId, procId, procId]);

    res.json({ success: true, status: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/accruals/bulk-annul - Mass annul accruals
router.post('/accruals/bulk-annul', async (req, res) => {
  const { accrualIds } = req.body;
  if (!Array.isArray(accrualIds) || accrualIds.length === 0) {
    return res.status(400).json({ success: false, error: 'Accrual IDs are required' });
  }

  try {
    const placeholders = accrualIds.map(() => '?').join(',');
    await runAsync(`UPDATE staff_payout_accruals SET status = 'storno', is_storno = 1 WHERE id IN (${placeholders}) AND status != 'paid'`, accrualIds);

    // Recalculate affected procedure records
    const procs = await allAsync(`SELECT DISTINCT procedure_record_id FROM staff_payout_accruals WHERE id IN (${placeholders})`, accrualIds);
    for (const p of procs) {
      const procId = p.procedure_record_id;
      await runAsync(`
        UPDATE procedure_records
        SET total_staff_payouts = (SELECT COALESCE(SUM(final_payout), 0) FROM staff_payout_accruals WHERE procedure_record_id = ? AND status != 'storno'),
            clinic_profit = margin_base - (SELECT COALESCE(SUM(final_payout), 0) FROM staff_payout_accruals WHERE procedure_record_id = ? AND status != 'storno'),
            accrual_status = CASE 
              WHEN (SELECT COUNT(*) FROM staff_payout_accruals WHERE procedure_record_id = ? AND status != 'storno') = 0 THEN 'storno'
              ELSE accrual_status
            END
        WHERE id = ?
      `, [procId, procId, procId, procId]);
    }

    res.json({ success: true, annulledCount: accrualIds.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/accruals/bulk-approve - Mass approve accruals
router.post('/accruals/bulk-approve', async (req, res) => {
  const { accrualIds } = req.body;
  if (!Array.isArray(accrualIds) || accrualIds.length === 0) {
    return res.status(400).json({ success: false, error: 'Accrual IDs are required' });
  }

  try {
    const placeholders = accrualIds.map(() => '?').join(',');
    await runAsync(`UPDATE staff_payout_accruals SET status = 'approved' WHERE id IN (${placeholders}) AND status != 'paid'`, accrualIds);
    res.json({ success: true, approvedCount: accrualIds.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/accruals/bulk-pay - Mass mark accruals as paid
router.post('/accruals/bulk-pay', async (req, res) => {
  const { accrualIds } = req.body;
  if (!Array.isArray(accrualIds) || accrualIds.length === 0) {
    return res.status(400).json({ success: false, error: 'Accrual IDs are required' });
  }

  try {
    const placeholders = accrualIds.map(() => '?').join(',');
    await runAsync(`UPDATE staff_payout_accruals SET status = 'paid' WHERE id IN (${placeholders}) AND status != 'storno'`, accrualIds);
    res.json({ success: true, paidCount: accrualIds.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. PAYOUT SHEETS (ВЕДОМОСТИ) & PRINT
// -----------------------------------------------------------------------------

// GET /api/payouts/sheets - List all payout sheets
router.get('/sheets', async (req, res) => {
  try {
    const sql = `
      SELECT 
        sps.*,
        st.full_name AS staff_name,
        st.role AS staff_role
      FROM staff_payout_sheets sps
      JOIN staff st ON sps.staff_id = st.id
      ORDER BY sps.period_start DESC, sps.id DESC
    `;
    const rows = await allAsync(sql);
    res.json({ success: true, sheets: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/sheets - Create payout sheet from selected accruals (auto-groups per staff)
router.post('/sheets', async (req, res) => {
  const { staff_id, period_start, period_end, accrual_ids, notes } = req.body;

  if (!period_start || !period_end || !Array.isArray(accrual_ids) || accrual_ids.length === 0) {
    return res.status(400).json({ success: false, error: 'Period and accruals are required' });
  }

  try {
    const placeholders = accrual_ids.map(() => '?').join(',');
    
    // Find staff members for selected accruals
    const staffRows = await allAsync(
      `SELECT DISTINCT doctor_or_staff_id AS staff_id FROM staff_payout_accruals WHERE id IN (${placeholders})`,
      accrual_ids
    );

    if (staffRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Не найдены начисления для ведомости' });
    }

    const targetStaffIds = staff_id ? [Number(staff_id)] : staffRows.map(s => s.staff_id);
    let createdSheets = [];

    for (const sid of targetStaffIds) {
      const staffAccruals = await allAsync(
        `SELECT id, margin_base, final_payout FROM staff_payout_accruals WHERE id IN (${placeholders}) AND doctor_or_staff_id = ?`,
        [...accrual_ids, sid]
      );
      if (staffAccruals.length === 0) continue;

      const subIds = staffAccruals.map(a => a.id);
      const subPlaceholders = subIds.map(() => '?').join(',');
      const totalMargin = staffAccruals.reduce((sum, a) => sum + (Number(a.margin_base) || 0), 0);
      const totalPayout = staffAccruals.reduce((sum, a) => sum + (Number(a.final_payout) || 0), 0);

      const sheetCountRow = await getAsync("SELECT count(*) as count FROM staff_payout_sheets");
      const sheetNum = `ВЫП-${period_start.slice(0, 7)}-${String(sheetCountRow.count + 1).padStart(3, '0')}`;

      const insertSql = `
        INSERT INTO staff_payout_sheets (
          sheet_number, staff_id, period_start, period_end, total_operations_count,
          total_margin_base, total_payout_amount, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
      `;
      const result = await runAsync(insertSql, [
        sheetNum,
        sid,
        period_start,
        period_end,
        staffAccruals.length,
        Math.round(totalMargin * 100) / 100,
        Math.round(totalPayout * 100) / 100,
        notes || ''
      ]);

      const sheetId = result.lastID;
      await runAsync(
        `UPDATE staff_payout_accruals SET sheet_id = ?, status = 'in_sheet' WHERE id IN (${subPlaceholders})`,
        [sheetId, ...subIds]
      );

      createdSheets.push({ sheetId, sheetNumber: sheetNum, staffId: sid, count: staffAccruals.length });
    }

    res.json({
      success: true,
      sheets: createdSheets,
      sheetId: createdSheets[0]?.sheetId,
      sheetNumber: createdSheets[0]?.sheetNumber
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payouts/sheets/:id - Get full sheet with deep details for printing
router.get('/sheets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sheet = await getAsync(`
      SELECT 
        sps.*,
        st.full_name AS staff_name,
        st.role AS staff_role,
        st.specialization,
        sps_set.tax_rate_percent,
        sps_set.payout_account_info
      FROM staff_payout_sheets sps
      JOIN staff st ON sps.staff_id = st.id
      LEFT JOIN staff_payout_settings sps_set ON sps.staff_id = sps_set.staff_id
      WHERE sps.id = ?
    `, [id]);

    if (!sheet) {
      return res.status(404).json({ success: false, error: 'Ведомость не найдена' });
    }

    const items = await allAsync(`
      SELECT 
        spa.id AS accrual_id,
        spa.service_date,
        spa.role_in_procedure,
        p.full_name AS patient_name,
        o.name AS operation_name,
        pr.billed_price AS revenue,
        pr.materials_cost,
        pr.material_cost_factor,
        spa.margin_base,
        spa.payout_percent,
        spa.calculated_payout,
        spa.applied_min_guarantee,
        spa.manual_adjustment,
        spa.final_payout,
        spa.notes
      FROM staff_payout_accruals spa
      JOIN procedure_records pr ON spa.procedure_record_id = pr.id
      JOIN patients p ON pr.patient_id = p.id
      JOIN operations o ON pr.operation_id = o.id
      WHERE spa.sheet_id = ?
      ORDER BY spa.service_date ASC, spa.id ASC
    `, [id]);

    res.json({ success: true, sheet, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/payouts/sheets/:id/status - Update sheet status (draft -> approved -> paid)
router.put('/sheets/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, approved_by, payment_order_number } = req.body;

  try {
    const current = await getAsync("SELECT * FROM staff_payout_sheets WHERE id = ?", [id]);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Ведомость не найдена' });
    }

    let approvedAt = current.approved_at;
    let paidAt = current.paid_at;

    if (status === 'approved' && !approvedAt) {
      approvedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    if (status === 'paid' && !paidAt) {
      paidAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    await runAsync(`
      UPDATE staff_payout_sheets
      SET status = ?,
          approved_by = COALESCE(?, approved_by),
          approved_at = ?,
          paid_at = ?,
          payment_order_number = COALESCE(?, payment_order_number)
      WHERE id = ?
    `, [status, approved_by, approvedAt, paidAt, payment_order_number, id]);

    // Update child accruals status to match sheet
    const accrualStatus = status === 'paid' ? 'paid' : (status === 'approved' ? 'approved' : 'in_sheet');
    await runAsync("UPDATE staff_payout_accruals SET status = ? WHERE sheet_id = ?", [accrualStatus, id]);

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 6. EXECUTIVE BI DASHBOARD & ANALYTICS
// -----------------------------------------------------------------------------

// GET /api/payouts/analytics/kpi-summary - Top KPI metrics
router.get('/analytics/kpi-summary', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let whereClauses = [];
    let params = [];
    if (startDate) {
      whereClauses.push("service_date >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push("service_date <= ?");
      params.push(endDate + ' 23:59:59');
    }
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const summary = await getAsync(`
      SELECT 
        COUNT(DISTINCT spa.procedure_record_id) AS total_operations,
        COUNT(DISTINCT spa.doctor_or_staff_id) AS active_staff_count,
        COALESCE(SUM(pr.billed_price), 0) AS total_revenue,
        COALESCE(SUM(pr.materials_cost * pr.material_cost_factor), 0) AS total_materials_cost,
        COALESCE(SUM(spa.margin_base), 0) AS total_margin_base,
        COALESCE(SUM(spa.final_payout), 0) AS total_payout_amount,
        COALESCE(AVG(spa.payout_percent), 0) AS avg_payout_percent
      FROM staff_payout_accruals spa
      JOIN procedure_records pr ON spa.procedure_record_id = pr.id
      ${whereSql}
    `, params);

    const docCountRow = await getAsync(`
      SELECT COUNT(DISTINCT spa.doctor_or_staff_id) AS doc_count 
      FROM staff_payout_accruals spa 
      JOIN staff s ON spa.doctor_or_staff_id = s.id 
      WHERE (s.role LIKE '%врач%' OR s.role LIKE '%хирург%')
      ${whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : ''}
    `, params);

    const nurseCountRow = await getAsync(`
      SELECT COUNT(DISTINCT spa.doctor_or_staff_id) AS nurse_count 
      FROM staff_payout_accruals spa 
      JOIN staff s ON spa.doctor_or_staff_id = s.id 
      WHERE (s.role LIKE '%сестра%' OR s.role LIKE '%ассистент%')
      ${whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : ''}
    `, params);

    const margin = summary.total_margin_base || 1;
    const fotPercentage = Math.round((summary.total_payout_amount / margin) * 1000) / 10;
    const avgPerOperation = summary.total_operations > 0 ? Math.round(summary.total_payout_amount / summary.total_operations) : 0;

    res.json({
      success: true,
      kpis: {
        totalOperations: summary.total_operations,
        totalRevenue: Math.round(summary.total_revenue),
        totalMaterialsCost: Math.round(summary.total_materials_cost),
        totalMarginBase: Math.round(summary.total_margin_base),
        totalPayoutAmount: Math.round(summary.total_payout_amount),
        clinicProfit: Math.round(summary.total_margin_base - summary.total_payout_amount),
        fotPercentage,
        avgPerOperation,
        activeStaffCount: summary.active_staff_count,
        doctorsCount: docCountRow.doc_count,
        nursesCount: nurseCountRow.nurse_count
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payouts/analytics/staff-ranking - Staff ranking & ROI
router.get('/analytics/staff-ranking', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let whereClauses = [];
    let params = [];
    if (startDate) {
      whereClauses.push("spa.service_date >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push("spa.service_date <= ?");
      params.push(endDate + ' 23:59:59');
    }
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        s.id AS staff_id,
        s.full_name AS staff_name,
        s.role AS staff_role,
        COUNT(spa.id) AS operations_count,
        ROUND(SUM(pr.billed_price), 2) AS generated_revenue,
        ROUND(SUM(spa.margin_base), 2) AS total_margin,
        ROUND(SUM(spa.final_payout), 2) AS total_payout,
        ROUND(AVG(spa.payout_percent), 1) AS avg_percent,
        ROUND(SUM(pr.billed_price) / NULLIF(SUM(spa.final_payout), 0), 2) AS roi_multiplier
      FROM staff_payout_accruals spa
      JOIN staff s ON spa.doctor_or_staff_id = s.id
      JOIN procedure_records pr ON spa.procedure_record_id = pr.id
      ${whereSql}
      GROUP BY s.id
      ORDER BY total_payout DESC
    `;
    const rows = await allAsync(sql, params);
    res.json({ success: true, ranking: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payouts/analytics/roles-distribution - Doctors vs Nurses breakdown
router.get('/analytics/roles-distribution', async (req, res) => {
  try {
    const sql = `
      SELECT 
        spa.role_in_procedure AS role_name,
        COUNT(spa.id) AS operations_count,
        ROUND(SUM(spa.final_payout), 2) AS total_payout,
        ROUND(AVG(spa.payout_percent), 1) AS avg_percent
      FROM staff_payout_accruals spa
      GROUP BY spa.role_in_procedure
    `;
    const rows = await allAsync(sql);
    res.json({ success: true, distribution: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payouts/analytics/monthly-trends - Monthly Stacked Bar trends
router.get('/analytics/monthly-trends', async (req, res) => {
  try {
    const sql = `
      SELECT 
        strftime('%Y-%m', spa.service_date) AS month,
        ROUND(SUM(pr.billed_price), 2) AS revenue,
        ROUND(SUM(pr.materials_cost * pr.material_cost_factor), 2) AS materials_cost,
        ROUND(SUM(CASE WHEN spa.role_in_procedure LIKE '%врач%' THEN spa.final_payout ELSE 0 END), 2) AS doctor_payouts,
        ROUND(SUM(CASE WHEN spa.role_in_procedure LIKE '%сестра%' THEN spa.final_payout ELSE 0 END), 2) AS nurse_payouts,
        ROUND(SUM(spa.final_payout), 2) AS total_payouts,
        ROUND(SUM(pr.margin_base) - SUM(spa.final_payout), 2) AS clinic_profit
      FROM staff_payout_accruals spa
      JOIN procedure_records pr ON spa.procedure_record_id = pr.id
      WHERE spa.service_date IS NOT NULL
      GROUP BY strftime('%Y-%m', spa.service_date)
      ORDER BY month ASC
      LIMIT 12
    `;
    const rows = await allAsync(sql);
    res.json({ success: true, trends: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/payouts/analytics/margin-waterfall - Waterfall structure of each 1,000 rubles
router.get('/analytics/margin-waterfall', async (req, res) => {
  try {
    const row = await getAsync(`
      SELECT 
        COALESCE(SUM(pr.billed_price), 0) AS total_revenue,
        COALESCE(SUM(pr.materials_cost * pr.material_cost_factor), 0) AS materials,
        COALESCE(SUM(CASE WHEN spa.role_in_procedure LIKE '%врач%' THEN spa.final_payout ELSE 0 END), 0) AS doctor_fot,
        COALESCE(SUM(CASE WHEN spa.role_in_procedure LIKE '%сестра%' THEN spa.final_payout ELSE 0 END), 0) AS nurse_fot
      FROM staff_payout_accruals spa
      JOIN procedure_records pr ON spa.procedure_record_id = pr.id
    `);

    const rev = row.total_revenue || 1000;
    const perThousand = {
      materials: Math.round((row.materials / rev) * 1000),
      doctor_fot: Math.round((row.doctor_fot / rev) * 1000),
      nurse_fot: Math.round((row.nurse_fot / rev) * 1000),
      clinic_profit: Math.round(((rev - row.materials - row.doctor_fot - row.nurse_fot) / rev) * 1000)
    };

    res.json({ success: true, perThousand, raw: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 7. DAEMON TEST DATA MANAGEMENT (ADMIN ACTIONS)
// -----------------------------------------------------------------------------

// GET /api/payouts/daemon/status - Get counts of test daemon records in database
router.get('/daemon/status', async (req, res) => {
  try {
    const accRow = await getAsync("SELECT count(*) as count FROM staff_payout_accruals WHERE notes LIKE '%[TEST_DAEMON]%'");
    const sheetRow = await getAsync("SELECT count(*) as count FROM staff_payout_sheets WHERE sheet_number LIKE '%TEST-DAEMON%' OR notes LIKE '%[TEST_DAEMON]%'");
    const procRow = await getAsync("SELECT count(*) as count FROM procedure_records WHERE notes LIKE '%[TEST_DAEMON]%' OR dedup_hash LIKE 'daemon:%'");
    const lockRow = await getAsync("SELECT count(*) as count FROM service_calculation_locks WHERE locked_by LIKE '%[TEST_DAEMON]%'");
    const schemeRow = await getAsync("SELECT count(*) as count FROM staff_payout_schemes WHERE scheme_name LIKE '%[TEST_DAEMON]%'");
    const staffRow = await getAsync("SELECT count(*) as count FROM staff WHERE full_name LIKE '%[TEST_DAEMON]%'");
    const patRow = await getAsync("SELECT count(*) as count FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%'");
    const opRow = await getAsync("SELECT count(*) as count FROM operations WHERE name LIKE '%[TEST_DAEMON]%'");
    const matRow = await getAsync("SELECT count(*) as count FROM materials_catalog WHERE material_name LIKE '%[TEST_DAEMON]%'");
    const transRow = await getAsync("SELECT count(*) as count FROM operation_transactions WHERE notes LIKE '%[TEST_DAEMON]%'");

    res.json({
      success: true,
      stats: {
        accrualsCount: accRow.count,
        sheetsCount: sheetRow.count,
        proceduresCount: procRow.count,
        locksCount: lockRow.count,
        schemesCount: schemeRow.count,
        staffCount: staffRow.count,
        patientsCount: patRow.count,
        operationsCount: opRow.count,
        materialsCount: matRow.count,
        transactionsCount: transRow.count,
        hasTestData: (accRow.count + sheetRow.count + procRow.count + staffRow.count + patRow.count + opRow.count) > 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/daemon/seed - Seed daemon test dataset
router.post('/daemon/seed', async (req, res) => {
  try {
    const { seedDaemonTestData } = require('./seedDaemonTestData');
    await seedDaemonTestData();
    res.json({ success: true, message: 'Тестовые данные [TEST_DAEMON] успешно сгенерированы и загружены в БД' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/daemon/purge - Purge all daemon test data
router.post('/daemon/purge', async (req, res) => {
  try {
    const { purgeDaemonData } = require('./purgeDaemonTestData');
    await purgeDaemonData();
    res.json({ success: true, message: 'Все тестовые данные с маркером [TEST_DAEMON] успешно удалены' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payouts/daemon/run-tests - Run the automated flow test suite
router.post('/daemon/run-tests', async (req, res) => {
  try {
    const { runTestSuite } = require('./testPayoutFlow');
    const testSummary = await runTestSuite();
    res.json({
      success: true,
      passed: testSummary.passed,
      failed: testSummary.failed,
      results: testSummary.results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
