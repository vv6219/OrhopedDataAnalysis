/**
 * clinicalProtocolResolver.ts
 *
 * Client-side clinical protocol & preparation resolver for Orthopedic Referrals & Orders.
 * Guarantees that "Клинические параметры и протокол", "Подготовка" and
 * "Памятка пациенту по подготовке к процедурам (из клинического стандарта Центра)"
 * are ALWAYS filled to professional medical standard with KaTeX formulas and detailed clinical rules.
 */

export interface ClinicalItemLike {
  id?: string | number;
  item_title?: string;
  name?: string;
  title?: string;
  service_code?: string;
  code?: string;
  domain?: string;
  category?: string;
  item_details?: string;
  dosage_notes?: string;
  details?: any;
  regimen_standard?: string;
  technique_details?: string;
  protocol_phrase?: string;
  patient_preparation?: string;
  preparation_notes?: string;
  formula_latex?: string;
  description?: string;
}

/**
 * Resolves full, authentic clinical protocol & parameters text for any referral/prescription item,
 * incorporating biophysical parameters and KaTeX formulas.
 */
export function resolveClinicalProtocolText(
  item: ClinicalItemLike,
  _context?: { targetJoint?: string; targetSide?: string; diagnosis?: string }
): string {
  // If item_details has rich LaTeX formulas or length > 60, use it directly
  if (item.item_details && typeof item.item_details === 'string') {
    const trimmed = item.item_details.trim();
    if (trimmed.length > 50 && (trimmed.includes('$') || trimmed.includes('Бар') || trimmed.includes('Дж/см'))) {
      return trimmed;
    }
  }

  // Check details object
  if (item.details && typeof item.details === 'object') {
    const objText = item.details.notes || item.details.protocol || item.details.text || item.details.dosage;
    if (typeof objText === 'string' && objText.trim().length > 50 && objText.includes('$')) {
      return objText.trim();
    }
  }

  const title = (item.item_title || item.name || item.title || '').toLowerCase();
  const serviceCode = (item.service_code || item.code || '').toUpperCase();
  const domain = (item.domain || item.category || '').toLowerCase();

  // 1. PRP / Autologous Plasma / Cortexil / ACP
  if (
    title.includes('prp') ||
    title.includes('плазмолифтинг') ||
    title.includes('плазмотерап') ||
    title.includes('аутоплазм') ||
    title.includes('cortexil') ||
    serviceCode.includes('11.12.009')
  ) {
    return 'Курс: $3\\text{ инъекции}$ с интервалом $7\\text{--}14\\text{ дней}$. Забор венозной крови $V = 10\\text{--}20\\text{ мл}$ в пробирку Cortexil, фракционирование в бакетном роторе ($\\mathrm{RCF} = 1200\\text{--}1500\\times g$, $t = 10\\text{ мин}$). Концентрация тромбоцитов $\\mathrm{PLT} \\ge 1.0\\times 10^6/\\mu\\text{л}$ ($4\\text{--}6\\times$ от базового уровня). Асептическое введение аутологичной обогащенной плазмы под УЗ-навигацией в полость сустава / перитендинозно. Охранительный режим $t = 24\\text{ ч}$.';
  }

  // 2. Hyaluronic Acid / Synovial fluid prosthesis
  if (
    title.includes('гиалурон') ||
    title.includes('ферматрон') ||
    title.includes('гиалрипайер') ||
    title.includes('вискоэластик') ||
    title.includes('протез синовиальн') ||
    serviceCode.includes('11.04.004.3')
  ) {
    return 'Курс: $3\\text{--}5\\text{ инъекций}$ с интервалом $7\\text{--}10\\text{ дней}$ (для пролонгированных форм $V = 3.0\\text{--}4.0\\text{ мл}$ — однократно). Протез синовиальной жидкости с молекулярной массой $M_w = 2.4\\text{--}3.6\\text{ МДа}$, концентрация $1.5\\text{--}2.2\\%$, объем $V = 2.0\\text{ мл}$. Введение под УЗ-контролем в суставную щель после предварительной эвакуации выпота. Ограничение осевой нагрузки $24\\text{ ч}$.';
  }

  // 3. Arthrocentesis / Puncture / Joint aspiration
  if (
    title.includes('пункци') ||
    title.includes('артроцентез') ||
    title.includes('аспираци') ||
    title.includes('эвакуаци') ||
    serviceCode.includes('11.04.003')
  ) {
    return 'Лечебно-диагностический артроцентез под ультразвуковой навигацией в В-режиме ($f = 12\\text{ МГц}$) и ЦДК. Местная инфильтрационная анестезия $\\text{Sol. Lidocaini } 1\\%\\text{ -- }2.0\\text{--}5.0\\text{ мл}$. Пункция иглой $G = 18\\text{--}20\\text{G}$, полная эвакуация синовиального выпота/гемартроза с лабораторным исследованием пунктата (цитология, микроскопия, белок).';
  }

  // 4. Blockade / GCS / Diprospan / Kenalog
  if (
    title.includes('блокад') ||
    title.includes('гкс') ||
    title.includes('дипроспан') ||
    title.includes('кеналог') ||
    title.includes('дексаметазон') ||
    serviceCode.includes('11.04.004')
  ) {
    return 'Купирование острой фазы синовита/бурсита. Внутрисуставная/периартикулярная блокада микрокристаллическим ГКС (Бетаметазон $V = 1.0\\text{ мл}$) с анестетиком ($\\text{Sol. Ropivacaini } 0.5\\%\\text{ -- }2.0\\text{ мл}$) под УЗ-контролем строго вне ткани сухожилий. Контроль АД и гликемии в течение $t = 48\\text{ ч}$.';
  }

  // 5. Shockwave therapy (ESWT / rESWT / fESWT)
  if (
    title.includes('ударно-волн') ||
    title.includes('увт') ||
    title.includes('eswt') ||
    title.includes('reswt') ||
    title.includes('feswt')
  ) {
    return 'Радиальная/фокусированная ударно-волновая терапия: давление $P = 1.8\\text{--}3.2\\text{ Бар}$, частота $f = 10\\text{--}15\\text{ Гц}$, плотность потока энергии $\\mathrm{EFD} = 0.15\\text{--}0.35\\text{ мДж/мм}^2$, суммарно $N = 2500\\pm 500\\text{ импульсов}$ на сеанс. Курс: $5\\text{--}7\\text{ сеансов}$ с интервалом $5\\text{--}7\\text{ дней}$. Без применения местной анестезии.';
  }

  // 6. High-intensity laser (HILT)
  if (
    title.includes('hilt') ||
    title.includes('лазер') ||
    title.includes('лазеротерап') ||
    serviceCode.includes('17.30.010')
  ) {
    return 'Высокоинтенсивная лазеротерапия HILT (длина волны $\\lambda = 1064\\text{ нм}$, импульсная пиковая мощность $P_{\\text{peak}} \\ge 1\\text{ кВт}$). Режим биостимуляции $E = 8\\text{--}15\\text{ Дж/см}^2$, противоотечный анальгетический режим до $25\\text{ Дж/см}^2$. Курс: $6\\text{--}10\\text{ сеансов}$ ежедневно или через день.';
  }

  // 7. Magnetotherapy (SIS / PEMF / ПЕМП)
  if (title.includes('магнит') || title.includes('пемп') || title.includes('pemf') || title.includes('sis')) {
    return 'Высокоинтенсивная импульсная магнитотерапия Super Inductive System (SIS): индукция магнитного поля $B = 2.5\\text{--}3.0\\text{ Тл}$, частота $f = 15\\text{--}50\\text{ Гц}$, градиент $\\mathrm{d}B/\\mathrm{d}t \\ge 10^4\\text{ Тл/с}$. Курс: $8\\text{--}12\\text{ сеансов}$ по $12\\text{--}15\\text{ минут}$ ежедневно или через день.';
  }

  // 8. Electrostimulation (NMES / FES / ЭМГ-БОС)
  if (title.includes('электростимул') || title.includes('nmes') || title.includes('fes') || title.includes('миостимул')) {
    return 'Нейромышечная стимуляция: биполярные импульсы частотой $f = 35\\text{--}75\\text{ Гц}$, длительность $\\tau = 250\\text{--}400\\text{ мкс}$, соотношение $T_{\\mathrm{on}} : T_{\\mathrm{off}} = 1 : 3$, синхронизация с волевым сокращением целевой мышцы. Курс: $10\\text{--}15\\text{ сеансов}$ по $20\\text{--}30\\text{ минут}$.';
  }

  // 9. PIR / Manual therapy / Maitland
  if (
    title.includes('пир') ||
    title.includes('мейтланд') ||
    title.includes('мобилизац') ||
    title.includes('мануальн') ||
    title.includes('постизометрическ') ||
    serviceCode.includes('15.04.002')
  ) {
    return 'Постизометрическая релаксация: изометрическое напряжение мышцы силой $F = 15\\text{--}20\\%\\ F_{\\max}$ в течение $t_1 = 7\\text{--}10\\text{ с}$, фаза глубокого выдоха и мягкого удлинения $t_2 = 15\\text{--}20\\text{ с}$ (повторы $n = 3\\text{--}5$). Мягкотканная суставная мобилизация по Мейтланду I–IV степени. Курс: $5\\text{--}10\\text{ процедур}$.';
  }

  // 10. Artromot / CPM / Механотерапия
  if (title.includes('artromot') || title.includes('артромот') || title.includes('cpm') || title.includes('механотерап')) {
    return 'Роботизированная пассивная CPM-механотерапия: стартовый угол сгибания $\\alpha_0 = 30^\\circ$, суточная прогрессия $\\Delta\\alpha = +5^\\circ/\\text{день}$ до целевой амплитуды $\\alpha \\ge 110^\\circ$, угловая скорость $\\omega = 60^\\circ/\\text{мин}$. Длительность $30\\text{--}45\\text{ минут}$, курс: $10\\text{--}15\\text{ процедур}$ ежедневно.';
  }

  // 11. Stabilometry / Postural training
  if (title.includes('стабилометр') || title.includes('постуральн') || title.includes('проприоцеп')) {
    return 'Стабилометрический постуральный тренинг с биологической обратной связью (БОС). Калибровка центра давления (CoP), мишень и динамический перенос веса с отклонением $\\Delta X, \\Delta Y \\le 15\\text{ мм}$, $15\\text{--}25\\text{ минут}$, курс: $10\\text{--}12\\text{ сеансов}$.';
  }

  // 12. Orthopedic Insoles / Formthotics
  if (
    title.includes('стельк') ||
    title.includes('formthotics') ||
    title.includes('ортезирование стоп') ||
    serviceCode.includes('05.050.001')
  ) {
    return 'Термоформовка разогретой заготовки Formthotics ($T = 85^\\circ\\text{C}$) под осевой нагрузкой весом тела в нейтральном положении подтаранного сустава (Subtalar Neutral, $\\mathrm{STJN} = 0^\\circ$). Адаптация $3\\text{--}4\\text{ недели}$, контрольный осмотр с установкой функциональных клиньев (коррекция варуса/вальгуса $\\pm 4^\\circ$).';
  }

  // 13. Orthosis / Brace / Walker
  if (
    title.includes('ортез') ||
    title.includes('тутор') ||
    title.includes('бандаж') ||
    title.includes('walker') ||
    title.includes('сапожок')
  ) {
    return 'Шарнирный ортез/брейс с регулировкой углов: угол сгибания $\\alpha_{\\text{flex}} \\le 30^\\circ\\text{--}60^\\circ$ с шагом прогрессии $\\Delta\\alpha = 15^\\circ$ каждые $2\\text{ недели}$. Режим постоянного ношения при осевой нагрузке весом тела (PWB $\\to$ FWB).';
  }

  // 14. Crutches / Walking aids
  if (title.includes('костыл') || title.includes('трость') || title.includes('опор') || serviceCode.includes('15.03.007')) {
    return 'Индивидуальная регулировка костылей с мягкими опорами по росту пациента. Обучение биомеханической походке с дозированной осевой разгрузкой конечности ($10\\%\\text{ массы}$ при TTWB, $30\\text{--}50\\%$ при PWB).';
  }

  // 15. MRI
  if (title.includes('мрт') || title.includes('магнитно-резонансн') || serviceCode.startsWith('A05.30')) {
    return 'Высокопольная томография ($B_0 \\ge 1.5\\text{--}3.0\\text{ Тл}$) со специализированной суставной катушкой. Импульсные последовательности: PD-FS, T1-WI, T2-WI, STIR в 3-х взаимно перпендикулярных проекциях (толщина среза $d \\le 2.5\\text{--}3.0\\text{ мм}$, матрица $\\ge 320\\times 320$). Оценка хряща, связок, менисков и субхондральной кости.';
  }

  // 16. X-ray
  if (title.includes('рентген') || title.includes('rg') || serviceCode.startsWith('A06.03') || serviceCode.startsWith('A06.04')) {
    return 'Рентгенография в 2-х стандартных проекциях (прямая и боковая) стоя с функциональной осевой нагрузкой весом тела ($100\\%\\ \\mathrm{BW}$). При необходимости — стресс-рентгенография и проекция Розенберга ($45^\\circ\\text{ сгибания}$).';
  }

  // 17. CT / MSCT
  if (title.includes('кт ') || title.includes('компьютерн') || title.includes('мскт') || serviceCode.startsWith('A06.30')) {
    return 'Мультиспиральная компьютерная томография (МСКТ) с изотропным вокселем ($0.5\\times 0.5\\times 0.5\\text{ мм}$), толщина среза $d = 0.5\\text{--}1.0\\text{ мм}$, 3D-реконструкция костных структур, оценка микроархитектоники и костных дефектов.';
  }

  // 18. Ultrasound
  if (title.includes('узи') || title.includes('сонограф') || title.includes('ультразвук') || serviceCode.startsWith('A04.04')) {
    return 'Ультразвуковое исследование линейным датчиком высокой частоты $f = 10\\text{--}18\\text{ МГц}$ в В-режиме, ЦДК и энергетическом допплере (PDI). Оценка объема выпота, синовиальной гипертрофии ($h \\ge 2.0\\text{ мм}$), целостности сухожильно-связочного аппарата.';
  }

  // 19. ENMG
  if (title.includes('энмг') || title.includes('электронейромиограф') || title.includes('эмг')) {
    return 'Стимуляционная и игольчатая электронейромиография: скорость распространения возбуждения ($\\mathrm{СРВ} \\ge 50\\text{ м/с}$), амплитуда M-ответа ($A \\ge 3.5\\text{ мВ}$) и резидуальная латентность по двигательным и чувствительным волокнам.';
  }

  // 20. LFK / Physical therapy
  if (title.includes('лфк') || title.includes('гимнастик') || title.includes('кинезио') || domain === 'lfk') {
    return 'Индивидуальный протокол лечебной гимнастики: изометрические упражнения закрытой кинетической цепи ($F \\le 50\\%\\ F_{\\max}$ на 1-м этапе), последующий концентрический/эксцентрический тренинг мышц-стабилизаторов, тренировка проприоцепции. $3\\text{--}4\\text{ раза в неделю}$ по $45\\text{ минут}$.';
  }

  // 21. Surgery / Arthroscopy
  if (title.includes('артроскоп') || title.includes('пластик') || title.includes('резекци') || title.includes('операци') || domain === 'surgery') {
    return 'Плановая лечебно-диагностическая артроскопия / реконструктивная операция в условиях стационара. Стандартный госпитальный комплекс (ОАК, биохимия, коагулограмма $\\mathrm{МНО} \\le 1.2$, ЭКГ, Rg ОГК, консультация терапевта).';
  }

  // 22. Laboratory / Blood tests
  if (title.includes('анализ') || title.includes('кров') || title.includes('срб') || title.includes('лаборатор') || domain === 'lab') {
    return 'Лабораторное исследование натощак: клинический анализ крови с лейкоцитарной формулой, СОЭ, С-реактивный белок (СРБ количественный), коагулограмма (АЧТВ, МНО, фибриноген), мочевая кислота.';
  }

  // Catalog fields fallback
  const catParts: string[] = [];
  if (item.regimen_standard && typeof item.regimen_standard === 'string' && item.regimen_standard.trim()) {
    catParts.push(item.regimen_standard.trim());
  }
  if (item.technique_details && typeof item.technique_details === 'string' && item.technique_details.trim()) {
    catParts.push(item.technique_details.trim());
  } else if (item.protocol_phrase && typeof item.protocol_phrase === 'string' && item.protocol_phrase.trim()) {
    catParts.push(item.protocol_phrase.trim());
  } else if (item.description && typeof item.description === 'string' && item.description.trim()) {
    catParts.push(item.description.trim());
  }
  if (catParts.length > 0) {
    const joined = catParts.join('. ').replace(/\.\./g, '.');
    if (joined.length > 5) return joined;
  }

  // Domain fallbacks
  switch (domain) {
    case 'diagnostics':
      return 'Стандартный инструментально-диагностический протокол визуализации в соответствии с клиническими рекомендациями Минздрава РФ.';
    case 'manipulation':
      return 'Клинический протокол местной амбулаторной манипуляции в условиях процедурного кабинета с соблюдением правил асептики и антисептики.';
    case 'physio':
      return 'Курс восстановительной аппаратной физиотерапии 8–10 процедур по индивидуальной схеме с мониторингом переносимости.';
    case 'orthotics':
      return 'Индивидуальный подбор и биомеханическая подгонка ортопедического изделия с инструктажем по правилам эксплуатации и режиму ношения.';
    case 'lfk':
      return 'Индивидуальный комплекс двигательной реабилитации по этапам клинического восстановления функции сустава.';
    case 'surgery':
      return 'Консультативно-диагностический отбор на оперативное лечение с оценкой соматического статуса.';
    default:
      return 'Стандартный клинический протокол обследования и консервативного лечения по профилю травматологии и ортопедии.';
  }
}

