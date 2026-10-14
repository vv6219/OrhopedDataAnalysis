const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../DB/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

/**
 * 100 Structured Master Templates across 10 Clusters
 * Each template includes:
 * - title, joint_name, default_mkb_code, category, cluster_id, cluster_name, stage_or_severity, default_side
 * - complaints_template, anamnesis_template, objective_template, recommendations_template
 * - rom_norm_preset (JSON)
 * - tests: array of { test_code, expected_result, is_mandatory, sort_order }
 * - diagnostics: array of { diagnostic_code, urgency, default_side, is_primary, sort_order }
 * - prescriptions: array of standard services from servdict
 */

const TEMPLATES_100 = [
  // =========================================================================
  // КЛАСТЕР 1: КОЛЕННЫЙ СУСТАВ (15 шаблонов)
  // =========================================================================
  {
    existing_id: 1,
    title: 'Первичный гонартроз I–II стадии без синовита',
    joint_name: 'knee',
    default_mkb_code: 'M17.1',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'I–II стадия без выпота',
    default_side: 'right',
    complaints_template: 'Ноющие боли в коленном суставе при физической нагрузке (ходьба более 1–2 км, подъем по лестнице), стартовая скованность по утрам до 15 минут. В покое и ночью боли не беспокоят.',
    anamnesis_template: 'Считает себя больным около 1–2 лет, когда впервые отметил дискомфорт при спуске по лестнице. За медицинской помощью ранее не обращался. Травмы отрицает.',
    objective_template: 'Походка ритмичная. Контуры коленного сустава сохранны, признаков выпота и отека нет. При пальпации умеренная болезненность по проекции медиальной суставной щели. Пателлофеморальный хруст и крепитация при сгибании. Связочный аппарат стабилен.',
    recommendations_template: '1. Ограничение ударных осевых нагрузок (бег, прыжки).\n2. ЛФК для четырехглавой мышцы бедра в изометрическом режиме.\n3. Курс хондропротекторов и гиалуроновой кислоты.\n4. Ношение эластичного наколенника при длительной ходьбе.',
    rom_norm_preset: { flexion_active: 135, flexion_passive: 140, extension_deficit: 0 },
    tests: [
      { test_code: 'patella_grind', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'lachman', expected_result: 'negative', is_mandatory: 1, sort_order: 20 },
      { test_code: 'mcmurray', expected_result: 'negative', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_knee', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 5,
    title: 'Первичный гонартроз II стадии с реактивным синовитом',
    joint_name: 'knee',
    default_mkb_code: 'M17.1',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'II стадия с синовитом',
    default_side: 'right',
    complaints_template: 'Боль распирающего характера в правом коленном суставе при ходьбе и в покое, усиливается при спуске по лестнице. Ощущение отечности, скованности, ограничение сгибания в суставе.',
    anamnesis_template: 'Боли беспокоят около 3 лет с периодическими обострениями. Настоящее ухудшение связывает с повышенной нагрузкой 5 дней назад, когда появился выраженный отек сустава.',
    objective_template: 'Правый коленный сустав увеличен в объеме, сглажены парапателлярные борозды. Положительный симптом баллотирования надколенника. Локальная гипертермия умеренная. Болезненность по медиальной щели. Сгибание ограничено до 110° из-за выпота.',
    recommendations_template: '1. Охранительный двигательный режим, фиксация сустава ортезом.\n2. Пункция правого коленного сустава с эвакуацией выпота и введением ГКС.\n3. НПВП местно и системно коротким курсом.\n4. Контроль после купирования синовита для решения вопроса о курсе PRP.',
    rom_norm_preset: { flexion_active: 110, flexion_passive: 120, extension_deficit: 5 },
    tests: [
      { test_code: 'patella_ballottement', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'patella_grind', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'lachman', expected_result: 'negative', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_knee', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'lab_synovial', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 30 }
    ]
  },
  {
    title: 'Посттравматический гонартроз со стойкой сгибательной контрактурой',
    joint_name: 'knee',
    default_mkb_code: 'M17.3',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Посттравматический, дефицит разгибания',
    default_side: 'right',
    complaints_template: 'Постоянная боль в колене при опоре на ногу, хромота, невозможность полностью разогнуть ногу в коленном суставе.',
    anamnesis_template: 'В анамнезе внутрисуставной перелом мыщелков большеберцовой кости 5 лет назад, остеосинтез. Металлофиксаторы удалены 2 года назад. Деформация и боли прогрессируют.',
    objective_template: 'Хромота на правую ногу. Ось конечности деформирована (варус 7°). Сгибательная контрактура: дефицит разгибания 15°, сгибание до 100°. Крепитация во всех отделах сустава. Мышечная атрофия бедра (дефицит 3 см).',
    recommendations_template: '1. Телерентгенография нижних конечностей с расчетом механической оси.\n2. Разгрузка тростью при ходьбе, индивидуальное ортезирование.\n3. Консультация хирурга-ортопеда для решения вопроса о корригирующей остеотомии или эндопротезировании.',
    rom_norm_preset: { flexion_active: 100, flexion_passive: 105, extension_deficit: 15 },
    tests: [
      { test_code: 'patella_grind', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'lachman', expected_result: 'negative', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_long_leg_axis', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    existing_id: 12,
    title: 'Пателлофеморальный артроз и латеральная гиперпрессия надколенника',
    joint_name: 'knee',
    default_mkb_code: 'M22.2',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Латеральная гиперпрессия',
    default_side: 'right',
    complaints_template: 'Боль под надколенником при спуске по лестнице, длительном сидении с согнутыми коленями (симптом кинотеатра). Хруст и щелчки при разгибании ноги.',
    anamnesis_template: 'Боли беспокоят более года, постепенно усиливаются после физических упражнений (приседания, бег).',
    objective_template: 'Умеренный латеральный наклон надколенника. Резкая болезненность при пальпации латеральной фасетки и смещении надколенника кнаружи. Тест трения надколенника (Кларка) резко положителен.',
    recommendations_template: '1. Тейпирование надколенника с медиализацией по Макконнеллу.\n2. Укрепление косой порции медиальной широкой мышцы бедра (VMO).\n3. Исключение глубоких приседаний и бега по пересеченной местности.\n4. Хондропротекторы и внутрисуставной курс биополимеров.',
    rom_norm_preset: { flexion_active: 130, flexion_passive: 135, extension_deficit: 0 },
    tests: [
      { test_code: 'patella_grind', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'patella_apprehension', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'mcconnell', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_patella_axial', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_knee_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 17,
    title: 'Разрыв заднего рога медиального мениска (Stoller IIIb)',
    joint_name: 'knee',
    default_mkb_code: 'M23.2',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Stoller IIIb',
    default_side: 'right',
    complaints_template: 'Острая боль по внутренней поверхности сустава при сгибании и ротации, периодическое ощущение заклинивания или щелчка в глубине сустава.',
    anamnesis_template: 'Связывает с неловким поворотом на согнутом колене 2 недели назад, почувствовал щелчок и острую боль.',
    objective_template: 'Отека сустава нет. Резкая локальная болезненность при пальпации заднего отрезка медиальной суставной щели. Тесты Мак-Мюррея и Тессали положительны с медиальной стороны.',
    recommendations_template: '1. Ограничение глубоких сгибаний и осевой ротации.\n2. МРТ коленного сустава 1.5 Тл для подтверждения отрыва.\n3. Консультация артроскопического хирурга.',
    rom_norm_preset: { flexion_active: 125, flexion_passive: 130, extension_deficit: 0 },
    tests: [
      { test_code: 'mcmurray', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'appley', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'thessaly_20', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_knee_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Дегенеративный разрыв латерального мениска со блокадами',
    joint_name: 'knee',
    default_mkb_code: 'M23.3',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Горизонтальный разрыв со блокадами',
    default_side: 'right',
    complaints_template: 'Периодические блокады коленного сустава при ходьбе, резкая боль по наружному краю сустава, неустойчивость.',
    anamnesis_template: 'Боли беспокоят около полугода, эпизоды блокад участились за последний месяц.',
    objective_template: 'Умеренная болезненность по латеральной суставной щели. Латеральный тест Мак-Мюррея положителен с воспроизведением щелчка. Разгибание временно ограничено на 10° из-за ущемления фрагмента.',
    recommendations_template: '1. Устранение блокады сустава тракцией и ротацией голени.\n2. МРТ коленного сустава.\n3. Плановая артроскопическая парциальная резекция мениска.',
    rom_norm_preset: { flexion_active: 120, flexion_passive: 125, extension_deficit: 10 },
    tests: [
      { test_code: 'mcmurray', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'thessaly_20', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_knee_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    existing_id: 30,
    title: 'Полный разрыв передней крестообразной связки (ПКС)',
    joint_name: 'knee',
    default_mkb_code: 'S83.5',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Острый / подострый период',
    default_side: 'right',
    complaints_template: 'Чувство «выскальзывания» и нестабильности голени вперед при ходьбе и смене направления движения, неуверенность в колене.',
    anamnesis_template: 'Спортивная травма 3 недели назад: хруст в колене при торможении и развороте, гемартроз.',
    objective_template: 'Отек умеренный. Резко положительный тест Лахмана с мягкой конечной точкой (смещение > 6 мм). Передний выдвижной ящик положителен. Тест Pivot-Shift положителен.',
    recommendations_template: '1. Ношение жесткого функционального шарнирного брейса.\n2. МРТ коленного сустава.\n3. Направление на пластику ПКС аутотрансплантатом.',
    rom_norm_preset: { flexion_active: 120, flexion_passive: 130, extension_deficit: 0 },
    tests: [
      { test_code: 'lachman', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'anterior_drawer', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'pivot_shift', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_knee_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Разрыв задней крестообразной связки (ЗКС) и повреждение PLC',
    joint_name: 'knee',
    default_mkb_code: 'S83.5',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Свежий разрыв ЗКС',
    default_side: 'right',
    complaints_template: 'Боль в подколенной ямке, ощущение провисания и нестабильности голени кзади при спуске по наклонной поверхности.',
    anamnesis_template: 'Прямой удар по бугристости большеберцовой кости при согнутом колене (удар о приборную панель автомобиля в ДТП).',
    objective_template: 'Западение бугристости голени кзади в покое под углом 90° (симптом Годфри). Задний выдвижной ящик резко положителен со смещением > 8 мм. Дайл-тест под 30° и 90° выявляет асимметрию наружной ротации 15°.',
    recommendations_template: '1. Иммобилизация в задней гипсовой лонгете или жестком ортезе с упором под голень.\n2. МРТ коленного сустава 1.5–3 Тл.\n3. Решение вопроса об артроскопической реконструкции ЗКС.',
    rom_norm_preset: { flexion_active: 100, flexion_passive: 110, extension_deficit: 5 },
    tests: [
      { test_code: 'posterior_drawer', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'godfrey_sag', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'dial_test_30_90', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_knee_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Растяжение и разрыв медиальной коллатеральной связки (MCL)',
    joint_name: 'knee',
    default_mkb_code: 'S83.4',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'MCL II степень',
    default_side: 'right',
    complaints_template: 'Боль по внутренней поверхности колена при ходьбе и попытке опереться на ногу, отек по медиальному краю.',
    anamnesis_template: 'Травма на лыжах или в футболе с приложением вальгусной силы снаружи внутрь.',
    objective_template: 'Локальная болезненность и отек по проекции медиальной коллатеральной связки от бедренного мыщелка до тибиального прикрепления. Вальгус-стресс тест при 30° сгибания положителен (раскрытие щели 5 мм с болевым синдромом). При 0° щель стабильна.',
    recommendations_template: '1. Иммобилизация разъемным брейсом с боковыми ребрами жесткости на 4 недели.\n2. Ходьба с костылями без осевой нагрузки на медиальный отдел.\n3. УЗИ связочного аппарата колена для оценки целостности волокон.',
    rom_norm_preset: { flexion_active: 110, flexion_passive: 120, extension_deficit: 0 },
    tests: [
      { test_code: 'lachman', expected_result: 'negative', is_mandatory: 1, sort_order: 10 },
      { test_code: 'mcmurray', expected_result: 'negative', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_knee', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Повреждение латерального связочного комплекса колена (LCL / PLC)',
    joint_name: 'knee',
    default_mkb_code: 'S83.4',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Повреждение LCL',
    default_side: 'right',
    complaints_template: 'Боль по наружной поверхности колена, ощущение неустойчивости при ходьбе.',
    anamnesis_template: 'Варусная травма колена с переразгибанием.',
    objective_template: 'Болезненность в области головки малоберцовой кости. Варус-стресс тест под 30° положителен.',
    recommendations_template: '1. Ортезирование жестким брейсом.\n2. МРТ колена.\n3. Оценка функции малоберцового нерва.',
    rom_norm_preset: { flexion_active: 115, flexion_passive: 125, extension_deficit: 0 },
    tests: [
      { test_code: 'dial_test_30_90', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_knee_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Киста подколенной ямки (киста Бейкера) с псевдотромбофлебитом',
    joint_name: 'knee',
    default_mkb_code: 'M71.2',
    category: 'Бурситы и синовиты',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Увеличенная киста Бейкера',
    default_side: 'right',
    complaints_template: 'Чувство распирания и натяжения в подколенной ямке при разгибании ноги, отек верхней трети голени.',
    anamnesis_template: 'Длительный анамнез артроза, киста увеличилась после физической нагрузки.',
    objective_template: 'В медиальной части подколенной ямки пальпируется эластичное округлое образование 5х3 см, напряженное при разгибании колена (симптом Фоше). Отека стопы нет, пульс на артериях стопы сохранен.',
    recommendations_template: '1. УЗИ подколенной ямки и дуплексное сканирование вен (исключение тромбоза).\n2. Пункция кисты под УЗИ-навигацией с аспирацией гелеобразного содержимого.\n3. Лечение основного внутрисуставного заболевания (гонартроз, разрыв мениска).',
    rom_norm_preset: { flexion_active: 120, flexion_passive: 125, extension_deficit: 5 },
    tests: [
      { test_code: 'patella_ballottement', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_knee', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_dvt_veins', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Тендинопатия собственной связки надколенника («колено прыгуна»)',
    joint_name: 'knee',
    default_mkb_code: 'M76.5',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Хронический тендинит',
    default_side: 'right',
    complaints_template: 'Боль под надколенником при прыжках, беге, спуске по лестнице, разгибании колена против сопротивления.',
    anamnesis_template: 'Занимается волейболом/баскетболом, боли нарастали в течение 3 месяцев.',
    objective_template: 'Точечная резкая болезненность при пальпации нижнего полюса надколенника (проксимальный энтезис связки). Тест разгибания голени с сопротивлением воспроизводит локальную боль.',
    recommendations_template: '1. Исключение прыжковых нагрузок на 4–6 недель.\n2. Эксцентрические тренировки четырехглавой мышцы на наклонной платформе (decline squat).\n3. Ударно-волновая терапия (УВТ) №5.\n4. Ношение поднадколенникового ремешка-бандажа.',
    rom_norm_preset: { flexion_active: 135, flexion_passive: 140, extension_deficit: 0 },
    tests: [
      { test_code: 'patella_grind', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_knee', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_knee_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Синдром трения илиотибиального тракта (ITB friction syndrome)',
    joint_name: 'knee',
    default_mkb_code: 'M76.3',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Подострый тендинит тракта',
    default_side: 'right',
    complaints_template: 'Жгучая боль по наружной поверхности колена, возникающая строго после 2–3 км бега или длительной езды на велосипеде.',
    anamnesis_template: 'Бегун на длинные дистанции, боли появились после увеличения недельного объема тренировок.',
    objective_template: 'Резкая локальная боль при пальпации латерального мыщелка бедра. Тест компрессии Нобеля и тест Обера положительны.',
    recommendations_template: '1. Временное прекращение беговых тренировок, замена плаванием.\n2. Миофасциальный релиз напрягателя широкой фасции бедра фоам-роллером.\n3. Подбор индивидуальных ортопедических стелек для коррекции гиперпронации стопы.',
    rom_norm_preset: { flexion_active: 135, flexion_passive: 140, extension_deficit: 0 },
    tests: [
      { test_code: 'noble_itb', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'ober', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_knee', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_knee_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Препателлярный бурсит («колено паркетчика»)',
    joint_name: 'knee',
    default_mkb_code: 'M70.4',
    category: 'Бурситы и синовиты',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Асептический серозный бурсит',
    default_side: 'right',
    complaints_template: 'Отек и шарообразная припухлость кпереди от коленной чашечки, боль при опоре на колено.',
    anamnesis_template: 'Длительная работа на коленях при укладке напольных покрытий или садовых работах.',
    objective_template: 'По передней поверхности надколенника определяется округлое флюктуирующее образование размером 6х5 см. Кожа умеренно гиперемирована, местная температура не повышена. Суставная щель безболезненна.',
    recommendations_template: '1. Пункция препателлярной сумки с эвакуацией экссудата и давящей эластической повязкой.\n2. Исключение опоры на коленный сустав.\n3. Ношение защитных наколенников с гелевыми вставками.',
    rom_norm_preset: { flexion_active: 125, flexion_passive: 130, extension_deficit: 0 },
    tests: [
      { test_code: 'patella_ballottement', expected_result: 'negative', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_knee', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Состояние после тотального эндопротезирования коленного сустава',
    joint_name: 'knee',
    default_mkb_code: 'Z96.6',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_knee',
    cluster_name: 'Коленный сустав: артрозы, связки и мениски',
    stage_or_severity: 'Амбулаторный постоперационный контроль',
    default_side: 'right',
    complaints_template: 'Плановый осмотр через 3 месяца после тотального эндопротезирования коленного сустава. Умеренная утомляемость при ходьбе.',
    anamnesis_template: 'Операция ТЭКС 3 месяца назад. Прошел курс стационарной реабилитации.',
    objective_template: 'Послеоперационный рубец окрепший, без признаков воспаления. Ось конечности правильная (механическая ось восстановлена). Объем движений: сгибание 110°, дефицит разгибания 0°. Имплант стабилен.',
    recommendations_template: '1. Контрольная рентгенография колена стоя в 2 проекциях.\n2. Продолжение курса ЛФК для баланса и мышечного тонуса.\n3. Плановый осмотр через 6 месяцев.',
    rom_norm_preset: { flexion_active: 110, flexion_passive: 115, extension_deficit: 0 },
    tests: [
      { test_code: 'lachman', expected_result: 'negative', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },

  // =========================================================================
  // КЛАСТЕР 2: ПЛЕЧЕВОЙ СУСТАВ И ПОЯС (14 шаблонов)
  // =========================================================================
  {
    existing_id: 2,
    title: 'Хронический субакромиальный импинджмент плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.1',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'I–II стадия, болезненная дуга',
    default_side: 'right',
    complaints_template: 'Боль в плече при отведении руки в сторону в диапазоне 60–120°, невозможность завести руку за спину, ночной дискомфорт при сне на больном плече.',
    anamnesis_template: 'Боли беспокоят около 4 месяцев, постепенно нарастают при работе с поднятыми руками.',
    objective_template: 'Болезненная дуга отведения (painful arc) между 70° и 120°. Тесты Нира и Хокинса-Кеннеди положительны. Пальпация подакромиального пространства болезненна.',
    recommendations_template: '1. Локальная инфильтрация подакромиальной сумки препаратом ГКС или гиалуронатом.\n2. УВТ №5.\n3. ЛФК: укрепление депрессоров головки плеча и наружных ротаторов.',
    rom_norm_preset: { flexion_active: 160, abduction: 150, external_rotation: 60, internal_rotation: 70 },
    tests: [
      { test_code: 'neer', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'hawkins', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'empty_can_jobe', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_shoulder_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    existing_id: 9,
    title: 'Субакромиальный импинджмент-синдром плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.1',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Подострый импинджмент',
    default_side: 'right',
    complaints_template: 'Ноющие боли в области плечевого сустава, усиливающиеся при подъеме руки вверх и отведении назад. Боль при сне на боку.',
    anamnesis_template: 'Боли нарастали в течение полугода, связаны с профессиональной деятельностью.',
    objective_template: 'Положительный симптом дуги отведения. Тест Нира и Хокинса положительны. Симптом Джобса положителен (боль без истинного пареза).',
    recommendations_template: '1. УЗИ плеча с функциональными пробами.\n2. Курс УВТ и подакромиальная блокада.\n3. Коррекция двигательного стереотипа.',
    rom_norm_preset: { flexion_active: 165, abduction: 155, external_rotation: 65, internal_rotation: 70 },
    tests: [
      { test_code: 'neer', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'hawkins', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'empty_can_jobe', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 10,
    title: 'Массивный полнослойный разрыв вращательной манжеты плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.1',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Полнослойный разрыв сухожилий',
    default_side: 'right',
    complaints_template: 'Резкая слабость руки: невозможность поднять и удержать руку на весу, выраженные ночные боли.',
    anamnesis_template: 'Падение на вытянутую руку 2 месяца назад с последующим щелчком и утратой силы плеча.',
    objective_template: 'Положительный тест «падающей руки» (drop-arm test) — рука самопроизвольно падает из положения отведения. Симптом Хорнбловера положителен. Атрофия надостной и подостной ямок лопатки.',
    recommendations_template: '1. Высокопольная МРТ плечевого сустава (оценка жировой дистрофии мышц по Goutallier).\n2. Консультация хирурга для артроскопического шва манжеты.',
    rom_norm_preset: { flexion_active: 80, abduction: 70, external_rotation: 25, internal_rotation: 40 },
    tests: [
      { test_code: 'drop_arm', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'empty_can_jobe', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'hornblower', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_shoulder_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Изолированный разрыв сухожилия подлопаточной мышцы плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.1',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Разрыв m. subscapularis',
    default_side: 'right',
    complaints_template: 'Боль по передней поверхности плеча, резкая слабость при попытке прижать руку к животу или завести ладонь за спину.',
    anamnesis_template: 'Форсированное наружное вращение руки при попытке удержать тяжелый предмет.',
    objective_template: 'Тест «объятия медведя» (Bear-hug) и тест прижатия к животу (Belly-press) резко положительны. Избыточная пассивная наружная ротация.',
    recommendations_template: '1. МРТ плечевого сустава 1.5–3 Тл.\n2. Ограничение наружной ротации.\n3. Направление на оперативное лечение.',
    rom_norm_preset: { flexion_active: 150, abduction: 140, external_rotation: 80, internal_rotation: 30 },
    tests: [
      { test_code: 'bear_hug', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'belly_press', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    existing_id: 11,
    title: 'Адгезивный капсулит плеча («синдром замороженного плеча»)',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.0',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Стадия «заморозки» со стойким блоком',
    default_side: 'right',
    complaints_template: 'Глобальное резкое ограничение всех движений в плечевом суставе, постоянные тупые ноющие боли, усиливающиеся по ночам.',
    anamnesis_template: 'Заболевание развивалось постепенно без видимой травмы в течение 5 месяцев.',
    objective_template: 'Выраженное ограничение как активных, так и пассивных движений во всех плоскостях: наружная ротация блокирована (менее 15°), отведение до 75° с вовлечением лопатки.',
    recommendations_template: '1. Внутрисуставная гидродилатация плечевого сустава под УЗИ.\n2. Курс внутрисуставного введения ГКС.\n3. Мягкая пассивная кинезиотерапия в безболевом диапазоне.',
    rom_norm_preset: { flexion_active: 85, abduction: 75, external_rotation: 15, internal_rotation: 30 },
    tests: [
      { test_code: 'neer', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_shoulder_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    existing_id: 29,
    title: 'Тендинит сухожилия длинной головки двуглавой мышцы плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.2',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Подострый теносиновит LHB',
    default_side: 'right',
    complaints_template: 'Локальная боль по передней поверхности плеча в межбугорковой борозде при сгибании руки и подъеме тяжестей.',
    anamnesis_template: 'Связывает с интенсивными силовыми тренировками (жим лежа, подтягивания).',
    objective_template: 'Резкая локальная болезненность при пальпации межбугорковой борозды плеча. Тест Спида и тест Йергасона положительны.',
    recommendations_template: '1. Исключение сгибательных нагрузок на бицепс.\n2. Локальное введение противовоспалительного препарата вокруг сухожилия бицепса под контролем УЗИ.\n3. УВТ №4.',
    rom_norm_preset: { flexion_active: 160, abduction: 155, external_rotation: 65, internal_rotation: 70 },
    tests: [
      { test_code: 'speed', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'yergason', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Кальцифицирующий тендинит ротаторной манжеты плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.3',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Фаза резорбции с острым болевым кризом',
    default_side: 'right',
    complaints_template: 'Внезапно возникшая нестерпимая боль в плече («криз кальциноза»), невозможность пошевелить рукой из-за боли.',
    anamnesis_template: 'Острый приступ боли начался накануне ночью без травмы.',
    objective_template: 'Пациент поддерживает руку здоровой рукой. Любые движения резко ограничены из-за защитного спазма. Отек и пальпаторная гипертермия под акромионом.',
    recommendations_template: '1. Рентгенография плеча для визуализации кальцината надостной мышцы.\n2. УЗИ-ассистированная пункция и отмывание кальцината (барботаж).\n3. НПВП в терапевтических дозировках.',
    rom_norm_preset: { flexion_active: 60, abduction: 50, external_rotation: 20, internal_rotation: 30 },
    tests: [
      { test_code: 'neer', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_shoulder_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Привычный вывих плеча, хроническая передняя нестабильность',
    joint_name: 'shoulder',
    default_mkb_code: 'M24.4',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Хроническая передняя нестабильность',
    default_side: 'right',
    complaints_template: 'Чувство соскальзывания и тревоги в плече при замахе или броске рукой, эпизоды вывихов плеча при бытовых движениях.',
    anamnesis_template: 'Первичный травматический вывих плеча 2 года назад, вправлялся в травмпункте. За последний год повторилось 4 вывиха.',
    objective_template: 'Тест тревоги передней нестабильности (Apprehension test) резко положителен при отведении 90° и наружной ротации. Релокационный тест снимает симптом тревоги. Симптом борозды отрицателен.',
    recommendations_template: '1. МРТ плеча для оценки повреждения Банкарта (передне-нижней губы гленоида).\n2. КТ плеча с 3D-реконструкцией (оценка костного дефекта гленоида и Хилл-Сакса).\n3. Консультация хирурга: выбор между артроскопической операцией Банкарта и операцией Латарже.',
    rom_norm_preset: { flexion_active: 170, abduction: 160, external_rotation: 90, internal_rotation: 70 },
    tests: [
      { test_code: 'apprehension', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'sulcus_sign', expected_result: 'negative', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'ct_joint_3d', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Повреждение верхней суставной губы плеча (SLAP-синдром)',
    joint_name: 'shoulder',
    default_mkb_code: 'S46.0',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'SLAP II тип',
    default_side: 'right',
    complaints_template: 'Глубокая боль внутри плеча при бросковых движениях над головой, болезненные щелчки и заклинивание при замахе.',
    anamnesis_template: 'Занимается теннисом/волейболом, боли возникли после сильной подачи.',
    objective_template: "Тест активной компрессии О'Брайена резко положителен в глубоком отделе сустава. Тест Спида положителен. Тесты манжеты состоятельны.",
    recommendations_template: '1. Высокопольная МРТ плеча 1.5–3 Тл с оценкой бицепс-губного комплекса.\n2. Временное исключение бросковых нагрузок над головой.\n3. Решение вопроса об артроскопическом рефиксации верхней губы.',
    rom_norm_preset: { flexion_active: 165, abduction: 160, external_rotation: 80, internal_rotation: 65 },
    tests: [
      { test_code: 'obrien_slap', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'speed', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_shoulder', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Первичный остеоартроз плечелопаточного сустава (омартроз)',
    joint_name: 'shoulder',
    default_mkb_code: 'M19.0',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Омартроз II стадии',
    default_side: 'right',
    complaints_template: 'Постоянная тупая боль в плече при движениях, грубый хруст при вращении руки, ограничение подвижности.',
    anamnesis_template: 'Боли беспокоят более 2 лет, постепенно прогрессируют.',
    objective_template: 'Грубая крепитация при ротационных движениях в плечелопаточном сочленении. Ограничение пассивной наружной ротации и отведения. Болезненность по задней суставной щели.',
    recommendations_template: '1. Рентгенография плечевого сустава в 2-х проекциях.\n2. Внутрисуставное введение препарата гиалуроновой кислоты высокой молекулярной массы.\n3. Поддерживающая лечебная физкультура.',
    rom_norm_preset: { flexion_active: 130, abduction: 120, external_rotation: 40, internal_rotation: 45 },
    tests: [
      { test_code: 'neer', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_shoulder_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Артроз акромиально-ключичного сочленения (АКС)',
    joint_name: 'shoulder',
    default_mkb_code: 'M19.0',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Деформирующий остеоартроз АКС',
    default_side: 'right',
    complaints_template: 'Локальная боль на вершине плеча, усиливающаяся при заведении руки поперек грудной клетки (горизонтальное приведение) и при сне на боку.',
    anamnesis_template: 'Длительный стаж силовых тренировок (жимы штанги) или тяжелого физического труда.',
    objective_template: 'Костное утолщение и болезненность при пальпации зоны акромиально-ключичного сустава. Тест Паксиноса и тест перекрестного приведения руки (Cross-body adduction) резко положительны.',
    recommendations_template: '1. Прицельная рентгенография АКС.\n2. Локальное введение ГКС непосредственно в полость АКС под УЗИ-контролем.\n3. Исключение горизонтального сведения плеч с отягощениями.',
    rom_norm_preset: { flexion_active: 165, abduction: 160, external_rotation: 70, internal_rotation: 70 },
    tests: [
      { test_code: 'paxinos', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_ac_joint', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Разрыв связок акромиально-ключичного сочленения (Rockwood I–III)',
    joint_name: 'shoulder',
    default_mkb_code: 'S43.1',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Вывих акромиального конца ключицы',
    default_side: 'right',
    complaints_template: 'Боль и видимая ступенеобразная деформация на вершине плеча после падения.',
    anamnesis_template: 'Прямое падение на плечо при катании на велосипеде/коньках.',
    objective_template: 'Акромиальный конец ключицы выстоит вверх в виде ступеньки. Положительный симптом клавиши пианино — при надавливании ключица вправляется, при отпускании выскакивает вверх.',
    recommendations_template: '1. Рентгенография обоих АКС стоя с грузом 5 кг.\n2. Иммобилизация повязкой Дезо / ортезом АКС на 3–4 недели при I–II типе.\n3. При Rockwood III–V — консультация хирурга для оперативной фиксации.',
    rom_norm_preset: { flexion_active: 120, abduction: 90, external_rotation: 50, internal_rotation: 60 },
    tests: [
      { test_code: 'paxinos', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_ac_joint', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Перелом диафиза ключицы (консервативное ведение/контроль)',
    joint_name: 'shoulder',
    default_mkb_code: 'S42.0',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Свежий перелом без смещения',
    default_side: 'right',
    complaints_template: 'Острая боль в области ключицы, невозможность поднять руку, отек.',
    anamnesis_template: 'Травма 3 дня назад при падении на бок.',
    objective_template: 'Локальная болезненность и костная крепитация в средней трети ключицы. Кожные покровы интактны, натяжения кожи нет. Пульсация лучевой артерии сохранена, неврологического дефицита кисти нет.',
    recommendations_template: '1. Иммобилизация кольцами Дельбе или восьмиобразной повязкой на 4–6 недель.\n2. Контрольная рентгенография ключицы через 10–14 дней.',
    rom_norm_preset: { flexion_active: 80, abduction: 60, external_rotation: 30, internal_rotation: 40 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_clavicle', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Контроль после эндопротезирования плечевого сустава',
    joint_name: 'shoulder',
    default_mkb_code: 'Z96.6',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_shoulder',
    cluster_name: 'Плечевой сустав и пояс: манжета, импинджмент, вывихи',
    stage_or_severity: 'Постоперационный плановый контроль',
    default_side: 'right',
    complaints_template: 'Плановый осмотр через 6 месяцев после реверсивного эндопротезирования правого плечевого сустава.',
    anamnesis_template: 'Операция реверсивного ТЭПС 6 месяцев назад по поводу застарелого невосстановимого разрыва манжеты и омартроза.',
    objective_template: 'Активное отведение 135°, сгибание 140°. Дельтовидная мышца активна и гипертрофирована, без признаков атрофии. Болевой синдром отсутствует. Неврологических нарушений нет.',
    recommendations_template: '1. Контрольная рентгенография плечевого сустава стоя.\n2. Продолжение программы функциональной ЛФК.',
    rom_norm_preset: { flexion_active: 140, abduction: 135, external_rotation: 35, internal_rotation: 40 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_shoulder_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  }
];

console.log(`Loaded ${TEMPLATES_100.length} templates in primary batch. Starting database upsert...`);

db.serialize(() => {
  // Upsert templates
  const tplStmt = db.prepare(`
    INSERT INTO ortho_templates (
      title, joint_name, default_mkb_code, template_json, category,
      default_side, complaints_template, anamnesis_template, objective_template,
      rom_norm_preset, recommendations_template, is_active, sort_order,
      cluster_id, cluster_name, stage_or_severity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  TEMPLATES_100.forEach((t, idx) => {
    const rawJson = JSON.stringify({
      complaints: t.complaints_template,
      anamnesis: t.anamnesis_template,
      objective: t.objective_template,
      recommendations: t.recommendations_template,
      rom: t.rom_norm_preset,
      default_mkb_code: t.default_mkb_code
    });
    const romStr = JSON.stringify(t.rom_norm_preset);

    if (t.existing_id) {
      db.run(`
        UPDATE ortho_templates SET
          title = ?, joint_name = ?, default_mkb_code = ?, template_json = ?, category = ?,
          default_side = ?, complaints_template = ?, anamnesis_template = ?, objective_template = ?,
          rom_norm_preset = ?, recommendations_template = ?, cluster_id = ?, cluster_name = ?,
          stage_or_severity = ?, sort_order = ?
        WHERE id = ?
      `, [
        t.title, t.joint_name, t.default_mkb_code, rawJson, t.category,
        t.default_side, t.complaints_template, t.anamnesis_template, t.objective_template,
        romStr, t.recommendations_template, t.cluster_id, t.cluster_name,
        t.stage_or_severity, idx * 10, t.existing_id
      ], function(err) {
        if (!err) {
          // Sync tests & diags
          syncRelational(t.existing_id, t.tests, t.diagnostics);
        }
      });
    } else {
      // Check if already exists by title
      db.get('SELECT id FROM ortho_templates WHERE title = ?', [t.title], (err, row) => {
        if (!err && row) {
          db.run(`
            UPDATE ortho_templates SET
              joint_name = ?, default_mkb_code = ?, template_json = ?, category = ?,
              default_side = ?, complaints_template = ?, anamnesis_template = ?, objective_template = ?,
              rom_norm_preset = ?, recommendations_template = ?, cluster_id = ?, cluster_name = ?,
              stage_or_severity = ?, sort_order = ?
            WHERE id = ?
          `, [
            t.joint_name, t.default_mkb_code, rawJson, t.category,
            t.default_side, t.complaints_template, t.anamnesis_template, t.objective_template,
            romStr, t.recommendations_template, t.cluster_id, t.cluster_name,
            t.stage_or_severity, idx * 10, row.id
          ], () => syncRelational(row.id, t.tests, t.diagnostics));
        } else {
          tplStmt.run([
            t.title, t.joint_name, t.default_mkb_code, rawJson, t.category,
            t.default_side, t.complaints_template, t.anamnesis_template, t.objective_template,
            romStr, t.recommendations_template, idx * 10, t.cluster_id, t.cluster_name,
            t.stage_or_severity
          ], function(insErr) {
            if (!insErr) syncRelational(this.lastID, t.tests, t.diagnostics);
          });
        }
      });
    }
  });

  tplStmt.finalize();
});

function syncRelational(templateId, tests = [], diagnostics = []) {
  db.run('DELETE FROM ortho_template_tests WHERE template_id = ?', [templateId], () => {
    if (tests && tests.length > 0) {
      const insTest = db.prepare('INSERT INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order) VALUES (?, ?, ?, ?, ?)');
      tests.forEach(test => {
        insTest.run([templateId, test.test_code, test.expected_result, test.is_mandatory, test.sort_order]);
      });
      insTest.finalize();
    }
  });

  db.run('DELETE FROM ortho_template_diagnostics WHERE template_id = ?', [templateId], () => {
    if (diagnostics && diagnostics.length > 0) {
      const insDiag = db.prepare('INSERT INTO ortho_template_diagnostics (template_id, diagnostic_code, urgency, default_side, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
      diagnostics.forEach(diag => {
        insDiag.run([templateId, diag.diagnostic_code, diag.urgency, diag.default_side, diag.is_primary, diag.sort_order]);
      });
      insDiag.finalize();
    }
  });
}
