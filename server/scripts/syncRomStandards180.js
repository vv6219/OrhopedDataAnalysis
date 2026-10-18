/**
 * syncRomStandards180.js
 * Comprehensive Clinical Goniometry (Neutral-0 ROM) Sync for all 180 Orthopedic Templates.
 * Standardizes motion planes, physiological norm references, target values according to stage,
 * SFTR notation strings, and Russian clinical interpretations.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Connecting to database:', dbPath);

function determineClinicalRom(template) {
  const id = template.id;
  const title = (template.title || '').toLowerCase();
  const mkb = (template.default_mkb_code || '').toUpperCase();
  const cluster = (template.cluster_id || '').toLowerCase();
  const stage = (template.stage_or_severity || '').toLowerCase();

  // Helper to detect joint category
  let joint = template.joint_name;
  if (!joint || joint === 'general') {
    if (/колен|тэкс|мениск|пкс|зкс|пателл|осгуд|гоффа|синовит колен|подвывих надколенник|блаунт|синдинг/i.test(title)) joint = 'knee';
    else if (/тазобедр|тбс|кокс|тэтс|пертес|юэгбк|scfe|дисплази|вертлуж|femoroacetabular|fai|синовит тазобедр/i.test(title)) joint = 'hip';
    else if (/плеч|акс|ключиц|ротатор|манжет|латарже|банкарт|субакромиал|плечелопаточ|tsa|rsa/i.test(title)) joint = 'shoulder';
    else if (/стоп|голеностоп|ахилл|пятк|север|келер|фрейберг|hallux|вальгус стоп|плоскостоп|косолапост|подагр|подошвен|плантар|сесамоид|лисфранк/i.test(title)) joint = 'ankle';
    else if (/локт|эпикондил|олекранон|лучев.*кост.*локт|няни|плюри|лукл/i.test(title)) joint = 'elbow';
    else if (/кист|запяст|лучезапяст|дистальн.*радиус|карпал|туннел.*запяст|де кёрвен|vlp|пальц|дюпюитрен|кинбек|нотт|стир|стенера|боксер/i.test(title)) joint = 'wrist';
    else if (/позвоноч|дискэктоми|спондилодез|tlif|plif|шейн|пояснич|дорсопат|сколиоз|бехтерев|анкилозир.*спондилит|кривоше|спинал.*стеноз|кокцигод|титтце|миелопат|конск.*хвост/i.test(title)) joint = 'spine';
    else if (/гипермобильн|элерс/i.test(title)) joint = 'systemic_hypermobile';
    else if (/остеопороз|ревматоид|полиартрит|фибромиалги|онколог|септич/i.test(title)) joint = 'systemic_general';
    else joint = 'knee';
  }

  // --- KNEE JOINT ---
  if (joint === 'knee') {
    // Severe / contracture / postop advanced
    if (/стойкой сгибательн|контрактур|тяжел|iii стади|3 стади/i.test(title)) {
      return {
        joint_category: 'knee',
        flexion_active: 90,
        flexion_passive: 95,
        extension_deficit: 15,
        sftr_notation: 'S: 0-15-90°',
        severity_level: 'severe',
        clinical_interpretation: 'Стойкая сгибательная контрактура: дефицит разгибания 15°, резкое ограничение сгибания до 90° с плотным упором.',
        norm_reference: { flexion: '130°–145°', extension: '0°' }
      };
    }
    if (/тэкс|эндопротезиров/i.test(title)) {
      return {
        joint_category: 'knee',
        flexion_active: 105,
        flexion_passive: 115,
        extension_deficit: 3,
        sftr_notation: 'S: 0-3-105°',
        severity_level: 'moderate',
        clinical_interpretation: 'Послеоперационный диапазон ТЭКС: активное сгибание 105°, минимальный дефицит разгибания 3° на фоне отека тканей.',
        norm_reference: { flexion: '130°–145°', extension: '0°' }
      };
    }
    if (/блокад|ущемлен/i.test(title)) {
      return {
        joint_category: 'knee',
        flexion_active: 105,
        flexion_passive: 110,
        extension_deficit: 10,
        sftr_notation: 'S: 0-10-105°',
        severity_level: 'moderate',
        clinical_interpretation: 'Механический блок сустава: пружинящий дефицит разгибания 10°, сгибание ограничено до 105° из-за интерпозиции мениска.',
        norm_reference: { flexion: '130°–145°', extension: '0°' }
      };
    }
    if (/ii стади|синовит|мениск|разрыв.*крестообразн|пкс|зкс|мкл|lcl|пластик.*пкс/i.test(title)) {
      return {
        joint_category: 'knee',
        flexion_active: 115,
        flexion_passive: 125,
        extension_deficit: 5,
        sftr_notation: 'S: 0-5-115°',
        severity_level: 'moderate',
        clinical_interpretation: 'Умеренное ограничение движений: дефицит разгибания 5°, флексия до 115° из-за реактивного синовита и болевого спазма.',
        norm_reference: { flexion: '130°–145°', extension: '0°' }
      };
    }
    // Mild / Overuse / Tendinopathy / Stage 1
    return {
      joint_category: 'knee',
      flexion_active: 135,
      flexion_passive: 140,
      extension_deficit: 0,
      sftr_notation: 'S: 0-0-135°',
      severity_level: 'mild',
      clinical_interpretation: 'Объем движений физиологический, полное разгибание (0°), легкая ретропателлярная крепитация при максимальном сгибании.',
      norm_reference: { flexion: '130°–145°', extension: '0°' }
    };
  }

  // --- SHOULDER JOINT ---
  if (joint === 'shoulder') {
    if (/адгезивн.*капсулит|замороженн.*плеч/i.test(title)) {
      return {
        joint_category: 'shoulder',
        abduction: 75,
        flexion_active: 85,
        external_rotation: 15,
        internal_rotation: 25,
        extension_deficit: 20,
        sftr_notation: 'S: 20-0-85°, F: 75-0-0°, R: 15-0-25°',
        severity_level: 'severe',
        clinical_interpretation: 'Классический капсулярный паттерн: резкое сочетанное ограничение пассивной наружной ротации (15°), отведения (75°) и элевации.',
        norm_reference: { abduction: '160°–180°', flexion: '160°–180°', ext_rot: '60°–90°', int_rot: '60°–80°' }
      };
    }
    if (/массивн.*разрыв.*манжет|псевдопаралич/i.test(title)) {
      return {
        joint_category: 'shoulder',
        abduction: 80,
        flexion_active: 90,
        external_rotation: 30,
        internal_rotation: 50,
        extension_deficit: 10,
        sftr_notation: 'S: 30-0-90°, F: 80-0-0°, R: 30-0-50°',
        severity_level: 'severe',
        clinical_interpretation: 'Псевдопаралич отведения: невозможность активного удержания руки выше горизонтали, пассивный объем превышает активный.',
        norm_reference: { abduction: '160°–180°', flexion: '160°–180°', ext_rot: '60°–90°', int_rot: '60°–80°' }
      };
    }
    if (/омартроз|артроз плечелопаточ|tsa|rsa|эндопротезиров.*плеч/i.test(title)) {
      return {
        joint_category: 'shoulder',
        abduction: 110,
        flexion_active: 120,
        external_rotation: 35,
        internal_rotation: 45,
        extension_deficit: 10,
        sftr_notation: 'S: 30-0-120°, F: 110-0-0°, R: 35-0-45°',
        severity_level: 'moderate',
        clinical_interpretation: 'Концентрическое ограничение амплитуды омартроза: отведение 110°, наружная ротация 35° с костной крепитацией.',
        norm_reference: { abduction: '160°–180°', flexion: '160°–180°', ext_rot: '60°–90°', int_rot: '60°–80°' }
      };
    }
    if (/шов.*манжет|латарже|банкарт/i.test(title)) {
      return {
        joint_category: 'shoulder',
        abduction: 120,
        flexion_active: 130,
        external_rotation: 40,
        internal_rotation: 55,
        extension_deficit: 10,
        sftr_notation: 'S: 30-0-130°, F: 120-0-0°, R: 40-0-55°',
        severity_level: 'moderate',
        clinical_interpretation: 'Реабилитационный объем после стабилизации плеча: контролируемое щажение наружной ротации (до 40°) для защиты шва.',
        norm_reference: { abduction: '160°–180°', flexion: '160°–180°', ext_rot: '60°–90°', int_rot: '60°–80°' }
      };
    }
    if (/импинджмент|надостн|подостн|бицепс|дгб|кальцифиц/i.test(title)) {
      return {
        joint_category: 'shoulder',
        abduction: 150,
        flexion_active: 160,
        external_rotation: 65,
        internal_rotation: 65,
        extension_deficit: 0,
        sftr_notation: 'S: 40-0-160°, F: 150-0-0°, R: 65-0-65°',
        severity_level: 'mild',
        clinical_interpretation: 'Болезненная дуга Дауборна (painful arc) в интервале 70°–120°, крайние углы пассивно сохранены в полном объеме.',
        norm_reference: { abduction: '160°–180°', flexion: '160°–180°', ext_rot: '60°–90°', int_rot: '60°–80°' }
      };
    }
    // General shoulder standard
    return {
      joint_category: 'shoulder',
      abduction: 165,
      flexion_active: 170,
      external_rotation: 75,
      internal_rotation: 75,
      extension_deficit: 0,
      sftr_notation: 'S: 40-0-170°, F: 165-0-0°, R: 75-0-75°',
      severity_level: 'normal',
      clinical_interpretation: 'Объем движений плечевого сустава сохранен в функциональных границах нормы, лопаточно-плечевой ритм правильный.',
      norm_reference: { abduction: '160°–180°', flexion: '160°–180°', ext_rot: '60°–90°', int_rot: '60°–80°' }
    };
  }

  // --- HIP / PELVIS ---
  if (joint === 'hip') {
    if (/iii ст|3 ст|деформирующ.*коксартроз.*iii/i.test(title)) {
      return {
        joint_category: 'hip',
        flexion_active: 70,
        abduction: 15,
        internal_rotation: 5,
        external_rotation: 15,
        extension_deficit: 15,
        sftr_notation: 'S: 0-15-70°, F: 15-0-10°, R: 15-0-5°',
        severity_level: 'severe',
        clinical_interpretation: 'Тяжелая сгибательно-приводящая контрактура ТБС: флексия 70°, дефицит разгибания 15°, внутренняя ротация практически блокирована (5°).',
        norm_reference: { flexion: '115°–125°', abduction: '40°–45°', int_rot: '30°–35°', ext_rot: '40°–45°' }
      };
    }
    if (/тэтс|эндопротезиров.*тазобедр/i.test(title)) {
      return {
        joint_category: 'hip',
        flexion_active: 95,
        abduction: 30,
        internal_rotation: 15,
        external_rotation: 25,
        extension_deficit: 0,
        sftr_notation: 'S: 10-0-95°, F: 30-0-15°, R: 25-0-15°',
        severity_level: 'moderate',
        clinical_interpretation: 'Амбулаторный контроль ТЭТС: сгибание до 95° без форсирования, соблюдение ортопедического режима антивывиха.',
        norm_reference: { flexion: '115°–125°', abduction: '40°–45°', int_rot: '30°–35°', ext_rot: '40°–45°' }
      };
    }
    if (/коксартроз.*ii|2 стади|ансор|анко|ангбк|пертес|scfe|юэгбк|fai|импинджмент/i.test(title)) {
      return {
        joint_category: 'hip',
        flexion_active: 95,
        abduction: 25,
        internal_rotation: 10,
        external_rotation: 30,
        extension_deficit: 5,
        sftr_notation: 'S: 5-0-95°, F: 25-0-15°, R: 30-0-10°',
        severity_level: 'moderate',
        clinical_interpretation: 'Патогномоничный дефицит внутренней ротации (10°) и отведения (25°), симптом FADIR (+), сгибание до 95° с болезненностью.',
        norm_reference: { flexion: '115°–125°', abduction: '40°–45°', int_rot: '30°–35°', ext_rot: '40°–45°' }
      };
    }
    // Trochanteric, Tendinopathy, Piriformis, Stage 1
    return {
      joint_category: 'hip',
      flexion_active: 115,
      abduction: 40,
      internal_rotation: 30,
      external_rotation: 40,
      extension_deficit: 0,
      sftr_notation: 'S: 15-0-115°, F: 40-0-20°, R: 40-0-30°',
      severity_level: 'mild',
      clinical_interpretation: 'Объем движений в тазобедренном суставе сохранен, локальная болезненность при резистивном отведении/пальпации вертела.',
      norm_reference: { flexion: '115°–125°', abduction: '40°–45°', int_rot: '30°–35°', ext_rot: '40°–45°' }
    };
  }

  // --- ANKLE & FOOT ---
  if (joint === 'ankle' || joint === 'foot') {
    if (/артроз.*голеностоп|контрактур.*голеностоп|пилон|пяточн.*перелом|артродез/i.test(title)) {
      return {
        joint_category: 'ankle',
        dorsal_flexion: 5,
        plantar_flexion: 20,
        supination: 10,
        pronation: 8,
        sftr_notation: 'S: 5-0-20°, R: 10-0-8°',
        severity_level: 'severe',
        clinical_interpretation: 'Выраженная посттравматическая ригидность: дефицит тыльного сгибания (5°), резкое ограничение подтаранной подвижности.',
        norm_reference: { dorsal_flexion: '20°–25°', plantar_flexion: '45°–50°', supination: '30°–35°', pronation: '15°–20°' }
      };
    }
    if (/hallux|первого пальц|плюснефалангов|подагр|келер ii|сесамоид/i.test(title)) {
      return {
        joint_category: 'foot_mtp',
        dorsal_flexion: 15,
        plantar_flexion: 40,
        mtp1_dorsiflexion: 25,
        mtp1_plantarflexion: 15,
        sftr_notation: 'MTP-1: 25-0-15°, Голеностоп: 15-0-40°',
        severity_level: 'moderate',
        clinical_interpretation: 'Ригидность I плюснефалангового сустава: дефицит разгибания I пальца (до 25°), осевая перегрузка латеральных лучей.',
        norm_reference: { mtp1_ext: '65°–70°', mtp1_flex: '35°–45°', dorsal_flexion: '20°–25°' }
      };
    }
    if (/ахилл|шов.*ахилл|разрыв.*ахилл/i.test(title)) {
      return {
        joint_category: 'ankle',
        dorsal_flexion: 10,
        plantar_flexion: 30,
        supination: 20,
        pronation: 12,
        sftr_notation: 'S: 10-0-30°, R: 20-0-12°',
        severity_level: 'moderate',
        clinical_interpretation: 'Контролируемое ограничение тыльной флексии (до 10°) для защиты сухожильного регенерата, тест Томпсона отрицательный.',
        norm_reference: { dorsal_flexion: '20°–25°', plantar_flexion: '45°–50°', supination: '30°–35°', pronation: '15°–20°' }
      };
    }
    if (/фасциит|шпора|север|келер|туннел.*предплюсн|мортон|стресс-перелом/i.test(title)) {
      return {
        joint_category: 'ankle',
        dorsal_flexion: 15,
        plantar_flexion: 45,
        supination: 30,
        pronation: 15,
        sftr_notation: 'S: 15-0-45°, R: 30-0-15°',
        severity_level: 'mild',
        clinical_interpretation: 'Натяжение подошвенного апоневроза при пассивной дорсифлексии пальцев (Windlass test +), объем сустава функционален.',
        norm_reference: { dorsal_flexion: '20°–25°', plantar_flexion: '45°–50°', supination: '30°–35°', pronation: '15°–20°' }
      };
    }
    // Standard ankle
    return {
      joint_category: 'ankle',
      dorsal_flexion: 20,
      plantar_flexion: 45,
      supination: 30,
      pronation: 15,
      sftr_notation: 'S: 20-0-45°, R: 30-0-15°',
      severity_level: 'normal',
      clinical_interpretation: 'Объем движений голеностопного и подтаранного суставов в пределах анатомической нормы.',
      norm_reference: { dorsal_flexion: '20°–25°', plantar_flexion: '45°–50°', supination: '30°–35°', pronation: '15°–20°' }
    };
  }

  // --- ELBOW JOINT ---
  if (joint === 'elbow') {
    if (/посттравматическ.*артроз|контрактур.*локт|свободн.*тела|хондроматоз/i.test(title)) {
      return {
        joint_category: 'elbow',
        flexion_active: 105,
        extension_deficit: 15,
        supination: 65,
        pronation: 70,
        sftr_notation: 'S: 0-15-105°, R: 65-0-70°',
        severity_level: 'severe',
        clinical_interpretation: 'Стойкая посттравматическая контрактура локтевого сустава (рабочий сектор 15°–105°), дефицит ротации предплечья.',
        norm_reference: { flexion: '140°–145°', extension: '0°', supination: '85°–90°', pronation: '85°–90°' }
      };
    }
    if (/бурсит.*локтев|кубитал.*канал|нестабильност|ucl|лукл|перелом.*головк/i.test(title)) {
      return {
        joint_category: 'elbow',
        flexion_active: 125,
        extension_deficit: 5,
        supination: 80,
        pronation: 80,
        sftr_notation: 'S: 0-5-125°, R: 80-0-80°',
        severity_level: 'moderate',
        clinical_interpretation: 'Умеренное ограничение крайнего сгибания (125°) из-за натяжения бурсы/невральной компрессии, минимальный дефицит разгибания 5°.',
        norm_reference: { flexion: '140°–145°', extension: '0°', supination: '85°–90°', pronation: '85°–90°' }
      };
    }
    // Epicondylitis, Pronator syndrome, Overuse
    return {
      joint_category: 'elbow',
      flexion_active: 140,
      extension_deficit: 0,
      supination: 85,
      pronation: 85,
      sftr_notation: 'S: 0-0-140°, R: 85-0-85°',
      severity_level: 'mild',
      clinical_interpretation: 'Пассивный объем движений полный (0°-140°), выраженная локальная боль при резистивном разгибании/сгибании кисти.',
      norm_reference: { flexion: '140°–145°', extension: '0°', supination: '85°–90°', pronation: '85°–90°' }
    };
  }

  // --- WRIST & HAND ---
  if (joint === 'wrist') {
    if (/перелом.*дистальн.*радиус|vlp|дюпюитрен|кинбек|ризартроз.*iii/i.test(title)) {
      return {
        joint_category: 'wrist',
        palmar_flexion: 45,
        dorsal_flexion: 45,
        radial_deviation: 15,
        ulnar_deviation: 20,
        sftr_notation: 'S: 45-0-45°, F: 15-0-20°',
        severity_level: 'severe',
        clinical_interpretation: 'Посттравматическое/контрактурное ограничение: амплитуда сгибания-разгибания снижена до 45°/45°, дефицит ульнарной девиации.',
        norm_reference: { palmar: '70°–80°', dorsal: '65°–75°', radial: '20°–25°', ulnar: '30°–35°' }
      };
    }
    if (/карпал|туннел|де кёрвен|tfcc|диссоциаци|щелкающ.*палец|нотт/i.test(title)) {
      return {
        joint_category: 'wrist',
        palmar_flexion: 65,
        dorsal_flexion: 60,
        radial_deviation: 20,
        ulnar_deviation: 25,
        sftr_notation: 'S: 60-0-65°, F: 20-0-25°',
        severity_level: 'moderate',
        clinical_interpretation: 'Болезненность и парестезии при гиперфлексии (тест Фалена +) или ульнарной девиации (тест Финкельштейна +), легкое ограничение.',
        norm_reference: { palmar: '70°–80°', dorsal: '65°–75°', radial: '20°–25°', ulnar: '30°–35°' }
      };
    }
    // Normal / Mild wrist
    return {
      joint_category: 'wrist',
      palmar_flexion: 75,
      dorsal_flexion: 70,
      radial_deviation: 20,
      ulnar_deviation: 30,
      sftr_notation: 'S: 70-0-75°, F: 20-0-30°',
      severity_level: 'normal',
      clinical_interpretation: 'Объем движений лучезапястного сустава и кисти полностью соответствует анатомической норме.',
      norm_reference: { palmar: '70°–80°', dorsal: '65°–75°', radial: '20°–25°', ulnar: '30°–35°' }
    };
  }

  // --- SPINE ---
  if (joint === 'spine') {
    if (/бехтерев|анкилозир/i.test(title)) {
      return {
        joint_category: 'spine',
        lumbar_flexion: 30,
        lumbar_extension: 5,
        lateral_flexion_left: 10,
        lateral_flexion_right: 10,
        schober_cm: 1.5,
        cervical_flexion: 20,
        cervical_rotation: 30,
        sftr_notation: 'Шобер: +1.5 см, Отт: +1.0 см, Торакальная экскуpсия: 1.8 см',
        severity_level: 'severe',
        clinical_interpretation: 'Стойкая генерализованная ригидность позвоночника: проба Шобера 1.5 см (норма > 5 см), ограничение дыхательной экскурсии.',
        norm_reference: { schober: '≥ 5.0 см', lumbar_flex: '80°–90°', cervical_rot: '70°–80°' }
      };
    }
    if (/радикулопати|дискэктоми|спондилодез|tlif|стеноз|листез|люмбоишиалги/i.test(title)) {
      return {
        joint_category: 'spine',
        lumbar_flexion: 40,
        lumbar_extension: 10,
        lateral_flexion_left: 15,
        lateral_flexion_right: 15,
        schober_cm: 2.5,
        sftr_notation: 'S: 10-0-40°, Шобер: +2.5 см, расстояние пальцы-пол: 35 см',
        severity_level: 'moderate',
        clinical_interpretation: 'Выраженное вертеброгенное ограничение сгибания (расстояние пальцы-пол 35 см, Шобер 2.5 см), дефанс паравертебральных мышц.',
        norm_reference: { schober: '≥ 5.0 см', fingers_to_floor: '0–5 см' }
      };
    }
    if (/цервикалги|цервикобрахиалги|миелопат|кривоше/i.test(title)) {
      return {
        joint_category: 'spine',
        cervical_flexion: 30,
        cervical_rotation: 45,
        lateral_flexion_left: 25,
        lateral_flexion_right: 25,
        sftr_notation: 'Шейный отдел: сгиб. 30°, ротация 45°/45°, бок. наклон 25°',
        severity_level: 'moderate',
        clinical_interpretation: 'Ограничение движений шейного отдела позвоночника из-за мышечно-тонического синдрома, положительный симптом Сперлинга.',
        norm_reference: { cervical_flex: '45°', cervical_rot: '70°–80°', lateral_tilt: '40°–45°' }
      };
    }
    // Thoracal / Coccygodynia / Lumbago mild
    return {
      joint_category: 'spine',
      lumbar_flexion: 70,
      lumbar_extension: 20,
      lateral_flexion_left: 25,
      lateral_flexion_right: 25,
      schober_cm: 4.5,
      sftr_notation: 'S: 20-0-70°, Шобер: +4.5 см, пальцы-пол: 5 см',
      severity_level: 'mild',
      clinical_interpretation: 'Умеренное ограничение крайних углов разгибания и ротации, функциональная подвижность поясничного отдела сохранена.',
      norm_reference: { schober: '≥ 5.0 см', fingers_to_floor: '0–5 см' }
    };
  }

  // --- SYSTEMIC / HYPERMOBILE ---
  if (joint === 'systemic_hypermobile') {
    return {
      joint_category: 'systemic_hypermobile',
      beighton_score: 7,
      knee_hyperextension: 15,
      elbow_hyperextension: 15,
      thumb_apposition: true,
      pinky_hyperextension_90: true,
      palms_to_floor: true,
      sftr_notation: 'Beighton: 7/9 баллов (генерализованная гипермобильность)',
      severity_level: 'hypermobile',
      clinical_interpretation: 'Генерализованная гипермобильность суставов по Бейтону 7/9: двустороннее переразгибание коленей и локтей > 10°, касание пола ладонями.',
      norm_reference: { beighton: '0–3 балла (норма)' }
    };
  }

  // --- SYSTEMIC GENERAL ---
  return {
    joint_category: 'systemic_general',
    flexion_active: 130,
    flexion_passive: 135,
    extension_deficit: 0,
    sftr_notation: 'Функциональный скрининг: без грубых суставных контрактур',
    severity_level: 'mild',
    clinical_interpretation: 'Амплитуда движений опорных суставов сохранена, признаков механической суставной блокады не выявлено.',
    norm_reference: { screening: 'Физиологический объем' }
  };
}

db.all("SELECT id, title, joint_name, cluster_id, default_mkb_code, stage_or_severity, template_json FROM ortho_templates ORDER BY id", [], (err, rows) => {
  if (err) {
    console.error('Error fetching templates:', err);
    process.exit(1);
  }

  console.log(`Processing clinical Neutral-0 ROM for ${rows.length} templates...`);

  let updatedCount = 0;
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE ortho_templates SET rom_norm_preset = ?, template_json = ? WHERE id = ?");

    rows.forEach(row => {
      const romData = determineClinicalRom(row);
      const romJsonStr = JSON.stringify(romData);

      let parsedTplJson = {};
      try {
        parsedTplJson = typeof row.template_json === 'string' ? JSON.parse(row.template_json) : (row.template_json || {});
      } catch {
        parsedTplJson = {};
      }
      parsedTplJson.rom = romData;
      const tplJsonStr = JSON.stringify(parsedTplJson);

      stmt.run(romJsonStr, tplJsonStr, row.id, function (uErr) {
        if (uErr) {
          console.error(`Error updating template #${row.id}:`, uErr.message);
        } else {
          updatedCount++;
        }
      });
    });

    stmt.finalize();
    db.run("COMMIT", (cErr) => {
      if (cErr) {
        console.error('Commit failed:', cErr);
      } else {
        console.log(`Successfully updated clinical Neutral-0 ROM data for all ${updatedCount} templates!`);
      }
      db.close();
      process.exit(0);
    });
  });
});
