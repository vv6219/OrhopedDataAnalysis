const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

const clusterExpansionTemplates = [
  // ==========================================
  // КЛАСТЕР 10: ПОСТОПЕРАЦИОННЫЙ КУРАЦИОННЫЙ КОНТРОЛЬ (cluster_postop)
  // ==========================================
  {
    title: 'Реабилитационный контроль после шва или пластики ахиллова сухожилия',
    joint_name: 'ankle',
    cluster_id: 'cluster_postop',
    cluster_name: 'Постоперационный контроль, имплантаты и металлоконструкции',
    default_mkb_code: 'Z98.8',
    stage_or_severity: 'Подострый/восстановительный этап (8–16 недель после тенорафии)',
    clinical_tags: '["postop","ахилл","тенорафия","шов","стопа","реабилитация"]',
    complaints_template: 'Умеренная скованность в области заднего отдела голеностопного сустава по утрам, утомляемость икроножной мышцы при длительной ходьбе. Заинтересованность в восстановлении подъема на носок пораженной ноги (Single-heel rise).',
    anamnesis_template: 'Состояние после открытого или чрескожного шва ахиллова сухожилия по поводу острого полного разрыва. Проведена иммобилизация ортезом в эквинусе с постепенным переводом в нейтраль.',
    anamnesis_vitae_template: 'Аллергологический анамнез спокойный. Ранее занимался любительским спортом.',
    objective_status_template: 'Послеоперационный рубец сформирован, эластичен, без спаянности с подлежащими тканями. Тест Томпсона отрицательный (пальпация икроножной мышцы вызывает уверенное подошвенное сгибание стопы). Симптом Матрикса (дефицит активного сгибания) минимальный. Подъем на носок исследуемой ноги выполняет на 70% от высоты здоровой ноги.',
    recommendations_template: '1. Эксцентрические тренировки трехглавой мышцы голени по протоколу Альфредсона на наклонной ступени.\n2. Упражнения на баланс и нейромышечный контроль на балансировочной подушке.\n3. Ношение подпяточника 5 мм в обуви до 4 месяцев.\n4. Контрольное УЗИ ахиллова сухожилия с допплерографией.',
    sort_order: 880,
    tests: [{ code: 'thompson_achilles', expected: 'negative' }, { code: 'silfverskiold_test', expected: 'positive' }, { code: 'windlass_test', expected: 'positive' }],
    diagnostics: [{ code: 'us_achilles', urgency: 'planned', is_primary: 1 }, { code: 'xray_foot_load', urgency: 'routine', is_primary: 0 }]
  },
  {
    title: 'Контроль после реконструкции Банкарта / операции Латарже при нестабильности плеча',
    joint_name: 'shoulder',
    cluster_id: 'cluster_postop',
    cluster_name: 'Постоперационный контроль, имплантаты и металлоконструкции',
    default_mkb_code: 'Z98.8',
    stage_or_severity: 'Функциональный этап реабилитации (12–24 недели после открытой/артроскопической стабилизации)',
    clinical_tags: '["postop","латарже","банкарт","плечо","нестабильность","костный блок"]',
    complaints_template: 'Остаточное ограничение наружной ротации плеча (на 10–15° по сравнению со здоровой стороной), ощущение мышечного дискомфорта при бросковых движениях. Чувство "выскакивания" плеча полностью ликвидировано.',
    anamnesis_template: 'Состояние после костно-пластической стабилизации плечевого сустава клювовидным отростком по Латарже (Latarjet) или артроскопической пластики суставной губы якорными фиксаторами.',
    anamnesis_vitae_template: 'Без хронической соматической патологии.',
    objective_status_template: 'Послеоперационный доступ спокоен. Тест передней тревоги (Apprehension test) и Relocation test отрицательны (нет страха вывиха при отведении и наружной ротации 90°/90°). Симптом борозды (Sulcus sign) отрицательный. Мышечная сила дельтовидной мышцы и ротаторов 5/5.',
    recommendations_template: '1. Прогрессивное укрепление лопаточных стабилизаторов (передняя зубчатая мышца, нижняя порция трапеции).\n2. Плиометрические тренировки с набивным мячом (медбол 1-2 кг).\n3. Контрольная рентгенография плечевого сустава и 3D-КТ для оценки консолидации костного трансплантата клювовидного отростка.\n4. Возврат к контактным видам спорта не ранее 6 месяцев.',
    sort_order: 885,
    tests: [{ code: 'apprehension', expected: 'negative' }, { code: 'sulcus_sign', expected: 'negative' }, { code: 'obrien_slap', expected: 'negative' }],
    diagnostics: [{ code: 'xray_shoulder_2v', urgency: 'planned', is_primary: 1 }, { code: 'ct_shoulder_3d', urgency: 'planned', is_primary: 1 }]
  },
  {
    title: 'Контроль после артроскопической резекции мениска (менискэктомии)',
    joint_name: 'knee',
    cluster_id: 'cluster_postop',
    cluster_name: 'Постоперационный контроль, имплантаты и металлоконструкции',
    default_mkb_code: 'Z98.8',
    stage_or_severity: 'Ранний и восстановительный этап (4–8 недель после парциальной резекции)',
    clinical_tags: '["postop","мениск","резекция","артроскопия","колено"]',
    complaints_template: 'Периодический умеренный отек в области супрапателлярного заворота после быстрой ходьбы, легкая стартовая скованность при вставании со стула.',
    anamnesis_template: 'Состояние после артроскопической парциальной резекции дегенеративного/лоскутного разрыва медиального мениска. Механические блокады сустава купированы.',
    anamnesis_vitae_template: 'Сопутствующий начальный остеоартроз коленного сустава (I стадия).',
    objective_status_template: 'Артроскопические проколы зажили первичным натяжением. Незначительный реактивный выпот. Объем движений полный (0–140°). Тест Мак-Мюррея и Тессали отрицательные (нет щелчка и острой боли в суставной щели). Осевая стабильность сохранена.',
    recommendations_template: '1. Велотренажер с низким сопротивлением 20-30 минут в день.\n2. Изометрическое укрепление квадрицепса бедра (VMO) и хамстринг-группы.\n3. Курс внутрисуставного введения высокомолекулярной гиалуроновой кислоты для защиты резецированного края хряща.\n4. Контрольное УЗИ коленного сустава через 4 недели.',
    sort_order: 890,
    tests: [{ code: 'mcmurray', expected: 'negative' }, { code: 'thessaly_20', expected: 'negative' }, { code: 'patella_ballottement', expected: 'negative' }],
    diagnostics: [{ code: 'us_knee', urgency: 'planned', is_primary: 1 }, { code: 'xray_knee_2v', urgency: 'routine', is_primary: 0 }]
  },

  // ==========================================
  // КЛАСТЕР 9: СИСТЕМНЫЕ СИНДРОМЫ (cluster_systemic)
  // ==========================================
  {
    title: 'Псориатический артрит периферических суставов с дактилитом («сосискообразные пальцы»)',
    joint_name: 'wrist',
    cluster_id: 'cluster_systemic',
    cluster_name: 'Системные, метаболические и редкие синдромы: остеопороз, подагра, полиартрит',
    default_mkb_code: 'M07.3',
    stage_or_severity: 'Асимметричный олигоартрит с дактилитом и ониходистрофией (CASPAR критерии >= 3)',
    clinical_tags: '["systemic","псориатический","артрит","дактилит","ногти","псориаз"]',
    complaints_template: 'Асимметричная диффузная припухлость и боль отдельных пальцев кистей или стоп (симптом "сосискообразного пальца"), выраженная утренняя скованность, воспалительная боль в местах прикрепления связок к костям (энтезиты). Изменение цвета и исчерченность ногтевых пластин (симптом "наперстка").',
    anamnesis_template: 'Пациент страдает бляшечным псориазом кожи или волосистой части головы в течение нескольких лет. Суставной синдром развился остро или подостро после стресса/инфекции.',
    anamnesis_vitae_template: 'Наследственность: псориаз у родственников. Серонегативность по РФ и АЦЦП.',
    objective_status_template: 'Дактилит II и IV пальцев кисти: палец равномерно утолщен, гиперемирован, напряжен, движения резко болезненны. Псориатические бляшки на разгибательных поверхностях локтевых суставов. Псориатическая ониходистрофия (точечные вдавления ногтей, онихолизис). Ревматоидные узелки отсутствуют.',
    recommendations_template: '1. Консультация ревматолога и дерматолога для подбора базисной или таргетной терапии (метотрексат, ингибиторы ФНО, ингибиторы ИЛ-17 / ИЛ-23).\n2. Рентгенография кистей и стоп (поиск специфической картины "карандаш в чашке" - pencil-in-cup деформации).\n3. УЗИ сухожилий сгибателей и энтезисов с Power Doppler.\n4. Ношение компрессионных перчаток при дактилите.',
    sort_order: 895,
    tests: [{ code: 'tinel_wrist', expected: 'negative' }, { code: 'fovea_sign', expected: 'positive' }, { code: 'froment_sign', expected: 'negative' }],
    diagnostics: [{ code: 'us_hand_synovitis', urgency: 'urgent', is_primary: 1 }, { code: 'xray_wrist_2v', urgency: 'planned', is_primary: 1 }, { code: 'lab_rheumo_panel', urgency: 'planned', is_primary: 1 }, { code: 'lab_inflammation_crp_esr', urgency: 'urgent', is_primary: 1 }]
  },
  {
    title: 'Фибромиалгия и генерализованный миофасциальный болевой синдром',
    joint_name: 'spine',
    cluster_id: 'cluster_systemic',
    cluster_name: 'Системные, метаболические и редкие синдромы: остеопороз, подагра, полиартрит',
    default_mkb_code: 'M79.7',
    stage_or_severity: 'Хронический диффузный болевой синдром с нарушением сна и когнитивной дисфункцией',
    clinical_tags: '["systemic","фибромиалгия","триггеры","миофасциальный","боль","сон"]',
    complaints_template: 'Распространенная диффузная боль во всех квадрантах тела (шея, плечи, спина, бедра) продолжительностью более 3-6 месяцев, неосвежающий сон, выраженная утренняя усталость, ощущение тяжести и скованности в мышцах, парестезии конечностей без четкой корешковой зоны.',
    anamnesis_template: 'Многократные обследования у неврологов, ревматологов и ортопедов не выявили структурных костно-суставных изменений или маркеров системного воспаления. Заболевание часто дебютирует на фоне хронического психоэмоционального стресса.',
    anamnesis_vitae_template: 'Склонность к цефалгиям напряжения, синдрому раздраженного кишечника (СРК).',
    objective_status_template: 'Пальпация стандартных диагностических триггерных точек (ACR 1990/2016 WPI index): резкая болезненность при давлении 4 кг/см2 в >= 11 из 18 классических анатомических точек (трапециевидные мышцы, надкостница затылка, латеральные надмыщелки, медиальные жировые подушки коленей, большие вертелы). Симптомы натяжения нервов отрицательны, неврологический статус интактен.',
    recommendations_template: '1. Мультидисциплинарный подход: когнитивно-поведенческая терапия (КПТ), нормализация гигиены сна.\n2. Аэробные низкоинтенсивные циклические нагрузки (ходьба, аквааэробика, пилатес).\n3. Фармакотерапия центральной сенситизации: габапентиноиды (прегабалин) или СИОЗСН (дулоксетин) по назначению невролога.\n4. Миофасциальный релиз, теплые бальнеологические ванны.',
    sort_order: 900,
    tests: [{ code: 'beighton_score_detailed', expected: 'positive' }, { code: 'lasegue', expected: 'negative' }, { code: 'kemp_quadrant', expected: 'negative' }],
    diagnostics: [{ code: 'lab_inflammation_crp_esr', urgency: 'planned', is_primary: 1 }, { code: 'lab_bone_metab', urgency: 'planned', is_primary: 0 }, { code: 'mri_lumbosacral', urgency: 'routine', is_primary: 0 }]
  },

  // ==========================================
  // КЛАСТЕР 8: ДЕТСКАЯ ОРТОПЕДИЯ (cluster_pediatric)
  // ==========================================
  {
    title: 'Врожденная мышечная кривошея (Torticollis muscularis congenita) у младенцев',
    joint_name: 'spine',
    cluster_id: 'cluster_pediatric',
    cluster_name: 'Детская и подростковая ортопедия: остеохондропатии, деформации, дисплазии',
    default_mkb_code: 'Q68.0',
    stage_or_severity: 'Фиброзная / опухолевидная форма грудино-ключично-сосцевидной мышцы у грудничков',
    clinical_tags: '["pediatric","кривошея","младенцы","гксм","дети","шея"]',
    complaints_template: 'Наклон головы ребенка в одну сторону с поворотом подбородка в противоположную сторону, ограничение пассивного и активного поворота головы, беспокойство ребенка при попытке повернуть голову к груди матери при кормлении.',
    anamnesis_template: 'Родители заметили фиксированный наклон головы на 2–3 неделе жизни. В родах имелись особенности: ягодичное предлежание, затяжные роды или применение акушерских пособий.',
    anamnesis_vitae_template: 'Перинатальный период: доношенный новорожденный, оценка по Апгар 8/9 баллов.',
    objective_status_template: 'Голова наклонена в сторону пораженной грудино-ключично-сосцевидной мышцы (ГКСМ), подбородок повернут в противоположную сторону. В средней трети ГКСМ пальпируется плотно-эластическое веретенообразное безболезненное утолщение (псевдотумор) размерами до 1.5–2.0 см. Пассивный поворот головы в сторону поражения ограничен на 30-40°. Начальные явления асимметрии черепа (плагиоцефалия).',
    recommendations_template: '1. Укладка ребенка в кроватке с поворотом к свету и звуку в сторону ограничения.\n2. Специализированный дифференцированный массаж (расслабление пораженной ГКСМ и тонизирование здоровой).\n3. Мягкая пассивная редрессирующая гимнастика перед каждым кормлением.\n4. Ношение мягкого воротника типа Шанца по назначению ортопеда.\n5. УЗИ мягких тканей шеи с допплерографией ГКСМ.',
    sort_order: 905,
    tests: [{ code: 'cervical_foraminal_compression', expected: 'negative' }, { code: 'adams', expected: 'negative' }],
    diagnostics: [{ code: 'us_shoulder', urgency: 'planned', is_primary: 1 }, { code: 'xray_cervical_flex', urgency: 'routine', is_primary: 0 }]
  },
  {
    title: 'Врожденная косолапость (Pes equinovarus congenitus) у новорожденных и грудничков',
    joint_name: 'ankle',
    cluster_id: 'cluster_pediatric',
    cluster_name: 'Детская и подростковая ортопедия: остеохондропатии, деформации, дисплазии',
    default_mkb_code: 'Q66.0',
    stage_or_severity: 'Идиопатическая ригидная форма косолапости (по шкале Pirani 4–6 баллов)',
    clinical_tags: '["pediatric","косолапость","понсети","эквиноварус","дети","гипсование"]',
    complaints_template: 'Врожденная сложная деформация стопы новорожденного: подошвенное сгибание (эквинус), поворот подошвы внутрь (варус), приведение переднего отдела стопы (аддукция) и высокий свод (кавус). Невозможность вывести стопу в среднее физиологическое положение.',
    anamnesis_template: 'Деформация выявлена при рождении или на пренатальном УЗИ скрининге во II триместре беременности.',
    anamnesis_vitae_template: 'Наследственность: наличие костно-мышечных аномалий у близких родственников.',
    objective_status_template: 'Шкала Пирани (Pirani Score): симптом задней складки стопы 1 балл, пустота пятки 1 балл, ригидный эквинус 1 балл; медиальная складка 1 балл, латеральная головка таранной кости пальпируется снаружи 1 балл, искривление латерального края стопы 1 балл (всего 6/6 баллов). Кожа медиальной поверхности натянута, ахиллово сухожилие резко укорочено.',
    recommendations_template: '1. Лечение по методу Понсети (Ponseti method) - золотой стандарт мировой детской ортопедии с первых недель жизни.\n2. Этапные еженедельные редрессации стопы с фиксацией циркулярными гипсовыми повязками до верхней трети бедра.\n3. Чрескожная ахиллотомия после коррекции варуса и аддукции переднего отдела.\n4. Последующее ношение брейсов (брусьев Митчелла) до возраста 4–5 лет по протоколу для исключения рецидива.',
    sort_order: 910,
    tests: [{ code: 'silfverskiold_test', expected: 'positive' }, { code: 'drawer_ankle_subtalar', expected: 'positive' }, { code: 'windlass_test', expected: 'negative' }],
    diagnostics: [{ code: 'plantography', urgency: 'planned', is_primary: 1 }, { code: 'xray_foot_load', urgency: 'planned', is_primary: 1 }]
  },

  // ==========================================
  // КЛАСТЕР 5: ЛОКТЕВОЙ СУСТАВ (cluster_elbow)
  // ==========================================
  {
    title: 'Рассекающий остеохондрит головки мыщелка плеча (болезнь Кёнига локтевого сустава)',
    joint_name: 'elbow',
    cluster_id: 'cluster_elbow',
    cluster_name: 'Локтевой сустав: эпикондилиты, бурситы, туннельные невропатии',
    default_mkb_code: 'M93.2',
    stage_or_severity: 'II–III стадия (остеохондральный фрагмент головчатого возвышения capitellum humeri)',
    clinical_tags: '["elbow","локоть","остеохондрит","кёниг","capitellum","суставная мышь"]',
    complaints_template: 'Боль по латеральной поверхности локтевого сустава при осевой нагрузке и бросковых движениях, периодические преходящие щелчки, хруст или феномен блокирования («заклинивания») сустава свободно плавающим костно-хрящевым телом («суставная мышь»).',
    anamnesis_template: 'Чаще встречается у подростков и молодых людей, занимающихся спортом с повторяющейся вальгусной компрессией (гимнастика, бейсбол, тяжелая атлетика). Симптоматика нарастала постепенно.',
    anamnesis_vitae_template: 'Интенсивные спортивные нагрузки с детского возраста.',
    objective_status_template: 'Умеренный выпот в полости локтевого сустава. Локальная болезненность при пальпации capitellum humeri кпереди от головки лучевой кости. Варус/вальгус стресс-тесты локтя умеренно болезненны. Дефицит полного разгибания 10 градусов.',
    recommendations_template: '1. Полная разгрузка сустава и прекращение спортивных осевых нагрузок на руку.\n2. Высокопольная МРТ локтевого сустава (оценка стабильности остеохондрального фрагмента по T2/STIR).\n3. При нестабильном фрагменте: артроскопия локтевого сустава, удаление или рефиксация остеохондрального тела биодеградируемыми пинами.\n4. Хондропротективная терапия.',
    sort_order: 915,
    tests: [{ code: 'valgus_stress_elbow', expected: 'positive' }, { code: 'cozen', expected: 'negative' }, { code: 'elbow_flexion_compression', expected: 'negative' }],
    diagnostics: [{ code: 'mri_elbow', urgency: 'urgent', is_primary: 1 }, { code: 'xray_elbow_2v', urgency: 'planned', is_primary: 1 }]
  },

  // ==========================================
  // КЛАСТЕР 7: ПОЗВОНОЧНИК И ТОРАКС (cluster_spine)
  // ==========================================
  {
    title: 'Спондилолиз дужки позвонка L5 без спондилолистеза (стрессовый стресс-перелом)',
    joint_name: 'spine',
    cluster_id: 'cluster_spine',
    cluster_name: 'Позвоночник и торакс: радикулопатии, миофасциальный синдром, стенозы, сколиоз',
    default_mkb_code: 'M43.0',
    stage_or_severity: 'Ранний стрессовый дефект межсуставной части дужки (pars interarticularis) L5',
    clinical_tags: '["spine","спондилолиз","поясница","стресс-перелом","подростки","гимнасты"]',
    complaints_template: 'Локальная ноющая боль в нижнем отделе поясницы, усиливающаяся при переразгибании позвоночника назад (экстензии) и ротации, а также при приземлении после прыжков. Корешковой иррадиации в ноги нет.',
    anamnesis_template: 'Пациент юношеского возраста (гимнастика, танцы, футбол, гребля, борьба). Боль появилась после интенсивного соревновательного цикла.',
    anamnesis_vitae_template: 'Высокие физические нагрузки с раннего возраста.',
    objective_status_template: 'Односторонний тест стояния на одной ноге в разгибании (Stork test / Gillet) резко положителен с возникновением типичной боли в пояснице на стороне опорной ноги. Симптом Ласега отрицательный. Глубокая пальпация остистого отростка L5 болезненна. Натяжение пояснично-подвздошных мышц.',
    recommendations_template: '1. Строгий покой и ношение поясничного корсета с ограничением лордозирования на 8–12 недель для обеспечения костного сращения.\n2. МСКТ поясничного отдела (визуализация дефекта "шеи шотландского терьера" - scotty dog sign) и МРТ для оценки отека дужки.\n3. Исключение прогибов назад до полного консолидирования дефекта.\n4. Укрепление изометрических стабилизаторов брюшного пресса и мышц кора.',
    sort_order: 920,
    tests: [{ code: 'kemp_quadrant', expected: 'positive' }, { code: 'lasegue', expected: 'negative' }, { code: 'schober', expected: 'positive' }],
    diagnostics: [{ code: 'mri_lumbosacral', urgency: 'planned', is_primary: 1 }, { code: 'xray_spine_flex', urgency: 'planned', is_primary: 1 }]
  },

  // ==========================================
  // КЛАСТЕР 3: ТАЗ И ТБС (cluster_hip_pelvis)
  // ==========================================
  {
    title: 'Синдром подвздошно-поясничной мышцы и внутренний щелкающий тазобедренный сустав (Coxa Saltans interna)',
    joint_name: 'hip',
    cluster_id: 'cluster_hip_pelvis',
    cluster_name: 'Тазобедренный сустав, таз и КПС: коксартроз, FAI, сакроилеит',
    default_mkb_code: 'M24.8',
    stage_or_severity: 'Болезненный внутренний щелкающий синдром подвздошно-поясничного сухожилия',
    clinical_tags: '["hip","coxa_saltans","щелкающее_бедро","псоас","тбс","сухожилие"]',
    complaints_template: 'Слышимый и ощутимый громкий щелчок в глубине паховой области при переходе из положения сгибания и отведения бедра в разгибание (напр. вставание со стула, подъем ноги при посадке в автомобиль, плавание кролем). Боль в проекции головки бедра после физических нагрузок.',
    anamnesis_template: 'Беспокоит в течение 6–18 месяцев, чаще встречается у танцоров, легкоатлетов, футболистов или после интенсивных занятий фитнесом. Первично протекал безболезненно, затем присоединился реактивный бурсит подвздошно-гребешковой сумки.',
    anamnesis_vitae_template: 'Выраженная эластичность связочного аппарата, гиперлордоз поясничного отдела.',
    objective_status_template: 'Пальпаторное воспроизведение щелчка: врач пальпирует область под паховой связкой над подвздошно-лобковым возвышением и просит пациента выполнить плавное разгибание и приведение предварительно согнутого и отведенного бедра. В момент щелчка определяется соскальзывание сухожилия iliopsoas. Тест Томаса положителен (сгибательная контрактура бедра за счет спазма m. iliopsoas).',
    recommendations_template: '1. Прицельный стретчинг подвздошно-поясничной мышцы и четырехглавой мышцы бедра.\n2. УЗИ подвздошно-гребешковой сумки и динамическое УЗИ сухожилия iliopsoas в реальном времени.\n3. При сохранении болевого синдрома: параэнтезиальная лечебная блокада под УЗИ-навигацией раствором местного анестетика и ГКС.\n4. Устранение поясничного гиперлордоза упражнениями на мышцы кора.',
    sort_order: 925,
    tests: [{ code: 'thomas', expected: 'positive' }, { code: 'stinchfield', expected: 'positive' }, { code: 'faber', expected: 'positive' }],
    diagnostics: [{ code: 'us_hip_trochanter', urgency: 'planned', is_primary: 1 }, { code: 'mri_hip', urgency: 'planned', is_primary: 1 }, { code: 'xray_pelvis_hip', urgency: 'routine', is_primary: 0 }]
  }
];

