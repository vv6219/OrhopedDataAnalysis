const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Update Adams test in catalog
  db.run(`
    UPDATE ortho_test_catalog
    SET name_ru = 'Тест наклона Адамса (Adams Forward Bend Test)',
        name_lat = 'Adams forward bend test',
        target_structure = 'Торсия позвонков, реберный горб при сколиотической деформации',
        methodology = 'Пациент стоит прямо, стопы вместе или на ширине плеч, колени полностью выпрямлены. Выполняется плавный наклон туловища вперед с свободно свисающими руками и соединенными ладонями. Врач производит тангенциальный осмотр контуров спины сзади и спереди, при необходимости применяя инклинометр/сколиозометр Буннелля.',
        positive_criteria = 'Визуализация реберного горба (гиббуса) в грудном отделе или мышечного поясничного валика (угол ротации туловища ATR >= 5-7 градусов по сколиозометру).',
        clinical_interpretation = 'Подтверждает наличие истинного структурного сколиоза с ротационно-торсионным компонентом тел позвонков (отличие от функционального сколиотического нарушения осанки, при котором асимметрия исчезает в наклоне).',
        sensitivity_pct = 88,
        specificity_pct = 94,
        sensitivity_specificity = 'Se: 88%, Sp: 94%',
        evidence_level = 'A',
        sort_order = 71
    WHERE code = 'adams'
  `, (err) => {
    if (err) console.error('Error updating Adams:', err);
    else console.log('Adams test updated in catalog.');
  });

  // 2. Insert Risser sign into catalog
  db.run(`
    INSERT OR REPLACE INTO ortho_test_catalog (
      code, name_ru, name_lat, joint_category, target_structure,
      methodology, positive_criteria, sensitivity_specificity,
      sensitivity_pct, specificity_pct, evidence_level,
      patient_position, doctor_hand_placement, applied_force_direction,
      false_positive_factors, clinical_interpretation, illustration_key,
      icon_type, is_active, sort_order
    )
    VALUES (
      'risser_sign',
      'Тест/признак Риссера (Risser Sign)',
      'Risser sign / Iliac apophysis ossification grading',
      'spine',
      'Апофиз гребня подвздошной кости, скелетная зрелость позвоночника',
      'Рентгенологическая и клиническая оценка степени оссификации и синостозирования апофиза гребня подвздошной кости на обзорной спондилограмме (градации от 0 до 5). Клинически сопоставляется с ростовым скачком и динамикой деформации позвоночника.',
      'Тест Риссера 0–2 указывает на активный скелетный рост и критически высокий потенциал прогрессирования сколиоза/кифоза. Стадии 4–5 свидетельствуют о завершении костного роста.',
      'Se: 90%, Sp: 92%',
      90,
      92,
      'A',
      'Пациент уложен для обзорной спондилографии в положении стоя с четкой визуализацией гребней крыльев подвздошных костей.',
      'Врач-ортопед/рентгенолог разделяет гребень подвздошной кости на 4 квадранта (I–IV стадия) и оценивает слияние апофиза с крылом подвздошной кости (V стадия).',
      'Без механического воздействия; оценка костного возраста и биологической зрелости осевого скелета.',
      'Асимметричное или неравномерное закрытие зон роста, некачественная укладка при рентгенографии.',
      'Ключевой прогностический фактор прогрессирования деформации: при тесте Риссера 0–2 показано строгое корсетирование (типа Шено) и интенсивная специализированная гимнастика (Шрот); при Риссере 4–5 деформация считается стабильной.',
      'default_joint',
      'posture',
      1,
      72
    )
  `, (err) => {
    if (err) console.error('Error inserting Risser sign:', err);
    else console.log('Risser sign inserted into catalog.');
  });

  // 3. Link Adams and Risser to Template #85 (Идиопатический сколиоз позвоночника II степени)
  db.run(`DELETE FROM ortho_template_tests WHERE template_id = 85 AND test_code IN ('adams', 'adams_forward_bend', 'risser_sign')`, () => {
    db.run(`INSERT INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order) VALUES (85, 'adams', 'positive', 1, 10)`);
    db.run(`INSERT INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order) VALUES (85, 'risser_sign', 'positive', 1, 20)`);
    console.log('Linked Adams and Risser to template #85.');
  });

  // 4. Link Adams and Risser to Template #86 (Юношеский кифоз Шейермана-Мау)
  db.run(`DELETE FROM ortho_template_tests WHERE template_id = 86 AND test_code IN ('adams', 'adams_forward_bend', 'risser_sign')`, () => {
    db.run(`INSERT INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order) VALUES (86, 'adams', 'positive', 1, 10)`);
    db.run(`INSERT INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order) VALUES (86, 'risser_sign', 'positive', 1, 20)`);
    console.log('Linked Adams and Risser to template #86.');
  });

  // 5. Update ortho_templates.tests_count or check counts
  db.all(`
    SELECT ott.template_id, ot.title, ott.test_code, ott.expected_result, ott.is_mandatory
    FROM ortho_template_tests ott
    JOIN ortho_templates ot ON ot.id = ott.template_id
    WHERE ott.test_code IN ('adams', 'risser_sign')
  `, (err, rows) => {
    if (err) console.error('Verification error:', err);
    else console.log('Verification query results:', JSON.stringify(rows, null, 2));
    db.close();
  });
});
