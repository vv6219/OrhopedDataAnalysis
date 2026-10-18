const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * syncTreatmentsKnowledgeBase180
 * Populates:
 * 1. ortho_manipulations_catalog
 * 2. ortho_physiotherapy_catalog
 * 3. ortho_orthotics_catalog
 * 4. Links for all 180 templates into:
 *    - ortho_template_manipulations
 *    - ortho_template_physiotherapy
 *    - ortho_template_orthotics
 * Enforces business rule: all internal services have service_scope = 'internal' and priority_level = 'high'.
 */

const MANIPULATIONS_CATALOG = [
  // KNEE
  {
    code: 'man_prp_cortexil_10',
    name: 'PRP-терапия Cortexil (пробирка 10 мл) под УЗИ-навигацией',
    subcategory: 'injection_prp',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2553,
    servdict_code: 'А11.12.009',
    description: 'Введение аутологичной обогащенной тромбоцитами плазмы с концентрацией тромбоцитов 1 000 000–1 500 000 тр/мкл. Альфа-гранулы высвобождают PDGF, TGF-β, VEGF, FGF, активируя пролиферацию хондроцитов, синтез коллагена II типа и подавляя провоспалительные интерлейкины IL-1β и TNF-α.',
    technique_details: 'Забор 10 мл аутокрови с антикоагулянтом ACD-A в пробирку Cortexil. Режим мягкого центрифугирования 2400 об/мин 10 мин. Отбор слоя Buffy Coat (2.0–2.5 мл). Пункция верхне-латерального заворота иглой 21G под непрерывным УЗИ-контролем с визуализацией среза иглы в синовиальной полости.',
    regimen_standard: 'Стандартный курс: 3 инъекции с межинтервалом 7–14 дней. Поддерживающий курс через 6–12 месяцев.',
    patient_preparation: 'Отмена НПВП за 7–10 дней (блокируют циклооксигеназу-1 тромбоцитов). Питьевой режим не менее 1.5–2 л воды за 24 ч. Исключить алкоголь и жирную пищу за 48 ч.',
    post_procedure_care: 'Щадящий режим конечности 24–48 ч. Исключить тепловые процедуры на 5 суток. Запрещен прием НПВП на 5 суток! При боли разрешен сухой холод на 15 мин и парацетамол.',
    clinical_indications: 'Первичный и вторичный остеоартроз крупных суставов I–II ст. (Kellgren-Lawrence), частичные разрывы и дегенерация связок (ПКС/ЗКС), тендинопатия надколенника, менископатии.',
    contraindications: 'Абсолютные: тромбоцитопения (<100×10⁹/л), анемия (Hb <90 г/л), сепсис, инфекция кожи в месте пункции, онкопатология. Относительные: лихорадка, прием НПВП менее 48 ч назад.'
  },
  {
    code: 'man_prp_cortexil_20',
    name: 'PRP-терапия Cortexil (пробирка 20 мл, увеличенный объем)',
    subcategory: 'injection_prp',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2554,
    servdict_code: 'А11.12.009',
    description: 'Высокообъемный концентрат факторов роста из 20 мл крови (получение 4.5–5.0 мл PRP) для массивного поражения сустава или одновременной обработки суставной полости и периартикулярных связок/сухожилий.',
    technique_details: 'Забор 20 мл крови, специализированное фракционирование Cortexil, прецизионное введение под УЗИ-навигацией 21G.',
    regimen_standard: 'Курс: 2–3 процедуры с интервалом 10–14 дней.',
    patient_preparation: 'Строгая отмена НПВП за 7 дней. Водный баланс 2 л/сутки. Легкий безуглеводный завтрак.',
    post_procedure_care: 'Охранительный режим сустава 48 часов. Запрет бани/сауны на 7 дней.',
    clinical_indications: 'Выраженный гонартроз II–III ст., сочетанное поражение хряща и связочного аппарата, посттравматические дефекты.',
    contraindications: 'Гемобластозы, острые инфекции, тяжелые коагулопатии.'
  },
  {
    code: 'man_ha_gialripayer_15',
    name: 'Внутрисуставное введение препарата гиалуроновой кислоты Гиалрипайер (Армавискон 1,5%)',
    subcategory: 'injection_ha',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2010,
    servdict_code: 'A11.04.004',
    description: 'Биодеградируемый вязкоэластичный протез синовиальной жидкости со связанными аминокислотами и витамином С. Восстанавливает гидродинамическую амортизацию сустава, защищает хондроциты и замедляет деградацию матрикса.',
    technique_details: 'Пункция верхне-латерального заворота коленного сустава под УЗИ иглой 20G/21G. Обязательная эвакуация воспалительного выпота перед инъекцией. Медленное введение 2.0 мл.',
    regimen_standard: 'Курс: 3 инъекции с интервалом 7–10 дней. Длительность терапевтического эффекта 6–9 месяцев.',
    patient_preparation: 'Купирование острого экссудативного синовита перед началом курса.',
    post_procedure_care: 'Ограничение осевой нагрузки и длительной ходьбы на 24 часа.',
    clinical_indications: 'Остеоартроз коленного и тазобедренного суставов I–II стадии, хондромаляция надколенника, дегенеративные разрывы менисков.',
    contraindications: 'Острый бактериальный/гнойный артрит, повреждения кожи в зоне пункции.'
  },
  {
    code: 'man_puncture_aspiration',
    name: 'Диагностическая и лечебная пункция (аспирация) сустава под УЗИ-контролем',
    subcategory: 'puncture',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 86,
    servdict_code: 'A11.04.003',
    description: 'Эвакуация патологического синовиального экссудата или гемартроза для устранения внутрисуставной гипертензии, купирования ишемии капсулы и макроскопической/лабораторной верификации жидкости.',
    technique_details: 'УЗИ-сканирование заворотов. Местная анестезия 2% лидокаином/ропивакаином. Пункция иглой 18G–20G в точке максимального скопления. Тотальная аспирация шприцем. Давящая повязка.',
    regimen_standard: 'Однократно при наличии выпота. При рецидиве синовита повторная пункция через 3–5 дней с установлением причины.',
    patient_preparation: 'Сбор аллергоанамнеза на анестетики. Оценка свертывающей системы (МНО/АЧТВ).',
    post_procedure_care: 'Эластичное бинтование или ортез на 24 часа. Контроль температуры тела.',
    clinical_indications: 'Напряженный гемартроз, реактивный синовит при остеоартрозе, подозрение на инфекционный/микрокристаллический артрит.',
    contraindications: 'Флегмона околосуставных мягких тканей, обширные ожоги/раны зоны доступа.'
  },
  {
    code: 'man_blockade_meniscus_reduction',
    name: 'Выведение коленного сустава из блокады мениском под местной анестезией',
    subcategory: 'reduction',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1633,
    servdict_code: 'A16.04.024.001',
    description: 'Устранение механического ущемления фрагмента мениска (по типу «ручки лейки») между суставными мыщелками с немедленным восстановлением угла разгибания.',
    technique_details: 'Инфильтрация суставной щели и полости сустава раствором местного анестетика 0.5% (15–20 мл). Тракция по оси голени, ротационные маневры внутрь/кнаружи при сгибании 90° с последующим мягким пассивным разгибанием до 0°.',
    regimen_standard: 'Экстренная процедура при острой механической блокаде. При безуспешности — направление на экстренную артроскопию.',
    patient_preparation: 'Рентген-исключение внутрисуставных костных переломов.',
    post_procedure_care: 'Жесткая иммобилизация тутором или ортезом ROM в разгибании (0°) на 2–3 недели. Направление на МРТ.',
    clinical_indications: 'Острая блокада коленного сустава со стойким разгибательным дефицитом при разрыве мениска.',
    contraindications: 'Внутрисуставной перелом мыщелков, грубый гемартроз без предварительной аспирации.'
  },
  {
    code: 'man_taping_kinesio',
    name: 'Кинезиологическое тейпирование сустава и периартикулярных мышц',
    subcategory: 'taping',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 246,
    servdict_code: 'A15.04.002',
    description: 'Аппликация эластичных хлопковых лент с акриловым термоактивным клеем. Поднимает эпидермис, расширяя интерстициальное пространство, улучшает лимфодренаж, обеспечивает проприоцептивную фасилитацию или ингибицию мышц.',
    technique_details: 'Обезжиривание кожи спиртовой салфеткой. Наложение тейпа без натяжения на якоря и с натяжением 15–50% на терапевтическую зону по анатомическому ходу мышц или связок.',
    regimen_standard: 'Срок ношения аппликации 3–5 дней. Курс 3–5 аппликаций в период острой и подострой реабилитации.',
    patient_preparation: 'Чистая сухая кожа, удаление густого волосяного покрова (бритье).',
    post_procedure_care: 'После душа промокать тейп полотенцем без растирания. При появлении зуда/жжения немедленно снять.',
    clinical_indications: 'Миофасциальный болевой синдром, пателлофеморальный синдром, нестабильность надколенника, лимфостаз, растяжение связок.',
    contraindications: 'Открытые раны, трофические язвы, аллергия на акрил, пергаментная старческая кожа.'
  },
  {
    code: 'man_svf_stem_cells',
    name: 'SVF-терапия (стромально-васкулярная фракция жировой ткани с PRP)',
    subcategory: 'injection_prp',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2242,
    servdict_code: 'А11.12.009',
    description: 'Трансплантация аутологичных мультипотентных мезенхимальных стромальных клеток (МСК) из микрофрагментированной жировой ткани в сочетании с PRP. Мощный клеточный хондропротективный и регенераторный потенциал.',
    technique_details: 'Мини-липоаспирация околопупочной клетчатки под тумесцентной анестезией Кляйна. Механическая дезинтеграция жира через систему микрофильтров. Введение полученной SVF с ауто-PRP под УЗИ.',
    regimen_standard: 'Однократная процедура. Оценка через 3, 6 и 12 месяцев по данным МРТ (протокол T2-mapping).',
    patient_preparation: 'Комплексный предоперационный госпитальный скрининг (ВИЧ, гепатиты, сифилис, ОАК, коагулограмма, ЭКГ).',
    post_procedure_care: 'Ношение компрессионного бандажа на животе 10 дней. Разгрузка сустава костылями 3–5 дней.',
    clinical_indications: 'Тяжелый остеоартроз II–III ст., очаговые полнослойные дефекты хряща (ICRS III–IV), неэффективность консервативной терапии при желании отсрочить эндопротезирование.',
    contraindications: 'Онкологические заболевания любой локализации, сепсис, выраженное истощение жировой клетчатки.'
  },

  // SHOULDER
  {
    code: 'man_shoulder_subacromial_block',
    name: 'Субакромиальная лечебная блокада пролонгированным ГКС под УЗИ-контролем',
    subcategory: 'blockade',
    target_joint: 'shoulder',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1592,
    servdict_code: 'A11.02.002',
    description: 'Введение смеси бетаметазона/триамцинолона с ропивакаином 0.2% в субакромиальную сумку. Мгновенно ликвидирует отек субакромиальной бурсы, устраняет компрессию сухожилия надостной мышцы при отведении.',
    technique_details: 'Задний или латеральный доступ под ультрасонографическим контролем датчиком 12–15 МГц. Визуализация продвижения иглы между акромионом и надостной мышцей. Введение 1 мл ГКС + 3 мл анестетика.',
    regimen_standard: 'Однократно. Повторное введение не ранее чем через 3–4 месяца при строгих показаниях.',
    patient_preparation: 'Контроль АД и сахара крови.',
    post_procedure_care: 'Ограничение подъема руки выше 90° на 48 часов.',
    clinical_indications: 'Субакромиальный импинджмент-синдром, острый субакромиально-субдельтовидный бурсит, кальцифицирующий тендинит надостной мышцы.',
    contraindications: 'Полный массивный разрыв ротаторной манжеты (риск атрофии), инфекция кожи.'
  },
  {
    code: 'man_shoulder_suprascapular_block',
    name: 'Блокада надлопаточного нерва (Suprascapular nerve block) под УЗИ-навигацией',
    subcategory: 'blockade',
    target_joint: 'shoulder',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1592,
    servdict_code: 'A11.02.002',
    description: 'Селективная десенситизация надлопаточного нерва в вырезке лопатки. Блокирует до 70% чувствительной болевой иннервации плечевого сустава без выключения двигательной функции дельтовидной мышцы.',
    technique_details: 'Датчик УЗИ располагается параллельно ости лопатки. Визуализация надлопаточной вырезки и артерии (допплер). Введение иглы 22G в вырезку лопатки, инфузия 5–8 мл ропивакаина 0.2% с дексаметазоном.',
    regimen_standard: 'Курс: 1–2 блокады с интервалом 7–14 дней.',
    patient_preparation: 'Стандартный аллергоанамнез.',
    post_procedure_care: 'Немедленное начало щадящей пассивной мобилизации плеча без боли.',
    clinical_indications: 'Адгезивный капсулит («замороженное плечо»), тяжелый омартроз, хронический болевой синдром после операций на плече.',
    contraindications: 'Пневмоторакс в анамнезе на стороне инъекции (высокий анатомический риск), инфекция.'
  },

  // HIP & SPINE
  {
    code: 'man_hip_trochanter_block',
    name: 'Блокада зоны вертельного бурсита (трохантерита) под УЗИ-навигацией',
    subcategory: 'blockade',
    target_joint: 'hip',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1592,
    servdict_code: 'A11.02.002',
    description: 'Таргетное введение противовоспалительной смеси в сумку большого вертела и энтезис средней ягодичной мышцы. Полностью купирует ночную боль в положении лежа на боку и стартовую боль при ходьбе.',
    technique_details: 'Пациент лежит на здоровом боку. Датчик УЗИ в поперечной проекции над вершиной большого вертела. Игла 21G вводится под контролем луча в глубокую вертельную сумку. Введение 1 мл ГКС + 4 мл ропивакаина.',
    regimen_standard: 'Однократно. При необходимости повтор через 6 месяцев.',
    patient_preparation: 'Отсутствие активных кожных высыпаний в ягодичной области.',
    post_procedure_care: 'Щадящий режим ходьбы без опоры на больной бок 2 суток.',
    clinical_indications: 'Большой вертельный болевой синдром (GTPS), трохантерит, тендинопатия средней и малой ягодичных мышц.',
    contraindications: 'Гнойный бурсит, сепсис.'
  },
  {
    code: 'man_spine_paravertebral_block',
    name: 'Паравертебральная блокада триггерных зон при вертеброгенном синдроме',
    subcategory: 'blockade',
    target_joint: 'spine',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1592,
    servdict_code: 'A11.02.002',
    description: 'Инфильтрация спазмированных паравертебральных мышц раствором местного анестетика с витаминами группы B. Разрывает порочный круг «боль — спазм — ишемия — усиление боли».',
    technique_details: 'Пальпация остистых отростков и латеральных миофасциальных триггеров (отступ 2–3 см). Вкол иглы перпендикулярно коже на глубину до дужек позвонков, веерное введение раствора.',
    regimen_standard: 'Курс 2–3 процедуры с интервалом 3–5 дней.',
    patient_preparation: 'Измерение давления перед манипуляцией.',
    post_procedure_care: 'Покой в течение 2 часов в полужестком корсете.',
    clinical_indications: 'Острая люмбалгия, торакалгия, цервикалгия, миофасциальный вертеброгенный синдром.',
    contraindications: 'Тяжелый стеноз позвоночного канала, симптомы сдавления конского хвоста.'
  },

  // ELBOW & WRIST & FOOT
  {
    code: 'man_elbow_epicondyle_prp',
    name: 'PRP-терапия энтезиса при латеральном/медиальном эпикондилите локтя',
    subcategory: 'injection_prp',
    target_joint: 'elbow',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2553,
    servdict_code: 'А11.12.009',
    description: 'Введение аутологичной обогащенной плазмы непосредственно в зону микроразрывов общего сухожилия разгибателей/сгибателей кисти. Стимулирует ангиогенез и восстанавливает коллагеновые фибриллы сухожилия.',
    technique_details: 'УЗИ-сканирование наружного надмыщелка. Локальная анестезия кожи без инфильтрации сухожилия. Методика микрофенестрации (peppering) иглой 22G с введением 1.5–2.0 мл PRP.',
    regimen_standard: 'Курс: 2 процедуры с интервалом 14–21 день.',
    patient_preparation: 'Отмена НПВП за 7 дней.',
    post_procedure_care: 'Ношение бандажа-эпикондилитного налокотника 3 недели. Запрет форсированных кистевых нагрузок.',
    clinical_indications: 'Резистентный латеральный («локоть теннисиста») и медиальный («локоть гольфиста») эпикондилит.',
    contraindications: 'Тромбоцитопения, кожные инфекции локтя.'
  },
  {
    code: 'man_wrist_carpal_canal_block',
    name: 'Гидродиссекция и блокада срединного нерва в карпальном канале под УЗИ',
    subcategory: 'blockade',
    target_joint: 'wrist',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1592,
    servdict_code: 'A11.02.002',
    description: 'Ультразвуковая гидродиссекция удерживателя сгибателей раствором местного анестетика с гидрокортизоном/дексаметазоном. Механически освобождает срединный нерв от фиброзных сращений и купирует компрессию.',
    technique_details: 'Датчик УЗИ поперек дистальной складки запястья. Визуализация нерва (cross-sectional area >10 мм²). Игла вводится in-plane, раствор распределяется между нервом и сухожилиями сгибателей.',
    regimen_standard: '1–2 процедуры с интервалом 2 недели.',
    patient_preparation: 'ЭНМГ-подтверждение синдрома запястного канала.',
    post_procedure_care: 'Ношение лучезапястного ортеза в нейтральном положении ночью.',
    clinical_indications: 'Синдром карпального канала I–II ст. с ночными парестезиями пальцев.',
    contraindications: 'Стойкая атрофия тенара (показана хирургическая декомпрессия).'
  },
  {
    code: 'man_foot_plantar_fascia_prp',
    name: 'PRP-терапия и микрофенестрация подошвенного апоневроза («пяточная шпора»)',
    subcategory: 'injection_prp',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2553,
    servdict_code: 'А11.12.009',
    description: 'Введение аутологичной плазмы в зону прикрепления подошвенной фасции к пяточному бугру под УЗИ с перфорацией дегенеративного участка фасции. Запускает заживление хронического фасциоза.',
    technique_details: 'Медиальный доступ под УЗИ-контролем (толщина фасции >4.0 мм). Введение 2.0 мл PRP в толщу фасции и субапоневротическое пространство.',
    regimen_standard: 'Курс: 2 процедуры с интервалом 14–21 день.',
    patient_preparation: 'Отмена НПВП за 7 дней. Изготовление стелек Formthotics.',
    post_procedure_care: 'Обязательное ношение обуви с индивидуальной стелькой. Исключение прыжков и бега.',
    clinical_indications: 'Хронический плантарный фасциит длительностью более 6 месяцев, резистентный к УВТ.',
    contraindications: 'Тромбоцитопения, диабетическая стопа.'
  }
];

