/**
 * syncManipulationsStandards180.js
 * Comprehensive Clinical Manipulations, Injections & Interventional Procedures Sync (Clusters 1–11, ID #1–#180)
 * for Ortho Workstation 2.0.
 *
 * Source files:
 *  - md/ManipulatuinandInjections1_8.md (Clusters 1–7)
 *  - md/ManipulatuinandInjections8_10.md (Clusters 8–11)
 *
 * Updates:
 *  1. ortho_manipulations_catalog (adds/updates standards with EBM priority, navigation type, access, drug class, stop warnings, servdict links)
 *  2. ortho_templates (manipulations_priority, manipulations_summary, manipulations_has_stop, manipulations_stop_rationale, performed_manipulations_template)
 *  3. ortho_template_manipulations (ebm_priority, navigation_type, anatomical_access, drug_class, is_stop_warning, stop_rationale, clinical_indications)
 */

const sqlite3 = require('../node_modules/sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- STARTING CLINICAL MANIPULATIONS & INJECTIONS 180 SYNC ---');
console.log('Database target:', dbPath);

const path1 = path.resolve(__dirname, '../../md/ManipulatuinandInjections1_8.md');
const path2 = path.resolve(__dirname, '../../md/ManipulatuinandInjections8_10.md');

const content1 = fs.existsSync(path1) ? fs.readFileSync(path1, 'utf8') : '';
const content2 = fs.existsSync(path2) ? fs.readFileSync(path2, 'utf8') : '';

console.log(`Loaded specification files: f1=${content1.length} bytes, f2=${content2.length} bytes`);

function parseMarkdownTableRows(text) {
  const map = new Map();
  const lines = text.split('\n');

  for (const line of lines) {
    if (!line.trim().startsWith('|') || !line.includes('**#')) continue;
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 6) {
      const idMatch = parts[1].match(/\*\*#(\d+)\*\*/);
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        const title = parts[2].replace(/\[cite:[^\]]+\]/g, '').replace(/`/g, '').trim();
        const rawPriority = parts[3].replace(/\[cite:[^\]]+\]/g, '').replace(/`/g, '').replace(/\*\*/g, '').trim();
        const manipulations = parts[4].replace(/\[cite:[^\]]+\]/g, '').trim();
        const safety = parts[5].replace(/\[cite:[^\]]+\]/g, '').trim();

        // Detect Stop warning
        const hasStop = /P0-STOP|STOP|Запрет|противопоказан/i.test(rawPriority + ' ' + safety) ? 1 : 0;

        // Primary priority: P1, P2, P3, or P0-STOP
        let priority = 'P2';
        if (rawPriority.includes('P1')) priority = 'P1';
        else if (rawPriority.includes('P2')) priority = 'P2';
        else if (rawPriority.includes('P3')) priority = 'P3';
        else if (rawPriority.includes('P0-STOP')) priority = 'P0-STOP';
        else if (hasStop && !rawPriority.includes('P')) priority = 'P0-STOP';

        map.set(id, {
          id,
          title,
          rawPriority,
          priority,
          hasStop,
          manipulations,
          safety
        });
      }
    }
  }
  return map;
}

const map1 = parseMarkdownTableRows(content1);
const map2 = parseMarkdownTableRows(content2);

// Merge maps, with map2 taking precedence for pediatric/systemic/complication templates
const mergedMap = new Map(map1);
for (const [id, item] of map2.entries()) {
  mergedMap.set(id, item);
}

console.log(`Total parsed templates: ${mergedMap.size} (Expected 180)`);

