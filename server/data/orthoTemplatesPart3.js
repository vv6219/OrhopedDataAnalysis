/**
 * Clinical Templates 2.0 - Part 3: Clusters 5 & 6
 * Cluster 5: Elbow (9 items)
 * Cluster 6: Wrist & Hand (13 items)
 * Total: 22 items
 */

const part3Templates = [
  // =========================================================================
  // КЛАСТЕР 5: ЛОКТЕВОЙ СУСТАВ И ПРЕДПЛЕЧЬЕ (9 шаблонов)
  // =========================================================================
  {
    existing_id: 4,
    title: 'Латеральный эпикондилит локтевого сустава («локоть теннисиста»)',
    joint_name: 'elbow',
    default_mkb_code: 'M77.1',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Подострый энтезит сухожилий разгибателей',
    default_side: 'right',
    complaints_template: 'Жгучая ноющая боль по наружной поверхности правого локтя с иррадиацией по тылу предплечья. Боль провоцируется рукопожатием, удержанием чашки или чайника, открыванием двери ключом, работой за компьютерной мышью.',
    anamnesis_template: 'Боли беспокоят около 2 месяцев после ремонтных работ или интенсивной работы за ПК.',
    objective_template: 'Резкая локальная пальпаторная болезненность латерального надмыщелка плеча и начала короткого лучевого разгибателя кисти. Тест Козена (разгибание кисти против сопротивления при разогнутом локте) и тест Милля резко положительны. Пассивные движения в локте в полном объеме.',
    recommendations_template: '1. Ношение эпикондилитного бандажа (налокотника с силиконовым пилотом) в верхней трети предплечья при нагрузках.\n2. Фокусированная УВТ зоны латерального надмыщелка №5.\n3. Эксцентрические упражнения Тайлера с резиновым флексбаром (Tyler twist).\n4. Локальное нанесение НПВП гелей.',
    rom_norm_preset: { flexion_active: 140, flexion_passive: 145, extension_deficit: 0, pronation: 80, supination: 85 },
    tests: [
      { test_code: 'cozen', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'mill', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'chair_test_elbow', expected_result: 'positive', is_mandatory: 0, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_elbow', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_elbow_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 13,
    title: 'Медиальный эпикондилит плеча («локоть гольфиста»)',
    joint_name: 'elbow',
    default_mkb_code: 'M77.0',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Подострый энтезит сухожилий сгибателей',
    default_side: 'right',
    complaints_template: 'Боль по внутренней поверхности локтя, усиливающаяся при сгибании кисти в кулак, переноске тяжелых сумок и вращении предплечья внутрь (пронации).',
    anamnesis_template: 'Связывает с занятиями силовым спортом (подтягивания, тяги) или монотонным ручным трудом.',
    objective_template: 'Локальная болезненность при пальпации медиального надмыщелка плечевой кости. Тест медиального эпикондилита (активное сгибание кисти и пронация предплечья против сопротивления) вызывает типичную боль. Локтевой нерв в борозде стабилен, признаков нейропатии нет.',
    recommendations_template: '1. Ограничение сгибательных нагрузок на кисть и пальцы.\n2. Курс УВТ медиального надмыщелка №5.\n3. Эксцентрические упражнения для сгибателей кисти (Reverse Tyler twist).\n4. Кинезиотейпирование мышц-сгибателей предплечья.',
    rom_norm_preset: { flexion_active: 140, flexion_passive: 145, extension_deficit: 0, pronation: 80, supination: 85 },
    tests: [
      { test_code: 'medial_epicondylitis_test', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_elbow', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_elbow_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 17,
    title: 'Асептический серозный бурсит локтевого отростка',
    joint_name: 'elbow',
    default_mkb_code: 'M70.2',
    category: 'Бурситы и синовиты',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Серозный неосложненный бурсит',
    default_side: 'right',
    complaints_template: 'Шаровидное выпячивание в области кончика локтя («мешочек с жидкостью»), дискомфорт и чувство распирания при сгибании руки или опоре на локоть.',
    anamnesis_template: 'Появился после длительной опоры локтями о стол при работе за компьютером («локоть студента») или после ушиба локтя.',
    objective_template: 'В проекции локтевого отростка пальпируется округлое безболезненное флюктуирующее образование размером 5х4 см. Кожа обычной окраски, локальная гипертермия отсутствует. Движения в локтевом суставе не ограничены.',
    recommendations_template: '1. Пункция сумки локтевого отростка с эвакуацией экссудата и наложением давящей повязки.\n2. Введение пролонгированного ГКС (Дипроспан) при рецидивирующем течении.\n3. Исключение опоры на локтевой отросток, ношение мягкого защитного налокотника.',
    rom_norm_preset: { flexion_active: 140, flexion_passive: 145, extension_deficit: 0, pronation: 80, supination: 85 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'us_elbow', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Синдром кубитального канала (компрессия локтевого нерва)',
    joint_name: 'elbow',
    default_mkb_code: 'G56.2',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Компрессионно-ишемическая нейропатия',
    default_side: 'right',
    complaints_template: 'Онемение, покалывание и «ползание мурашек» в мизинце и безымянном пальце правой кисти, усиливающиеся при длительном сгибании локтя (разговор по телефону, сон с согнутыми руками). Слабость хвата кисти.',
    anamnesis_template: 'Симптомы беспокоят около 3 месяцев, постепенно прогрессируют.',
    objective_template: 'Симптом Тиннеля положителен при перкуссии локтевого нерва в борозде медиального надмыщелка. Локтевой тест сгибания (Elbow flexion test) воспроизводит парестезии в IV–V пальцах через 30 секунд. Слабость приведения V пальца и положительный симптом Фромана.',
    recommendations_template: '1. ЭНМГ верхних конечностей (оценка блока проведения в области локтевого сустава).\n2. УЗИ локтевого нерва на уровне кубитального канала (оценка площади поперечного сечения нерва).\n3. Ночное шинирование локтя в положении разгибания под углом 30–45°.\n4. Нейромиостимуляция, витамины группы В.\n5. При блоке проведения — консультация нейрохирурга для декомпрессии или транспозиции нерва.',
    rom_norm_preset: { flexion_active: 140, flexion_passive: 145, extension_deficit: 0, pronation: 80, supination: 85 },
    tests: [
      { test_code: 'tinel_cubital', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'froment_sign', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'enmg_upper', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_elbow', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Частичный/полный разрыв дистального сухожилия бицепса',
    joint_name: 'elbow',
    default_mkb_code: 'S46.2',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Свежий разрыв дистального сухожилия',
    default_side: 'right',
    complaints_template: 'Острая боль в локтевом сгибе в момент резкого подъема тяжести (щелчок/хруст), слабость при сгибании локтя и повороте кисти ладонью вверх (супинации).',
    anamnesis_template: 'Мужчина 35–55 лет, травма 2 дня назад при попытке удержать тяжелый предмет.',
    objective_template: 'Кровоизлияние и отек в локтевой ямке. Проксимальное смещение брюшка двуглавой мышцы плеча («симптом Попая» наоборот). Крючковый тест (Hook test) положительный: пальцем не удается зацепить натянутое дистальное сухожилие бицепса в локтевой ямке. Резкая слабость супинации предплечья.',
    recommendations_template: '1. Срочное МРТ локтевого сустава (FABS view — flexion, abduction, supination) для верификации диастаза сухожилия.\n2. Показано оперативное рефиксация сухожилия бицепса к бугристости лучевой кости пуговицей/анкером (в первые 2–3 недели после травмы).\n3. Иммобилизация шарнирным ортезом локтя.',
    rom_norm_preset: { flexion_active: 110, flexion_passive: 120, extension_deficit: 15, pronation: 60, supination: 40 },
    tests: [
      { test_code: 'hook_biceps', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_joint_3t', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_elbow', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Нестабильность медиальной коллатеральной связки локтя (UCL)',
    joint_name: 'elbow',
    default_mkb_code: 'M24.2',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Хроническая вальгусная нестабильность',
    default_side: 'right',
    complaints_template: 'Боль по внутренней поверхности локтя во время фазы броска мяча (у метателей, волейболистов, теннисистов), ощущение раскрытия сустава.',
    anamnesis_template: 'Спортсмен, бросковые нагрузки, симптомы нарастали в течение спортивного сезона.',
    objective_template: 'Болезненность по ходу переднего пучка медиальной коллатеральной связки локтя. Динамический вальгус-тест (Moving valgus stress test) и тест «дойки» (Milking maneuver) резко положительны с провокацией боли при угле сгибания между 70° и 120°.',
    recommendations_template: '1. МР-артрография локтевого сустава («симптом Т-знака» при отрыве связки от венечного отростка).\n2. Прекращение бросковых тренировок на 6–8 недель.\n3. Курс PRP-терапии в область переднего пучка UCL.\n4. При полном разрыве у профессиональных спортсменов — пластика связки (операция Томми Джона).',
    rom_norm_preset: { flexion_active: 135, flexion_passive: 140, extension_deficit: 0, pronation: 80, supination: 85 },
    tests: [
      { test_code: 'moving_valgus_elbow', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_joint_3t', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Синдром радиального туннеля (компрессия лучевого нерва)',
    joint_name: 'elbow',
    default_mkb_code: 'G56.3',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Глубокая компрессия n. radialis (аркада Фрозе)',
    default_side: 'right',
    complaints_template: 'Глубокая ноющая боль в проксимальном отделе предплечья кнаружи, часто ошибочно принимаемая за резистентный латеральный эпикондилит.',
    anamnesis_template: 'Монотонные вращательные движения предплечья, боли беспокоят более 4 месяцев.',
    objective_template: 'Максимальная болезненность локализуется на 4–5 см дистальнее латерального надмыщелка плеча (над входом нерва под супинатор — аркаду Фрозе). Разгибание III пальца кисти против сопротивления провоцирует острую боль в предплечье. Чувствительных нарушений нет (поражена моторная ветвь PIN).',
    recommendations_template: '1. ЭНМГ лучевого нерва.\n2. УЗИ зоны радиального туннеля с оценкой компрессии глубокой ветви.\n3. Избегание форсированной супинации предплечья.\n4. Невролиз при стойкой компрессии.',
    rom_norm_preset: { flexion_active: 140, flexion_passive: 145, extension_deficit: 0, pronation: 80, supination: 85 },
    tests: [
      { test_code: 'chair_test_elbow', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'enmg_upper', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_elbow', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Синдром круглого пронатора (компрессия срединного нерва)',
    joint_name: 'elbow',
    default_mkb_code: 'G56.1',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Высокая компрессия срединного нерва в локте',
    default_side: 'right',
    complaints_template: 'Боль по передней поверхности предплечья, онемение I–III пальцев и области возвышения большого пальца (thenar), усиливающееся при повторяющейся пронации предплечья.',
    anamnesis_template: 'Симптомы схожи с синдромом запястного канала, но ночные пробуждения отсутствуют, а онемение захватывает ладонную поверхность основания большого пальца.',
    objective_template: 'Болезненность и пальпаторное уплотнение круглого пронатора в верхней трети предплечья. Тест круглого пронатора (сопротивление форсированной пронации при одновременном разгибании локтя) воспроизводит парестезии в руке. Симптом Тиннеля на запястье отрицателен.',
    recommendations_template: '1. ЭНМГ срединного нерва (дифференциальная диагностика с карпальным каналом).\n2. Постизометрическая релаксация и растяжка круглого пронатора.\n3. Локальная блокада брюшка мышцы анестетиком под УЗИ.',
    rom_norm_preset: { flexion_active: 140, flexion_passive: 145, extension_deficit: 0, pronation: 75, supination: 85 },
    tests: [
      { test_code: 'pronator_teres_test', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'enmg_upper', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_elbow', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Посттравматический деформирующий остеоартроз локтевого сустава',
    joint_name: 'elbow',
    default_mkb_code: 'M19.0',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннели',
    stage_or_severity: 'Посттравматическая контрактура с остеофитами',
    default_side: 'right',
    complaints_template: 'Ограничение сгибания и разгибания в локтевом суставе, хруст и тупая боль при предельных движениях.',
    anamnesis_template: 'Перелом головки лучевой кости или венечного отростка 3 года назад.',
    objective_template: 'Деформация контуров локтевого сустава за счет краевых остеофитов. Дефицит разгибания 20°, сгибание ограничено до 115°. Грубая крепитация при пассивных движениях.',
    recommendations_template: '1. Рентгенография локтевого сустава в 2 проекциях.\n2. Внутрисуставное введение препарата гиалуроновой кислоты.\n3. Разработка движений на аппарате пассивной механической терапии (Артромот локтевой).\n4. При блокирующих остеофитах — артроскопический артролиз.',
    rom_norm_preset: { flexion_active: 115, flexion_passive: 120, extension_deficit: 20, pronation: 70, supination: 70 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_elbow_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'ct_joint_3d', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },

  // =========================================================================
  // КЛАСТЕР 6: ЛУЧЕЗАПЯСТНЫЙ СУСТАВ И КИСТЬ (13 шаблонов)
  // =========================================================================
  {
    existing_id: 14,
    title: 'Синдром запястного канала (компрессия срединного нерва)',
    joint_name: 'wrist',
    default_mkb_code: 'G56.0',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'II стадия, ночные акропарестезии',
    default_side: 'right',
    complaints_template: 'Онемение, покалывание и жгучая боль в I, II, III и половине IV пальцев правой кисти, мучительные пробуждения среди ночи («симптом встряхивания кисти» — flick sign). Неловкость при застегивании пуговиц, выпадение предметов из рук.',
    anamnesis_template: 'Симптомы беспокоят около полугода, постепенно прогрессируют.',
    objective_template: 'Тест Фалена (пассивное сгибание запястья на 90°) вызывает онемение пальцев через 20 секунд. Симптом Тиннеля над карпальным каналом резко положителен. Тест компрессии Дуркана (прямое сдавление нерва ладонью врача) положителен. Начинающаяся гипотрофия мышц тенара.',
    recommendations_template: '1. Стимуляционная ЭНМГ срединного нерва с определением дистальной моторной латентности.\n2. УЗИ карпального канала с измерением площади поперечного сечения срединного нерва (CSA > 10 мм²).\n3. Ночное ношение жесткого лучезапястного ортеза в нейтральном положении (0° сгибания).\n4. Локальная блокада карпального канала ГКС с анестетиком под УЗИ-навигацией.\n5. При неэффективности — эндоскопический или открытый релиз карпальной связки.',
    rom_norm_preset: { dorsal_flexion: 65, palmar_flexion: 65, radial_deviation: 20, ulnar_deviation: 30 },
    tests: [
      { test_code: 'phalen', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'tinel_carpal', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'durkan', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'enmg_upper', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_wrist', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    existing_id: 18,
    title: 'Стенозирующий лигаментит де Кервена (I компартмент)',
    joint_name: 'wrist',
    default_mkb_code: 'M65.4',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'Подострый стеноз I тыльного канала',
    default_side: 'right',
    complaints_template: 'Резкая боль у основания большого пальца и по лучевому краю запястья при поднятии ребенка на руки, открывании тугих крышек, удерживании смартфона одной рукой.',
    anamnesis_template: 'Часто возникает у молодых матерей («запястье молодой мамы») или при монотонной работе с отведением большого пальца.',
    objective_template: 'Локальное утолщение и резкая болезненность над шиловидным отростком лучевой кости. Тест Финкельштейна и тест Айххоффа (приведение кисти в локтевую сторону при зажатом в кулак большом пальце) вызывают острую, «кинжальную» боль.',
    recommendations_template: '1. Иммобилизация ортезом лучезапястного сустава с захватом первого пальца (Spica splint) на 3–4 недели.\n2. Локальная инфильтрация оболочки первого канала ГКС (Дипроспан) под контролем УЗИ.\n3. УВТ области шиловидного отростка луча №4.\n4. При рецидиве — открытая декомпрессия I компартмента.',
    rom_norm_preset: { dorsal_flexion: 65, palmar_flexion: 65, radial_deviation: 15, ulnar_deviation: 25 },
    tests: [
      { test_code: 'finkelstein', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'eichhoff', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_wrist', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_wrist_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 19,
    title: 'Ризартроз (остеоартроз I запястно-пястного сустава)',
    joint_name: 'wrist',
    default_mkb_code: 'M18.1',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'II–III стадия по Eaton-Littler',
    default_side: 'right',
    complaints_template: 'Боль у основания большого пальца кисти при щипковом хвате (открывание банок, поворот ключа в замке, письмо ручкой). Квадратная деформация основания пальца.',
    anamnesis_template: 'Женщина старше 50 лет, боли беспокоят более года с постепенной потерей силы щипка.',
    objective_template: 'Костное утолщение и крепитация в I запястно-пястном суставе (CMC-1). Тест размалывания Гринд (CMC Grind test) — осевая компрессия с ротацией первой пястной кости — вызывает резкую боль и хруст.',
    recommendations_template: '1. Рентгенография кисти в проекции Роберта (аксиальная проекция трапецие-пястного сустава).\n2. Ношение термопластического ортеза для стабилизации I луча.\n3. Внутрисуставное введение препарата гиалуроновой кислоты в полость CMC-1 сустава.\n4. При III–IV стадии — трапециэктомия с сухожильной интерпозицией (LRTI) или артродез.',
    rom_norm_preset: { dorsal_flexion: 65, palmar_flexion: 65, radial_deviation: 20, ulnar_deviation: 30 },
    tests: [
      { test_code: 'grind_test_cmc', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_hand_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_wrist', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Нестабильность дистального радиоульнарного сустава (DRUJ)',
    joint_name: 'wrist',
    default_mkb_code: 'M24.2',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'Хронический подвывих головки локтевой кости',
    default_side: 'right',
    complaints_template: 'Боль с ульнарной стороны запястья при открывании дверей и отжиманиях, ощущение выскакивания «шишки» (головки локтевой кости) при поворотах предплечья.',
    anamnesis_template: 'В анамнезе перелом лучевой кости или ротационная травма кисти.',
    objective_template: 'Симптом клавиши пианино локтевой кости (Piano key test): головка локтевой кости выстоит кзади, легко вправляется при надавливании и пружинит назад. Повышенная переднезадняя подвижность в DRUJ по сравнению со здоровой рукой.',
    recommendations_template: '1. КТ обоих лучезапястных суставов в нейтральном положении, максимальной пронации и супинации.\n2. Стабилизирующий ортез предплечья (Muenster splint).\n3. Хирургическая реконструкция связок DRUJ (операция Адамса-Бергера).',
    rom_norm_preset: { dorsal_flexion: 60, palmar_flexion: 60, radial_deviation: 20, ulnar_deviation: 25 },
    tests: [
      { test_code: 'piano_key_wrist', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'ct_joint_3d', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_wrist_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Разрыв триангулярного волокнисто-хрящевого комплекса (TFCC)',
    joint_name: 'wrist',
    default_mkb_code: 'M24.1',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'Травматический разрыв (Palmer 1B / 1D)',
    default_side: 'right',
    complaints_template: 'Боль в ульнарном отделе запястья при рукопожатиях, опоре на ладонь и вращении кистью, щелчки при отведении кисти в сторону мизинца.',
    anamnesis_template: 'Падение на разогнутую кисть с ротацией предплечья.',
    objective_template: 'Резкая локальная пальпаторная болезненность в ямке между шиловидным отростком локтевой кости и сухожилием FCU (положительный симптом Фовеа / Fovea sign). TFCC компрессионный тест (ульнарная девиация с осевой нагрузкой и ротацией) вызывает щелчок и резкую боль.',
    recommendations_template: '1. МРТ лучезапястного сустава на томографе 3.0 Тл со специализированной кистевой катушкой.\n2. Фиксация запястья жестким ортезом на 4 недели.\n3. Внутрисуставная инъекция PRP под УЗИ-навигацией.\n4. При нестабильности — артроскопический шов TFCC.',
    rom_norm_preset: { dorsal_flexion: 60, palmar_flexion: 60, radial_deviation: 20, ulnar_deviation: 25 },
    tests: [
      { test_code: 'fovea_sign', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'piano_key_wrist', expected_result: 'negative', is_mandatory: 0, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_joint_3t', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Ладьевидно-полулунная диссоциация (нестабильность SL)',
    joint_name: 'wrist',
    default_mkb_code: 'S63.3',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'Разрыв ладьевидно-полулунной связки (DISI)',
    default_side: 'right',
    complaints_template: 'Боль по тылу лучезапястного сустава при осевой нагрузке (отжимания от пола), слабость хвата кисти, щелчки при движениях.',
    anamnesis_template: 'Травма запястья при падении с упором на ладонь.',
    objective_template: 'Тест сдвига ладьевидной кости Уотсона (Watson scaphoid shift test) резко положителен: при отведении кисти из ульнарного в радиальное положение ладьевидная кость выскальзывает через край лучевой кости с характерным щелчком («кланком») и болью.',
    recommendations_template: '1. Сравнительная рентгенография обоих лучезапястных суставов со сжатием кулаков (stress view) для выявления расширения интервала Терри-Томаса (Terry Thomas sign > 3 мм).\n2. МРТ кисти 3Т.\n3. Срочная консультация кистевого хирурга для реконструкции SL-связки.',
    rom_norm_preset: { dorsal_flexion: 55, palmar_flexion: 55, radial_deviation: 15, ulnar_deviation: 25 },
    tests: [
      { test_code: 'watson_scaphoid', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_wrist_2v', urgency: 'urgent', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_joint_3t', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    existing_id: 26,
    title: 'Стенозирующий лигаментит («щелкающий палец», болезнь Нотта)',
    joint_name: 'wrist',
    default_mkb_code: 'M65.3',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'II–III стадия (защелкивание с усилием)',
    default_side: 'right',
    complaints_template: 'Защелкивание пальца при сгибании в кулак, палец «заклинивает» в согнутом положении, разогнуть его удается только с помощью другой руки с болезненным щелчком.',
    anamnesis_template: 'Чаще поражаются I, III или IV пальцы кисти. Симптомы нарастали несколько месяцев.',
    objective_template: 'Пальпаторное узелковое утолщение и болезненность в проекции кольцевидной связки А1 на ладони у основания пальца. При сгибании-разгибании пальца пальпируется проскакивание узелка сухожилия через суженную связку с щелчком.',
    recommendations_template: '1. Локальная блокада связки А1 микродозой ГКС под контролем УЗИ (высокая эффективность на I–II стадии).\n2. Ношение шины, ограничивающей полное сгибание пальца.\n3. При неэффективности — закрытая чрескожная или открытая лигаментотомия связки А1.',
    rom_norm_preset: { dorsal_flexion: 65, palmar_flexion: 65, radial_deviation: 20, ulnar_deviation: 30 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'us_wrist', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    existing_id: 27,
    title: 'Контрактура Дюпюитрена ладонного апоневроза I–II степени',
    joint_name: 'wrist',
    default_mkb_code: 'M72.0',
    category: 'Деформации стопы и приобретенные аномалии',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'I–II степень по Tubiana (контрактура до 45°)',
    default_side: 'right',
    complaints_template: 'Плотные тяжи и узелки на ладони, невозможность полностью разогнуть IV и V пальцы кисти, трудности при умывании и надевании перчаток.',
    anamnesis_template: 'Рубцовые изменения на ладони формировались в течение нескольких лет.',
    objective_template: 'Плотный фиброзный продольный тяж по ладонной поверхности, идущий к основанию IV–V пальцев. Сгибательная контрактура в пястно-фаланговом суставе 30°, проксимальном межфаланговом суставе 15°. Тест настольного стола Хьюстона (Table top test) положителен — ладонь не прилегает плоско к поверхности стола.',
    recommendations_template: '1. Игольная апоневротомия (малоинвазивный метод) или ферментативный фасциолиз.\n2. При выраженной контрактуре — плановая субтотальная фасциэктомия.\n3. Ночное шинирование пальцев после процедуры.',
    rom_norm_preset: { dorsal_flexion: 65, palmar_flexion: 65, radial_deviation: 20, ulnar_deviation: 30 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'us_wrist', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    existing_id: 28,
    title: 'Ганглион (гигрома) тыла лучезапястного сустава',
    joint_name: 'wrist',
    default_mkb_code: 'M67.4',
    category: 'Бурситы и синовиты',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'Тыльный синовиальный ганглий',
    default_side: 'right',
    complaints_template: 'Округлое плотноэластическое образование по тыльной поверхности лучезапястного сустава, увеличивающееся при нагрузках, умеренная боль при максимальном тыльном сгибании (опоре на ладонь).',
    anamnesis_template: 'Образование появилось около 3 месяцев назад, периодически меняет размеры.',
    objective_template: 'По тыльно-радиальной поверхности запястья в проекции SL-интервала определяется округлое образование диаметром 2.0 см, плотноэластической консистенции, спаянное с подлежащими тканями, безболезненное при пальпации. Кожа над ним смещаема.',
    recommendations_template: '1. УЗИ лучезапястного сустава (оценка ножки ганглия и связи с суставной щелью).\n2. Аспирационная пункция содержимого с эвакуацией густого муцинозного геля и введением ГКС под УЗИ.\n3. При рецидиве — открытое или артроскопическое иссечение капсулы ганглия с ножкой.',
    rom_norm_preset: { dorsal_flexion: 60, palmar_flexion: 65, radial_deviation: 20, ulnar_deviation: 30 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'us_wrist', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Асептический некроз полулунной кости (болезнь Кинбека)',
    joint_name: 'wrist',
    default_mkb_code: 'M93.1',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'II–III стадия по Lichtman',
    default_side: 'right',
    complaints_template: 'Постоянная боль в центре тыла запястья, усиливающаяся при сжатии кулака и поднятии предметов, тугоподвижность кисти.',
    anamnesis_template: 'Мужчина рабочего возраста, ручной труд, боли нарастали более 8 месяцев.',
    objective_template: 'Припухлость и резкая локальная болезненность при пальпации в проекции полулунной кости (ямка дистальнее лучевой кости). Снижение силы хвата кисти на 40% по динамометру.',
    recommendations_template: '1. МРТ лучезапястного сустава (ранняя диагностика аваскулярного остеонекроза полулунной кости).\n2. Рентгенография в 2 проекциях для оценки склероза, фрагментации или коллапса полулунной кости.\n3. Разгрузочная иммобилизация лонгетой.\n4. Консультация кистевого микрохирурга (реваскуляризация / укорачивающая остеотомия лучевой кости).',
    rom_norm_preset: { dorsal_flexion: 40, palmar_flexion: 45, radial_deviation: 15, ulnar_deviation: 20 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'mri_joint_3t', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_wrist_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Перелом дистального метаэпифиза лучевой кости (Коллес / Смит)',
    joint_name: 'wrist',
    default_mkb_code: 'S52.5',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'Период иммобилизации / консолидации',
    default_side: 'right',
    complaints_template: 'Отек, боль и штыкообразная деформация дистального отдела предплечья после падения на вытянутую руку.',
    anamnesis_template: 'Падение на улице с высоты собственного роста.',
    objective_template: 'Штыкообразная или вилкообразная деформация дистального отдела правого предплечья. Выраженный травматический отек. Резкая болезненность при пальпации лучевой кости на 2 см проксимальнее сустава. Пальцы теплые, пульсация лучевой артерии сохранена.',
    recommendations_template: '1. Срочная цифровая рентгенография лучезапястного сустава в 2 проекциях.\n2. При смещении — закрытая ручная репозиция под местной анестезией с фиксацией гипсовой лонгетой или направление на остеосинтез пластиной LCP.\n3. Контрольный снимок через 7–10 дней.',
    rom_norm_preset: { dorsal_flexion: 20, palmar_flexion: 20, radial_deviation: 10, ulnar_deviation: 15 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_wrist_2v', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Перелом ладьевидной кости кисти без смещения',
    joint_name: 'wrist',
    default_mkb_code: 'S62.0',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'Свежий перелом талии ладьевидной кости',
    default_side: 'right',
    complaints_template: 'Боль в области анатомической табакерки после падения на кисть, боль при осевой нагрузке на большой палец.',
    anamnesis_template: 'Падение на разогнутую ладонь во время катания на роликах/сноуборде 3 дня назад.',
    objective_template: 'Припухлость и резкая локальная пальпаторная болезненность в глубине анатомической табакерки (anatomical snuffbox) и над бугорком ладьевидной кости с ладонной стороны. Осевая нагрузка по оси I пальца резко болезненна.',
    recommendations_template: '1. Прицельная рентгенография ладьевидной кости в 4 проекциях (ладьевидные укладки со сжатым кулаком).\n2. При сомнительных рентгенограммах — КТ или МРТ кисти (высокий риск ложного сустава ладьевидной кости!).\n3. Иммобилизация циркулярной повязкой с фиксацией первого пальца на 8–10 недель.',
    rom_norm_preset: { dorsal_flexion: 30, palmar_flexion: 30, radial_deviation: 10, ulnar_deviation: 15 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_wrist_2v', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'ct_joint_3d', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Синдром канала Гийона (компрессия локтевого нерва на кисти)',
    joint_name: 'wrist',
    default_mkb_code: 'G56.2',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_wrist_hand',
    cluster_name: 'Лучезапястный сустав и кисть: карпальный канал, связки, переломы',
    stage_or_severity: 'Дистальная компрессия n. ulnaris у гороховидной кости',
    default_side: 'right',
    complaints_template: 'Онемение мизинца и локтевого края IV пальца без нарушения чувствительности тыла кисти, слабость сведения и разведения пальцев («паралич велосипедиста»).',
    anamnesis_template: 'Длительная езда на велосипеде с опорой на руль или работа с упором запястьем о твердый край стола.',
    objective_template: 'Симптом Тиннеля над каналом Гийона (кнаружи от гороховидной кости) положителен. Тест Фромана положителен: при попытке удержать лист бумаги между I и II пальцами пациент сгибает концевую фалангу I пальца (компенсация длинным сгибателем из-за слабости m. adductor pollicis).',
    recommendations_template: '1. ЭНМГ локтевого нерва (дифференциация уровня компрессии: локоть vs запястье).\n2. УЗИ канала Гийона для исключения ганглия или тромбоза локтевой артерии.\n3. Смена эргономики руля/рабочего места, мягкие перчатки с гелевыми вставками.',
    rom_norm_preset: { dorsal_flexion: 65, palmar_flexion: 65, radial_deviation: 20, ulnar_deviation: 30 },
    tests: [
      { test_code: 'froment_sign', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'enmg_upper', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_wrist', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  }
];

module.exports = { part3Templates };
