/**
 * Clinical Templates 2.0 - Part 2: Clusters 3 & 4
 * Cluster 3: Hip & Pelvis (12 items)
 * Cluster 4: Foot & Ankle (16 items)
 * Total: 28 items
 */

const part2Templates = [
  // =========================================================================
  // КЛАСТЕР 3: ТАЗОБЕДРЕННЫЙ СУСТАВ, ТАЗ И КПС (12 шаблонов)
  // =========================================================================
  {
    existing_id: 8,
    title: 'Первичный коксартроз II стадии с дефицитом внутренней ротации',
    joint_name: 'hip',
    default_mkb_code: 'M16.1',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'II стадия, умеренное ограничение ротации',
    default_side: 'right',
    complaints_template: 'Ноющие боли в паховой области и по передней поверхности бедра при ходьбе и вставании со стула. Трудности при надевании носков и обуви (ограничение сгибания и внутренней ротации). Стартовая боль до 15 минут.',
    anamnesis_template: 'Боли прогрессируют на протяжении 2 лет. Физиотерапия и НПВП давали временное облегчение. Хромота усилилась за последние 3 месяца.',
    objective_template: 'Походка щадящая на правую ногу. Пальпация области проекции шейки бедра кпереди умеренно болезненна. Ограничение внутренней ротации правого ТБС до 10° (норма 35°), сгибание 95°. Положительный тест FABER (Патрика) и симптом Тренделенбурга при нагрузке.',
    recommendations_template: '1. Разгрузка сустава тростью в контралатеральной руке при длительной ходьбе.\n2. Внутрисуставное введение препарата гиалуроновой кислоты высокой плотности под УЗИ-контролем.\n3. ЛФК в бассейне без осевой нагрузки.\n4. Курс системных НПВП и хондропротекторов.',
    rom_norm_preset: { flexion_active: 95, flexion_passive: 105, internal_rotation: 10, external_rotation: 30, abduction: 25, adduction: 20 },
    tests: [
      { test_code: 'faber_patrick', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'trendelenburg', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'thomas_test', expected_result: 'positive', is_mandatory: 0, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_pelvis_ap', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_hip_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'mri_hip_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 30 }
    ]
  },
  {
    title: 'Двусторонний деформирующий коксартроз III ст. (предоперационный)',
    joint_name: 'hip',
    default_mkb_code: 'M16.0',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'III стадия, выраженная контрактура',
    default_side: 'bilateral',
    complaints_template: 'Постоянные боли в обоих тазобедренных суставах и паховых областях в покое, при ходьбе и ночью. Резкое ограничение самообслуживания, дистанция безболевой ходьбы менее 100 метров, выраженная хромота.',
    anamnesis_template: 'Страдает коксартрозом более 7 лет. Консервативная терапия исчерпана, болевой синдром персистирует.',
    objective_template: 'Утиная хромота. Выраженная сгибательно-приводящая контрактура обоих ТБС. Сгибание справа 70°, слева 75°. Ротационные движения практически отсутствуют (анкилозирование). Атрофия ягодичных мышц и мышц бедер.',
    recommendations_template: '1. Показано тотальное эндопротезирование тазобедренного сустава в плановом порядке.\n2. Дообследование: обзорная рентгенография таза с захватом обоих ТБС, ЭКГ, УЗДГ вен нижних конечностей.\n3. Разгрузка двумя костылями.\n4. Симптоматическая анальгезия.',
    rom_norm_preset: { flexion_active: 70, flexion_passive: 75, internal_rotation: 0, external_rotation: 10, abduction: 15, adduction: 10 },
    tests: [
      { test_code: 'faber_patrick', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'trendelenburg', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_pelvis_ap', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_veins_lower', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'densitometry_dexa', urgency: 'routine', default_side: 'central', is_primary: 0, sort_order: 30 }
    ]
  },
  {
    existing_id: 11,
    title: 'Вертлужный трохантерит (большой вертельный бурсит)',
    joint_name: 'hip',
    default_mkb_code: 'M70.6',
    category: 'Бурситы и синовиты',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Подострый энтезобурсит',
    default_side: 'right',
    complaints_template: 'Жгучая боль по наружной поверхности правого бедра в проекции большого вертела, усиливается в положении лежа на правом боку, при подъеме по лестнице и отведении ноги.',
    anamnesis_template: 'Считает себя больным около месяца, обострение связывает с длительной пешей прогулкой по пересеченной местности.',
    objective_template: 'Резкая локальная пальпаторная болезненность верхушки и заднего края большого вертела бедренной кости. Пассивные движения в ТБС свободны и безболезненны. Боль провоцируется активным отведением бедра против сопротивления.',
    recommendations_template: '1. Локальная блокада вертельной сумки ГКС с анестетиком под контролем УЗИ.\n2. Фокусированная УВТ трохантерной зоны №4–5.\n3. Растяжка илиотибиального тракта и укрепление ягодичных мышц.',
    rom_norm_preset: { flexion_active: 120, flexion_passive: 125, internal_rotation: 35, external_rotation: 45, abduction: 45, adduction: 30 },
    tests: [
      { test_code: 'ober', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'faber_patrick', expected_result: 'negative', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_hip', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_hip_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 111,
    title: 'Энтезопатия (тендинит) ТФЛ, ягодичных мышц',
    joint_name: 'hip',
    default_mkb_code: 'M76.0',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Хронический вертельный болевой синдром (GTPS), энтезопатия ТФЛ',
    default_side: 'right',
    sort_order: 315,
    complaints_template: 'Тянущие и ноющие боли по наружной поверхности тазобедренного сустава в проекции большого вертела, распространяющиеся вниз по наружной поверхности бедра по ходу подвздошно-большеберцового тракта (напрягателя широкой фасции бедра — ТФЛ) до коленного сустава, а также вверх в верхне-наружный квадрант ягодичной области. Боли усиливаются при ходьбе, подъеме по лестнице, переходе из положения сидя в положение стоя, при длительном сидении с перекрещенными ногами. Характерен выраженный дискомфорт и невозможность спать на больном боку ночью из-за контактного давления на большой вертел («симптом подушки»). Стартовая скованность после периодов покоя до 10–15 минут.',
    anamnesis_template: 'Считает себя больным около 3–5 месяцев, когда впервые после интенсивной ходьбы и непривычной физической нагрузки появились неприятные тянущие ощущения по латеральной поверхности бедра. Постепенно боли приобрели постоянный характер, стали беспокоить по ночам при сне на боку. Самостоятельный прием НПВП и нанесение согревающих гелей приносили лишь временный эффект. Травмы области сустава отрицает. В последнее время отмечает усиление болей при быстрой ходьбе и подъеме по ступеням, появление чувства напряжения по наружной поверхности бедра.',
    anamnesis_vitae_template: 'Аллергологический анамнез: не отягощен, лекарственную непереносимость отрицает. Сопутствующая патология: остеохондроз пояснично-крестцового отдела позвоночника, нарушение мышечного баланса тазового пояса, продольно-поперечное плоскостопие. Травмы и операции в области таза и нижних конечностей: отрицает. Профессиональная деятельность: длительные статические нагрузки (сидячая работа / пребывание на ногах). Физическая активность: умеренная, пешие прогулки. Вредные привычки: не курит.',
    objective_status_template: 'Общее состояние удовлетворительное. Сознание ясное, контактен, ориентирован. Телосложение нормостеническое. Кожные покровы чистые, физиологической окраски, периферических отеков голеней и стоп нет. Походка с элементами анталгического щажения пораженной нижней конечности, укорочение опорной фазы шага. Осанка: умеренная асимметрия тазового пояса за счет напряжения мышц поясницы и отводящих мышц бедра. Физиологические изгибы позвоночника сохранены.',
    objective_template: 'Область тазобедренного сустава правильной конфигурации, отека и локальной гиперемии нет.\nПальпация:\n1. Резкая локальная болезненность в точках прикрепления сухожилий средней и малой ягодичных мышц (m. gluteus medius, m. gluteus minimus) к задне-верхней и латеральной фасеткам большого вертела бедренной кости.\n2. Пальпаторная болезненность и гипертонус проксимального брюшка напрягателя широкой фасции бедра (m. tensor fasciae latae — ТФЛ) у передней верхней ости подвздошной кости (ASIS) и по ходу илиотибиального тракта по наружной поверхности бедра с триггерными уплотнениями.\n3. Феномен «щелкающего бедра» (соха saltans externa) при активном сгибании-разгибании бедра.\nФункциональные и клинические пробы:\n- Тест Обера (Ober\'s test) положительный: натяжение и укорочение илиотибиального тракта и ТФЛ.\n- Тест Нобеля (Noble ITB test) положительный вдоль латеральной фасции.\n- Тест отведения бедра против сопротивления (Resisted Abduction Test) резко положителен с воспроизведением типичной боли в зоне большого вертела.\n- Боль при форсированном пассивном приведении согнутого бедра (провокация натяжения ТФЛ и ягодичных мышц).\n- Тест Тренделенбурга слабоположительный при утомлении.\n- Внутрисуставные тесты (FABER, FADIR, осевая компрессия по оси шейки бедра) — отрицательные.',
    recommendations_template: '1. Ортопедический и двигательный режим: разгрузка конечности, исключение глубоких приседаний, бега, длительной ходьбы по лестницам. Исключить сидение с перекрещенными ногами («нога на ногу»). Для сна рекомендовано положение на спине либо на противоположном здоровом боку с ортопедической подушкой между коленями (для устранения натяжения ТФЛ и ягодичных сухожилий).\n2. Медикаментозное лечение:\n   - НПВП системно: нимесулид 100 мг 2 р/сут или ацеклофенак 100 мг 2 р/сут в течение 7–10 дней после еды (под защитой омепразола 20 мг);\n   - Миорелаксанты: толперизон 150 мг 2–3 р/сут курсом 10–14 дней для снятия гипертонуса ТФЛ и грушевидной мышцы;\n   - Местная терапия: аппликации гелей с НПВП (кетопрофен / диклофенак) 3 раза в день.\n3. Локальная интервенционная терапия:\n   - Локальная лечебно-медикаментозная блокада зоны энтезиса большого вертела и перифасциального пространства ТФЛ под контролем УЗИ (микрокристаллический ГКС дипроспан 1.0 мл + анестетик наропин 0.5% 4.0 мл);\n   - При хронизации — курс аутологичной PRP-терапии (обогащенная тромбоцитами плазма) перитендиально №2–3;\n   - Периартикулярное введение препаратов коллагена (Guna MD-Hip / Плексатрон).\n4. Физиотерапия и регенерация:\n   - Экстракорпоральная ударно-волновая терапия (УВТ) области большого вертела и проксимальной части илиотибиального тракта №5–6 с интервалом 5–7 дней (метод выбора при энтезопатиях и GTPS);\n   - Лазеротерапия высокой интенсивности (HILT) или магнитотерапия высокой интенсивности (SIS).\n5. ЛФК и реабилитация (после купирования острого болевого синдрома):\n   - Постизометрическая релаксация (ПИР) ТФЛ, большой и средней ягодичных мышц;\n   - Миофасциальный релиз (МФР) наружной поверхности бедра валиком (без прямого давления на костный вертел);\n   - Укрепление глубоких ротаторов таза и стабилизаторов кора.\n6. Коррекция биомеханики: консультация для подбора индивидуальных ортопедических стелек при наличии гиперпронации стопы.\n7. Контрольный осмотр ортопеда через 14 дней.',
    special_studies_template: 'УЗИ мягких тканей тазобедренного сустава и зоны большого вертела: контуры кортикального слоя большого вертела неровные, микроэнтезофиты до 1.5 мм. Сухожилия средней и малой ягодичных мышц утолщены, сниженной эхогенности с нарушением фибриллярной структуры (тендиноз), признаки умеренного реактивного трохантерного бурсита (жидкость в подвертельной сумке 2.3 мм). Проксимальный отдел ТФЛ и подвздошно-большеберцового тракта утолщен с отеком паратенона.\nМРТ тазобедренного сустава: признаки умеренного тендиноза и парциального микроразволокнения сухожилий gluteus medius/minimus у места прикрепления к большому вертелу (картина вертельного болевого синдрома — GTPS), перитендинит ТФЛ. Костно-деструктивных изменений головки и вертлужной впадины не выявлено, контуры суставного хряща сохранны.',
    performed_manipulations_template: 'Асептическая обработка операционного поля раствором бетадина трижды. Под контролем УЗИ-навигации (линейный датчик 12 МГц) визуализированы сухожилия средней ягодичной мышцы и область вертельной сумки. Под местной инфильтрационной анестезией Sol. Lidocaini 1% - 3.0 мл выполнена прицельная параэнтезиальная блокада: введено микрокристаллическая суспензия бетаметазона (дипроспан) 1.0 мл в сочетании с раствором ропивакаина (наропин 0.5%) 4.0 мл. Введение свободное, пациент отметил быстрое регрессирование локальной пальпаторной болезненности на 75%. Наложена асептическая наклейка. Даны строгие рекомендации по ограничению физических нагрузок на 48 часов.',
    rom_norm_preset: { flexion_active: 120, flexion_passive: 125, internal_rotation: 35, external_rotation: 45, abduction: 35, adduction: 20 },
    tests: [
      { test_code: 'ober', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'trendelenburg', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'noble_itb', expected_result: 'positive', is_mandatory: 1, sort_order: 30 },
      { test_code: 'faber', expected_result: 'negative', is_mandatory: 0, sort_order: 40 },
      { test_code: 'fadir', expected_result: 'negative', is_mandatory: 0, sort_order: 50 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_hip_trochanter', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_hip', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'xray_pelvis_hip', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 30 }
    ]
  },
  {
    title: 'Феморо-ацетабулярный импинджмент (FAI, Cam/Pincer)',
    joint_name: 'hip',
    default_mkb_code: 'M24.8',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Ранняя предкоксартрозная стадия',
    default_side: 'right',
    complaints_template: 'Глубокая боль в паху при длительном сидении в глубоком кресле или за рулем («симптом С»), щелчки и заклинивание при глубоких приседаниях и разворотах на ноге.',
    anamnesis_template: 'Молодой пациент, занимается кроссфитом/единоборствами. Боли беспокоят около года.',
    objective_template: 'Симптом импинджмента FADIR (сгибание 90°, приведение и форсированная внутренняя ротация) вызывает резкую паховую боль. Сгибание ТБС ограничено до 105° из-за боли.',
    recommendations_template: '1. Рентгенография ТБС в проекции Данна (Dunn view) для измерения альфа-угла.\n2. МР-артрография ТБС для исключения разрыва вертлужной губы.\n3. Избегание положений экстремального сгибания и ротации бедра.\n4. Консультация артроскописта ТБС.',
    rom_norm_preset: { flexion_active: 105, flexion_passive: 110, internal_rotation: 15, external_rotation: 40, abduction: 35, adduction: 25 },
    tests: [
      { test_code: 'fadir_fai', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'faber_patrick', expected_result: 'negative', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_dunn_view', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_hip_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Асептический некроз головки бедренной кости (АНГБК) I–II ст.',
    joint_name: 'hip',
    default_mkb_code: 'M87.0',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'I–II стадия (доколлаптоидная)',
    default_side: 'right',
    complaints_template: 'Внезапно возникшие интенсивные боли в паховой области и глубине тазобедренного сустава при нагрузке и в покое, усиливающиеся по ночам.',
    anamnesis_template: 'Боли начались 2 месяца назад без предшествующей травмы. В анамнезе: прием глюкокортикоидов или перенесенная вирусная инфекция.',
    objective_template: 'Резкое усиление боли при осевой нагрузке на пятку. Тест Стинчфилда положительный. На рентгенограммах контуры головки бедра сферичны (коллапса нет), на МРТ — выраженный отек костного мозга и демаркационная линия.',
    recommendations_template: '1. Строгая разгрузка конечности костылями (исключение опоры) на 6–8 недель.\n2. Сосудистая и антирезорбтивная терапия (бисфосфонаты/илопрост).\n3. Консультация ортопеда для решения вопроса о туннелизации/декомпрессии очага.',
    rom_norm_preset: { flexion_active: 100, flexion_passive: 110, internal_rotation: 20, external_rotation: 35, abduction: 30, adduction: 20 },
    tests: [
      { test_code: 'stinchfield', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'faber_patrick', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_hip_high', urgency: 'urgent', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_pelvis_ap', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Синдром грушевидной мышцы с компрессией седалищного нерва',
    joint_name: 'hip',
    default_mkb_code: 'G57.0',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Острый компрессионно-ишемический синдром',
    default_side: 'right',
    complaints_template: 'Боль и жжение в глубине правой ягодицы с иррадиацией по задней поверхности бедра до подколенной ямки. Усиливается при сидении на твердой поверхности («симптом бумажника в заднем кармане»).',
    anamnesis_template: 'Длительное вождение автомобиля или сидячая работа. Поясница не беспокоит.',
    objective_template: 'Резкая локальная пальпаторная болезненность в проекции грушевидной мышцы и седалищной вырезки. Тест FAIR (сгибание, приведение и внутренняя ротация) провоцирует типичную иррадиацию боли по ноге. Симптом Ласега отрицателен при разогнутом колене выше 70°.',
    recommendations_template: '1. Блокада грушевидной мышцы с анестетиком и миорелаксантом под УЗИ-контролем.\n2. Миофасциальный релиз ягодичной области.\n3. Миорелаксанты центрального действия и габапентиноиды коротким курсом.',
    rom_norm_preset: { flexion_active: 115, flexion_passive: 120, internal_rotation: 25, external_rotation: 40, abduction: 40, adduction: 25 },
    tests: [
      { test_code: 'fair_piriformis', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'straight_leg_raise', expected_result: 'negative', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_hip_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'enmg_lower', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Двусторонний сакроилеит (дебют спондилоартрита)',
    joint_name: 'hip',
    default_mkb_code: 'M46.1',
    category: 'Воспалительные и аутоиммунные артропатии',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Активная воспалительная фаза',
    default_side: 'bilateral',
    complaints_template: 'Воспалительная боль в ягодицах («перемежающаяся хромота в ягодицах»), пробуждающая во второй половине ночи (под утро). Утренняя скованность в тазу и крестце более 45 минут, уменьшающаяся после физических упражнений.',
    anamnesis_template: 'Молодой пациент до 35 лет. Боли длятся более 3 месяцев. Прием НПВП дает быстрый выраженный эффект.',
    objective_template: 'Локальная болезненность при пальпации и перкуссии проекции крестцово-подвздошных сочленений с обеих сторон. Тесты Генслена и тяги бедра назад (Thigh thrust) резко положительны. Движения в ТБС в полном объеме.',
    recommendations_template: '1. МРТ крестцово-подвздошных суставов (режим STIR для выявления отека костного мозга — остеита).\n2. Анализ крови на HLA-B27, СРБ, СОЭ.\n3. Консультация ревматолога для верификации анкилозирующего спондилита.',
    rom_norm_preset: { flexion_active: 120, flexion_passive: 125, internal_rotation: 35, external_rotation: 45, abduction: 45, adduction: 30 },
    tests: [
      { test_code: 'gaenslen', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'thigh_thrust', expected_result: 'positive', is_mandatory: 1, sort_order: 20 },
      { test_code: 'faber_patrick', expected_result: 'positive', is_mandatory: 1, sort_order: 30 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_si_joints', urgency: 'urgent', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'lab_rheumo_panel', urgency: 'routine', default_side: 'systemic', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Тендинопатия и бурсит подвздошно-поясничной мышцы (Iliopsoas)',
    joint_name: 'hip',
    default_mkb_code: 'M76.1',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Подострый энтезобурсит',
    default_side: 'right',
    complaints_template: 'Глубокая боль в переднем отделе паха и по передней поверхности бедра, усиливающаяся при подъеме выпрямленной ноги, вставании из глубокого приседа и подъеме по лестнице. Ощущение щелчка в суставе («симптом щелкающего бедра»).',
    anamnesis_template: 'Боли появились после интенсивных тренировок на пресс или бега в гору.',
    objective_template: 'Пальпаторная болезненность кнутри от передней верхней ости подвздошной кости и в области малого вертела. Тест Томаса положительный — сгибательная контрактура в ТБС за счет спазма iliopsoas. Активное сгибание бедра против сопротивления резко болезненно.',
    recommendations_template: '1. УЗИ или МРТ сухожилия подвздошно-поясничной мышцы и илеопсоас-бурсы.\n2. Постизометрическая релаксация и растяжка подвздошно-поясничной мышцы.\n3. Локальное введение ГКС в илеопсоас-бурсу при упорном болевом синдроме.',
    rom_norm_preset: { flexion_active: 110, flexion_passive: 115, internal_rotation: 30, external_rotation: 40, abduction: 40, adduction: 25 },
    tests: [
      { test_code: 'thomas_test', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'stinchfield', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_hip', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_hip_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Проксимальная тендинопатия хамстринг-мышц (седалищный бугор)',
    joint_name: 'hip',
    default_mkb_code: 'M76.8',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Хронический проксимальный энтезит',
    default_side: 'right',
    complaints_template: 'Глубокая ноющая боль под ягодицей в проекции седалищного бугра, усиливающаяся при длительном сидении на твердом стуле, беге и наклонах вперед.',
    anamnesis_template: 'Бегун/спринтер, симптомы нарастали в течение нескольких месяцев.',
    objective_template: 'Выраженная болезненность при глубокой пальпации седалищного бугра в месте прикрепления полуперепончатой, полусухожильной и двуглавой мышц. Сгибание голени против сопротивления вызывает типичную боль под ягодицей.',
    recommendations_template: '1. Курс экстракорпоральной ударно-волновой терапии (УВТ) №5.\n2. Эксцентрические тренировки задней группы мышц бедра.\n3. Использование мягкой подушки при длительном сидении.',
    rom_norm_preset: { flexion_active: 120, flexion_passive: 125, internal_rotation: 35, external_rotation: 45, abduction: 45, adduction: 30 },
    tests: [
      { test_code: 'fair_piriformis', expected_result: 'negative', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_hip_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_hip', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Ювенильный остеохондроз головки бедра (болезнь Пертеса)',
    joint_name: 'hip',
    default_mkb_code: 'M91.1',
    category: 'Остеохондропатии и ювенильная ортопедия',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Стадия фрагментации/рассасывания',
    default_side: 'right',
    complaints_template: 'Хромота на правую ногу у ребенка, боли в паху и колене при беге и ходьбе, повышенная утомляемость.',
    anamnesis_template: 'Мальчик 6–9 лет, родители отметили периодическое прихрамывание около 2 месяцев назад.',
    objective_template: 'Хромота типа Тренделенбурга. Ограничение внутренней ротации и отведения в правом ТБС. Мышечная гипотрофия бедра и ягодицы.',
    recommendations_template: '1. Разгрузка пораженного сустава (постельный режим/костыли).\n2. Рентгенография таза в прямой проекции и укладке по Лауэнштейну.\n3. Направление в специализированное детское ортопедическое отделение.',
    rom_norm_preset: { flexion_active: 90, flexion_passive: 100, internal_rotation: 5, external_rotation: 25, abduction: 20, adduction: 15 },
    tests: [
      { test_code: 'trendelenburg', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'faber_patrick', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_pelvis_ap', urgency: 'urgent', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_hip_high', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Вколоченный перелом шейки бедра у пожилых (наблюдение/реабилитация)',
    joint_name: 'hip',
    default_mkb_code: 'S72.0',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    stage_or_severity: 'Подострый период консолидации',
    default_side: 'right',
    complaints_template: 'Умеренная боль в паховой области при попытке осевой нагрузки на ногу, невозможность полноценно ходить без опоры.',
    anamnesis_template: 'Падение с высоты собственного роста 3 недели назад. На первичных снимках вколоченный перелом шейки бедра Garden I.',
    objective_template: 'Укорочения конечности нет. Наружная ротация стопы умеренная. Боль при пальпации области треугольника Скарпа и поколачивании по пятке. Сгибание бедра ограничено до 80° из-за болезненности.',
    recommendations_template: '1. Контрольная рентгенография таза и ТБС в 2 проекциях для исключения вторичного смещения.\n2. Ходьба на ходунках с дозированной разгрузкой конечности.\n3. Профилактика тромбоэмболических осложнений и терапия системного остеопороза.',
    rom_norm_preset: { flexion_active: 80, flexion_passive: 85, internal_rotation: 10, external_rotation: 20, abduction: 20, adduction: 15 },
    tests: [
      { test_code: 'stinchfield', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_pelvis_ap', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_hip_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'densitometry_dexa', urgency: 'routine', default_side: 'central', is_primary: 0, sort_order: 30 }
    ]
  },
  {
    title: 'Амбулаторный контроль после тотального эндопротезирования ТБС',
    joint_name: 'hip',
    default_mkb_code: 'Z96.6',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_postop',
    cluster_name: 'Амбулаторный контроль эндопротезирования и остеосинтеза',
    stage_or_severity: 'Постоперационный контроль (3–6 мес)',
    default_side: 'right',
    complaints_template: 'Плановый осмотр через 3 месяца после тотального эндопротезирования правого тазобедренного сустава. Жалоб на боли нет, незначительная утомляемость при подъеме по лестнице.',
    anamnesis_template: 'Операция ТЭТС 3 месяца назад. Швы сняты вовремя, первичная реабилитация пройдена успешно.',
    objective_template: 'Послеоперационный рубец по наружной поверхности бедра без признаков воспаления. Длина конечностей одинаковая. Походка уверенная, без хромоты Тренделенбурга. Сгибание 105°, отведение 40°. Имплант стабилен.',
    recommendations_template: '1. Контрольная обзорная рентгенография таза с захватом протезированного сустава стоя.\n2. Соблюдение ортопедического режима: избегать экстремального сгибания более 90° и скрещивания ног.\n3. ЛФК для укрепления средней ягодичной мышцы.',
    rom_norm_preset: { flexion_active: 105, flexion_passive: 110, internal_rotation: 20, external_rotation: 30, abduction: 40, adduction: 20 },
    tests: [
      { test_code: 'trendelenburg', expected_result: 'negative', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_pelvis_ap', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 10 }
    ]
  },

  // =========================================================================
  // КЛАСТЕР 4: СТОПА И ГОЛЕНОСТОПНЫЙ СУСТАВ (16 шаблонов)
  // =========================================================================
  {
    existing_id: 3,
    title: 'Плантарный фасциит с пяточным энтезофитом («пяточная шпора»)',
    joint_name: 'ankle',
    default_mkb_code: 'M77.3',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Хронический энтезит фасции',
    default_side: 'right',
    complaints_template: 'Острая жгучая боль в подошвенной части пятки при первых шагах утром («стартовая боль») и после длительного сидения. К вечеру боль усиливается при длительной ходьбе.',
    anamnesis_template: 'Боли беспокоят около 4 месяцев. Провоцирующий фактор — длительная работа на ногах или смена обуви на плоскую подошву.',
    objective_template: 'Резкая локальная пальпаторная болезненность в области медиального бугорка пяточной кости. Проба Винделя (пассивное тыльное разгибание пальцев стопы с натяжением плантарной фасции) резко усиливает боль в пятке.',
    recommendations_template: '1. Курс радиальной УВТ пяточной зоны №5.\n2. Ношение индивидуальных ортопедических стелек с разгрузкой пяточного бугра и поддержкой продольного свода.\n3. Упражнения на растяжку ахиллова сухожилия и плантарной фасции (катание теннисного мяча, стретчинг на ступени).\n4. Ночные страсбургские носки или ортезы.',
    rom_norm_preset: { dorsal_flexion: 15, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [
      { test_code: 'windlass_test', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'silfverskiold', expected_result: 'positive', is_mandatory: 0, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_ankle', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_foot_calcaneus', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Острый разрыв передней таранно-малоберцовой связки (ATFL)',
    joint_name: 'ankle',
    default_mkb_code: 'S93.4',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Острый период травмы (II–III степень)',
    default_side: 'right',
    complaints_template: 'Резкая боль по наружной поверхности голеностопного сустава после подворачивания стопы внутрь, быстро нарастающий отек и гематома, хромота.',
    anamnesis_template: 'Супинационная травма стопы 1–2 дня назад при ходьбе по неровной поверхности или на спортивной площадке.',
    objective_template: 'Выраженный отек и подкожная гематома в области наружной лодыжки. Резкая боль при пальпации по ходу ATFL. Тест переднего выдвижного ящика стопы (Anterior drawer) положителен с патологическим смещением таранной кости кпереди. Костная пальпация лодыжек безболезненна (критерии Оттавы отрицательны).',
    recommendations_template: '1. Иммобилизация жестким голеностопным ортезом с боковыми шинами на 3–4 недели.\n2. Протокол RICE (покой, холод, компрессия, возвышенное положение).\n3. НПВП местно и системно коротким курсом.\n4. После стихания отека — контрольный осмотр и реабилитация проприоцепции.',
    rom_norm_preset: { dorsal_flexion: 10, plantar_flexion: 30, supination: 15, pronation: 15 },
    tests: [
      { test_code: 'anterior_drawer_ankle', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'talar_tilt', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_ankle_2v', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_ankle', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 },
      { diagnostic_code: 'mri_ankle_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 30 }
    ]
  },
  {
    existing_id: 15,
    title: 'Хроническая латеральная нестабильность голеностопного сустава',
    joint_name: 'ankle',
    default_mkb_code: 'M24.2',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Хроническая функциональная/механическая нестабильность',
    default_side: 'right',
    complaints_template: 'Частые повторные подворачивания стопы наружу даже на ровном асфальте («нога подкашивается»), чувство неуверенности и страха при ходьбе по неровностям, тупая боль в голеностопе к концу дня.',
    anamnesis_template: 'Многократные инверсионные растяжения связок голеностопа в анамнезе (более 3–4 эпизодов за последние 2 года).',
    objective_template: 'Повышенная экскурсия таранной кости при тесте переднего выдвижного ящика и таларном тилт-тесте (Talar tilt) по сравнению со здоровой ногой. Дефицит баланса при пробе стояния на одной ноге с закрытыми глазами.',
    recommendations_template: '1. МРТ голеностопного сустава для оценки застарелого разрыва ATFL/CFL и состояния суставного хряща блока таранной кости.\n2. Курс тренировки проприоцепции на балансировочной подушке/платформе.\n3. Индивидуальные супинирующие ортопедические стельки.\n4. При неэффективности — консультация хирурга для анатомической пластики связок (операция Брострома-Гулда).',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 35, pronation: 20 },
    tests: [
      { test_code: 'anterior_drawer_ankle', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'talar_tilt', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'mri_ankle_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'xray_ankle_2v', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Повреждение дистального межберцового синдесмоза голеностопа',
    joint_name: 'ankle',
    default_mkb_code: 'S93.6',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Высокое повреждение связок синдесмоза',
    default_side: 'right',
    complaints_template: 'Интенсивная боль над голеностопным суставом кпереди и снаружи, невозможность опереться на ногу и оттолкнуться пальцами.',
    anamnesis_template: 'Травма с наружной ротацией стопы и гипердорсифлексией (хоккей, горные лыжи, футбол).',
    objective_template: 'Выраженная локальная боль при пальпации передней межберцовой связки (AITFL) и межкостной мембраны. Тест наружной ротации Клейгера (Kleiger test) и тест сжатия голени (Squeeze test) резко положительны с иррадиацией боли в синдесмоз.',
    recommendations_template: '1. Рентгенография голеностопа в проекции Мортис (Mortise view) для измерения межберцового пространства (tibiofibular clear space).\n2. МРТ голеностопа для оценки целостности AITFL/PITFL.\n3. Строгая иммобилизация съемным сапожком (Cam walker) без нагрузки 4–6 недель.',
    rom_norm_preset: { dorsal_flexion: 5, plantar_flexion: 30, supination: 20, pronation: 15 },
    tests: [
      { test_code: 'kleiger', expected_result: 'positive', is_mandatory: 1, sort_order: 10 },
      { test_code: 'squeeze_ankle', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_ankle_2v', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_ankle_high', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    existing_id: 10,
    title: 'Хронический инсерционный тендинит ахиллова сухожилия',
    joint_name: 'ankle',
    default_mkb_code: 'M76.6',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Хроническая инсерционная тендинопатия',
    default_side: 'right',
    complaints_template: 'Боль и утолщение в месте прикрепления ахиллова сухожилия к пяточной кости, скованность по утрам, боль при ношении жесткой обуви с задником.',
    anamnesis_template: 'Симптомы беспокоят более полугода, постепенно нарастали на фоне беговых тренировок.',
    objective_template: 'Веретенообразное утолщение и пальпаторная болезненность дистального отдела ахиллова сухожилия на 2–3 см выше пяточного бугра. Тест Томпсона отрицательный (целостность сухожилия сохранена). Пассивное тыльное сгибание стопы натягивает сухожилие и вызывает боль.',
    recommendations_template: '1. Протокол эксцентрических тренировок Альфредсона (Alfredson protocol) на ступени.\n2. Курс УВТ ахиллова сухожилия №5.\n3. Подпяточники силиконовые 1 см для разгрузки натяжения.\n4. Категорически противопоказано введение кортикостероидов в толщу сухожилия из-за риска разрыва.',
    rom_norm_preset: { dorsal_flexion: 15, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [
      { test_code: 'thompson', expected_result: 'negative', is_mandatory: 1, sort_order: 10 },
      { test_code: 'silfverskiold', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_ankle', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_ankle_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Полный свежий разрыв ахиллова сухожилия',
    joint_name: 'ankle',
    default_mkb_code: 'S86.0',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Острый полный разрыв',
    default_side: 'right',
    complaints_template: 'Внезапный щелчок («ощущение удара палкой сзади по пятке») во время отталкивания ногой, резкая боль, невозможность встать на носок.',
    anamnesis_template: 'Травма 3 часа назад во время игры в волейбол/теннис при резком ускорении.',
    objective_template: 'Пальпаторный диастаз (западение) по ходу ахиллова сухожилия на 4 см выше пяточного бугра. Тест сжатия икроножной мышцы Томпсона (Thompson test) резко положителен — подошвенное сгибание стопы отсутствует. Активное вставание на носок невозможно.',
    recommendations_template: '1. Срочная иммобилизация задней гипсовой лонгетой в положении эквинуса (подошвенного сгибания стопы 20°).\n2. Экстренная консультация хирурга-травматолога для оперативного сшивания сухожилия (открытого или малоинвазивного).\n3. Исключение опоры на ногу, ходьба на костылях.',
    rom_norm_preset: { dorsal_flexion: 0, plantar_flexion: 20, supination: 15, pronation: 10 },
    tests: [
      { test_code: 'thompson', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_ankle', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_ankle_high', urgency: 'urgent', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    existing_id: 20,
    title: 'Hallux Valgus II–III ст., метатарзалгия, молоткообразные пальцы',
    joint_name: 'ankle',
    default_mkb_code: 'M20.1',
    category: 'Деформации стопы и приобретенные аномалии',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'II–III степень, вальгусный угол > 25°',
    default_side: 'right',
    complaints_template: 'Болезненная «косточка» (экзостоз) у основания I пальца стопы, воспаление при трении в обуви, жгучие боли под головками II–III плюсневых костей (метатарзалгия), натоптыши на подошве.',
    anamnesis_template: 'Деформация прогрессирует более 5 лет, ношение модельной узкой обуви на каблуке.',
    objective_template: 'Вальгусное отклонение I пальца 32°, пронация ногтевой фаланги. Бурсит над медиальным экзостозом головки I плюсневой кости. Молоткообразная деформация II пальца стопы. Омозолелости (гиперкератоз) под головками II–III плюсневых костей. Продольно-поперечное распластывание свода.',
    recommendations_template: '1. Рентгенография стоп с физиологической нагрузкой стоя в 2 проекциях для расчета углов HVA и IMA.\n2. Индивидуальные ортопедические стельки с метатарзальным валиком (каплей Зейца) для разгрузки головок плюсневых костей.\n3. Межпальцевые силиконовые корректоры, ночные отводящие бандажи.\n4. Консультация хирурга стопы (foot and ankle surgeon) для плановой остеотомии (Scarf/Akin).',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [
      { test_code: 'jack_test', expected_result: 'negative', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_feet_weightbearing', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'podoscopy_computer', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Ригидный первый палец стопы (Hallux Rigidus) I–II ст.',
    joint_name: 'ankle',
    default_mkb_code: 'M20.2',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'I–II стадия, тыльный остеофит',
    default_side: 'right',
    complaints_template: 'Боль и тугоподвижность в I плюснефаланговом суставе стопы при ходьбе (в фазе отталкивания пальцами), невозможность носить обувь с каблуком, костный нарост на тыле сустава.',
    anamnesis_template: 'Боли беспокоят около года, постепенно усиливаются после длительных пеших нагрузок.',
    objective_template: 'Костный экзофит по тыльной поверхности I плюснефалангового сустава. Резкое ограничение пассивного тыльного сгибания I пальца до 25° (норма 65–70°), сопровождающееся крепитацией и болью. Подошвенное сгибание сохранено.',
    recommendations_template: '1. Обувь с жесткой подошвой и перекатом (rocker bottom sole) для устранения изгиба I ПФС.\n2. Внутрисуставное введение гиалуроновой кислоты в I ПФС.\n3. При прогрессировании — хейлэктомия (удаление тыльного остеофита).',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_foot_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  },
  {
    existing_id: 21,
    title: 'Мортоновская метатарзалгия (неврома Мортона III–IV пальцев)',
    joint_name: 'ankle',
    default_mkb_code: 'G57.6',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Периневральный фиброз III подошвенного нерва',
    default_side: 'right',
    complaints_template: 'Жгучая, стреляющая боль («как током бьет» или «ощущение складки в носке / камушка в обуви») в области III–IV пальцев стопы. Пациент вынужден снимать обувь на улице и массировать стопу.',
    anamnesis_template: 'Боли провоцируются узкой обувью, длятся около 6 месяцев.',
    objective_template: 'Локальная болезненность при глубокой пальпации третьего межплюсневого промежутка с подошвенной стороны. Симптом и тест Малдера (Mulder click test) положительный: поперечное сжатие плюсневых костей с подошвенным давлением вызывает щелчок и резкую простреливающую боль в III и IV пальцы.',
    recommendations_template: '1. Переход на обувь с широким носком без каблука.\n2. Индивидуальные ортопедические стельки с разгрузочной ретрокапитальной метатарзальной подушечкой.\n3. Локальная инфильтрация межплюсневого промежутка ГКС с анестетиком под УЗИ-контролем.\n4. При неэффективности — невролиз или удаление невромы.',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [
      { test_code: 'mulder_click', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_ankle', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_ankle_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Синдром тарзального канала (компрессия большеберцового нерва)',
    joint_name: 'ankle',
    default_mkb_code: 'G57.5',
    category: 'Туннельные невропатии и компрессионные синдромы',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Компрессионно-ишемическая нейропатия',
    default_side: 'right',
    complaints_template: 'Жжение, онемение и покалывание по подошвенной поверхности стопы и пальцев, усиливающиеся по ночам и после длительной ходьбы.',
    anamnesis_template: 'Боли нарастали постепенно, в анамнезе перелом лодыжки или плоскостопие.',
    objective_template: 'Положительный симптом Тиннеля при перкуссии позади внутренней лодыжки с иррадиацией парестезий в подошву. Гипестезия в зоне иннервации медиального и латерального подошвенных нервов.',
    recommendations_template: '1. ЭНМГ нижних конечностей для оценки скорости проведения по большеберцовому нерву.\n2. УЗИ тарзального канала для исключения варикоза, ганглия или фиброза.\n3. Ношение ортопедических стелек с поддержкой продольного свода.\n4. Нейротрофическая терапия (альфа-липоевая кислота, витамины группы В).',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [
      { test_code: 'tarsal_tunnel_tinnel', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'enmg_lower', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_ankle', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Дисфункция сухожилия задней большеберцовой мышцы (PTTD)',
    joint_name: 'ankle',
    default_mkb_code: 'M76.8',
    category: 'Деформации стопы и приобретенные аномалии',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'II стадия, мобильное уплощение свода',
    default_side: 'right',
    complaints_template: 'Боль и припухлость позади медиальной лодыжки, прогрессирующее «заваливание» стопы внутрь и уплощение свода.',
    anamnesis_template: 'Женщина старше 45 лет, симптомы длятся более года с постепенным ухудшением формы стопы.',
    objective_template: 'Отек по ходу сухожилия m. tibialis posterior за медиальной лодыжкой. Симптом «слишком много пальцев» (Too many toes sign) положителен при взгляде сзади. Невозможность выполнить подъем на носок на одной ноге (Single heel rise test) или подъем без супинации пятки.',
    recommendations_template: '1. УЗИ или МРТ сухожилия задней большеберцовой мышцы (теносиновит / частичный разрыв).\n2. Ношение индивидуального жесткого ортеза голеностопа (Arizona brace / AFO).\n3. Укрепление супинаторов стопы.\n4. При прогрессировании — пластика сухожилия с медиализирующей остеотомией пяточной кости.',
    rom_norm_preset: { dorsal_flexion: 15, plantar_flexion: 40, supination: 15, pronation: 25 },
    tests: [
      { test_code: 'single_heel_rise', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_ankle', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_ankle_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Тендинопатия и подвывих малоберцовых мышц (перонеальный тендинит)',
    joint_name: 'ankle',
    default_mkb_code: 'M76.7',
    category: 'Энтезопатии и тендиниты',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Подострый перонеальный теносиновит',
    default_side: 'right',
    complaints_template: 'Боль и щелчки позади наружной лодыжки при ходьбе, ощущение смещения сухожилий вперед при активном вращении стопой.',
    anamnesis_template: 'В анамнезе инверсионная травма голеностопа.',
    objective_template: 'Болезненность и отек по заднему краю латеральной лодыжки. Активная эверсия стопы против сопротивления вызывает резкую боль и пальпаторное соскальзывание сухожилий малоберцовых мышц кпереди через гребень лодыжки (несостоятельность удерживателя SPR).',
    recommendations_template: '1. УЗИ голеностопа в динамическом режиме при активной ротации стопы.\n2. Иммобилизация ортезом с латеральной поддержкой на 3 недели.\n3. УВТ по ходу малоберцовых сухожилий.\n4. При стойком подвывихе — хирургическая реконструкция ретинакулюма малоберцовых мышц.',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [
      { test_code: 'peroneal_subluxation', expected_result: 'positive', is_mandatory: 1, sort_order: 10 }
    ],
    diagnostics: [
      { diagnostic_code: 'us_ankle', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'mri_ankle_high', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Остеохондральное повреждение блока таранной кости (OCL)',
    joint_name: 'ankle',
    default_mkb_code: 'M93.2',
    category: 'Дегенеративно-дистрофические заболевания',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Рассекающий остеохондрит блока таранной кости',
    default_side: 'right',
    complaints_template: 'Глубокая ноющая боль в голеностопном суставе при нагрузке, периодические блокады и хруст при движениях, ощущение «нестабильности».',
    anamnesis_template: 'Травма голеностопа 6 месяцев назад, боли полностью не купировались.',
    objective_template: 'Умеренный синовит голеностопного сустава. Пальпаторная болезненность переднемедиального или заднелатерального края блока таранной кости при максимальном подошвенном сгибании стопы. Ограничение тыльного сгибания.',
    recommendations_template: '1. МРТ голеностопного сустава на высокопольном томографе для стадирования остеохондрального дефекта по классификации Berndt-Harty.\n2. Ограничение ударных осевых нагрузок.\n3. Консультация артроскописта для решения вопроса о туннелизации/микрофрактурировании дефекта хряща.',
    rom_norm_preset: { dorsal_flexion: 10, plantar_flexion: 35, supination: 25, pronation: 15 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'mri_ankle_high', urgency: 'urgent', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'ct_joint_3d', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Деформация Хаглунда и ретрокальканеарный бурсит',
    joint_name: 'ankle',
    default_mkb_code: 'M77.3',
    category: 'Деформации стопы и приобретенные аномалии',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'Костный экзостоз с воспалением сумки',
    default_side: 'right',
    complaints_template: 'Костный выступ («шишка») на задне-верхней поверхности пятки, боль и натирание при ношении жесткой обуви, отек вокруг ахиллова сухожилия.',
    anamnesis_template: 'Деформация формировалась годами, обострение бурсита связано с новой обувью с жестким задником.',
    objective_template: 'Выраженная костная протрузия задне-верхнего угла пяточной кости. Отек и флюктуация в ретрокальканеарной сумке между ахилловым сухожилием и пяточной костью. Болезненность при сдавлении сумки с боков.',
    recommendations_template: '1. Рентгенография пяточной кости в боковой проекции для оценки угла Фаулера-Филипа.\n2. Ношение обуви с мягким задником или открытой пяткой.\n3. УВТ ретрокальканеарной зоны №5.\n4. При стойком болевом синдроме — эндоскопическое удаление экзостоза Хаглунда.',
    rom_norm_preset: { dorsal_flexion: 15, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_foot_calcaneus', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'us_ankle', urgency: 'routine', default_side: 'affected', is_primary: 0, sort_order: 20 }
    ]
  },
  {
    title: 'Приобретенное продольно-поперечное плоскостопие III ст.',
    joint_name: 'ankle',
    default_mkb_code: 'M21.4',
    category: 'Деформации стопы и приобретенные аномалии',
    cluster_id: 'cluster_foot_ankle',
    cluster_name: 'Стопа и голеностоп: деформации, связки, плантарная фасция',
    stage_or_severity: 'III степень с вальгусной установкой пятки',
    default_side: 'bilateral',
    complaints_template: 'Быстрая утомляемость стоп и голеней к концу дня, ноющие боли в своде стопы и икроножных мышцах, стаптывание внутренней стороны подошвы обуви.',
    anamnesis_template: 'Плоскостопие с молодости, прогрессирует на фоне избыточного веса и длительных статических нагрузок.',
    objective_template: 'Полное уплощение продольного свода стопы при нагрузке, отпечаток подошвы сплошной. Вальгусное отклонение пяточной кости более 10°. Тест Джека (пассивное разгибание I пальца) выявляет ригидность свода.',
    recommendations_template: '1. Компьютерная подоскопия и плантография.\n2. Изготовление индивидуальных каркасных ортопедических стелек.\n3. ЛФК для коротких сгибателей стопы и мышц голени.\n4. Контроль массы тела.',
    rom_norm_preset: { dorsal_flexion: 15, plantar_flexion: 40, supination: 20, pronation: 25 },
    tests: [
      { test_code: 'jack_test', expected_result: 'negative', is_mandatory: 1, sort_order: 10 },
      { test_code: 'coleman_block', expected_result: 'positive', is_mandatory: 1, sort_order: 20 }
    ],
    diagnostics: [
      { diagnostic_code: 'xray_feet_weightbearing', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 10 },
      { diagnostic_code: 'podoscopy_computer', urgency: 'routine', default_side: 'bilateral', is_primary: 1, sort_order: 20 }
    ]
  },
  {
    title: 'Контроль после металлоостеосинтеза костей (плановое удаление металлоконструкций)',
    joint_name: 'ankle',
    default_mkb_code: 'Z47.0',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    cluster_id: 'cluster_postop',
    cluster_name: 'Амбулаторный контроль эндопротезирования и остеосинтеза',
    stage_or_severity: 'Полная консолидация, удаление фиксаторов',
    default_side: 'right',
    complaints_template: 'Плановое обращение для решения вопроса об удалении пластины и винтов после остеосинтеза. Жалоб на боли нет, умеренный дискомфорт в зоне импланта при ношении высокой обуви.',
    anamnesis_template: 'Остеосинтез пластиной и винтами выполнен 12 месяцев назад. Срастание без осложнений.',
    objective_template: 'Послеоперационный рубец бледный, подвижный, безболезненный. Пальпация пластины и головок винтов безболезненна, признаков нестабильности или металлоза нет. Движения в суставе в полном объеме, отек отсутствует.',
    recommendations_template: '1. Контрольная цифровая рентгенография в 2 проекциях для подтверждения полной органотипической перестройки костной мозоли.\n2. Клинический минимум обследования перед плановой операцией удаления металлоконструкций.\n3. Направление на плановую госпитализацию в травматологическое отделение.',
    rom_norm_preset: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 20 },
    tests: [],
    diagnostics: [
      { diagnostic_code: 'xray_ankle_2v', urgency: 'routine', default_side: 'affected', is_primary: 1, sort_order: 10 }
    ]
  }
];

module.exports = { part2Templates };
