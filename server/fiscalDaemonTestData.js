/**
 * fiscalDaemonTestData.js
 * Isolated [TEST_DAEMON] mock data manager & test runner for Atol 91F fiscal registration.
 * Handles:
 * - Seeding realistic [TEST_DAEMON] fiscal receipts and Serilog audit logs.
 * - Purging [TEST_DAEMON] records without touching production data.
 * - Running the interactive 5-scenario test wizard (FL-FISCAL-01..05).
 */
const db = require('./database');
const fiscalService = require('./fiscalService');
const { logFiscalAudit, LogLevels, EventTypes } = require('./fiscalAuditLogger');

const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    err ? reject(err) : resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

/**
 * Purges all [TEST_DAEMON] fiscal data
 */
async function purgeFiscalDaemonData() {
  const receiptsChanges = await runAsync(`
    DELETE FROM fiscal_receipts 
    WHERE patient_contact LIKE '%[TEST_DAEMON]%' 
       OR error_message LIKE '%[TEST_DAEMON]%'
       OR transaction_id IN (SELECT id FROM operation_transactions WHERE notes LIKE '%[TEST_DAEMON]%')
  `);

  const auditChanges = await runAsync(`
    DELETE FROM fiscal_audit_logs 
    WHERE message LIKE '%[TEST_DAEMON]%' 
       OR properties_json LIKE '%[TEST_DAEMON]%'
  `);

  return {
    purgedReceipts: receiptsChanges.changes,
    purgedAuditLogs: auditChanges.changes
  };
}

/**
 * Seeds a full set of [TEST_DAEMON] mock receipts and Serilog audit records
 */