// 1. Core catalog items
const catalogItems = [
  {
    code: 'man_prp_cortexil_10',
    name: 'PRP-терапия Cortexil (пробирка 10 мл) под УЗИ-навигацией',
    subcategory: 'injection_prp',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Введение аутологичной тромбоцитарной плазмы высокой концентрации (Cortexil PRP) под ультразвуковым контролем. Стимулирует регенерацию хряща, связок и сухожилий.',
    technique_details: 'Забор венозной крови 10 мл в специализированную пробирку Cortexil. Центрифугирование в специализированном бакетном режиме. Забор PRP слоя. УЗ-навигация доступа. Введение в сустав или перитендинозно.',
    regimen_standard: 'Курс: 3 инъекции с интервалом 7–14 дней.',
    patient_preparation: 'Отмена НПВП за 5–7 дней. Водный баланс 1.5–2 л. Легкий завтрак.',
    post_procedure_care: 'Охранительный двигательный режим 48 часов. Исключение бани/сауны.',
    clinical_indications: 'Остеоартроз I–II ст., энтезопатии, частичные повреждения связок и менисков.',
    contraindications: 'Тромбоцитопения (<100 тыс), сепсис, активная инфекция кожи, гематологические неоплазии.',
    servdict_id: 2553,
    servdict_code: 'А11.12.009',
    ebm_priority: 'P2',
    navigation_type: 'us_guided',
    anatomical_access: 'Супрапателлярный / переднелатеральный / прицельный УЗ',
    drug_class: 'prp',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'platelets_low,active_infection'
  },
  {
    code: 'man_prp_cortexil_20',
    name: 'PRP-терапия Cortexil (пробирка 20 мл, увеличенный объем) под УЗИ-навигацией',
    subcategory: 'injection_prp',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Аутологичная плазма Cortexil повышенного объема для крупных суставов (коленный, тазобедренный) или мультифокального поражения.',
    technique_details: 'Забор венозной крови 20 мл. Получение до 4–5 мл концентрированной PRP. Введение под ультразвуковой навигацией.',
    regimen_standard: 'Курс: 2–3 процедуры с интервалом 10–14 дней.',
    patient_preparation: 'Отмена НПВП за 7 дней.',
    post_procedure_care: 'Охранительный режим 48 часов.',
    clinical_indications: 'Выраженный гонартроз II–III ст., коксартроз I–II ст., обширные энтезопатии.',
    contraindications: 'Гемобластозы, острые инфекции, тяжелые коагулопатии.',
    servdict_id: 2554,
    servdict_code: 'А11.12.009',
    ebm_priority: 'P2',
    navigation_type: 'us_guided',
    anatomical_access: 'Верхнелатеральный заворот / передний парасагиттальный',
    drug_class: 'prp',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'platelets_low,active_infection'
  },
  {
    code: 'man_ha_gialripayer_15',
    name: 'Внутрисуставное введение препарата гиалуроновой кислоты 1.5% под УЗ-навигацией',
    subcategory: 'injection_ha',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Вязкоэластичный протез синовиальной жидкости со связанными аминокислотами и витамином С. Защищает хрящ, восстанавливает лубрикацию.',
    technique_details: 'Пункция сустава под УЗ-навигацией. Предварительная аспирация выпота при его наличии. Медленное введение 2.0 мл.',
    regimen_standard: 'Курс: 3 инъекции с интервалом 7–10 дней.',
    patient_preparation: 'Эвакуация воспалительного выпота («правило сухого сустава»).',
    post_procedure_care: 'Ограничение осевой нагрузки на 24 часа.',
    clinical_indications: 'Остеоартроз коленного, тазобедренного, плечевого, голеностопного суставов I–II ст.',
    contraindications: 'Острый бактериальный артрит, повреждения кожи в зоне пункции.',
    servdict_id: 2246,
    servdict_code: 'А11.04.004.3',
    ebm_priority: 'P2',
    navigation_type: 'us_guided',
    anatomical_access: 'Верхнелатеральный / задний суставной',
    drug_class: 'ha',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'septic_arthritis,infection_zone'
  },
  {
    code: 'man_ha_high_density_us',
    name: 'Внутрисуставная вискосупплементация высокоплотной/кросс-линк ГК (Форте / 2.3%) под УЗ-навигацией',
    subcategory: 'injection_ha',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Высокомолекулярный кросс-линкованный гиалуронат натрия пролонгированного действия (однократная инъекция на 9–12 месяцев).',
    technique_details: 'Пункция иглой 20G/21G под прямой УЗ-визуализацией кончика иглы в суставной щели. Обязательное «правило сухого сустава».',
    regimen_standard: 'Однократное введение (повтор через 9–12 мес).',
    patient_preparation: 'Купирование острого синовита до инъекции.',
    post_procedure_care: 'Разгрузка сустава 48 часов.',
    clinical_indications: 'Гонартроз, коксартроз II–III ст. с высокими осевыми нагрузками.',
    contraindications: 'Инфекционный артрит, планируемое эндопротезирование <90 дней.',
    servdict_id: 2571,
    servdict_code: 'А11.04.004',
    ebm_priority: 'P2',
    navigation_type: 'us_guided',
    anatomical_access: 'Супрапателлярный заворот / передний парасагиттальный',
    drug_class: 'ha',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'planned_arthroplasty_90d,septic_joint'
  },
  {
    code: 'man_puncture_aspiration',
    name: 'Лечебно-диагностический артроцентез (пункция) сустава под УЗ-навигацией',
    subcategory: 'puncture',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Эвакуация патологического выпота, гемартроза или экссудата под контролем УЗИ для декомпрессии капсулы и макроскопической/микробиологической верификации.',
    technique_details: 'УЗ-сканирование в B-режиме и ЦДК. Местная анестезия. Пункция иглой 18G–20G под ультразвуковым наведением. Полная аспирация шприцем.',
    regimen_standard: 'По клиническим показаниям при наличии выпота/гемартроза.',
    patient_preparation: 'Аллергоанамнез на анестетики. Оценка коагулограммы.',
    post_procedure_care: 'Асептическая давящая повязка, эластичное бинтование.',
    clinical_indications: 'Напряженный гемартроз, реактивный синовит, подозрение на септический или микрокристаллический артрит.',
    contraindications: 'Флегмона околосуставных тканей, пиодермия в месте вкола.',
    servdict_id: 86,
    servdict_code: 'A11.04.003',
    ebm_priority: 'P1',
    navigation_type: 'us_guided',
    anatomical_access: 'Точка максимального скопления выпота под УЗ-контролем',
    drug_class: 'puncture_aspiration',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'phlegmon_puncture_site'
  },
  {
    code: 'man_blockade_gcs_joint_us',
    name: 'Внутрисуставная/периартикулярная блокада пролонгированным ГКС под УЗ-навигацией',
    subcategory: 'blockade',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Быстрое и мощное купирование воспалительного экссудативного синдрома пролонгированным микрокристаллическим глюкокортикостероидом (бетаметазон/триамцинолон).',
    technique_details: 'УЗ-навигация. Точное введение в синовиальную полость или бурсу (строго вне сухожильных волокон!). Не более 2–3 инъекций в год.',
    regimen_standard: 'Однократно для купирования острой фазы синовита/бурсита.',
    patient_preparation: 'Контроль артериального давления и гликемии у пациентов с СД.',
    post_procedure_care: 'Охранительный режим 24–48 часов.',
    clinical_indications: 'Острый экссудативный синовит, бурсит, резистентный болевой синдром.',
    contraindications: 'Инфекция, силовые сухожилия (ахилл, связка надколенника), дети, <90 дней до эндопротезирования.',
    servdict_id: 82,
    servdict_code: 'A11.04.004',
    ebm_priority: 'P2',
    navigation_type: 'us_guided',
    anatomical_access: 'Прицельный УЗ-доступ в синовиальное пространство',
    drug_class: 'gcs',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'diabetes_decomp,power_tendons,planned_tka_90d'
  },
  {
    code: 'man_baker_cyst_aspiration_us',
    name: 'Пункция, аспирация содержимого кисты Бейкера и введение ГКС под УЗ-контролем',
    subcategory: 'puncture',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'УЗ-навигационная пункция и тотальная эвакуация желеобразного содержимого кисты подколенной ямки иглой 16–18G с введением пролонгированного ГКС в полость сустава и шейку соустья.',
    technique_details: 'Обязательное ЦДК-картирование для исключения аневризмы подколенной артерии и защиты большеберцового нерва.',
    regimen_standard: 'Однократно при синдроме компрессии сосудисто-нервного пучка.',
    patient_preparation: 'Исключение тромбоза глубоких вен голени.',
    post_procedure_care: 'Давящая повязка подколенной ямки 48 часов.',
    clinical_indications: 'Напряженная киста Бейкера, псевдотромбофлебит, сдавление большеберцового нерва.',
    contraindications: 'Аневризма подколенной артерии, острый тромбоз подколенной вены.',
    servdict_id: 86,
    servdict_code: 'A11.04.003',
    ebm_priority: 'P1',
    navigation_type: 'us_guided',
    anatomical_access: 'Подколенная ямка латеральнее сосудистого пучка под ЦДК',
    drug_class: 'puncture_aspiration',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'popliteal_aneurysm,deep_vein_thrombosis'
  },
  {
    code: 'man_hydrodilatation_shoulder_us',
    name: 'Гидродилатация (растяжение) капсулы плечевого сустава под УЗ-контролем (Brisement)',
    subcategory: 'reduction',
    target_joint: 'shoulder',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Введение гидравлического объема стерильного физиологического раствора с местным анестетиком и ГКС (до 20–30 мл) под УЗ-контролем до ощущения щелчка разрыва слипчивых сращений капсулы.',
    technique_details: 'Задний доступ к суставу под УЗ-навигацией. Игла 20G/21G в гленохумеральную щель. Медленная инфузия до разрыва синехий.',
    regimen_standard: '1–2 процедуры с интервалом 2–3 недели с немедленной кинезитерапией.',
    patient_preparation: 'Премедикация НПВП/анальгетиком.',
    post_procedure_care: 'Немедленная пассивная мобилизация плеча в первые 2 часа после процедуры!',
    clinical_indications: 'Адгезивный капсулит («замороженное плечо») II (адгезивной) стадии.',
    contraindications: 'Нестабильность плеча, повреждение Банкарта, острый септический артрит.',
    servdict_id: 183,
    servdict_code: 'A11.04.004',
    ebm_priority: 'P1',
    navigation_type: 'us_guided',
    anatomical_access: 'Задний парасагиттальный доступ под ость лопатки',
    drug_class: 'hydrodilatation',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'shoulder_instability,bankart_tear'
  },
  {
    code: 'man_barbotage_calcific_shoulder_us',
    name: 'УЗ-навигационный барботаж (лаваж) и нидлинг кальцината сухожилий вращательной манжеты',
    subcategory: 'puncture',
    target_joint: 'shoulder',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Малоинвазивное чрескожное размывание и аспирация пастообразного кальцината иглой 16G–18G под непрерывным УЗ-контролем.',
    technique_details: 'Местная анестезия кожи и субакромиальной бурсы. Введение иглы в центр кальцината. Пульсирующее промывание теплым 0.9% NaCl.',
    regimen_standard: 'Однократно при фазе резорбции кальцифицирующего тендинита.',
    patient_preparation: 'Рентген- и УЗ-локализация типа кальцината (тип Gartner I–II).',
    post_procedure_care: 'Разгрузочная косыночная повязка 24 часа. Курс НПВП.',
    clinical_indications: 'Острый кальцифицирующий тендинит надостной мышцы, резистентный болевой синдром.',
    contraindications: 'Твердый склеротический кальцинат (тип Gartner III), свежий разрыв манжеты.',
    servdict_id: 86,
    servdict_code: 'A11.04.003',
    ebm_priority: 'P1',
    navigation_type: 'us_guided',
    anatomical_access: 'Субакромиальный доступ по длинной оси надостной мышцы',
    drug_class: 'barbotage_needling',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'solid_mature_calcification'
  },
  {
    code: 'man_trigger_finger_a1_pulley_us',
    name: 'Прицельная блокада и гидродиссекция связки А1 кисти при болезни Нотта',
    subcategory: 'blockade',
    target_joint: 'hand',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'УЗ-навигационное введение микродозы ГКС (дипроспан 0.3–0.5 мл) в сухожильное влагалище с гидродиссекцией утолщенной кольцевидной связки А1.',
    technique_details: 'Игла 27G–30G под УЗ-контролем в продольной плоскости строго между сухожилием глубокого сгибателя и связкой А1.',
    regimen_standard: '1–2 инъекции с интервалом 4–6 недель.',
    patient_preparation: 'Исключение интратендинозного введения под УЗ-контролем.',
    post_procedure_care: 'Охранительный режим пальца 48 часов.',
    clinical_indications: 'Стенозирующий лигаментит («щелкающий палец») I–II стадии по Quinnell.',
    contraindications: 'Инфекция пальца, стойкая сгибательная контрактура IV ст (показана операция).',
    servdict_id: 185,
    servdict_code: 'A11.04.004',
    ebm_priority: 'P2',
    navigation_type: 'us_guided',
    anatomical_access: 'Ладонная поверхность на уровне дистальной ладонной складки',
    drug_class: 'gcs',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'intratendinous_injection_risk'
  },
  {
    code: 'man_de_quervain_sheath_injection_us',
    name: 'Инфильтрация оболочки I тыльного канала запястья при болезни де Кервена под УЗ-контролем',
    subcategory: 'blockade',
    target_joint: 'wrist',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Прицельное введение ГКС с анестетиком в общее фиброзное влагалище короткого разгибателя и длинной отводящей мышцы большого пальца.',
    technique_details: 'УЗ-визуализация хода добавочной внутриканальной септы. Игла 27G вводится строго в синовиальное влагалище.',
    regimen_standard: '1 инъекция (эффективность >80%).',
    patient_preparation: 'Тест Финкельштейна.',
    post_procedure_care: 'Ортезирование I луча кисти на 7–10 дней.',
    clinical_indications: 'Стенозирующий тендовагинит де Кервена.',
    contraindications: 'Прямой укол в сухожилие, повреждение поверхностной ветви лучевого нерва.',
    servdict_id: 185,
    servdict_code: 'A11.04.004',
    ebm_priority: 'P2',
    navigation_type: 'us_guided',
    anatomical_access: 'Шиловидный отросток лучевой кости по длинной оси канала',
    drug_class: 'gcs',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'radial_nerve_branch_risk'
  },
  {
    code: 'man_nursemaid_elbow_reduction',
    name: 'Закрытое вправление подвывиха головки лучевой кости методом гиперпронации («локоть няни»)',
    subcategory: 'reduction',
    target_joint: 'elbow',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Мануальное безиммобилизационное устранение ущемления кольцевидной связки в плечелучевом сочленении у детей 1–5 лет методом быстрой гиперпронации.',
    technique_details: 'Локоть согнут под 90°. Палец врача фиксирует головку луча. Плавная форсированная гиперпронация предплечья до отчетливого щелчка.',
    regimen_standard: 'Однократно. Активные движения рукой восстанавливаются через 5–15 минут.',
    patient_preparation: 'Исключение перелома костей предплечья при падении с высоты.',
    post_procedure_care: 'Иммобилизация не требуется. Инструктаж родителей о недопустимости потягивания за руку.',
    clinical_indications: 'Подвывих головки лучевой кости (Nursemaid elbow) при типичном механизме тракции за запястье.',
    contraindications: 'Деформация костей, подозрение на перелом шейки лучевой кости.',
    servdict_id: 174,
    servdict_code: 'A16.03.034',
    ebm_priority: 'P1',
    navigation_type: 'landmark',
    anatomical_access: 'Плечелучевой сустав (пальпаторный контроль головки луча)',
    drug_class: 'manual_reduction',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'fracture_suspected'
  },
  {
    code: 'man_ponseti_casting_tenotomy',
    name: 'Серийное редрессирующее гипсование по Понсети и чрескожная ахиллотомия',
    subcategory: 'reduction',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Золотой стандарт лечения врожденной косолапости у новорожденных и грудных детей: 5–6 смен гипсовых повязок с последующей ахиллотомией.',
    technique_details: 'Супинация переднего отдела, отведение стопы с упором пальца на головку тарана. Финальная тенотомия ахилла скальпелем 11 под местной анестезией.',
    regimen_standard: 'Серия еженедельных гипсований до отведения 60° и ахиллотомия с гипсом на 3 недели.',
    patient_preparation: 'Ранний старт с 1–2 недели жизни.',
    post_procedure_care: 'Перевод на брейсы Митчелла/Доббса 23 часа/сутки до 3–4 месяцев.',
    clinical_indications: 'Врожденная эквиноварусная косолапость.',
    contraindications: 'Ошибки Кайта: пронация стопы, упор на пяточно-кубовидный сустав.',
    servdict_id: 168,
    servdict_code: 'A15.03.003',
    ebm_priority: 'P1',
    navigation_type: 'landmark',
    anatomical_access: 'Головка таранной кости + ахиллово сухожилие',
    drug_class: 'manual_reduction',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'pronation_mistake_kite'
  },
  {
    code: 'man_needle_aponeurotomy_dupuytren',
    name: 'Малоинвазивная чрескожная игольная апоневротомия (PNA) при контрактуре Дюпюитрена',
    subcategory: 'reduction',
    target_joint: 'hand',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Малоинвазивное чрескожное рассечение рубцово-перерожденных хорд ладонного апоневроза скошенным краем иглы 18G/21G под местной инфильтрационной анестезией.',
    technique_details: 'Инфильтрация кожи без затекания в пальцевой нерв. Многократные возвратно-поступательные движения иглой через хорду с последующей мягкой редрессацией.',
    regimen_standard: 'Однократное амбулаторное вмешательство на луч.',
    patient_preparation: 'Локализация пальцевых сосудисто-нервных пучков под УЗИ.',
    post_procedure_care: 'Ночная разгибательная шина на 3 месяца.',
    clinical_indications: 'Контрактура Дюпюитрена I–II стадии (дефицит разгибания ПФС/ПМФС >20°–30°).',
    contraindications: 'Контрактура IV ст., интимное вовлечение сосудисто-нервного пучка.',
    servdict_id: 86,
    servdict_code: 'A11.04.003',
    ebm_priority: 'P1',
    navigation_type: 'us_guided',
    anatomical_access: 'Ладонные тяжи проксимальнее сгибательной складки',
    drug_class: 'barbotage_needling',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'digital_nerve_injury_risk'
  },
  {
    code: 'man_anti_osteoporotic_sc_iv',
    name: 'Парентеральная антирезорбтивная/анаболическая терапия остеопороза (Деносумаб/Золедронат)',
    subcategory: 'medication',
    target_joint: 'spine',
    service_scope: 'internal',
    default_priority: 'high',
    description: 'Подкожное введение моноклонального антитела к RANKL (Деносумаб 60 мг 1 раз в 6 мес) или внутривенная инфузия золедроновой кислоты 5 мг 1 раз в год для предотвращения низкоэнергетических переломов.',
    technique_details: 'П/к инъекция в бедро/плечо/живот или в/в капельная инфузия на фоне нормального уровня кальция и витамина D.',
    regimen_standard: 'Деносумаб: 1 инъекция каждые 6 месяцев. Золедронат: 1 раз в 12 месяцев.',
    patient_preparation: 'Проверка кальция крови (>2.0 ммоль/л) и СКФ (>35 мл/мин). Санация полости рта стоматологом!',
    post_procedure_care: 'Контрольный денситометрический мониторинг DXA через 12 месяцев.',
    clinical_indications: 'Тяжелый системный остеопороз (T-критерий <-2.5), переломы позвонков, шейки бедра.',
    contraindications: 'Гипокальциемия, тяжелая ХБП, несанированная полость рта (риск остеонекроза челюсти).',
    servdict_id: 58,
    servdict_code: 'А11.02.002',
    ebm_priority: 'P1',
    navigation_type: 'none',
    anatomical_access: 'Подкожно в переднюю поверхность бедра / Внутривенно капельно',
    drug_class: 'anti_osteoporotic',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'hypocalcemia,jaw_osteonecrosis_risk'
  },
  {
    code: 'man_manual_pir_mobilization',
    name: 'Постизометрическая релаксация (ПИР) мышц и мануальная мобилизация суставов по Мейтланду',
    subcategory: 'rehab',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'medium',
    description: 'Щадящие нейромышечные мануальные техники расслабления спазмированных мышечных групп и пассивной циклической мобилизации суставных поверхностей (глайд, тракция, ротация).',
    technique_details: 'Изометрическое напряжение мышцы 7–10 секунд силой 10–20% от максимума против сопротивления врача, затем фаза глубокого выдоха и мягкого удлинения на 15–20 секунд.',
    regimen_standard: 'Курс 5–10 процедур 2–3 раза в неделю.',
    patient_preparation: 'Оценка симптома «концевого упора» (End-Feel).',
    post_procedure_care: 'Рекомендации по домашней лечебной гимнастике.',
    clinical_indications: 'Миофасциальный болевой синдром, легкие мышечные контрактуры, артрогенное ограничение подвижности.',
    contraindications: 'Остеопороз тяжелой степени, нестабильность позвоночника, свежий перелом.',
    servdict_id: 246,
    servdict_code: 'A15.04.002',
    ebm_priority: 'P3',
    navigation_type: 'landmark',
    anatomical_access: 'Периартикулярные мышечные группы',
    drug_class: 'manual_reduction',
    is_stop_warning: 0,
    stop_rationale: '',
    cdss_contraindication_tags: 'severe_osteoporosis,fracture_acute'
  }
];

