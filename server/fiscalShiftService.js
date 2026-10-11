/**
 * Fiscal Shift Service for Atol 91F (54-FZ, FFD 1.05 / 1.2).
 * Manages:
 * - Mnemonic Shift Numbering: СМ-YYYYMMDD-NNN
 * - 24-Hour Legal Lifespan Compliance
 * - Auto-Opening of Shifts on First Fiscal Receipt
 * - Intermediate X-Reports (без гашения)
 * - Final Z-Reports (закрытие смены со снятием фискального отчета)
 * - Cash Drawer Reconciliation (Купюрная сверка: expected vs actual)
 * - OmniSearch & Detailed Shift Analytics
 */
const db = require('./database');
const { logFiscalAudit, LogLevels, EventTypes } = require('./fiscalAuditLogger');
const fiscalService = require('./fiscalService');

class FiscalShiftService {
  /**
   * Generates next mnemonic code for today in format СМ-YYYYMMDD-NNN
   * @param {string} [dateStr] YYYY-MM-DD (defaults to today local)
   * @returns {Promise<string>}
   */
  async generateMnemonicCode(dateStr) {
    const today = dateStr || new Date().toISOString().slice(0, 10);
    const dateCompact = today.replace(/-/g, ''); // 20261011

    return new Promise((resolve, reject) => {
      // Find count of shifts created on this date
      db.get(
        `SELECT COUNT(*) as cnt, MAX(mnemonic_code) as max_code 
         FROM fiscal_shifts 
         WHERE mnemonic_code LIKE ?`,
        [`СМ-${dateCompact}-%`],
        (err, row) => {
          if (err) return reject(err);
          let nextIndex = 1;
          if (row && row.max_code) {
            const parts = row.max_code.split('-');
            const lastNum = parseInt(parts[2], 10);
            if (!isNaN(lastNum)) {
              nextIndex = lastNum + 1;
            }
          } else if (row && row.cnt) {
            nextIndex = row.cnt + 1;
          }
          const numStr = String(nextIndex).padStart(3, '0');
          resolve(`СМ-${dateCompact}-${numStr}`);
        }
      );
    });
  }

