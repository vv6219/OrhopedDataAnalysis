/**
 * purgeDaemonTestData.js
 * Скрипт мгновенной очистки всех тестовых данных с маркером [TEST_DAEMON].
 * Не затрагивает реальные данные клиники.
 * Строго соблюдает порядок каскадного удаления по внешним ключам (Foreign Keys).
 */

const db = require('./database');

async function purgeDaemonData() {
  console.log('--- Начинается удаление тестовых данных [TEST_DAEMON] ---');

  const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      err ? reject(err) : resolve(this.changes);
    });
  });

  const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });

  try {
    // Временно отключаем ограничения внешних ключей для гарантированной защиты от циклических зависимостей
    await runAsync('PRAGMA foreign_keys = OFF');

    // 1. Блокировки расчетов
    const lockChanges = await runAsync("DELETE FROM service_calculation_locks WHERE locked_by LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено блокировок (service_calculation_locks): ${lockChanges}`);

    // 2. Начисления
    const accChanges = await runAsync("DELETE FROM staff_payout_accruals WHERE notes LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено начислений (staff_payout_accruals): ${accChanges}`);

    // 3. Ведомости выплат
    const sheetChanges = await runAsync("DELETE FROM staff_payout_sheets WHERE sheet_number LIKE '%TEST-DAEMON%' OR notes LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено ведомостей (staff_payout_sheets): ${sheetChanges}`);

    // 4. Записи процедур (procedure_records)
    const procChanges = await runAsync(`
      DELETE FROM procedure_records 
      WHERE notes LIKE '%[TEST_DAEMON]%' 
         OR dedup_hash LIKE 'daemon:%'
         OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
         OR operation_id IN (SELECT id FROM operations WHERE name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено записей процедур (procedure_records): ${procChanges}`);

    // 5. Логи аудита ККТ (удаляются перед чеками)
    const fiscalAuditChanges = await runAsync(`
      DELETE FROM fiscal_audit_logs 
      WHERE message LIKE '%[TEST_DAEMON]%' 
         OR properties_json LIKE '%[TEST_DAEMON]%'
         OR receipt_id IN (
           SELECT id FROM fiscal_receipts 
           WHERE patient_contact LIKE '%[TEST_DAEMON]%' 
              OR error_message LIKE '%[TEST_DAEMON]%'
              OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
              OR transaction_id IN (
                SELECT id FROM operation_transactions 
                WHERE notes LIKE '%[TEST_DAEMON]%' 
                   OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
              )
         )
    `);
    console.log(`✓ Удалено записей аудита ККТ (fiscal_audit_logs): ${fiscalAuditChanges}`);

    // 6. Фискальные чеки ККТ (ссылаются на transactions и patients)
    const fiscalChanges = await runAsync(`
      DELETE FROM fiscal_receipts 
      WHERE patient_contact LIKE '%[TEST_DAEMON]%' 
         OR error_message LIKE '%[TEST_DAEMON]%'
         OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
         OR transaction_id IN (
           SELECT id FROM operation_transactions 
           WHERE notes LIKE '%[TEST_DAEMON]%' 
              OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
         )
    `);
    console.log(`✓ Удалено фискальных чеков (fiscal_receipts): ${fiscalChanges}`);

    // 7. Позиции транзакций
    const otiChanges = await runAsync(`
      DELETE FROM operation_transaction_items 
      WHERE transaction_id IN (
        SELECT id FROM operation_transactions 
        WHERE notes LIKE '%[TEST_DAEMON]%' 
           OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
           OR operation_id IN (SELECT id FROM operations WHERE name LIKE '%[TEST_DAEMON]%')
      ) OR operation_id IN (SELECT id FROM operations WHERE name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено позиций транзакций (operation_transaction_items): ${otiChanges}`);

    // 8. Дочерние таблицы транзакций: списания материалов и роли персонала
    const tamChanges = await runAsync(`
      DELETE FROM transaction_actual_materials 
      WHERE transaction_id IN (
        SELECT id FROM operation_transactions 
        WHERE notes LIKE '%[TEST_DAEMON]%' 
           OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
      ) OR material_id IN (SELECT id FROM materials_catalog WHERE material_name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено списаний материалов транзакций (transaction_actual_materials): ${tamChanges}`);

    const tsrChanges = await runAsync(`
      DELETE FROM transaction_staff_roles 
      WHERE transaction_id IN (
        SELECT id FROM operation_transactions 
        WHERE notes LIKE '%[TEST_DAEMON]%' 
           OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
      ) OR staff_id IN (SELECT id FROM staff WHERE full_name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено ролей персонала в транзакциях (transaction_staff_roles): ${tsrChanges}`);

    // 9. Транзакции (operation_transactions)
    const transChanges = await runAsync(`
      DELETE FROM operation_transactions 
      WHERE notes LIKE '%[TEST_DAEMON]%' 
         OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
         OR operation_id IN (SELECT id FROM operations WHERE name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено транзакций (operation_transactions): ${transChanges}`);

    // 10. Дочерние таблицы операций: связки с материалами
    const opMatChanges = await runAsync(`
      DELETE FROM operation_materials 
      WHERE operation_id IN (SELECT id FROM operations WHERE name LIKE '%[TEST_DAEMON]%')
         OR material_id IN (SELECT id FROM materials_catalog WHERE material_name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено связок операций и материалов (operation_materials): ${opMatChanges}`);

    // 11. Приемы и визиты (ссылаются на patients, operations, staff)
    const appChanges = await runAsync(`
      DELETE FROM appointments 
      WHERE notes LIKE '%[TEST_DAEMON]%' 
         OR patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
         OR doctor_id IN (SELECT id FROM staff WHERE full_name LIKE '%[TEST_DAEMON]%')
         OR operation_id IN (SELECT id FROM operations WHERE name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено приемов (appointments): ${appChanges}`);

    const pvChanges = await runAsync(`
      DELETE FROM patient_visits 
      WHERE patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
         OR remark LIKE '%[TEST_DAEMON]%'
    `);
    console.log(`✓ Удалено визитов (patient_visits): ${pvChanges}`);

    const dmsChanges = await runAsync(`
      DELETE FROM dms_cards 
      WHERE patient_id IN (SELECT id FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%')
         OR policy LIKE '%[TEST_DAEMON]%'
    `);
    console.log(`✓ Удалено карт ДМС (dms_cards): ${dmsChanges}`);

    // 12. Персональные ставки и настройки персонала
    const rateChanges = await runAsync(`
      DELETE FROM staff_operation_rates 
      WHERE notes LIKE '%[TEST_DAEMON]%' 
         OR staff_id IN (SELECT id FROM staff WHERE full_name LIKE '%[TEST_DAEMON]%')
         OR operation_id IN (SELECT id FROM operations WHERE name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено индивидуальных ставок (staff_operation_rates): ${rateChanges}`);

    const settingsChanges = await runAsync(`
      DELETE FROM staff_payout_settings 
      WHERE notes LIKE '%[TEST_DAEMON]%' 
         OR staff_id IN (SELECT id FROM staff WHERE full_name LIKE '%[TEST_DAEMON]%')
    `);
    console.log(`✓ Удалено настроек выплат персонала (staff_payout_settings): ${settingsChanges}`);

    // 13. Тестовые схемы
    const schemeChanges = await runAsync("DELETE FROM staff_payout_schemes WHERE scheme_name LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено тестовых схем (staff_payout_schemes): ${schemeChanges}`);

    // 14. Базовые сущности справочников: материалы, операции, пациенты, сотрудники
    const matChanges = await runAsync("DELETE FROM materials_catalog WHERE material_name LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено материалов (materials_catalog): ${matChanges}`);

    const opChanges = await runAsync("DELETE FROM operations WHERE name LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено операций (operations): ${opChanges}`);

    const patChanges = await runAsync("DELETE FROM patients WHERE full_name LIKE '%[TEST_DAEMON]%' OR surname LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено пациентов (patients): ${patChanges}`);

    const staffChanges = await runAsync("DELETE FROM staff WHERE full_name LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено тестовых сотрудников (staff): ${staffChanges}`);

    const paramChanges = await runAsync("DELETE FROM calculation_parameters WHERE param_name LIKE '%[TEST_DAEMON]%'");
    console.log(`✓ Удалено тестовых параметров (calculation_parameters): ${paramChanges}`);

    // Включаем обратно проверку внешних ключей и валидируем
    await runAsync('PRAGMA foreign_keys = ON');
    const fkErrors = await allAsync('PRAGMA foreign_key_check');
    if (fkErrors && fkErrors.length > 0) {
      console.warn('⚠️ Обнаружены несоответствия внешних ключей:', fkErrors);
    }

    console.log('--- Очистка тестовых данных [TEST_DAEMON] успешно завершена! ---');
  } catch (err) {
    await runAsync('PRAGMA foreign_keys = ON').catch(() => {});
    console.error('Ошибка при очистке тестовых данных:', err.message);
    throw err;
  }
}

if (require.main === module) {
  purgeDaemonData().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { purgeDaemonData };