const PHYSIOTHERAPY_CATALOG = [
  {
    code: 'phys_eswt_radial',
    name: 'Радиальная экстракорпоральная ударно-волновая терапия (УВТ, 1 зона)',
    subcategory: 'eswt_radial',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: null,
    servdict_code: 'А17.30.005',
    description: 'Пневматическая генерация радиальных акустических волн пикового давления 1.8–3.5 Бар с кавитацией. Обеспечивает дезинтеграцию микрокальцинатов, разрушение спаек, дегрануляцию тучных клеток, блокаду субстанции P и неоваскуляризацию через синтез VEGF.',
    technique_details: 'Нанесение акустического геля. Аппликатор 15 мм или 20 мм D-Actor. Давление 1.8–3.2 Бар, частота 10–12 Гц, 2000–3000 импульсов за сеанс. Без анестезии (анестезия угнетает нейромодуляторный эффект).',
    regimen_standard: 'Курс: 5–7 сеансов с обязательным интервалом 5–7 дней.',
    patient_preparation: 'Осмотр кожных покровов в зоне терапии на отсутствие гематом и повреждений.',
    post_procedure_care: 'Запрещен прием НПВП в первые 48 часов после сеанса! При боли прикладывать сухой холод.',
    clinical_indications: 'Плантарный фасциит, латеральный и медиальный эпикондилит, тендинопатия ротаторов плеча, ахиллодиния, трохантерит, миофасциальные триггеры.',
    contraindications: 'Беременность, зоны роста костей у детей, область крупных сосудов и легких, наличие кардиостимулятора рядом, тромбоз вен, коагулопатии.'
  },
  {
    code: 'phys_eswt_focused',
    name: 'Фокусированная ударно-волновая терапия глубоких костно-суставных зон (ФУВТ)',
    subcategory: 'eswt_focused',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: null,
    servdict_code: 'А17.30.005.001',
    description: 'Пьезоэлектрическая или электромагнитная генерация узкофокусированной ударной волны с проникновением до 8–12 см вглубь тканей. Высокая плотность потока энергии (до 0.45 мДж/мм²) стимулирует остеогенез, микроциркуляцию кости и резорбцию глубоких остеофитов.',
    technique_details: 'Прецизионное позиционирование фокуса под УЗИ/рентген разметкой. Плотность потока 0.15–0.35 мДж/мм², частота 4–6 Гц, 1500–2000 импульсов.',
    regimen_standard: 'Курс: 3–5 сеансов с интервалом 10–14 дней.',
    patient_preparation: 'МРТ или КТ-верификация глубины поражения.',
    post_procedure_care: 'Ограничение осевой нагрузки в день процедуры.',
    clinical_indications: 'Замедленная консолидация переломов, псевдоартрозы (ложные суставы), асептический некроз головки бедренной/таранной кости I–II ст., глубокий кальцифицирующий тендинит.',
    contraindications: 'Остеомиелит в зоне воздействия, системный остеопороз тяжелой степени, онкология.'
  },
  {
    code: 'phys_sis_magnet',
    name: 'Высокоинтенсивная магнитотерапия Super Inductive System (SIS)',
    subcategory: 'sis_magnet',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: null,
    servdict_code: 'А17.24.008',
    description: 'Импульсное магнитное поле сверхвысокой индукции до 2.5 Тесла (25 000 Гаусс). Частоты 1–10 Гц реализуют воротный контроль боли и выброс эндорфинов; 20–50 Гц — выраженную миорелаксацию; до 150 Гц — стимуляцию остеогенеза и трофики.',
    technique_details: 'Бесконтактный индуктор (работает поверх одежды и полимерных повязок без металла). Мощность 40–80% до сокращения мышц. Длительность 12–15 минут.',
    regimen_standard: 'Курс: 6–10 сеансов, ежедневно или через день.',
    patient_preparation: 'Удалить из зоны карты, часы, смартфоны, металлические предметы.',
    post_procedure_care: 'Оценка подвижности (ROM) сразу после сеанса.',
    clinical_indications: 'Спондилоартроз, грыжи МПД, импинджмент-синдром плеча, ускорение консолидации костной ткани, разработка контрактур.',
    contraindications: 'Кардиостимуляторы, ферромагнитные осколки, имплантированные инсулиновые помпы, беременность.'
  },
  {
    code: 'phys_laser_hilt',
    name: 'Высокоинтенсивная импульсная лазеротерапия HILT (High Intensity Laser)',
    subcategory: 'laser_hilt',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: null,
    servdict_code: 'А17.30.010',
    description: 'Лазерное излучение 1064 нм в наносекундных импульсах пиковой мощностью до 3 кВт. Глубокая фотобиомодуляция митохондрий через цитохром-С-оксидазу, многократное ускорение синтеза АТФ и мощный противоотечный лимфодренажный эффект.',
    technique_details: 'Защитные очки врачу и пациенту! Плавное перемещение манипулы по спирали над зоной отека и воспаления (доза 60–120 Дж/см²).',
    regimen_standard: 'Курс: 6–8 процедур, 2–3 раза в неделю.',
    patient_preparation: 'Кожные покровы сухие, без татуировок в зоне прямого луча.',
    post_procedure_care: 'Сустав защитить от прямого переохлаждения.',
    clinical_indications: 'Острые посттравматические отеки, синовиты, повреждения связок колена/голеностопа, острая цервикобрахиалгия.',
    contraindications: 'Онкология, область щитовидной железы, эпилепсия, фотодерматозы.'
  },
  {
    code: 'phys_cpm_artromot',
    name: 'Непрерывная пассивная разработка суставов на аппарате Artromot (CPM-терапия)',
    subcategory: 'cpm',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: null,
    servdict_code: 'А19.03.002',
    description: 'Механизированная разработка амплитуды сгибания/разгибания без сокращения мышц пациента. Питает аваскулярный хрящ диффузией синовиальной жидкости при циклической разгрузке, предотвращает спайки и контрактуры.',
    technique_details: 'Укладка ноги в каретку с юстировкой анатомической оси колена. Начальный угол сгибания по переносимости (например, 30°–40°), шаг увеличения 5°–10° за сеанс. Длительность 30–45 минут.',
    regimen_standard: 'Курс: 10–14 ежедневных процедур.',
    patient_preparation: 'Контроль стабильности остеосинтеза или трансплантата связок.',
    post_procedure_care: 'Холод на сустав после сеанса при склонности к синовиту.',
    clinical_indications: 'Реабилитация после пластики ПКС, эндопротезирования суставов, остеосинтеза мыщелков, артолиза.',
    contraindications: 'Нестабильный остеосинтез, острый тромбоз вен голени.'
  },
  {
    code: 'phys_vtes_stimulation',
    name: 'Внутритканевая электростимуляция костной ткани и нервных стволов (ВТЭС)',
    subcategory: 'tens_nmes',
    target_joint: 'spine',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1610,
    servdict_code: 'А17.02.001',
    description: 'Подведение импульсного низкочастотного тока непосредственно к надкостнице пораженного сегмента одноразовой иглой-электродом в обход высокого сопротивления кожи. Нормализует костную микроциркуляцию и ликвидирует остеогенную боль.',
    technique_details: 'Вкол иглы-электрода до контакта с костью (остистый отросток / область фасеточного сустава). Подключение аппарата ВТЭС, подбор частоты и силы тока до приятной вибрации (20–30 минут).',
    regimen_standard: 'Курс: 3–6 процедур через день.',
    patient_preparation: 'Обработка антисептиком, исключить приём седативных.',
    post_procedure_care: 'Асептическая наклейка на место вкола.',
    clinical_indications: 'Корешковый синдром, тяжелый спондилоартроз, кокцигодиния, остеохондроз с выраженным болевым синдромом.',
    contraindications: 'Кардиостимулятор, онкопатология, эпилепсия.'
  }
];