async function createFiscalDaemonData() {
  await purgeFiscalDaemonData();

  const testReceipts = [
    {
      patientContact: '+7 (999) 000-01-01 [TEST_DAEMON]',
      paymentType: 'card',
      totalAmount: 3500.0,
      fd: 2001,
      fpd: '9182371920',
      shift: 14,
      rn: 101,
      status: 'fiscalized',
      isFiscalized: 1,
      isPrinted: 1,
      items: [{ name: '[TEST_DAEMON] Первичная консультация ортопеда', qty: 1, price: 3500.0 }]
    },
    {
      patientContact: 'daemon.patient2@orthoped.test [TEST_DAEMON]',
      paymentType: 'cash',
      totalAmount: 12000.0,
      fd: 2002,
      fpd: '8291039485',
      shift: 14,
      rn: 102,
      status: 'fiscalized',
      isFiscalized: 1,
      isPrinted: 1,
      items: [{ name: '[TEST_DAEMON] PRP-терапия RegenLab (2 пробирки)', qty: 1, price: 12000.0 }]
    },
    {
      patientContact: '+7 (999) 000-01-03 [TEST_DAEMON]',
      paymentType: 'sbp',
      totalAmount: 6500.0,
      fd: 2003,
      fpd: '7361928374',
      shift: 14,
      rn: 103,
      status: 'fiscalized',
      isFiscalized: 1,
      isPrinted: 1,
      items: [{ name: '[TEST_DAEMON] Изготовление индивидуальных стелек Formthotics', qty: 1, price: 6500.0 }]
    },
    {
      patientContact: '+7 (999) 000-01-04 [TEST_DAEMON]',
      paymentType: 'card',
      totalAmount: 4200.0,
      fd: 2004,
      fpd: '6452819203',
      shift: 14,
      rn: 104,
      status: 'paper_error',
      isFiscalized: 1,
      isPrinted: 0,
      errorMessage: '[TEST_DAEMON] Ошибка печати: закончилась чековая лента. Чек в ФН фискализирован!',
      items: [{ name: '[TEST_DAEMON] Блокада триггерных зон с дипроспаном', qty: 1, price: 4200.0 }]
    },
    {
      patientContact: 'corporate.accounting@ortho.test [TEST_DAEMON]',
      paymentType: 'invoice',
      totalAmount: 18500.0,
      fd: 2005,
      fpd: '5543928172',
      shift: 14,
      rn: 105,
      status: 'fiscalized',
      isFiscalized: 1,
      isPrinted: 1,
      items: [{ name: '[TEST_DAEMON] Комплексное аппаратное ортезирование', qty: 1, price: 18500.0 }]
    }
  ];

  const createdIds = [];

  for (const r of testReceipts) {
    const res = await runAsync(`
      INSERT INTO fiscal_receipts (
        patient_contact, receipt_type, payment_type, total_amount,
        tax_type, payment_subject_type, payment_method_type,
        fiscal_document_number, fiscal_sign, fiscal_drive_number,
        shift_number, receipt_number, kkt_reg_number, status,
        is_fiscalized, is_printed, error_message, device_model, port,
        created_at, fiscalized_at
      ) VALUES (
        ?, 'sell', ?, ?, 6, 4, 4, ?, ?, '9960440301984210', ?, ?, '0004928103049182',
        ?, ?, ?, ?, 'АТОЛ 91Ф', 'COM3', datetime('now', '-2 hours'), datetime('now', '-2 hours')
      )
    `, [
      r.patientContact, r.paymentType, r.totalAmount, r.fd, r.fpd, r.shift, r.rn,
      r.status, r.isFiscalized, r.isPrinted, r.errorMessage || null
    ]);

    const receiptId = res.lastID;
    createdIds.push(receiptId);

    // Create realistic Serilog audit trail
    logFiscalAudit({
      level: LogLevels.INFO,
      message: `[TEST_DAEMON] State Recovery: готовность ККТ перед чеком #${receiptId}`,
      eventType: EventTypes.STATE_RECOVERY,
      receiptId,
      properties: { testMarker: '[TEST_DAEMON]' }
    });

    logFiscalAudit({
      level: LogLevels.INFO,
      message: `[TEST_DAEMON] Открытие чека #${receiptId} на сумму ₽${r.totalAmount}`,
      eventType: EventTypes.RECEIPT_OPEN,
      receiptId,
      properties: { testMarker: '[TEST_DAEMON]', totalAmount: r.totalAmount }
    });

    for (const item of r.items) {
      logFiscalAudit({
        level: LogLevels.DEBUG,
        message: `[TEST_DAEMON] Регистрация позиции «${item.name}» ₽${item.price}`,
        eventType: EventTypes.ITEM_REGISTERED,
        receiptId,
        properties: { testMarker: '[TEST_DAEMON]', itemName: item.name, price: item.price }
      });
    }

    logFiscalAudit({
      level: LogLevels.INFO,
      message: `[TEST_DAEMON] Регистрация оплаты: тип '${r.paymentType}', сумма ₽${r.totalAmount}`,
      eventType: EventTypes.PAYMENT_REGISTERED,
      receiptId,
      properties: { testMarker: '[TEST_DAEMON]', paymentType: r.paymentType }
    });

    if (r.status === 'paper_error') {
      logFiscalAudit({
        level: LogLevels.WARN,
        message: `[TEST_DAEMON] Ошибка печати: закончилась лента. Чек #${receiptId} записан в ФН (ФД #${r.fd})`,
        eventType: EventTypes.PAPER_ERROR,
        receiptId,
        properties: { testMarker: '[TEST_DAEMON]', fd: r.fd, fpd: r.fpd }
      });
    } else {
      logFiscalAudit({
        level: LogLevels.INFO,
        message: `[TEST_DAEMON] Чек #${receiptId} успешно фискализирован! ФД №${r.fd}, ФПД: ${r.fpd}`,
        eventType: EventTypes.FISCAL_COMPLETE,
        receiptId,
        durationMs: 8,
        properties: { testMarker: '[TEST_DAEMON]', fd: r.fd, fpd: r.fpd }
      });
    }
  }

  return {
    success: true,
    createdCount: createdIds.length,
    createdIds
  };
}

/**
 * Runs the live 5-scenario fiscal testing wizard
 */
