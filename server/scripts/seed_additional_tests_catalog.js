const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

const additionalTests = [
  {
    code: 'ortolani_barlow',
    name_ru: 'Проба соскальзывания Ортолани и вывихивания Барлоу',
    name_lat: 'Ortolani click & Barlow hip dislocation test',
    joint_category: 'hip',
    target_structure: 'Вертлужная впадина, головка бедренной кости новорожденных/грудничков',
    methodology: 'Ребенок на спине с согнутыми под 90° ТБС и коленными суставами. Большие пальцы врача на внутренних поверхностях бедер, остальные на больших вертелах. Плавное отведение с давлением на вертел (Ортолани) и приведение с осевым давлением назад (Барлоу).',
    positive_criteria: 'Ощущение характерного мягкого толчка/щелчка вправления головки бедра в вертлужную впадину (Ортолани) или смещение головки кзади за пределы вертлужной впадины (Барлоу).',
    sensitivity_pct: 87,
    specificity_pct: 98,
    sensitivity_specificity: 'Se: 87%, Sp: 98%',
    evidence_level: 'A',
    patient_position: 'Лежа на спине на пеленальном столике в расслабленном состоянии.',
    doctor_hand_placement: 'Бимануальный охват обоих бедер грудничка.',
    applied_force_direction: 'Абдукция с передней тракцией / аддукция с задней компрессией.',
    false_positive_factors: 'Щелканье связок коленного сустава, плач и мышечное сопротивление ребенка.',
    clinical_interpretation: 'Врожденная нестабильность тазобедренного сустава, маркер подвывиха или истинного врожденного вывиха бедра.',
    sort_order: 81
  },
  {
    code: 'galeazzi_sign',
    name_ru: 'Симптом Галеацци (Galeazzi / Allis Sign)',
    name_lat: 'Galeazzi / Allis test for femoral length asymmetry',
    joint_category: 'hip',
    target_structure: 'Относительная длина бедер, положение головки бедра в суставе',
    methodology: 'Ребенок лежит на спине на твердой кушетке, стопы прижаты к плоскости стола рядом друг с другом, колени согнуты под прямым углом. Врач визуально сравнивает высоту коленных чашечек.',
    positive_criteria: 'Разноуровневое стояние коленных суставов (одно колено заметно ниже другого).',
    sensitivity_pct: 82,
    specificity_pct: 94,
    sensitivity_specificity: 'Se: 82%, Sp: 94%',
    evidence_level: 'A',
    patient_position: 'Лежа на спине, пятки на кушетке.',
    doctor_hand_placement: 'Визуальный контроль и пальпация верхних полюсов надколенников.',
    applied_force_direction: 'Статическое удержание стоп.',
    false_positive_factors: 'Истинное анатомическое укорочение бедренной кости, косой таз.',
    clinical_interpretation: 'Высокое стояние или задний вывих головки бедренной кости на стороне более низкого колена (ДТБС у детей старше 3 месяцев).',
    sort_order: 82
  },
  {
    code: 'beighton_score_detailed',
    name_ru: 'Шкала гипермобильности Бейтона (Beighton Score 9 баллов)',
    name_lat: 'Beighton 9-point hypermobility score',
    joint_category: 'general',
    target_structure: 'Связочный аппарат, капсулы суставов, коллагеновый матрикс',
    methodology: 'Оценка 5 тестов (по 1 баллу за каждую сторону + 1 за наклон): 1) пассивное переразгибание V пальцев кисти > 90°; 2) пассивное приведение I пальца к предплечью; 3) переразгибание локтей > 10°; 4) переразгибание коленей > 10°; 5) наклон вперед с касанием пола ладонями при прямых коленях.',
    positive_criteria: 'Сумма баллов >= 5/9 у взрослых или >= 6/9 у детей и подростков.',
    sensitivity_pct: 92,
    specificity_pct: 90,
    sensitivity_specificity: 'Se: 92%, Sp: 90%',
    evidence_level: 'A',
    patient_position: 'Сидя и стоя с гониометрическим контролем углов.',
    doctor_hand_placement: 'Гониометр на оси исследуемых суставов.',
    applied_force_direction: 'Пассивное переразгибание без боли.',
    false_positive_factors: 'Посттравматическая локальная нестабильность, тренированность (балет, гимнастика).',
    clinical_interpretation: 'Генерализованная гипермобильность суставов, дисплазия соединительной ткани (ДСТ), синдром Марфана / Элерса-Данлоса.',
    sort_order: 83
  },
  {
    code: 'schober_modified_spine',
    name_ru: 'Модифицированный тест Шобера (Modified Schober Test)',
    name_lat: 'Modified Schober test for lumbar flexion mobility',
    joint_category: 'spine',
    target_structure: 'Поясничный отдел позвоночника, связочный аппарат',
    methodology: 'В положении стоя отмечается линия между задне-верхними остями таза (ямки Венеры, уровень L5). Отмеряется 10 см вверх и 5 см вниз (базовое расстояние 15 см). Пациент максимально наклоняется вперед с прямыми коленями, расстояние измеряется повторно.',
    positive_criteria: 'Увеличение расстояния между метками менее чем на 5 см (итоговое расстояние < 20 см).',
    sensitivity_pct: 88,
    specificity_pct: 89,
    sensitivity_specificity: 'Se: 88%, Sp: 89%',
    evidence_level: 'A',
    patient_position: 'Стоя прямо, ноги вместе, колени выпрямлены.',
    doctor_hand_placement: 'Фиксация сантиметровой ленты по остистым отросткам.',
    applied_force_direction: 'Максимальный наклон вперед.',
    false_positive_factors: 'Острый мышечный спазм, ожирение.',
    clinical_interpretation: 'Ригидность и фиброзирование поясничного отдела позвоночника при анкилозирующем спондилите (болезнь Бехтерева) или тяжелом спондилезе.',
    sort_order: 84
  },
  {
    code: 'mennell_sign',
    name_ru: 'Тест Меннеля (Mennell Sign для КПС)',
    name_lat: "Mennell's test for sacroiliac joint pathology",
    joint_category: 'hip',
    target_structure: 'Крестцово-подвздошное сочленение (КПС)',
    methodology: 'Пациент лежит на животе. Врач одной рукой плотно фиксирует таз в области крестца, а второй рукой производит пассивное переразгибание ноги в тазобедренном суставе.',
    positive_criteria: 'Возникновение глубокой локальной боли в проекции крестцово-подвздошного сочленения на исследуемой стороне.',
    sensitivity_pct: 84,
    specificity_pct: 87,
    sensitivity_specificity: 'Se: 84%, Sp: 87%',
    evidence_level: 'B',
    patient_position: 'Лежа на животе на плоской кушетке.',
    doctor_hand_placement: 'Одна рука на крестце, вторая под дистальным отделом бедра.',
    applied_force_direction: 'Ретрофлексия (переразгибание) бедра кверху.',
    false_positive_factors: 'Корешковый синдром L4–L5, натяжение пояснично-подвздошной мышцы.',
    clinical_interpretation: 'Сакроилеит (включая дебют спондилоартропатий / болезни Бехтерева) или механическая дисфункция КПС.',
    sort_order: 85
  }
];

async function seed() {
  const run = (sql, p=[]) => new Promise((resolve, reject) => db.run(sql, p, function(err) { if(err) reject(err); else resolve(this); }));

  console.log('Inserting pediatric, systemic, and spine tests into catalog...');
  for (const t of additionalTests) {
    await run(`
      INSERT OR REPLACE INTO ortho_test_catalog (
        code, name_ru, name_lat, joint_category, target_structure,
        methodology, positive_criteria, sensitivity_specificity,
        sensitivity_pct, specificity_pct, evidence_level,
        patient_position, doctor_hand_placement, applied_force_direction,
        false_positive_factors, clinical_interpretation, illustration_key,
        icon_type, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'default_joint', 'clinical_test', 1, ?)
    `, [
      t.code, t.name_ru, t.name_lat, t.joint_category, t.target_structure,
      t.methodology, t.positive_criteria, t.sensitivity_specificity,
      t.sensitivity_pct, t.specificity_pct, t.evidence_level,
      t.patient_position, t.doctor_hand_placement, t.applied_force_direction,
      t.false_positive_factors, t.clinical_interpretation, t.sort_order
    ]);
  }
  console.log('Additional tests catalog seeded.');
  db.close();
}
seed().catch(err => { console.error(err); db.close(); });
