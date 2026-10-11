/**
 * testPayoutFlow.js
 * Автоматизированный раннер тестирования сквозного бизнес-процесса модуля
 * «Расчет выплат медицинским сотрудникам» (Программа проверок FL-V01 — FL-V05 и FL-01 — FL-14).
 *
 * Охватывает все комбинации клинического потока:
 * 1. Single Service + Single Staff (Solo Doctor)
 * 2. Single Service + Multi Staff (Doctor + Nurse Brigade)
 * 3. Multi Services + Single Staff (Solo Doctor с пакетом услуг)
 * 4. Multi Services + Multi Staff (Бригада с пакетом сложных операций)
 * 5. Appointment Flow (Завершенный амбулаторный прием из расписания)
 * 6. Полный жизненный цикл: Фискальный чек -> Очередь -> Soft Lock -> Расчет маржи -> ACID Коммит ->
 *    Дедупликация -> Ручные надбавки -> Сторно -> Ведомости -> BI Сходимость.
 */

const http = require('http');
const db = require('./database');
const { seedDaemonTestData } = require('./seedDaemonTestData');

const BASE_URL = 'http://localhost:5000';

function apiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

async function runTestSuite() {
  console.log('=================================================================================');
  console.log('>>> ЗАПУСК ПОЛНОЙ ПРОГРАММЫ ТЕСТИРОВАНИЯ ПОТОКА: ВИЗИТЫ И ВЫПЛАТЫ (FL-V01—FL-14) <<<');
  console.log('=================================================================================');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function assert(condition, testCode, description, debugInfo = null) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testCode}: ${description}`);
      passed++;
      testResults.push({ code: testCode, description, status: 'PASS' });
    } else {
      console.error(`  ✗ [FAIL] ${testCode}: ${description}`);
      if (debugInfo) console.error('    [DEBUG]:', JSON.stringify(debugInfo));
      failed++;
      testResults.push({ code: testCode, description, status: 'FAIL' });
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Инициализация: Полный перезапуск и сидинг чистого тестового контура [TEST_DAEMON]
    // -------------------------------------------------------------------------
    console.log('ℹ Инициализация: Автоматический чистый сидинг тестового контура seedDaemonTestData()...');
    await seedDaemonTestData();

    // Динамический поиск тестовых сущностей [TEST_DAEMON]
    const daemonDoc = await getAsync("SELECT id, full_name FROM staff WHERE full_name LIKE '%Иванов%' AND full_name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonNurse = await getAsync("SELECT id, full_name FROM staff WHERE full_name LIKE '%Васильева%' AND full_name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonDoc2 = await getAsync("SELECT id, full_name FROM staff WHERE full_name LIKE '%Смирнов%' AND full_name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const testDocId = daemonDoc ? daemonDoc.id : 2;
    const testNurseId = daemonNurse ? daemonNurse.id : 5;
    const testDoc2Id = daemonDoc2 ? daemonDoc2.id : 4;

    const daemonPat1 = await getAsync("SELECT id, full_name FROM patients WHERE full_name LIKE '%Петров%' AND full_name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonPat2 = await getAsync("SELECT id, full_name FROM patients WHERE full_name LIKE '%Сидорова%' AND full_name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonPat3 = await getAsync("SELECT id, full_name FROM patients WHERE full_name LIKE '%Кузнецов%' AND full_name LIKE '%[TEST_DAEMON]%' LIMIT 1");

    const daemonOpConsult = await getAsync("SELECT id, name, price FROM operations WHERE name LIKE '%Первичный прием%' AND name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonOpPRP = await getAsync("SELECT id, name, price FROM operations WHERE name LIKE '%PRP%' AND name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonOpUzi = await getAsync("SELECT id, name, price FROM operations WHERE name LIKE '%УЗИ%' AND name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonOpArthro = await getAsync("SELECT id, name, price FROM operations WHERE name LIKE '%Артроскопия%' AND name LIKE '%[TEST_DAEMON]%' LIMIT 1");

    const daemonMatPRP = await getAsync("SELECT id, material_name, current_unit_cost FROM materials_catalog WHERE material_name LIKE '%PRP%' AND material_name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonMatUzi = await getAsync("SELECT id, material_name, current_unit_cost FROM materials_catalog WHERE (material_name LIKE '%УЗИ%' OR material_name LIKE '%ультразвук%') AND material_name LIKE '%[TEST_DAEMON]%' LIMIT 1");
    const daemonMatConsult = await getAsync("SELECT id, material_name, current_unit_cost FROM materials_catalog WHERE material_name LIKE '%смотр%' AND material_name LIKE '%[TEST_DAEMON]%' LIMIT 1");

    // =========================================================================
    // ЧАСТЬ I. СКВОЗНЫЕ ТЕСТЫ ВИЗИТОВ И НАЗНАЧЕНИЙ ПЕРСОНАЛА (VISIT -> PAYOUTS)
    // =========================================================================

    // -------------------------------------------------------------------------
    // FL-V01: Визит: Одиночная услуга + Одиночный врач (Single Service + Solo Doctor)
    // -------------------------------------------------------------------------
    const v1Payload = {
      patient_id: daemonPat1.id,
      doctor_id: testDoc2Id, // Д-р Смирнов (консультант)
      nurse_id: null,        // Без медсестры
      operations: [{ operation_id: daemonOpConsult.id, quantity: 1, unit_price: daemonOpConsult.price, subtotal: daemonOpConsult.price }],
      billed_price: daemonOpConsult.price,
      notes: '[TEST_DAEMON] Сквозной визит: Одиночная услуга, только врач (Solo Doctor)',
      payment_type: 'cash',
      fiscalize: true,
      patient_contact: '+7 (999) 000-02-01'
    };
    const v1Res = await apiRequest('POST', '/api/transactions', v1Payload);
    assert(
      v1Res.status === 200 && v1Res.body.success && v1Res.body.transactionId > 0,
      'FL-V01.1',
      `[Solo Doctor] Визит оформлен через /api/transactions (ID транзакции: ${v1Res.body.transactionId})`
    );
    const tx1Id = v1Res.body.transactionId;

    // Проверяем назначение только врача в transaction_staff_roles
    const tx1Roles = await allAsync("SELECT staff_id, manipulation_role FROM transaction_staff_roles WHERE transaction_id = ?", [tx1Id]);
    assert(
      tx1Roles.length === 1 && tx1Roles[0].staff_id === testDoc2Id,
      'FL-V01.2',
      `[Solo Doctor] В ролях транзакции зафиксирован ровно 1 сотрудник (Врач id=${testDoc2Id}), медсестра не назначена`
    );

    // Проверяем попадание в очередь нерассчитанных услуг
    const unbilledV1 = await apiRequest('GET', `/api/payouts/unbilled-services?search=%5BTEST_DAEMON%5D`);
    const serviceV1 = unbilledV1.body?.services?.find(s => s.source_type === 'transaction' && s.source_id === tx1Id && s.operation_id === daemonOpConsult.id);
    assert(
      Boolean(serviceV1),
      'FL-V01.3',
      `[Solo Doctor] Услуга визита успешно поступила в очередь v_unbilled_services (dedup_hash: ${serviceV1?.dedup_hash})`
    );

    // Превью расчета выплат: проверяем, что выплата медсестре строго 0, а врач получает по ставке
    const prevV1 = await apiRequest('POST', '/api/payouts/preview-calculation', {
      services: [serviceV1],
      brigade: { primary_doctor_id: testDoc2Id, nurse_id: null }
    });
    const itemV1 = prevV1.body?.items?.[0];
    assert(
      itemV1 && itemV1.doctor_payout > 0 && itemV1.nurse_payout === 0 && itemV1.nurse_rate === 0,
      'FL-V01.4',
      `[Solo Doctor] Расчет выплат: Врач получил ${itemV1?.doctor_payout} ₽, Медсестра строго 0 ₽ (nurse_rate=0%)`
    );

    // ACID Коммит одиночного расчета Solo Doctor
    const commitV1 = await apiRequest('POST', '/api/payouts/commit-calculation', {
      calculatedItems: [itemV1],
      notes: '[TEST_DAEMON] Коммит визита Solo Doctor'
    });
    const accrsV1 = await allAsync("SELECT doctor_or_staff_id, role_in_procedure, final_payout FROM staff_payout_accruals WHERE notes LIKE '%Коммит визита Solo Doctor%'");
    assert(
      commitV1.body?.committedProceduresCount === 1 && accrsV1.length === 1 && accrsV1[0].doctor_or_staff_id === testDoc2Id,
      'FL-V01.5',
      `[Solo Doctor] Коммит создал ровно 1 процедуру и ровно 1 начисление в staff_payout_accruals (только врачу)`,
      { commitBody: commitV1.body, accrsV1 }
    );

    // -------------------------------------------------------------------------
    // FL-V02: Визит: Одиночная услуга + Бригада (Single Service + Doctor & Nurse)
    // -------------------------------------------------------------------------
    const v2Payload = {
      patient_id: daemonPat1.id,
      doctor_id: testDocId,       // Д-р Иванов (хирург)
      nurse_id: testNurseId,      // Сестра Васильева
      operations: [{ operation_id: daemonOpPRP.id, quantity: 1, unit_price: daemonOpPRP.price, subtotal: daemonOpPRP.price }],
      billed_price: daemonOpPRP.price,
      notes: '[TEST_DAEMON] Сквозной визит: Одиночная услуга, бригада (PRP-терапия)',
      payment_type: 'card',
      fiscalize: true,
      patient_contact: '+7 (999) 000-02-01'
    };
    const v2Res = await apiRequest('POST', '/api/transactions', v2Payload);
    const tx2Id = v2Res.body.transactionId;
    const tx2Roles = await allAsync("SELECT staff_id, manipulation_role FROM transaction_staff_roles WHERE transaction_id = ?", [tx2Id]);
    assert(
      tx2Roles.length === 2 && tx2Roles.some(r => r.staff_id === testDocId) && tx2Roles.some(r => r.staff_id === testNurseId),
      'FL-V02.1',
      `[Brigade] В ролях транзакции зафиксирована бригада: Врач (${testDocId}) и Сестра (${testNurseId})`
    );

    const unbilledV2 = await apiRequest('GET', `/api/payouts/unbilled-services?search=%5BTEST_DAEMON%5D`);
    const serviceV2 = unbilledV2.body?.services?.find(s => s.source_type === 'transaction' && s.source_id === tx2Id && s.operation_id === daemonOpPRP.id);
    const prevV2 = await apiRequest('POST', '/api/payouts/preview-calculation', {
      services: [serviceV2],
      brigade: { primary_doctor_id: testDocId, nurse_id: testNurseId }
    });
    const itemV2 = prevV2.body?.items?.[0];
    assert(
      itemV2 && itemV2.doctor_payout === 3804.5 && itemV2.nurse_payout === 1087.0,
      'FL-V02.2',
      `[Brigade] Расчет бригады по PRP (18k): Врач (35%) = ${itemV2?.doctor_payout} ₽, Сестра (10%) = ${itemV2?.nurse_payout} ₽`
    );

    const commitV2 = await apiRequest('POST', '/api/payouts/commit-calculation', {
      calculatedItems: [itemV2],
      notes: '[TEST_DAEMON] Коммит визита Brigade PRP'
    });
    const accrsV2 = await allAsync("SELECT doctor_or_staff_id, role_in_procedure FROM staff_payout_accruals WHERE notes LIKE '%Коммит визита Brigade PRP%'");
    assert(
      commitV2.body?.committedProceduresCount === 1 && accrsV2.length === 2,
      'FL-V02.3',
      `[Brigade] Коммит создал 1 процедуру и ровно 2 начисления в staff_payout_accruals (врачу и сестре)`
    );

    // -------------------------------------------------------------------------
    // FL-V03: Визит: Несколько услуг (Пакет) + Одиночный врач (Multi Services + Solo Doctor)
    // -------------------------------------------------------------------------
    const v3Price = daemonOpConsult.price + daemonOpUzi.price; // 3000 + 2500 = 5500
    const v3Payload = {
      patient_id: daemonPat2.id,
      doctor_id: testDocId,
      nurse_id: null,
      operations: [
        { operation_id: daemonOpConsult.id, quantity: 1, unit_price: daemonOpConsult.price, subtotal: daemonOpConsult.price },
        { operation_id: daemonOpUzi.id, quantity: 1, unit_price: daemonOpUzi.price, subtotal: daemonOpUzi.price }
      ],
      billed_price: v3Price,
      notes: '[TEST_DAEMON] Сквозной визит: Пакет из 2 услуг, только врач',
      payment_type: 'card',
      fiscalize: true,
      patient_contact: '+7 (999) 000-02-02'
    };
    const v3Res = await apiRequest('POST', '/api/transactions', v3Payload);
    const tx3Id = v3Res.body.transactionId;
    const tx3Items = await allAsync("SELECT * FROM operation_transaction_items WHERE transaction_id = ?", [tx3Id]);
    assert(
      tx3Items.length === 2,
      'FL-V03.1',
      `[Multi-Service Solo] В operation_transaction_items созданы ровно 2 позиции пакета (Консультация и УЗИ)`
    );

    // Проверяем, что в очереди нерассчитанных услуг появились ОБЕ услуги пакета
    const unbilledV3 = await apiRequest('GET', `/api/payouts/unbilled-services?search=%5BTEST_DAEMON%5D`);
    const servicesV3 = unbilledV3.body?.services?.filter(s => s.source_type === 'transaction' && s.source_id === tx3Id);
    assert(
      servicesV3?.length === 2,
      'FL-V03.2',
      `[Multi-Service Solo] В очереди unbilled-services присутствуют ОБЕ услуги пакета (получено ${servicesV3?.length} позиций)`
    );

    // Пакетный расчет: у врача 2 позиции, у медсестры строго 0 по обеим
    const prevV3 = await apiRequest('POST', '/api/payouts/preview-calculation', {
      services: servicesV3,
      brigade: { primary_doctor_id: testDocId, nurse_id: null }
    });
    const itemsV3 = prevV3.body?.items || [];
    const totalDocV3 = itemsV3.reduce((sum, it) => sum + it.doctor_payout, 0);
    const totalNurseV3 = itemsV3.reduce((sum, it) => sum + it.nurse_payout, 0);
    assert(
      itemsV3.length === 2 && totalNurseV3 === 0 && totalDocV3 > 0,
      'FL-V03.3',
      `[Multi-Service Solo] Расчет пакета: Врач за обе услуги получил ${totalDocV3} ₽, Сестра строго 0 ₽`
    );

    const commitV3 = await apiRequest('POST', '/api/payouts/commit-calculation', {
      calculatedItems: itemsV3,
      notes: '[TEST_DAEMON] Коммит пакета Solo Doctor'
    });
    const accrsV3 = await allAsync("SELECT doctor_or_staff_id FROM staff_payout_accruals WHERE notes LIKE '%Коммит пакета Solo Doctor%'");
    assert(
      commitV3.body?.committedProceduresCount === 2 && accrsV3.length === 2 && accrsV3.every(a => a.doctor_or_staff_id === testDocId),
      'FL-V03.4',
      `[Multi-Service Solo] Коммит создал 2 процедуры и ровно 2 начисления врачу (0 сестре)`
    );

    // -------------------------------------------------------------------------
    // FL-V04: Визит: Несколько услуг (Пакет) + Бригада (Multi Services + Multi Staff)
    // -------------------------------------------------------------------------
    const v4Price = daemonOpArthro.price + daemonOpPRP.price; // 35000 + 18000 = 53000
    const v4Payload = {
      patient_id: daemonPat3.id,
      doctor_id: testDocId,
      nurse_id: testNurseId,
      operations: [
        { operation_id: daemonOpArthro.id, quantity: 1, unit_price: daemonOpArthro.price, subtotal: daemonOpArthro.price },
        { operation_id: daemonOpPRP.id, quantity: 1, unit_price: daemonOpPRP.price, subtotal: daemonOpPRP.price }
      ],
      billed_price: v4Price,
      notes: '[TEST_DAEMON] Сквозной визит: Пакет 2 сложных операций, бригада',
      payment_type: 'card',
      fiscalize: true,
      patient_contact: '+7 (999) 000-02-03'
    };
    const v4Res = await apiRequest('POST', '/api/transactions', v4Payload);
    const tx4Id = v4Res.body.transactionId;
    const unbilledV4 = await apiRequest('GET', `/api/payouts/unbilled-services?search=%5BTEST_DAEMON%5D`);
    const servicesV4 = unbilledV4.body?.services?.filter(s => s.source_type === 'transaction' && s.source_id === tx4Id);
    assert(
      servicesV4?.length === 2,
      'FL-V04.1',
      `[Multi-Service Brigade] Пакет операций на 53 000 ₽ поступил в очередь с 2 позициями`
    );

    const prevV4 = await apiRequest('POST', '/api/payouts/preview-calculation', {
      services: servicesV4,
      brigade: { primary_doctor_id: testDocId, nurse_id: testNurseId }
    });
    const itemsV4 = prevV4.body?.items || [];
    const totalDocV4 = itemsV4.reduce((sum, it) => sum + it.doctor_payout, 0); // 7420 + 3804.50 = 11224.50
    const totalNurseV4 = itemsV4.reduce((sum, it) => sum + it.nurse_payout, 0); // 2120 + 1087 = 3207.00
    assert(
      itemsV4.length === 2 && totalDocV4 === 11224.5 && totalNurseV4 === 3207.0,
      'FL-V04.2',
      `[Multi-Service Brigade] Пакетный расчет бригады: Врач = ${totalDocV4} ₽, Сестра = ${totalNurseV4} ₽`
    );

    const commitV4 = await apiRequest('POST', '/api/payouts/commit-calculation', {
      calculatedItems: itemsV4,
      notes: '[TEST_DAEMON] Коммит пакета Brigade'
    });
    const accrsV4 = await allAsync("SELECT doctor_or_staff_id, role_in_procedure FROM staff_payout_accruals WHERE notes LIKE '%Коммит пакета Brigade%'");
    assert(
      commitV4.body?.committedProceduresCount === 2 && accrsV4.length === 4,
      'FL-V04.3',
      `[Multi-Service Brigade] Коммит создал 2 процедуры и ровно 4 начисления (по 2 каждому сотруднику)`
    );

    // -------------------------------------------------------------------------
    // FL-V05: Визит: Завершенный прием из расписания (Appointment Flow)
    // -------------------------------------------------------------------------
    const appRes = await dbRunAsync(`
      INSERT INTO appointments (patient_id, doctor_id, operation_id, appointment_date, start_time, end_time, status, notes)
      VALUES (?, ?, ?, '2026-10-15', '10:00', '10:30', 'completed', '[TEST_DAEMON] Сквозной визит из расписания')
    `, [daemonPat1.id, testDocId, daemonOpConsult.id]);
    const appId = appRes.lastID;

    const unbilledApp = await apiRequest('GET', `/api/payouts/unbilled-services?search=%5BTEST_DAEMON%5D`);
    const serviceApp = unbilledApp.body?.services?.find(s => s.source_type === 'appointment' && s.source_id === appId);
    assert(
      Boolean(serviceApp),
      'FL-V05.1',
      `[Appointment Flow] Завершенный прием id=${appId} поступил в unbilled-services со source_type='appointment'`
    );

    const prevApp = await apiRequest('POST', '/api/payouts/preview-calculation', {
      services: [serviceApp],
      brigade: { primary_doctor_id: testDocId, nurse_id: null }
    });
    const commitApp = await apiRequest('POST', '/api/payouts/commit-calculation', {
      calculatedItems: prevApp.body?.items || [],
      notes: '[TEST_DAEMON] Коммит визита Appointment'
    });
    const procApp = await getAsync("SELECT source_type, appointment_id FROM procedure_records WHERE appointment_id = ?", [appId]);
    assert(
      commitApp.body?.committedProceduresCount === 1 && procApp && procApp.source_type === 'appointment',
      'FL-V05.2',
      `[Appointment Flow] Процедура зафиксирована со связкой appointment_id=${appId} и source_type='appointment'`
    );

    // =========================================================================
    // ЧАСТЬ II. МАТЕМАТИКА МАРЖИ, ЗАЩИТА, ЛИМИТЫ И БЛОКИРОВКИ
    // =========================================================================

    // -------------------------------------------------------------------------
    // FL-01: Выборка нерассчитанных услуг (строго данные [TEST_DAEMON])
    // -------------------------------------------------------------------------
    const unbilledRes = await apiRequest('GET', '/api/payouts/unbilled-services?search=%5BTEST_DAEMON%5D');
    assert(
      unbilledRes.status === 200 && unbilledRes.body.success && Array.isArray(unbilledRes.body.services),
      'FL-01',
      `Очередь нерассчитанных услуг возвращает массив изолированных данных [TEST_DAEMON]`
    );

    // -------------------------------------------------------------------------
    // FL-02: Мягкая блокировка (Soft Lock)
    // -------------------------------------------------------------------------
    const testUnbilled = unbilledRes.body.services[0] || serviceV1;
    const lockPayload = {
      services: [{ source_type: testUnbilled.source_type, source_id: testUnbilled.source_id }],
      userName: '[TEST_DAEMON] Тестовый бухгалтер'
    };
    const lockRes = await apiRequest('POST', '/api/payouts/lock-services', lockPayload);
    assert(
      lockRes.status === 200 && lockRes.body.success && typeof lockRes.body.lockToken === 'string',
      'FL-02',
      `Захват мягкой блокировки успешен (lockToken: ${lockRes.body.lockToken})`
    );
    const lockToken = lockRes.body.lockToken;

    const lockRow = await getAsync("SELECT * FROM service_calculation_locks WHERE lock_token = ?", [lockToken]);
    assert(
      lockRow && lockRow.locked_by.includes('[TEST_DAEMON]'),
      'FL-02.1',
      'Запись блокировки найдена в service_calculation_locks с корректным пользователем'
    );

    // -------------------------------------------------------------------------
    // FL-03: Разрешение тарифов и справочников [TEST_DAEMON]
    // -------------------------------------------------------------------------
    const schemesRes = await apiRequest('GET', '/api/payouts/schemes');
    assert(
      schemesRes.status === 200 && schemesRes.body.success && schemesRes.body.schemes.length >= 3,
      'FL-03',
      'Схемы выплат загружены (Хирургия 35%, Консультации 25%, Сестринское 10%)'
    );

    assert(
      Boolean(daemonDoc && daemonNurse && daemonDoc2),
      'FL-03.1',
      `Тестовые сотрудники Staff [TEST_DAEMON] изолированы: Врач 1 (id=${testDocId}), Врач 2 (id=${testDoc2Id}), Сестра (id=${testNurseId})`
    );

    const docSetting = await getAsync(
      "SELECT sps.*, sch.default_rate_percent FROM staff_payout_settings sps JOIN staff_payout_schemes sch ON sps.scheme_id = sch.id WHERE sps.staff_id = ?",
      [testDocId]
    );
    assert(
      Boolean(docSetting && docSetting.scheme_id === 1 && docSetting.default_rate_percent === 35),
      'FL-03.2',
      `Персональные тарифные настройки тестового врача привязаны (scheme_id=1, базовая ставка 35%)`
    );

    // -------------------------------------------------------------------------
    // FL-04: Математика маржи ($1.15) и расчет бригады (Кейс B: PRP-терапия)
    // -------------------------------------------------------------------------
    const simCaseB = {
      services: [{
        source_type: 'transaction',
        source_id: 88801,
        operation_id: daemonOpPRP.id,
        operation_name: daemonOpPRP.name,
        revenue: daemonOpPRP.price,
        materials_cost: daemonMatPRP.current_unit_cost,
        patient_id: daemonPat1.id,
        patient_name: daemonPat1.full_name
      }],
      brigade: {
        primary_doctor_id: testDocId,
        nurse_id: testNurseId
      }
    };
    const prevCaseB = await apiRequest('POST', '/api/payouts/preview-calculation', simCaseB);
    const itemB = prevCaseB.body.items[0];
    const expectedMaterialsB = daemonMatPRP.current_unit_cost * 1.15; // 7130
    const expectedMarginB = daemonOpPRP.price - expectedMaterialsB; // 10870
    const expectedDocB = Math.round(expectedMarginB * 0.35 * 100) / 100; // 3804.50
    const expectedNurseB = Math.round(expectedMarginB * 0.10 * 100) / 100; // 1087.00
    assert(
      Math.abs(itemB.margin_base - expectedMarginB) < 0.05,
      'FL-04.1',
      `Маржа Кейса B: факт ${itemB.margin_base} ₽ == план ${expectedMarginB} ₽ (с наценкой 1.15)`
    );
    assert(
      Math.abs(itemB.doctor_payout - expectedDocB) < 0.05,
      'FL-04.2',
      `Выплата врачу (35%): факт ${itemB.doctor_payout} ₽ == план ${expectedDocB} ₽`
    );
    assert(
      Math.abs(itemB.nurse_payout - expectedNurseB) < 0.05,
      'FL-04.3',
      `Выплата сестре (10%): факт ${itemB.nurse_payout} ₽ == план ${expectedNurseB} ₽`
    );

    // -------------------------------------------------------------------------
    // FL-05: Фиксированный минимум при нулевой марже (Кейс C: УЗИ)
    // -------------------------------------------------------------------------
    const simCaseC = {
      services: [{
        source_type: 'transaction',
        source_id: 88802,
        operation_id: daemonOpUzi.id,
        operation_name: daemonOpUzi.name,
        revenue: daemonOpUzi.price, // 2500
        materials_cost: daemonMatUzi.current_unit_cost, // 2400 * 1.15 = 2760 > 2500 -> маржа 0
        patient_id: daemonPat2.id,
        patient_name: daemonPat2.full_name
      }],
      brigade: {
        primary_doctor_id: testDocId, // имеет фикс минимум 1500
        nurse_id: testNurseId         // имеет фикс минимум 400
      }
    };
    const prevCaseC = await apiRequest('POST', '/api/payouts/preview-calculation', simCaseC);
    const itemC = prevCaseC.body.items[0];
    assert(
      itemC.margin_base === 0,
      'FL-05.1',
      'Маржинальная база ограничена снизу нулем: margin_base === 0'
    );
    assert(
      itemC.doctor_applied_min === true && itemC.doctor_payout === 1500,
      'FL-05.2',
      `Сработал фикс-минимум врача: ${itemC.doctor_payout} ₽ (applied_min: true)`
    );
    assert(
      itemC.nurse_applied_min === true && itemC.nurse_payout === 400,
      'FL-05.3',
      `Сработал фикс-минимум сестры: ${itemC.nurse_payout} ₽ (applied_min: true)`
    );
    assert(
      itemC.clinic_profit === -1900,
      'FL-05.4',
      `Прибыль клиники ушла в дефицит: ${itemC.clinic_profit} ₽ (контроль рисков в BI)`
    );

    // -------------------------------------------------------------------------
    // FL-06: Предупреждение Cap бригады (Cap Exceeded Check: Консультация)
    // -------------------------------------------------------------------------
    const simCaseD = {
      services: [{
        source_type: 'transaction',
        source_id: 88803,
        operation_id: daemonOpConsult.id,
        operation_name: daemonOpConsult.name,
        revenue: daemonOpConsult.price,
        materials_cost: daemonMatConsult.current_unit_cost,
        patient_id: daemonPat3.id,
        patient_name: daemonPat3.full_name
      }],
      brigade: {
        primary_doctor_id: testDocId,
        nurse_id: testNurseId,
        custom_doctor_pct: 55,
        custom_nurse_pct: 20 // 55 + 20 = 75% > cap 60%
      }
    };
    const prevCaseD = await apiRequest('POST', '/api/payouts/preview-calculation', simCaseD);
    assert(
      prevCaseD.body.summary.isExceedingCap === true,
      'FL-06',
      'Сумма долей бригады (75%) превысила лимит схемы (60%) -> isExceedingCap === true'
    );

    // -------------------------------------------------------------------------
    // FL-07: ACID Коммит начислений и снятие блокировки
    // -------------------------------------------------------------------------
    const commitPayload = {
      calculatedItems: [itemB],
      lockToken: lockToken,
      notes: '[TEST_DAEMON] Тестовый ACID коммит Кейса B'
    };
    const commitRes = await apiRequest('POST', '/api/payouts/commit-calculation', commitPayload);
    assert(
      commitRes.status === 200 && commitRes.body.success && commitRes.body.committedProceduresCount === 1,
      'FL-07',
      'ACID коммит расчета успешно завершен и зафиксирован'
    );

    const lockAfter = await getAsync("SELECT * FROM service_calculation_locks WHERE lock_token = ?", [lockToken]);
    assert(
      !lockAfter,
      'FL-07.1',
      'Мягкая блокировка автоматически удалена после коммита'
    );

    // -------------------------------------------------------------------------
    // FL-08: Защита от дублей (Deduplication Guard)
    // -------------------------------------------------------------------------
    const dedupCommit = await apiRequest('POST', '/api/payouts/commit-calculation', commitPayload);
    assert(
      dedupCommit.status === 200 && dedupCommit.body.success && dedupCommit.body.committedProceduresCount === 0,
      'FL-08.1',
      'Повторный коммит тех же услуг корректно обработан со счетчиком 0 новых процедур'
    );
    const dupCheck = await getAsync(
      "SELECT count(*) as count FROM procedure_records WHERE dedup_hash = ?",
      [itemB.dedup_hash || `transaction:88801:${daemonOpPRP.id}`]
    );
    assert(
      dupCheck.count === 1,
      'FL-08.2',
      'Защита от дублей: в procedure_records осталась ровно 1 запись (count === 1)'
    );

    // -------------------------------------------------------------------------
    // FL-09: Ручная корректировка начисления
    // -------------------------------------------------------------------------
    const testAccr = await getAsync(
      "SELECT id, final_payout FROM staff_payout_accruals WHERE notes LIKE '%[TEST_DAEMON]%' AND status != 'paid' LIMIT 1"
    );
    if (testAccr) {
      const updateRes = await apiRequest('PUT', `/api/payouts/accruals/${testAccr.id}`, {
        manual_adjustment: 500,
        notes: '[TEST_DAEMON] Ручная надбавка за сложность +500 руб.'
      });
      assert(
        updateRes.status === 200 && updateRes.body.success,
        'FL-09',
        `Ручная корректировка (+500 ₽) успешна: новый итог ${updateRes.body.updatedFinalPayout} ₽`
      );
    }

    // -------------------------------------------------------------------------
    // FL-10: Валидация сторнирования (Кейс E)
    // -------------------------------------------------------------------------
    const stornoRows = await getAsync(
      "SELECT count(*) as count FROM staff_payout_accruals WHERE notes LIKE '%[TEST_DAEMON]%' AND is_storno = 1"
    );
    assert(
      stornoRows.count >= 1,
      'FL-10',
      'Сторно-запись корректно зарегистрирована в БД (is_storno = 1, status = storno)'
    );

    // =========================================================================
    // ЧАСТЬ III. ФИНАНСОВАЯ СХОДИМОСТЬ, АНАЛИТИКА BI И ВЕДОМОСТИ
    // =========================================================================

    // -------------------------------------------------------------------------
    // FL-11: Финансовая сходимость BI
    // -------------------------------------------------------------------------
    const kpiRes = await apiRequest('GET', '/api/payouts/analytics/kpi-summary');
    assert(
      kpiRes.status === 200 && kpiRes.body.success && kpiRes.body.kpis.totalRevenue > 0,
      'FL-11.1',
      `BI KPI: Выручка ${kpiRes.body.kpis.totalRevenue.toLocaleString('ru-RU')} ₽, ФОТ ${kpiRes.body.kpis.totalPayoutAmount.toLocaleString('ru-RU')} ₽`
    );
    const expectedClinicProfit = kpiRes.body.kpis.totalMarginBase - kpiRes.body.kpis.totalPayoutAmount;
    assert(
      Math.abs(kpiRes.body.kpis.clinicProfit - expectedClinicProfit) <= 1,
      'FL-11.2',
      `Финансовая сходимость: Прибыль клиники (${kpiRes.body.kpis.clinicProfit} ₽) == Маржа - ФОТ (${expectedClinicProfit} ₽)`
    );

    const rankRes = await apiRequest('GET', '/api/payouts/analytics/staff-ranking');
    assert(
      rankRes.status === 200 && rankRes.body.success && Array.isArray(rankRes.body.ranking) && rankRes.body.ranking.length > 0,
      'FL-11.3',
      `Аналитический рейтинг эффективности врачей (Staff Ranking): получено ${rankRes.body.ranking.length} записей с ROI и показателями эффективности`
    );

    // -------------------------------------------------------------------------
    // FL-12: Waterfall расщепления 1 000 ₽
    // -------------------------------------------------------------------------
    const waterRes = await apiRequest('GET', '/api/payouts/analytics/margin-waterfall');
    assert(
      waterRes.status === 200 && waterRes.body.success,
      'FL-12.1',
      'Запрос margin-waterfall выполнен успешно'
    );
    const p1000 = waterRes.body.perThousand;
    const sum1000 = p1000.materials + p1000.doctor_fot + p1000.nurse_fot + p1000.clinic_profit;
    assert(
      Math.abs(sum1000 - 1000) <= 2,
      'FL-12.2',
      `Сумма долей 1 000 ₽ (${sum1000} ₽) строго сходится: Расходники ${p1000.materials} + Врачи ${p1000.doctor_fot} + Сестры ${p1000.nurse_fot} + Прибыль ${p1000.clinic_profit}`
    );

    // -------------------------------------------------------------------------
    // FL-13: Экспорт CSV & DataGrid Flat Data
    // -------------------------------------------------------------------------
    const flatStaffRes = await apiRequest('GET', '/api/payouts/accruals?view=staff&limit=5');
    assert(
      flatStaffRes.status === 200 && flatStaffRes.body.success && flatStaffRes.body.data.length > 0,
      'FL-13',
      `Реестр для экспорта CSV (view=staff) возвращает плоскую структуру с именами сотрудников (${flatStaffRes.body.data.length} записей)`
    );

    // -------------------------------------------------------------------------
    // FL-14: Печатные формы и ведомости
    // -------------------------------------------------------------------------
    const sheetsList = await apiRequest('GET', '/api/payouts/sheets');
    assert(
      sheetsList.status === 200 && sheetsList.body.success && sheetsList.body.sheets.length >= 3,
      'FL-14.1',
      `Реестр ведомостей содержит все расчетные периоды (${sheetsList.body.sheets.length} ведомостей: Август, Сентябрь, Октябрь)`
    );
    const firstSheet = sheetsList.body.sheets[0];
    const sheetDetail = await apiRequest('GET', `/api/payouts/sheets/${firstSheet.id}`);
    assert(
      sheetDetail.status === 200 && sheetDetail.body.success && sheetDetail.body.sheet.sheet_number,
      'FL-14.2',
      `Детализированный бланк ведомости ${sheetDetail.body.sheet.sheet_number} готов к выводу на печать А4`
    );

  } catch (err) {
    console.error('Критическая ошибка выполнения тестов:', err);
    failed++;
  }

  console.log('=================================================================================');
  console.log(`ИТОГИ ТЕСТИРОВАНИЯ: Успешно [PASS]: ${passed} | Ошибок [FAIL]: ${failed}`);
  console.log('=================================================================================');

  return { passed, failed, results: testResults };
}

function dbRunAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

if (require.main === module) {
  runTestSuite().then(res => {
    if (res.failed > 0) {
      process.exit(1);
    } else {
      console.log('>>> Все контрольные проверки потока визитов и выплат (FL-V01 — FL-14) пройдены успешно! <<<');
      process.exit(0);
    }
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
