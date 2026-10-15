const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

const newDiagnostics = [
  {
    code: 'ct_knee_3d',
    name: 'КТ коленного сустава с 3D-реконструкцией (оценка ротации, TT-TG, надколенник)',
    category: 'Лучевая диагностика',
    modality: 'ct',
    target_joint: 'knee',
    clinical_indication: 'Дисплазия блока бедренной кости, латерализация надколенника (дистанция TT-TG), остеохондральные дефекты, предоперационное планирование остеотомии и эндопротезирования.',
    preparation_info: 'Специальной подготовки не требуется. Снятие металлических предметов.',
    contraindications: 'Беременность, непереносимость контраста (при контрастировании).',
    protocol_phrase: 'Выполнена мультиспиральная компьютерная томография коленного сустава с аксиальными срезами 0.5 мм и 3D-реконструкцией: оценка индекса TT-TG, глубины трохлеарной борозды по Дежуру, целостности костных контуров.',
    sort_order: 12
  },
  {
    code: 'ct_shoulder_3d',
    name: 'КТ плечевого сустава с 3D-реконструкцией костного дефекта (шкала Pico / дефект гленоида)',
    category: 'Лучевая диагностика',
    modality: 'ct',
    target_joint: 'shoulder',
    clinical_indication: 'Рецидивирующая передняя нестабильность плеча, костный дефект края суставной впадины лопатки (Bankart), вдавленный перелом Хилл-Сакса (Hill-Sachs), планирование костной пластики по Латарже.',
    preparation_info: 'Специальной подготовки не требуется.',
    contraindications: 'Беременность.',
    protocol_phrase: 'Выполнена МСКТ плечевого сустава с 3D-моделированием суставного отростка лопатки: вычислен процент дефекта передне-нижнего края гленоида по методу наилучшей окружности (Pico area), оценка биполярного костного дефекта (on-track / off-track).',
    sort_order: 13
  },
  {
    code: 'ct_pelvis_hip_3d',
    name: 'КТ тазобедренных суставов и таза с 3D-реконструкцией (FAI, антеверсия вертлужной впадины)',
    category: 'Лучевая диагностика',
    modality: 'ct',
    target_joint: 'hip',
    clinical_indication: 'Фемороацетабулярный импинджмент (CAM/Pincer FAI), глубина вертлужной впадины (coxa profunda), антеверсия шейки бедра и чашки, асептический некроз головки бедренной кости (стадии ARCO).',
    preparation_info: 'Специальной подготовки не требуется.',
    contraindications: 'Беременность.',
    protocol_phrase: 'Выполнена МСКТ тазобедренных суставов с оценкой углов антеверсии шейки и вертлужной впадины, измерением угла Wiberg, альфа-угла по Notzli (CAM-деформация) и картированием субхондрального склероза.',
    sort_order: 14
  },
  {
    code: 'ct_foot_ankle_3d',
    name: 'КТ голеностопного сустава и костей предплюсны с мультипланарной реконструкцией',
    category: 'Лучевая диагностика',
    modality: 'ct',
    target_joint: 'ankle',
    clinical_indication: 'Остеохондральные поражения блока таранной кости (OCL), тарзальные коалиции (синостозы), сложные переломы пилона, таранной и пяточной костей, артроз подтаранного сустава и Шопара.',
    preparation_info: 'Специальной подготовки не требуется.',
    contraindications: 'Беременность.',
    protocol_phrase: 'Выполнена высокоразрешающая МСКТ голеностопного сустава: субмиллиметровые срезы блока таранной кости, состояние субхондральной пластинки, исключение костных перемычек таранно-пяточного и пяточно-ладьевидного сочленений.',
    sort_order: 15
  },
  {
    code: 'ct_wrist_carpal_3d',
    name: 'КТ кисти и костей запястья ультратонким срезом (ладьевидная, полулунная кости)',
    category: 'Лучевая диагностика',
    modality: 'ct',
    target_joint: 'wrist',
    clinical_indication: 'Скрытые переломы и ложные суставы ладьевидной кости, аваскулярный некроз Кинбека, дислокация костей запястья, стабильность дистального лучелоктевого сустава (ДЛЛС).',
    preparation_info: 'Специальной подготовки не требуется.',
    contraindications: 'Беременность.',
    protocol_phrase: 'Выполнена МСКТ запястья с шагом 0.5 мм: детальная оценка трабекулярной костной архитектоники ладьевидной кости, зоны консолидации, отсутствие кистовидной перестройки и субхондрального коллапса.',
    sort_order: 16
  },
  {
    code: 'dexa_densitometry',
    name: 'Двухэнергетическая рентгеновская остеоденситометрия (DEXA поясничный отдел + шейка бедра)',
    category: 'Функциональная / лучевая диагностика',
    modality: 'bone_scan',
    target_joint: 'general',
    clinical_indication: 'Остеопения, сенильный и постменопаузальный остеопороз, оценка T-критерия и Z-критерия, мониторинг антирезорбтивной терапии, прогнозирование 10-летнего риска переломов по FRAX.',
    preparation_info: 'За 24 часа исключить прием препаратов кальция.',
    contraindications: 'Беременность, недавнее исследование ЖКТ с барием (< 7 дней).',
    protocol_phrase: 'Выполнена двухэнергетическая рентгеновская остеоденситометрия (DEXA): измерена минеральная плотность кости (BMD, г/см2) тел L1–L4 и проксимального отдела бедренной кости (Total Hip, Femoral Neck). Рассчитаны T-score и Z-score по нормативам NHANES/ВОЗ.',
    sort_order: 17
  },
  {
    code: 'enmg_cervical_radicular',
    name: 'Стимуляционная и игольчатая ЭНМГ корешков C5–Th1 верхних конечностей',
    category: 'Нейрофизиология',
    modality: 'enmg',
    target_joint: 'spine',
    clinical_indication: 'Цервикобрахиалгия, компрессионно-ишемическая радикулопатия C5, C6, C7, плексопатия плечевого сплетения, дифференциальная диагностика с периферическими туннельными невропатиями.',
    preparation_info: 'Не наносить мази и кремы на руки в день исследования.',
    contraindications: 'Имплантированный кардиостимулятор (для некоторых режимов), нарушения свертываемости крови.',
    protocol_phrase: 'Выполнена комплексная ЭНМГ верхних конечностей: скорость распространения возбуждения (СРВ) по моторным и сенсорным волокнам срединного, локтевого и лучевого нервов, регистрация F-волн; игольчатая ЭМГ выявила признаки текущей денервационно-реиннервационной активности в соответствующих миотомах.',
    sort_order: 18
  },
  {
    code: 'enmg_peroneal_tibial',
    name: 'ЭНМГ малоберцового и большеберцового нервов нижних конечностей',
    category: 'Нейрофизиология',
    modality: 'enmg',
    target_joint: 'ankle',
    clinical_indication: 'Нейропатия малоберцового нерва («свисающая стопа»), тарзальный туннельный синдром, полинейропатия нижних конечностей, корешковый синдром L4–L5–S1.',
    preparation_info: 'Кожа ног должна быть чистой и теплой.',
    contraindications: 'Отсутствуют.',
    protocol_phrase: 'ЭНМГ исследование нервов нижних конечностей: оценка амплитуды М-ответа и СРВ n. peroneus и n. tibialis с двух сторон, определение уровня блока проведения импульса.',
    sort_order: 19
  },
  {
    code: 'lab_inflammation_crp_esr',
    name: 'Лабораторный маркер воспаления: C-реактивный белок ультрачувствительный (hs-CRP) + СОЭ',
    category: 'Лабораторная диагностика',
    modality: 'lab',
    target_joint: 'general',
    clinical_indication: 'Дифференциальная диагностика асептического воспаления (артроз, бурсит) и инфекционно-воспалительного процесса (септический артрит, парапротезная инфекция, спондилодисцит, ревматоидный артрит).',
    preparation_info: 'Сдача крови натощак (утренние часы).',
    contraindications: 'Нет.',
    protocol_phrase: 'Лабораторный скрининг системной воспалительной реакции: количественное определение высокочувствительного СРБ и СОЭ методом Вестергрена.',
    sort_order: 20
  },
  {
    code: 'lab_uric_acid',
    name: 'Биохимический анализ крови: Мочевая кислота сыворотки (диагностика подагры)',
    category: 'Лабораторная диагностика',
    modality: 'lab',
    target_joint: 'general',
    clinical_indication: 'Острый моноартрит I плюснефалангового сустава, голеностопного или коленного сустава, подозрение на микрокристаллический подагрический артрит, мониторинг уратснижающей терапии.',
    preparation_info: 'Натощак, за 3 дня исключить избыток пуринов и алкоголь.',
    contraindications: 'Нет.',
    protocol_phrase: 'Биохимический анализ: уровень мочевой кислоты в сыворотке крови (норма: мужчины 200–420 мкмоль/л, женщины 140–340 мкмоль/л).',
    sort_order: 21
  }
];