/**
 * Resolves detailed, authoritative preparation instructions for an individual item.
 */
export function resolveItemPreparation(item: ClinicalItemLike): string {
  // If explicitly present and non-trivial, use it
  if (item.preparation_notes && typeof item.preparation_notes === 'string' && item.preparation_notes.trim().length > 5) {
    return item.preparation_notes.trim();
  }
  if (item.patient_preparation && typeof item.patient_preparation === 'string' && item.patient_preparation.trim().length > 5) {
    return item.patient_preparation.trim();
  }

  const title = (item.item_title || item.name || item.title || '').toLowerCase();
  const serviceCode = (item.service_code || item.code || '').toUpperCase();
  const domain = (item.domain || item.category || '').toLowerCase();

  // PRP / Cortexil
  if (title.includes('prp') || title.includes('плазмолифтинг') || title.includes('плазмотерап') || title.includes('аутоплазм') || title.includes('cortexil')) {
    return 'Строгая отмена НПВП за $\\ge 7\\text{ дней}$ (сохраняют активность тромбоцитов). Питьевой режим: $V_{\\text{H}_2\\text{O}} = 1.5\\text{--}2.0\\text{ л}$ за 24 ч. Исключить жирную пищу и алкоголь за 48 ч. Легкий безуглеводный завтрак в день забора крови.';
  }

  // Hyaluronic acid
  if (title.includes('гиалурон') || title.includes('ферматрон') || title.includes('гиалрипайер') || title.includes('вискоэластик') || title.includes('протез синовиальн')) {
    return 'Осмотр зоны инъекции на отсутствие повреждений кожи и острого выпота. Сообщить врачу об аллергии на анестетики (лидокаин). Ограничение ударных нагрузок в течение 24 ч после процедуры.';
  }

  // Puncture / Arthrocentesis
  if (title.includes('пункци') || title.includes('артроцентез') || title.includes('аспираци') || title.includes('эвакуаци')) {
    return 'Гигиеническая обработка кожи конечности. Сбор аллергоанамнеза на местные анестетики. Оценка свертывающей системы крови (МНО/АЧТВ) при приеме антикоагулянтов.';
  }

  // Blockade / GCS
  if (title.includes('блокад') || title.includes('гкс') || title.includes('дипроспан') || title.includes('кеналог') || title.includes('дексаметазон')) {
    return 'Контроль артериального давления и уровня сахара крови у пациентов с сахарным диабетом. Сбор аллергоанамнеза на анестетики. Сохранять стерильную салфетку на месте прокола 24 ч.';
  }

  // Shockwave therapy (ESWT)
  if (title.includes('ударно-волн') || title.includes('увт') || title.includes('eswt') || title.includes('reswt')) {
    return 'Не принимать обезболивающие и НПВП за 24 ч до сеанса (не маскировать болевой триггер). Осмотр кожи на отсутствие свежих гематом и ран.';
  }

  // Laser (HILT)
  if (title.includes('hilt') || title.includes('лазер') || title.includes('лазеротерап')) {
    return 'Кожа в зоне воздействия должна быть сухой, без нанесенных кремов и мазей. Защитные очки для пациента и врача обязательны во время работы аппарата.';
  }

  // Magnetotherapy (SIS)
  if (title.includes('магнит') || title.includes('пемп') || title.includes('pemf') || title.includes('sis')) {
    return 'Перед сеансом снять все электронные устройства, смарт-часы, банковские карты, съемные металлические предметы. Безопасно при титановых имплантах и эндопротезах.';
  }

  // NMES
  if (title.includes('электростимул') || title.includes('nmes') || title.includes('fes') || title.includes('миостимул')) {
    return 'Чистая кожа, бритье волосяного покрова при необходимости для плотного контакта гидрогелевых электродов. Удобная одежда для доступа к мышце.';
  }

  // CPM / Artromot / PIR / LFK
  if (title.includes('artromot') || title.includes('артромот') || title.includes('cpm') || title.includes('лфк') || title.includes('пир') || domain === 'lfk') {
    return 'Свободная спортивная одежда, хлопчатобумажные носки, нескользкая сменная обувь. Прием пищи не позднее чем за 1.5 ч до занятия.';
  }

  // Formthotics / Insoles
  if (title.includes('стельк') || title.includes('formthotics') || title.includes('ортезирование стоп')) {
    return 'Принести с собой 2 пары повседневной и спортивной обуви со съемной заводской стелькой и плотным задником.';
  }

  // MRI
  if (title.includes('мрт') || title.includes('магнитно-резонансн') || serviceCode.startsWith('A05.30')) {
    return 'Снять все металлические украшения, часы, одежду с металлическими молниями. Сообщить о наличии кардиостимуляторов или ферромагнитных имплантов. Длительность $20\\text{--}30\\text{ мин}$ неподвижности.';
  }

  // X-ray / CT
  if (title.includes('рентген') || title.includes('rg') || title.includes('кт ') || title.includes('компьютерн') || serviceCode.startsWith('A06')) {
    return 'Снять одежду и металлические предметы в зоне снимка. Для снимков под нагрузкой — способность стоять $10\\text{--}15\\text{ секунд}$. Неисследуемые зоны экранируются свинцовым фартуком.';
  }

  // Ultrasound
  if (title.includes('узи') || title.includes('сонограф') || serviceCode.startsWith('A04')) {
    return 'Специальной подготовки не требуется. Кожа чистая, без нанесенных мазей/пластырей за 4 ч до осмотра. Удобная одежда для доступа к парному суставу.';
  }

  // Laboratory
  if (title.includes('анализ') || title.includes('кров') || domain === 'lab') {
    return 'Строго натощак (8–12 часов голодания), пить только чистую негазированную воду. Исключить физические нагрузки и алкоголь накануне.';
  }

  return 'Специальной подготовки не требуется. Прибыть за 10 минут до назначенного времени с паспортом и медицинской документацией.';
}