const ORTHOTICS_CATALOG = [
  {
    code: 'orth_insole_formthotics',
    name: 'Изготовление индивидуальных ортопедических стелек Formthotics (термоформовка)',
    subcategory: 'insole',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: null,
    servdict_code: 'А23.23.001',
    description: 'Индивидуальные динамические ортезы стопы полного контакта из термоформуемой пены Ultralon. Стабилизируют подтаранный сустав в нейтральной позиции, устраняют гиперпронацию, нормализуют кинематическую цепь «стопа — колено — таз — позвоночник».',
    technique_details: 'Плантоскопический осмотр. Разогрев заготовок специализированным феном (85°C). Установка в обувь, формование по стопе в нейтральном положении под весом тела, динамическая обкатка в ходьбе 5 минут.',
    regimen_standard: 'Постоянное ношение в закрытой обуви с жестким задником. Период адаптации 10–14 дней.',
    patient_preparation: 'Принести на прием повседневную или спортивную обувь с вынимающейся заводской стелькой.',
    post_procedure_care: 'Обязательный контрольный осмотр через 3–4 недели ношения с возможной коррекцией клиньями.',
    clinical_indications: 'Продольное и поперечное плоскостопие I–III ст., плантарный фасциит, пателлофеморальный синдром, вальгус коленей, укорочение конечности.',
    contraindications: 'Трофические язвы стопы, тяжелые ригидные деформации, требующие сложной ортопедической обуви.'
  },
  {
    code: 'orth_brace_knee_hinged',
    name: 'Шарнирный коленный ортез с полицентрическими шарнирами и замком ROM',
    subcategory: 'brace_hinged',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: null,
    servdict_code: 'А23.23.003',
    description: 'Рамочный ортез с боковыми шинами и полицентрическими шарнирами. Обеспечивает механическую защиту боковых связок от вальгус/варус деформаций и предотвращает переднюю/заднюю трансляцию голени при пластике ПКС/ЗКС с дозированием амплитуды движения.',
    technique_details: 'Подбор размера по окружности бедра и голени. Юстировка шарниров по оси надмыщелков. Настройка замков ROM: недели 1–2 (разгибание 0°, сгибание 30°–40°), недели 3–4 (до 90°).',
    regimen_standard: 'Постоянно при ходьбе в течение 4–8 недель после травмы или пластики связок. Сон в ортезе первые 2 недели (0°).',
    patient_preparation: 'Надевать поверх бесшовного хлопкового чулка.',
    post_procedure_care: 'Подтяжка ремней велкро по мере спадения отека бедра.',
    clinical_indications: 'Пластика ПКС/ЗКС, шов мениска, разрывы боковых связок II–III ст., нестабильность сустава.',
    contraindications: 'Острый тромбоз глубоких вен, флегмона конечности.'
  },
  {
    code: 'orth_tutor_rigid_knee',
    name: 'Жесткий тутор на коленный сустав (иммобилизация в разгибании 0°)',
    subcategory: 'tutor_rigid',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'А15.03.007',
    description: 'Иммобилизирующий тутор с 3–5 металлическими моделируемыми шинами. Полная блокировка сустава в физиологическом разгибании 0° без гипсования.',
    technique_details: 'Моделирование задней и боковых шин по анатомическому рельефу. Фиксация затяжными ремнями с чередованием сверху вниз.',
    regimen_standard: 'Круглосуточная иммобилизация от 2 до 4 недель по назначению врача.',
    patient_preparation: 'Контроль состояния кожи надколенника и подколенной ямки.',
    post_procedure_care: 'Изометрическая гимнастика четырехглавой мышцы бедра в туторе.',
    clinical_indications: 'Гемартроз, свежие частичные разрывы связок, острый период после вывиха надколенника, ранний постоперационный период.',
    contraindications: 'Несросшиеся переломы с риском вторичного смещения.'
  },
  {
    code: 'orth_turbocast_wrist',
    name: 'Наложение пластиковой иммобилизирующей повязки из Турбокаста на кисть/предплечье',
    subcategory: 'turbocast',
    target_joint: 'wrist',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1823,
    servdict_code: 'A15.03.002',
    description: 'Низкотемпературный термопластик с полиуретановым покрытием и микроперфорацией. Пластифицируется при 65–70°C, моделируется прямо по руке пациента, застывает за 3–5 минут. Влагостоек (можно мыться в душе), легок и рентгенопрозрачен.',
    technique_details: 'Разогрев в водяной бане, просушивание полотенцем, моделирование по запястью с приданием физиологического разгибания 20°. Фиксация велкро.',
    regimen_standard: 'Иммобилизация 3–5 недель в зависимости от патологии.',
    patient_preparation: 'Обработка кожи, защита ссадин гидроколлоидной повязкой.',
    post_procedure_care: 'Сушка феном после контакта с водой. При спадении отека — перемоделирование за 5 минут.',
    clinical_indications: 'Перелом лучевой кости в типичном месте, повреждение ладьевидно-полулунной связки, стилоидит де Кервена, состояние после остеосинтеза.',
    contraindications: 'Острый нарастающий отек с риском ишемии в первые 24 часа.'
  },
  {
    code: 'orth_turbocast_ankle',
    name: 'Наложение пластиковой повязки Турбокаст на голеностопный сустав и стопу',
    subcategory: 'turbocast',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1824,
    servdict_code: 'A15.03.002',
    description: 'Индивидуальный сапожок из термопластика TurboCast под углом 90°. Жесткая фиксация лодыжек и стопы с возможностью ходьбы с нагрузкой на каблук или подошву.',
    technique_details: 'Моделирование лонгеты под углом голеностопа 90° с повторением лодыжек и сводов стопы.',
    regimen_standard: 'Срок иммобилизации 4–6 недель.',
    patient_preparation: 'Контрольный рентген перед наложением.',
    post_procedure_care: 'Контрольный снимок через 7–10 дней прямо через повязку.',
    clinical_indications: 'Переломы лодыжек без смещения, разрыв таранно-малоберцовой связки, разрыв ахиллова сухожилия.',
    contraindications: 'Массивный ненадежный отек с фликтенами.'
  },
  {
    code: 'orth_corset_lso',
    name: 'Пояснично-крестцовый полужесткий корсет с ребрами жесткости (LSO)',
    subcategory: 'corset_lso',
    target_joint: 'spine',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'А15.03.007',
    description: 'Полужесткий корсет с 4–6 металлическими или пластиковыми ребрами жесткости и эластичными стяжками. Увеличивает внутрибрюшное давление, разгружает поясничные межпозвонковые диски L1–S1 на 25–40% и ограничивает патологический гиперлордоз.',
    technique_details: 'Подбор по окружности талии. Ребра моделируются по физиологическому изгибу поясницы. Надевание в положении лежа на спине.',
    regimen_standard: 'Ношение при вертикальных нагрузках и ходьбе (до 4–6 часов в сутки). В покое и во время сна снимается.',
    patient_preparation: 'Надевать поверх хлопкового белья.',
    post_procedure_care: 'Укрепление мышц спины и брюшного пресса (ЛФК) параллельно с разгрузкой корсетом.',
    clinical_indications: 'Острый радикулопатический синдром, грыжи и протрузии МПД поясничного отдела, спондилолистез I ст., спондилоартроз.',
    contraindications: 'Беременность, тяжелые заболевания легких и сердца с одышкой в покое.'
  },
  {
    code: 'orth_shoulder_abduction_sling',
    name: 'Отводящая шина-подушка плечевого сустава (угол отведения 30°-45°)',
    subcategory: 'brace_hinged',
    target_joint: 'shoulder',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'А15.03.007',
    description: 'Ортез с торакальным поясом и абдукционной подушкой 30°–45°. Снимает механическое натяжение с сухожилия надостной мышцы и защищает шов ротаторной манжеты.',
    technique_details: 'Регулировка угла подушки, фиксация предплечья в желобе, ремень через здоровое надплечье.',
    regimen_standard: 'Постоянно 4–6 недель после операции на ротаторной манжете.',
    patient_preparation: 'Примерка до или сразу после вмешательства.',
    post_procedure_care: 'Кистевая гимнастика (эспандер) для профилактики отека.',
    clinical_indications: 'Шов ротаторной манжеты плеча, разрыв надостной мышцы, нестабильность плечевого сустава.',
    contraindications: 'Фрактуры ребер на стороне фиксации.'
  }
];

