const db = require('../database');

const templateData = {
  title: 'Энтезопатия (тендинит) ТФЛ, ягодичных мышц',
  joint_name: 'hip',
  default_mkb_code: 'M76.0',
  category: 'Энтезопатии и тендиниты',
  cluster_id: 'cluster_hip_pelvis',
  cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
  stage_or_severity: 'Хронический вертельный болевой синдром (GTPS), энтезопатия ТФЛ',
  default_side: 'right',
  sort_order: 315,
  is_active: 1,
  is_custom: 0,
  author_doctor_name: null,
  clinical_tags: JSON.stringify([
    'hip',
    'тазобедренный',
    'тфл',
    'ягодичные мышцы',
    'тендинит',
    'энтезопатия',
    'gtps',
    'трохантерит',
    'вертельный бурсит',
    'tensor_fasciae_latae',
    'gluteus_medius'
  ]),
  complaints_template:
    'Тянущие и ноющие боли по наружной поверхности тазобедренного сустава в проекции большого вертела, распространяющиеся вниз по наружной поверхности бедра по ходу подвздошно-большеберцового тракта (напрягателя широкой фасции бедра — ТФЛ) до коленного сустава, а также вверх в верхне-наружный квадрант ягодичной области. Боли усиливаются при ходьбе, подъеме по лестнице, переходе из положения сидя в положение стоя, при длительном сидении с перекрещенными ногами. Характерен выраженный дискомфорт и невозможность спать на больном боку ночью из-за контактного давления на большой вертел («симптом подушки»). Стартовая скованность после периодов покоя до 10–15 минут.',
  anamnesis_template:
    'Считает себя больным около 3–5 месяцев, когда впервые после интенсивной ходьбы и непривычной физической нагрузки появились неприятные тянущие ощущения по латеральной поверхности бедра. Постепенно боли приобрели постоянный характер, стали беспокоить по ночам при сне на боку. Самостоятельный прием НПВП и нанесение согревающих гелей приносили лишь временный эффект. Травмы области сустава отрицает. В последнее время отмечает усиление болей при быстрой ходьбе и подъеме по ступеням, появление чувства напряжения по наружной поверхности бедра.',
  anamnesis_vitae_template:
    'Аллергологический анамнез: не отягощен, лекарственную непереносимость отрицает. Сопутствующая патология: остеохондроз пояснично-крестцового отдела позвоночника, нарушение мышечного баланса тазового пояса, продольно-поперечное плоскостопие. Травмы и операции в области таза и нижних конечностей: отрицает. Профессиональная деятельность: длительные статические нагрузки (сидячая работа / пребывание на ногах). Физическая активность: умеренная, пешие прогулки. Вредные привычки: не курит.',
  objective_status_template:
    'Общее состояние удовлетворительное. Сознание ясное, контактен, ориентирован. Телосложение нормостеническое. Кожные покровы чистые, физиологической окраски, периферических отеков голеней и стоп нет. Походка с элементами анталгического щажения пораженной нижней конечности, укорочение опорной фазы шага. Осанка: умеренная асимметрия тазового пояса за счет напряжения мышц поясницы и отводящих мышц бедра. Физиологические изгибы позвоночника сохранены.',
  objective_template:
    'Область тазобедренного сустава правильной конфигурации, отека и локальной гиперемии нет.\nПальпация:\n1. Резкая локальная болезненность в точках прикрепления сухожилий средней и малой ягодичных мышц (m. gluteus medius, m. gluteus minimus) к задне-верхней и латеральной фасеткам большого вертела бедренной кости.\n2. Пальпаторная болезненность и гипертонус проксимального брюшка напрягателя широкой фасции бедра (m. tensor fasciae latae — ТФЛ) у передней верхней ости подвздошной кости (ASIS) и по ходу илиотибиального тракта по наружной поверхности бедра с триггерными уплотнениями.\n3. Феномен «щелкающего бедра» (соха saltans externa) при активном сгибании-разгибании бедра.\nФункциональные и клинические пробы:\n- Тест Обера (Ober\'s test) положительный: натяжение и укорочение илиотибиального тракта и ТФЛ.\n- Тест Нобеля (Noble ITB test) положительный вдоль латеральной фасции.\n- Тест отведения бедра против сопротивления (Resisted Abduction Test) резко положителен с воспроизведением типичной боли в зоне большого вертела.\n- Боль при форсированном пассивном приведении согнутого бедра (провокация натяжения ТФЛ и ягодичных мышц).\n- Тест Тренделенбурга слабоположительный при утомлении.\n- Внутрисуставные тесты (FABER, FADIR, осевая компрессия по оси шейки бедра) — отрицательные.',
  rom_norm_preset: JSON.stringify({
    flexion_active: 120,
    flexion_passive: 125,
    extension_deficit: 0,
    internal_rotation: 35,
    external_rotation: 45,
    abduction: 35,
    adduction: 20
  }),
  recommendations_template:
    '1. Ортопедический и двигательный режим: разгрузка конечности, исключение глубоких приседаний, бега, длительной ходьбы по лестницам. Исключить сидение с перекрещенными ногами («нога на ногу»). Для сна рекомендовано положение на спине либо на противоположном здоровом боку с ортопедической подушкой между коленями (для устранения натяжения ТФЛ и ягодичных сухожилий).\n2. Медикаментозное лечение:\n   - НПВП системно: нимесулид 100 мг 2 р/сут или ацеклофенак 100 мг 2 р/сут в течение 7–10 дней после еды (под защитой омепразола 20 мг);\n   - Миорелаксанты: толперизон 150 мг 2–3 р/сут курсом 10–14 дней для снятия гипертонуса ТФЛ и грушевидной мышцы;\n   - Местная терапия: аппликации гелей с НПВП (кетопрофен / диклофенак) 3 раза в день.\n3. Локальная интервенционная терапия:\n   - Локальная лечебно-медикаментозная блокада зоны энтезиса большого вертела и перифасциального пространства ТФЛ под контролем УЗИ (микрокристаллический ГКС дипроспан 1.0 мл + анестетик наропин 0.5% 4.0 мл);\n   - При хронизации — курс аутологичной PRP-терапии (обогащенная тромбоцитами плазма) перитендиально №2–3;\n   - Периартикулярное введение препаратов коллагена (Guna MD-Hip / Плексатрон).\n4. Физиотерапия и регенерация:\n   - Экстракорпоральная ударно-волновая терапия (УВТ) области большого вертела и проксимальной части илиотибиального тракта №5–6 с интервалом 5–7 дней (метод выбора при энтезопатиях и GTPS);\n   - Лазеротерапия высокой интенсивности (HILT) или магнитотерапия высокой интенсивности (SIS).\n5. ЛФК и реабилитация (после купирования острого болевого синдрома):\n   - Постизометрическая релаксация (ПИР) ТФЛ, большой и средней ягодичных мышц;\n   - Миофасциальный релиз (МФР) наружной поверхности бедра валиком (без прямого давления на костный вертел);\n   - Укрепление глубоких ротаторов таза и стабилизаторов кора.\n6. Коррекция биомеханики: консультация для подбора индивидуальных ортопедических стелек при наличии гиперпронации стопы.\n7. Контрольный осмотр ортопеда через 14 дней.',
  special_studies_template:
    'УЗИ мягких тканей тазобедренного сустава и зоны большого вертела: контуры кортикального слоя большого вертела неровные, микроэнтезофиты до 1.5 мм. Сухожилия средней и малой ягодичных мышц утолщены, сниженной эхогенности с нарушением фибриллярной структуры (тендиноз), признаки умеренного реактивного трохантерного бурсита (жидкость в подвертельной сумке 2.3 мм). Проксимальный отдел ТФЛ и подвздошно-большеберцового тракта утолщен с отеком паратенона.\nМРТ тазобедренного сустава: признаки умеренного тендиноза и парциального микроразволокнения сухожилий gluteus medius/minimus у места прикрепления к большому вертелу (картина вертельного болевого синдрома — GTPS), перитендинит ТФЛ. Костно-деструктивных изменений головки и вертлужной впадины не выявлено, контуры суставного хряща сохранны.',
  performed_manipulations_template:
    'Асептическая обработка операционного поля раствором бетадина трижды. Под контролем УЗИ-навигации (линейный датчик 12 МГц) визуализированы сухожилия средней ягодичной мышцы и область вертельной сумки. Под местной инфильтрационной анестезией Sol. Lidocaini 1% - 3.0 мл выполнена прицельная параэнтезиальная блокада: введено микрокристаллическая суспензия бетаметазона (дипроспан) 1.0 мл в сочетании с раствором ропивакаина (наропин 0.5%) 4.0 мл. Введение свободное, пациент отметил быстрое регрессирование локальной пальпаторной болезненности на 75%. Наложена асептическая наклейка. Даны строгие рекомендации по ограничению физических нагрузок на 48 часов.',
  default_sections_mask: JSON.stringify({
    complaints: true,
    anamnesis_morbi: true,
    anamnesis_vitae: true,
    objective_status: true,
    status_localis: true,
    functional_tests: true,
    special_studies: true,
    clinical_diagnosis: true,
    performed_manipulations: true,
    recommendations: true
  }),
  tests: [
    { test_code: 'ober', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
    { test_code: 'trendelenburg', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
    { test_code: 'noble_itb', expected_result: 'positive', is_mandatory: 1, sort_order: 30 },
    { test_code: 'faber', expected_result: 'negative', is_mandatory: 0, sort_order: 40 },
    { test_code: 'fadir', expected_result: 'negative', is_mandatory: 0, sort_order: 50 }
  ],
  diagnostics: [
    { diagnostic_code: 'us_hip_trochanter', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
    { diagnostic_code: 'mri_hip', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 },
    { diagnostic_code: 'xray_pelvis_hip', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 30 }
  ],
  prescriptions: [
    {
      id: 'presc-tfl-1',
      category: 'consultation',
      code: 'B01.050.001',
      title: 'Прием (осмотр, консультация) врача-травматолога-ортопеда первичный',
      name: 'Прием (осмотр, консультация) врача-травматолога-ортопеда первичный',
      quantity: 1,
      unitPrice: 2500,
      price: 2500
    },
    {
      id: 'presc-tfl-2',
      category: 'diagnostic',
      code: 'A04.04.001',
      title: 'Ультразвуковое исследование тазобедренного сустава и мягких тканей',
      name: 'Ультразвуковое исследование тазобедренного сустава и мягких тканей',
      quantity: 1,
      unitPrice: 2200,
      price: 2200
    },
    {
      id: 'presc-tfl-3',
      category: 'physio',
      code: 'A22.30.005',
      title: 'Экстракорпоральная ударно-волновая терапия (УВТ) области большого вертела и ТФЛ',
      name: 'Экстракорпоральная ударно-волновая терапия (УВТ) области большого вертела и ТФЛ',
      quantity: 5,
      unitPrice: 1800,
      price: 9000
    },
    {
      id: 'presc-tfl-4',
      category: 'manipulation',
      code: 'A11.04.004',
      title: 'Периартикулярное введение лекарственных препаратов под контролем УЗИ (блокада трохантерной зоны)',
      name: 'Периартикулярное введение лекарственных препаратов под контролем УЗИ (блокада трохантерной зоны)',
      quantity: 1,
      unitPrice: 3500,
      price: 3500
    },
    {
      id: 'presc-tfl-5',
      category: 'manipulation',
      code: 'A11.04.006',
      title: 'PRP-терапия (аутологичная плазма, обогащенная тромбоцитами) паравертельной зоны',
      name: 'PRP-терапия (аутологичная плазма, обогащенная тромбоцитами) паравертельной зоны',
      quantity: 2,
      unitPrice: 4500,
      price: 9000
    }
  ]
};

// Build template_json
templateData.template_json = JSON.stringify({
  complaints: templateData.complaints_template,
  anamnesis: templateData.anamnesis_template,
  anamnesis_vitae: templateData.anamnesis_vitae_template,
  objective: templateData.objective_template,
  objective_status: templateData.objective_status_template,
  special_studies: templateData.special_studies_template,
  performed_manipulations: templateData.performed_manipulations_template,
  recommendations: templateData.recommendations_template,
  rom: JSON.parse(templateData.rom_norm_preset),
  default_mkb_code: templateData.default_mkb_code,
  clinicalDiagnosis: templateData.title,
  prescriptions: templateData.prescriptions,
  tests: {
    ober: 'positive',
    trendelenburg: 'positive',
    noble_itb: 'positive',
    faber: 'negative',
    fadir: 'negative'
  },
  diagnostics: templateData.diagnostics
});

db.serialize(() => {
  // Check if exists
  db.get('SELECT id FROM ortho_templates WHERE title = ?', [templateData.title], (err, existing) => {
    if (err) {
      console.error('Error checking existing template:', err);
      process.exit(1);
    }

    if (existing) {
      console.log(`Template already exists with id #${existing.id}, updating...`);
      db.run(`
        UPDATE ortho_templates SET
          joint_name = ?, default_mkb_code = ?, template_json = ?, category = ?,
          default_side = ?, complaints_template = ?, anamnesis_template = ?, objective_template = ?,
          rom_norm_preset = ?, recommendations_template = ?, is_active = ?, sort_order = ?,
          cluster_id = ?, cluster_name = ?, stage_or_severity = ?, clinical_tags = ?,
          anamnesis_vitae_template = ?, objective_status_template = ?, special_studies_template = ?,
          performed_manipulations_template = ?, default_sections_mask = ?, is_custom = 0
        WHERE id = ?
      `, [
        templateData.joint_name, templateData.default_mkb_code, templateData.template_json, templateData.category,
        templateData.default_side, templateData.complaints_template, templateData.anamnesis_template, templateData.objective_template,
        templateData.rom_norm_preset, templateData.recommendations_template, templateData.is_active, templateData.sort_order,
        templateData.cluster_id, templateData.cluster_name, templateData.stage_or_severity, templateData.clinical_tags,
        templateData.anamnesis_vitae_template, templateData.objective_status_template, templateData.special_studies_template,
        templateData.performed_manipulations_template, templateData.default_sections_mask, existing.id
      ], function(uErr) {
        if (uErr) {
          console.error('Error updating template:', uErr);
          process.exit(1);
        }
        insertRelational(existing.id);
      });
    } else {
      console.log('Inserting new template...');
      db.run(`
        INSERT INTO ortho_templates (
          title, joint_name, default_mkb_code, template_json, category,
          default_side, complaints_template, anamnesis_template, objective_template,
          rom_norm_preset, recommendations_template, is_active, sort_order,
          cluster_id, cluster_name, stage_or_severity, clinical_tags,
          anamnesis_vitae_template, objective_status_template, special_studies_template,
          performed_manipulations_template, default_sections_mask, is_custom, author_doctor_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, null)
      `, [
        templateData.title, templateData.joint_name, templateData.default_mkb_code, templateData.template_json, templateData.category,
        templateData.default_side, templateData.complaints_template, templateData.anamnesis_template, templateData.objective_template,
        templateData.rom_norm_preset, templateData.recommendations_template, templateData.is_active, templateData.sort_order,
        templateData.cluster_id, templateData.cluster_name, templateData.stage_or_severity, templateData.clinical_tags,
        templateData.anamnesis_vitae_template, templateData.objective_status_template, templateData.special_studies_template,
        templateData.performed_manipulations_template, templateData.default_sections_mask
      ], function(iErr) {
        if (iErr) {
          console.error('Error inserting template:', iErr);
          process.exit(1);
        }
        insertRelational(this.lastID);
      });
    }
  });
});

function insertRelational(templateId) {
  // Clear existing relational data for this template
  db.run('DELETE FROM ortho_template_tests WHERE template_id = ?', [templateId], (e1) => {
    if (e1) console.error('Error clearing tests:', e1);
    db.run('DELETE FROM ortho_template_diagnostics WHERE template_id = ?', [templateId], (e2) => {
      if (e2) console.error('Error clearing diags:', e2);
      // Insert tests
      const tStmt = db.prepare(`
        INSERT INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      templateData.tests.forEach((t) => {
        tStmt.run([templateId, t.test_code, t.expected_result, t.is_mandatory, t.sort_order]);
      });
      tStmt.finalize((tErr) => {
        if (tErr) console.error('Error inserting tests:', tErr);

        // Insert diagnostics
        const dStmt = db.prepare(`
          INSERT INTO ortho_template_diagnostics (template_id, diagnostic_code, urgency, default_side, is_primary, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        templateData.diagnostics.forEach((d) => {
          dStmt.run([templateId, d.diagnostic_code, d.urgency, d.default_side, d.is_primary, d.sort_order]);
        });
        dStmt.finalize((dErr) => {
          if (dErr) console.error('Error inserting diagnostics:', dErr);
          console.log(`Successfully configured template #${templateId}: "${templateData.title}"!`);
          process.exit(0);
        });
      });
    });
  });
}
