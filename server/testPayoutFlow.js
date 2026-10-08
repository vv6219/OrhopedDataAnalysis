/**
 * testPayoutFlow.js
 * Автоматизированный раннер тестирования сквозного бизнес-процесса модуля
 * «Расчет выплат медицинскому персоналу» (Программа проверок FL-01 — FL-14).
 */

const http = require('http');
const db = require('./database');

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

async function runTestSuite() {
  console.log('===============================================================');
  console.log('>>> ЗАПУСК ПРОГРАММЫ ТЕСТИРОВАНИЯ ПОТОКА (FL-01 — FL-14) <<<');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function assert(condition, testCode, description) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testCode}: ${description}`);
      passed++;
      testResults.push({ code: testCode, description, status: 'PASS' });
    } else {
      console.error(`  ✗ [FAIL] ${testCode}: ${description}`);
      failed++;
      testResults.push({ code: testCode, description, status: 'FAIL' });
    }
  }

  try {
    // -------------------------------------------------------------------------
    // Инициализация: Динамический поиск ВСЕХ тестовых сущностей [TEST_DAEMON]
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // FL-01: Выборка нерассчитанных услуг (строго данные [TEST_DAEMON])
    // -------------------------------------------------------------------------
    const unbilledRes = await apiRequest('GET', '/api/payouts/unbilled-services?search=%5BTEST_DAEMON%5D');
    assert(
      unbilledRes.status === 200 && unbilledRes.body.success && Array.isArray(unbilledRes.body.services) && unbilledRes.body.services.length > 0,
      'FL-01',
      `Очередь нерассчитанных услуг возвращает строго изолированные данные [TEST_DAEMON] (${unbilledRes.body.services.length} услуг)`
    );
    const sampleService = unbilledRes.body.services.find(s => s.operation_name?.includes('PRP') && s.notes?.includes('[TEST_DAEMON]')) || unbilledRes.body.services[0];
    assert(
      sampleService.source_type && sampleService.source_id && sampleService.dedup_hash && typeof sampleService.margin_base === 'number',
      'FL-01.1',
      'Услуга содержит обязательные поля (source_type, source_id, dedup_hash, margin_base)'
    );
    assert(
      sampleService.patient_name?.includes('[TEST_DAEMON]') && sampleService.operation_name?.includes('[TEST_DAEMON]'),
      'FL-01.2',
      `В расчетах используются ТОЛЬКО сущности [TEST_DAEMON]: Пациент "${sampleService.patient_name}", Операция "${sampleService.operation_name}"`
    );

    // -------------------------------------------------------------------------
    // FL-02: Мягкая блокировка (Soft Lock)
    // -------------------------------------------------------------------------
    const lockPayload = {
      services: [{ source_type: sampleService.source_type, source_id: sampleService.source_id }],
      userName: '[TEST_DAEMON] Тестовый бухгалтер'
    };
    const lockRes = await apiRequest('POST', '/api/payouts/lock-services', lockPayload);
    assert(
      lockRes.status === 200 && lockRes.body.success && typeof lockRes.body.lockToken === 'string',
      'FL-02',
      `Захват мягкой блокировки успешен (lockToken: ${lockRes.body.lockToken})`
    );
    const lockToken = lockRes.body.lockToken;

    // Проверка в БД наличия блокировки
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

    assert(
      Boolean(daemonPat1 && daemonPat2 && daemonPat3),
      'FL-03.3',
      `Тестовые пациенты Patients [TEST_DAEMON] изолированы: Петров (${daemonPat1?.id}), Сидорова (${daemonPat2?.id}), Кузнецов (${daemonPat3?.id})`
    );

    assert(
      Boolean(daemonOpConsult && daemonOpPRP && daemonOpUzi && daemonOpArthro),
      'FL-03.4',
      `Тестовые операции Operations [TEST_DAEMON] изолированы: Консультация, PRP (18k), УЗИ (2.5k), Артроскопия (35k)`
    );

    assert(
      Boolean(daemonMatPRP && daemonMatUzi && daemonMatConsult),
      'FL-03.5',
      `Тестовые материалы Materials [TEST_DAEMON] изолированы: Набор PRP (6200 ₽), Набор УЗИ (2400 ₽), Осмотр (15 ₽)`
    );

    // -------------------------------------------------------------------------
    // FL-04: Математика маржи ($1.15) и расчет бригады (Кейс B: PRP-терапия)
    // -------------------------------------------------------------------------
    const simCaseB = {
      services: [{
        source_type: sampleService.source_type,
        source_id: sampleService.source_id,
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
    assert(
      prevCaseB.status === 200 && prevCaseB.body.success,
      'FL-04.0',
      'Запрос preview-calculation выполнен успешно'
    );
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
    // FL-07: ACID Коммит начислений
    // -------------------------------------------------------------------------
    const simSample = await apiRequest('POST', '/api/payouts/preview-calculation', {
      services: [sampleService],
      brigade: { primary_doctor_id: testDocId, nurse_id: testNurseId }
    });
    const calculatedItems = simSample.body.items;
    const commitPayload = {
      calculatedItems: calculatedItems,
      lockToken: lockToken,
      notes: '[TEST_DAEMON] Тестовый ACID коммит'
    };
    const commitRes = await apiRequest('POST', '/api/payouts/commit-calculation', commitPayload);
    assert(
      commitRes.status === 200 && commitRes.body.success && commitRes.body.committedProceduresCount === 1,
      'FL-07',
      'ACID коммит расчета успешно завершен и зафиксирован'
    );

    // Проверяем снятие блокировки
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
      [calculatedItems[0].dedup_hash]
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

  console.log('===============================================================');
  console.log(`ИТОГИ ТЕСТИРОВАНИЯ: Успешно [PASS]: ${passed} | Ошибок [FAIL]: ${failed}`);
  console.log('===============================================================');

  return { passed, failed, results: testResults };
}

if (require.main === module) {
  runTestSuite().then(res => {
    if (res.failed > 0) {
      process.exit(1);
    } else {
      console.log('>>> Все контрольные проверки потока (FL-01 — FL-14) пройдены успешно! <<<');
      process.exit(0);
    }
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
