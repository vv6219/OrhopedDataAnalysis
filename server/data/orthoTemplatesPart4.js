/**
 * Clinical Templates 2.0 - Part 4: Clusters 7, 8 & 9
 * Cluster 7: Spine & Thorax (11 items)
 * Cluster 8: Pediatric Orthopedics (5 items)
 * Cluster 9: Systemic & Metabolic Syndromes (5 items)
 * Total: 21 items
 */

const part4Templates = [
  // =========================================================================
  // КЛАСТЕР 7: ПОЗВОНОЧНИК И ГРУДНАЯ КЛЕТКА (11 шаблонов)
  // =========================================================================
  {
    existing_id: 6,
    title: 'Люмбалгия с вертеброгенной радикулопатией L5–S1 (ишиас)',
    joint_name: 'spine',
    default_mkb_code: 'M54.4',
    category: 'Дорсопатии и патология позвоночника',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Острый радикулярный синдром L5–S1',
    default_side: 'right',
    complaints_template: 'Интенсивная простреливающая боль в пояснично-крестцовом отделе с иррадиацией по задней поверхности правого бедра, голени до пятки и пальцев стопы. Онемение наружного края стопы. Боль усиливается при кашле, чихании и наклонах.',
    anamnesis_template: 'Обострение 4 дня назад после подъема тяжести в наклон. Анальгетики малоэффективны.',
    objective_template: 'Сглажен поясничный лордоз, противоболевой сколиоз влево. Симптом Ласега (Straight Leg Raise) справа положителен под углом 35° с воспроизведением типичной корешковой боли по всей ноге. Снижение ахиллова рефлекса справа. Слабость тыльного сгибания первого пальца стопы (L5). Сламп-тест положительный.',
    recommendations_template: '1. Срочное МРТ пояснично-крестцового отдела позвоночника (оценка экструзии/секвестрации диска L4-L5 или L5-S1).\n2. Режим умеренной активности, избегать постельного режима дольше 48 часов.\n3. Ступенчатая терапия: инъекционные НПВП + миорелаксанты + габапентиноиды.\n4. При неэффективности — эпидуральная или трансфораминальная блокада под рентген-контролем.\n5. Консультация нейрохирурга при прогрессировании мышечной слабости или нарушениях функций тазовых органов (синдром конского хвоста).',
    rom_norm_preset: { flexion_active: 30, extension_deficit: 10, lateral_flexion_left: 15, lateral_flexion_right: 10 },
    tests: [
      { test_code: 'straight_leg_raise', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'slump_test', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'kemp_quadrant', expected_result: 'positive', is_mandatory: 0, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_spine_lumbar', urgency: 'urgent', default_side: 'central', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'enmg_lower', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 16,
    title: 'Острая люмбалгия на фоне мышечно-тонического и фасеточного синдрома',
    joint_name: 'spine',
    default_mkb_code: 'M54.5',
    category: 'Дорсопатии и патология позвоночника',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Острый мышечно-тонический синдром',
    default_side: 'bilateral',
    complaints_template: 'Сковывающая ноющая боль в пояснице, невозможность разогнуться по утрам, усиление боли при разгибании назад и поворотах туловища. Иррадиации в ноги ниже ягодиц нет.',
    anamnesis_template: 'Возникла после длительной статической нагрузки за рулем или физической работы в саду.',
    objective_template: 'Выраженный спазм паравертебральных мышц поясничного отдела («мышечный дефанс»). Болезненность паравертебральных точек в проекции фасеточных суставов L4–L5 и L5–S1. Симптом Кемпа (Kemp quadrant test — разгибание с ротацией в больную сторону) воспроизводит локальную боль в пояснице. Корешковые симптомы (Ласег) отрицательны.',
    recommendations_template: '1. Локальная инфильтрационная терапия паравертебральных триггерных зон.\n2. Миорелаксанты центрального действия (Тизанидин / Толперизон) + НПВП.\n3. Мягкотканные мануальные техники и постизометрическая релаксация мышц поясницы.\n4. Ношение полужесткого поясничного корсета при физической нагрузке.',
    rom_norm_preset: { flexion_active: 45, extension_deficit: 5, lateral_flexion_left: 20, lateral_flexion_right: 20 },
    tests: [
      { test_code: 'kemp_quadrant', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'straight_leg_raise', expected_result: 'negative', is_mandatory: 1, sort_order: 20 },
      { test_code: 'schober', expected_result: 'positive', is_mandatory: 0, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_spine_lumbar', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_spine_lumbar', urgency: 'routine', default_side: 'central', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 7,
    title: 'Цервикалгия с миофасциальным болевым синдромом и цефалгией',
    joint_name: 'spine',
    default_mkb_code: 'M54.2',
    category: 'Дорсопатии и патология позвоночника',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Подострый мышечно-тонический синдром ШОП',
    default_side: 'bilateral',
    complaints_template: 'Боль и тяжесть в шейно-воротниковой зоне, ограничение поворотов головы, чувство скованности, диффузные головные боли напряжения («стягивающий обруч») к концу рабочего дня.',
    anamnesis_template: 'Длительная работа за монитором с выдвинутой вперед головой («text neck syndrome»).',
    objective_template: 'Болезненные триггерные тяжи в трапециевидных мышцах, мышце, поднимающей лопатку, и подзатылочной группе. Пальпация триггеров воспроизводит типичную головную боль. Ограничение ротации головы до 50° в обе стороны (норма 80°). Неврологический статус без очагового дефицита.',
    recommendations_template: '1. Эргономическая коррекция рабочего места (монитор на уровне глаз).\n2. Миофасциальный релиз и регулярные паузы для суставной гимнастики шеи.\n3. УВТ триггерных зон трапециевидных мышц №4.\n4. Курс массажа воротниковой зоны и ЛФК по укреплению глубоких сгибателей шеи.',
    rom_norm_preset: { flexion_active: 35, extension_deficit: 0, rotation_left: 50, rotation_right: 50, lateral_flexion_left: 30, lateral_flexion_right: 30 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_spine_cervical', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_neck_vessels', urgency: 'routine', default_side: 'bilateral', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 22,
    title: 'Цервикобрахиалгия с корешковым синдромом C6–C7',
    joint_name: 'spine',
    default_mkb_code: 'M54.12',
    category: 'Дорсопатии и патология позвоночника',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Острая радикулопатия C6/C7',
    default_side: 'right',
    complaints_template: 'Острая простреливающая боль от шеи и лопатки по наружной поверхности плеча и предплечья в указательный и средний пальцы руки. Онемение пальцев, слабость при разгибании руки.',
    anamnesis_template: 'Боль возникла остро утром после неудобного положения шеи во сне 3 дня назад.',
    objective_template: 'Тест Шпурлинга (Spurling compression test — осевая компрессия головы с наклоном в пораженную сторону) резко воспроизводит радикулярную боль и парестезии в руке. Тест тракции шеи приносит облегчение. Снижение трицепс-рефлекса справа, слабость разгибания предплечья.',
    recommendations_template: '1. Срочное МРТ шейного отдела позвоночника (верификация грыжи диска C5–C6 или C6–C7).\n2. Ношение мягкого воротника Шанца на 5–7 дней в острый период.\n3. Противоотечная и противовоспалительная терапия (ГКС коротким курсом, габапентин).\n4. Консультация нейрохирурга при нарастании пареза трицепса.',
    rom_norm_preset: { flexion_active: 30, extension_deficit: 10, rotation_left: 45, rotation_right: 30, lateral_flexion_left: 25, lateral_flexion_right: 15 },
    tests: [
      { test_code: 'spurling', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'cervical_distraction', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_spine_cervical', urgency: 'urgent', default_side: 'central', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'enmg_upper', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Торакалгия на фоне грудного остеохондроза и реберного артроза',
    joint_name: 'spine',
    default_mkb_code: 'M54.6',
    category: 'Дорсопатии и патология позвоночника',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Подострый межлопаточный вертеброгенный синдром',
    default_side: 'bilateral',
    complaints_template: 'Ноющая боль между лопатками и по ходу ребер, усиливающаяся при глубоком вдохе, длительном сидении с круглой спиной и поворотах корпуса.',
    anamnesis_template: 'Кардиологическая патология исключена (ЭКГ в норме). Боли беспокоят несколько недель.',
    objective_template: 'Кифотическая деформация грудного отдела. Болезненность при пальпации паравертебральных точек Th4–Th8 и реберно-позвоночных суставов. Пальпация межреберных промежутков безболезненна. Дыхание везикулярное, хрипов нет.',
    recommendations_template: '1. Рентгенография грудного отдела позвоночника в 2 проекциях.\n2. Коррекция осанки, упражнения на раскрытие грудной клетки на гимнастическом валике.\n3. Массаж спины и миофасциальный релиз ромбовидных мышц.\n4. НПВП местно.',
    rom_norm_preset: { flexion_active: 40, extension_deficit: 0, rotation_left: 30, rotation_right: 30 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_spine_thoracic', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    existing_id: 23,
    title: 'Идиопатический сколиоз позвоночника II степени (у подростков)',
    joint_name: 'spine',
    default_mkb_code: 'M41.2',
    category: 'Деформации стопы и приобретенные аномалии',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'II степень по Коббу (11–25°)',
    default_side: 'right',
    complaints_template: 'Асимметрия надплечий, выступание одной лопатки, перекос линии талии, быстрая утомляемость спины при сидении за школьной партой.',
    anamnesis_template: 'Подросток 12–14 лет в периоде бурного пубертатного роста. Родители заметили асимметрию спины.',
    objective_template: 'Асимметрия треугольников талии, правое надплечье выше левого. Тест Адамса с наклоном вперед (Adams forward bend test) положительный: выявляется правосторонний реберный горб (гибус) в грудном отделе за счет ротации позвонков (сколиометр показывает угол более 7°). Тест Риссера для оценки костной зрелости.',
    recommendations_template: '1. Панорамная цифровая телерентгенография позвоночника стоя от C7 до таза (Full spine EOS / X-ray) с расчетом угла Кобба и теста Риссера.\n2. Специализированная антисколиозная гимнастика по методу Шрот (Schroth therapy).\n3. При угле Кобба > 20° у растущего ребенка — консультация ортезиста для изготовления корсета типа Шено (ношение 20–22 часа в сутки).\n4. Контрольный осмотр и рентген каждые 6 месяцев до окончания роста.',
    rom_norm_preset: { flexion_active: 60, extension_deficit: 0, lateral_flexion_left: 25, lateral_flexion_right: 20 },
    tests: [
      { test_code: 'adams_forward_bend', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_spine_scoliosis_full', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Юношеский кифоз (болезнь Шейермана-Мау)',
    joint_name: 'spine',
    default_mkb_code: 'M42.0',
    category: 'Остеохондропатии и ювенильная ортопедия',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Ригидный гиперкифоз с клиновидной деформацией',
    default_side: 'central',
    complaints_template: 'Выраженная сутулость («круглая спина»), боли и усталость в грудном отделе позвоночника после уроков или стояния, невозможность полностью выпрямить спину.',
    anamnesis_template: 'Мальчик 13–16 лет, сутулость нарастает последние 2 года.',
    objective_template: 'Ригидный грудной гиперкифоз (угол кифоза > 45°). При попытке разогнуться или лечь на твердую кушетку кифотическая дуга сохраняется. Укорочение грудных мышц и хамстринг-мышц. Пальпаторная болезненность остистых отростков Th7–Th10.',
    recommendations_template: '1. Боковая рентгенография грудного отдела позвоночника стоя (выявление клиновидной деформации >=3 смежных позвонков >5°, узлов Шморля и неровности замыкательных пластинок).\n2. ЛФК на разгибание грудного отдела и растяжку пекторальных мышц.\n3. Плавание на спине.\n4. При угле кифоза > 60° — реклинирующий корсет.',
    rom_norm_preset: { flexion_active: 50, extension_deficit: 15, rotation_left: 30, rotation_right: 30 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_spine_thoracic', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Истмический спондилолистез L5–S1 I–II степени со стенозом',
    joint_name: 'spine',
    default_mkb_code: 'M43.1',
    category: 'Дорсопатии и патология позвоночника',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Спондилолиз со смещением позвонка до 25–50%',
    default_side: 'central',
    complaints_template: 'Хронические боли в нижнем отделе поясницы, усиливающиеся при прогибе назад (гиперэкстензии) и длительном стоянии. Натяжение задней поверхности бедер.',
    anamnesis_template: 'В анамнезе занятия гимнастикой, фигурным катанием или тяжелой атлетикой.',
    objective_template: 'Пальпаторный симптом «порога» или «ступеньки» остистого отростка L5 за счет смещения тела L5 кпереди над крестцом S1. Выраженная ригидность и натяжение седалищно-подколенных мышц (хамстринг-синдром). Тест разгибания на одной ноге (Stork test) резко усиливает боль в пояснице.',
    recommendations_template: '1. Функциональная рентгенография поясничного отдела с максимальным сгибанием и разгибанием для оценки нестабильности.\n2. КТ/МРТ пояснично-крестцового отдела.\n3. Укрепление мышц кора (брюшного пресса и ягодиц), исключение гиперэкстензий позвоночника.\n4. При нестабильности и прогрессировании смещения — транспедикулярная фиксация.',
    rom_norm_preset: { flexion_active: 40, extension_deficit: 15, lateral_flexion_left: 20, lateral_flexion_right: 20 },
    tests: [
      { test_code: 'stork_test', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_spine_lumbar_flex', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_spine_lumbar', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    existing_id: 24,
    title: 'Спинальный стеноз поясничного отдела с перемежающейся хромотой',
    joint_name: 'spine',
    default_mkb_code: 'M48.0',
    category: 'Дорсопатии и патология позвоночника',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Нейрогенная перемежающаяся хромота',
    default_side: 'bilateral',
    complaints_template: 'Тяжесть, онемение и тянущая боль в обеих ногах, возникающие строго после 150–200 метров ходьбы или стояния. Пациент вынужден присесть или наклониться вперед («поза тележки в супермаркете» — shopping cart sign), после чего боли быстро стихают. Спокойно едет на велосипеде без боли.',
    anamnesis_template: 'Пациент пожилого возраста, дистанция безболевой ходьбы постепенно сокращается на протяжении 2 лет.',
    objective_template: 'Пульсация на артериях стоп сохранена с обеих сторон (дифференциация с сосудистой перемежающейся хромотой). Боль провоцируется разгибанием поясницы (уменьшение объема позвоночного канала) и полностью исчезает при наклоне вперед. Неврологический дефицит появляется только после ходьбы.',
    recommendations_template: '1. МРТ пояснично-крестцового отдела позвоночника (измерение сагиттального размера дурального мешка < 10 мм, гипертрофия желтых связок и фасеточных суставов).\n2. Ношение ортопедической обуви, использование ходунков или трости с наклоном вперед.\n3. Эпидуральные блокады со стероидами.\n4. При резком ограничении ходьбы — декомпрессивная ламинэктомия.',
    rom_norm_preset: { flexion_active: 50, extension_deficit: 15, lateral_flexion_left: 15, lateral_flexion_right: 15 },
    tests: [
      { test_code: 'shopping_cart_test', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'kemp_quadrant', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_spine_lumbar', urgency: 'urgent', default_side: 'central', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_veins_lower', urgency: 'routine', default_side: 'bilateral', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 25,
    title: 'Синдром Титце (реберный хондрит II–IV ребер)',
    joint_name: 'spine',
    default_mkb_code: 'M94.0',
    category: 'Воспалительные и аутоиммунные артропатии',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Асептическое воспаление реберных хрящей',
    default_side: 'right',
    complaints_template: 'Острая локальная боль в переднем отделе грудной клетки слева или справа от грудины, усиливающаяся при глубоком вдохе, кашле, чихании и нажатии пальцем. Пациент испытывает страх инфаркта миокарда.',
    anamnesis_template: 'Появилась после перенесенной респираторной инфекции с приступами сильного кашля или после интенсивных отжиманий.',
    objective_template: 'Резкая локальная пальпаторная болезненность и веретенообразное плотное припухание в месте прикрепления II или III реберного хряща к грудине. ЭКГ без ишемических изменений. Пальпация межреберных нервов безболезненна.',
    recommendations_template: '1. ЭКГ и рентгенография ОГК для исключения соматической патологии.\n2. Локальная инфильтрация реберно-грудинного сочленения анестетиком с ГКС под УЗИ (быстрое купирование боли).\n3. НПВП системно коротким курсом 5–7 дней.\n4. Ограничение нагрузок на грудные мышцы.',
    rom_norm_preset: { flexion_active: 60, extension_deficit: 0, rotation_left: 35, rotation_right: 35 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'us_joint_soft', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Кокцигодиния (хронический болевой синдром копчика)',
    joint_name: 'spine',
    default_mkb_code: 'M53.3',
    category: 'Дорсопатии и патология позвоночника',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, деформации, стеноз',
    stage_or_severity: 'Хроническая посттравматическая кокцигодиния',
    default_side: 'central',
    complaints_template: 'Мучительная ноющая боль в области копчика при сидении на твердом стуле, особенно при отклонении корпуса назад, и в момент вставания со стула.',
    anamnesis_template: 'Падение на ягодицы («на копчик») зимой на льду или травматичные роды несколько месяцев назад.',
    objective_template: 'Резкая болезненность при пальпации верхушки копчика и крестцово-копчикового сочленения. Патологическая подвижность или ригидная деформация копчика при ректально-пальцевом исследовании.',
    recommendations_template: '1. Прицельная рентгенография копчика сидя и стоя (динамическая оценка гипермобильности или подвывиха копчика).\n2. Использование ортопедической подушки для сидения с U-образным вырезом под копчик (кольцо для сидения).\n3. Блокада крестцово-копчикового сочленения и непарного ганглия (ganglion impar).\n4. Физиотерапия (магнитотерапия, УВТ).',
    rom_norm_preset: { flexion_active: 60, extension_deficit: 0, rotation_left: 35, rotation_right: 35 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_spine_coccyx', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_spine_lumbar', urgency: 'routine', default_side: 'central', is_primary: 0, sort_order: 20 }
    ]
  },

  // =========================================================================
  // КЛАСТЕР 8: ОСТЕОХОНДРОПАТИИ И ЮВЕНИЛЬНАЯ ОРТОПЕДИЯ (5 шаблонов)
  // =========================================================================
  {
    title: 'Остеохондропатия бугристости большеберцовой кости (Осгуд-Шлаттера)',
    joint_name: 'knee',
    default_mkb_code: 'M92.5',
    category: 'Остеохондропатии и ювенильная ортопедия',
    cluster_id: 'cluster_pediatric',
    cluster_name: 'Остеохондропатии и ювенильная ортопедия',
    stage_or_severity: 'Подострый апофизит бугристости',
    default_side: 'right',
    complaints_template: 'Болезненная «шишка» под коленом, острая боль при беге, прыжках, подъеме по лестнице и стоянии на коленях.',
    anamnesis_template: 'Подросток 11–15 лет, активно занимается футболом, баскетболом или легкой атлетикой.',
    objective_template: 'Локальное костное выпячивание, отек и резкая болезненность при пальпации бугристости большеберцовой кости. Натяжение связки надколенника при пассивном максимальном сгибании колена и разгибание голени против сопротивления провоцируют типичную боль. Суставная щель безболезненна.',
    recommendations_template: '1. Временное снижение спортивных ударных и прыжковых нагрузок.\n2. Ношение подпателлярного ремешка (бандажа на связку надколенника) при активности.\n3. Холод местно после тренировок, растяжка четырехглавой мышцы бедра.\n4. УЗИ или рентгенография коленного сустава в боковой проекции для оценки фрагментации апофиза.',
    rom_norm_preset: { flexion_active: 135, flexion_passive: 140, extension_deficit: 0 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'us_knee', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_knee_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Апофизит пяточной кости (болезнь Севера / Хаглунда-Шинца)',
    joint_name: 'ankle',
    default_mkb_code: 'M92.8',
    category: 'Остеохондропатии и ювенильная ортопедия',
    cluster_id: 'cluster_pediatric',
    cluster_name: 'Остеохондропатии и ювенильная ортопедия',
    stage_or_severity: 'Ювенильный тракционный апофизит',
    default_side: 'bilateral',
    complaints_template: 'Боль в пятках при ходьбе и беге, ребенок хромает или ходит на цыпочках, чтобы не наступать на пятки.',
    anamnesis_template: 'Ребенок 8–12 лет, начало занятий в спортивной секции или скачок роста.',
    objective_template: 'Положительный пяточный компрессионный тест (Squeeze test of the heel) — сдавление пяточной кости с боков вызывает резкую боль. Пальпация прикрепления ахиллова сухожилия болезненна. Контуры сустава сохранны.',
    recommendations_template: '1. Использование мягких силиконовых подпяточников (чашечек для пятки — heel cups) в обувь.\n2. Временное ограничение бега и прыжков.\n3. Растяжка икроножных мышц и ахиллова сухожилия.\n4. Заболевание доброкачественное, проходит самостоятельно по мере закрытия зоны роста.',
    rom_norm_preset: { dorsal_flexion: 15, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_foot_calcaneus', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Остеохондропатия ладьевидной кости стопы (болезнь Келлера I)',
    joint_name: 'ankle',
    default_mkb_code: 'M92.6',
    category: 'Остеохондропатии и ювенильная ортопедия',
    cluster_id: 'cluster_pediatric',
    cluster_name: 'Остеохондропатии и ювенильная ортопедия',
    stage_or_severity: 'Асептический некроз ладьевидной кости стопы',
    default_side: 'right',
    complaints_template: 'Припухлость по внутреннему краю тыла стопы, ребенок прихрамывает, наступая на наружный край стопы.',
    anamnesis_template: 'Мальчик 4–8 лет, хромота появилась без травмы около месяца назад.',
    objective_template: 'Локальный отек и болезненность при пальпации ладьевидной кости у внутреннего продольного свода стопы. Пассивные супинационные движения стопы безболезненны.',
    recommendations_template: '1. Рентгенография стоп в 2 проекциях (уплощение, склероз и фрагментация ладьевидной кости — симптом «серебряной монеты»).\n2. Разгрузка стопы, супинаторы с поддержкой продольного свода.\n3. При выраженных болях — иммобилизация гипсовой лонгетой на 3–4 недели.',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_foot_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Остеохондропатия головок плюсневых костей (болезнь Келлера II)',
    joint_name: 'ankle',
    default_mkb_code: 'M92.7',
    category: 'Остеохондропатии и ювенильная ортопедия',
    cluster_id: 'cluster_pediatric',
    cluster_name: 'Остеохондропатии и ювенильная ортопедия',
    stage_or_severity: 'Аваскулярный некроз головки II–III плюсневой кости',
    default_side: 'right',
    complaints_template: 'Боль под подушечками пальцев стопы при ходьбе и отталкивании носком, припухлость на тыле переднего отдела стопы.',
    anamnesis_template: 'Девочка-подросток 12–16 лет, танцы или ношение обуви на каблуке.',
    objective_template: 'Локальная болезненность и утолщение головки II (реже III) плюсневой кости. Осевая компрессия соответствующего пальца вызывает резкую боль в плюснефаланговом суставе.',
    recommendations_template: '1. Рентгенография переднего отдела стопы (уплощение и остеопороз суставной поверхности головки плюсневой кости).\n2. Ортопедические стельки с разгрузкой плюсневых головок.\n3. Обувь с жесткой подошвой и перекатом.',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_foot_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    title: 'Дисплазия тазобедренных суставов у детей до 1 года (скрининг по Graf)',
    joint_name: 'hip',
    default_mkb_code: 'Q65.8',
    category: 'Врожденные аномалии и деформации',
    cluster_id: 'cluster_pediatric',
    cluster_name: 'Остеохондропатии и ювенильная ортопедия',
    stage_or_severity: 'Тип IIa/IIb по Графу (задержка оссификации)',
    default_side: 'bilateral',
    complaints_template: 'Плановый скрининговый осмотр ребенка в возрасте 1–3 месяцев. Асимметрия кожных складок на бедрах.',
    anamnesis_template: 'Факторы риска: ягодичное предлежание плода, женский пол, отягощенная наследственность по ДТБС.',
    objective_template: 'Асимметрия ягодичных и бедренных складок. Ограничение отведения бедер (менее 60°). Симптом соскальзывания/щелчка Ортолани-Барлоу сомнительный.',
    recommendations_template: '1. Срочное УЗИ тазобедренных суставов по методике Графа с измерением углов альфа и бета.\n2. Широкое пеленание или ношение профилактических штанишек / подушки Фрейка при подтверждении дисплазии.\n3. Контрольный осмотр детского ортопеда через 1 месяц.',
    rom_norm_preset: { flexion_active: 130, abduction: 65, internal_rotation: 40, external_rotation: 45 },
    tests: [
      { test_code: 'ortolani_barlow', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_hip_graf', urgency: 'urgent', default_side: 'bilateral', is_primary: 1, sort_order: 10 }
    ]
  },

  // =========================================================================
  // КЛАСТЕР 9: СИСТЕМНЫЕ И МЕТАБОЛИЧЕСКИЕ СИНДРОМЫ (5 шаблонов)
  // =========================================================================
  {
    title: 'Сенильный и постменопаузальный остеопороз (высокий риск переломов, FRAX)',
    joint_name: 'spine',
    default_mkb_code: 'M81.0',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_systemic',
    cluster_name: 'Системные, метаболические и нейродистрофические синдромы',
    stage_or_severity: 'Тяжелый остеопороз (T-score < -2.5)',
    default_side: 'central',
    complaints_template: 'Снижение роста на 4 см за последние 3 года, прогрессирующая сутулость («вдовий горб»), ноющие боли в спине при стоянии, перелом лучевой кости при падении с высоты роста в анамнезе.',
    anamnesis_template: 'Женщина в постменопаузе старше 65 лет. Расчет FRAX показывает 10-летний риск основных переломов > 20%.',
    objective_template: 'Грудной гиперкифоз, сближение реберных дуг с гребнями подвздошных костей. Болезненность при легкой перкуссии остистых отростков позвонков.',
    recommendations_template: '1. Двухэнергетическая рентгеновская денситометрия (DEXA) поясничного отдела позвоночника и проксимального отдела бедра.\n2. Рентгенография грудного и поясничного отделов позвоночника в боковой проекции для выявления бессимптомных компрессионных переломов.\n3. Лабораторная панель: 25-OH витамин D, паратгормон, ионизированный Ca, маркер резорбции CTx.\n4. Назначение базисной антирезорбтивной терапии (бисфосфонаты — золедроновая кислота / деносумаб) под контролем ревматолога/эндокринолога.',
    rom_norm_preset: { flexion_active: 45, extension_deficit: 10, rotation_left: 25, rotation_right: 25 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'densitometry_dexa', urgency: 'urgent', default_side: 'central', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_spine_thoracolumbar', urgency: 'routine', default_side: 'central', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'lab_bone_metabolism', urgency: 'routine', default_side: 'systemic', is_primary: 1, sort_order: 30 }
    ]
  },
  {
    title: 'Острый подагрический артрит I плюснефалангового сустава',
    joint_name: 'ankle',
    default_mkb_code: 'M10.0',
    category: 'Воспалительные и аутоиммунные артропатии',
    cluster_id: 'cluster_systemic',
    cluster_name: 'Системные, метаболические и нейродистрофические синдромы',
    stage_or_severity: 'Острый подагрический приступ (подагра)',
    default_side: 'right',
    complaints_template: 'Внезапная нестерпимая жгучая, «грызущая» боль в области основания первого пальца стопы, начавшаяся среди ночи. Пациент не может переносить даже прикосновение простыни («симптом простыни»).',
    anamnesis_template: 'Приступу предшествовало употребление мясной жирной пищи и алкоголя накануне вечером.',
    objective_template: 'Первый плюснефаланговый сустав резко увеличен в объеме, выраженная гиперемия кожи с багрово-синюшным оттенком, отек и местный гипертермический жар. Любая пальпация и малейшие движения невозможны из-за жестокой боли.',
    recommendations_template: '1. Анализ крови на мочевую кислоту (внимание: в острый приступ уровень может быть псевдонормальным!), СРБ, креатинин.\n2. УЗИ сустава: симптом «двойного контура» (отложение кристаллов моноурата натрия на хряще).\n3. Купирование приступа: колхицин по схеме (1 мг сразу + 0.5 мг через час) или терапевтические дозы НПВП (Эторикоксиб 120 мг).\n4. Категорически не начинать прием аллопуринола во время острого приступа!\n5. Диета со строгим исключением пуринов и алкоголя.',
    rom_norm_preset: { dorsal_flexion: 5, plantar_flexion: 10, supination: 10, pronation: 10 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'us_ankle', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'lab_uric_acid', urgency: 'urgent', default_side: 'systemic', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'xray_foot_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 30 }
    ]
  },
  {
    title: 'Серонегативный полиартрит мелких суставов кистей и стоп',
    joint_name: 'wrist',
    default_mkb_code: 'M06.0',
    category: 'Воспалительные и аутоиммунные артропатии',
    cluster_id: 'cluster_systemic',
    cluster_name: 'Системные, метаболические и нейродистрофические синдромы',
    stage_or_severity: 'Ранний полиартрит, дебют заболевания',
    default_side: 'bilateral',
    complaints_template: 'Симметричные боли и припухлость в суставах пальцев кистей и стоп, утренняя скованность длительностью более 1 часа, невозможность сжать кулаки по утрам.',
    anamnesis_template: 'Симптомы нарастают на протяжении 2–3 месяцев.',
    objective_template: 'Симметричный синовит II–III пястно-фаланговых и проксимальных межфаланговых суставов кистей («веретенообразные пальцы»). Тест поперечного сжатия кисти (Squeeze test) резко положителен с обеих сторон.',
    recommendations_template: '1. Лабораторная ревматологическая панель: АЦЦП (анти-ССР), ревматоидный фактор, СРБ, СОЭ.\n2. Рентгенография кистей и стоп в прямой проекции (поиск ранних эрозий суставных поверхностей).\n3. УЗИ суставов кистей с энергетическим допплером (выявление активного васкуляризованного паннуса).\n4. Срочное направление к ревматологу для назначения базисной терапии (метотрексат).',
    rom_norm_preset: { dorsal_flexion: 50, palmar_flexion: 50, radial_deviation: 15, ulnar_deviation: 20 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'lab_rheumo_panel', urgency: 'urgent', default_side: 'systemic', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_hand_2v', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'us_wrist', urgency: 'routine', default_side: 'bilateral', is_primary: 0, sort_order: 30 }
    ]
  },
  {
    title: 'Синдром гипермобильности суставов (шкала Бейтона >= 5/9)',
    joint_name: 'spine',
    default_mkb_code: 'M35.7',
    category: 'Деформации стопы и приобретенные аномалии',
    cluster_id: 'cluster_systemic',
    cluster_name: 'Системные, метаболические и нейродистрофические синдромы',
    stage_or_severity: 'Генерализованная гипермобильность суставов (GJH)',
    default_side: 'bilateral',
    complaints_template: 'Частые подворачивания суставов, привычные подвывихи надколенника и плеча, генерализованные мышечно-суставные боли к вечеру, щелчки во всех суставах.',
    anamnesis_template: 'Молодая пациентка, с детства отмечала необычайную гибкость («гуттаперчевый ребенок»), частые растяжения связок.',
    objective_template: 'Шкала гипермобильности Бейтона (Beighton score) 7 баллов из 9: переразгибание мизинцев > 90°, пассивное приведение I пальца к предплечью, переразгибание локтей > 10°, переразгибание коленей > 10° (genu recurvatum), наклон вперед с касанием пола ладонями при прямых коленях. Кожа гиперэластичная.',
    recommendations_template: '1. Исключение предельных растяжек и стретчинга (йога/гимнастика не показаны!).\n2. Тренировка стабильности и глубоких стабилизирующих мышц (пилатес, изометрические упражнения).\n3. Ношение поддерживающих ортезов на нестабильные суставы при физических нагрузках.\n4. Курсы препаратов магния и поддержка метаболизма соединительной ткани.',
    rom_norm_preset: { flexion_active: 60, extension_deficit: 0, rotation_left: 40, rotation_right: 40 },
    tests: [
      { test_code: 'beighton_score', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'densitometry_dexa', urgency: 'routine', default_side: 'central', is_primary: 0, sort_order: 10 }
    ]
  },
  {
    title: 'Комплексный регионарный болевой синдром (КРБС I типа / синдром Зудека)',
    joint_name: 'wrist',
    default_mkb_code: 'G90.5',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_systemic',
    cluster_name: 'Системные, метаболические и нейродистрофические синдромы',
    stage_or_severity: 'I–II стадия (дистрофическая / вазомоторная)',
    default_side: 'right',
    complaints_template: 'Мучительная жгучая, распирающая боль в кисти/стопе, несоразмерная перенесенной травме. Отечность конечности, изменение цвета кожи (мраморность, синюшность), гипергидроз ладони, аллодиния — боль от легкого дуновения воздуха или прикосновения одежды.',
    anamnesis_template: 'Развился через 4–6 недель после неосложненного перелома лучевой кости или лодыжки.',
    objective_template: 'Диффузный плотный отек кисти, пальцы имеют сосискообразный вид. Кожа блестящая, истонченная, местная температура повышена/понижена. Резкая гипералгезия и аллодиния. Активные движения пальцев резко ограничены из-за боли.',
    recommendations_template: '1. Трехфазная остеосцинтиграфия или рентгенография (выявление пятнистого пятнистого остеопороза Зудека).\n2. Мультимодальное обезболивание: габапентиноиды, короткий курс ГКС, бисфосфонаты (купируют отек костного мозга).\n3. Зеркальная терапия (Mirror therapy) и десенситизация кожи мягкими тканями.\n4. Бережная разработка движений без преодоления острой боли.',
    rom_norm_preset: { dorsal_flexion: 25, palmar_flexion: 25, radial_deviation: 10, ulnar_deviation: 10 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_wrist_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'densitometry_dexa', urgency: 'routine', default_side: 'central', is_primary: 0, sort_order: 20 }
    ]
  }
];

module.exports = { part4Templates };
