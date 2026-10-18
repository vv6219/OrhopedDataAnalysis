/**
 * syncPhysioKnowledgeBase180.js
 * Comprehensive sync & migration script for Physiotherapy & Hardware Treatment (180 templates)
 * Sources: md/Fisio180_1_7.md & md/Fisio180_7_11.md
 */

const fs = require('fs');
const path = require('path');
const db = require('../database');

const file1Path = path.join(__dirname, '../../md/Fisio180_1_7.md');
const file2Path = path.join(__dirname, '../../md/Fisio180_7_11.md');

// Standardized Catalogs with clinical metadata and biophysical profiles
const PHYSIO_CATALOG_DEFINITIONS = [
  {
    code: 'phys_eswt_radial',
    name: 'Радиальная ударно-волновая терапия (rESWT)',
    subcategory: 'shockwave',
    modality_tag: 'eswt_r',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'Storz Masterpuls MP200, BTL-6000 SWT Topline',
    biophysical_profile: JSON.stringify({ wave_type: 'radial_acoustic', pressure_bar: '1.8–3.5', frequency_hz: '10–15', pulses_per_session: '2000–3000' }),
    description: 'Пневматическая генерация расходящихся акустических волн с пиковым давлением до 3.5 Бар. Обеспечивает кавитационную дезинтеграцию микрокальцинатов, разрушение фиброзных спаек, дегрануляцию тучных клеток и неоваскуляризацию через синтез VEGF.',
    technique_details: 'Аппликатор 15 мм или D-Actor 20 мм. Давление 1.8–3.2 Бар, частота 10–15 Гц, 2000–3000 импульсов на сеанс. Без анестезии.',
    regimen_standard: 'Курс: 5–7 сеансов с интервалом 5–7 дней.',
    patient_preparation: 'Осмотр кожных покровов на отсутствие гематом и повреждений.',
    post_procedure_care: 'Запрет приема НПВП в первые 48 часов после сеанса (не блокировать асептическую регенераторную реакцию).',
    clinical_indications: 'Плантарный фасциит, эпикондилит, миофасциальные триггеры, тендинопатия ротаторов плеча, ахиллодиния, трохантерит.',
    contraindications: 'Беременность, открытые зоны роста у детей, коагулопатии, тромбоз вен, наличие кардиостимулятора в зоне воздействия.'
  },
  {
    code: 'phys_eswt_focused',
    name: 'Фокусированная ударно-волновая терапия глубоких зон (fESWT)',
    subcategory: 'shockwave',
    modality_tag: 'eswt_f',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'Storz Duolith SD1 T-Top, Dornier Aries 2',
    biophysical_profile: JSON.stringify({ wave_type: 'focused_shockwave', energy_density_mj_mm2: '0.10–0.45', frequency_hz: '4–6', penetration_depth_cm: 'до 8–12' }),
    description: 'Электромагнитная генерация узкофокусированной ударной волны с глубиной проникновения до 8–12 см. Высокая плотность потока энергии стимулирует остеогенез, микроциркуляцию кости и резорбцию глубоких остеофитов.',
    technique_details: 'Прецизионное позиционирование фокуса под УЗИ/рентген разметкой. Плотность потока 0.15–0.35 мДж/мм², частота 4–6 Гц, 1500–2500 импульсов.',
    regimen_standard: 'Курс: 3–5 сеансов с интервалом 7–14 дней.',
    patient_preparation: 'КТ/МРТ верификация глубины поражения.',
    post_procedure_care: 'Ограничение ударных нагрузок в день процедуры.',
    clinical_indications: 'Кальцифицирующий тендинит ротаторов плеча (Gärtner I–II), псевдоартрозы, кокцигодиния, остеохондропатии, глубокие энтезопатии.',
    contraindications: 'Остеомиелит, опухоли костей, свежие разрывы сухожилий, острые переломы (0–12 нед.), открытые ростковые зоны.'
  },
  {
    code: 'phys_laser_hilt',
    name: 'Высокоинтенсивная лазеротерапия (HILT 1064 нм)',
    subcategory: 'laser',
    modality_tag: 'laser_hilt',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'BTL-6000 High Intensity Laser 12-20W, ASA Laser Hiro TT',
    biophysical_profile: JSON.stringify({ wavelength_nm: 1064, peak_power_w: '12–30', energy_density_j_cm2: '8–25', emission_mode: 'pulsed/continuous' }),
    description: 'Импульсное лазерное излучение глубокого проникновения (длина волны 1064 нм). Стимулирует митохондриальную активность цитохром-с-оксидазы, выработку АТФ, ускоряет неоколлагеногенез и купирует нейропатическую боль.',
    technique_details: 'Динамическое или точечное сканирование насадкой. Режим биостимуляции 8–15 Дж/см², противоотечный импульсный режим до 25 Дж/см².',
    regimen_standard: 'Курс: 6–10 сеансов ежедневно или через день.',
    patient_preparation: 'Защитные очки для пациента и врача обязательны.',
    post_procedure_care: 'Избегать прямого солнечного загара зоны воздействия.',
    clinical_indications: 'Артрозы (гонартроз, омартроз), синовиты, повреждения связок (MCL, LCL, ATFL), радикулопатии, фасеточный синдром, тендиниты.',
    contraindications: 'Онкология, область щитовидной железы, эпилепсия, лихорадка, фотодерматозы.'
  },
  {
    code: 'phys_laser_lllt_mls',
    name: 'Низкоинтенсивная лазеротерапия (LLLT / MLS 808/905 нм)',
    subcategory: 'laser',
    modality_tag: 'laser_lllt',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'medium',
    evidence_level: '1B',
    apparatus_examples: 'ASA Laser MLS Mphi, МИЛТА-Ф, Рикта',
    biophysical_profile: JSON.stringify({ wavelengths_nm: '808 + 905', energy_density_j_cm2: '3–6', frequency_hz: '80–150' }),
    description: 'Синхронизированное непрерывное (808 нм) и импульсное (905 нм) лазерное излучение. Обеспечивает выраженный противовоспалительный, противоотечный и анальгетический эффект на поверхностные суставы и нервные стволы.',
    technique_details: 'Контактное стабильное или лабильное наложение излучателя. Доза 3–6 Дж/см², 5–10 минут на поле.',
    regimen_standard: 'Курс: 8–12 процедур ежедневно.',
    patient_preparation: 'Очистка кожи, защитные очки.',
    post_procedure_care: 'Стандартный охранительный режим.',
    clinical_indications: 'Синдром Титце, ахиллобурсит, туннельные невропатии (карпальный, тарзальный канал), педиатрические энтезопатии.',
    contraindications: 'Онкологические новообразования, кровотечения.'
  },
  {
    code: 'phys_magnet_sis',
    name: 'Высокоинтенсивная магнитотерапия Super Inductive System (SIS 2.5 Тл)',
    subcategory: 'magnet',
    modality_tag: 'magnet_sis',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'BTL-6000 Super Inductive System Elite, Salus Talent-Pro',
    biophysical_profile: JSON.stringify({ magnetic_induction_t: 'up to 2.5 Tesla', frequency_range_hz: '1–150', focus: 'deep_neuro_muscular_osseous' }),
    description: 'Импульсное магнитное поле сверхвысокой индукции до 2.5 Тесла. Реализует нейромодуляцию болевого синдрома (1–10 Гц), миорелаксацию гипертонуса (20–50 Гц), остеогенез и стимуляцию трофики костного мозга (до 150 Гц).',
    technique_details: 'Бесконтактный индуктор (работает поверх одежды и полимерных повязок). Мощность 40–80%, 12–15 минут.',
    regimen_standard: 'Курс: 6–10 сеансов ежедневно или через день.',
    patient_preparation: 'Удалить часы, банковские карты, телефоны, металлические предметы.',
    post_procedure_care: 'Оценка объема движений (ROM) непосредственно после процедуры.',
    clinical_indications: 'Трабекулярный отек костного мозга (Bone Bruise), остеонекроз (болезнь Кинбека, отек мыщелков), спондилоартроз, дискогенная радикулопатия, импинджмент плеча.',
    contraindications: 'Кардиостимуляторы, ферромагнитные имплантаты, инсулиновые помпы, беременность.'
  },
  {
    code: 'phys_magnet_pemf',
    name: 'Импульсная низкочастотная магнитотерапия (ПЕМП / PEMF 15–50 Гц)',
    subcategory: 'magnet',
    modality_tag: 'magnet_pemf',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1B',
    apparatus_examples: 'Полимаг-02, АЛМАГ-02, Biomag Lumina 3D-e',
    biophysical_profile: JSON.stringify({ magnetic_induction_mt: '15–35', frequency_hz: '15–50', waveform: 'pulsed_sinusoid_or_running' }),
    description: 'Длительное воздействие низкочастотного импульсного магнитного поля. Стимулирует экспрессию щелочной фосфатазы, синтез остеокальцина, ускоряет реваскуляризацию и консолидацию костной ткани.',
    technique_details: 'Индукторы соленоиды или линейки индукторов на область сустава/сегмента. 20–35 мТл, 20–30 минут.',
    regimen_standard: 'Курс: 12–20 сеансов ежедневно.',
    patient_preparation: 'Специальной подготовки не требуется. Безопасно при титановых металлоконструкциях.',
    post_procedure_care: 'Без ограничений.',
    clinical_indications: 'Стресс-переломы (метаэпифизы, плюсневые кости), спондилолиз дужки L5, остеопорозные переломы позвонков, переломы ладьевидной кости, болезнь Пертеса.',
    contraindications: 'Гипотония выраженная, гемофилия, системные заболевания крови, имплантированный ЭКС.'
  },
  {
    code: 'phys_tecar_diathermy',
    name: 'Контактная емкостно-резистивная диатермия (TECAR 448 кГц)',
    subcategory: 'tecar',
    modality_tag: 'tecar',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'Indiba Activ CT9, BTL-6000 TR-Therapy, Winback 3SE',
    biophysical_profile: JSON.stringify({ frequency_khz: 448, modes: ['capacitive_CAP', 'resistive_RES'], thermal_levels: ['subthermal_atheric', 'moderate', 'hyperthermic'] }),
    description: 'Высокочастотный ток 448 кГц модулирует ионный транспорт клеточных мембран. Емкостной режим (CAP) действует на мягкие ткани и фасции; резистивный (RES) — на плотные фиброзные связки, капсулы и сухожилия.',
    technique_details: 'Нейтральный электрод-пластина + активный подвижный электрод с проводящим кремом. 15–20 минут.',
    regimen_standard: 'Курс: 6–8 процедур, 2–3 раза в неделю.',
    patient_preparation: 'Очистка кожи, нанесение оригинального медикаментозного крема Indiba.',
    post_procedure_care: 'Лечебная гимнастика и мобилизация сразу после глубокого прогрева капсулы.',
    clinical_indications: 'Сгибательные контрактуры колена и плеча, адгезивный капсулит (фаза II–III), миофасциальный синдром грушевидной и поясничной мышц, рубцовые спайки.',
    contraindications: 'Острый выпот/синовит в суставе (фаза экссудации), тромбофлебит, кардиостимулятор, металлические протезы в зоне прямого резистивного прогрева.'
  },
  {
    code: 'phys_nmes_biofeedback',
    name: 'Нейромышечная электростимуляция с ЭМГ-БОС (NMES / FES)',
    subcategory: 'myostim',
    modality_tag: 'nmes',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'Compex Pro Wireless, BTL-4000 Smart, NeuroTrac MyoPlus Pro',
    biophysical_profile: JSON.stringify({ current_type: 'biphasic_symmetric', frequency_hz: '30–75', pulse_width_us: '200–400', biofeedback: 'EMG_dual_channel' }),
    description: 'Программируемая электростимуляция мышц в сочетании с биологической обратной связью по ЭМГ. Преодолевает артрогенное мышечное ингибирование (AMI), восстанавливает моторный контроль квадрицепса и стабилизаторов.',
    technique_details: 'Накладные гидрогелевые электроды на моторные точки мышцы (например, VMO или ягодичные). Сокращение синхронизируется с волевым усилием пациента.',
    regimen_standard: 'Курс: 10–15 сеансов ежедневно или при каждой тренировке.',
    patient_preparation: 'Обезжиривание кожи, бритье волосяного покрова при необходимости.',
    post_procedure_care: 'Фиксация прироста амплитуды произвольного сокращения в журнале реабилитации.',
    clinical_indications: 'Амиотрофия квадрицепса после пластики ПКС и ТЭКС, нестабильность надколенника (дисбаланс VMO:VL), слабость дельтовидной мышцы, парезы стоп при радикулопатии.',
    contraindications: 'Флеботромбоз, острый мышечный разрыв, спастичность тяжелой степени.'
  },
  {
    code: 'phys_tens_smt',
    name: 'Чрескожная электронейростимуляция и СМТ-терапия (TENS / СМТ / IFT)',
    subcategory: 'electro',
    modality_tag: 'tens',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'medium',
    evidence_level: '1B',
    apparatus_examples: 'Амплипульс-5Д, BTL-4000 Premium, Chattanooga Intelect Mobile',
    biophysical_profile: JSON.stringify({ carrier_frequency_hz: '2000–5000', modulation_frequency_hz: '10–150', modulation_depth_pct: '25–100' }),
    description: 'Синусоидальные модулированные и интерференционные токи. Блокируют проведение болевых импульсов по ноцицептивным С-волокнам по механизму воротного контроля Мелзака-Уолла и стимулируют микроциркуляцию.',
    technique_details: 'Пластинчатые электроды с влажными гидрофильными прокладками или вакуумные аппликаторы. Длительность 15–20 минут.',
    regimen_standard: 'Курс: 8–10 процедур ежедневно.',
    patient_preparation: 'Проверка целостности кожных покровов.',
    post_procedure_care: 'Без ограничений.',
    clinical_indications: 'Вертеброгенная радикулопатия (L5-S1, C6-C7), торакалгия, люмбалгия, фасеточный артроз, послеоперационная острая боль.',
    contraindications: 'Кардиостимулятор, острый гнойный процесс, инфаркт миокарда в раннем периоде, наложение электродов на область сонных артерий.'
  },
  {
    code: 'phys_vtes',
    name: 'Внутритканевая электростимуляция по Герасимову (ВТЭС)',
    subcategory: 'electro',
    modality_tag: 'tens',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '2A',
    servdict_code: 'А17.02.001',
    apparatus_examples: 'ЭСП-01-ВТЭС Магнон, ВТЭС Герасимова',
    biophysical_profile: JSON.stringify({ current_type: 'pulsed_low_frequency', delivery: 'needle_electrode_to_bone_periosteum' }),
    description: 'Подведение импульсного низкочастотного тока непосредственно к надкостнице пораженного позвонка или сустава через стерильную одноразовую иглу-электрод. Устраняет костную болевую рецепцию и восстанавливает микроциркуляцию.',
    technique_details: 'Асептическая пункция иглой-электродом до контакта с костной тканью. Длительность 20–30 минут.',
    regimen_standard: 'Курс: 3–5 процедур с интервалом 2–3 дня.',
    patient_preparation: 'Обработка операционного поля антисептиком.',
    post_procedure_care: 'Асептическая наклейка на место пункции на 12 часов.',
    clinical_indications: 'Стойкий вертеброгенный болевой синдром, коксартроз, гонартроз, остеохондроз с выраженным корешковым синдромом.',
    contraindications: 'Инфекции кожи, коагулопатии, онкология, психические расстройства.'
  },
  {
    code: 'phys_cryo_gameready',
    name: 'Аппаратная локальная криокомпрессия (Game Ready)',
    subcategory: 'cryo',
    modality_tag: 'cryo',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'Game Ready GRPro 2.1, CryoPush',
    biophysical_profile: JSON.stringify({ temperature_celsius: '1.5–10', compression_mode: 'pneumatic_intermittent_15_to_75_mmhg' }),
    description: 'Циркулирующая ледяная вода с синхронной регулируемой пневматической компрессией. Резко снижает локальный метаболизм, отек, купирует гемартроз и уменьшает потребность в анальгетиках.',
    technique_details: 'Анатомический пневмоманжет на коленный, плечевой или голеностопный сустав. Температура +4°C, компрессия 35–50 мм рт. ст., 15–20 минут.',
    regimen_standard: 'Курс: 5–8 процедур, 1–2 раза в день в остром периоде.',
    patient_preparation: 'Проверка чувствительности кожи к холоду.',
    post_procedure_care: 'Избегать согревания сустава в течение 2 часов.',
    clinical_indications: 'Острый гемартроз, синовит, ранний период после артроскопии ПКС/мениска, ТЭКС, вывихи, свежие дисторсии связок.',
    contraindications: 'Болезнь Рейно, холодовая аллергия, выраженный атеросклероз сосудов, тромбоз глубоких вен.'
  },
  {
    code: 'phys_cpm_artromot',
    name: 'Роботизированная пассивная CPM-механотерапия (Artromot K1/S3/E2)',
    subcategory: 'cpm',
    modality_tag: 'cpm',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'Ormed Artromot K1 (колено/ТБС), Artromot S3 (плечо), Artromot E2 (локоть)',
    biophysical_profile: JSON.stringify({ motion_type: 'continuous_passive_motion', speed_deg_min: '20–200', pause_in_extension_flexion_sec: '0–60' }),
    description: 'Длительная непрерывная пассивная разработка сустава на программируемом моторизованном аппарате. Предотвращает образование внутрисуставных фиброзных сращений и спаек капсулы без нагрузки на мышцы.',
    technique_details: 'Точная индивидуальная подгонка длины рычагов аппарата. Постепенное увеличение угла сгибания/разгибания по 5° в день. Длительность 30–45 минут.',
    regimen_standard: 'Курс: 10–15 процедур ежедневно.',
    patient_preparation: 'Фиксация конечности ремнями с контролем комфорта.',
    post_procedure_care: 'Криокомпрессия после сеанса при склонности к реактивному синовиту.',
    clinical_indications: 'После артролиза, пластики связок (ПКС, ЗКС), шва мениска, открытых репозиций переломов, эндопротезирования суставов, посттравматические контрактуры.',
    contraindications: 'Нестабильный остеосинтез, острый механический блок сустава оторванным мениском, инфекционный артрит.'
  },
  {
    code: 'phys_lipus_exogen',
    name: 'Низкоинтенсивный импульсный ультразвук остеогенеза (LIPUS / Exogen)',
    subcategory: 'ultrasound',
    modality_tag: 'lipus',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'Bioventus Exogen Ultrasound Bone Healing System',
    biophysical_profile: JSON.stringify({ ultrasound_frequency_mhz: 1.5, duty_cycle_pct: 20, acoustic_intensity_mw_cm2: 30, session_duration_min: 20 }),
    description: 'Специализированный акустический сигнал низкой интенсивности (30 мВт/см²). Механическая трансдукция через интегрины активирует внутриклеточный путь COX-2/PGE2, ускоряя дифференцировку остеобластов и сращение переломов на 38%.',
    technique_details: 'Фиксация излучателя ремешком строго над зоной перелома с акустическим гелем. 20 минут ежедневно.',
    regimen_standard: 'Курс: 20–30 сеансов ежедневно до рентгенологического сращения.',
    patient_preparation: 'Рентген-локализация щели перелома.',
    post_procedure_care: 'Сохранение разгрузочного режима конечности.',
    clinical_indications: 'Замедленная консолидация переломов, стресс-переломы большеберцовой, ладьевидной и плюсневых костей, псевдоартрозы.',
    contraindications: 'Злокачественные новообразования в зоне воздействия.'
  },
  {
    code: 'phys_ultraphonophoresis',
    name: 'Ультрафонофорез лекарственных препаратов',
    subcategory: 'ultrasound',
    modality_tag: 'phono',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'medium',
    evidence_level: '1B',
    apparatus_examples: 'УЗТ-1.01Ф, BTL-4000 Smart Ultrasound, Sonopuls 190',
    biophysical_profile: JSON.stringify({ frequency_mhz: '1.0 / 3.0', intensity_w_cm2: '0.2–0.8', mode: 'pulsed_1_to_2_or_continuous' }),
    description: 'Чрескожное введение лекарственных веществ (хондроитин сульфат, гидрокортизон, лидаза, НПВП) под воздействием ультразвуковых колебаний.',
    technique_details: 'Лабильная методика с контактной лекарственной мазью. Мощность 0.4–0.6 Вт/см², импульсный режим, 6–10 минут.',
    regimen_standard: 'Курс: 8–10 процедур ежедневно или через день.',
    patient_preparation: 'Очистка кожи.',
    post_procedure_care: 'Не смывать лекарственный гель в течение 1–2 часов.',
    clinical_indications: 'Хронический синовит без выпота, энтезопатии, рубцовые изменения капсулы сустава, бурситы вне обострения.',
    contraindications: 'Острый выпот в суставе, гнойный процесс, тромбофлебит.'
  },
  {
    code: 'phys_electrophoresis',
    name: 'Лекарственный электрофорез',
    subcategory: 'electro',
    modality_tag: 'electrophoresis',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'medium',
    evidence_level: '1B',
    apparatus_examples: 'Поток-1, Элфор-Проф, BTL-4000',
    biophysical_profile: JSON.stringify({ current_type: 'galvanic_direct_current', current_density_ma_cm2: '0.05–0.1' }),
    description: 'Введение ионизированных лекарственных средств (кальций, фосфор, магний, карипазим, новокаин, эуфиллин) постоянным гальваническим током.',
    technique_details: 'Прокладки с лекарственным раствором под анод/катод по полярности ионов. Сила тока до легкого покалывания, 15–20 минут.',
    regimen_standard: 'Курс: 10–12 процедур ежедневно.',
    patient_preparation: 'Проверка целостности кожи.',
    post_procedure_care: 'Контроль отсутствия раздражения кожи под электродами.',
    clinical_indications: 'Остеохондропатии (Осгуда-Шлаттера, Севера), кальцинаты, контрактуры (электрофорез с лидазой), остеопороз (форез кальция).',
    contraindications: 'Индивидуальная непереносимость препаратов, повреждения кожи.'
  },
  {
    code: 'phys_spinal_traction',
    name: 'Компьютерная декомпрессионная тракция позвоночника',
    subcategory: 'traction',
    modality_tag: 'traction',
    target_joint: 'spine',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1B',
    apparatus_examples: 'Chattanooga Triton 6M, DRX9000 True Non-Surgical Spinal Decompression',
    biophysical_profile: JSON.stringify({ traction_force_pct_body_weight: '25–40', angle_deg: '15–25', cycle_sec: '30s_pull_10s_rest' }),
    description: 'Интермиттирующее компьютерное вытяжение шейного или поясничного отделов позвоночника. Снижает внутридисковое давление, расширяет межпозвонковые отверстия и улучшает венозный отток от корешков.',
    technique_details: 'Фиксация тазовыми и грудными ремнями. Тяга от 25% массы тела с плавным нарастанием, угол сгибания 15–20°, 15–20 минут.',
    regimen_standard: 'Курс: 8–10 сеансов через день.',
    patient_preparation: 'МРТ верификация отсутствия секвестрации диска!',
    post_procedure_care: 'Отдых лежа 20 минут, надевание полужесткого корсета на 2 часа после процедуры.',
    clinical_indications: 'Дискогенная люмбалгия, цервикобрахиалгия с радикулопатией без секвестра, фасеточный синдром.',
    contraindications: 'Секвестрированная грыжа диска, спондилолистез, остеопороз позвоночника, шейная миелопатия, нестабильность позвонков.'
  },
  {
    code: 'phys_stabilo_biofeedback',
    name: 'Стабилометрический постуральный тренинг с БОС',
    subcategory: 'biofeedback',
    modality_tag: 'biofeedback',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'medium',
    evidence_level: '1A',
    apparatus_examples: 'Стабилоплатформа СТАБИЛАН-01, Biodex Balance System SD, TecnoBody ProKin',
    biophysical_profile: JSON.stringify({ sensor_type: 'force_plate_multiaxis', feedback_type: 'visual_gamified_audio' }),
    description: 'Тренировка проприоцептивного и нейромышечного контроля на компьютеризированной стабилометрической платформе с визуальной игровой биологической обратной связью.',
    technique_details: 'Калибровка центра давления. Упражнения на удержание равновесия, мишень и перенос веса по траектории, 15–25 минут.',
    regimen_standard: 'Курс: 10–12 сеансов ежедневно или 3 раза в неделю.',
    patient_preparation: 'Удобная спортивная обувь или босиком.',
    post_procedure_care: 'Оценка коэффициента резекции стабилограммы.',
    clinical_indications: 'Реабилитация после пластики ПКС, эндопротезирования колена и тазобедренного сустава, хроническая нестабильность голеностопа, нарушение баланса.',
    contraindications: 'Острая атаксия неясного генеза, острый перелом.'
  },
  {
    code: 'phys_kinesio_protocol',
    name: 'Специализированные кинезиопротоколы (Шрот 3D / Маккензи / AlterG)',
    subcategory: 'kinesio',
    modality_tag: 'kinesio',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    evidence_level: '1A',
    apparatus_examples: 'Антигравитационная беговая дорожка AlterG, Подвесная система Redcord Neurac',
    biophysical_profile: JSON.stringify({ exercise_type: 'target_neuromuscular_reeducation', body_weight_support_pct: '20–80' }),
    description: 'Таргетные протоколы лечебной гимнастики: трехмерная деротационная гимнастика по Шрот при сколиозе, протокол экстензии/флексии по Маккензи и тренировка ходьбы с разгрузкой веса на дорожке AlterG.',
    technique_details: 'Индивидуальное занятие с инструктором-реабилитологом с контролем осей и осанки, 30–45 минут.',
    regimen_standard: 'Курс: 10–20 занятий с последующим домашним закреплением.',
    patient_preparation: 'Спортивная форма.',
    post_procedure_care: 'Выполнение рекомендаций по домашнему двигательному режиму.',
    clinical_indications: 'Идиопатический сколиоз, болезнь Шейермана-Мау, дискогенные боли с феноменом централизации, ранняя вертикализация после операций.',
    contraindications: 'Острый инфекционный процесс, лихорадка, тяжелая сердечно-сосудистая декомпенсация.'
  },
  {
    code: 'phys_paraffin_ozokerite',
    name: 'Теплолечение (парафино-озокеритовые аппликации)',
    subcategory: 'heat',
    modality_tag: 'heat',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'medium',
    evidence_level: '2A',
    apparatus_examples: 'Парафинонагреватель Каскад, медицинский озокерит',
    biophysical_profile: JSON.stringify({ temperature_celsius: '45–50', application_type: 'quilted_or_layering' }),
    description: 'Глубокое прогревание спазмированных мышечных групп и связок теплоемкими парафино-озокеритовыми лепешками. Снижает мышечный тонус перед растяжкой и массажем.',
    technique_details: 'Температура 45–48°C, наложение через клеенку с укутыванием одеялом, 20–30 минут.',
    regimen_standard: 'Курс: 10–12 процедур ежедневно.',
    patient_preparation: 'Сухая чистая кожа без ссадин.',
    post_procedure_care: 'Стретчинг и пассивные упражнения сразу после прогрева.',
    clinical_indications: 'Мышечно-тонические контрактуры, укорочение хамстрингов и икроножных мышц, хронические артрозы вне синовита.',
    contraindications: 'Острый воспалительный процесс, выпот в суставе, онкология, туберкулез.'
  }
];

