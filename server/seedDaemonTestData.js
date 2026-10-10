/**
 * seedDaemonTestData.js
 * Полная генерация тестового контура [TEST_DAEMON] для всех сущностей и шагов:
 * - Персонал (Staff): Врачи и медицинские сестры с персональными тарифами
 * - Пациенты (Patients): Изолированные тестовые карточки пациентов
 * - Операции и услуги (Operations): Каталог вмешательств клиники
 * - Материалы и расходники (Materials Catalog): Прейскурант медикаментов и расходников
 * - Очередь нерассчитанных услуг: Транзакции и завершенные приемы для flow-тестов
 * - 3 расчетных периода (Август: paid, Сентябрь: approved + сторно, Октябрь: draft)
 * - Расчеты по всем кейсам (A, B: PRP, C: нулевая маржа/фикс-гарантия, E: сторно)
 * - Активные блокировки и тестовые ведомости
 */

const db = require('./database');
const { purgeDaemonData } = require('./purgeDaemonTestData');

const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

async function seedDaemonTestData() {
  console.log('===============================================================');
  console.log('>>> Генерация изолированного набора данных [TEST_DAEMON] <<<');
  console.log('===============================================================');

  // 1. Очистка старых тестовых данных
  await purgeDaemonData();

  const factor = 1.15;

  // 2. Тестовая схема с высоким процентом для проверки превышения лимита (Cap)
  const capSchemeRes = await runAsync(`
    INSERT INTO staff_payout_schemes (scheme_name, description, default_rate_percent, revenue_basis_policy, max_brigade_pct_cap, is_active)
    VALUES ('[TEST_DAEMON] Схема повышенной нагрузки', 'Тестовая схема с завышенной долей для валидации Cap', 50.0, 'from_actual_billed', 60.0, 1)
  `);
  console.log(`✓ Создана тестовая схема ID: ${capSchemeRes.lastID}`);

  // 3. Создание выделенных тестовых сотрудников [TEST_DAEMON]
  const docIvanovRes = await runAsync(`
    INSERT INTO staff (full_name, role, specialization, contact_phone, email, status)
    VALUES ('[TEST_DAEMON] Д-р Иванов Иван Иванович', 'Врач травматолог-ортопед', 'Ортопедия и хирургия суставов', '+7 (999) 000-01-01', 'daemon.ivanov@orthoped.test', 'active')
  `);
  const docIvanovId = docIvanovRes.lastID;

  const docSmirnovRes = await runAsync(`
    INSERT INTO staff (full_name, role, specialization, contact_phone, email, status)
    VALUES ('[TEST_DAEMON] Д-р Смирнов Алексей Петрович', 'Врач травматолог-ортопед', 'Амбулаторная ортопедия', '+7 (999) 000-01-02', 'daemon.smirnov@orthoped.test', 'active')
  `);
  const docSmirnovId = docSmirnovRes.lastID;

  const nurseVasilievaRes = await runAsync(`
    INSERT INTO staff (full_name, role, specialization, contact_phone, email, status)
    VALUES ('[TEST_DAEMON] Сестра Васильева Мария Сергеевна', 'Операционная сестра', 'Сестринское дело в хирургии', '+7 (999) 000-01-03', 'daemon.vasilieva@orthoped.test', 'active')
  `);
  const nurseVasilievaId = nurseVasilievaRes.lastID;

  console.log(`✓ Созданы сотрудники Staff: Иванов (${docIvanovId}), Смирнов (${docSmirnovId}), Васильева (${nurseVasilievaId})`);

  // 4. Создание выделенных тестовых пациентов [TEST_DAEMON]
  const patPetrovRes = await runAsync(`
    INSERT INTO patients (
      surname, name, patron, full_name, brief_name, phone, sphone, bdate, age, sex, sex_display,
      mednum, last_visit_date, total_visits, total_spent, rdate, city, address
    ) VALUES (
      '[TEST_DAEMON] Петров', 'Константин', 'Павлович', '[TEST_DAEMON] Петров Константин Павлович', 'Петров К.П.',
      '+7 (999) 000-02-01', '+7 (999) 000-02-01', '1985-05-15', 41, 1, 'М',
      99001, '2026-10-08 14:00:00', 3, 24000.0, '2026-08-01', 'г. Сочи', 'ул. Тестовая, д. 10'
    )
  `);
  const patPetrovId = patPetrovRes.lastID;

  const patSidorovaRes = await runAsync(`
    INSERT INTO patients (
      surname, name, patron, full_name, brief_name, phone, sphone, bdate, age, sex, sex_display,
      mednum, last_visit_date, total_visits, total_spent, rdate, city, address
    ) VALUES (
      '[TEST_DAEMON] Сидорова', 'Елена', 'Владимировна', '[TEST_DAEMON] Сидорова Елена Владимировна', 'Сидорова Е.В.',
      '+7 (999) 000-02-02', '+7 (999) 000-02-02', '1990-08-20', 36, 2, 'Ж',
      99002, '2026-10-07 11:30:00', 2, 5500.0, '2026-08-10', 'г. Сочи', 'ул. Тестовая, д. 12'
    )
  `);
  const patSidorovaId = patSidorovaRes.lastID;

  const patKuznetsovRes = await runAsync(`
    INSERT INTO patients (
      surname, name, patron, full_name, brief_name, phone, sphone, bdate, age, sex, sex_display,
      mednum, last_visit_date, total_visits, total_spent, rdate, city, address
    ) VALUES (
      '[TEST_DAEMON] Кузнецов', 'Игорь', 'Алексеевич', '[TEST_DAEMON] Кузнецов Игорь Алексеевич', 'Кузнецов И.А.',
      '+7 (999) 000-02-03', '+7 (999) 000-02-03', '1978-11-10', 48, 1, 'М',
      99003, '2026-10-06 16:00:00', 1, 3000.0, '2026-09-01', 'г. Сочи', 'ул. Тестовая, д. 15'
    )
  `);
  const patKuznetsovId = patKuznetsovRes.lastID;

  console.log(`✓ Созданы пациенты: Петров (${patPetrovId}), Сидорова (${patSidorovaId}), Кузнецов (${patKuznetsovId})`);

  // 5. Создание выделенных тестовых операций [TEST_DAEMON]
  const opConsultRes = await runAsync(`
    INSERT INTO operations (name, price)
    VALUES ('[TEST_DAEMON] Первичный прием врача ортопеда-травматолога', 3000.0)
  `);
  const opConsultId = opConsultRes.lastID;

  const opPRPRes = await runAsync(`
    INSERT INTO operations (name, price)
    VALUES ('[TEST_DAEMON] PRP-терапия коленного сустава', 18000.0)
  `);
  const opPRPId = opPRPRes.lastID;

  const opUziRes = await runAsync(`
    INSERT INTO operations (name, price)
    VALUES ('[TEST_DAEMON] Контроль УЗИ при сложной инъекции (высокий расход)', 2500.0)
  `);
  const opUziId = opUziRes.lastID;

  const opArthroRes = await runAsync(`
    INSERT INTO operations (name, price)
    VALUES ('[TEST_DAEMON] Артроскопия диагностическая коленного сустава', 35000.0)
  `);
  const opArthroId = opArthroRes.lastID;

  console.log(`✓ Созданы операции: Консультация (${opConsultId}), PRP (${opPRPId}), УЗИ (${opUziId}), Артроскопия (${opArthroId})`);

  // 6. Создание выделенных тестовых материалов [TEST_DAEMON]
  const matConsultRes = await runAsync(`
    INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost, package_cost)
    VALUES ('[TEST_DAEMON] Набор смотровой одноразовый (шпатель, перчатки, бахилы)', 'компл', 15.0, 15.0)
  `);
  const matConsultId = matConsultRes.lastID;

  const matPRPRes = await runAsync(`
    INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost, package_cost)
    VALUES ('[TEST_DAEMON] Комплект пробирок и центрифужных расходников PRP RegenLab', 'уп', 6200.0, 6200.0)
  `);
  const matPRPId = matPRPRes.lastID;

  const matUziRes = await runAsync(`
    INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost, package_cost)
    VALUES ('[TEST_DAEMON] Расходные материалы УЗИ (гель стерильный и катетер)', 'компл', 2400.0, 2400.0)
  `);
  const matUziId = matUziRes.lastID;

  const matArthroRes = await runAsync(`
    INSERT INTO materials_catalog (material_name, unit_of_measure, current_unit_cost, package_cost)
    VALUES ('[TEST_DAEMON] Комплект портов и канюль для артроскопии', 'компл', 12000.0, 12000.0)
  `);
  const matArthroId = matArthroRes.lastID;

  console.log(`✓ Созданы материалы: Смотровой (${matConsultId}), PRP (${matPRPId}), УЗИ (${matUziId}), Артроскопия (${matArthroId})`);

  // Связка операций и материалов по умолчанию в operation_materials
  await runAsync("INSERT INTO operation_materials (operation_id, material_id, quantity) VALUES (?, ?, 1.0)", [opConsultId, matConsultId]);
  await runAsync("INSERT INTO operation_materials (operation_id, material_id, quantity) VALUES (?, ?, 1.0)", [opPRPId, matPRPId]);
  await runAsync("INSERT INTO operation_materials (operation_id, material_id, quantity) VALUES (?, ?, 1.0)", [opUziId, matUziId]);
  await runAsync("INSERT INTO operation_materials (operation_id, material_id, quantity) VALUES (?, ?, 1.0)", [opArthroId, matArthroId]);

  // 7. Привязка тестовых сотрудников к схемам
  await runAsync(`
    INSERT INTO staff_payout_settings (staff_id, scheme_id, tax_rate_percent, payout_account_info, notes)
    VALUES (?, 1, 13.0, 'Счет: 40817810000000001001', '[TEST_DAEMON] Ведущий хирург ортопед')
  `, [docIvanovId]);

  await runAsync(`
    INSERT INTO staff_payout_settings (staff_id, scheme_id, tax_rate_percent, payout_account_info, notes)
    VALUES (?, 2, 13.0, 'Счет: 40817810000000001002', '[TEST_DAEMON] Врач консультант')
  `, [docSmirnovId]);

  await runAsync(`
    INSERT INTO staff_payout_settings (staff_id, scheme_id, tax_rate_percent, payout_account_info, notes)
    VALUES (?, 3, 13.0, 'Счет: 40817810000000001003', '[TEST_DAEMON] Старшая операционная сестра')
  `, [nurseVasilievaId]);

  // 8. Персональные ставки процедур для созданных daemon-операций
  // Врач Иванов (хирург)
  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 35.0, 1000.0, '[TEST_DAEMON] Индивидуальный тариф консультации')
  `, [docIvanovId, opConsultId]);

  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 35.0, 1500.0, '[TEST_DAEMON] Индивидуальный фикс PRP 1500 руб. (ставка 35%)')
  `, [docIvanovId, opPRPId]);

  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 35.0, 1500.0, '[TEST_DAEMON] Индивидуальный фикс УЗИ 1500 руб.')
  `, [docIvanovId, opUziId]);

  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 35.0, 5000.0, '[TEST_DAEMON] Индивидуальный фикс артроскопии 5000 руб.')
  `, [docIvanovId, opArthroId]);

  // Врач Смирнов (консультант)
  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 25.0, 1000.0, '[TEST_DAEMON] Консультация Смирнова 25%')
  `, [docSmirnovId, opConsultId]);

  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 35.0, 1500.0, '[TEST_DAEMON] PRP Смирнова 35%')
  `, [docSmirnovId, opPRPId]);

  // Сестра Васильева
  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 10.0, 0.0, '[TEST_DAEMON] Ставка медсестры консультации 10% (без фикс-минимума)')
  `, [nurseVasilievaId, opConsultId]);

  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 10.0, 400.0, '[TEST_DAEMON] Фикс-минимум медсестры PRP 400 руб.')
  `, [nurseVasilievaId, opPRPId]);

  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 10.0, 400.0, '[TEST_DAEMON] Фикс-минимум медсестры УЗИ 400 руб.')
  `, [nurseVasilievaId, opUziId]);

  await runAsync(`
    INSERT INTO staff_operation_rates (staff_id, operation_id, payout_percent, fixed_min_payout, notes)
    VALUES (?, ?, 10.0, 1000.0, '[TEST_DAEMON] Фикс-минимум медсестры артроскопии 1000 руб.')
  `, [nurseVasilievaId, opArthroId]);

  // 9. Создание тестовых нерассчитанных транзакций и приемов (очередь начисления)
  const unbilledTrPRP = await runAsync(`
    INSERT INTO operation_transactions (patient_id, operation_id, transaction_date, billed_price, calculated_cost, net_profit, notes)
    VALUES (?, ?, '2026-10-10 10:00:00', 18000.0, 6200.0, 11800.0, '[TEST_DAEMON] Нерассчитанная услуга PRP')
  `, [patPetrovId, opPRPId]);
  const trPRPId = unbilledTrPRP.lastID;

  await runAsync(`
    INSERT INTO transaction_actual_materials (transaction_id, material_id, quantity_used, actual_cost_at_time)
    VALUES (?, ?, 1.0, 6200.0)
  `, [trPRPId, matPRPId]);

  await runAsync(`
    INSERT INTO transaction_staff_roles (transaction_id, staff_id, manipulation_role)
    VALUES (?, ?, 'Primary Surgeon')
  `, [trPRPId, docIvanovId]);

  const unbilledTrUzi = await runAsync(`
    INSERT INTO operation_transactions (patient_id, operation_id, transaction_date, billed_price, calculated_cost, net_profit, notes)
    VALUES (?, ?, '2026-10-11 11:30:00', 2500.0, 2400.0, 100.0, '[TEST_DAEMON] Нерассчитанная услуга УЗИ (нулевая маржа)')
  `, [patSidorovaId, opUziId]);
  const trUziId = unbilledTrUzi.lastID;

  await runAsync(`
    INSERT INTO transaction_actual_materials (transaction_id, material_id, quantity_used, actual_cost_at_time)
    VALUES (?, ?, 1.0, 2400.0)
  `, [trUziId, matUziId]);

  await runAsync(`
    INSERT INTO transaction_staff_roles (transaction_id, staff_id, manipulation_role)
    VALUES (?, ?, 'Primary Surgeon')
  `, [trUziId, docIvanovId]);

  const unbilledTrConsult = await runAsync(`
    INSERT INTO operation_transactions (patient_id, operation_id, transaction_date, billed_price, calculated_cost, net_profit, notes)
    VALUES (?, ?, '2026-10-12 14:00:00', 3000.0, 15.0, 2985.0, '[TEST_DAEMON] Нерассчитанная услуга Консультация')
  `, [patKuznetsovId, opConsultId]);
  const trConsultId = unbilledTrConsult.lastID;

  await runAsync(`
    INSERT INTO transaction_actual_materials (transaction_id, material_id, quantity_used, actual_cost_at_time)
    VALUES (?, ?, 1.0, 15.0)
  `, [trConsultId, matConsultId]);

  await runAsync(`
    INSERT INTO transaction_staff_roles (transaction_id, staff_id, manipulation_role)
    VALUES (?, ?, 'Primary Surgeon')
  `, [trConsultId, docSmirnovId]);

  const unbilledApp = await runAsync(`
    INSERT INTO appointments (patient_id, doctor_id, operation_id, appointment_date, start_time, end_time, status, notes)
    VALUES (?, ?, ?, '2026-10-13', '09:00', '09:30', 'completed', '[TEST_DAEMON] Нерассчитанный завершенный прием')
  `, [patPetrovId, docIvanovId, opConsultId]);
  const appId = unbilledApp.lastID;

  console.log(`✓ Созданы нерассчитанные транзакции: PRP (${trPRPId}), УЗИ (${trUziId}), Консультация (${trConsultId}), Прием (${appId})`);

  // 10. Создание 3 ведомостей: Август (paid), Сентябрь (in_sheet/approved), Октябрь (draft)
  const augSheet = await runAsync(`
    INSERT INTO staff_payout_sheets (
      sheet_number, staff_id, period_start, period_end, status, 
      total_operations_count, total_margin_base, total_payout_amount, 
      approved_by, approved_at, paid_at, notes
    ) VALUES (
      'V-TEST-DAEMON-2026-08-001', ?, '2026-08-01', '2026-08-31', 'paid',
      0, 0, 0, 'admin', '2026-09-02 10:00:00', '2026-09-05 14:30:00',
      '[TEST_DAEMON] Архивный закрытый период за август 2026'
    )
  `, [docIvanovId]);

  const sepSheet = await runAsync(`
    INSERT INTO staff_payout_sheets (
      sheet_number, staff_id, period_start, period_end, status, 
      total_operations_count, total_margin_base, total_payout_amount, 
      approved_by, approved_at, notes
    ) VALUES (
      'V-TEST-DAEMON-2026-09-001', ?, '2026-09-01', '2026-09-30', 'approved',
      0, 0, 0, 'admin', '2026-10-02 11:15:00',
      '[TEST_DAEMON] Утвержденный период за сентябрь 2026'
    )
  `, [docIvanovId]);

  const octSheet = await runAsync(`
    INSERT INTO staff_payout_sheets (
      sheet_number, staff_id, period_start, period_end, status, 
      total_operations_count, total_margin_base, total_payout_amount, notes
    ) VALUES (
      'V-TEST-DAEMON-2026-10-001', ?, '2026-10-01', '2026-10-31', 'draft',
      0, 0, 0, '[TEST_DAEMON] Текущий расчетный период за октябрь 2026'
    )
  `, [docSmirnovId]);

  const sheets = {
    aug: augSheet.lastID,
    sep: sepSheet.lastID,
    oct: octSheet.lastID
  };

  console.log(`✓ Созданы ведомости: Август (${sheets.aug}), Сентябрь (${sheets.sep}), Октябрь (${sheets.oct})`);

  // Хелпер создания процедуры и начислений бригаде
  let procCounter = 99000;
  async function createProcedureAndAccruals({
    sheetId,
    executionDate,
    patientId = patPetrovId,
    operationId,
    operationName,
    billedPrice,
    materialsCost,
    doctorId = docIvanovId,
    doctorRate,
    doctorMinGuarantee = 1500,
    nurseId = nurseVasilievaId,
    nurseRate = 10,
    nurseMinGuarantee = 400,
    status = 'accrued',
    notes = '[TEST_DAEMON]'
  }) {
    procCounter++;
    const dedupHash = `daemon:tr:${procCounter}:${operationId}`;
    const effectiveMaterials = Math.round(materialsCost * factor * 100) / 100;
    const marginBase = Math.max(0, Math.round((billedPrice - effectiveMaterials) * 100) / 100);

    // Расчет для врача
    const rawDocPayout = Math.round((marginBase * (doctorRate / 100)) * 100) / 100;
    const docAppliedMin = rawDocPayout < doctorMinGuarantee;
    const finalDocPayout = docAppliedMin ? doctorMinGuarantee : rawDocPayout;

    // Расчет для сестры
    const rawNursePayout = Math.round((marginBase * (nurseRate / 100)) * 100) / 100;
    const nurseAppliedMin = rawNursePayout < nurseMinGuarantee;
    const finalNursePayout = nurseAppliedMin ? nurseMinGuarantee : rawNursePayout;

    const totalPayout = finalDocPayout + finalNursePayout;
    const clinicProfit = Math.round((marginBase - totalPayout) * 100) / 100;

    // Запись процедуры
    const procRes = await runAsync(`
      INSERT INTO procedure_records (
        source_type, source_id, dedup_hash, transaction_id, patient_id, operation_id,
        execution_date, billed_price, catalog_price, materials_cost, material_cost_factor,
        margin_base, total_staff_payouts, clinic_profit, accrual_status, notes
      ) VALUES (
        'manual', ?, ?, NULL, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `, [
      procCounter, dedupHash, patientId, operationId,
      executionDate, billedPrice, billedPrice, materialsCost, factor,
      marginBase, totalPayout, clinicProfit, status, notes
    ]);

    const procId = procRes.lastID;

    // Начисление врачу
    const docAccrRes = await runAsync(`
      INSERT INTO staff_payout_accruals (
        sheet_id, procedure_record_id, doctor_or_staff_id, role_in_procedure,
        service_date, margin_base, payout_percent, calculated_payout, applied_min_guarantee,
        manual_adjustment, final_payout, status, notes
      ) VALUES (
        ?, ?, ?, 'Врач',
        ?, ?, ?, ?, ?,
        0.0, ?, ?, ?
      )
    `, [
      sheetId, procId, doctorId,
      executionDate, marginBase, doctorRate, rawDocPayout, docAppliedMin ? 1 : 0,
      finalDocPayout, status, `${notes} Врач (${operationName})`
    ]);

    // Начисление сестре
    const nurseAccrRes = await runAsync(`
      INSERT INTO staff_payout_accruals (
        sheet_id, procedure_record_id, doctor_or_staff_id, role_in_procedure,
        service_date, margin_base, payout_percent, calculated_payout, applied_min_guarantee,
        manual_adjustment, final_payout, status, notes
      ) VALUES (
        ?, ?, ?, 'Операционная сестра',
        ?, ?, ?, ?, ?,
        0.0, ?, ?, ?
      )
    `, [
      sheetId, procId, nurseId,
      executionDate, marginBase, nurseRate, rawNursePayout, nurseAppliedMin ? 1 : 0,
      finalNursePayout, status, `${notes} Медсестра (${operationName})`
    ]);

    return { procId, docAccrualId: docAccrRes.lastID, nurseAccrualId: nurseAccrRes.lastID, totalPayout };
  }

  // --- 11. НАПОЛНЕНИЕ АВГУСТА 2026 (Период: paid) ---
  console.log('Генерация начислений за Август 2026 (paid)...');
  for (let i = 1; i <= 8; i++) {
    const day = String(i * 3).padStart(2, '0');
    await createProcedureAndAccruals({
      sheetId: sheets.aug,
      executionDate: `2026-08-${day} 10:00:00`,
      patientId: (i % 2 === 0) ? patPetrovId : patSidorovaId,
      operationId: opConsultId,
      operationName: 'Первичный прием врача ортопеда-травматолога',
      billedPrice: 3000,
      materialsCost: 15,
      doctorId: (i % 2 === 0) ? docIvanovId : docSmirnovId,
      nurseId: nurseVasilievaId,
      doctorRate: 35,
      doctorMinGuarantee: 1000,
      status: 'paid',
      notes: '[TEST_DAEMON] Август закрыто'
    });
  }

  // --- 12. НАПОЛНЕНИЕ СЕНТЯБРЯ 2026 (Период: approved) ---
  console.log('Генерация начислений за Сентябрь 2026 (approved)...');
  // 12.1 Стандартные приемы
  for (let i = 1; i <= 6; i++) {
    const day = String(i * 4).padStart(2, '0');
    await createProcedureAndAccruals({
      sheetId: sheets.sep,
      executionDate: `2026-09-${day} 11:30:00`,
      patientId: patKuznetsovId,
      operationId: opConsultId,
      operationName: 'Первичный прием врача ортопеда-травматолога',
      billedPrice: 3000,
      materialsCost: 15,
      doctorId: docIvanovId,
      nurseId: nurseVasilievaId,
      doctorRate: 35,
      status: 'in_sheet',
      notes: '[TEST_DAEMON] Сентябрь утверждено'
    });
  }

  // 12.2 Кейс B: Высокая стоимость материалов (PRP-терапия)
  await createProcedureAndAccruals({
    sheetId: sheets.sep,
    executionDate: '2026-09-15 14:00:00',
    patientId: patPetrovId,
    operationId: opPRPId,
    operationName: 'PRP-терапия коленного сустава',
    billedPrice: 18000,
    materialsCost: 6200,
    doctorId: docSmirnovId,
    nurseId: nurseVasilievaId,
    doctorRate: 35,
    status: 'in_sheet',
    notes: '[TEST_DAEMON] Кейс B: Дорогие расходники (PRP)'
  });

  // 12.3 Кейс C: Нулевая маржа (Расходники > Цены) -> Фикс-гарантия
  await createProcedureAndAccruals({
    sheetId: sheets.sep,
    executionDate: '2026-09-22 16:30:00',
    patientId: patSidorovaId,
    operationId: opUziId,
    operationName: 'Контроль УЗИ при сложной инъекции (высокий расход)',
    billedPrice: 2500,
    materialsCost: 2400, // 2400 * 1.15 = 2760 > 2500 -> маржа 0
    doctorId: docIvanovId,
    nurseId: nurseVasilievaId,
    doctorRate: 35,
    doctorMinGuarantee: 1500,
    nurseMinGuarantee: 400,
    status: 'in_sheet',
    notes: '[TEST_DAEMON] Кейс C: Нулевая маржа (Фикс-гарантия)'
  });

  // 12.4 Кейс E: Сторно-пара (Ошибочное начисление и сторнирование)
  console.log('Создание тестовой сторно-пары (Кейс E)...');
  const stornoProc = await createProcedureAndAccruals({
    sheetId: sheets.sep,
    executionDate: '2026-09-28 12:00:00',
    patientId: patKuznetsovId,
    operationId: opConsultId,
    operationName: 'Ошибочное начисление приема',
    billedPrice: 3000,
    materialsCost: 15,
    doctorId: docIvanovId,
    nurseId: nurseVasilievaId,
    doctorRate: 35,
    status: 'storno',
    notes: '[TEST_DAEMON] Исходная ошибочная процедура'
  });

  // Вставка корректирующего сторно-начисления
  await runAsync(`
    INSERT INTO staff_payout_accruals (
      sheet_id, procedure_record_id, doctor_or_staff_id, role_in_procedure,
      service_date, margin_base, payout_percent, calculated_payout, applied_min_guarantee,
      manual_adjustment, final_payout, status, is_storno, reversal_of_id, notes
    ) VALUES (
      ?, ?, ?, 'Врач',
      '2026-09-29 10:00:00', 0, 0, 0, 0,
      0, 0, 'storno', 1, ?,
      '[TEST_DAEMON] Сторно дублирующего начисления врача'
    )
  `, [sheets.sep, stornoProc.procId, docIvanovId, stornoProc.docAccrualId]);

  // --- 13. НАПОЛНЕНИЕ ОКТЯБРЯ 2026 (Период: draft / accrued) ---
  console.log('Генерация начислений за Октябрь 2026 (draft)...');
  for (let i = 1; i <= 5; i++) {
    const day = String(i * 2).padStart(2, '0');
    await createProcedureAndAccruals({
      sheetId: sheets.oct,
      executionDate: `2026-10-${day} 10:30:00`,
      patientId: (i % 2 === 0) ? patPetrovId : patSidorovaId,
      operationId: opConsultId,
      operationName: 'Консультативный прием ортопеда',
      billedPrice: 3000,
      materialsCost: 15,
      doctorId: (i % 2 === 0) ? docIvanovId : docSmirnovId,
      nurseId: nurseVasilievaId,
      doctorRate: 35,
      status: 'accrued',
      notes: '[TEST_DAEMON] Октябрь текущие начисления'
    });
  }

  // --- 14. СОЗДАНИЕ АКТИВНОЙ МЯГКОЙ БЛОКИРОВКИ (Soft Lock) ---
  // Блокируем нерассчитанный завершенный прием appId
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  await runAsync(`
    INSERT INTO service_calculation_locks (source_type, source_id, lock_token, locked_by, expires_at)
    VALUES ('appointment', ?, 'daemon-token-uuid-1234', '[TEST_DAEMON] Бухгалтер Петрова', ?)
  `, [appId, expiresAt]);
  console.log('✓ Создана активная мягкая блокировка в service_calculation_locks');

  // --- 15. ОБНОВЛЕНИЕ ИТОГОВЫХ СУММ В ВЕДОМОСТЯХ ---
  for (const [key, sId] of Object.entries(sheets)) {
    const sumRow = await getAsync(`
      SELECT 
        COUNT(DISTINCT procedure_record_id) as proc_count,
        COALESCE(SUM(margin_base), 0) as total_margin,
        COALESCE(SUM(final_payout), 0) as total_accrued
      FROM staff_payout_accruals 
      WHERE sheet_id = ?
    `, [sId]);

    await runAsync(`
      UPDATE staff_payout_sheets 
      SET total_operations_count = ?,
          total_margin_base = ?,
          total_payout_amount = ?
      WHERE id = ?
    `, [sumRow.proc_count, sumRow.total_margin, sumRow.total_accrued, sId]);
  }

  // 13. Создание тестового системного параметра расчетов [TEST_DAEMON]
  await runAsync(`
    INSERT OR REPLACE INTO calculation_parameters (param_name, param_value)
    VALUES ('[TEST_DAEMON] Лимит распределения маржи бригады (Cap)', 0.60)
  `);
  console.log('✓ Создан тестовый расчетный параметр: [TEST_DAEMON] Лимит распределения маржи бригады (Cap)');

  console.log('✓ Итоговые суммы ведомостей пересчитаны и обновлены');
  console.log('===============================================================');
  console.log('>>> Тестовые данные [TEST_DAEMON] успешно загружены в БД! <<<');
  console.log('===============================================================');
}

if (require.main === module) {
  seedDaemonTestData().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDaemonTestData };
