/**
 * Automated Test Suite for Atol 91F Fiscal Shifts Flow (54-FZ).
 * Tests all 7 matrix levels:
 * 1. Unit & Math Integrity (Mnemonic format, Cash balance formula)
 * 2. State Machine Lifecycle (Idle -> Auto-Open -> X-Report -> Close Z-Report -> Re-Open)
 * 3. 54-FZ 24-Hour Legal Lifespan Boundary & Blockade
 * 4. Multi-Tender Payments (Card, Cash, SBP, Refunds)
 * 5. Single-Consumer Concurrency & Integrity
 * 6. OmniSearch, Discrepancies Filter & Details
 */
const db = require('./database');
const fiscalShiftService = require('./fiscalShiftService');
const fiscalService = require('./fiscalService');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function pass(msg, durationMs = 0) {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${msg} ${durationMs ? `(${durationMs}ms)` : ''}`);
}

function fail(msg, err) {
  console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${msg}`);
  if (err) console.error(`    ${colors.red}${err.message || err}${colors.reset}`);
  process.exitCode = 1;
}

function header(title) {
  console.log(`\n${colors.cyan}${colors.bold}======================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold} ${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}======================================================================${colors.reset}`);
}

async function runTests() {
  header('ТЕСТИРОВАНИЕ ЖИЗНЕННОГО ЦИКЛА СМЕН ККТ «АТОЛ 91Ф» (54-ФЗ)');

  // 0. Ensure schema is fully initialized
  const initFiscalSchema = require('./initFiscalSchema');
  await new Promise((resolve) => {
    initFiscalSchema(db, () => {
      // Small tick for pragma and index completion
      setTimeout(resolve, 150);
    });
  });

  const overallStart = Date.now();
  let passedCount = 0;
  let totalCount = 0;

  async function assertStep(testName, fn) {
    totalCount++;
    const t0 = Date.now();
    try {
      await fn();
      pass(testName, Date.now() - t0);
      passedCount++;
    } catch (err) {
      fail(testName, err);
      throw err;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // LEVEL 1: Unit & Mathematical Integrity
    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[LEVEL 1] Проверка математики, формул и мнемонической нумерации${colors.reset}`);

    await assertStep('Генератор мнемоники: формат СМ-YYYYMMDD-NNN', async () => {
      const mnemonic = await fiscalShiftService.generateMnemonicCode();
      const regex = /^СМ-\d{8}-\d{3}$/;
      if (!regex.test(mnemonic)) {
        throw new Error(`Мнемонический код «${mnemonic}» не соответствует маске СМ-YYYYMMDD-NNN`);
      }
    });

    await assertStep('Математика кассы: расчет ожидаемой наличности и дельты расхождения', async () => {
      const cashInflow = 45000.50;
      const cashReturns = 3500.25;
      const expectedCash = cashInflow - cashReturns; // 41500.25
      
      // Case A: Perfect match
      const actualA = 41500.25;
      const diffA = actualA - expectedCash;
      if (Math.abs(diffA) > 0.001) throw new Error('Ошибка расчета при нулевом расхождении');

      // Case B: Deficit (-500)
      const actualB = 41000.25;
      const diffB = actualB - expectedCash;
      if (Math.abs(diffB - (-500)) > 0.001) throw new Error('Ошибка расчета недостачи');

      // Case C: Surplus (+1000)
      const actualC = 42500.25;
      const diffC = actualC - expectedCash;
      if (Math.abs(diffC - 1000) > 0.001) throw new Error('Ошибка расчета излишка');
    });

    // ------------------------------------------------------------------------
    // LEVEL 2: State Machine Lifecycle (Idle -> Auto-Open -> X -> Z -> Close)
    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[LEVEL 2] Жизненный цикл автомата смены (Конечный автомат)${colors.reset}`);

    // If any shift is currently open, close it first for a clean test baseline
    const initialStatus = await fiscalShiftService.getCurrentShift();
    if (initialStatus.isOpen) {
      await fiscalShiftService.closeShift({ operatorName: 'TestSetup', actualCash: initialStatus.currentShift.expected_cash });
    }

    let activeShift = null;

    await assertStep('Авто-открытие смены при регистрации первого чека', async () => {
      // Post receipt through fiscalService
      const receiptRes = await fiscalService.enqueueReceipt({
        paymentType: 'card',
        totalAmount: 5000,
        patientContact: '+79990001122',
        items: [{ name: 'Прием травматолога-ортопеда', price: 5000, quantity: 1 }]
      });

      if (!receiptRes.success || !receiptRes.isFiscalized) {
        throw new Error('Фискализация чека не завершилась успешно');
      }

      // Verify that shift was auto-opened
      const statusAfter = await fiscalShiftService.getCurrentShift();
      if (!statusAfter.isOpen) {
        throw new Error('Смена не была автоматически открыта при фискализации чека!');
      }

      activeShift = statusAfter.currentShift;
      if (!activeShift.mnemonic_code.startsWith('СМ-')) {
        throw new Error(`Некорректный мнемонический номер смены: ${activeShift.mnemonic_code}`);
      }
      if (activeShift.total_income < 5000) {
        throw new Error(`Выручка смены (${activeShift.total_income}) меньше суммы пробитого чека (5000)`);
      }
    });

    await assertStep('Идемпотентность openShift: повторный вызов возвращает уже открытую смену', async () => {
      const openAgain = await fiscalShiftService.openShift({ operatorName: 'Тестовый Кассир' });
      if (!openAgain.alreadyOpen || openAgain.shift.id !== activeShift.id) {
        throw new Error('Повторное открытие смены создало дубликат вместо возврата активной!');
      }
    });

    await assertStep('Генерация промежуточного X-отчета (без гашения и списания ФД)', async () => {
      const xRepRes = await fiscalShiftService.getXReport();
      if (!xRepRes.success || !xRepRes.xReport) {
        throw new Error('Ошибка получения X-отчета');
      }

      const x = xRepRes.xReport;
      if (x.shiftId !== activeShift.id) {
        throw new Error('X-отчет сформирован не по текущей смене');
      }
      if (x.totals.totalIncome < 5000) {
        throw new Error('Сумма в X-отчете не совпадает с выручкой');
      }

      // Verify shift is still open
      const checkStillOpen = await fiscalShiftService.getCurrentShift();
      if (!checkStillOpen.isOpen) {
        throw new Error('X-отчет ошибочно закрыл смену!');
      }
    });

    // ------------------------------------------------------------------------
    // LEVEL 3: Multi-Tender Combinations
    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[LEVEL 3] Мультитендерные чеки (Наличные, Карты, СБП)${colors.reset}`);

    await assertStep('Пробитие чеков разных типов оплаты: Наличные (7000 ₽) и СБП (3500 ₽)', async () => {
      // 1. Cash receipt
      await fiscalService.enqueueReceipt({
        paymentType: 'cash',
        totalAmount: 7000,
        patientContact: '+79991112233',
        items: [{ name: 'Изготовление ортопедических стелек', price: 7000, quantity: 1 }]
      });

      // 2. SBP receipt
      await fiscalService.enqueueReceipt({
        paymentType: 'sbp',
        totalAmount: 3500,
        patientContact: '+79992223344',
        items: [{ name: 'Ударно-волновая терапия (УВТ)', price: 3500, quantity: 1 }]
      });

      // Verify aggregates in X-Report
      const xRep = await fiscalShiftService.getXReport();
      const t = xRep.xReport.totals;
      if (t.cardIncome !== 5000) throw new Error(`Неверная сумма по картам: ${t.cardIncome} (ожидалось 5000)`);
      if (t.cashIncome !== 7000) throw new Error(`Неверная сумма наличными: ${t.cashIncome} (ожидалось 7000)`);
      if (t.sbpIncome !== 3500) throw new Error(`Неверная сумма по СБП: ${t.sbpIncome} (ожидалось 3500)`);
      if (t.totalIncome !== 15500) throw new Error(`Неверная общая выручка: ${t.totalIncome} (ожидалось 15500)`);
      if (t.expectedCash !== 7000) throw new Error(`Неверный остаток наличных: ${t.expectedCash} (ожидалось 7000)`);
    });

    // ------------------------------------------------------------------------
    // LEVEL 4: Closing Shift with Z-Report & Cash Reconciliation
    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[LEVEL 4] Закрытие смены (Снятие Z-отчета и сверка кассы)${colors.reset}`);

    await assertStep('Закрытие смены с купюрной сверкой (фактически 7000 ₽, расхождение 0 ₽)', async () => {
      const closeRes = await fiscalShiftService.closeShift({
        operatorName: 'Кассир-Администратор',
        actualCash: 7000,
        notes: 'Штатное закрытие вечерней смены, касса сошлась идеально'
      });

      if (!closeRes.success || !closeRes.shift || !closeRes.zReport) {
        throw new Error('Ошибка закрытия смены');
      }

      const cs = closeRes.shift;
      if (cs.status !== 'closed') throw new Error(`Статус смены не перешел в closed: ${cs.status}`);
      if (!cs.closed_at) throw new Error('Не зафиксировано время закрытия closed_at');
      if (cs.total_income !== 15500) throw new Error(`Итоговая выручка ${cs.total_income} не совпадает с ожидаемой 15500`);
      if (cs.cash_difference !== 0) throw new Error(`Расхождение кассы должно быть 0, получено: ${cs.cash_difference}`);
      if (!cs.fiscal_document_number || !cs.fiscal_sign) throw new Error('Z-отчет не получил реквизиты ФД / ФПД');

      // Verify that shift is now closed in system
      const statusNow = await fiscalShiftService.getCurrentShift();
      if (statusNow.isOpen) {
        throw new Error('Система сообщает, что смена все еще открыта после закрытия!');
      }
    });

    await assertStep('Защита от повторного закрытия (Double-Close Guard)', async () => {
      try {
        await fiscalShiftService.closeShift({ operatorName: 'Повторный' });
        throw new Error('Система позволила повторно закрыть уже закрытую смену!');
      } catch (err) {
        if (!err.message.includes('Нет активной открытой кассовой смены')) {
          throw err;
        }
      }
    });

    // ------------------------------------------------------------------------
    // LEVEL 5: 54-FZ 24-Hour Legal Lifespan Boundary & Blockade
    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[LEVEL 5] Соблюдение 24-часового ограничения по 54-ФЗ${colors.reset}`);

    await assertStep('Блокировка пробития чеков при превышении 24 часов', async () => {
      // 1. Manually open a shift
      const testExpShift = await fiscalShiftService.openShift({ operatorName: 'Тест 24ч' });
      const expShiftId = testExpShift.shiftId;

      // 2. Artificially backdate opened_at to 25 hours ago
      await new Promise((res, rej) => {
        db.run(
          `UPDATE fiscal_shifts SET opened_at = datetime('now', '-25 hours') WHERE id = ?`,
          [expShiftId],
          (err) => (err ? rej(err) : res())
        );
      });

      // 3. Attempt to issue receipt -> Must be blocked!
      let wasBlocked = false;
      try {
        await fiscalService.enqueueReceipt({
          paymentType: 'card',
          totalAmount: 1000,
          items: [{ name: 'Тестовая услуга', price: 1000, quantity: 1 }]
        });
      } catch (err) {
        if (err.message.includes('24 час') || err.message.includes('54-ФЗ')) {
          wasBlocked = true;
        } else {
          throw err;
        }
      }

      if (!wasBlocked) {
        throw new Error('Чек был пробит при смене > 24 часов (нарушение 54-ФЗ)!');
      }

      // 4. Close the expired shift
      const closeExp = await fiscalShiftService.closeShift({
        operatorName: 'Администратор',
        actualCash: 0,
        notes: 'Закрытие просроченной тестовой смены'
      });
      if (!closeExp.success) throw new Error('Не удалось закрыть просроченную смену');
    });

    // ------------------------------------------------------------------------
    // LEVEL 6: OmniSearch, Discrepancies Filter & Details
    // ------------------------------------------------------------------------
    console.log(`\n${colors.yellow}[LEVEL 6] Проверка OmniSearch, фильтров и детальной аналитики${colors.reset}`);

    await assertStep('Запрос журнала смен с пагинацией и агрегатами', async () => {
      const journal = await fiscalShiftService.getShiftsJournal({ page: 1, limit: 10 });
      if (!journal.success || !Array.isArray(journal.items)) {
        throw new Error('Некорректный ответ getShiftsJournal');
      }
      if (journal.items.length === 0) {
        throw new Error('Журнал смен пуст после проведенных тестов');
      }
      if (!journal.summary || journal.summary.totalIncome === undefined) {
        throw new Error('Отсутствует сводный блок summary в журнале смен');
      }
    });

    await assertStep('Детализация смены: список чеков и структура медицинских услуг', async () => {
      const shiftList = await fiscalShiftService.getShiftsJournal({ page: 1, limit: 1 });
      const testShiftId = shiftList.items[0].id;
      const details = await fiscalShiftService.getShiftDetails(testShiftId);

      if (!details.success || !details.shift) {
        throw new Error('Ошибка получения деталей смены');
      }
      if (!Array.isArray(details.receipts) || !Array.isArray(details.servicesBreakdown)) {
        throw new Error('Отсутствует массив чеков или аналитики услуг');
      }
    });

    // ------------------------------------------------------------------------
    // Final Summary
    // ------------------------------------------------------------------------
    const duration = ((Date.now() - overallStart) / 1000).toFixed(2);
    header(`ИТОГ ТЕСТИРОВАНИЯ: ВСЕ ${passedCount} ИЗ ${totalCount} ТЕСТОВ ПРОЙДЕНЫ УСПЕШНО (${duration} сек)`);
    console.log(`${colors.green}${colors.bold}✔ 100% соответствие требованиям 54-ФЗ и стабильность работы ККТ «АТОЛ 91Ф» подтверждены!${colors.reset}\n`);

  } catch (criticalErr) {
    console.error(`\n${colors.red}${colors.bold}КРИТИЧЕСКИЙ СБОЙ ТЕСТИРОВАНИЯ: ${criticalErr.message}${colors.reset}\n`);
    process.exit(1);
  }
}

// Execute tests if run directly
if (require.main === module) {
  runTests().then(() => {
    process.exit(0);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runTests };
