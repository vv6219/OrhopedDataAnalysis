const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

const newTests = [
  {
    code: 'homan_sign',
    name_ru: 'Симптом Хоманса (Homans Sign)',
    name_lat: "Homans' sign for deep vein thrombosis",
    joint_category: 'ankle',
    target_structure: 'Глубокие вены голени, дифференциальная диагностика отека и боли',
    methodology: 'Пациент лежит на спине с выпрямленными ногами. Врач производит резкое пассивное тыльное сгибание стопы (дорсифлексию) при разогнутом коленном суставе.',
    positive_criteria: 'Возникновение резкой боли в глубине икроножной мышцы или подколенной ямке.',
    clinical_interpretation: 'Указывает на подозрение на тромбоз глубоких вен (ТГВ) голени или выраженный тромбофлебит, требует экстренного УЗДГ вен нижних конечностей.',
    sensitivity_pct: 61,
    specificity_pct: 79,
    sensitivity_specificity: 'Se: 61%, Sp: 79%',
    evidence_level: 'B',
    patient_position: 'Лежа на спине, ноги расслаблены.',
    doctor_hand_placement: 'Одна рука фиксирует дистальный отдел голени, вторая резко сгибает стопу кверху.',
    applied_force_direction: 'Дорсифлексия стопы.',
    false_positive_factors: 'Миозит, надрыв икроножной мышцы, укорочение ахиллова сухожилия.',
    sort_order: 48
  },
  {
    code: 'snuffbox_tenderness',
    name_ru: 'Тест пальпации «анатомической табакерки» (Snuffbox Test)',
    name_lat: 'Anatomical snuffbox tenderness test for scaphoid fracture',
    joint_category: 'wrist',
    target_structure: 'Ладьевидная кость запястья (os scaphoideum)',
    methodology: 'Врач пальпирует дно анатомической табакерки (между сухожилиями длинного и короткого разгибателей большого пальца) при ульнарной девиации кисти.',
    positive_criteria: 'Резкая локальная болезненность при пальпации дна табакерки и осевой нагрузке по оси I пальца.',
    clinical_interpretation: 'Высоковероятный признак скрытого/стрессового перелома ладьевидной кости даже при нормальной первичной рентгенограмме.',
    sensitivity_pct: 90,
    specificity_pct: 40,
    sensitivity_specificity: 'Se: 90%, Sp: 40%',
    evidence_level: 'A',
    patient_position: 'Сидя, предплечье на столе в нейтральном положении.',
    doctor_hand_placement: 'Указательным пальцем врач пальпирует углубление анатомической табакерки.',
    applied_force_direction: 'Прямое точечное давление в глубину табакерки.',
    false_positive_factors: 'Тендовагинит де Кервена, неврит лучевого нерва.',
    sort_order: 68
  },
  {
    code: 'tabletop_test_dupuytren',
    name_ru: 'Тест настольной плоскости Хьюстона (Tabletop Test)',
    name_lat: "Hueston's Tabletop test for Dupuytren contracture",
    joint_category: 'wrist',
    target_structure: 'Ладонный апоневроз, сгибатели пальцев кисти',
    methodology: 'Пациента просят положить кисть ладонной поверхностью плоско на твердую поверхность стола и попытаться полностью прижать ладонь и пальцы.',
    positive_criteria: 'Невозможность положить ладонь и пальцы плоско на стол (пальцы остаются приподнятыми из-за фиксированной сгибательной контрактуры).',
    clinical_interpretation: 'Подтверждает наличие функционально значимой сгибательной контрактуры ладонного апоневроза Дюпюитрена (показание к апоневротомии/хирургическому лечению при контрактуре >= 30°).',
    sensitivity_pct: 95,
    specificity_pct: 92,
    sensitivity_specificity: 'Se: 95%, Sp: 92%',
    evidence_level: 'A',
    patient_position: 'Сидя за столом.',
    doctor_hand_placement: 'Визуальный контроль прижатия ладони к столу.',
    applied_force_direction: 'Активное разгибание пальцев пациентом.',
    false_positive_factors: 'Артрогенная контрактура мелких суставов пальцев, застарелое повреждение сухожилий сгибателей.',
    sort_order: 69
  },
  {
    code: 'notta_nodule_palpation',
    name_ru: 'Тест пальпации узелка Нотта и блокировки пальца (Notta trigger digit test)',
    name_lat: 'Notta flexor nodule palpation and triggering test',
    joint_category: 'wrist',
    target_structure: 'Кольцевидная связка А1, сухожилие глубокого сгибателя пальца',
    methodology: 'Врач пальпирует ладонную поверхность в проекции головки пястной кости (связка А1) и просит пациента активно сгибать и разгибать палец.',
    positive_criteria: 'Ощущение щелчка, болезненного узелка на сухожилии или феномен пружинящего защелкивания пальца в положении сгибания.',
    clinical_interpretation: 'Стенозирующий лигаментит («щелкающий палец», болезнь Нотта) пальцев кисти.',
    sensitivity_pct: 96,
    specificity_pct: 98,
    sensitivity_specificity: 'Se: 96%, Sp: 98%',
    evidence_level: 'A',
    patient_position: 'Сидя, рука на столе ладонью кверху.',
    doctor_hand_placement: 'Большой палец врача плотно лежит на связке А1 у основания исследуемого пальца.',
    applied_force_direction: 'Активное движение сгибания-разгибания под пальпаторным контролем.',
    false_positive_factors: 'Подвывих сухожилия разгибателя, травма ладонной пластинки.',
    sort_order: 70
  },
  {
    code: 'tietze_sternocostal_compression',
    name_ru: 'Стресс-тест реберно-хрящевого сочленения (Tietze compression test)',
    name_lat: 'Sternocostal cartilage focal palpation & compression test',
    joint_category: 'spine',
    target_structure: 'II–IV реберно-хрящевые сочленения грудины',
    methodology: 'Врач выполняет точечную пальпацию зоны перехода II, III или IV ребра в грудину, а затем аккуратную компрессию грудины в передне-заднем направлении.',
    positive_criteria: 'Резкое усиление локальной боли и пальпируемая веретенообразная припухлость/утолщение в области пораженного хряща ребра при отсутствии признаков системного артрита.',
    clinical_interpretation: 'Синдром Титце (асептический реберный хондрит) в отличие от кардиальной или вертеброгенной торакалгии.',
    sensitivity_pct: 85,
    specificity_pct: 88,
    sensitivity_specificity: 'Se: 85%, Sp: 88%',
    evidence_level: 'B',
    patient_position: 'Лежа на спине или полусидя.',
    doctor_hand_placement: 'Пальпация кончиками пальцев парастернальных зон поочередно.',
    applied_force_direction: 'Прямое перпендикулярное давление на грудино-реберное сочленение.',
    false_positive_factors: 'ИБС, миозит грудных мышц, межреберная невралгия.',
    sort_order: 73
  },
  {
    code: 'coccyx_mobility_bimanual',
    name_ru: 'Тест бимануальной подвижности и провокации копчика (Coccyx Bimanual Test)',
    name_lat: 'Bimanual coccygeal dynamic mobility & pain test',
    joint_category: 'spine',
    target_structure: 'Крестцово-копчиковое сочленение, копчик',
    methodology: 'Пальпаторное ректальное/наружное исследование подвижности копчика: указательный палец в прямой кишке, большой палец снаружи на дорсальной поверхности копчика; оценка пассивной флексии/экстензии.',
    positive_criteria: 'Резкая локальная воспроизводимая боль при мобилизации верхушки копчика или патологическая гипермобильность / подвывих.',
    clinical_interpretation: 'Кокцигодиния, посттравматический артроз крестцово-копчикового сочленения или подвывих копчика.',
    sensitivity_pct: 91,
    specificity_pct: 94,
    sensitivity_specificity: 'Se: 91%, Sp: 94%',
    evidence_level: 'A',
    patient_position: 'Лежа на левом боку с согнутыми ногами.',
    doctor_hand_placement: 'Указательный палец в перчатке ректально, большой палец снаружи.',
    applied_force_direction: 'Вентро-дорсальное смещение копчика.',
    false_positive_factors: 'Проктит, парапроктит, спазм леваторов ануса.',
    sort_order: 74
  },
  {
    code: 'cervical_foraminal_compression',
    name_ru: 'Тест Джексона (Jackson cervical compression test)',
    name_lat: "Jackson's lateral cervical compression test",
    joint_category: 'spine',
    target_structure: 'Межпозвонковые отверстия шейного отдела, нервные корешки C4–C7',
    methodology: 'Пациент сидит. Врач производит наклон головы пациента в сторону поражения и осуществляет мягкую вертикальную осевую компрессию сверху вниз.',
    positive_criteria: 'Появление или усиление иррадиирующей боли, парестезии по ходу дерматома соответствующей руки.',
    clinical_interpretation: 'Фораминальный стеноз, корешковая компрессия грыжей диска или остеофитом шейного отдела позвоночника.',
    sensitivity_pct: 78,
    specificity_pct: 93,
    sensitivity_specificity: 'Se: 78%, Sp: 93%',
    evidence_level: 'B',
    patient_position: 'Сидя ровно на стуле, руки на бедрах.',
    doctor_hand_placement: 'Обе ладони врача лежат на теменной области головы.',
    applied_force_direction: 'Плавное аксиальное давление вниз.',
    false_positive_factors: 'Острый фасеточный синдром шейного отдела, выраженный миозит трапециевидной мышцы.',
    sort_order: 75
  },
  {
    code: 'elbow_flexion_compression',
    name_ru: 'Тест максимального сгибания локтя (Elbow Flexion Test)',
    name_lat: 'Elbow flexion test for cubital tunnel syndrome',
    joint_category: 'elbow',
    target_structure: 'Локтевой нерв в кубитальном канале',
    methodology: 'Пациент удерживает локтевые суставы в положении максимального сгибания с супинацией предплечья и разгибанием кисти в течение 60 секунд.',
    positive_criteria: 'Возникновение или усиление онемения, парестезий в зоне иннервации локтевого нерва (IV–V пальцы).',
    clinical_interpretation: 'Синдром кубитального канала, компрессия локтевого нерва связкой Осборна.',
    sensitivity_pct: 82,
    specificity_pct: 89,
    sensitivity_specificity: 'Se: 82%, Sp: 89%',
    evidence_level: 'A',
    patient_position: 'Сидя с опущенными плечами.',
    doctor_hand_placement: 'Врач контролирует положение рук и фиксирует время теста секундомером.',
    applied_force_direction: 'Пассивное/активное удержание полного сгибания локтя.',
    false_positive_factors: 'Синдром лестничной мышцы, корешковый синдром C8–Th1.',
    sort_order: 56
  },
  {
    code: 'drawer_ankle_subtalar',
    name_ru: 'Субталарный стресс-тест инверсии (Subtalar Inversion Stress Test)',
    name_lat: 'Subtalar joint inversion stability test',
    joint_category: 'ankle',
    target_structure: 'Подтаранный сустав, пяточно-малоберцовая связка (CFL), межкостная таранно-пяточная связка',
    methodology: 'Врач фиксирует дистальный отдел голени одной рукой, а второй рукой обхватывает пяточную кость и производит максимальную форсированную инверсию в подтаранном суставе.',
    positive_criteria: 'Чрезмерный наклон пяточной кости (более 10° по сравнению со здоровой стороной), симптом щелчка или боли под наружной лодыжкой.',
    clinical_interpretation: 'Подтаранная нестабильность, разрыв пяточно-малоберцовой или межкостной таранно-пяточной связки.',
    sensitivity_pct: 83,
    specificity_pct: 88,
    sensitivity_specificity: 'Se: 83%, Sp: 88%',
    evidence_level: 'B',
    patient_position: 'Сидя на кушетке со свободно свисающими ногами.',
    doctor_hand_placement: 'Одна рука на дистальной трети голени, вторая на пятке.',
    applied_force_direction: 'Супинация/инверсия заднего отдела стопы.',
    false_positive_factors: 'Острый теносиновит малоберцовых сухожилий.',
    sort_order: 49
  },
  {
    code: 'silfverskiold_test',
    name_ru: 'Тест Сильвершельда (Silfverskiöld Test)',
    name_lat: 'Silfverskiold test for gastrocnemius contracture',
    joint_category: 'ankle',
    target_structure: 'Икроножная мышца vs камбаловидная мышца (ахиллово сухожилие)',
    methodology: 'Оценка тыльного сгибания голеностопного сустава в двух положениях: при полностью разогнутом колене и при согнутом колене до 90 градусов.',
    positive_criteria: 'Тыльное сгибание стопы ограничено (< 10°) при прямом колене, но значительно увеличивается при сгибании коленного сустава до 90° (изолированная контрактура икроножной мышцы).',
    clinical_interpretation: 'Изолированное укорочение икроножной мышцы (эквинус), патогенетический фактор подошвенного фасциита, метатарзалгии и Hallux Valgus.',
    sensitivity_pct: 89,
    specificity_pct: 91,
    sensitivity_specificity: 'Se: 89%, Sp: 91%',
    evidence_level: 'A',
    patient_position: 'Лежа на спине или сидя на краю кушетки.',
    doctor_hand_placement: 'Одна рука контролирует сгибание в коленном суставе, вторая выводит стопу в тыльное сгибание.',
    applied_force_direction: 'Дорсифлексия стопы при нейтральном положении подтаранного сустава.',
    false_positive_factors: 'Передний импинджмент голеностопного сустава (костные остеофиты).',
    sort_order: 50
  }
];