// 6 Categories of CDSS Physio Blocks
const CDSS_PHYSIO_BLOCKS = [
  {
    risk_category_code: 'oncology_red_flag',
    risk_category_name: 'Ургентный онкологический запрет',
    affected_template_ids: JSON.stringify([180]),
    blocked_modality_tags: JSON.stringify(['all']),
    allowed_modality_tags: JSON.stringify([]),
    cdss_message_ru: 'ТОТАЛЬНЫЙ БЛОК (100%): Запрещены любые виды электро-, магнито-, лазеро-, фото-, УВЧ-, ТЕКАР-, крио-, ударно-волновой терапии и массажа! Назначение физиотерапии при подозрении на опухоль кости категорически противопоказано.',
    severity: 'danger'
  },
  {
    risk_category_code: 'septic_infection',
    risk_category_name: 'Острые гнойно-септические процессы и инфекция суставов',
    affected_template_ids: JSON.stringify([167, 170]),
    blocked_modality_tags: JSON.stringify(['all_outpatient', 'heat', 'tecar', 'eswt', 'electro', 'laser_hilt']),
    allowed_modality_tags: JSON.stringify([]),
    cdss_message_ru: 'ТОТАЛЬНЫЙ БЛОК на амбулаторном этапе: Запрещены все тепловые, импульсные, ударно-волновые и гиперемизирующие процедуры (риск генерализации сепсиса и остеолиза). Восстановительное лечение только после санации очага (DAIR).',
    severity: 'danger'
  },
  {
    risk_category_code: 'urgent_cito',
    risk_category_name: 'Нейрохирургический и ортопедический CITO',
    affected_template_ids: JSON.stringify([113, 158, 179]),
    blocked_modality_tags: JSON.stringify(['traction', 'manual_therapy', 'eswt', 'axial_gym']),
    allowed_modality_tags: JSON.stringify(['gentle_pemf', 'fes_postop']),
    cdss_message_ru: 'ТОТАЛЬНЫЙ БЛОК до хирургической декомпрессии/фиксации: Запрещены тракции позвоночника, мануальная терапия, УВТ и осевые тренажеры! Показана экстренная госпитализация в специализированный стационар.',
    severity: 'danger'
  },
  {
    risk_category_code: 'growth_plates_pediatric',
    risk_category_name: 'Открытые эпифизарные зоны роста у детей',
    affected_template_ids: JSON.stringify([91, 92, 93, 94, 95, 112, 114, 127, 128, 162, 163, 164, 165]),
    blocked_modality_tags: JSON.stringify(['eswt_f', 'eswt_r', 'laser_hilt_thermal', 'tecar_thermal', 'ultrasound_high_intensity']),
    allowed_modality_tags: JSON.stringify(['magnet_pemf', 'myostim', 'paraffin_muscle', 'biofeedback']),
    cdss_message_ru: 'БЛОК СППВР в проекции ростковых зон (физов): Запрещены высокоэнергетическая УВТ (ESWT), HILT-лазер в термическом режиме и ультразвук >0.5 Вт/см². Разрешены: низкоинтенсивное ПЕМП, мягкая миостимуляция, тепло на мышечные брюшка.',
    severity: 'warning'
  },
  {
    risk_category_code: 'acute_fracture_fresh_suture',
    risk_category_name: 'Острые переломы, свежие швы сухожилий и нестабильный остеолиз',
    affected_template_ids: JSON.stringify([28, 40, 47, 57, 77, 78, 103, 108, 116, 136, 148, 151, 153, 154, 159, 177, 178]),
    blocked_modality_tags: JSON.stringify(['eswt', 'cpm_forced', 'tecar_resistive_metal', 'uhf_metal']),
    allowed_modality_tags: JSON.stringify(['lipus', 'magnet_pemf', 'cryo']),
    cdss_message_ru: 'БЛОК СППВР: Запрещена ударно-волновая терапия в первые 12 недель, форсированная механотерапия на сдвиг и высокочастотная электротермия над металлом. Разрешены: LIPUS (Exogen 30 мВт/см²), остеогенное ПЕМП 15–50 Гц, криотерапия.',
    severity: 'warning'
  },
  {
    risk_category_code: 'dvt_vascular',
    risk_category_name: 'Сосудистый тромботический фильтр вен нижних конечностей',
    affected_template_ids: JSON.stringify([11, 15, 31, 41]),
    blocked_modality_tags: JSON.stringify(['pneumocompression', 'vibration', 'tecar_thermal_popliteal', 'deep_heat']),
    allowed_modality_tags: JSON.stringify(['cryo', 'magnet_pemf']),
    cdss_message_ru: 'БЛОК СППВР до исключения тромбоза глубоких вен по УЗДГ: Запрещены пневмокомпрессия, вибротерапия, глубокое прогревание подколенной ямки и голени. Локальная крио- и магнитотерапия допускаются только после отрицательного УЗДГ.',
    severity: 'warning'
  }
];