async function seedExpansion() {
  const run = (sql, p=[]) => new Promise((resolve, reject) => db.run(sql, p, function(err) { if(err) reject(err); else resolve(this); }));
  const get = (sql, p=[]) => new Promise((resolve, reject) => db.get(sql, p, (err, row) => err ? reject(err) : resolve(row)));

  console.log(`Starting insertion of ${clusterExpansionTemplates.length} clinical templates...`);
  for (const t of clusterExpansionTemplates) {
    const templatePayload = JSON.stringify({
      title: t.title,
      joint: t.joint_name,
      mkb: t.default_mkb_code,
      complaints: t.complaints_template,
      anamnesis: t.anamnesis_template,
      objective: t.objective_status_template,
      recommendations: t.recommendations_template
    });

    const res = await run(`
      INSERT INTO ortho_templates (
        title, joint_name, template_json, cluster_id, cluster_name, default_mkb_code,
        stage_or_severity, clinical_tags, complaints_template,
        anamnesis_template, anamnesis_vitae_template,
        objective_status_template, recommendations_template,
        is_active, sort_order, is_custom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0)
    `, [
      t.title, t.joint_name, templatePayload, t.cluster_id, t.cluster_name, t.default_mkb_code,
      t.stage_or_severity, t.clinical_tags, t.complaints_template,
      t.anamnesis_template, t.anamnesis_vitae_template,
      t.objective_status_template, t.recommendations_template,
      t.sort_order
    ]);

    const newTemplateId = res.lastID;
    console.log(`Inserted template: ${t.title} with ID: ${newTemplateId}`);

    // Link tests
    for (let i = 0; i < t.tests.length; i++) {
      const test = t.tests[i];
      await run(`
        INSERT OR IGNORE INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order)
        VALUES (?, ?, ?, 1, ?)
      `, [newTemplateId, test.code, test.expected, (i + 1) * 10]);
    }

    // Link diagnostics
    for (let i = 0; i < t.diagnostics.length; i++) {
      const diag = t.diagnostics[i];
      await run(`
        INSERT OR IGNORE INTO ortho_template_diagnostics (template_id, diagnostic_code, urgency, default_side, is_primary, sort_order)
        VALUES (?, ?, ?, 'affected', ?, ?)
      `, [newTemplateId, diag.code, diag.urgency || 'planned', diag.is_primary ?? 1, (i + 1) * 10]);
    }
  }

  console.log('All additional templates successfully inserted and linked.');
  const total = await get('SELECT COUNT(*) as cnt FROM ortho_templates WHERE is_active = 1 OR is_active IS NULL');
  console.log(`Grand total active templates in database: ${total.cnt}`);
  db.close();
}

seedExpansion().catch(err => { console.error(err); db.close(); });
