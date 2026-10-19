/**
 * syncLfkStandards180.js
 * Comprehensive synchronization script for:
 * 1. ortho_lfk_catalog (canonical master exercises library with biomechanics, muscle groups, equipment)
 * 2. ortho_templates (lfk_priority, lfk_has_stop, lfk_stop_rationale, lfk_pain_monitoring_zone, lfk_target_goal, lfk_phases_summary)
 * 3. ortho_template_lfk (phased exercise complexes with dosage, tempo, hold, safe angle sectors, EBM priorities, and CDSS STOP locks)
 * Sources of truth:
 * - md/ЛФК1_3.md, md/ЛФК4_7.md, md/ЛФК7_10.md, md/ЛФК10_all.md
 * - md/ЛФК_комплекс_1_4.md, md/ЛФК_комплекс_4_5.md, md/ЛФК_комплекс_6_7.md, md/ЛФК_комплекс_8_9.md, md/ЛФК_комплекс_1_2_3.md, md/ЛФК_комплекс_10_11.md
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('../node_modules/sqlite3').verbose();

const DB_PATH = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');

// Master Canonical Catalog of Kinesiotherapy & Therapeutic Exercises
const MASTER_LFK_CATALOG = [
  // --- КОЛЕННЫЙ СУСТАВ ---
  {
    code: 'lfk_quad_sets',
    name: 'Изометрическая активация четырехглавой мышцы бедра (Quad Sets / VMO Sets)',
    short_name: 'Quad Sets (Изометрия VMO)',
    exercise_type: 'isometric',
    target_joint: 'knee',
    target_muscle_group: 'quadriceps_vmo',
    kinetic_chain: 'ISOM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Изометрия)',
    standard_dosage: '3 подхода × 15 повторений, удержание 6–8 сек',
    tempo_formula: 'изометрическая выдержка 6–8 сек',
    equipment_tags: 'валик, полотенце, кушетка',
    technique_description: 'Лежа на спине с выпрямленной ногой и небольшим валиком под коленом. С силой вдавить подколенную ямку в валик, подтягивая надколенник вверх к себе.',
    contraindications_notes: 'Не переразгибать колено в рекурвацию при болезни Гоффа.'
  },
  {
    code: 'lfk_heel_slides',
    name: 'Активно-ассистированное скольжение пяткой по плоскости (Heel Slides)',
    short_name: 'Heel Slides (Скольжение пяткой)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'knee',
    target_muscle_group: 'hamstrings_quadriceps',
    kinetic_chain: 'AAROM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Мобильность)',
    standard_dosage: '3 подхода × 12–15 повторений',
    tempo_formula: 'плавное скольжение 3 сек сгибание, 3 сек разгибание',
    equipment_tags: 'кушетка, скользящий носок / полотенце',
    technique_description: 'Лежа на спине, пятка плавно подтягивается к ягодице без отрыва от поверхности до безболевого угла флексии.',
    contraindications_notes: 'Не форсировать угол сгибания через острую боль или блок.'
  },
  {
    code: 'lfk_heel_prop',
    name: 'Гравитационная пассивная экстензия на валике под пяткой (Heel Prop)',
    short_name: 'Heel Prop (Провисание на пятке)',
    exercise_type: 'stretching_pir',
    target_joint: 'knee',
    target_muscle_group: 'posterior_capsule',
    kinetic_chain: 'PROM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Редрессация)',
    standard_dosage: '4–5 раз в день по 10–15 минут',
    tempo_formula: 'статическое гравитационное провисание',
    equipment_tags: 'плотный валик 10–15 см под ахилл',
    technique_description: 'Лежа на спине, валик подкладывается строго под пятку. Подколенная ямка свободно провисает в воздухе, разгибая колено до 0° под собственным весом.',
    contraindications_notes: 'Запрещен валик под колено при разгибательной контрактуре!'
  },
  {
    code: 'lfk_prone_hang_llld',
    name: 'Длительная низконагрузочная редрессация разгибания лежа на животе (Prone Hang LLLD)',
    short_name: 'Prone Hang (Провисание голеней)',
    exercise_type: 'stretching_pir',
    target_joint: 'knee',
    target_muscle_group: 'posterior_capsule_hamstrings',
    kinetic_chain: 'PROM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Пластическая релаксация)',
    standard_dosage: '3–4 раза в день по 10–15 минут (манжета 1–2 кг)',
    tempo_formula: 'низкоинтенсивное длительное растяжение (LLLD)',
    equipment_tags: 'кушетка, утяжелитель манжета 1–2 кг',
    technique_description: 'Лежа на животе так, чтобы колени находились у края кушетки, а голени свисали вниз под действием гравитации и груза.',
    contraindications_notes: 'Не допускать рывковых пружинящих движений при костном блоке.'
  },
  {
    code: 'lfk_tke_band',
    name: 'Терминальное разгибание колена стоя с резиновым эспандером (TKE — Terminal Knee Extension)',
    short_name: 'TKE с лентой (Терминальное разгибание)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'knee',
    target_muscle_group: 'vastus_medialis_oblique',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (HSR / Стабилизация)',
    standard_dosage: '3 подхода × 15 повторений, фиксация 3 сек',
    tempo_formula: 'темп 2-3-2 с удержанием в 0°',
    equipment_tags: 'эластичная лента TheraBand, стойка',
    technique_description: 'Стоя, эспандер закреплен спереди на уровне подколенной ямки. Из угла сгибания 30° колено мощно разгибается до 0° с пиковым сокращением VMO.',
    contraindications_notes: 'Избегать переразгибания колена назад (рекурвации).'
  },
  {
    code: 'lfk_short_arc_quad',
    name: 'Короткодуговое разгибание колена на валике (Short-Arc Quad 30°→0°)',
    short_name: 'Short-Arc Quad (Разгибание 30°-0°)',
    exercise_type: 'okc_open_chain',
    target_joint: 'knee',
    target_muscle_group: 'quadriceps_vmo',
    kinetic_chain: 'OKC',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Изолированная активация)',
    standard_dosage: '3 подхода × 15 повторений с задержкой 6 сек',
    tempo_formula: 'подъем 2 сек, удержание 6 сек, опускание 2 сек',
    equipment_tags: 'валик/роллер под коленом диаметром 15-20 см',
    technique_description: 'Лежа на спине, валик под коленом согнут на 30°. Голень разгибается до полного выпрямления 0° с удержанием и опускается обратно.',
    contraindications_notes: 'Безопасно для пателлофеморального сустава.'
  },
  {
    code: 'lfk_slr_4way',
    name: 'Подъем прямой ноги в 4 плоскостях (4-Way Straight Leg Raise — SLR)',
    short_name: '4-Way SLR (Подъем ноги 4 плоскости)',
    exercise_type: 'okc_open_chain',
    target_joint: 'knee',
    target_muscle_group: 'quadriceps_hip_abductors',
    kinetic_chain: 'OKC',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Силовая разгрузка)',
    standard_dosage: '3 подхода × 12–15 повторений в каждом направлении',
    tempo_formula: 'подъем 2 сек, пауза 2 сек, спуск 2 сек',
    equipment_tags: 'кушетка, утяжелители 1–2 кг (в фазе II)',
    technique_description: 'Подъем прямой ноги (колено заблокировано в 0°): на спине (сгибание), на боку (отведение m. gluteus medius), на животе (разгибание), на внутреннем боку (приведение).',
    contraindications_notes: 'Контролировать отсутствие сгибания колена (Extensor Lag).'
  },
  {
    code: 'lfk_wall_slide_fitball',
    name: 'Мини-приседания у стены с фитболом за спиной в безопасном секторе 0°–45° (Wall Slides)',
    short_name: 'Wall Slides с фитболом 0°-45°',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'knee',
    target_muscle_group: 'quadriceps_gluteus',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (HSR / Замкнутая цепь)',
    standard_dosage: '3 подхода × 12 повторений, темп 3-2-3',
    tempo_formula: 'опускание 3 сек, пауза 2 сек, подъем 3 сек',
    equipment_tags: 'фитбол гимнастический, стена',
    technique_description: 'Стоя спиной к стене с фитболом в пояснично-крестцовой зоне. Медленное скольжение вниз строго до угла 40°–45° в коленях, голени вертикальны.',
    contraindications_notes: 'Запрет сгибания глубже 60° при артрозе и пателлофеморальном синдроме.'
  },
  {
    code: 'lfk_spanish_squat',
    name: 'Изометрический «Испанский присед» с ремнем за голенями (Spanish Squat 70°–90°)',
    short_name: 'Spanish Squat (Испанский присед)',
    exercise_type: 'isometric',
    target_joint: 'knee',
    target_muscle_group: 'quadriceps_patellar_tendon',
    kinetic_chain: 'ISOM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Анальгетическая изометрия)',
    standard_dosage: '5 подходов × 45 секунд, отдых 2 мин',
    tempo_formula: 'статическое удержание 45 сек при 70-80% MVC',
    equipment_tags: 'широкий ремень/петля за стойку',
    technique_description: 'Широкая петля фиксирует верхнюю треть обеих голеней к стойке. Пациент отклоняется назад с вертикальными голенями и удерживает полуприсед 70°–90°.',
    contraindications_notes: 'Золотой стандарт анальгезии при колене прыгуна (Cook/Malliaras).'
  },
  {
    code: 'lfk_decline_squat',
    name: 'Одноопорные эксцентрические приседания на наклонной доске 25° (Decline Squat)',
    short_name: 'Decline Squat 25° (Эксцентрика)',
    exercise_type: 'eccentric_hsr',
    target_joint: 'knee',
    target_muscle_group: 'patellar_tendon_quadriceps',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (HSR / Эксцентрика)',
    standard_dosage: '3 подхода × 15 повторений 2 раза в день (12 недель)',
    tempo_formula: 'медленный спуск 4 сек на одной ноге, подъем на двух',
    equipment_tags: 'наклонная клиновидная доска 25°',
    technique_description: 'Стоя на наклонной доске 25° носками вниз. Медленное эксцентрическое опускание на больной ноге за 4 сек до угла 60°, подъем на двух ногах.',
    contraindications_notes: 'Допустима боль до 3-4 баллов по ВАШ при затухании к утру.'
  },
  {
    code: 'lfk_clamshell_band',
    name: 'Упражнение «Ракушка» с эластичной лентой над коленями (Clamshells)',
    short_name: 'Clamshell (Ракушка с лентой)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'hip',
    target_muscle_group: 'gluteus_medius_rotators',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (Проксимальная стабилизация)',
    standard_dosage: '3 подхода × 15–20 повторений',
    tempo_formula: 'подъем 2 сек, пауза 2 сек, спуск 3 сек',
    equipment_tags: 'кольцевая лента TheraBand / Mini-band',
    technique_description: 'Лежа на боку, колени согнуты на 90°, стопы вместе. Медленное разведение коленей с удержанием таза от разворота назад.',
    contraindications_notes: 'Предотвращает динамический вальгус колена и внутреннюю ротацию бедра.'
  },
  {
    code: 'lfk_monster_walk',
    name: 'Боковая проходка в полуприседе с лентой на лодыжках (Monster Walk / Crab Walk)',
    short_name: 'Monster Walk (Боковые шаги)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'hip',
    target_muscle_group: 'gluteus_medius',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (Функциональная стабилизация)',
    standard_dosage: '3 подхода по 15–20 шагов в каждую сторону',
    tempo_formula: 'контролируемые шаги с постоянным натяжением ленты',
    equipment_tags: 'резиновая петля на лодыжках/коленях',
    technique_description: 'В полуприседе 30° с ровной спиной приставные шаги вбок. Стопы параллельны, колени не заваливаются внутрь.',
    contraindications_notes: 'Снижает приводящий момент колена (KAM) на 15–20%.'
  },

  // --- СТОПА И ГОЛЕНОСТОПНЫЙ СУСТАВ ---
  {
    code: 'lfk_ankle_pumps',
    name: 'Дренажный сосудистый мышечный насос голеностопного сустава (Ankle Pumps)',
    short_name: 'Ankle Pumps (Сосудистая помпа)',
    exercise_type: 'drainage_pump',
    target_joint: 'foot_ankle',
    target_muscle_group: 'triceps_surae_peroneal',
    kinetic_chain: 'OKC',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Дренаж / Противоотечный)',
    standard_dosage: 'по 25–30 повторений каждый час бодрствования',
    tempo_formula: 'ритмичное сгибание-разгибание с амплитудой',
    equipment_tags: 'возвышенная клиновидная подушка',
    technique_description: 'Лежа на спине с приподнятой ногой. Активное максимальное тыльное и подошвенное сгибание стоп для стимуляции венозного оттока.',
    contraindications_notes: 'Базовое упражнение профилактики ТГВ и ликвидации отека.'
  },
  {
    code: 'lfk_rathleff_high_load',
    name: 'Протокол высокоинтенсивного медленного сопротивления Ратлеффа (Rathleff Protocol)',
    short_name: 'Протокол Ратлеффа (Плантарная фасция)',
    exercise_type: 'eccentric_hsr',
    target_joint: 'foot_ankle',
    target_muscle_group: 'plantar_fascia_triceps',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (HSR / Ремоделирование)',
    standard_dosage: '3 подхода × 12 повторений через день (с валиком под пальцами)',
    tempo_formula: 'подъем 3 сек, пауза 2 сек, эксцентрический спуск 3 сек',
    equipment_tags: 'край ступеньки, свернутое валиком полотенце под пальцы',
    technique_description: 'Стоя босиком на краю ступеньки с валиком под I–V пальцами стопы (дорсифлексия 35° включает лебедку Windlass). Медленный подъем и опускание пятки ниже уровня.',
    contraindications_notes: 'При остром фасциите раскатывание жесткого мяча по пятке запрещено!'
  },
  {
    code: 'lfk_alfredson_eccentric',
    name: 'Эксцентрический протокол Альфредсона для ахиллова сухожилия (Alfredson Eccentric Protocol)',
    short_name: 'Протокол Альфредсона (Ахиллово сухожилие)',
    exercise_type: 'eccentric_hsr',
    target_joint: 'foot_ankle',
    target_muscle_group: 'triceps_surae_achilles',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (Эксцентрика 12 недель)',
    standard_dosage: '3 подхода × 15 раз с прямым коленом + 3 × 15 с согнутым (180 повт/сут)',
    tempo_formula: 'подъем на двух ногах 1 сек, медленный спуск на больной ноге 4 сек',
    equipment_tags: 'ступенька, рюкзак с весом (при адаптации)',
    technique_description: 'Стоя на носках на ступеньке. Подъем выполняется на двух ногах, затем вес переносится на больную ногу и пятка медленно опускается ниже ступеньки.',
    contraindications_notes: 'При ИНСЕРЦИОННОЙ форме опускание ниже ступеньки ЗАПРЕЩЕНО (только до уровня пола 0°)!'
  },
  {
    code: 'lfk_short_foot_janda',
    name: 'Упражнение «Короткая стопа» по Янда для сводообразующих мышц (Short-Foot Exercise)',
    short_name: 'Short-Foot (Короткая стопа)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'foot_ankle',
    target_muscle_group: 'abductor_hallucis_tibialis_posterior',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Нейромышечный контроль)',
    standard_dosage: '3 подхода × 15 повторений с удержанием 6 сек',
    tempo_formula: 'подтягивание свода 2 сек, фиксация 6 сек, расслабление 2 сек',
    equipment_tags: 'твердый ровный пол',
    technique_description: 'Сидя/стоя, стопа на полу. Подтягивание головки I плюсневой кости к пятке без сгибания пальцев когтем, формируя продольный и поперечный свод.',
    contraindications_notes: 'Запрещено сминание полотенца когтеобразным сгибанием пальцев.'
  },
  {
    code: 'lfk_toe_spread_out',
    name: 'Селективная активация отводящей I палец мышцы «Toe-Spread-Out» (TSO по Киму)',
    short_name: 'Toe-Spread-Out (TSO для Hallux Valgus)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'foot_ankle',
    target_muscle_group: 'abductor_hallucis',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Деротация I пальца)',
    standard_dosage: '3 подхода × 15 повторений с фиксацией 5 сек',
    tempo_formula: 'подъем пальцев, веерный развод, прижатие I пальца на 5 сек',
    equipment_tags: 'ровный пол / зеркало',
    technique_description: '1) Поднять все пальцы стопы; 2) Опустить мизинец кнаружи; 3) С усилием отвести большой палец внутрь и прижать подушечку к полу, удерживая 5 сек.',
    contraindications_notes: 'ЭМГ-активация m. abductor hallucis в 3 раза выше, чем у захвата салфетки.'
  },
  {
    code: 'lfk_tibial_nerve_sliders',
    name: 'Нейродинамическая мобилизация большеберцового нерва в режиме скольжения (Tibial Sliders)',
    short_name: 'Tibial Nerve Sliders (Тарзальный канал)',
    exercise_type: 'neurodynamics',
    target_joint: 'foot_ankle',
    target_muscle_group: 'tibial_nerve',
    kinetic_chain: 'OKC',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Скольжение без натяжения)',
    standard_dosage: '3 подхода × 12 плавных циклов без провокации парестезий',
    tempo_formula: 'синхронное скольжение нерва без натяжения',
    equipment_tags: 'стул / кушетка',
    technique_description: 'При разгибании колена стопа одновременно уходит в подошвенное сгибание/инверсию. При сгибании колена стопа плавно выводится в тыльное сгибание/эверсию.',
    contraindications_notes: 'Запрещены натяжители (Tensioners) с удержанием в тесте Киношиты!'
  },

  // --- ПЛЕЧЕВОЙ ПОЯС И ЛОПАТКА ---
  {
    code: 'lfk_codman_pendulum',
    name: 'Маятникообразные разгрузочные упражнения Кодмана (Codman Pendulum Exercises)',
    short_name: 'Маятник Кодмана (Разгрузка плеча)',
    exercise_type: 'okc_open_chain',
    target_joint: 'shoulder',
    target_muscle_group: 'shoulder_capsule',
    kinetic_chain: 'PROM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Пассивная гравитационная тракция)',
    standard_dosage: '3–4 раза в день по 2–3 минуты в каждом направлении',
    tempo_formula: 'пассивное круговое покачивание за счет туловища',
    equipment_tags: 'опора рукой на стол / легкая гантель 0.5-1 кг',
    technique_description: 'Пациент наклоняется вперед, здоровая рука опирается о стол. Больная рука пассивно свисает вниз. Движение задается покачиванием туловища (круги, маятник).',
    contraindications_notes: 'Мышцы плеча должны быть полностью расслаблены!'
  },
  {
    code: 'lfk_sleeper_stretch',
    name: 'Специфический стретчинг задней капсулы плеча лежа на боку (Sleeper Stretch)',
    short_name: 'Sleeper Stretch (Задняя капсула плеча)',
    exercise_type: 'stretching_pir',
    target_joint: 'shoulder',
    target_muscle_group: 'posterior_shoulder_capsule',
    kinetic_chain: 'PROM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Ликвидация дефицита GIRD)',
    standard_dosage: '4 подхода по 30 секунд удержания 2 раза в день',
    tempo_formula: 'мягкое статическое растяжение до чувства натяжения сзади',
    equipment_tags: 'кушетка, подушка под голову',
    technique_description: 'Лежа на больном боку (лопатка прижата к кушетке), плечо и локоть под 90°. Здоровая рука плавно опускает предплечье вниз во внутреннюю ротацию.',
    contraindications_notes: 'Не допускать соскальзывания лопатки вперед; избегать передней боли.'
  },
  {
    code: 'lfk_full_can_elevation',
    name: 'Подъем руки в плоскости лопатки 30° большими пальцами вверх (Full Can по Куну)',
    short_name: 'Full Can (Подъем в скапуляции)',
    exercise_type: 'okc_open_chain',
    target_joint: 'shoulder',
    target_muscle_group: 'supraspinatus_serratus',
    kinetic_chain: 'OKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (Безопасная активация)',
    standard_dosage: '3 подхода × 12 повторений строго до угла 90°',
    tempo_formula: 'подъем 2 сек, пауза 1 сек, опускание 3 сек',
    equipment_tags: 'гантели 0.5–2 кг / эспандер',
    technique_description: 'Подъем рук в плоскости лопатки (на 30° вперед от фронтальной оси) большими пальцами вверх строго до уровня 90° (активация надостной мышцы без импинджмента).',
    contraindications_notes: 'Запрещено упражнение «Empty Can» (пальцами вниз — вклинивает бугорок под акромион)!'
  },
  {
    code: 'lfk_pushup_plus',
    name: 'Отжимания от стены / пола с финальной протракцией лопаток (Push-up Plus)',
    short_name: 'Push-up Plus (Передняя зубчатая мышца)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'shoulder',
    target_muscle_group: 'serratus_anterior',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (Стабилизация лопатки)',
    standard_dosage: '3 подхода × 15 повторений с удержанием плюса 2 сек',
    tempo_formula: 'отжимание 2 сек, выталкивание лопаток «плюс» 2 сек',
    equipment_tags: 'стена / пол / кушетка',
    technique_description: 'В конце стандартного отжимания максимально вытолкнуть грудной отдел назад, разводя лопатки в стороны (активация m. serratus anterior).',
    contraindications_notes: 'Устраняет крыловидную дискинезию лопатки.'
  },

  // --- ЛОКТЕВОЙ СУСТАВ И КИСТЬ ---
  {
    code: 'lfk_tyler_twist',
    name: 'Эксцентрический протокол Тайлера с гибким стержнем FlexBar (Tyler Twist)',
    short_name: 'Tyler Twist (Латеральный эпикондилит)',
    exercise_type: 'eccentric_hsr',
    target_joint: 'elbow',
    target_muscle_group: 'extensor_carpi_radialis_brevis',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (Эксцентрика ECRB)',
    standard_dosage: '3 подхода × 15 повторений ежедневно (12 недель)',
    tempo_formula: 'скручивание стержня 1 сек, медленный эксцентрический раскрут 4 сек',
    equipment_tags: 'гибкий резиновый стержень TheraBand FlexBar (красный/зеленый)',
    technique_description: 'Больная рука держит стержень в разгибании запястья. Здоровая рука скручивает верхний конец. Выпрямив руки, медленно сопротивляться раскручиванию стержня больной рукой.',
    contraindications_notes: 'Доказанная эффективность 81% без инъекций глюкокортикоидов.'
  },
  {
    code: 'lfk_reverse_tyler_twist',
    name: 'Обратный твист Тайлера для медиального эпикондилита («локоть гольфиста»)',
    short_name: 'Reverse Tyler Twist (Медиальный эпикондилит)',
    exercise_type: 'eccentric_hsr',
    target_joint: 'elbow',
    target_muscle_group: 'flexor_carpi_radialis_pronator',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (Эксцентрика сгибателей)',
    standard_dosage: '3 подхода × 15 повторений ежедневно',
    tempo_formula: 'эксцентрическое разгибание запястья против упругого стержня 4 сек',
    equipment_tags: 'TheraBand FlexBar',
    technique_description: 'Эксцентрическая нагрузка на общее сухожилие сгибателей и круглого пронатора при локте гольфиста.',
    contraindications_notes: 'Не перегружать локтевой нерв в кубитальном канале.'
  },
  {
    code: 'lfk_tendon_gliding_sixpack',
    name: 'Комплекс дифференцированного скольжения сухожилий сгибателей пальцев («Six-Pack»)',
    short_name: 'Tendon Gliding Six-Pack (Скольжение сухожилий кисти)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'wrist_hand',
    target_muscle_group: 'flexor_digitorum_superficialis_profundus',
    kinetic_chain: 'AAROM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Профилактика тенодезных спаек)',
    standard_dosage: '5–6 раз в день по 10 циклов каждого положения',
    tempo_formula: 'плавная смена 5 позиций: прямая ладонь, крючок, кулак, столбик, плоский кулак',
    equipment_tags: 'собственная кисть / ванночка с теплой водой',
    technique_description: 'Последовательное переключение позиций кисти обеспечивает раздельное максимальное скольжение поверхностного и глубокого сгибателей над пластиной/в карпальном канале.',
    contraindications_notes: 'Ранний старт с 1-х суток после остеосинтеза луча VLP.'
  },

  // --- ПОЗВОНОЧНИК И МЫШЦЫ КОРА ---
  {
    code: 'lfk_mcgill_big_three',
    name: '«Большая тройка упражнений стабильности позвоночника» профессора Стюарта МакГилла',
    short_name: 'Большая тройка МакГилла (Core Stability)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'spine',
    target_muscle_group: 'core_multifidus_transversus_quadratus',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Изометрический корсет)',
    standard_dosage: 'Пирамида повторов: 5-3-1 с удержанием 8 сек (Bird-Dog, Side Bridge, Curl-up)',
    tempo_formula: 'изометрическая фиксация нейтрали позвоночника 8 сек',
    equipment_tags: 'гимнастический коврик',
    technique_description: '1) Модифицированный кранч МакГилла с руками под поясницей; 2) Боковая планка на коленях/стопах; 3) «Охотничья собака» (Bird-Dog) с диагональным выносом руки и ноги.',
    contraindications_notes: 'Категорический запрет наклонов и скручиваний при грыжах (правило No BLT)!'
  },
  {
    code: 'lfk_mckenzie_extension',
    name: 'Протокол экстензии и централизации диска по Робину Маккензи (McKenzie Method)',
    short_name: 'Экстензия Маккензи (Централизация диска)',
    exercise_type: 'stretching_pir',
    target_joint: 'spine',
    target_muscle_group: 'lumbar_extensors_annulus',
    kinetic_chain: 'PROM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 1 (Редукция деранжмента)',
    standard_dosage: 'по 10 раз каждые 2 часа бодрствования',
    tempo_formula: 'подъем на локтях/ладонях с расслаблением поясницы и ягодиц',
    equipment_tags: 'кушетка / жесткий пол',
    technique_description: 'Лежа на животе, подъем верхней части туловища на прямые руки при ПОЛНОСТЬЮ расслабленных мышцах поясницы и ягодиц. Фиксация в верхней точке 2 сек.',
    contraindications_notes: 'Критерий успеха: феномен централизации боли (боль уходит из ноги в поясницу).'
  },
  {
    code: 'lfk_schroth_rotational',
    name: 'Специфическая трехплоскостная деротационная гимнастика по методике Катарины Шрот (SOSORT)',
    short_name: 'Гимнастика Шрот / SEAS (Сколиоз)',
    exercise_type: 'ckc_closed_chain',
    target_joint: 'spine',
    target_muscle_group: 'intercostal_paraspinal_core',
    kinetic_chain: 'CKC',
    default_phase: 'Phase 2',
    default_stage_step: 'Ступень 2 (Коррекция деформации)',
    standard_dosage: '45–60 минут ежедневно под контролем дыхания',
    tempo_formula: 'асимметричное ротационное дыхание с изометрическим удержанием',
    equipment_tags: 'шведская стенка, гимнастические палки, зеркала, клиновидные мешочки',
    technique_description: 'Асимметричная коррекция искривления позвоночника: вогнутая зона расширяется направленным дыханием, выпуклая деротируется изометрией мышц.',
    contraindications_notes: 'Золотой стандарт безоперационного лечения сколиоза по SOSORT.'
  },

  // --- СИСТЕМНЫЙ СТОП-ЭЛЕМЕНТ CDSS ---
  {
    code: 'lfk_contra_stop_alert',
    name: 'КЛИНИЧЕСКИЙ БИОМЕХАНИЧЕСКИЙ ЗАПРЕТ ЛФК (CDSS P0-STOP CONTRAINDICATION)',
    short_name: '🚨 CDSS P0-STOP Запрет ЛФК',
    exercise_type: 'contra_stop',
    target_joint: 'general',
    target_muscle_group: 'contraindicated_vectors',
    kinetic_chain: 'ISOM',
    default_phase: 'Phase 1',
    default_stage_step: 'Ступень 0 (Блокировка)',
    standard_dosage: 'СТРОГИЙ ЗАПРЕТ НАЗНАЧЕНИЯ АКТИВНЫХ ДВИЖЕНИЙ В ОПАСНОМ СЕКТОРЕ',
    tempo_formula: '0 (полное исключение нагрузки)',
    equipment_tags: 'иммобилизация, брейс, костыли',
    technique_description: 'Автоматическая блокировка ургентных и разрушающих векторов нагрузки в системе поддержки принятия врачебных решений (СППВР).',
    contraindications_notes: 'Абсолютный запрет до купирования критического состояния или консолидации.'
  }
];

// Helper to determine Pain Monitoring Zone
function determinePainZone(priority, text) {
  const t = (text || '').toLowerCase();
  if (priority === 'P0-STOP' || t.includes('p0-stop') || t.includes('категорический запрет')) {
    return 'red';
  }
  if (t.includes('hsr') || t.includes('эксцентрик') || t.includes('ратлефф') || t.includes('альфредсон') || t.includes('кук') || t.includes('4-5') || t.includes('желтая зона')) {
    return 'yellow';
  }
  return 'green';
}

// Helper to determine Primary EBM Priority
function determineEbmPriority(priorityCol, complexText, stopCol) {
  const combined = `${priorityCol || ''} ${complexText || ''} ${stopCol || ''}`.toUpperCase();
  if (combined.includes('P0-STOP') || combined.includes('STOP') || combined.includes('ЗАПРЕТ')) {
    if (priorityCol.includes('P0-STOP')) return 'P0-STOP';
    // If it has P1 + P0-STOP, base priority is P1 with active stop flag
    if (priorityCol.includes('P1')) return 'P1';
    if (priorityCol.includes('P2')) return 'P2';
  }
  if (priorityCol.includes('P1')) return 'P1';
  if (priorityCol.includes('P2')) return 'P2';
  if (priorityCol.includes('P3')) return 'P3';
  return 'P1';
}

// Main Runner
async function run() {
  console.log('--- STARTING COMPREHENSIVE LFK & KINESIOTHERAPY SYNCHRONIZATION (180 TEMPLATES) ---');
  const db = new sqlite3.Database(DB_PATH);

  // 1. Upsert Master LFK Catalog Items
  console.log(`[1/4] Upserting ${MASTER_LFK_CATALOG.length} canonical exercises into ortho_lfk_catalog...`);
  const catalogStmt = db.prepare(`
    INSERT INTO ortho_lfk_catalog (
      code, name, short_name, exercise_type, target_joint, target_muscle_group,
      kinetic_chain, default_phase, default_stage_step, standard_dosage, tempo_formula,
      equipment_tags, technique_description, contraindications_notes, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      short_name = excluded.short_name,
      exercise_type = excluded.exercise_type,
      target_joint = excluded.target_joint,
      target_muscle_group = excluded.target_muscle_group,
      kinetic_chain = excluded.kinetic_chain,
      default_phase = excluded.default_phase,
      default_stage_step = excluded.default_stage_step,
      standard_dosage = excluded.standard_dosage,
      tempo_formula = excluded.tempo_formula,
      equipment_tags = excluded.equipment_tags,
      technique_description = excluded.technique_description,
      contraindications_notes = excluded.contraindications_notes
  `);

  for (const item of MASTER_LFK_CATALOG) {
    catalogStmt.run([
      item.code, item.name, item.short_name, item.exercise_type, item.target_joint,
      item.target_muscle_group, item.kinetic_chain, item.default_phase, item.default_stage_step,
      item.standard_dosage, item.tempo_formula, item.equipment_tags,
      item.technique_description, item.contraindications_notes
    ]);
  }
  catalogStmt.finalize();

  // 2. Parse all markdown files
  console.log('[2/4] Parsing 10 LFK markdown specification files...');
  const overviewFiles = ['ЛФК1_3.md', 'ЛФК4_7.md', 'ЛФК7_10.md', 'ЛФК10_all.md'];
  const complexFiles = [
    'ЛФК_комплекс_1_4.md', 'ЛФК_комплекс_4_5.md', 'ЛФК_комплекс_6_7.md',
    'ЛФК_комплекс_8_9.md', 'ЛФК_комплекс_1_2_3.md', 'ЛФК_комплекс_10_11.md'
  ];

  function parseTable(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const res = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|')) continue;
      const m = trimmed.match(/^\|\s*\*\*#(\d+)\*\*[^\/|]*\|(.*)/);
      if (!m) continue;

      const id = parseInt(m[1], 10);
      const rest = m[2];
      const parts = rest.split('|').map(p => p.trim());
      res[id] = parts;
    }
    return res;
  }

  const overviewData = {};
  for (const f of overviewFiles) {
    Object.assign(overviewData, parseTable(path.resolve(__dirname, '../../md', f)));
  }

  const complexData = {};
  for (const f of complexFiles) {
    Object.assign(complexData, parseTable(path.resolve(__dirname, '../../md', f)));
  }

  console.log(`Parsed overview data: ${Object.keys(overviewData).length} templates`);
  console.log(`Parsed complex data: ${Object.keys(complexData).length} templates`);

  // Clear existing template relations for clean sync
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM ortho_template_lfk", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // 3. Process each template from 1 to 180
  console.log('[3/4] Normalizing and populating 180 templates with phased kinesiotherapy...');
  const relInsertStmt = db.prepare(`
    INSERT INTO ortho_template_lfk (
      template_id, lfk_code, phase_number, phase_name, stage_step, exercise_order,
      exercise_name_override, dosage_prescription, tempo_and_hold, frequency_per_day,
      biomechanical_goal, ebm_priority, pain_threshold_zone, kinetic_chain,
      safe_angle_range, tags, is_stop_warning, stop_rationale, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateTemplateStmt = db.prepare(`
    UPDATE ortho_templates SET
      lfk_priority = ?,
      lfk_has_stop = ?,
      lfk_stop_rationale = ?,
      lfk_pain_monitoring_zone = ?,
      lfk_target_goal = ?,
      lfk_phases_summary = ?
    WHERE id = ?
  `);

  let countP1 = 0;
  let countP2 = 0;
  let countP3 = 0;
  let countStop = 0;
  let totalRelations = 0;

  for (let id = 1; id <= 180; id++) {
    const oRow = overviewData[id] || [];
    const cRow = complexData[id] || [];

    // Fields extraction
    const rawPriority = oRow[1] || cRow[1] || 'P1';
    const rawGoalOrStop = oRow[3] || oRow[2] || '';
    const complexPlan = cRow[2] || oRow[2] || '';
    const rawStopRules = cRow[3] || oRow[3] || '';

    const priority = determineEbmPriority(rawPriority, complexPlan, rawStopRules);
    const hasStop = (rawPriority.includes('P0-STOP') || rawStopRules.toUpperCase().includes('STOP') || rawStopRules.includes('ЗАПРЕТ')) ? 1 : 0;

    // Clean Stop Rationale
    let stopRationale = '';
    const stopMatch = (rawStopRules + ' ' + rawGoalOrStop).match(/\[P0-STOP[^\]]*\]:?\s*([^|\n]+)/i);
    if (stopMatch) {
      stopRationale = stopMatch[1].replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
    } else if (hasStop) {
      stopRationale = rawStopRules.replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
    }

    // Clean Biomechanical Target Goal
    let targetGoal = '';
    const goalMatch = rawGoalOrStop.match(/Цель:\s*([^|\n<]+)/i);
    if (goalMatch) {
      targetGoal = goalMatch[1].replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
    } else {
      targetGoal = 'Восстановление безболезненной амплитуды движений, нейромышечного контроля и трофики сегмента.';
    }

    const painZone = determinePainZone(priority, complexPlan + ' ' + rawStopRules);

    if (priority === 'P1') countP1++;
    else if (priority === 'P2') countP2++;
    else if (priority === 'P3') countP3++;
    else if (priority === 'P0-STOP') countStop++;

    // Parse Phased Exercises
    const fullPlanText = complexPlan || oRow[2] || '';
    const phasesSummary = [];

    // Separate text by phases
    const phase1Match = fullPlanText.match(/Фаза\s*I\s*\(([^)]+)\):?\s*([\s\S]*?)(?=Фаза\s*II|Фаза\s*2|Ступень\s*2|$)/i);
    const phase2Match = fullPlanText.match(/(?:Фаза\s*II|Фаза\s*2)\s*(?:\(([^)]+)\))?:?\s*([\s\S]*?)(?=Фаза\s*III|Фаза\s*3|Ступень\s*3|$)/i);
    const phase3Match = fullPlanText.match(/(?:Фаза\s*III|Фаза\s*3)\s*(?:\(([^)]+)\))?:?\s*([\s\S]*?)(?=$)/i);

    let phaseCount = 0;

    function addExercise(phNum, phTitle, exOrder, name, dosage, chain, tags, step) {
      // Find matching catalog code
      let matchedCode = 'lfk_quad_sets';
      const nLower = name.toLowerCase();
      if (nLower.includes('велотренажер') || nLower.includes('вело')) matchedCode = 'lfk_heel_slides';
      else if (nLower.includes('quad') || nLower.includes('квадрицепс') || nLower.includes('vmo')) matchedCode = 'lfk_quad_sets';
      else if (nLower.includes('пятк') && (nLower.includes('скольжен') || nLower.includes('slides'))) matchedCode = 'lfk_heel_slides';
      else if (nLower.includes('пятк') && nLower.includes('провисан')) matchedCode = 'lfk_heel_prop';
      else if (nLower.includes('prone hang')) matchedCode = 'lfk_prone_hang_llld';
      else if (nLower.includes('tke') || nLower.includes('терминальн')) matchedCode = 'lfk_tke_band';
      else if (nLower.includes('slr') || nLower.includes('подъем прямой ноги')) matchedCode = 'lfk_slr_4way';
      else if (nLower.includes('wall') || nLower.includes('приседан')) matchedCode = 'lfk_wall_slide_fitball';
      else if (nLower.includes('испанск') || nLower.includes('spanish')) matchedCode = 'lfk_spanish_squat';
      else if (nLower.includes('decline') || nLower.includes('наклонной')) matchedCode = 'lfk_decline_squat';
      else if (nLower.includes('ракушк') || nLower.includes('clamshell')) matchedCode = 'lfk_clamshell_band';
      else if (nLower.includes('monster') || nLower.includes('крабов')) matchedCode = 'lfk_monster_walk';
      else if (nLower.includes('насос') || nLower.includes('pumps') || nLower.includes('помпа')) matchedCode = 'lfk_ankle_pumps';
      else if (nLower.includes('ратлефф') || nLower.includes('rathleff')) matchedCode = 'lfk_rathleff_high_load';
      else if (nLower.includes('альфредсон') || nLower.includes('alfredson')) matchedCode = 'lfk_alfredson_eccentric';
      else if (nLower.includes('короткая стопа') || nLower.includes('short-foot') || nLower.includes('short foot')) matchedCode = 'lfk_short_foot_janda';
      else if (nLower.includes('tso') || nLower.includes('toe-spread') || nLower.includes('отводящей')) matchedCode = 'lfk_toe_spread_out';
      else if (nLower.includes('большеберцов') || nLower.includes('tibial') || nLower.includes('тарзальн')) matchedCode = 'lfk_tibial_nerve_sliders';
      else if (nLower.includes('кодман') || nLower.includes('маятник') || nLower.includes('codman')) matchedCode = 'lfk_codman_pendulum';
      else if (nLower.includes('sleeper')) matchedCode = 'lfk_sleeper_stretch';
      else if (nLower.includes('full can') || nLower.includes('скапуляц')) matchedCode = 'lfk_full_can_elevation';
      else if (nLower.includes('push-up') || nLower.includes('отжиман')) matchedCode = 'lfk_pushup_plus';
      else if (nLower.includes('tyler') || nLower.includes('тайлер')) matchedCode = 'lfk_tyler_twist';
      else if (nLower.includes('reverse tyler')) matchedCode = 'lfk_reverse_tyler_twist';
      else if (nLower.includes('six-pack') || nLower.includes('скольжение сухожил')) matchedCode = 'lfk_tendon_gliding_sixpack';
      else if (nLower.includes('mcgill') || nLower.includes('макгилл') || nLower.includes('тройка')) matchedCode = 'lfk_mcgill_big_three';
      else if (nLower.includes('маккензи') || nLower.includes('mckenzie') || nLower.includes('экстензия')) matchedCode = 'lfk_mckenzie_extension';
      else if (nLower.includes('шрот') || nLower.includes('schroth') || nLower.includes('seas')) matchedCode = 'lfk_schroth_rotational';

      relInsertStmt.run([
        id, matchedCode, phNum, phTitle, step || `Ступень ${phNum}`,
        exOrder, name, dosage, 'темп медленный, контроль оси', '2–3 раза в день',
        targetGoal, priority, painZone, chain || 'CKC',
        'Безболезненный сектор', tags || 'ЛФК, кинезиотерапия', 0, null, exOrder
      ]);
      totalRelations++;
    }

    if (phase1Match) {
      phaseCount++;
      const phTitle = `Фаза I: ${phase1Match[1].trim()}`;
      phasesSummary.push(phTitle);
      const exItems = phase1Match[2].split(/\d+\)\s*|\d+\.\s*/).map(s => s.trim()).filter(Boolean);
      exItems.forEach((ex, idx) => {
        const cleanName = ex.split(':')[0].replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
        const cleanDosage = ex.includes(':') ? ex.split(':').slice(1).join(':').replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim() : '3 подхода × 12–15 повторений';
        addExercise(1, phTitle, idx + 1, cleanName, cleanDosage, 'ISOM', 'Фаза I, острая, разгрузка', 'Ступень 1 (Изометрия)');
      });
    }

    if (phase2Match) {
      phaseCount++;
      const phTitle = `Фаза II: ${(phase2Match[1] || 'Силовая стабилизация').trim()}`;
      phasesSummary.push(phTitle);
      const exItems = phase2Match[2].split(/\d+\)\s*|\d+\.\s*/).map(s => s.trim()).filter(Boolean);
      exItems.forEach((ex, idx) => {
        const cleanName = ex.split(':')[0].replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
        const cleanDosage = ex.includes(':') ? ex.split(':').slice(1).join(':').replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim() : '3 подхода × 12–15 повторений';
        addExercise(2, phTitle, idx + 1, cleanName, cleanDosage, 'CKC', 'Фаза II, стабилизация, HSR', 'Ступень 2 (HSR/Эксцентрика)');
      });
    }

    if (phase3Match) {
      phaseCount++;
      const phTitle = `Фаза III: ${(phase3Match[1] || 'Функциональный возврат').trim()}`;
      phasesSummary.push(phTitle);
      const exItems = phase3Match[2].split(/\d+\)\s*|\d+\.\s*/).map(s => s.trim()).filter(Boolean);
      exItems.forEach((ex, idx) => {
        const cleanName = ex.split(':')[0].replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
        const cleanDosage = ex.includes(':') ? ex.split(':').slice(1).join(':').replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim() : '3 подхода × 10–12 повторений';
        addExercise(3, phTitle, idx + 1, cleanName, cleanDosage, 'CKC', 'Фаза III, проприоцепция, баланс', 'Ступень 3 (Баланс/Спорт)');
      });
    }

    // Fallback if no explicit Phase regex matched (e.g. single comprehensive complex)
    if (phaseCount === 0 && fullPlanText) {
      const phTitle = 'Фаза I: Базовый лечебно-восстановительный комплекс';
      phasesSummary.push(phTitle);
      const items = fullPlanText.split(/\d+\.\s*|\d+\)\s*|<br>/).map(s => s.trim()).filter(Boolean);
      items.slice(0, 4).forEach((it, idx) => {
        const cleanName = it.split(':')[0].replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim();
        const cleanDosage = it.includes(':') ? it.split(':').slice(1).join(':').replace(/\[cite:\s*\d+\]/g, '').replace(/\*\*/g, '').replace(/`/g, '').trim() : '3 подхода × 12 повторений';
        addExercise(1, phTitle, idx + 1, cleanName, cleanDosage, 'CKC', 'Базовый протокол', 'Ступень 1');
      });
    }

    // Add STOP Red Flag Relation if hasStop
    if (hasStop === 1) {
      relInsertStmt.run([
        id, 'lfk_contra_stop_alert', 0, 'КЛИНИЧЕСКИЙ CDSS STOP', 'Ступень 0 (Блокировка)',
        0, 'Клинический биомеханический запрет ЛФК',
        'СТРОГИЙ ЗАПРЕТ НАГРУЗОК В ОПАСНОМ СЕКТОРЕ', '0', 'Постоянно до разрешения врача',
        stopRationale || 'Абсолютный запрет нагрузок на пораженный сегмент.',
        'P0-STOP', 'red', 'ISOM', 'Исключить сгибание/нагрузку', 'CDSS_STOP, Красный флаг',
        1, stopRationale || 'Иммобилизация/покой пораженного сегмента.', 0
      ]);
      totalRelations++;
    }

    // Update master template
    const phasesSummaryStr = phasesSummary.join(' | ') || 'Фаза I (Разгрузка) | Фаза II (Стабилизация)';
    updateTemplateStmt.run([
      priority, hasStop, stopRationale, painZone, targetGoal, phasesSummaryStr, id
    ]);
  }

  relInsertStmt.finalize();
  updateTemplateStmt.finalize();

  console.log('\n--- SYNCHRONIZATION SUMMARY ---');
  console.log(`Total Templates Synced: 180`);
  console.log(`Priority P1 (Core Pathogenetic): ${countP1}`);
  console.log(`Priority P2 (Rehabilitation): ${countP2}`);
  console.log(`Priority P3 (Conditioning/Drainage): ${countP3}`);
  console.log(`Priority P0-STOP (Absolute Block): ${countStop}`);
  console.log(`Total ortho_template_lfk Relations: ${totalRelations}`);
  console.log('--- LFK SYNCHRONIZATION SUCCESSFULLY COMPLETED ---');

  db.close();
}

run().catch(err => {
  console.error('LFK Sync Error:', err);
  process.exit(1);
});