function detectModalityTag(text) {
  const t = text.toLowerCase();
  if (t.includes('f-eswt') || t.includes('feswt') || t.includes('фокусированн')) return 'eswt_focused';
  if (t.includes('r-eswt') || t.includes('reswt') || t.includes('радиальн')) return 'eswt_radial';
  if (t.includes('увт') || t.includes('eswt') || t.includes('ударно-волнов')) return 'eswt_radial';
  if (t.includes('hilt')) return 'laser_hilt';
  if (t.includes('lllt') || t.includes('mls') || t.includes('лазер')) return 'laser_lllt_mls';
  if (t.includes('sis') || t.includes('super inductive')) return 'magnet_sis';
  if (t.includes('пемп') || t.includes('pemf') || t.includes('магнит')) return 'magnet_pemf';
  if (t.includes('tecar') || t.includes('текар') || t.includes('диатерми')) return 'tecar_diathermy';
  if (t.includes('втэс')) return 'vtes';
  if (t.includes('nmes') || t.includes('fes') || t.includes('фэс') || t.includes('фэмс') || t.includes('миостимул') || t.includes('коц')) return 'nmes_biofeedback';
  if (t.includes('tens') || t.includes('чэнс') || t.includes('смт') || t.includes('амплипульс') || t.includes('интерференц') || t.includes('ддт')) return 'tens_smt';
  if (t.includes('крио') || t.includes('game ready')) return 'cryo_gameready';
  if (t.includes('cpm') || t.includes('artromot') || t.includes('механотерап')) return 'cpm_artromot';
  if (t.includes('lipus') || t.includes('exogen')) return 'lipus_exogen';
  if (t.includes('фонофорез') || t.includes('ультразвук')) return 'ultraphonophoresis';
  if (t.includes('электрофорез')) return 'electrophoresis';
  if (t.includes('тракци') || t.includes('вытяжен') || t.includes('triton') || t.includes('drx')) return 'spinal_traction';
  if (t.includes('бос') || t.includes('biofeedback') || t.includes('стабило')) return 'stabilo_biofeedback';
  if (t.includes('шрот') || t.includes('schroth') || t.includes('seas')) return 'kinesio_protocol';
  if (t.includes('маккензи') || t.includes('уильямс') || t.includes('alterg') || t.includes('redcord') || t.includes('кинезио')) return 'kinesio_protocol';
  if (t.includes('парафин') || t.includes('озокерит') || t.includes('теплолеч') || t.includes('грязе')) return 'paraffin_ozokerite';
  return 'laser_hilt';
}