async function seedDiagnostics() {
  const run = (sql, p=[]) => new Promise((resolve, reject) => db.run(sql, p, function(err) { if(err) reject(err); else resolve(this); }));
  const all = (sql, p=[]) => new Promise((resolve, reject) => db.all(sql, p, (err, rows) => err ? reject(err) : resolve(rows)));

  console.log('Inserting new diagnostics into diagnostic_methods_catalog...');
  for (const d of newDiagnostics) {
    await run(`
      INSERT OR REPLACE INTO diagnostic_methods_catalog (
        code, name, modality, target_joint, clinical_indications,
        protocol_phrase, priority_level, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, 'primary', 1, ?)
    `, [
      d.code, d.name, d.modality, d.target_joint, d.clinical_indication,
      d.protocol_phrase, d.sort_order
    ]);
  }
  console.log(`Inserted ${newDiagnostics.length} diagnostics successfully.`);

  // Enrich templates that had 0 or 1 diagnostic with gold standard modal pairings
  const links = [
    // #110 (Гонартроз + мениск) - had 0
    { templateId: 110, diags: [{ code: 'mri_knee_high', urgency: 'planned', is_primary: 1 }, { code: 'xray_knee_2v', urgency: 'planned', is_primary: 1 }, { code: 'us_knee', urgency: 'routine', is_primary: 0 }] },
    // #6 (Разрыв латерального мениска)
    { templateId: 6, diags: [{ code: 'xray_knee_2v', urgency: 'planned', is_primary: 1 }] },
    // #10 (Повреждение LCL / PLC колена)
    { templateId: 10, diags: [{ code: 'xray_knee_2v', urgency: 'planned', is_primary: 1 }, { code: 'us_knee', urgency: 'routine', is_primary: 0 }] },
    // #14 (Препателлярный бурсит)
    { templateId: 14, diags: [{ code: 'xray_knee_2v', urgency: 'planned', is_primary: 0 }, { code: 'lab_inflammation_crp_esr', urgency: 'urgent', is_primary: 1 }] },
    // #15 (Эндопротезирование колена)
    { templateId: 15, diags: [{ code: 'xray_long_leg_axis', urgency: 'planned', is_primary: 1 }, { code: 'lab_inflammation_crp_esr', urgency: 'routine', is_primary: 0 }] },
    // #19 (Разрыв сухожилия подлопаточной мышцы плеча)
    { templateId: 19, diags: [{ code: 'xray_shoulder_2v', urgency: 'planned', is_primary: 1 }, { code: 'us_shoulder', urgency: 'planned', is_primary: 0 }] },
    // #21 (Тендинит длинной головки бицепса)
    { templateId: 21, diags: [{ code: 'mri_shoulder', urgency: 'planned', is_primary: 1 }] },
    // #24 (SLAP синдром)
    { templateId: 24, diags: [{ code: 'xray_shoulder_2v', urgency: 'planned', is_primary: 1 }] },
    // #25 (Омартроз)
    { templateId: 25, diags: [{ code: 'mri_shoulder', urgency: 'routine', is_primary: 0 }] },
    // #26 (Артроз АКС)
    { templateId: 26, diags: [{ code: 'mri_shoulder', urgency: 'routine', is_primary: 0 }] },
    // #27 (Разрыв связок АКС)
    { templateId: 27, diags: [{ code: 'mri_shoulder', urgency: 'planned', is_primary: 0 }] },
    // #28 (Перелом ключицы)
    { templateId: 28, diags: [{ code: 'ct_shoulder_3d', urgency: 'planned', is_primary: 0 }] },
    // #29 (Контроль после эндопротезирования плеча)
    { templateId: 29, diags: [{ code: 'lab_inflammation_crp_esr', urgency: 'routine', is_primary: 0 }] },
    // #41 (Контроль эндопротезирования ТБС)
    { templateId: 41, diags: [{ code: 'lab_inflammation_crp_esr', urgency: 'routine', is_primary: 0 }] },
    // #49 (Hallux Rigidus)
    { templateId: 49, diags: [{ code: 'plantography', urgency: 'planned', is_primary: 0 }] },
    // #57 (Контроль после металлоостеосинтеза костей)
    { templateId: 57, diags: [{ code: 'ct_foot_ankle_3d', urgency: 'routine', is_primary: 0 }] },
    // #60 (Бурсит локтевого отростка)
    { templateId: 60, diags: [{ code: 'xray_elbow_2v', urgency: 'routine', is_primary: 0 }, { code: 'lab_inflammation_crp_esr', urgency: 'urgent', is_primary: 1 }] },
    // #63 (Нестабильность UCL локтя)
    { templateId: 63, diags: [{ code: 'xray_elbow_2v', urgency: 'planned', is_primary: 1 }] },
    // #71 (Разрыв TFCC кисти)
    { templateId: 71, diags: [{ code: 'xray_wrist_2v', urgency: 'planned', is_primary: 1 }] },
    // #73 (Болезнь Нотта)
    { templateId: 73, diags: [{ code: 'xray_wrist_2v', urgency: 'routine', is_primary: 0 }] },
    // #74 (Контрактура Дюпюитрена)
    { templateId: 74, diags: [{ code: 'xray_wrist_2v', urgency: 'routine', is_primary: 0 }] },
    // #75 (Ганглион тыла лучезапястного сустава)
    { templateId: 75, diags: [{ code: 'mri_wrist', urgency: 'planned', is_primary: 0 }] },
    // #77 (Перелом дистального метаэпифиза лучевой кости)
    { templateId: 77, diags: [{ code: 'ct_wrist_carpal_3d', urgency: 'planned', is_primary: 1 }] },
    // #84 (Торакалгия грудного отдела)
    { templateId: 84, diags: [{ code: 'mri_thoracic', urgency: 'planned', is_primary: 1 }] },
    // #85 (Идиопатический сколиоз у подростков)
    { templateId: 85, diags: [{ code: 'mri_thoracic', urgency: 'routine', is_primary: 0 }] },
    // #86 (Болезнь Шейермана-Мау)
    { templateId: 86, diags: [{ code: 'mri_thoracic', urgency: 'planned', is_primary: 1 }] },
    // #89 (Синдром Титце)
    { templateId: 89, diags: [{ code: 'lab_inflammation_crp_esr', urgency: 'planned', is_primary: 1 }] },
    // #92 (Болезнь Севера)
    { templateId: 92, diags: [{ code: 'plantography', urgency: 'planned', is_primary: 0 }] },
    // #93 (Болезнь Келлера I)
    { templateId: 93, diags: [{ code: 'plantography', urgency: 'planned', is_primary: 0 }] },
    // #94 (Болезнь Келлера II)
    { templateId: 94, diags: [{ code: 'plantography', urgency: 'planned', is_primary: 0 }] },
    // #95 (Дисплазия ТБС у детей)
    { templateId: 95, diags: [{ code: 'xray_pelvis_hip', urgency: 'planned', is_primary: 1 }] },
    // #96 (Остеопороз сенильный)
    { templateId: 96, diags: [{ code: 'dexa_densitometry', urgency: 'planned', is_primary: 1 }] },
    // #97 (Подагрический артрит)
    { templateId: 97, diags: [{ code: 'lab_uric_acid', urgency: 'urgent', is_primary: 1 }, { code: 'lab_inflammation_crp_esr', urgency: 'urgent', is_primary: 1 }] }
  ];

  for (const item of links) {
    const { templateId, diags } = item;
    for (let i = 0; i < diags.length; i++) {
      const d = diags[i];
      await run(`
        INSERT OR IGNORE INTO ortho_template_diagnostics (template_id, diagnostic_code, urgency, default_side, is_primary, sort_order)
        VALUES (?, ?, ?, 'affected', ?, ?)
      `, [templateId, d.code, d.urgency || 'planned', d.is_primary ?? 1, (i + 1) * 10]);
    }
  }

  console.log('Diagnostics linking completed successfully.');

  // Audit remaining templates with <= 1 diagnostic
  const checkZero = await all(`
    SELECT ot.id, ot.title
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
    AND (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE template_id = ot.id) = 0
  `);
  console.log(`Templates with 0 diagnostics remaining: ${checkZero.length}`);

  const checkOne = await all(`
    SELECT ot.id, ot.title
    FROM ortho_templates ot
    WHERE (ot.is_active = 1 OR ot.is_active IS NULL)
    AND (SELECT COUNT(*) FROM ortho_template_diagnostics WHERE template_id = ot.id) = 1
  `);
  console.log(`Templates with 1 diagnostic remaining: ${checkOne.length}`);

  db.close();
}

seedDiagnostics().catch(err => {
  console.error(err);
  db.close();
});
