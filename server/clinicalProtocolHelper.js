/**
 * clinicalProtocolHelper.js
 * 
 * Unified resolver for "Клинические параметры и протокол", "Подготовка"
 * and "Памятка пациенту по подготовке к процедурам" in Orthopedic Referrals & Orders.
 * Incorporates authentic biophysical parameters, clinical dosage, and KaTeX formulas.
 */

/**
 * Keyword-based clinical protocol rules with KaTeX formulas
 */
function getRuleBasedProtocol(title, domain, serviceCode) {
  const t = (title || '').toLowerCase();
  const c = (serviceCode || '').toUpperCase();
  const dom = (domain || '').toLowerCase();

  // 1. PRP / Плазмотерапия / ACP / Cortexil
  if (t.includes('prp') || t.includes('плазмолифтинг') || t.includes('плазмотерап') || t.includes('аутоплазм') || t.includes('cortexil') || c.includes('11.12.009')) {
    return 'Курс: $3\\text{ инъекции}$ с интервалом $7\\text{--}14\\text{ дней}$. Забор венозной крови $V = 10\\text{--}20\\text{ мл}$ в пробирку Cortexil, фракционирование в бакетном роторе ($\\mathrm{RCF} = 1200\\text{--}1500\\times g$, $t = 10\\text{ мин}$). Концентрация тромбоцитов $\\mathrm{PLT} \\ge 1.0\\times 10^6/\\mu\\text{л}$ ($4\\text{--}6\\times$ от базового уровня). Асептическое введение аутологичной обогащенной плазмы под УЗ-навигацией в полость сустава / перитендинозно. Охранительный режим $t = 24\\text{ ч}$.';
  }

  // 2. Гиалуроновая кислота / Биополимеры / Протезы синовиальной жидкости
  if (t.includes('гиалурон') || t.includes('ферматрон') || t.includes('гиалрипайер') || t.includes('вискоэластик') || t.includes('протез синовиальн') || c.includes('11.04.004.3')) {
    return 'Курс: $3\\text{--}5\\text{ инъекций}$ с интервалом $7\\text{--}10\\text{ дней}$ (для пролонгированных форм $V = 3.0\\text{--}4.0\\text{ мл}$ — однократно). Протез синовиальной жидкости с молекулярной массой $M_w = 2.4\\text{--}3.6\\text{ МДа}$, концентрация $1.5\\text{--}2.2\\%$, объем $V = 2.0\\text{ мл}$. Введение под УЗ-контролем в суставную щель после предварительной эвакуации выпота. Ограничение осевой нагрузки $24\\text{ ч}$.';
  }

  // 3. Пункция / Артроцентез / Аспирация
  if (t.includes('пункци') || t.includes('артроцентез') || t.includes('аспираци') || t.includes('эвакуаци') || c.includes('11.04.003')) {
    return 'Лечебно-диагностический артроцентез под ультразвуковой навигацией в В-режиме ($f = 12\\text{ МГц}$) и ЦДК. Местная инфильтрационная анестезия $\\text{Sol. Lidocaini } 1\\%\\text{ -- }2.0\\text{--}5.0\\text{ мл}$. Пункция иглой $G = 18\\text{--}20\\text{G}$, полная эвакуация синовиального выпота/гемартроза с лабораторным исследованием пунктата (цитология, микроскопия, белок).';
  }

  // 4. Блокады / ГКС / Дипроспан / Кеналог
  if (t.includes('блокад') || t.includes('гкс') || t.includes('дипроспан') || t.includes('кеналог') || t.includes('дексаметазон') || c.includes('11.04.004')) {
    return 'Купирование острой фазы синовита/бурсита. Внутрисуставная/периартикулярная блокада микрокристаллическим ГКС (Бетаметазон $V = 1.0\\text{ мл}$) с анестетиком ($\\text{Sol. Ropivacaini } 0.5\\%\\text{ -- }2.0\\text{ мл}$) под УЗ-контролем строго вне ткани сухожилий. Контроль АД и гликемии в течение $t = 48\\text{ ч}$.';
  }

  // 5. Ударно-волновая терапия (УВТ / ESWT / rESWT / fESWT)
  if (t.includes('ударно-волн') || t.includes('увт') || t.includes('eswt') || t.includes('reswt') || t.includes('feswt')) {
    return 'Радиальная/фокусированная ударно-волновая терапия: давление $P = 1.8\\text{--}3.2\\text{ Бар}$, частота $f = 10\\text{--}15\\text{ Гц}$, плотность потока энергии $\\mathrm{EFD} = 0.15\\text{--}0.35\\text{ мДж/мм}^2$, суммарно $N = 2500\\pm 500\\text{ импульсов}$ на сеанс. Курс: $5\\text{--}7\\text{ сеансов}$ с интервалом $5\\text{--}7\\text{ дней}$. Без применения местной анестезии.';
  }

  // 6. Высокоинтенсивный лазер (HILT)
  if (t.includes('hilt') || t.includes('лазер') || t.includes('лазеротерап') || c.includes('17.30.010')) {
    return 'Высокоинтенсивная лазеротерапия HILT (длина волны $\\lambda = 1064\\text{ нм}$, импульсная пиковая мощность $P_{\\text{peak}} \\ge 1\\text{ кВт}$). Режим биостимуляции $E = 8\\text{--}15\\text{ Дж/см}^2$, противоотечный анальгетический режим до $25\\text{ Дж/см}^2$. Курс: $6\\text{--}10\\text{ сеансов}$ ежедневно или через день.';
  }

  // 7. Магнитотерапия (SIS / PEMF / ПЕМП)
  if (t.includes('магнит') || t.includes('пемп') || t.includes('pemf') || t.includes('sis')) {
    return 'Высокоинтенсивная импульсная магнитотерапия Super Inductive System (SIS): индукция магнитного поля $B = 2.5\\text{--}3.0\\text{ Тл}$, частота $f = 15\\text{--}50\\text{ Гц}$, градиент $\\mathrm{d}B/\\mathrm{d}t \\ge 10^4\\text{ Тл/с}$. Курс: $8\\text{--}12\\text{ сеансов}$ по $12\\text{--}15\\text{ минут}$ ежедневно или через день.';
  }

  // 8. Электромиостимуляция / NMES / FES / БОС
  if (t.includes('электростимул') || t.includes('nmes') || t.includes('fes') || t.includes('миостимул')) {
    return 'Нейромышечная стимуляция: биполярные импульсы частотой $f = 35\\text{--}75\\text{ Гц}$, длительность $\\tau = 250\\text{--}400\\text{ мкс}$, соотношение $T_{\\mathrm{on}} : T_{\\mathrm{off}} = 1 : 3$, синхронизация с волевым сокращением целевой мышцы. Курс: $10\\text{--}15\\text{ сеансов}$ по $20\\text{--}30\\text{ минут}$.';
  }

  // 9. ПИР / Мобилизация / Мануальная терапия / Мейтланд
  if (t.includes('пир') || t.includes('мейтланд') || t.includes('мобилизац') || t.includes('мануальн') || t.includes('миофасциальн') || c.includes('15.04.002')) {
    return 'Постизометрическая релаксация: изометрическое напряжение мышцы силой $F = 15\\text{--}20\\%\\ F_{\\max}$ в течение $t_1 = 7\\text{--}10\\text{ с}$, фаза глубокого выдоха и мягкого удлинения $t_2 = 15\\text{--}20\\text{ с}$ (повторы $n = 3\\text{--}5$). Мягкотканная суставная мобилизация по Мейтланду I–IV степени. Курс: $5\\text{--}10\\text{ процедур}$.';
  }

  // 10. Артромот / CPM / Механотерапия
  if (t.includes('artromot') || t.includes('артромот') || t.includes('cpm') || t.includes('механотерап')) {
    return 'Роботизированная пассивная CPM-механотерапия: стартовый угол сгибания $\\alpha_0 = 30^\\circ$, суточная прогрессия $\\Delta\\alpha = +5^\\circ/\\text{день}$ до целевой амплитуды $\\alpha \\ge 110^\\circ$, угловая скорость $\\omega = 60^\\circ/\\text{мин}$. Длительность $30\\text{--}45\\text{ минут}$, курс: $10\\text{--}15\\text{ процедур}$ ежедневно.';
  }

  // 11. Стабилометрия / Тренинг баланса
  if (t.includes('стабилометр') || t.includes('постуральн') || t.includes('проприоцеп')) {
    return 'Стабилометрический постуральный тренинг с биологической обратной связью (БОС). Калибровка центра давления (CoP), мишень и динамический перенос веса с отклонением $\\Delta X, \\Delta Y \\le 15\\text{ мм}$, $15\\text{--}25\\text{ минут}$, курс: $10\\text{--}12\\text{ сеансов}$.';
  }

  // 12. Индивидуальные стельки (Formthotics)
  if (t.includes('стельк') || t.includes('formthotics') || t.includes('ортезирование стоп') || c.includes('05.050.001')) {
    return 'Термоформовка разогретой заготовки Formthotics ($T = 85^\\circ\\text{C}$) под осевой нагрузкой весом тела в нейтральном положении подтаранного сустава (Subtalar Neutral, $\\mathrm{STJN} = 0^\\circ$). Адаптация $3\\text{--}4\\text{ недели}$, контрольный осмотр с установкой функциональных клиньев (коррекция варуса/вальгуса $\\pm 4^\\circ$).';
  }

  // 13. Ортезы / Туторы / Бандажи / Сапожок Walker
  if (t.includes('ортез') || t.includes('тутор') || t.includes('бандаж') || t.includes('walker') || t.includes('сапожок')) {
    return 'Шарнирный ортез/брейс с регулировкой углов: угол сгибания $\\alpha_{\\text{flex}} \\le 30^\\circ\\text{--}60^\\circ$ с шагом прогрессии $\\Delta\\alpha = 15^\\circ$ каждые $2\\text{ недели}$. Режим постоянного ношения при осевой нагрузке весом тела (PWB $\\to$ FWB).';
  }

  // 14. Костыли / Трость / Опоры
  if (t.includes('костыл') || t.includes('трость') || t.includes('опор') || c.includes('15.03.007')) {
    return 'Индивидуальная регулировка костылей с мягкими опорами по росту пациента. Обучение биомеханической походке с дозированной осевой разгрузкой конечности ($10\\%\\text{ массы}$ при TTWB, $30\\text{--}50\\%$ при PWB).';
  }

  // 15. МРТ томография
  if (t.includes('мрт') || t.includes('магнитно-резонансн') || c.startsWith('A05.30')) {
    return 'Высокопольная томография ($B_0 \\ge 1.5\\text{--}3.0\\text{ Тл}$) со специализированной суставной катушкой. Импульсные последовательности: PD-FS, T1-WI, T2-WI, STIR в 3-х взаимно перпендикулярных проекциях (толщина среза $d \\le 2.5\\text{--}3.0\\text{ мм}$, матрица $\\ge 320\\times 320$). Оценка хряща, связок, менисков и субхондральной кости.';
  }

  // 16. Рентгенография
  if (t.includes('рентген') || t.includes('rg') || c.startsWith('A06.03') || c.startsWith('A06.04')) {
    return 'Рентгенография в 2-х стандартных проекциях (прямая и боковая) стоя с функциональной осевой нагрузкой весом тела ($100\\%\\ \\mathrm{BW}$). При необходимости — стресс-рентгенография и проекция Розенберга ($45^\\circ\\text{ сгибания}$).';
  }

  // 17. КТ / Компьютерная томография
  if (t.includes('кт ') || t.includes('компьютерн') || t.includes('мскт') || c.startsWith('A06.30')) {
    return 'Мультиспиральная компьютерная томография (МСКТ) с изотропным вокселем ($0.5\\times 0.5\\times 0.5\\text{ мм}$), толщина среза $d = 0.5\\text{--}1.0\\text{ мм}$, 3D-реконструкция костных структур, оценка микроархитектоники и костных дефектов.';
  }

  // 18. УЗИ суставов / мягких тканей
  if (t.includes('узи') || t.includes('сонограф') || t.includes('ультразвук') || c.startsWith('A04.04')) {
    return 'Ультразвуковое исследование линейным датчиком высокой частоты $f = 10\\text{--}18\\text{ МГц}$ в В-режиме, ЦДК и энергетическом допплере (PDI). Оценка объема выпота, синовиальной гипертрофии ($h \\ge 2.0\\text{ мм}$), целостности сухожильно-связочного аппарата.';
  }

  // 19. ЭНМГ
  if (t.includes('энмг') || t.includes('электронейромиограф') || t.includes('эмг')) {
    return 'Стимуляционная и игольчатая электронейромиография: скорость распространения возбуждения ($\\mathrm{СРВ} \\ge 50\\text{ м/с}$), амплитуда M-ответа ($A \\ge 3.5\\text{ мВ}$) и резидуальная латентность по двигательным и чувствительным волокнам.';
  }

  // 20. ЛФК / Кинезиотерапия
  if (t.includes('лфк') || t.includes('гимнастик') || t.includes('кинезио') || dom === 'lfk') {
    return 'Индивидуальный протокол лечебной гимнастики: изометрические упражнения закрытой кинетической цепи ($F \\le 50\\%\\ F_{\\max}$ на 1-м этапе), последующий концентрический/эксцентрический тренинг мышц-стабилизаторов, тренировка проприоцепции. $3\\text{--}4\\text{ раза в неделю}$ по $45\\text{ минут}$.';
  }

  // 21. Оперативное вмешательство / Хирургия / Артроскопия
  if (t.includes('артроскоп') || t.includes('пластик') || t.includes('резекци') || t.includes('операци') || dom === 'surgery') {
    return 'Плановая лечебно-диагностическая артроскопия / реконструктивная операция в условиях стационара. Стандартный госпитальный комплекс (ОАК, биохимия, коагулограмма $\\mathrm{МНО} \\le 1.2$, ЭКГ, Rg ОГК, консультация терапевта).';
  }

  // 22. Анализы / Лаборатория
  if (t.includes('анализ') || t.includes('кров') || t.includes('срб') || t.includes('лаборатор') || dom === 'lab') {
    return 'Лабораторное исследование натощак: клинический анализ крови с лейкоцитарной формулой, СОЭ, С-реактивный белок (СРБ количественный), коагулограмма (АЧТВ, МНО, фибриноген), мочевая кислота.';
  }

  // Default domain-based fallbacks
  switch (dom) {
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
 * Resolves detailed patient preparation text for an individual item.
 */
function getItemPreparation(item) {
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
 * Aggregates all preparation notes from referral items into a unified patient memo
 */
function getAggregatedPreparation(items, customInstructions) {
  if (customInstructions && customInstructions.trim().length > 30) {
    return customInstructions.trim();
  }

  const memoSections = [];
  const handledKeys = new Set();

  if (items && Array.isArray(items) && items.length > 0) {
    items.forEach(it => {
      const title = (it.item_title || it.name || it.title || '').toLowerCase();
      const prep = getItemPreparation(it);

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
        memoSections.push(`• **${it.item_title || it.name || it.title}**: ${prep}`);
      }
    });
  }

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

/**
 * Resolves full protocol text for an item from DB catalogs or fallback rules
 */
function resolveItemProtocol(item, db) {
  return new Promise((resolve) => {
    // If details already provided, check if it already contains formulas or length > 50
    if (item.item_details && typeof item.item_details === 'string') {
      const trimmed = item.item_details.trim();
      if (trimmed.length > 50 && (trimmed.includes('$') || trimmed.includes('Бар') || trimmed.includes('Дж/см'))) {
        return resolve(trimmed);
      }
    }

    const title = (item.item_title || item.name || item.title || '').trim();
    const code = (item.service_code || item.code || '').trim();

    if (!db) {
      return resolve(getRuleBasedProtocol(title, item.domain, code));
    }

    // Check DB catalogs
    const qName = `
      SELECT technique_details, regimen_standard, description
      FROM ortho_manipulations_catalog WHERE name = ?
      UNION ALL
      SELECT technique_details, regimen_standard, description
      FROM ortho_physiotherapy_catalog WHERE name = ?
      UNION ALL
      SELECT technique_details, regimen_standard, description
      FROM ortho_orthotics_catalog WHERE name = ?
      UNION ALL
      SELECT technique_details, protocol_phrase AS regimen_standard, description
      FROM diagnostic_methods_catalog WHERE name = ?
      LIMIT 1
    `;

    db.get(qName, [title, title, title, title], (err, row) => {
      if (!err && row && row.regimen_standard && row.regimen_standard.trim().length > 30) {
        const textParts = [];
        if (row.regimen_standard) textParts.push(row.regimen_standard.trim());
        if (row.technique_details) textParts.push(row.technique_details.trim());
        const fullText = textParts.join('. ').replace(/\.\./g, '.');
        if (fullText.length > 30) {
          return resolve(fullText);
        }
      }

      // Fallback to rich rule-based protocol
      return resolve(getRuleBasedProtocol(title, item.domain, code));
    });
  });
}

/**
 * Migration function: Updates existing referral items and referrals in SQLite DB to clinical standard
 */
async function migrateExistingReferralItems(db) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT id, referral_id, domain, service_code, item_title, item_details, formula_latex, preparation_notes FROM ortho_referral_items",
      async (err, rows) => {
        if (err) return reject(err);
        if (!rows || rows.length === 0) {
          return resolve({ updatedCount: 0 });
        }

        let updatedCount = 0;
        for (const row of rows) {
          try {
            const protocolText = await resolveItemProtocol(row, db);
            const prepNotes = getItemPreparation(row);

            await new Promise((resUpd, rejUpd) => {
              db.run(
                "UPDATE ortho_referral_items SET item_details = ?, preparation_notes = ? WHERE id = ?",
                [protocolText.trim(), prepNotes.trim(), row.id],
                function (updErr) {
                  if (updErr) rejUpd(updErr);
                  else {
                    updatedCount++;
                    resUpd();
                  }
                }
              );
            });
          } catch (itemErr) {
            console.error(`Error migrating referral item ${row.id}:`, itemErr);
          }
        }

        // Also update ortho_referrals preparation_instructions if missing or short
        db.all("SELECT id FROM ortho_referrals", async (refErr, refRows) => {
          if (!refErr && refRows) {
            for (const r of refRows) {
              const rItems = await new Promise(rRes => {
                db.all("SELECT * FROM ortho_referral_items WHERE referral_id = ?", [r.id], (riErr, riRows) => {
                  rRes(riRows || []);
                });
              });
              if (rItems.length > 0) {
                const aggregatedMemo = getAggregatedPreparation(rItems);
                await new Promise(rUpd => {
                  db.run("UPDATE ortho_referrals SET preparation_instructions = ? WHERE id = ?", [aggregatedMemo, r.id], () => rUpd());
                });
              }
            }
          }
          resolve({ updatedCount });
        });
      }
    );
  });
}

module.exports = {
  getRuleBasedProtocol,
  getItemPreparation,
  getAggregatedPreparation,
  resolveItemProtocol,
  migrateExistingReferralItems
};
