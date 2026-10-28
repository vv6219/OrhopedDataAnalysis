const express = require('express');
const router = express.Router();
const fiscalShiftService = require('./fiscalShiftService');
const XLSX = require('xlsx');
const { logUserAction, UserActionEvents, getClientIp, getUserContext } = require('./userActionAuditLogger');

/**
 * Encodes Content-Disposition attachment header safely according to RFC 5987 / RFC 6266.
 * Uses ASCII fallback and UTF-8 encoded filename* to support Russian Cyrillic without header char errors.
 */
function formatDispositionHeader(prefix, shift, ext) {
  const safeAscii = (shift.mnemonic_code || `shift_${shift.id}`).replace(/[^\x20-\x7E]/g, '').replace(/[\s\[\]]/g, '_') || `shift_${shift.id}`;
  const asciiFilename = `${prefix}_${safeAscii}.${ext}`;
  const rawRussianFilename = `${prefix}_${shift.mnemonic_code}.${ext}`.replace(/[\r\n"]/g, '');
  const encodedFilename = encodeURIComponent(rawRussianFilename);
  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`;
}

/**
 * GET /api/fiscal/shifts/current
 * Returns the currently active shift (or null if closed) along with 24h lifespan warnings.
 */
router.get('/current', async (req, res) => {
  try {
    const current = await fiscalShiftService.getCurrentShift();
    res.json(current);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fiscal/shifts/open
 * Manually opens a new shift or returns already open shift.
 */
router.post('/open', async (req, res) => {
  const startTime = Date.now();
  const user = getUserContext(req);
  const clientIp = getClientIp(req);
  try {
    const { operatorName = user.username || user.user || 'Администратор' } = req.body;
    const result = await fiscalShiftService.openShift({ operatorName, autoOpened: false });
    
    logUserAction({
      eventType: UserActionEvents.FISCAL_SHIFT_OPENED,
      sourceContext: 'OrthoErp.FiscalShifts',
      message: `Открыта кассовая смена №${result.shift?.shift_number || result.shift?.id || '—'} (${result.shift?.mnemonic_code || '—'}), оператор: ${operatorName}`,
      userId: user.userId,
      username: user.username || operatorName,
      clientIp,
      durationMs: Date.now() - startTime,
      properties: {
        shiftId: result.shift?.id,
        shiftNumber: result.shift?.shift_number,
        mnemonicCode: result.shift?.mnemonic_code,
        operatorName,
        status: result.shift?.status,
        alreadyOpen: result.alreadyOpen || false
      }
    });

    res.json(result);
  } catch (err) {
    logUserAction({
      level: 'Error',
      eventType: UserActionEvents.FISCAL_SHIFT_OPENED,
      sourceContext: 'OrthoErp.FiscalShifts',
      message: `Ошибка открытия кассовой смены: ${err.message}`,
      userId: user.userId,
      username: user.username,
      clientIp,
      durationMs: Date.now() - startTime,
      exception: err
    });
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/fiscal/shifts/x-report
 * Generates an intermediate X-report without closing the shift.
 */
router.get('/x-report', async (req, res) => {
  const startTime = Date.now();
  const user = getUserContext(req);
  const clientIp = getClientIp(req);
  try {
    const xReport = await fiscalShiftService.getXReport();

    logUserAction({
      eventType: UserActionEvents.FISCAL_X_REPORT_PRINTED,
      sourceContext: 'OrthoErp.FiscalShifts',
      message: `Сформирован X-отчет для смены №${xReport.shift?.shift_number || xReport.shift?.id || '—'} (Выручка: ${xReport.totalIncome || 0} ₽, чеков: ${xReport.receiptsCount || 0})`,
      userId: user.userId,
      username: user.username,
      clientIp,
      durationMs: Date.now() - startTime,
      properties: {
        shiftId: xReport.shift?.id,
        shiftNumber: xReport.shift?.shift_number,
        mnemonicCode: xReport.shift?.mnemonic_code,
        totalIncome: xReport.totalIncome,
        cashIncome: xReport.cashIncome,
        cardIncome: xReport.cardIncome,
        receiptsCount: xReport.receiptsCount
      }
    });

    res.json(xReport);
  } catch (err) {
    logUserAction({
      level: 'Error',
      eventType: UserActionEvents.FISCAL_X_REPORT_PRINTED,
      sourceContext: 'OrthoErp.FiscalShifts',
      message: `Ошибка формирования X-отчета: ${err.message}`,
      userId: user.userId,
      username: user.username,
      clientIp,
      durationMs: Date.now() - startTime,
      exception: err
    });
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/fiscal/shifts/close
 * Closes the active shift and generates Z-Report (with cash reconciliation).
 */
router.post('/close', async (req, res) => {
  const startTime = Date.now();
  const user = getUserContext(req);
  const clientIp = getClientIp(req);
  try {
    const { operatorName = user.username || user.user || 'Администратор', actualCash = null, notes = '' } = req.body;
    const result = await fiscalShiftService.closeShift({ operatorName, actualCash, notes });

    logUserAction({
      eventType: UserActionEvents.FISCAL_SHIFT_CLOSED,
      sourceContext: 'OrthoErp.FiscalShifts',
      message: `Закрыта кассовая смена №${result.shift?.shift_number || result.shift?.id || '—'} (${result.shift?.mnemonic_code || '—'}) с Z-отчетом №${result.zReport?.zReportNumber || result.shift?.z_report_number || '—'} (Выручка: ${result.shift?.total_income || 0} ₽)`,
      userId: user.userId,
      username: user.username || operatorName,
      clientIp,
      durationMs: Date.now() - startTime,
      properties: {
        shiftId: result.shift?.id,
        shiftNumber: result.shift?.shift_number,
        mnemonicCode: result.shift?.mnemonic_code,
        zReportNumber: result.zReport?.zReportNumber || result.shift?.z_report_number,
        fiscalDocumentNumber: result.shift?.fiscal_document_number,
        fiscalSign: result.shift?.fiscal_sign,
        totalIncome: result.shift?.total_income,
        cashIncome: result.shift?.cash_income,
        cardIncome: result.shift?.card_income,
        sbpIncome: result.shift?.sbp_income,
        expectedCash: result.shift?.expected_cash,
        actualCash: result.shift?.actual_cash,
        cashDifference: result.shift?.cash_difference,
        notes: result.shift?.notes
      }
    });

    res.json(result);
  } catch (err) {
    logUserAction({
      level: 'Error',
      eventType: UserActionEvents.FISCAL_SHIFT_CLOSED,
      sourceContext: 'OrthoErp.FiscalShifts',
      message: `Ошибка закрытия кассовой смены: ${err.message}`,
      userId: user.userId,
      username: user.username,
      clientIp,
      durationMs: Date.now() - startTime,
      exception: err
    });
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/fiscal/shifts
 * Retrieves journal of shifts with OmniSearch, status, date filters, and discrepancy filtering.
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      onlyDiscrepancies = false,
      cashier = ''
    } = req.query;

    const data = await fiscalShiftService.getShiftsJournal({
      page,
      limit,
      search,
      status,
      dateFrom,
      dateTo,
      onlyDiscrepancies,
      cashier
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fiscal/shifts/:id
 * Retrieves full details of a specific shift: receipts list, service breakdown, audit logs.
 */
router.get('/:id', async (req, res) => {
  try {
    const details = await fiscalShiftService.getShiftDetails(req.params.id);
    res.json(details);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * GET /api/fiscal/shifts/:id/export/json
 * Returns raw structured JSON snapshot of the shift and Z-report.
 */
router.get('/:id/export/json', async (req, res) => {
  const user = getUserContext(req);
  const clientIp = getClientIp(req);
  try {
    const details = await fiscalShiftService.getShiftDetails(req.params.id);
    
    logUserAction({
      eventType: UserActionEvents.FISCAL_SHIFT_AUDIT_EXPORT,
      sourceContext: 'OrthoErp.FiscalShifts',
      message: `Экспортирован JSON-отчет кассовой смены №${details.shift?.shift_number || req.params.id} (${details.shift?.mnemonic_code || '—'})`,
      userId: user.userId,
      username: user.username,
      clientIp,
      properties: {
        shiftId: req.params.id,
        shiftNumber: details.shift?.shift_number,
        mnemonicCode: details.shift?.mnemonic_code,
        format: 'json'
      }
    });

    res.setHeader('Content-Disposition', formatDispositionHeader('Shift', details.shift, 'json'));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fiscal/shifts/:id/export/excel
 * Generates and downloads a multi-sheet Excel (.xlsx) file.
 */
router.get('/:id/export/excel', async (req, res) => {
  const user = getUserContext(req);
  const clientIp = getClientIp(req);
  try {
    const details = await fiscalShiftService.getShiftDetails(req.params.id);
    const { shift, receipts, servicesBreakdown, zReport } = details;

    logUserAction({
      eventType: UserActionEvents.FISCAL_SHIFT_AUDIT_EXPORT,
      sourceContext: 'OrthoErp.FiscalShifts',
      message: `Экспортирован Excel (.xlsx) отчет кассовой смены №${shift?.shift_number || req.params.id} (${shift?.mnemonic_code || '—'})`,
      userId: user.userId,
      username: user.username,
      clientIp,
      properties: {
        shiftId: req.params.id,
        shiftNumber: shift?.shift_number,
        mnemonicCode: shift?.mnemonic_code,
        receiptsCount: receipts?.length || 0,
        servicesCount: servicesBreakdown?.length || 0,
        format: 'excel'
      }
    });

    // 1. Sheet 1: Shift Summary
    const summaryRows = [
      ['Центр Ортопедии и Травматологии Добрушкина (г. Сочи)'],
      ['ОТЧЕТ О РЕЗУЛЬТАТАХ КАССОВОЙ СМЕНЫ (ККТ АТОЛ 91Ф)'],
      [''],
      ['Параметр', 'Значение'],
      ['Мнемонический номер смены', shift.mnemonic_code],
      ['Номер смены в ФН (тег 1038)', shift.shift_number],
      ['Статус смены', shift.status === 'open' ? 'Открыта' : 'Закрыта'],
      ['Дата и время открытия', shift.opened_at],
      ['Кассир открытия', shift.opened_by],
      ['Дата и время закрытия', shift.closed_at || '—'],
      ['Кассир закрытия', shift.closed_by || '—'],
      ['Длительность смены (мин)', shift.duration_minutes || '—'],
      [''],
      ['ФИНАНСОВЫЕ ИТОГИ', ''],
      ['Всего чеков прихода', shift.receipts_count || 0],
      ['Всего чеков возврата', shift.returns_count || 0],
      ['Общая выручка (₽)', shift.total_income || 0],
      ['Оплата наличными (₽)', shift.cash_income || 0],
      ['Оплата банковскими картами (₽)', shift.card_income || 0],
      ['Оплата СБП (QR-код) (₽)', shift.sbp_income || 0],
      ['Сумма возвратов (₽)', shift.total_returns || 0],
      [''],
      ['СВЕРКА КАССЫ', ''],
      ['Расчетный остаток наличных (₽)', shift.expected_cash || 0],
      ['Фактически пересчитано (₽)', shift.actual_cash !== null ? shift.actual_cash : '—'],
      ['Расхождение кассы (₽)', shift.cash_difference || 0],
      ['Комментарий / Причина', shift.notes || '—'],
      [''],
      ['ФИСКАЛЬНЫЕ РЕКВИЗИТЫ Z-ОТЧЕТА', ''],
      ['Номер Z-отчета', shift.z_report_number || '—'],
      ['Номер ФД (тег 1040)', shift.fiscal_document_number || '—'],
      ['ФПД (тег 1077)', shift.fiscal_sign || '—']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

    // 2. Sheet 2: Receipts Register
    const receiptsHeader = [
      '№', 'Номер ФД', 'Номер чека', 'Тип', 'Способ оплаты', 'Сумма (₽)', 'ФИО Пациента', 'Телефон/Email (тег 1008)', 'Время фискализации'
    ];
    const receiptsRows = [receiptsHeader];

    receipts.forEach((r, idx) => {
      receiptsRows.push([
        idx + 1,
        r.fiscal_document_number || '—',
        r.receipt_number || '—',
        r.receipt_type === 'sell' ? 'Приход' : 'Возврат',
        r.payment_type === 'card' ? 'Банк. карта' : (r.payment_type === 'cash' ? 'Наличные' : 'СБП (QR)'),
        r.total_amount,
        r.patient_fio || 'Пациент клиники',
        r.patient_contact || '—',
        r.fiscalized_at || r.created_at
      ]);
    });

    const wsReceipts = XLSX.utils.aoa_to_sheet(receiptsRows);

    // 3. Sheet 3: Services Breakdown
    const servicesHeader = ['№', 'Наименование медицинской услуги', 'Количество (шт.)', 'Общая сумма (₽)'];
    const servicesRows = [servicesHeader];

    servicesBreakdown.forEach((s, idx) => {
      servicesRows.push([idx + 1, s.name, s.quantity, s.totalAmount]);
    });

    const wsServices = XLSX.utils.aoa_to_sheet(servicesRows);

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Итоги смены');
    XLSX.utils.book_append_sheet(wb, wsReceipts, 'Реестр чеков');
    XLSX.utils.book_append_sheet(wb, wsServices, 'Услуги смены');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', formatDispositionHeader('Shift', shift, 'xlsx'));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