async function seed() {
  const run = (sql, p=[]) => new Promise((resolve, reject) => db.run(sql, p, function(err) { if(err) reject(err); else resolve(this); }));
  const all = (sql, p=[]) => new Promise((resolve, reject) => db.all(sql, p, (err, rows) => err ? reject(err) : resolve(rows)));

  console.log('Inserting new tests into ortho_test_catalog...');
  for (const t of newTests) {
    await run(`
      INSERT OR REPLACE INTO ortho_test_catalog (
        code, name_ru, name_lat, joint_category, target_structure,
        methodology, positive_criteria, sensitivity_specificity,
        sensitivity_pct, specificity_pct, evidence_level,
        patient_position, doctor_hand_placement, applied_force_direction,
        false_positive_factors, clinical_interpretation, illustration_key,
        icon_type, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [
      t.code, t.name_ru, t.name_lat, t.joint_category, t.target_structure,
      t.methodology, t.positive_criteria, t.sensitivity_specificity,
      t.sensitivity_pct, t.specificity_pct, t.evidence_level,
      t.patient_position, t.doctor_hand_placement, t.applied_force_direction,
      t.false_positive_factors, t.clinical_interpretation, 'default_joint',
      'clinical_test', t.sort_order
    ]);
  }
  console.log(`Inserted ${newTests.length} new tests successfully.`);

  // Comprehensive linking of tests to relevant templates
  const links = [
    // 28: Перелом ключицы
    { templateId: 28, tests: [{ code: 'paxinos', expected: 'positive' }, { code: 'sulcus_sign', expected: 'negative' }] },
    // 29: Контроль после эндопротезирования плечевого сустава
    { templateId: 29, tests: [{ code: 'empty_can_jobe', expected: 'negative' }, { code: 'bear_hug', expected: 'negative' }, { code: 'apprehension', expected: 'negative' }] },
    // 49: Hallux Rigidus I-II ст.
    { templateId: 49, tests: [{ code: 'silfverskiold_test', expected: 'positive' }, { code: 'windlass_test', expected: 'positive' }] },
    // 54: Остеохондральное повреждение блока таранной кости (OCL)
    { templateId: 54, tests: [{ code: 'talar_tilt', expected: 'positive' }, { code: 'anterior_drawer_ankle', expected: 'positive' }] },
    // 55: Деформация Хаглунда и ретрокальканеарный бурсит
    { templateId: 55, tests: [{ code: 'thompson_achilles', expected: 'negative' }, { code: 'silfverskiold_test', expected: 'positive' }] },
    // 57: Контроль после металлоостеосинтеза костей (плановое удаление)
    { templateId: 57, tests: [{ code: 'anterior_drawer_ankle', expected: 'negative' }, { code: 'talar_tilt', expected: 'negative' }] },
    // 60: Асептический серозный бурсит локтевого отростка
    { templateId: 60, tests: [{ code: 'cozen', expected: 'negative' }, { code: 'elbow_flexion_compression', expected: 'negative' }] },
    // 66: Посттравматический деформирующий остеоартроз локтевого сустава
    { templateId: 66, tests: [{ code: 'valgus_stress_elbow', expected: 'positive' }, { code: 'elbow_flexion_compression', expected: 'positive' }] },
    // 73: Стенозирующий лигаментит («щелкающий палец», болезнь Нотта)
    { templateId: 73, tests: [{ code: 'notta_nodule_palpation', expected: 'positive' }, { code: 'finkelstein', expected: 'negative' }] },
    // 74: Контрактура Дюпюитрена ладонного апоневроза I–II степени
    { templateId: 74, tests: [{ code: 'tabletop_test_dupuytren', expected: 'positive' }] },
    // 75: Ганглион (гигрома) тыла лучезапястного сустава
    { templateId: 75, tests: [{ code: 'watson_scaphoid', expected: 'negative' }, { code: 'fovea_sign', expected: 'negative' }] },
    // 76: Асептический некроз полулунной кости (болезнь Кинбека)
    { templateId: 76, tests: [{ code: 'watson_scaphoid', expected: 'positive' }, { code: 'fovea_sign', expected: 'negative' }] },
    // 77: Перелом дистального метаэпифиза лучевой кости
    { templateId: 77, tests: [{ code: 'piano_key', expected: 'positive' }, { code: 'tinel_wrist', expected: 'positive' }] },
    // 78: Перелом ладьевидной кости кисти без смещения
    { templateId: 78, tests: [{ code: 'snuffbox_tenderness', expected: 'positive' }, { code: 'watson_scaphoid', expected: 'positive' }] },
    // 82: Цервикалгия с миофасциальным болевым синдромом и цефалгией
    { templateId: 82, tests: [{ code: 'spurling', expected: 'negative' }, { code: 'cervical_foraminal_compression', expected: 'negative' }] },
    // 84: Торакалгия на фоне грудного остеохондроза и реберного артроза
    { templateId: 84, tests: [{ code: 'tietze_sternocostal_compression', expected: 'negative' }, { code: 'adams', expected: 'negative' }] },
    // 89: Синдром Титце (реберный хондрит II–IV ребер)
    { templateId: 89, tests: [{ code: 'tietze_sternocostal_compression', expected: 'positive' }] },
    // 90: Кокцигодиния (хронический болевой синдром копчика)
    { templateId: 90, tests: [{ code: 'coccyx_mobility_bimanual', expected: 'positive' }, { code: 'fair_piriformis', expected: 'positive' }] },
    // 91: Осгуд-Шлаттера
    { templateId: 91, tests: [{ code: 'wilson_knee', expected: 'negative' }, { code: 'patella_grind', expected: 'positive' }, { code: 'ely_quad', expected: 'positive' }] },
    // 92: Болезнь Севера (апофизит пяточной кости)
    { templateId: 92, tests: [{ code: 'silfverskiold_test', expected: 'positive' }, { code: 'thompson_achilles', expected: 'negative' }] },
    // 93: Болезнь Келлера I (ладьевидная кость)
    { templateId: 93, tests: [{ code: 'navicular_drop', expected: 'positive' }, { code: 'silfverskiold_test', expected: 'positive' }] },
    // 94: Болезнь Келлера II (плюсневые кости)
    { templateId: 94, tests: [{ code: 'morton_squeeze', expected: 'positive' }, { code: 'mulder_click', expected: 'negative' }] },
    // 96: Сенильный остеопороз (риск переломов)
    { templateId: 96, tests: [{ code: 'schober', expected: 'positive' }, { code: 'adams', expected: 'positive' }] },
    // 97: Острый подагрический артрит I плюснефалангового сустава
    { templateId: 97, tests: [{ code: 'windlass_test', expected: 'positive' }, { code: 'homan_sign', expected: 'negative' }] },
    // 98: Серонегативный полиартрит мелких суставов кистей и стоп
    { templateId: 98, tests: [{ code: 'tinel_wrist', expected: 'positive' }, { code: 'morton_squeeze', expected: 'positive' }, { code: 'phalen', expected: 'positive' }] },
    // 100: КРБС I типа (синдром Зудека)
    { templateId: 100, tests: [{ code: 'tinel_wrist', expected: 'positive' }, { code: 'phalen', expected: 'positive' }] },
    // 110: Протокол гонартроз + мениск
    { templateId: 110, tests: [{ code: 'mcmurray', expected: 'positive' }, { code: 'lachman', expected: 'negative' }, { code: 'appley', expected: 'positive' }] },
    // 111: Энтезопатия ТФЛ и ягодичных мышц
    { templateId: 111, tests: [{ code: 'ober', expected: 'positive' }, { code: 'trendelenburg', expected: 'positive' }, { code: 'noble_itb', expected: 'positive' }] }
  ];

  for (const item of links) {
    const { templateId, tests } = item;
    for (let idx = 0; idx < tests.length; idx++) {
      const t = tests[idx];
      await run(`
        INSERT OR IGNORE INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order)
        VALUES (?, ?, ?, 1, ?)
      `, [templateId, t.code, t.expected, (idx + 1) * 10]);
    }
  }

  console.log('Successfully linked tests across all identified templates.');

  // Check remaining empty templates
  const emptyRemaining = await all(`
    SELECT ot.id, ot.title, ot.joint_name, ot.cluster_id
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
    AND (SELECT COUNT(*) FROM ortho_template_tests WHERE template_id = ot.id) = 0
  `);
  console.log(`Remaining templates without tests: ${emptyRemaining.length}`);
  if (emptyRemaining.length > 0) {
    console.log(emptyRemaining);
  }

  db.close();
}

seed().catch(err => {
  console.error(err);
  db.close();
});