// Helper to determine relevant manipulation codes for a template based on clinical text
function matchCatalogCodesForTemplate(template) {
  const text = (template.title + ' ' + template.manipulations + ' ' + template.safety).toLowerCase();
  const codes = [];

  // Puncture / Arthrocentesis
  if (/кист.*бейкер/i.test(text)) {
    codes.push('man_baker_cyst_aspiration_us');
  } else if (/пункци|аспираци|артроцентез|гемартроз|экссудат/i.test(text)) {
    codes.push('man_puncture_aspiration');
  }

  // Barbotage / Calcific
  if (/барботаж|кальцинат|нидлинг.*кальцин/i.test(text)) {
    codes.push('man_barbotage_calcific_shoulder_us');
  }

  // Hydrodilatation
  if (/гидродилатаци|бризман|brisement|замороженное плеч/i.test(text)) {
    codes.push('man_hydrodilatation_shoulder_us');
  }

  // Trigger finger / De Quervain
  if (/нотт|щелкающ|связк.*а1/i.test(text)) {
    codes.push('man_trigger_finger_a1_pulley_us');
  }
  if (/де кервен|кервен|i тыльн.*канал/i.test(text)) {
    codes.push('man_de_quervain_sheath_injection_us');
  }

  // Dupuytren
  if (/дюпюитрен|апоневротом|тяж.*апоневроз/i.test(text)) {
    codes.push('man_needle_aponeurotomy_dupuytren');
  }

  // Nursemaid elbow
  if (/няни|подвывих.*головк.*луч/i.test(text)) {
    codes.push('man_nursemaid_elbow_reduction');
  }

  // Ponseti
  if (/понсети|косолапост/i.test(text)) {
    codes.push('man_ponseti_casting_tenotomy');
  }

  // Osteoporosis
  if (/остеопороз|деносумаб|золедронов/i.test(text)) {
    codes.push('man_anti_osteoporotic_sc_iv');
  }

  // PRP therapy
  if (/prp|плазм|ортобиолог|bmac/i.test(text)) {
    if (/20.*мл|крупн.*сустав|коксартроз/i.test(text)) {
      codes.push('man_prp_cortexil_20');
    } else {
      codes.push('man_prp_cortexil_10');
    }
  }

  // Hyaluronic Acid (HA)
  if (/гиалурон|вискосупплементац|гк/i.test(text)) {
    if (/кросс-линк|высокомолекулярн|форте|2\.3|плотн/i.test(text)) {
      codes.push('man_ha_high_density_us');
    } else {
      codes.push('man_ha_gialripayer_15');
    }
  }

  // Corticosteroids (GCS)
  if (/гкс|дипроспан|бетаметазон|триамцинолон|кеналог/i.test(text) && !/запрет.*гкс|не более 2–3 инъекций гкс в год|противопоказан.*гкс/i.test(template.rawPriority)) {
    // Only add GCS if not strictly contraindicated in priority
    if (!codes.includes('man_blockade_gcs_joint_us')) {
      codes.push('man_blockade_gcs_joint_us');
    }
  }

  // PIR / Mobilization / Taping
  if (/пир|релаксаци|мобилизаци|мейтланд|тейпирован|тейп/i.test(text)) {
    codes.push('man_manual_pir_mobilization');
  }

  // If still empty, add default based on priority
  if (codes.length === 0) {
    if (template.hasStop && template.priority === 'P0-STOP') {
      codes.push('man_manual_pir_mobilization');
    } else {
      codes.push('man_puncture_aspiration');
      codes.push('man_prp_cortexil_10');
    }
  }

  return [...new Set(codes)];
}