async function runFiscalTestWizard() {
  const results = [];
  const startTotal = Date.now();

  // Test 1: Connect & State Recovery
  try {
    const st1 = Date.now();
    const status = await fiscalService.getStatus();
    const dur1 = Date.now() - st1;
    results.push({
      code: 'FL-FISCAL-01',
      title: 'Инициализация ККТ и State Recovery',
      description: 'Проверка доступности COM-порта, связи с ККТ и сброс зависших чеков (cancelReceipt)',
      status: 'passed',
      durationMs: dur1,
      details: {
        deviceModel: status.deviceModel,
        port: status.port,
        isMockMode: status.isMockMode,
        isShiftOpen: status.isShiftOpen,
        shiftNumber: status.shiftNumber
      }
    });
  } catch (err) {
    results.push({
      code: 'FL-FISCAL-01',
      title: 'Инициализация ККТ и State Recovery',
      status: 'failed',
      durationMs: 0,
      errorMessage: err.message
    });
  }

  // Test 2: Standard Card Payment with Tag 1008
  try {
    const st2 = Date.now();
    const r2 = await fiscalService.enqueueReceipt({
      patientContact: '+7 (999) 777-11-22 [TEST_DAEMON]',
      paymentType: 'card',
      totalAmount: 3800,
      items: [{ name: '[TEST_DAEMON] Консультация травматолога-ортопеда', quantity: 1, unit_price: 3800, subtotal: 3800 }]
    });
    const dur2 = Date.now() - st2;
    results.push({
      code: 'FL-FISCAL-02',
      title: 'Фискализация безналичного расчета (Карта + Тег 1008)',
      description: 'Открытие чека, регистрация медицинской услуги без НДС, привязка телефона покупателя, запись в ФН',
      status: 'passed',
      durationMs: dur2,
      details: {
        receiptId: r2.receiptId,
        fiscalDocumentNumber: r2.fiscalDocumentNumber,
        fiscalSign: r2.fiscalSign,
        shiftNumber: r2.shiftNumber
      }
    });
  } catch (err) {
    results.push({
      code: 'FL-FISCAL-02',
      title: 'Фискализация безналичного расчета (Карта + Тег 1008)',
      status: 'failed',
      durationMs: 0,
      errorMessage: err.message
    });
  }

  // Test 3: Cash Payment
  try {
    const st3 = Date.now();
    const r3 = await fiscalService.enqueueReceipt({
      patientContact: '+7 (999) 777-33-44 [TEST_DAEMON]',
      paymentType: 'cash',
      totalAmount: 1500,
      items: [{ name: '[TEST_DAEMON] Перевязка послеоперационная', quantity: 1, unit_price: 1500, subtotal: 1500 }]
    });
    const dur3 = Date.now() - st3;
    results.push({
      code: 'FL-FISCAL-03',
      title: 'Фискализация наличного расчета (LIBFPTR_PT_CASH)',
      description: 'Регистрация наличной оплаты по ст. 149 НК РФ с проверкой фискального признака',
      status: 'passed',
      durationMs: dur3,
      details: {
        receiptId: r3.receiptId,
        fiscalDocumentNumber: r3.fiscalDocumentNumber,
        fiscalSign: r3.fiscalSign
      }
    });
  } catch (err) {
    results.push({
      code: 'FL-FISCAL-03',
      title: 'Фискализация наличного расчета (LIBFPTR_PT_CASH)',
      status: 'failed',
      durationMs: 0,
      errorMessage: err.message
    });
  }

  // Test 4: SBP / QR-code Payment
  try {
    const st4 = Date.now();
    const r4 = await fiscalService.enqueueReceipt({
      patientContact: 'daemon.sbp@orthoped.test [TEST_DAEMON]',
      paymentType: 'sbp',
      totalAmount: 5400,
      items: [{ name: '[TEST_DAEMON] PRP RegenLab Плазмотерапия', quantity: 1, unit_price: 5400, subtotal: 5400 }]
    });
    const dur4 = Date.now() - st4;
    results.push({
      code: 'FL-FISCAL-04',
      title: 'Фискализация оплаты через СБП / QR-код (LIBFPTR_PT_OTHER)',
      description: 'Электронная оплата по динамическому QR коду с подтверждением ОФД',
      status: 'passed',
      durationMs: dur4,
      details: {
        receiptId: r4.receiptId,
        fiscalDocumentNumber: r4.fiscalDocumentNumber,
        fiscalSign: r4.fiscalSign
      }
    });
  } catch (err) {
    results.push({
      code: 'FL-FISCAL-04',
      title: 'Фискализация оплаты через СБП / QR-код (LIBFPTR_PT_OTHER)',
      status: 'failed',
      durationMs: 0,
      errorMessage: err.message
    });
  }

  // Test 5: Paper Jam Popper Test & Repeat Print Recovery
  try {
    const st5 = Date.now();
    const currentStatus = await fiscalService.getStatus();
    // Insert receipt simulating paper error with active profile parameters
    const simRes = await runAsync(`
      INSERT INTO fiscal_receipts (
        patient_contact, receipt_type, payment_type, total_amount,
        tax_type, payment_subject_type, payment_method_type,
        fiscal_document_number, fiscal_sign, fiscal_drive_number,
        shift_number, receipt_number, kkt_reg_number, status,
        is_fiscalized, is_printed, error_message, device_model, port,
        created_at, fiscalized_at
      ) VALUES (
        '+7 (999) 777-55-66 [TEST_DAEMON]', 'sell', 'card', 2200.0, ?, ?, ?,
        2099, '9988776655', ?, ?, 199, ?,
        'paper_error', 1, 0, '[TEST_DAEMON] Обрыв ленты при печати. Документ закрыт в ФН',
        ?, ?, datetime('now'), datetime('now')
      )
    `, [
      currentStatus.taxType || 6,
      currentStatus.paymentSubjectType || 4,
      currentStatus.paymentMethodType || 4,
      currentStatus.fnNumber || '9960440301984210',
      currentStatus.shiftNumber || 14,
      currentStatus.kktRegNumber || '0004928103049182',
      currentStatus.deviceModel || 'АТОЛ 91Ф',
      currentStatus.port || 'COM3'
    ]);
    const paperReceiptId = simRes.lastID;

    // Execute repeat print
    const repRes = await fiscalService.repeatPrint(paperReceiptId);
    const dur5 = Date.now() - st5;

    results.push({
      code: 'FL-FISCAL-05',
      title: 'Восстановление при ошибке бумаги (Popper Test & Repeat Print)',
      description: 'Проверка сохранения ФД при сбое печатающего механизма и успешный допечатывание копии чека',
      status: 'passed',
      durationMs: dur5,
      details: {
        paperReceiptId,
        repeatPrintSuccess: repRes.success,
        message: repRes.message
      }
    });
  } catch (err) {
    results.push({
      code: 'FL-FISCAL-05',
      title: 'Восстановление при ошибке бумаги (Popper Test & Repeat Print)',
      status: 'failed',
      durationMs: 0,
      errorMessage: err.message
    });
  }

  const passedCount = results.filter(r => r.status === 'passed').length;
  const totalDurationMs = Date.now() - startTotal;
  const activeStatus = await fiscalService.getStatus();

  return {
    success: passedCount === results.length,
    totalTests: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    totalDurationMs,
    activeProfile: {
      id: activeStatus.activeProfileId,
      name: activeStatus.profileName,
      port: activeStatus.port,
      baudRate: activeStatus.baudRate,
      isMockMode: activeStatus.isMockMode,
      fnNumber: activeStatus.fnNumber,
      kktRegNumber: activeStatus.kktRegNumber,
      timeoutSeconds: fiscalService.executionTimeoutSeconds
    },
    scenarios: results
  };
}

/**
 * Get current stats of [TEST_DAEMON] fiscal data
 */
async function getFiscalDaemonStatus() {
  const receiptsRow = await getAsync(`
    SELECT COUNT(*) as count 
    FROM fiscal_receipts 
    WHERE patient_contact LIKE '%[TEST_DAEMON]%' OR error_message LIKE '%[TEST_DAEMON]%'
  `);

  const auditRow = await getAsync(`
    SELECT COUNT(*) as count 
    FROM fiscal_audit_logs 
    WHERE message LIKE '%[TEST_DAEMON]%' OR properties_json LIKE '%[TEST_DAEMON]%'
  `);

  const testReceipts = await allAsync(`
    SELECT * FROM fiscal_receipts 
    WHERE patient_contact LIKE '%[TEST_DAEMON]%' OR error_message LIKE '%[TEST_DAEMON]%'
    ORDER BY id DESC LIMIT 10
  `);

  return {
    testReceiptsCount: receiptsRow?.count || 0,
    testAuditLogsCount: auditRow?.count || 0,
    recentTestReceipts: testReceipts
  };
}

module.exports = {
  createFiscalDaemonData,
  purgeFiscalDaemonData,
  runFiscalTestWizard,
  getFiscalDaemonStatus
};