/**
 * Aggregates all preparation notes from referral items into a unified, non-redundant,
 * professionally structured "Памятка пациенту по подготовке к процедурам".
 */
export function resolveAggregatedPreparation(items?: ClinicalItemLike[], customInstructions?: string): string {
  if (customInstructions && customInstructions.trim().length > 30) {
    return customInstructions.trim();
  }

  const memoSections: string[] = [];
  const handledKeys = new Set<string>();

  if (items && items.length > 0) {
    items.forEach(it => {
      const title = (it.item_title || it.name || it.title || '').toLowerCase();
      const prep = resolveItemPreparation(it);

      // Grouping rules to avoid repeating the same preparation for multiple similar procedures
      let groupKey = 'other';
      if (title.includes('prp') || title.includes('плазмо')) groupKey = 'prp';
      else if (title.includes('гиалурон') || title.includes('ферматрон') || title.includes('блокад') || title.includes('пункци')) groupKey = 'injections';
      else if (title.includes('ударно-волн') || title.includes('увт')) groupKey = 'eswt';
      else if (title.includes('hilt') || title.includes('лазер')) groupKey = 'hilt';
      else if (title.includes('магнит') || title.includes('sis')) groupKey = 'sis';
      else if (title.includes('мрт')) groupKey = 'mri';
      else if (title.includes('рентген') || title.includes('кт ')) groupKey = 'xray';
      else if (title.includes('узи')) groupKey = 'us';
      else if (title.includes('стельк') || title.includes('formthotics')) groupKey = 'insoles';
      else if (title.includes('лфк') || title.includes('артромот') || title.includes('пир')) groupKey = 'rehab';

      if (!handledKeys.has(groupKey)) {
        handledKeys.add(groupKey);
        memoSections.push(`• **${it.item_title}**: ${prep}`);
      }
    });
  }

  // Standard clinical memo header and general rules
  const header = '📋 **Клинический регламент подготовки к назначенным процедурам:**';
  const generalRules = [
    '• **Общие требования**: Прибыть в Клинику за 10–15 минут до начала приема. При себе иметь паспорт, полис (при наличии) и результаты предшествующих обследований (диски МРТ/КТ, рентгенограммы, выписки).',
    '• **Охранительный режим**: После инвазивных процедур (PRP, пункции, введение биопротезов) исключить горячие ванны, сауны, бани и спортивные тренировки на 48 часов.',
    '• **Связь с лечащим врачом**: При возникновении распирающей боли, стойкого покраснения или гипертермии немедленно связаться с ординаторской Клиники: +7 (862) 295-00-55.'
  ];

  if (memoSections.length === 0) {
    return [header, ...generalRules].join('\n\n');
  }

  return [
    header,
    ...memoSections,
    '🛡️ **Постпроцедурный режим и правила безопасности:**',
    ...generalRules.slice(1)
  ].join('\n\n');
}