// Format clean text for performed_manipulations_template
function generatePerformedNote(t) {
  if (t.hasStop && t.priority === 'P0-STOP') {
    const reason = t.safety.replace(/\[cite:[^\]]+\]/g, '').replace(/`/g, '').replace(/\*\*/g, '').slice(0, 140);
    return `Инвазивные манипуляции и инъекции не проводились. Внимание СППВР (P0-STOP): ${reason}... Проведены щадящие неинвазивные пособия: мануальная разгрузка/кинезиотейпирование.`;
  }

  // Extract first clean procedure sentence
  let summaryPart = t.manipulations.split('<br>')[0] || t.manipulations;
  summaryPart = summaryPart.replace(/\[cite:[^\]]+\]/g, '').replace(/`/g, '').replace(/\*\*/g, '').trim();
  if (summaryPart.length > 150) summaryPart = summaryPart.slice(0, 147) + '...';

  return `В асептических условиях под ультразвуковой навигацией (US-guided) выполнена процедура: ${summaryPart}. Место вкола обработано антисептиком, наложена асептическая наклейка. Осложнений нет, пациент перенес процедуру удовлетворительно.`;
}

db.serialize(() => {
  // 1. Insert/Update ortho_manipulations_catalog entries
  const catStmt = db.prepare(`
    INSERT INTO ortho_manipulations_catalog (
      code, name, subcategory, target_joint, service_scope, default_priority,
      description, technique_details, regimen_standard, patient_preparation,
      post_procedure_care, clinical_indications, contraindications,
      servdict_id, servdict_code, is_active, sort_order, created_at,
      ebm_priority, navigation_type, anatomical_access, drug_class,
      is_stop_warning, stop_rationale, cdss_contraindication_tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      subcategory = excluded.subcategory,
      target_joint = excluded.target_joint,
      description = excluded.description,
      technique_details = excluded.technique_details,
      regimen_standard = excluded.regimen_standard,
      clinical_indications = excluded.clinical_indications,
      contraindications = excluded.contraindications,
      servdict_id = COALESCE(excluded.servdict_id, ortho_manipulations_catalog.servdict_id),
      servdict_code = COALESCE(excluded.servdict_code, ortho_manipulations_catalog.servdict_code),
      ebm_priority = excluded.ebm_priority,
      navigation_type = excluded.navigation_type,
      anatomical_access = excluded.anatomical_access,
      drug_class = excluded.drug_class,
      is_stop_warning = excluded.is_stop_warning,
      stop_rationale = excluded.stop_rationale,
      cdss_contraindication_tags = excluded.cdss_contraindication_tags
  `);

  catalogItems.forEach(ci => {
    catStmt.run([
      ci.code, ci.name, ci.subcategory, ci.target_joint, ci.service_scope, ci.default_priority,
      ci.description, ci.technique_details, ci.regimen_standard, ci.patient_preparation,
      ci.post_procedure_care, ci.clinical_indications, ci.contraindications,
      ci.servdict_id, ci.servdict_code,
      ci.ebm_priority, ci.navigation_type, ci.anatomical_access, ci.drug_class,
      ci.is_stop_warning, ci.stop_rationale, ci.cdss_contraindication_tags
    ]);
  });
  catStmt.finalize();
  console.log(`Synchronized ${catalogItems.length} core procedures in ortho_manipulations_catalog.`);

  // 2. Update each of the 180 templates
  const tmplStmt = db.prepare(`
    UPDATE ortho_templates SET
      manipulations_priority = ?,
      manipulations_summary = ?,
      manipulations_has_stop = ?,
      manipulations_stop_rationale = ?,
      performed_manipulations_template = ?
    WHERE id = ?
  `);

  let updatedCount = 0;
  for (let id = 1; id <= 180; id++) {
    const t = mergedMap.get(id);
    if (!t) {
      console.warn(`Template #${id} not found in parsed markdown!`);
      continue;
    }

    const perfNote = generatePerformedNote(t);

    tmplStmt.run([
      t.priority,
      t.manipulations,
      t.hasStop,
      t.safety,
      perfNote,
      id
    ]);
    updatedCount++;
  }
  tmplStmt.finalize();
  console.log(`Updated ortho_templates table for ${updatedCount} templates.`);

  // 3. Synchronize template-manipulation relationships
  const delRelStmt = db.prepare(`DELETE FROM ortho_template_manipulations WHERE template_id = ?`);
  const insRelStmt = db.prepare(`
    INSERT INTO ortho_template_manipulations (
      template_id, manipulation_code, dosage_or_regimen, is_mandatory,
      sort_order, priority_level, service_scope, ebm_priority,
      navigation_type, anatomical_access, drug_class, is_stop_warning,
      stop_rationale, clinical_indications
    ) VALUES (?, ?, ?, ?, ?, ?, 'internal', ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalRels = 0;
  for (let id = 1; id <= 180; id++) {
    const t = mergedMap.get(id);
    if (!t) continue;

    delRelStmt.run([id]);

    const matchedCodes = matchCatalogCodesForTemplate(t);
    matchedCodes.forEach((code, idx) => {
      const catItem = catalogItems.find(c => c.code === code) || {};
      const isStop = t.hasStop && (t.priority === 'P0-STOP' || (code.includes('gcs') && /запрет.*гкс/i.test(t.safety))) ? 1 : 0;
      const ebmPri = isStop ? 'P0-STOP' : (catItem.ebm_priority || t.priority);
      const isMandatory = (ebmPri === 'P1' && !isStop) ? 1 : 0;

      insRelStmt.run([
        id,
        code,
        catItem.regimen_standard || 'По клиническому протоколу',
        isMandatory,
        (idx + 1) * 10,
        ebmPri === 'P1' ? 'high' : 'medium',
        ebmPri,
        catItem.navigation_type || 'us_guided',
        catItem.anatomical_access || 'Под контролем УЗИ',
        catItem.drug_class || 'general',
        isStop,
        isStop ? t.safety.slice(0, 200) : '',
        catItem.clinical_indications || t.title
      ]);
      totalRels++;
    });
  }
  delRelStmt.finalize();
  insRelStmt.finalize();

  console.log(`Linked ${totalRels} manipulation relations in ortho_template_manipulations across 180 templates.`);

  // Verify counts
  db.get(`SELECT COUNT(*) AS total_templates,
                 SUM(CASE WHEN manipulations_priority = 'P1' THEN 1 ELSE 0 END) AS p1_count,
                 SUM(CASE WHEN manipulations_priority = 'P2' THEN 1 ELSE 0 END) AS p2_count,
                 SUM(CASE WHEN manipulations_priority = 'P3' THEN 1 ELSE 0 END) AS p3_count,
                 SUM(CASE WHEN manipulations_priority = 'P0-STOP' THEN 1 ELSE 0 END) AS p0_stop_count,
                 SUM(manipulations_has_stop) AS stop_warnings_count
          FROM ortho_templates`, (err, summary) => {
    if (err) console.error(err);
    console.log('--- SYNC STATISTICS SUMMARY ---');
    console.log(summary);
    console.log('--- CLINICAL MANIPULATIONS & INJECTIONS 180 SYNC COMPLETE ---');
    db.close();
  });
});