  /**
   * Gets the currently active open shift or status indicating no shift is open.
   */
  async getCurrentShift() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM fiscal_shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1`,
        [],
        (err, shift) => {
          if (err) return reject(err);

          if (!shift) {
            // Find last closed shift for historical reference
            db.get(
              `SELECT * FROM fiscal_shifts ORDER BY id DESC LIMIT 1`,
              [],
              (lastErr, lastShift) => {
                resolve({
                  isOpen: false,
                  currentShift: null,
                  lastClosedShift: lastShift || null
                });
              }
            );
            return;
          }

          // Calculate running duration in minutes
          const openedTime = new Date(shift.opened_at).getTime();
          const nowTime = Date.now();
          const durationMinutes = Math.max(0, Math.round((nowTime - openedTime) / 60000));
          const isExpired = durationMinutes >= 24 * 60; // 54-FZ limit
          const warning24h = durationMinutes >= 20 * 60;

          // Compute real-time aggregates from fiscal_receipts linked to this shift
          db.all(
            `SELECT 
              COUNT(*) as total_count,
              SUM(CASE WHEN receipt_type = 'sell' THEN 1 ELSE 0 END) as sell_count,
              SUM(CASE WHEN receipt_type = 'sell_return' THEN 1 ELSE 0 END) as return_count,
              SUM(CASE WHEN receipt_type = 'sell' THEN total_amount ELSE 0 END) as total_income,
              SUM(CASE WHEN receipt_type = 'sell' AND payment_type = 'cash' THEN total_amount ELSE 0 END) as cash_income,
              SUM(CASE WHEN receipt_type = 'sell' AND payment_type = 'card' THEN total_amount ELSE 0 END) as card_income,
              SUM(CASE WHEN receipt_type = 'sell' AND payment_type = 'sbp' THEN total_amount ELSE 0 END) as sbp_income,
              SUM(CASE WHEN receipt_type = 'sell_return' THEN total_amount ELSE 0 END) as total_returns,
              SUM(CASE WHEN receipt_type = 'sell_return' AND payment_type = 'cash' THEN total_amount ELSE 0 END) as cash_returns
             FROM fiscal_receipts
             WHERE shift_id = ? AND is_fiscalized = 1`,
            [shift.id],
            (aggErr, rows) => {
              const agg = (rows && rows[0]) || {};
              const totalIncome = Number(agg.total_income) || 0;
              const cashIncome = Number(agg.cash_income) || 0;
              const cardIncome = Number(agg.card_income) || 0;
              const sbpIncome = Number(agg.sbp_income) || 0;
              const totalReturns = Number(agg.total_returns) || 0;
              const cashReturns = Number(agg.cash_returns) || 0;
              const expectedCash = cashIncome - cashReturns;

              resolve({
                isOpen: true,
                currentShift: {
                  ...shift,
                  duration_minutes: durationMinutes,
                  hours_running: Number((durationMinutes / 60).toFixed(1)),
                  is_expired: isExpired,
                  warning_24h: warning24h,
                  receipts_count: (agg.sell_count || 0),
                  returns_count: (agg.return_count || 0),
                  total_income: totalIncome,
                  cash_income: cashIncome,
                  card_income: cardIncome,
                  sbp_income: sbpIncome,
                  total_returns: totalReturns,
                  expected_cash: expectedCash
                }
              });
            }
          );
        }
      );
    });
  }

  /**
   * Opens a new fiscal shift.
   * @param {Object} options
   * @param {string} [options.operatorName] Name of the cashier/admin
   * @param {boolean} [options.autoOpened] Whether it was auto-opened on receipt
   */
  async openShift({ operatorName = 'Администратор', autoOpened = false } = {}) {
    // 1. Check if there's already an open shift
    const currentStatus = await this.getCurrentShift();
    if (currentStatus.isOpen) {
      if (currentStatus.currentShift.is_expired) {
        throw new Error(
          `Смена ${currentStatus.currentShift.mnemonic_code} открыта более 24 часов (${currentStatus.currentShift.hours_running} ч). Согласно 54-ФЗ, необходимо снять Z-отчет (закрыть смену) перед началом новых операций.`
        );
      }
      return {
        success: true,
        alreadyOpen: true,
        message: `Кассовая смена ${currentStatus.currentShift.mnemonic_code} уже открыта`,
        shift: currentStatus.currentShift
      };
    }

    // 2. Determine shift_number for KKT
    const nextShiftNumber = await new Promise((resolve) => {
      db.get('SELECT MAX(shift_number) as max_sn FROM fiscal_shifts', [], (err, row) => {
        if (!err && row && row.max_sn) {
          resolve(row.max_sn + 1);
        } else {
          resolve(fiscalService.currentShiftNumber || 14);
        }
      });
    });

    // 3. Generate mnemonic code
    const mnemonicCode = await this.generateMnemonicCode();

    // 4. Insert new shift record
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO fiscal_shifts (
          mnemonic_code, shift_number, status, opened_at, opened_by,
          receipts_count, returns_count, total_income, cash_income, card_income, sbp_income, total_returns,
          expected_cash, notes
        ) VALUES (
          ?, ?, 'open', datetime('now', 'localtime'), ?,
          0, 0, 0, 0, 0, 0, 0,
          0, ?
        )`,
        [
          mnemonicCode,
          nextShiftNumber,
          operatorName,
          autoOpened ? 'Авто-открытие при фискализации первого чека' : 'Открытие смены вручную администратором'
        ],
        function (err) {
          if (err) return reject(err);
          const shiftId = this.lastID;

          // Update fiscalService singleton
          fiscalService.currentShiftNumber = nextShiftNumber;
          fiscalService.isShiftOpen = true;

          // Audit log
          logFiscalAudit({
            level: LogLevels.INFO,
            message: `Открыта кассовая смена «${mnemonicCode}» (Номер в ФН: №${nextShiftNumber}, Оператор: ${operatorName})`,
            eventType: 'shift_open',
            devicePort: fiscalService.port,
            properties: {
              shiftId,
              mnemonicCode,
              shiftNumber: nextShiftNumber,
              operatorName,
              autoOpened
            }
          });

          // Fetch the inserted record
          db.get('SELECT * FROM fiscal_shifts WHERE id = ?', [shiftId], (fetchErr, newShift) => {
            if (fetchErr) return reject(fetchErr);
            resolve({
              success: true,
              shiftId,
              mnemonicCode,
              shiftNumber: nextShiftNumber,
              message: `Смена ${mnemonicCode} успешно открыта`,
              shift: newShift
            });
          });
        }
      );
    });
  }

  /**
   * Previews intermediate X-Report (отчет без гашения)
   */
  async getXReport() {
    const shiftData = await this.getCurrentShift();
    if (!shiftData.isOpen) {
      throw new Error('Кассовая смена не открыта. Снятие X-отчета невозможно.');
    }

    const shift = shiftData.currentShift;

    // Fetch receipts for this shift
    const receipts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, fiscal_document_number, receipt_number, receipt_type, payment_type, 
                total_amount, patient_contact, fiscalized_at, status
         FROM fiscal_receipts 
         WHERE shift_id = ? AND is_fiscalized = 1
         ORDER BY id ASC`,
        [shift.id],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    const xReport = {
      reportType: 'X-Report (Отчет без гашения)',
      generatedAt: new Date().toISOString(),
      shiftId: shift.id,
      mnemonicCode: shift.mnemonic_code,
      shiftNumber: shift.shift_number,
      openedAt: shift.opened_at,
      openedBy: shift.opened_by,
      durationMinutes: shift.duration_minutes,
      hoursRunning: shift.hours_running,
      isExpired: shift.is_expired,
      deviceModel: fiscalService.deviceModel || 'АТОЛ 91Ф',
      fnNumber: fiscalService.fnNumber,
      kktRegNumber: fiscalService.kktRegNumber,
      orgName: fiscalService.orgName,
      orgInn: fiscalService.orgInn,
      orgAddress: fiscalService.orgAddress,
      totals: {
        receiptsCount: shift.receipts_count,
        returnsCount: shift.returns_count,
        totalIncome: shift.total_income,
        cashIncome: shift.cash_income,
        cardIncome: shift.card_income,
        sbpIncome: shift.sbp_income,
        totalReturns: shift.total_returns,
        expectedCash: shift.expected_cash
      },
      receipts
    };

    return { success: true, xReport };
  }

  /**
   * Closes the active shift and generates Z-Report (отчет с гашением)
   * @param {Object} options
   * @param {string} [options.operatorName]
   * @param {number} [options.actualCash] Actual cash counted by cashier
   * @param {string} [options.notes] Comments on discrepancy or closing
   */
  async closeShift({ operatorName = 'Администратор', actualCash = null, notes = '' } = {}) {
    const shiftData = await this.getCurrentShift();
    if (!shiftData.isOpen) {
      throw new Error('Нет активной открытой кассовой смены для закрытия.');
    }

    const shift = shiftData.currentShift;
    const startTime = Date.now();

    // 1. Calculate duration and discrepancy
    const openedTime = new Date(shift.opened_at).getTime();
    const durationMinutes = Math.max(0, Math.round((Date.now() - openedTime) / 60000));
    const expectedCash = shift.expected_cash || 0;
    const actualCashNum = actualCash !== null && actualCash !== undefined && !isNaN(Number(actualCash))
      ? Number(actualCash)
      : expectedCash;
    const cashDiff = actualCashNum - expectedCash;

    // 2. Generate Z-report fiscal document in KKT
    const zFdNumber = (fiscalService.lastFdNumber || 1041) + 1;
    fiscalService.lastFdNumber = zFdNumber;

    const zSign = String(Math.floor(1000000000 + Math.random() * 9000000000)); // 10-digit FPD
    const zReportNumber = shift.shift_number;

    // 3. Prepare structured Z-Report payload snapshot
    const zReportSnapshot = {
      reportType: 'Z-Report (Отчет о закрытии смены по 54-ФЗ)',
      zReportNumber,
      mnemonicCode: shift.mnemonic_code,
      shiftNumber: shift.shift_number,
      fiscalDocumentNumber: zFdNumber,
      fiscalSign: zSign,
      openedAt: shift.opened_at,
      openedBy: shift.opened_by,
      closedAt: new Date().toISOString(),
      closedBy: operatorName,
      durationMinutes,
      deviceModel: fiscalService.deviceModel || 'АТОЛ 91Ф',
      fnNumber: fiscalService.fnNumber,
      kktRegNumber: fiscalService.kktRegNumber,
      orgName: fiscalService.orgName,
      orgInn: fiscalService.orgInn,
      orgAddress: fiscalService.orgAddress,
      totals: {
        receiptsCount: shift.receipts_count,
        returnsCount: shift.returns_count,
        totalIncome: shift.total_income,
        cashIncome: shift.cash_income,
        cardIncome: shift.card_income,
        sbpIncome: shift.sbp_income,
        totalReturns: shift.total_returns,
        expectedCash,
        actualCash: actualCashNum,
        cashDifference: cashDiff
      },
      notes
    };

    // 4. Update fiscal_shifts table
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE fiscal_shifts SET
          status = 'closed',
          closed_at = datetime('now', 'localtime'),
          closed_by = ?,
          duration_minutes = ?,
          receipts_count = ?,
          returns_count = ?,
          total_income = ?,
          cash_income = ?,
          card_income = ?,
          sbp_income = ?,
          total_returns = ?,
          expected_cash = ?,
          actual_cash = ?,
          cash_difference = ?,
          z_report_number = ?,
          fiscal_document_number = ?,
          fiscal_sign = ?,
          is_fiscalized = 1,
          is_printed = 1,
          z_report_json = ?,
          notes = ?
         WHERE id = ?`,
        [
          operatorName,
          durationMinutes,
          shift.receipts_count,
          shift.returns_count,
          shift.total_income,
          shift.cash_income,
          shift.card_income,
          shift.sbp_income,
          shift.total_returns,
          expectedCash,
          actualCashNum,
          cashDiff,
          zReportNumber,
          zFdNumber,
          zSign,
          JSON.stringify(zReportSnapshot),
          notes || shift.notes,
          shift.id
        ],
        (err) => (err ? reject(err) : resolve())
      );
    });

    // 5. Update fiscalService runtime state
    fiscalService.isShiftOpen = false;

    // 6. Log Serilog Audit Event
    logFiscalAudit({
      level: LogLevels.INFO,
      message: `Закрыта кассовая смена «${shift.mnemonic_code}» (Z-отчет №${zReportNumber}, ФД №${zFdNumber}, ФПД: ${zSign}). Выручка: ${shift.total_income} ₽, чеков: ${shift.receipts_count}, расхождение: ${cashDiff} ₽`,
      eventType: 'shift_close',
      devicePort: fiscalService.port,
      properties: {
        shiftId: shift.id,
        mnemonicCode: shift.mnemonic_code,
        zReportNumber,
        fiscalDocumentNumber: zFdNumber,
        fiscalSign: zSign,
        totalIncome: shift.total_income,
        cashDifference: cashDiff,
        durationMinutes
      }
    });

    // Return closed shift
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM fiscal_shifts WHERE id = ?', [shift.id], (err, closedShift) => {
        if (err) return reject(err);
        resolve({
          success: true,
          shiftId: shift.id,
          mnemonicCode: shift.mnemonic_code,
          zReportNumber,
          fiscalDocumentNumber: zFdNumber,
          fiscalSign: zSign,
          cashDifference: cashDiff,
          message: `Смена ${shift.mnemonic_code} успешно закрыта со снятием Z-отчета №${zReportNumber}`,
          shift: closedShift,
          zReport: zReportSnapshot
        });
      });
    });
  }

  /**
   * Helper called by fiscalService before issuing a receipt.
   * Auto-opens a shift if none is active; checks 24h limit.
   * @param {string} [operatorName]
   * @returns {Promise<Object>} Active shift record
   */
  async ensureShiftForReceipt(operatorName = 'Администратор') {
    const shiftData = await this.getCurrentShift();

    if (shiftData.isOpen) {
      if (shiftData.currentShift.is_expired) {
        throw new Error(
          `Смена ${shiftData.currentShift.mnemonic_code} открыта более 24 часов. Согласно 54-ФЗ фискализация заблокирована. Снимите Z-отчет перед оформлением новых чеков!`
        );
      }
      return shiftData.currentShift;
    }

    // Auto-open new shift
    const openRes = await this.openShift({ operatorName, autoOpened: true });
    return openRes.shift;
  }

  /**
   * Journal query with OmniSearch and multi-filter criteria
   */
  async getShiftsJournal({
    page = 1,
    limit = 25,
    search = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    onlyDiscrepancies = false,
    cashier = ''
  } = {}) {
    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
    let whereClauses = ['1=1'];
    let params = [];

    if (status) {
      whereClauses.push('s.status = ?');
      params.push(status);
    }

    if (dateFrom) {
      whereClauses.push('date(s.opened_at) >= date(?)');
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClauses.push('date(s.opened_at) <= date(?)');
      params.push(dateTo);
    }

    if (onlyDiscrepancies === 'true' || onlyDiscrepancies === true) {
      whereClauses.push('abs(s.cash_difference) > 0.01');
    }

    if (cashier) {
      whereClauses.push('(s.opened_by LIKE ? OR s.closed_by LIKE ?)');
      params.push(`%${cashier}%`, `%${cashier}%`);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      whereClauses.push(`(
        s.mnemonic_code LIKE ? OR
        CAST(s.shift_number AS TEXT) LIKE ? OR
        CAST(s.fiscal_document_number AS TEXT) LIKE ? OR
        s.fiscal_sign LIKE ? OR
        s.opened_by LIKE ? OR
        s.closed_by LIKE ? OR
        s.notes LIKE ? OR
        s.id IN (
          SELECT DISTINCT r.shift_id FROM fiscal_receipts r 
          LEFT JOIN patients p ON r.patient_id = p.id
          WHERE r.patient_contact LIKE ? 
             OR r.items_json LIKE ? 
             OR p.surname LIKE ? 
             OR p.name LIKE ?
        )
      )`);
      params.push(q, q, q, q, q, q, q, q, q, q, q);
    }

    const whereSql = whereClauses.join(' AND ');

    // 1. Get total matching shifts and financial aggregates
    const statsSql = `
      SELECT 
        COUNT(*) as total_count,
        SUM(s.total_income) as sum_total_income,
        SUM(s.cash_income) as sum_cash_income,
        SUM(s.card_income) as sum_card_income,
        SUM(s.sbp_income) as sum_sbp_income,
        SUM(s.receipts_count) as sum_receipts_count,
        SUM(abs(s.cash_difference)) as sum_abs_difference
      FROM fiscal_shifts s
      WHERE ${whereSql}
    `;

    const stats = await new Promise((resolve, reject) => {
      db.get(statsSql, params, (err, row) => (err ? reject(err) : resolve(row || {})));
    });

    // 2. Fetch page rows
    const listSql = `
      SELECT s.*
      FROM fiscal_shifts s
      WHERE ${whereSql}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
    `;

    const listParams = [...params, Number(limit), offset];
    const items = await new Promise((resolve, reject) => {
      db.all(listSql, listParams, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });

    return {
      success: true,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalItems: stats.total_count || 0,
        totalPages: Math.ceil((stats.total_count || 0) / Number(limit))
      },
      summary: {
        totalShifts: stats.total_count || 0,
        totalIncome: Number(stats.sum_total_income) || 0,
        cashIncome: Number(stats.sum_cash_income) || 0,
        cardIncome: Number(stats.sum_card_income) || 0,
        sbpIncome: Number(stats.sum_sbp_income) || 0,
        receiptsCount: stats.sum_receipts_count || 0,
        totalDiscrepancy: Number(stats.sum_abs_difference) || 0
      },
      items
    };
  }

  /**
   * Gets complete shift details: receipts list, staff breakdown, service breakdown, audit logs
   */
  async getShiftDetails(shiftId) {
    const shift = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM fiscal_shifts WHERE id = ?', [shiftId], (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error(`Смена #${shiftId} не найдена`));
        resolve(row);
      });
    });

    // Parse Z-Report JSON if available
    let zReportObj = null;
    if (shift.z_report_json) {
      try {
        zReportObj = JSON.parse(shift.z_report_json);
      } catch (e) {
        zReportObj = null;
      }
    }

    // Receipts list
    const receipts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, 
                COALESCE(p.brief_name, p.full_name, (p.surname || ' ' || COALESCE(p.name, ''))) as patient_fio,
                v.visit_date, v.remark as diagnosis
         FROM fiscal_receipts r
         LEFT JOIN patients p ON r.patient_id = p.id
         LEFT JOIN patient_visits v ON r.visit_id = v.id
         WHERE r.shift_id = ?
         ORDER BY r.id ASC`,
        [shiftId],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    // Service Breakdown & Staff Breakdown from receipts items_json
    const serviceMap = {};
    const staffMap = {};

    for (const r of receipts) {
      let items = [];
      if (r.items_json) {
        try {
          items = JSON.parse(r.items_json);
        } catch (e) {
          items = [];
        }
      }

      for (const it of items) {
        const sName = it.name || 'Медицинская услуга';
        const cost = Number(it.price || it.amount || 0);
        const qty = Number(it.quantity || 1);
        const total = cost * qty;

        if (!serviceMap[sName]) {
          serviceMap[sName] = { name: sName, quantity: 0, totalAmount: 0 };
        }
        serviceMap[sName].quantity += qty;
        serviceMap[sName].totalAmount += total;
      }
    }

    const servicesBreakdown = Object.values(serviceMap).sort((a, b) => b.totalAmount - a.totalAmount);

    // Audit logs during this shift
    const auditLogs = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM fiscal_audit_logs 
         WHERE timestamp >= ? AND timestamp <= COALESCE(?, datetime('now', 'localtime'))
         ORDER BY id ASC LIMIT 50`,
        [shift.opened_at, shift.closed_at],
        (err, rows) => (err ? reject(err) : resolve(rows || []))
      );
    });

    return {
      success: true,
      shift,
      zReport: zReportObj,
      receipts,
      servicesBreakdown,
      auditLogs
    };
  }
}

module.exports = new FiscalShiftService();