function extractRows(content, isFile2 = false) {
  const lines = content.split('\n');
  const items = [];
  for (let line of lines) {
    line = line.trim();
    if (!line.startsWith('|') || line.includes(':---') || line.includes('Клиническая нозология')) continue;
    const match = line.match(/^\|\s*\*\*#(\d+)\*\*\s*\|/);
    if (match) {
      const id = parseInt(match[1], 10);
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      items.push({ id, cells, isFile2 });
    }
  }
  return items;
}

// Clean text formatting
function cleanFormatting(str) {
  if (!str) return '';
  return str
    .replace(/\[cite:\s*\d+\]/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTemplateItems(row) {
  const templateId = row.id;
  const items = [];
  let stopText = '';

  if (!row.isFile2) {
    // File 1 format (Templates 1..79)
    // cells[3] = Priority 1
    // cells[4] = Priority 2 and [STOP]
    const p1Raw = row.cells[3] || '';
    const p2Raw = row.cells[4] || '';

    // Extract STOP if exists
    let p2Clean = p2Raw;
    const stopIdx = p2Raw.indexOf('**`[STOP]`**');
    if (stopIdx !== -1) {
      stopText = cleanFormatting(p2Raw.substring(stopIdx + 12));
      p2Clean = p2Raw.substring(0, stopIdx);
    } else {
      const stopIdx2 = p2Raw.indexOf('[STOP]');
      if (stopIdx2 !== -1) {
        stopText = cleanFormatting(p2Raw.substring(stopIdx2 + 6));
        p2Clean = p2Raw.substring(0, stopIdx2);
      }
    }

    // Split P1 items by numbered prefixes: 1), 2), etc.
    const p1Parts = p1Raw.replace(/\*\*`\[P1\]`\*\*/g, '').split(/(?=\b\d+\)\s*)/).map(s => cleanFormatting(s)).filter(s => s.length > 5);
    p1Parts.forEach((part, idx) => {
      items.push({
        priority: 'P1',
        line_order: idx + 1,
        full_text: part,
        modality_code: 'phys_' + detectModalityTag(part)
      });
    });

    // Split P2 items by numbered prefixes: 3), 4), etc.
    const p2Parts = p2Clean.replace(/\*\*`\[P2\]`\*\*/g, '').split(/(?=\b\d+\)\s*)/).map(s => cleanFormatting(s)).filter(s => s.length > 5);
    p2Parts.forEach((part, idx) => {
      items.push({
        priority: 'P2',
        line_order: items.length + 1,
        full_text: part,
        modality_code: 'phys_' + detectModalityTag(part)
      });
    });

  } else {
    // File 2 format (Templates 80..180)
    // cells[4] = Protocol with 1), 2), 3), 4), 5)
    // cells[5] = CDSS Constraints / STOP
    const protocolRaw = row.cells[4] || '';
    stopText = cleanFormatting(row.cells[5] || '');

    const parts = protocolRaw.split(/(?=\b\d+\)\s*)/).map(s => cleanFormatting(s)).filter(s => s.length > 5);
    parts.forEach((part, idx) => {
      // First 2 items are P1, rest are P2
      const isP1 = idx < 2;
      items.push({
        priority: isP1 ? 'P1' : 'P2',
        line_order: idx + 1,
        full_text: part,
        modality_code: 'phys_' + detectModalityTag(part)
      });
    });
  }

  return { templateId, items, stopText };
}