function syncTreatmentsKnowledgeBase180(db, doneCallback) {
  console.log('[SyncTreatments] Starting migration and seeding of 3 catalogs...');

  db.serialize(() => {
    // 1. Insert / Update Manipulations
    const insertManStmt = db.prepare(`
      INSERT INTO ortho_manipulations_catalog (
        code, name, subcategory, target_joint, service_scope, default_priority,
        description, technique_details, regimen_standard, patient_preparation,
        post_procedure_care, clinical_indications, contraindications,
        servdict_id, servdict_code, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        subcategory = excluded.subcategory,
        target_joint = excluded.target_joint,
        service_scope = excluded.service_scope,
        default_priority = excluded.default_priority,
        description = excluded.description,
        technique_details = excluded.technique_details,
        regimen_standard = excluded.regimen_standard,
        patient_preparation = excluded.patient_preparation,
        post_procedure_care = excluded.post_procedure_care,
        clinical_indications = excluded.clinical_indications,
        contraindications = excluded.contraindications,
        servdict_id = excluded.servdict_id,
        servdict_code = excluded.servdict_code
    `);

    MANIPULATIONS_CATALOG.forEach(m => {
      insertManStmt.run(
        m.code, m.name, m.subcategory, m.target_joint, m.service_scope, m.default_priority,
        m.description, m.technique_details, m.regimen_standard, m.patient_preparation,
        m.post_procedure_care, m.clinical_indications, m.contraindications,
        m.servdict_id, m.servdict_code
      );
    });
    insertManStmt.finalize();
    console.log(`[SyncTreatments] Manipulations catalog populated (${MANIPULATIONS_CATALOG.length} items).`);

    // 2. Insert / Update Physiotherapy
    const insertPhysStmt = db.prepare(`
      INSERT INTO ortho_physiotherapy_catalog (
        code, name, subcategory, target_joint, service_scope, default_priority,
        description, technique_details, regimen_standard, patient_preparation,
        post_procedure_care, clinical_indications, contraindications,
        servdict_id, servdict_code, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        subcategory = excluded.subcategory,
        target_joint = excluded.target_joint,
        service_scope = excluded.service_scope,
        default_priority = excluded.default_priority,
        description = excluded.description,
        technique_details = excluded.technique_details,
        regimen_standard = excluded.regimen_standard,
        patient_preparation = excluded.patient_preparation,
        post_procedure_care = excluded.post_procedure_care,
        clinical_indications = excluded.clinical_indications,
        contraindications = excluded.contraindications,
        servdict_id = excluded.servdict_id,
        servdict_code = excluded.servdict_code
    `);

    PHYSIOTHERAPY_CATALOG.forEach(p => {
      insertPhysStmt.run(
        p.code, p.name, p.subcategory, p.target_joint, p.service_scope, p.default_priority,
        p.description, p.technique_details, p.regimen_standard, p.patient_preparation,
        p.post_procedure_care, p.clinical_indications, p.contraindications,
        p.servdict_id, p.servdict_code
      );
    });
    insertPhysStmt.finalize();
    console.log(`[SyncTreatments] Physiotherapy catalog populated (${PHYSIOTHERAPY_CATALOG.length} items).`);

    // 3. Insert / Update Orthotics
    const insertOrthStmt = db.prepare(`
      INSERT INTO ortho_orthotics_catalog (
        code, name, subcategory, target_joint, service_scope, default_priority,
        description, technique_details, regimen_standard, patient_preparation,
        post_procedure_care, clinical_indications, contraindications,
        servdict_id, servdict_code, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        subcategory = excluded.subcategory,
        target_joint = excluded.target_joint,
        service_scope = excluded.service_scope,
        default_priority = excluded.default_priority,
        description = excluded.description,
        technique_details = excluded.technique_details,
        regimen_standard = excluded.regimen_standard,
        patient_preparation = excluded.patient_preparation,
        post_procedure_care = excluded.post_procedure_care,
        clinical_indications = excluded.clinical_indications,
        contraindications = excluded.contraindications,
        servdict_id = excluded.servdict_id,
        servdict_code = excluded.servdict_code
    `);

    ORTHOTICS_CATALOG.forEach(o => {
      insertOrthStmt.run(
        o.code, o.name, o.subcategory, o.target_joint, o.service_scope, o.default_priority,
        o.description, o.technique_details, o.regimen_standard, o.patient_preparation,
        o.post_procedure_care, o.clinical_indications, o.contraindications,
        o.servdict_id, o.servdict_code
      );
    });
    insertOrthStmt.finalize();
    console.log(`[SyncTreatments] Orthotics catalog populated (${ORTHOTICS_CATALOG.length} items).`);

    // 4. Link all 180 templates
    db.all("SELECT id, title, cluster_id, default_mkb_code FROM ortho_templates", (tmplErr, templates) => {
      if (tmplErr || !templates) {
        console.error('[SyncTreatments] Error reading templates:', tmplErr);
        if (doneCallback) doneCallback();
        return;
      }

      console.log(`[SyncTreatments] Linking treatments across all ${templates.length} templates...`);

      const insTmplMan = db.prepare(`
        INSERT OR IGNORE INTO ortho_template_manipulations 
        (template_id, manipulation_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope)
        VALUES (?, ?, ?, ?, ?, 'high', 'internal')
      `);

      const insTmplPhys = db.prepare(`
        INSERT OR IGNORE INTO ortho_template_physiotherapy 
        (template_id, physiotherapy_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope)
        VALUES (?, ?, ?, ?, ?, 'high', 'internal')
      `);

      const insTmplOrth = db.prepare(`
        INSERT OR IGNORE INTO ortho_template_orthotics 
        (template_id, orthotics_code, dosage_or_regimen, is_mandatory, sort_order, priority_level, service_scope)
        VALUES (?, ?, ?, ?, ?, 'high', 'internal')
      `);

      templates.forEach(t => {
        const cluster = (t.cluster_id || '').toLowerCase();
        const mkb = (t.default_mkb_code || '').toUpperCase();

        // Knee cluster / pathologies
        if (cluster.includes('knee') || mkb.startsWith('M17') || mkb.startsWith('M23') || mkb.startsWith('S83')) {
          insTmplMan.run(t.id, 'man_prp_cortexil_10', 'Курс 3 инъекции с интервалом 7–10 дней', 1, 10);
          insTmplMan.run(t.id, 'man_ha_gialripayer_15', '1 инъекция в верхне-латеральный заворот', 1, 20);
          insTmplMan.run(t.id, 'man_puncture_aspiration', 'При реактивном синовите или гемартрозе', 0, 30);
          insTmplMan.run(t.id, 'man_taping_kinesio', 'Аппликация на 3–5 дней для разгрузки надколенника', 0, 40);

          insTmplPhys.run(t.id, 'phys_eswt_radial', '5–6 сеансов с интервалом 5–7 дней', 1, 10);
          insTmplPhys.run(t.id, 'phys_sis_magnet', '6–8 процедур, индукция 2.0–2.5 Тл', 1, 20);
          insTmplPhys.run(t.id, 'phys_laser_hilt', '6 сеансов для снятия синовита и отека', 0, 30);
          insTmplPhys.run(t.id, 'phys_cpm_artromot', 'Пассивная разработка 30 мин ежедневно', 0, 40);

          insTmplOrth.run(t.id, 'orth_brace_knee_hinged', 'Шарнирный брейс с регулировкой углов ROM при ходьбе', 1, 10);
          insTmplOrth.run(t.id, 'orth_insole_formthotics', 'Стельки Formthotics для коррекции вальгуса/пронации', 1, 20);
          insTmplOrth.run(t.id, 'orth_tutor_rigid_knee', 'В разгибании 0° в остром периоде травмы', 0, 30);
        }
        // Shoulder cluster
        else if (cluster.includes('shoulder') || mkb.startsWith('M75') || mkb.startsWith('S43')) {
          insTmplMan.run(t.id, 'man_shoulder_subacromial_block', 'Субакромиально под УЗИ 1 мл ГКС + 3 мл ропивакаина', 1, 10);
          insTmplMan.run(t.id, 'man_prp_cortexil_10', 'PRP надостной мышцы под УЗИ №2–3', 1, 20);
          insTmplMan.run(t.id, 'man_shoulder_suprascapular_block', 'При адгезивном капсулите/стойком болевом синдроме', 0, 30);
          insTmplMan.run(t.id, 'man_taping_kinesio', 'Поддерживающая аппликация на дельтовидную мышцу', 0, 40);

          insTmplPhys.run(t.id, 'phys_eswt_radial', 'УВТ субакромиального пространства 5–7 сеансов', 1, 10);
          insTmplPhys.run(t.id, 'phys_sis_magnet', 'Высокоинтенсивный магнит SIS на ротаторы плеча', 1, 20);
          insTmplPhys.run(t.id, 'phys_laser_hilt', 'HILT-лазер для купирования острого бурсита', 0, 30);

          insTmplOrth.run(t.id, 'orth_shoulder_abduction_sling', 'Отводящая шина 30° при повреждении надостной мышцы', 1, 10);
        }
        // Hip & Pelvis
        else if (cluster.includes('hip') || mkb.startsWith('M16') || mkb.startsWith('S73')) {
          insTmplMan.run(t.id, 'man_hip_trochanter_block', 'Блокада зоны большого вертела под УЗИ', 1, 10);
          insTmplMan.run(t.id, 'man_ha_gialripayer_15', 'Внутрисуставное введение HA под УЗИ-навигацией', 1, 20);
          insTmplMan.run(t.id, 'man_prp_cortexil_20', 'PRP Cortexil 20 мл в полость ТБС', 0, 30);

          insTmplPhys.run(t.id, 'phys_sis_magnet', 'SIS-магнитотерапия на область вертела и таза', 1, 10);
          insTmplPhys.run(t.id, 'phys_eswt_radial', 'УВТ области трохантера 5 сеансов', 1, 20);
          insTmplPhys.run(t.id, 'phys_eswt_focused', 'Фокусированная УВТ головки бедра при асептическом некрозе', 0, 30);

          insTmplOrth.run(t.id, 'orth_insole_formthotics', 'Стельки Formthotics с компенсацией перекоса таза', 1, 10);
        }
        // Foot & Ankle
        else if (cluster.includes('foot') || cluster.includes('ankle') || mkb.startsWith('M77.3') || mkb.startsWith('M20') || mkb.startsWith('S93')) {
          insTmplMan.run(t.id, 'man_foot_plantar_fascia_prp', 'PRP фасции под УЗИ №2 с микрофенестрацией', 1, 10);
          insTmplMan.run(t.id, 'man_taping_kinesio', 'Кинезиотейп свода стопы и ахиллова сухожилия', 1, 20);

          insTmplPhys.run(t.id, 'phys_eswt_radial', 'УВТ пяточной шпоры/ахилла 5–6 сеансов', 1, 10);
          insTmplPhys.run(t.id, 'phys_sis_magnet', 'SIS магнитотерапия на голеностоп', 1, 20);
          insTmplPhys.run(t.id, 'phys_laser_hilt', 'HILT-лазер при остром отеке голеностопа', 0, 30);

          insTmplOrth.run(t.id, 'orth_insole_formthotics', 'Индивидуальные стельки Formthotics (обязательно)', 1, 10);
          insTmplOrth.run(t.id, 'orth_turbocast_ankle', 'Турбокаст сапожок при разрывах связок/переломах', 0, 20);
        }
        // Spine & Thorax
        else if (cluster.includes('spine') || mkb.startsWith('M54') || mkb.startsWith('M51') || mkb.startsWith('M47')) {
          insTmplMan.run(t.id, 'man_spine_paravertebral_block', 'Паравертебральная блокада триггерных зон №2–3', 1, 10);
          insTmplMan.run(t.id, 'man_taping_kinesio', 'Декомпрессионное тейпирование пояснично-крестцового отдела', 1, 20);

          insTmplPhys.run(t.id, 'phys_sis_magnet', 'SIS Super Inductive System на позвоночник 8–10 сеансов', 1, 10);
          insTmplPhys.run(t.id, 'phys_vtes_stimulation', 'ВТЭС по Герасимову на остистые отростки', 1, 20);
          insTmplPhys.run(t.id, 'phys_laser_hilt', 'HILT-лазеротерапия паравертебрально', 0, 30);

          insTmplOrth.run(t.id, 'orth_corset_lso', 'Поясничный корсет LSO с ребрами жесткости', 1, 10);
          insTmplOrth.run(t.id, 'orth_insole_formthotics', 'Стельки Formthotics для амортизации позвоночника', 0, 20);
        }
        // Elbow
        else if (cluster.includes('elbow') || mkb.startsWith('M77.1') || mkb.startsWith('M77.0') || mkb.startsWith('S53')) {
          insTmplMan.run(t.id, 'man_elbow_epicondyle_prp', 'PRP сухожилий разгибателей под УЗИ №2', 1, 10);
          insTmplMan.run(t.id, 'man_taping_kinesio', 'Тейпирование локтевого сустава и предплечья', 1, 20);

          insTmplPhys.run(t.id, 'phys_eswt_radial', 'УВТ надмыщелков 5 сеансов с интервалом 5–7 дней', 1, 10);
          insTmplPhys.run(t.id, 'phys_laser_hilt', 'HILT-лазер на зону эпикондилита', 0, 20);

          insTmplOrth.run(t.id, 'orth_turbocast_wrist', 'Иммобилизация TurboCast в остром периоде', 0, 10);
        }
        // Wrist & Hand
        else if (cluster.includes('wrist') || mkb.startsWith('G56') || mkb.startsWith('M65') || mkb.startsWith('S63')) {
          insTmplMan.run(t.id, 'man_wrist_carpal_canal_block', 'Гидродиссекция и блокада срединного нерва под УЗИ', 1, 10);
          insTmplMan.run(t.id, 'man_taping_kinesio', 'Кинезиотейп лучезапястного сустава', 1, 20);

          insTmplPhys.run(t.id, 'phys_laser_hilt', 'HILT-лазер карпального канала №6', 1, 10);
          insTmplPhys.run(t.id, 'phys_sis_magnet', 'SIS магнитотерапия запястья и пальцев', 1, 20);

          insTmplOrth.run(t.id, 'orth_turbocast_wrist', 'Повязка TurboCast на кисть и лучезапястный сустав', 1, 10);
        }
        // General / Other clusters
        else {
          insTmplMan.run(t.id, 'man_prp_cortexil_10', 'Курс биорегенерации PRP под УЗИ', 1, 10);
          insTmplMan.run(t.id, 'man_taping_kinesio', 'Кинезиотейпирование зоны боли', 1, 20);

          insTmplPhys.run(t.id, 'phys_eswt_radial', 'УВТ 5 сеансов на триггерные зоны', 1, 10);
          insTmplPhys.run(t.id, 'phys_sis_magnet', 'SIS магнитотерапия 6–8 процедур', 1, 20);

          insTmplOrth.run(t.id, 'orth_insole_formthotics', 'Стельки Formthotics для коррекции биомеханики шага', 1, 10);
        }
      });

      insTmplMan.finalize();
      insTmplPhys.finalize();
      insTmplOrth.finalize();

      console.log(`[SyncTreatments] Successfully linked treatments across all ${templates.length} templates!`);

      // Verify counts
      db.get("SELECT COUNT(*) AS c FROM ortho_template_manipulations", (e1, r1) => {
        db.get("SELECT COUNT(*) AS c FROM ortho_template_physiotherapy", (e2, r2) => {
          db.get("SELECT COUNT(*) AS c FROM ortho_template_orthotics", (e3, r3) => {
            console.log(`[SyncTreatments] Final Junction Counts:`);
            console.log(` - Template Manipulations: ${r1 ? r1.c : 0}`);
            console.log(` - Template Physiotherapy: ${r2 ? r2.c : 0}`);
            console.log(` - Template Orthotics: ${r3 ? r3.c : 0}`);
            if (doneCallback) doneCallback();
          });
        });
      });
    });
  });
}

// If executed directly from command line
if (require.main === module) {
  const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
  console.log('Connecting to DB at:', dbPath);
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('DB connect error:', err);
      process.exit(1);
    }
    syncTreatmentsKnowledgeBase180(db, () => {
      console.log('Seeder complete. Closing database connection.');
      db.close();
    });
  });
}

module.exports = { syncTreatmentsKnowledgeBase180 };