async function runSync() {
  console.log('=== Starting Physiotherapy Knowledge Base Sync (180 Templates) ===');

  const rows1 = extractRows(fs.readFileSync(file1Path, 'utf8'), false);
  const rows2 = extractRows(fs.readFileSync(file2Path, 'utf8'), true);

  // Map by template ID: use rows1 for 1..79, rows2 for 80..180
  const templateRowsMap = new Map();
  rows1.forEach(r => templateRowsMap.set(r.id, r));
  rows2.forEach(r => templateRowsMap.set(r.id, r));

  console.log(`Aggregated ${templateRowsMap.size} clinical templates.`);

  db.serialize(() => {
    // 1. Insert or Replace in ortho_physiotherapy_catalog
    console.log('\n1. Upserting standardized ortho_physiotherapy_catalog entries...');
    const insertCatStmt = db.prepare(`
      INSERT INTO ortho_physiotherapy_catalog (
        code, name, subcategory, modality_tag, target_joint, service_scope,
        default_priority, evidence_level, apparatus_examples, biophysical_profile,
        description, technique_details, regimen_standard, patient_preparation,
        post_procedure_care, clinical_indications, contraindications, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        subcategory = excluded.subcategory,
        modality_tag = excluded.modality_tag,
        service_scope = excluded.service_scope,
        default_priority = excluded.default_priority,
        evidence_level = excluded.evidence_level,
        apparatus_examples = excluded.apparatus_examples,
        biophysical_profile = excluded.biophysical_profile,
        description = excluded.description,
        technique_details = excluded.technique_details,
        regimen_standard = excluded.regimen_standard,
        patient_preparation = excluded.patient_preparation,
        post_procedure_care = excluded.post_procedure_care,
        clinical_indications = excluded.clinical_indications,
        contraindications = excluded.contraindications,
        is_active = 1
    `);

    PHYSIO_CATALOG_DEFINITIONS.forEach(cat => {
      insertCatStmt.run(
        cat.code, cat.name, cat.subcategory, cat.modality_tag, cat.target_joint,
        cat.service_scope, cat.default_priority, cat.evidence_level, cat.apparatus_examples,
        cat.biophysical_profile, cat.description, cat.technique_details, cat.regimen_standard,
        cat.patient_preparation, cat.post_procedure_care, cat.clinical_indications, cat.contraindications
      );
    });
    insertCatStmt.finalize();
    console.log(`✓ Inserted/Updated ${PHYSIO_CATALOG_DEFINITIONS.length} master catalog modalities.`);

    // 2. Link servdict ID for ВТЭС if available
    db.get("SELECT id FROM servdict WHERE code = 'А17.02.001' LIMIT 1", (err, sRow) => {
      if (!err && sRow) {
        db.run("UPDATE ortho_physiotherapy_catalog SET servdict_id = ? WHERE code = 'phys_vtes'", [sRow.id]);
        console.log(`✓ Linked phys_vtes to servdict_id ${sRow.id}`);
      }
    });

    // 3. Insert or Replace in ortho_cdss_physio_blocks
    console.log('\n2. Upserting CDSS Safety Matrix (ortho_cdss_physio_blocks)...');
    const insertCdssStmt = db.prepare(`
      INSERT INTO ortho_cdss_physio_blocks (
        risk_category_code, risk_category_name, affected_template_ids,
        blocked_modality_tags, allowed_modality_tags, cdss_message_ru, severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(risk_category_code) DO UPDATE SET
        risk_category_name = excluded.risk_category_name,
        affected_template_ids = excluded.affected_template_ids,
        blocked_modality_tags = excluded.blocked_modality_tags,
        allowed_modality_tags = excluded.allowed_modality_tags,
        cdss_message_ru = excluded.cdss_message_ru,
        severity = excluded.severity
    `);

    CDSS_PHYSIO_BLOCKS.forEach(b => {
      insertCdssStmt.run(
        b.risk_category_code, b.risk_category_name, b.affected_template_ids,
        b.blocked_modality_tags, b.allowed_modality_tags, b.cdss_message_ru, b.severity
      );
    });
    insertCdssStmt.finalize();
    console.log(`✓ Inserted/Updated ${CDSS_PHYSIO_BLOCKS.length} CDSS risk lock categories.`);

    // 4. Fetch valid catalog codes to ensure 100% foreign key integrity
    db.all("SELECT code FROM ortho_physiotherapy_catalog", (err, cRows) => {
      const validCodes = new Set((cRows || []).map(r => r.code));
      console.log(`Valid catalog codes (${validCodes.size}):`, [...validCodes]);

      // Clean old repetitive template bindings and re-populate with exact clinical specifications
      console.log('\n3. Rebuilding ortho_template_physiotherapy for 180 templates...');
      db.run("DELETE FROM ortho_template_physiotherapy", (delErr) => {
        if (delErr) {
          console.error("Error clearing old bindings:", delErr);
          process.exit(1);
        }

        const insertTmplStmt = db.prepare(`
          INSERT INTO ortho_template_physiotherapy (
            template_id, physiotherapy_code, dosage_or_regimen, is_mandatory,
            sort_order, priority_level, service_scope, ebm_priority, line_order,
            exact_dosimetry, is_stop_warning, stop_rationale
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let totalBindings = 0;
        let stopCount = 0;

        for (let id = 1; id <= 180; id++) {
          const row = templateRowsMap.get(id);
          if (!row) {
            console.warn(`Template #${id} missing in markdown!`);
            continue;
          }

          const parsed = parseTemplateItems(row);

          // Handle template #180 special oncology block
          if (id === 180) {
            insertTmplStmt.run(
              180,
              'phys_cryo_gameready',
              'ТОТАЛЬНЫЙ БЛОК: физиотерапия категорически противопоказана при подозрении на онкологию!',
              0,
              10,
              'low',
              'external',
              'STOP',
              1,
              'Запрещены любые аппаратные тепловые, импульсные и механические воздействия',
              1,
              'ТОТАЛЬНЫЙ ЗАПРЕТ (100%): риск диссеминации опухолевых клеток и патологического перелома при $\\text{Mirels} \\ge 8$.',
              (err) => { if (err) console.error("Error on 180:", err.message); }
            );
            totalBindings++;
            stopCount++;
            continue;
          }

          parsed.items.forEach((item, idx) => {
            const text = item.full_text.replace(/^\d+\)\s*/, '');
            let code = item.modality_code;
            if (!validCodes.has(code)) {
              console.warn(`Fallback for code ${code} -> phys_laser_hilt on template ${id}`);
              code = 'phys_laser_hilt';
            }

            insertTmplStmt.run(
              id,
              code,
              text,
              item.priority === 'P1' ? 1 : 0,
              (idx + 1) * 10,
              item.priority === 'P1' ? 'high' : 'medium',
              'internal',
              item.priority,
              item.line_order,
              text,
              0,
              null,
              (err) => { if (err) console.error(`Error on tmpl ${id} item:`, err.message); }
            );
            totalBindings++;
          });

          // Insert STOP warning if present
          if (parsed.stopText && parsed.stopText.length > 5) {
            const fallbackCode = parsed.items[0]?.modality_code && validCodes.has(parsed.items[0].modality_code)
              ? parsed.items[0].modality_code
              : 'phys_laser_hilt';

            insertTmplStmt.run(
              id,
              fallbackCode,
              'Ограничения безопасности СППВР',
              0,
              990,
              'low',
              'external',
              'STOP',
              99,
              parsed.stopText,
              1,
              parsed.stopText,
              (err) => { if (err) console.error(`Error on tmpl ${id} STOP:`, err.message); }
            );
            stopCount++;
          }
        }

        insertTmplStmt.finalize(() => {
          console.log(`✓ Successfully populated ${totalBindings} physiotherapy prescription bindings across 180 templates!`);
          console.log(`✓ Attached ${stopCount} CDSS STOP safety warnings.`);

          // Verify template 1 and template 80
          db.all("SELECT * FROM ortho_template_physiotherapy WHERE template_id = 1", (err, t1Rows) => {
            console.log(`\nSample Template #1 (Гонартроз) items count: ${t1Rows.length}`);
            t1Rows.forEach(r => console.log(`  [${r.ebm_priority}] ${r.physiotherapy_code}: ${r.dosage_or_regimen.slice(0, 80)}...`));

            db.all("SELECT * FROM ortho_template_physiotherapy WHERE template_id = 80", (err, t80Rows) => {
              console.log(`\nSample Template #80 (Люмбоишиалгия) items count: ${t80Rows.length}`);
              t80Rows.forEach(r => console.log(`  [${r.ebm_priority}] ${r.physiotherapy_code}: ${r.dosage_or_regimen.slice(0, 80)}...`));

              db.all("SELECT * FROM ortho_template_physiotherapy WHERE template_id = 180", (err, t180Rows) => {
                console.log(`\nSample Template #180 (Онконастороженность) items count: ${t180Rows.length}`);
                t180Rows.forEach(r => console.log(`  [${r.ebm_priority}] STOP WARNING: ${r.stop_rationale}`));
                process.exit(0);
              });
            });
          });
        });
      });
    });
  });
}

runSync();
