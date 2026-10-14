const sqlite3 = require('sqlite3').verbose();

/**
 * Seed data for Orthopedic Knowledge Base 2.0:
 * - 39 validated orthopedic tests
 * - 26 diagnostic methods (with servdict links)
 * - 28 gold-standard clinical biomechanics templates across 7 joints
 * - Normalized relational mapping in ortho_template_tests and ortho_template_diagnostics
 */

const ORTHO_TESTS = [
  // ELBOW
  {
    code: 'cozen',
    name_ru: 'Тест Козена',
    name_lat: "Cozen's test",
    joint_category: 'elbow',
    target_structure: 'Латеральный надмыщелок (локоть теннисиста)',
    methodology: 'Рука согнута в локте под 90°. Врач фиксирует предплечье и пальпирует латеральный надмыщелок. Пациент сжимает кулак и разгибает кисть с радиальным отклонением против сопротивления врача.',
    positive_criteria: 'Резкая локальная боль в области латерального надмыщелка плечевой кости.',
    sensitivity_specificity: 'Se: 84%, Sp: 88%',
    icon_type: 'joint_stress',
    sort_order: 10
  },
  {
    code: 'mill',
    name_ru: 'Тест Милля',
    name_lat: "Mill's test",
    joint_category: 'elbow',
    target_structure: 'Сухожилия разгибателей предплечья',
    methodology: 'Врач пассивно сгибает кисть и пальцы пациента при полностью разогнутом локтевом суставе и пронированном предплечье.',
    positive_criteria: 'Тянущая острая боль над латеральным надмыщелком.',
    sensitivity_specificity: 'Se: 76%, Sp: 83%',
    icon_type: 'joint_stress',
    sort_order: 11
  },
  {
    code: 'golfer',
    name_ru: 'Тест локтя гольфиста',
    name_lat: "Golfer's elbow test",
    joint_category: 'elbow',
    target_structure: 'Медиальный надмыщелок плеча',
    methodology: 'Рука разогнута в локте, предплечье супинировано. Пациент сгибает кисть против сопротивления врача.',
    positive_criteria: 'Острая боль в области медиального надмыщелка плечевой кости.',
    sensitivity_specificity: 'Se: 82%, Sp: 90%',
    icon_type: 'joint_stress',
    sort_order: 12
  },
  {
    code: 'tinel_cubital',
    name_ru: 'Симптом Тиннеля кубитального канала',
    name_lat: "Tinel's sign at elbow",
    joint_category: 'elbow',
    target_structure: 'Локтевой нерв (кубитальный синдром)',
    methodology: 'Легкая перкуссия пальцем или неврологическим молоточком в борозде между медиальным надмыщелком и олекраноном.',
    positive_criteria: 'Иррадиация парестезий или прострел «током» в IV–V пальцы кисти.',
    sensitivity_specificity: 'Se: 70%, Sp: 98%',
    icon_type: 'nerve_percussion',
    sort_order: 13
  },
  {
    code: 'valgus_stress_elbow',
    name_ru: 'Вальгус-стресс тест локтя',
    name_lat: 'Valgus stress test of elbow',
    joint_category: 'elbow',
    target_structure: 'Медиальная коллатеральная связка (UCL)',
    methodology: 'Локоть согнут под 20–30°. Врач фиксирует плечо снаружи и прикладывает вальгусное усилие к дистальной части предплечья.',
    positive_criteria: 'Боль по внутренней поверхности сустава или патологическое раскрытие щели.',
    sensitivity_specificity: 'Se: 85%, Sp: 91%',
    icon_type: 'joint_stress',
    sort_order: 14
  },
  {
    code: 'varus_stress_elbow',
    name_ru: 'Варус-стресс тест локтя',
    name_lat: 'Varus stress test of elbow',
    joint_category: 'elbow',
    target_structure: 'Латеральная коллатеральная связка (LCL)',
    methodology: 'Локоть согнут под 20–30°. Приложение варусной нагрузки на предплечье с фиксацией плеча изнутри.',
    positive_criteria: 'Раскрытие латеральной щели, щелчок или локальная боль.',
    sensitivity_specificity: 'Se: 80%, Sp: 89%',
    icon_type: 'joint_stress',
    sort_order: 15
  },

  // KNEE
  {
    code: 'lachman',
    name_ru: 'Тест Лахмана',
    name_lat: 'Lachman test',
    joint_category: 'knee',
    target_structure: 'Передняя крестообразная связка (ПКС)',
    methodology: 'Колено согнуто под 20–30°. Бедро фиксировано рукой врача, голень плавно и уверенно смещается кпереди.',
    positive_criteria: 'Смещение голени более 3-5 мм по сравнению со здоровой ногой, отсутствие жесткой конечной точки.',
    sensitivity_specificity: 'Se: 85%, Sp: 94%',
    icon_type: 'joint_stress',
    sort_order: 20
  },
  {
    code: 'anterior_drawer',
    name_ru: 'Передний выдвижной ящик колена',
    name_lat: 'Anterior drawer test of knee',
    joint_category: 'knee',
    target_structure: 'Передняя крестообразная связка (ПКС)',
    methodology: 'Сгибание колена 90°, стопа фиксирована на кушетке. Врач тянет проксимальный отдел голени на себя.',
    positive_criteria: 'Патологическое смещение голени кпереди более 5 мм.',
    sensitivity_specificity: 'Se: 92%, Sp: 91%',
    icon_type: 'joint_stress',
    sort_order: 21
  },
  {
    code: 'posterior_drawer',
    name_ru: 'Задний выдвижной ящик колена',
    name_lat: 'Posterior drawer test of knee',
    joint_category: 'knee',
    target_structure: 'Задняя крестообразная связка (ЗКС)',
    methodology: 'Сгибание колена 90°, стопа фиксирована. Смещение голени кзади относительно мыщелков бедра.',
    positive_criteria: 'Западение бугристости большеберцовой кости и смещение голени кзади.',
    sensitivity_specificity: 'Se: 90%, Sp: 99%',
    icon_type: 'joint_stress',
    sort_order: 22
  },
  {
    code: 'pivot_shift',
    name_ru: 'Тест Pivot-Shift',
    name_lat: 'Pivot-shift test',
    joint_category: 'knee',
    target_structure: 'Ротационная нестабильность (ПКС)',
    methodology: 'Вальгусная нагрузка с одновременным сгибанием и внутренней ротацией голени из положения полного разгибания.',
    positive_criteria: 'Ощутимый щелчок вправления (редукции) латерального мыщелка голени на 20-30° сгибания.',
    sensitivity_specificity: 'Se: 62%, Sp: 98%',
    icon_type: 'joint_stress',
    sort_order: 23
  },
  {
    code: 'mcmurray',
    name_ru: 'Тест Мак-Мюррея',
    name_lat: 'McMurray test',
    joint_category: 'knee',
    target_structure: 'Внутренний и наружный мениски',
    methodology: 'Максимальное сгибание ноги, наружная/внутренняя ротация голени с постепенным пассивным разгибанием.',
    positive_criteria: 'Болезненный щелчок или хруст в проекции суставной щели.',
    sensitivity_specificity: 'Se: 70%, Sp: 85%',
    icon_type: 'joint_stress',
    sort_order: 24
  },
  {
    code: 'appley',
    name_ru: 'Тест Эпли',
    name_lat: "Apley's compression test",
    joint_category: 'knee',
    target_structure: 'Дифференциация менисков и связок',
    methodology: 'Пациент на животе, колено 90°. Врач производит аксиальную компрессию с ротацией голени, затем тракцию с ротацией.',
    positive_criteria: 'Боль при компрессии свидетельствует о разрыве мениска, при дистракции — о поражении связок.',
    sensitivity_specificity: 'Se: 60%, Sp: 70%',
    icon_type: 'joint_stress',
    sort_order: 25
  },
  {
    code: 'patella_ballottement',
    name_ru: 'Баллотирование надколенника',
    name_lat: 'Patellar ballottement',
    joint_category: 'knee',
    target_structure: 'Синовит / внутрисуставной выпот',
    methodology: 'Сдавление супрапателлярного заворота сверху вниз и резкое нажатие на надколенник по направлению к мыщелкам.',
    positive_criteria: 'Симптом плавающей льдины: надколенник погружается в жидкость и пружинит обратно.',
    sensitivity_specificity: 'Se: 88%, Sp: 92%',
    icon_type: 'effusion',
    sort_order: 26
  },
  {
    code: 'patella_grind',
    name_ru: 'Тест Кларка (трения надколенника)',
    name_lat: "Clarke's test / Patellar grind",
    joint_category: 'knee',
    target_structure: 'Пателлофеморальный хрящ',
    methodology: 'Врач прижимает верхний полюс надколенника книзу, прося пациента напрячь четырехглавую мышцу.',
    positive_criteria: 'Резкая ретропателлярная боль и неспособность удержать сокращение квадрицепса.',
    sensitivity_specificity: 'Se: 65%, Sp: 75%',
    icon_type: 'joint_stress',
    sort_order: 27
  },
  {
    code: 'patella_apprehension',
    name_ru: 'Тест тревоги надколенника (Fairbank)',
    name_lat: "Fairbank's apprehension test",
    joint_category: 'knee',
    target_structure: 'Латеральная нестабильность надколенника',
    methodology: 'Колено согнуто под 20–30°. Врач плавно смещает надколенник латерально.',
    positive_criteria: 'Пациент выражает страх вывиха, напрягает квадрицепс и пытается выпрямить ногу.',
    sensitivity_specificity: 'Se: 88%, Sp: 85%',
    icon_type: 'joint_stress',
    sort_order: 28
  },

  // SHOULDER
  {
    code: 'neer',
    name_ru: 'Тест Нира',
    name_lat: "Neer's impingement test",
    joint_category: 'shoulder',
    target_structure: 'Субакромиальный импинджмент',
    methodology: 'Пассивный подъем выпрямленной руки во внутренней ротации при одновременной фиксации лопатки врачом.',
    positive_criteria: 'Боль в передне-верхней зоне плеча в диапазоне отведения 70–120°.',
    sensitivity_specificity: 'Se: 79%, Sp: 53%',
    icon_type: 'joint_stress',
    sort_order: 30
  },
  {
    code: 'hawkins',
    name_ru: 'Тест Хокинса-Кеннеди',
    name_lat: 'Hawkins-Kennedy test',
    joint_category: 'shoulder',
    target_structure: 'Ротаторная манжета / акромион',
    methodology: 'Сгибание плеча вперед под 90°, локоть 90°. Врач производит форсированную внутреннюю ротацию плеча.',
    positive_criteria: 'Резкая субакромиальная боль из-за ущемления сухожилия надостной мышцы.',
    sensitivity_specificity: 'Se: 80%, Sp: 56%',
    icon_type: 'joint_stress',
    sort_order: 31
  },
  {
    code: 'empty_can_jobe',
    name_ru: 'Тест «пустой банки» Джобса',
    name_lat: "Jobe's empty can test",
    joint_category: 'shoulder',
    target_structure: 'Сухожилие надостной мышцы (m. supraspinatus)',
    methodology: 'Руки отведены на 90° в плоскости лопатки (30° кпереди), максимальная пронация (большие пальцы вниз). Пациент сопротивляется давлению врача книзу.',
    positive_criteria: 'Боль или выраженная слабость удержания руки против гравитации.',
    sensitivity_specificity: 'Se: 86%, Sp: 50%',
    icon_type: 'joint_stress',
    sort_order: 32
  },
  {
    code: 'drop_arm',
    name_ru: 'Тест падающей руки',
    name_lat: 'Drop arm sign',
    joint_category: 'shoulder',
    target_structure: 'Массивный разрыв ротаторной манжеты',
    methodology: 'Врач пассивно отводит руку пациента до 120° и просит плавно и медленно опустить её.',
    positive_criteria: 'Рука бесконтрольно падает с высоты около 90° из-за разрыва сухожилий манжеты.',
    sensitivity_specificity: 'Se: 35%, Sp: 97%',
    icon_type: 'joint_stress',
    sort_order: 33
  },
  {
    code: 'apprehension',
    name_ru: 'Тест тревоги (передней нестабильности)',
    name_lat: 'Apprehension test of shoulder',
    joint_category: 'shoulder',
    target_structure: 'Передняя губа и капсула плечевого сустава',
    methodology: 'Отведение руки 90°, локоть 90°. Врач плавно производит максимальную наружную ротацию плеча.',
    positive_criteria: 'Пациент испытывает страх вывиха головки плеча и рефлекторно напрягает мышцы.',
    sensitivity_specificity: 'Se: 72%, Sp: 96%',
    icon_type: 'joint_stress',
    sort_order: 34
  },
  {
    code: 'speed',
    name_ru: 'Тест Спида',
    name_lat: "Speed's test",
    joint_category: 'shoulder',
    target_structure: 'Длинная головка двуглавой мышцы (бицепса)',
    methodology: 'Пациент сгибает разогнутую в локте и супинированную руку в плечевом суставе против сопротивления врача.',
    positive_criteria: 'Острая локальная боль в межбугорковой борозде плечевой кости.',
    sensitivity_specificity: 'Se: 63%, Sp: 75%',
    icon_type: 'joint_stress',
    sort_order: 35
  },

  // HIP
  {
    code: 'faber',
    name_ru: 'Тест FABER (Патрика)',
    name_lat: "FABER / Patrick's test",
    joint_category: 'hip',
    target_structure: 'Патология ТБС / крестцово-подвздошного сочленения',
    methodology: 'Пациент лежит на спине. Стопа больной ноги укладывается на колено здоровой (Flexion, ABduction, External Rotation). Врач мягко давит на колено.',
    positive_criteria: 'Боль в паховой области указывает на патологию ТБС, боль сзади в крестце — на сакроилеит.',
    sensitivity_specificity: 'Se: 88%, Sp: 80%',
    icon_type: 'joint_stress',
    sort_order: 40
  },
  {
    code: 'fadir',
    name_ru: 'Тест FADIR',
    name_lat: 'FADIR test',
    joint_category: 'hip',
    target_structure: 'Феморо-ацетабулярный импинджмент (FAI)',
    methodology: 'Сгибание бедра до 90°, приведение (ADduction) и форсированная внутренняя ротация (Internal Rotation).',
    positive_criteria: 'Острая глубокая стреляющая боль в глубине паха.',
    sensitivity_specificity: 'Se: 95%, Sp: 60%',
    icon_type: 'joint_stress',
    sort_order: 41
  },
  {
    code: 'thomas',
    name_ru: 'Тест Томаса',
    name_lat: 'Thomas test',
    joint_category: 'hip',
    target_structure: 'Сгибательная контрактура бедра / подвздошно-поясничная м.',
    methodology: 'Лежа на спине, пациент прижимает контралатеральное бедро к груди.',
    positive_criteria: 'Исследуемая нога отрывается от кушетки, указывая на сгибательную контрактуру.',
    sensitivity_specificity: 'Se: 80%, Sp: 85%',
    icon_type: 'joint_stress',
    sort_order: 42
  },
  {
    code: 'trendelenburg',
    name_ru: 'Симптом Тренделенбурга',
    name_lat: 'Trendelenburg test',
    joint_category: 'hip',
    target_structure: 'Средняя ягодичная мышца (m. gluteus medius)',
    methodology: 'Пациент стоит на одной (больной) ноге в течение 30 секунд.',
    positive_criteria: 'Таз опускается в сторону противоположной поднятой ноги из-за слабости абдукторов.',
    sensitivity_specificity: 'Se: 73%, Sp: 77%',
    icon_type: 'posture',
    sort_order: 43
  },
  {
    code: 'ober',
    name_ru: 'Тест Обера',
    name_lat: "Ober's test",
    joint_category: 'hip',
    target_structure: 'Подвздошно-большеберцовый тракт (ITB)',
    methodology: 'Пациент лежит на здоровом боку. Врач отводит и слегка разгибает исследуемое бедро, затем плавно отпускает.',
    positive_criteria: 'Бедро остается в отведенном положении и не опускается ниже горизонтали кушетки.',
    sensitivity_specificity: 'Se: 75%, Sp: 82%',
    icon_type: 'joint_stress',
    sort_order: 44
  },

  // ANKLE / FOOT
  {
    code: 'windlass',
    name_ru: 'Тест Уиндласса',
    name_lat: 'Windlass test',
    joint_category: 'ankle',
    target_structure: 'Плантарный апоневроз (фасциит)',
    methodology: 'Пассивное максимальное тыльное сгибание I пальца стопы в положении стоя под нагрузкой и сидя.',
    positive_criteria: 'Резкая боль в области медиального бугра пяточной кости.',
    sensitivity_specificity: 'Se: 32%, Sp: 100%',
    icon_type: 'joint_stress',
    sort_order: 50
  },
  {
    code: 'thompson',
    name_ru: 'Тест Томпсона',
    name_lat: 'Thompson test',
    joint_category: 'ankle',
    target_structure: 'Целостность ахиллова сухожилия',
    methodology: 'Пациент лежит на животе, стопы свисают с кушетки. Врач сжимает среднюю треть икроножной мышцы.',
    positive_criteria: 'Отсутствие пассивного подошвенного сгибания стопы указывает на полный разрыв ахилла.',
    sensitivity_specificity: 'Se: 96%, Sp: 98%',
    icon_type: 'tendon',
    sort_order: 51
  },
  {
    code: 'anterior_drawer_ankle',
    name_ru: 'Передний выдвижной ящик голеностопа',
    name_lat: 'Anterior drawer test of ankle',
    joint_category: 'ankle',
    target_structure: 'Передняя таранно-малоберцовая связка (ATFL)',
    methodology: 'Стопа согнута под 20°. Врач фиксирует дистальный отдел голени и смещает стопу кпереди за пятку.',
    positive_criteria: 'Смещение стопы вперед более 5 мм, ощущение мягкого люфта.',
    sensitivity_specificity: 'Se: 80%, Sp: 85%',
    icon_type: 'joint_stress',
    sort_order: 52
  },
  {
    code: 'talar_tilt',
    name_ru: 'Стресс-тест таранной кости',
    name_lat: 'Talar tilt test',
    joint_category: 'ankle',
    target_structure: 'Пяточно-малоберцовая связка (CFL)',
    methodology: 'Врач производит форсированную инверсию стопы при нейтральном положении голеностопного сустава.',
    positive_criteria: 'Патологический угол наклона таранной кости >10° по сравнению со здоровой стороной.',
    sensitivity_specificity: 'Se: 67%, Sp: 88%',
    icon_type: 'joint_stress',
    sort_order: 53
  },

  // WRIST / HAND
  {
    code: 'phalen',
    name_ru: 'Тест Фалена',
    name_lat: "Phalen's test",
    joint_category: 'wrist',
    target_structure: 'Срединный нерв (карпальный синдром)',
    methodology: 'Пациент прижимает тыльные стороны кистей друг к другу с максимальным сгибанием лучезапястных суставов на 60 секунд.',
    positive_criteria: 'Появление онемения, покалывания или жжения в I–III пальцах кисти.',
    sensitivity_specificity: 'Se: 75%, Sp: 84%',
    icon_type: 'nerve_percussion',
    sort_order: 60
  },
  {
    code: 'tinel_wrist',
    name_ru: 'Симптом Тиннеля на запястье',
    name_lat: "Tinel's at carpal tunnel",
    joint_category: 'wrist',
    target_structure: 'Срединный нерв в карпальном канале',
    methodology: 'Легкая перкуссия ладонной поверхности лучезапястного сустава над проекцией retinaculum flexorum.',
    positive_criteria: 'Ощущение прострела электрическим током в I, II, III пальцы кисти.',
    sensitivity_specificity: 'Se: 50%, Sp: 77%',
    icon_type: 'nerve_percussion',
    sort_order: 61
  },
  {
    code: 'finkelstein',
    name_ru: 'Тест Финкельштейна',
    name_lat: "Finkelstein's test",
    joint_category: 'wrist',
    target_structure: 'Болезнь де Кервена (1-й компартмент разгибателей)',
    methodology: 'Пациент прячет I палец внутрь кулака, сжимая его остальными пальцами, после чего врач производит пассивную ульнарную девиацию кисти.',
    positive_criteria: 'Острая резкая боль в проекции шиловидного отростка лучевой кости.',
    sensitivity_specificity: 'Se: 89%, Sp: 94%',
    icon_type: 'joint_stress',
    sort_order: 62
  },
  {
    code: 'piano_key',
    name_ru: 'Симптом клавиши пианино',
    name_lat: 'Piano key test',
    joint_category: 'wrist',
    target_structure: 'Дистальный радиоульнарный сустав (DRUJ)',
    methodology: 'Врач нажимает на головку локтевой кости сверху вниз, как на клавишу фортепиано.',
    positive_criteria: 'Головка локтевой кости пружинит, баллотирует и вызывает боль при возврате.',
    sensitivity_specificity: 'Se: 70%, Sp: 85%',
    icon_type: 'joint_stress',
    sort_order: 63
  },
  {
    code: 'grind_thumb',
    name_ru: 'Тест шлифовки 1-го ПЗП (Grind test)',
    name_lat: 'Thumb carpometacarpal grind test',
    joint_category: 'wrist',
    target_structure: 'Ризартроз (артроз первого запястно-пястного сустава)',
    methodology: 'Осевое сжатие первой пястной кости по направлению к кости-трапеции с одновременным вращением.',
    positive_criteria: 'Болезненная крепитация, хруст и локальная боль у основания большого пальца.',
    sensitivity_specificity: 'Se: 64%, Sp: 93%',
    icon_type: 'joint_stress',
    sort_order: 64
  },

  // SPINE
  {
    code: 'lasegue',
    name_ru: 'Симптом Ласега',
    name_lat: 'Straight Leg Raise (SLR)',
    joint_category: 'spine',
    target_structure: 'Корешковый синдром L4–S1 (седалищный нерв)',
    methodology: 'Пациент лежит на спине. Врач плавно поднимает выпрямленную в колене ногу вверх.',
    positive_criteria: 'Появление стреляющей боли по задней поверхности ноги при угле подъема от 30° до 70°.',
    sensitivity_specificity: 'Se: 91%, Sp: 26%',
    icon_type: 'nerve_stretch',
    sort_order: 70
  },
  {
    code: 'adams',
    name_ru: 'Проба Адамса',
    name_lat: 'Adams forward bend test',
    joint_category: 'spine',
    target_structure: 'Структурный сколиоз / торсия позвонков',
    methodology: 'Пациент наклоняется вперед с опущенными руками и выпрямленными коленями.',
    positive_criteria: 'Асимметрия паравертебральных зон: визуализация реберного горба или поясничного мышечного валика.',
    sensitivity_specificity: 'Se: 84%, Sp: 93%',
    icon_type: 'posture',
    sort_order: 71
  },
  {
    code: 'spurling',
    name_ru: 'Тест Сперлинга',
    name_lat: "Spurling's neck compression test",
    joint_category: 'spine',
    target_structure: 'Цервикальная радикулопатия C5–C7',
    methodology: 'Пассивное разгибание шеи с наклоном головы в пораженную сторону и последующее легкое осевое давление на темя.',
    positive_criteria: 'Иррадиация острой боли или парестезии по ходу дерматома соответствующего шейного корешка в руку.',
    sensitivity_specificity: 'Se: 50%, Sp: 93%',
    icon_type: 'nerve_compression',
    sort_order: 72
  },
  {
    code: 'wassermann',
    name_ru: 'Тест Вассермана / бедренного нерва',
    name_lat: 'Femoral nerve stretch test',
    joint_category: 'spine',
    target_structure: 'Верхнепоясничный корешковый синдром L2–L4',
    methodology: 'Пациент лежит на животе. Врач пассивно сгибает ногу в колене и разгибает бедро кверху.',
    positive_criteria: 'Стреляющая боль по передней поверхности бедра.',
    sensitivity_specificity: 'Se: 82%, Sp: 85%',
    icon_type: 'nerve_stretch',
    sort_order: 73
  }
];

const DIAGNOSTIC_METHODS = [
  {
    code: 'xray_elbow_2v',
    name: 'Рентгенография локтевого сустава (2 проекции)',
    modality: 'xray',
    target_joint: 'elbow',
    servdict_id: 114, // 1 800 руб.
    clinical_indications: 'Исключение остеофитов надмыщелков, энтезофитов олекранона, костных деструкций и травматических повреждений.',
    protocol_phrase: 'Рентгенография правого/левого локтевого сустава в 2-х проекциях (прямая, боковая).',
    priority_level: 'primary',
    sort_order: 10
  },
  {
    code: 'us_elbow_epicond',
    name: 'УЗИ сухожилий надмыщелков локтевого сустава',
    modality: 'ultrasound',
    target_joint: 'elbow',
    servdict_id: 1675, // 1 500 руб.
    clinical_indications: 'Оценка сухожилий общего разгибателя/сгибателя кисти, толщины энтезиса, микрокальцинатов и неоваскуляризации.',
    protocol_phrase: 'УЗИ мягких тканей области латерального/медиального надмыщелка локтевого сустава.',
    priority_level: 'primary',
    sort_order: 11
  },
  {
    code: 'mri_elbow',
    name: 'МРТ локтевого сустава высокопольная (1.5 Тл)',
    modality: 'mri',
    target_joint: 'elbow',
    servdict_id: null,
    clinical_indications: 'Подозрение на частичный/полный разрыв дистального сухожилия бицепса, повреждение UCL/LCL, рассекающий остеохондрит.',
    protocol_phrase: 'МРТ локтевого сустава на аппарате мощностью не менее 1.5 Тл.',
    priority_level: 'secondary',
    sort_order: 12
  },
  {
    code: 'enmg_ulnar',
    name: 'Стимуляционная ЭНМГ локтевого нерва',
    modality: 'enmg',
    target_joint: 'elbow',
    servdict_id: null,
    clinical_indications: 'Диагностика туннельной невропатии локтевого нерва на уровне кубитального канала, определение блока проведения.',
    protocol_phrase: 'Электронейромиография (ЭНМГ) двигательных и чувствительных волокон локтевого нерва.',
    priority_level: 'primary',
    sort_order: 13
  },
  {
    code: 'xray_knee_2v',
    name: 'Рентгенография коленного сустава под нагрузкой',
    modality: 'xray',
    target_joint: 'knee',
    servdict_id: 114,
    clinical_indications: 'Оценка ширины суставной щели стоя с осевой нагрузкой весом тела, стадии гонартроза по Kellgren-Lawrence.',
    protocol_phrase: 'Рентгенография коленного сустава в 2 проекциях стоя с осевой нагрузкой.',
    priority_level: 'primary',
    sort_order: 20
  },
  {
    code: 'mri_knee_high',
    name: 'МРТ коленного сустава на томографе 1.5–3.0 Тл',
    modality: 'mri',
    target_joint: 'knee',
    servdict_id: null,
    clinical_indications: 'Верификация разрывов менисков (Stoller I–III), крестообразных связок, оценка хондромаляции мыщелков.',
    protocol_phrase: 'МРТ коленного сустава на высокопольном томографе 1.5–3.0 Тл.',
    priority_level: 'primary',
    sort_order: 21
  },
  {
    code: 'us_knee',
    name: 'УЗИ коленного сустава с оценкой заворотов',
    modality: 'ultrasound',
    target_joint: 'knee',
    servdict_id: 1675,
    clinical_indications: 'Диагностика синовита, оценка объема жидкости в верхнем завороте, выявление кисты Бейкера.',
    protocol_phrase: 'Ультразвуковое исследование коленного сустава и подколенной ямки.',
    priority_level: 'primary',
    sort_order: 22
  },
  {
    code: 'mri_shoulder',
    name: 'МРТ плечевого сустава',
    modality: 'mri',
    target_joint: 'shoulder',
    servdict_id: null,
    clinical_indications: 'Полнослойные и частичные разрывы вращательной манжеты плеча, импинджмент, повреждения губы сустава (Банкарт, SLAP).',
    protocol_phrase: 'МРТ плечевого сустава с оценкой ротаторной манжеты и акромиально-ключичного сочленения.',
    priority_level: 'primary',
    sort_order: 30
  },
  {
    code: 'us_shoulder',
    name: 'УЗИ плечевого сустава с функциональными пробами',
    modality: 'ultrasound',
    target_joint: 'shoulder',
    servdict_id: 1675,
    clinical_indications: 'Динамическая оценка скольжения сухожилия надостной мышцы, бурсит подакромиальной сумки, теносиновит бицепса.',
    protocol_phrase: 'УЗИ плечевого сустава с динамическими функциональными пробами.',
    priority_level: 'primary',
    sort_order: 31
  },
  {
    code: 'xray_shoulder_2v',
    name: 'Рентгенография плечевого сустава в 2 проекциях',
    modality: 'xray',
    target_joint: 'shoulder',
    servdict_id: 114,
    clinical_indications: 'Исключение субакромиального костного шпора (тип Bigliani), кальцифицирующего тендинита, артроза АКС.',
    protocol_phrase: 'Рентгенография плечевого сустава в прямой и трансторакальной / аксиальной проекциях.',
    priority_level: 'secondary',
    sort_order: 32
  },
  {
    code: 'xray_pelvis_hip',
    name: 'Обзорная рентгенография таза и обоих ТБС',
    modality: 'xray',
    target_joint: 'hip',
    servdict_id: 114,
    clinical_indications: 'Сравнительная оценка симметрии щелей ТБС, перекоса таза, шеечно-диафизарного угла, субхондрального склероза.',
    protocol_phrase: 'Обзорная рентгенография таза с захватом обоих тазобедренных суставов стоя.',
    priority_level: 'primary',
    sort_order: 40
  },
  {
    code: 'mri_hip',
    name: 'МРТ тазобедренного сустава',
    modality: 'mri',
    target_joint: 'hip',
    servdict_id: null,
    clinical_indications: 'Ранняя диагностика асептического некроза головки бедренной кости (синдром отека костного мозга), разрывы суставной губы.',
    protocol_phrase: 'МРТ тазобедренного сустава для исключения зон асептического остеонекроза головки бедра.',
    priority_level: 'primary',
    sort_order: 41
  },
  {
    code: 'us_hip_trochanter',
    name: 'УЗИ области большого вертела и ТБС',
    modality: 'ultrasound',
    target_joint: 'hip',
    servdict_id: 1675,
    clinical_indications: 'Бурсит вертельной сумки (трохантерит), энтезопатия сухожилий средней и малой ягодичных мышц.',
    protocol_phrase: 'УЗИ мягких тканей области большого вертела бедренной кости.',
    priority_level: 'primary',
    sort_order: 42
  },
  {
    code: 'xray_foot_load',
    name: 'Рентгенография стоп с физиологической нагрузкой',
    modality: 'xray',
    target_joint: 'ankle',
    servdict_id: 114,
    clinical_indications: 'Определение продольного и поперечного плоскостопия, визуализация пяточного энтезофита («шпоры»), угла свода стопы.',
    protocol_phrase: 'Рентгенография стопы в боковой проекции под статической нагрузкой весом тела.',
    priority_level: 'primary',
    sort_order: 50
  },
  {
    code: 'plantography',
    name: 'Компьютерная подометрия и оптическая плантография',
    modality: 'plantography',
    target_joint: 'ankle',
    servdict_id: 99, // 2 500 руб.
    clinical_indications: 'Оценка зон пиковой нагрузки, вальгусной/варусной установки пятки, индивидуальное моделирование ортезов стопы.',
    protocol_phrase: 'Компьютерная оптическая плантография и подометрия для индивидуальных ортопедических стелек.',
    priority_level: 'primary',
    sort_order: 51
  },
  {
    code: 'us_achilles',
    name: 'УЗИ ахиллова сухожилия и плантарной фасции',
    modality: 'ultrasound',
    target_joint: 'ankle',
    servdict_id: 1675,
    clinical_indications: 'Оценка толщины плантарной фасции (>4.5 мм), микроразрывов ахиллова сухожилия, признаков ретрокальканеального бурсита.',
    protocol_phrase: 'Ультразвуковое исследование ахиллова сухожилия и подошвенного апоневроза.',
    priority_level: 'primary',
    sort_order: 52
  },
  {
    code: 'mri_lumbosacral',
    name: 'МРТ пояснично-крестцового отдела позвоночника',
    modality: 'mri',
    target_joint: 'spine',
    servdict_id: null,
    clinical_indications: 'Оценка грыж и протрузий дисков L1–S1, компрессии корешков «конского хвоста», фораминального стеноза.',
    protocol_phrase: 'МРТ пояснично-крестцового отдела позвоночника (диски L1–S1).',
    priority_level: 'primary',
    sort_order: 60
  },
  {
    code: 'xray_spine_flex',
    name: 'Рентгенография позвоночника с функциональными пробами',
    modality: 'xray',
    target_joint: 'spine',
    servdict_id: 114,
    clinical_indications: 'Выявление сегментарной гипермобильности и нестабильности ПДС (спондилолистез) при сгибании и разгибании.',
    protocol_phrase: 'Рентгенография поясничного/шейного отдела позвоночника с функциональными пробами (максимальное сгибание/разгибание).',
    priority_level: 'secondary',
    sort_order: 61
  },
  {
    code: 'xray_spine_total',
    name: 'Панорамная спондилография позвоночника стоя',
    modality: 'xray',
    target_joint: 'spine',
    servdict_id: 114,
    clinical_indications: 'Компьютерный расчет угла деформации Кобба при сколиозе, фронтального и сагиттального баланса позвоночника.',
    protocol_phrase: 'Панорамная цифровая спондилография всего позвоночника стоя в 2-х проекциях с расчетом угла Кобба.',
    priority_level: 'primary',
    sort_order: 62
  },
  {
    code: 'enmg_carpal',
    name: 'Стимуляционная ЭНМГ срединного нерва кисти',
    modality: 'enmg',
    target_joint: 'wrist',
    servdict_id: null,
    clinical_indications: 'Верификация синдрома карпального канала, оценка степени компрессии и дистальной моторной латентности.',
    protocol_phrase: 'ЭНМГ срединного нерва на уровне карпального канала кисти.',
    priority_level: 'primary',
    sort_order: 70
  },
  {
    code: 'us_wrist_carpal',
    name: 'УЗИ срединного нерва в карпальном канале',
    modality: 'ultrasound',
    target_joint: 'wrist',
    servdict_id: 1675,
    clinical_indications: 'Измерение площади поперечного сечения срединного нерва на входе в запястный канал (норма до 10 мм²).',
    protocol_phrase: 'УЗИ структур карпального канала и срединного нерва лучезапястного сустава.',
    priority_level: 'primary',
    sort_order: 71
  },
  {
    code: 'xray_wrist_2v',
    name: 'Рентгенография лучезапястного сустава в 2 проекциях',
    modality: 'xray',
    target_joint: 'wrist',
    servdict_id: 114,
    clinical_indications: 'Оценка шиловидных отростков, DRUJ, признаков ризартроза и консолидации переломов костей запястья.',
    protocol_phrase: 'Рентгенография лучезапястного сустава и кисти в 2-х проекциях.',
    priority_level: 'primary',
    sort_order: 72
  },
  {
    code: 'mri_wrist',
    name: 'МРТ лучезапястного сустава',
    modality: 'mri',
    target_joint: 'wrist',
    servdict_id: null,
    clinical_indications: 'Визуализация триангулярного волокнисто-хрящевого комплекса (TFCC), ладьевидно-полулунной связки, асептического некроза полулунной кости.',
    protocol_phrase: 'МРТ лучезапястного сустава с детализацией связочного аппарата и TFCC.',
    priority_level: 'secondary',
    sort_order: 73
  },
  {
    code: 'lab_synovial',
    name: 'Микроскопическое и биохимическое исследование синовии',
    modality: 'lab',
    target_joint: 'general',
    servdict_id: 1600, // 1 400 руб.
    clinical_indications: 'Дифференциация инфекционного артрита, микрокристаллического синовита (подагра/пирофосфат) и дегенеративного выпота.',
    protocol_phrase: 'Лабораторный анализ синовиальной жидкости (микроскопия, цитоз, тест муцинового сгустка, кристаллы).',
    priority_level: 'primary',
    sort_order: 80
  },
  {
    code: 'lab_rheumo_panel',
    name: 'Расширенная ревматологическая панель крови',
    modality: 'lab',
    target_joint: 'general',
    servdict_id: 1600,
    clinical_indications: 'Исключение ревматоидного артрита, серонегативных спондилоартритов и подагрического артрита.',
    protocol_phrase: 'Комплексный анализ крови: С-реактивный белок (ультрачувствительный), РФ, АЦЦП, мочевая кислота.',
    priority_level: 'primary',
    sort_order: 81
  },
  {
    code: 'ct_joint_3d',
    name: 'КТ сустава с трехмерной 3D-реконструкцией',
    modality: 'ct',
    target_joint: 'general',
    servdict_id: null,
    clinical_indications: 'Тонкая костная оценка внутрисуставных дефектов, остеохондропластика, подготовка к эндопротезированию.',
    protocol_phrase: 'Спиральная компьютерная томография сустава с шагом среза 0.5 мм и 3D-реконструкцией.',
    priority_level: 'secondary',
    sort_order: 82
  }
];

// Helper to construct gold-standard templates
const GOLD_TEMPLATES = [
  // -------------------------------------------------------------------------
  // KNEE (4 templates)
  // -------------------------------------------------------------------------
  {
    title: 'Первичный гонартроз II стадии с реактивным синовитом',
    joint_name: 'knee',
    default_mkb_code: 'M17.1',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'right',
    complaints: 'Боль по внутренней поверхности коленного сустава при физической нагрузке, спуске по лестнице и в начале ходьбы («стартовые боли»). Чувство распирания и припухлость в области супрапателлярного заворота.',
    anamnesis: 'Боли беспокоят около 1.5 лет, постепенное ухудшение после дачного сезона. Ранее принимал курсы НПВП с временным эффектом.',
    objective: 'Ось конечности: умеренный genu varum. Синовит: II степень (умеренный). Пальпация медиальной суставной щели и гусиной лапки резко болезненна.',
    rom_preset: { flexion_active: 110, flexion_passive: 120, extension_deficit: -5 },
    recommendations: 'Разгрузка сустава тростью при длительной ходьбе, индивидуальные ортопедические стельки с компенсацией перекоса.',
    tests: [
      { code: 'mcmurray', expected: 'positive_medial', mandatory: 1 },
      { code: 'patella_ballottement', expected: 'positive', mandatory: 1 },
      { code: 'lachman', expected: 'negative', mandatory: 1 },
      { code: 'anterior_drawer', expected: 'negative', mandatory: 0 },
      { code: 'patella_grind', expected: 'positive', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'xray_knee_2v', urgency: 'routine', is_primary: 1 },
      { code: 'us_knee', urgency: 'routine', is_primary: 1 },
      { code: 'lab_synovial', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Пункция коленного сустава с эвакуацией выпота и введением гиалуроновой кислоты 2%', unit_price: 4500, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Высокоинтенсивная магнитотерапия SIS коленного сустава №5', unit_price: 7500, quantity: 1 },
      { category: 'orthotics', title: 'Индивидуальные ортопедические стельки с разгрузкой медиального свода', unit_price: 4500, quantity: 1, service_id: 99 }
    ]
  },
  {
    title: 'Разрыв медиального мениска (Stoller IIIb)',
    joint_name: 'knee',
    default_mkb_code: 'M23.2',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    default_side: 'right',
    complaints: 'Острая «кинжальная» боль по внутренней суставной щели при глубоком приседании и ротации голени. Периодические блокировки («заклинивание») сустава.',
    anamnesis: '3 недели назад при игре в футбол оступился с резкой ротацией бедра на фиксированной стопе. Острый щелчок, отек развился к утру.',
    objective: 'Синовит: I степень. Резкая локальная болезненность в точке проекции заднего рога медиального мениска.',
    rom_preset: { flexion_active: 105, flexion_passive: 115, extension_deficit: -10 },
    recommendations: 'Консультация артроскопического хирурга по результатам МРТ. Ограничение глубокого приседания и ударных нагрузок.',
    tests: [
      { code: 'mcmurray', expected: 'positive_medial', mandatory: 1 },
      { code: 'appley', expected: 'positive', mandatory: 1 },
      { code: 'lachman', expected: 'negative', mandatory: 1 },
      { code: 'pivot_shift', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'mri_knee_high', urgency: 'cito', is_primary: 1 },
      { code: 'xray_knee_2v', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Ортез коленный шарнирный полужесткий с ограничением амплитуды', unit_price: 4800, quantity: 1 },
      { category: 'physio', title: 'Лазеротерапия высокой интенсивности HIL коленного сустава №5', unit_price: 6000, quantity: 1 }
    ]
  },
  {
    title: 'Полный разрыв передней крестообразной связки (ПКС)',
    joint_name: 'knee',
    default_mkb_code: 'S83.5',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    default_side: 'left',
    complaints: 'Ощущение «выскакивания» или подкашивания голени при ходьбе и попытке сменить направление движения. Нестабильность колена.',
    anamnesis: 'Горнолыжная травма 1 месяц назад. Момент падения сопровождался звуком разрыва («хлопок») и массивным отеком в первые 2 часа (гемартроз).',
    objective: 'Симптом баллотирования (+). Атрофия четырехглавой мышцы бедра (-1.5 см в окружности).',
    rom_preset: { flexion_active: 125, flexion_passive: 130, extension_deficit: 0 },
    recommendations: 'Жесткий функциональный рамный ортез. Направление на плановую артроскопическую аутопластику ПКС.',
    tests: [
      { code: 'lachman', expected: 'positive', mandatory: 1 },
      { code: 'anterior_drawer', expected: 'positive', mandatory: 1 },
      { code: 'pivot_shift', expected: 'positive', mandatory: 1 },
      { code: 'mcmurray', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'mri_knee_high', urgency: 'cito', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Функциональный жесткий 4-точечный коленный ортез', unit_price: 8500, quantity: 1 },
      { category: 'physio', title: 'Электростимуляция четырехглавой мышцы бедра №8', unit_price: 6400, quantity: 1 }
    ]
  },
  {
    title: 'Пателлофеморальный артроз и латеральная гиперпрессия надколенника',
    joint_name: 'knee',
    default_mkb_code: 'M22.2',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'bilateral',
    complaints: 'Боль по передней поверхности коленей, усиливающаяся при длительном сидении («симптом кинотеатра»), спуске с горы или лестницы. Хруст и крепитация при сгибании.',
    anamnesis: 'Боли более 2 лет, усугубились при увеличении массы тела и занятиях кроссфитом.',
    objective: 'Положительный симптом скольжения надколенника с крепитацией. Вальгусная установка коленей.',
    rom_preset: { flexion_active: 135, flexion_passive: 140, extension_deficit: 0 },
    recommendations: 'Кинезиотейпирование надколенника с медиализирующей тягой. Укрепление медиальной широкой мышцы бедра (VMO).',
    tests: [
      { code: 'patella_grind', expected: 'positive', mandatory: 1 },
      { code: 'patella_apprehension', expected: 'negative', mandatory: 1 },
      { code: 'lachman', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'xray_knee_2v', urgency: 'routine', is_primary: 1 },
      { code: 'mri_knee_high', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Внутрисуставное введение аутологичной плазмы PRP под УЗИ-навигацией', unit_price: 5000, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Высокоинтенсивная магнитотерапия SIS надколенника №6', unit_price: 9000, quantity: 1 }
    ]
  },

  // -------------------------------------------------------------------------
  // ELBOW (4 templates)
  // -------------------------------------------------------------------------
  {
    title: 'Латеральный эпикондилит локтевого сустава («локоть теннисиста»)',
    joint_name: 'elbow',
    default_mkb_code: 'M77.1',
    category: 'Энтезопатии и тендиниты',
    default_side: 'right',
    complaints: 'Жгучая боль по наружной поверхности правого локтя с иррадиацией по тылу предплечья. Усиливается при удержании чашки, рукопожатии, повороте дверной ручки или работе за мышью.',
    anamnesis: 'Симптомы нарастали в течение 2 месяцев после интенсивных строительных работ / игры в теннис.',
    objective: 'Локальная резкая болезненность при пальпации латерального надмыщелка плечевой кости и сухожилий разгибателей. Отека нет.',
    rom_preset: { flexion_active: 145, flexion_passive: 150, extension_deficit: 0, rotation_ext: 85, rotation_int: 85 },
    recommendations: 'Ортезирование предплечья бандажом с силиконовым пилотом. Исключение монотонных разгибательных нагрузок на кисть.',
    tests: [
      { code: 'cozen', expected: 'positive', mandatory: 1 },
      { code: 'mill', expected: 'positive', mandatory: 1 },
      { code: 'golfer', expected: 'negative', mandatory: 1 },
      { code: 'tinel_cubital', expected: 'negative', mandatory: 1 },
      { code: 'valgus_stress_elbow', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'us_elbow_epicond', urgency: 'routine', is_primary: 1 },
      { code: 'xray_elbow_2v', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Периартикулярная блокада области латерального надмыщелка с анестетиком', unit_price: 3000, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Фокусированная ударно-волновая терапия (УВТ) зоны эпикондилита №4', unit_price: 6000, quantity: 1 },
      { category: 'orthotics', title: 'Бандаж на предплечье с разгрузочным пилотом (эпикондилитный фиксатор)', unit_price: 2500, quantity: 1 }
    ]
  },
  {
    title: 'Медиальный эпикондилит («локоть гольфиста»)',
    joint_name: 'elbow',
    default_mkb_code: 'M77.0',
    category: 'Энтезопатии и тендиниты',
    default_side: 'right',
    complaints: 'Ноющая и острая боль по внутренней поверхности локтя при сгибании кисти, подъеме тяжестей хватом снизу.',
    anamnesis: 'Связывает с занятиями силовыми тренировками (подтягивания хватом снизу, подъем штанги на бицепс).',
    objective: 'Пальпация медиального надмыщелка плеча резко болезненна. Локтевой нерв интактен, борозда безболезненна.',
    rom_preset: { flexion_active: 145, flexion_passive: 150, extension_deficit: 0, rotation_ext: 85, rotation_int: 85 },
    recommendations: 'Локальная криотерапия, ортезирование предплечья разгрузочным бандажом.',
    tests: [
      { code: 'golfer', expected: 'positive', mandatory: 1 },
      { code: 'cozen', expected: 'negative', mandatory: 1 },
      { code: 'tinel_cubital', expected: 'negative', mandatory: 1 },
      { code: 'valgus_stress_elbow', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'us_elbow_epicond', urgency: 'routine', is_primary: 1 },
      { code: 'xray_elbow_2v', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'physio', title: 'Фокусированная ударно-волновая терапия (УВТ) медиального надмыщелка №4', unit_price: 6000, quantity: 1 },
      { category: 'orthotics', title: 'Бандаж на локтевой сустав разгрузочный', unit_price: 2500, quantity: 1 }
    ]
  },
  {
    title: 'Асептический бурсит локтевого отростка (олекранона)',
    joint_name: 'elbow',
    default_mkb_code: 'M70.2',
    category: 'Бурситы и синовиты',
    default_side: 'left',
    complaints: 'Округлое флюктуирующее образование в области задней поверхности локтя размером с грецкий орех. Безболезненное или малоболезненное при пальпации.',
    anamnesis: 'Связывает с длительной привычкой опираться локтем на стол во время работы за компьютером.',
    objective: 'В проекции bursa olecrani мягкоэластичное образование 4х3 см, симптом флюктуации (+), местная температура не повышена, гиперемии нет.',
    rom_preset: { flexion_active: 145, flexion_passive: 150, extension_deficit: 0, rotation_ext: 85, rotation_int: 85 },
    recommendations: 'Давящая спиртовая повязка, эластичный налокотник с разгрузочным силиконовым кольцом.',
    tests: [
      { code: 'tinel_cubital', expected: 'negative', mandatory: 1 },
      { code: 'cozen', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'us_elbow_epicond', urgency: 'routine', is_primary: 1 },
      { code: 'lab_synovial', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Лечебно-диагностическая пункция локтевой сумки с аспирацией выпота и введением глюкокортикоида', unit_price: 3500, quantity: 1, service_id: 1675 },
      { category: 'orthotics', title: 'Эластичный налокотник с защитной подушечкой', unit_price: 1800, quantity: 1 }
    ]
  },
  {
    title: 'Синдром кубитального канала (невропатия локтевого нерва)',
    joint_name: 'elbow',
    default_mkb_code: 'G56.2',
    category: 'Туннельные невропатии',
    default_side: 'right',
    complaints: 'Онемение, «мурашки» и снижение чувствительности в IV и V пальцах кисти. Слабость захвата кисти, неловкость мелких движений.',
    anamnesis: 'Болеет более 4 месяцев. Просыпается ночью от выраженного онемения пальцев.',
    objective: 'Гипестезия локтевого края кисти и V пальца. Симптом Фромана (+): слабость приведения I пальца.',
    rom_preset: { flexion_active: 145, flexion_passive: 150, extension_deficit: 0, rotation_ext: 85, rotation_int: 85 },
    recommendations: 'Ночной иммобилизирующий ортез, препятствующий сгибанию локтя более 45°. Нейротропная терапия.',
    tests: [
      { code: 'tinel_cubital', expected: 'positive', mandatory: 1 },
      { code: 'cozen', expected: 'negative', mandatory: 0 },
      { code: 'valgus_stress_elbow', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'enmg_ulnar', urgency: 'cito', is_primary: 1 },
      { code: 'us_elbow_epicond', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Ночной позиционный ортез на локтевой сустав (ограничение сгибания)', unit_price: 3200, quantity: 1 },
      { category: 'physio', title: 'Высокоинтенсивная магнитотерапия SIS области кубитального канала №6', unit_price: 9000, quantity: 1 }
    ]
  },

  // -------------------------------------------------------------------------
  // SHOULDER (4 templates)
  // -------------------------------------------------------------------------
  {
    title: 'Субакромиальный импинджмент-синдром плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.1',
    category: 'Энтезопатии и тендиниты',
    default_side: 'right',
    complaints: 'Боль по наружной поверхности плеча при отведении руки в диапазоне 60–120° («дуга болезненного отведения»). Боль при заведении руки за спину, невозможность спать на правом боку.',
    anamnesis: 'Боли более 3 месяцев после ремонта и побелки потолка.',
    objective: 'Пальпация субакромиальной зоны болезненна. Атрофии дельтовидной мышцы нет.',
    rom_preset: { abduction: 90, flexion_active: 100, flexion_passive: 160, rotation_ext: 45, rotation_int: 50 },
    recommendations: 'Избегать движений руки выше уровня плеча. Кинезиотейпирование дельтовидной зоны.',
    tests: [
      { code: 'neer', expected: 'positive', mandatory: 1 },
      { code: 'hawkins', expected: 'positive', mandatory: 1 },
      { code: 'empty_can_jobe', expected: 'positive', mandatory: 1 },
      { code: 'drop_arm', expected: 'negative', mandatory: 1 },
      { code: 'apprehension', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'mri_shoulder', urgency: 'routine', is_primary: 1 },
      { code: 'us_shoulder', urgency: 'routine', is_primary: 0 },
      { code: 'xray_shoulder_2v', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Субакромиальная лечебно-медикаментозная блокада под УЗИ-навигацией', unit_price: 3500, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Фокусированная УВТ субакромиальной зоны №4', unit_price: 6000, quantity: 1 }
    ]
  },
  {
    title: 'Массивный полнослойный разрыв вращательной манжеты плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.1',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    default_side: 'right',
    complaints: 'Резкая слабость и невозможность поднять руку выше горизонтального уровня («рука не слушается»). Постоянная ночная боль.',
    anamnesis: 'Падение на вытянутую руку 2 месяца назад с резким хрустом в плече.',
    objective: 'Атрофия надостной и подостной ямок. Пассивные движения в полном объеме, активные резко ограничены.',
    rom_preset: { abduction: 40, flexion_active: 50, flexion_passive: 160, rotation_ext: 30, rotation_int: 40 },
    recommendations: 'Отводящая шина-подушка на плечевой сустав. Направление на артроскопический шов вращательной манжеты якорями.',
    tests: [
      { code: 'drop_arm', expected: 'positive', mandatory: 1 },
      { code: 'empty_can_jobe', expected: 'positive', mandatory: 1 },
      { code: 'neer', expected: 'positive', mandatory: 1 }
    ],
    diagnostics: [
      { code: 'mri_shoulder', urgency: 'cito', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Отводящая шина-подушка для плечевого сустава (15-30°)', unit_price: 6500, quantity: 1 }
    ]
  },
  {
    title: 'Адгезивный капсулит («синдром замороженного плеча»)',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.0',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'left',
    complaints: 'Выраженная скованность и тугоподвижность плеча во всех плоскостях. Боль усиливается при любых резких попытках движения.',
    anamnesis: 'Симптомы развивались постепенно в течение 6 месяцев на фоне сахарного диабета II типа.',
    objective: 'Глобальное пропорциональное ограничение как активных, так и пассивных движений (капсулярный паттерн). Резкий дефицит наружной ротации.',
    rom_preset: { abduction: 60, flexion_active: 70, flexion_passive: 80, rotation_ext: 15, rotation_int: 20 },
    recommendations: 'Гидродилатационная дистензионная блокада сустава. Ранняя разработка амплитуды на аппарате Artromot.',
    tests: [
      { code: 'neer', expected: 'positive', mandatory: 0 },
      { code: 'hawkins', expected: 'positive', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'mri_shoulder', urgency: 'routine', is_primary: 1 },
      { code: 'xray_shoulder_2v', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Гидродилятационная блокада плечевого сустава с дипроспаном под контролем УЗИ', unit_price: 4500, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Курс пассивной роботизированной механотерапии Artromot плечевого сустава №10', unit_price: 12000, quantity: 1 }
    ]
  },
  {
    title: 'Тендинит сухожилия длинной головки двуглавой мышцы плеча',
    joint_name: 'shoulder',
    default_mkb_code: 'M75.2',
    category: 'Энтезопатии и тендиниты',
    default_side: 'right',
    complaints: 'Боль по передней поверхности плечевого сустава с иррадиацией по ходу бицепса, усиливается при подъеме тяжестей перед собой.',
    anamnesis: 'Боли начались после интенсивных занятий в тренажерном зале (жим штанги, подъем гантелей).',
    objective: 'Локальная болезненность при пальпации в sulcus intertubercularis. Движения в плече полные.',
    rom_preset: { abduction: 160, flexion_active: 160, flexion_passive: 170, rotation_ext: 60, rotation_int: 60 },
    recommendations: 'Ограничение тракционных нагрузок на руку, курс локальной криотерапии.',
    tests: [
      { code: 'speed', expected: 'positive', mandatory: 1 },
      { code: 'neer', expected: 'negative', mandatory: 1 },
      { code: 'hawkins', expected: 'negative', mandatory: 1 }
    ],
    diagnostics: [
      { code: 'us_shoulder', urgency: 'routine', is_primary: 1 },
      { code: 'mri_shoulder', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Блокада влагалища длинной головки бицепса под УЗИ-навигацией', unit_price: 3000, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Фокусированная УВТ области сухожилия бицепса №4', unit_price: 6000, quantity: 1 }
    ]
  },

  // -------------------------------------------------------------------------
  // HIP (4 templates)
  // -------------------------------------------------------------------------
  {
    title: 'Первичный коксартроз II стадии',
    joint_name: 'hip',
    default_mkb_code: 'M16.1',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'right',
    complaints: 'Глубокая ноющая боль в паховой области, иррадиирующая по передней поверхности бедра в колено. Затруднение при надевании обуви и носков, утренняя скованность до 20 минут. Хромота при длительной ходьбе.',
    anamnesis: 'Болеет более 2 лет с постепенным снижением дистанции безболевой ходьбы до 500 метров.',
    objective: 'Походка щадящая на правую ногу. Гипотрофия ягодичных мышц. Ограничение внутренней ротации и отведения.',
    rom_preset: { flexion_active: 95, flexion_passive: 105, rotation_ext: 25, rotation_int: 15 },
    recommendations: 'Разгрузка сустава тростью при длительной ходьбе, индивидуальные ортопедические стельки с компенсацией перекоса таза.',
    tests: [
      { code: 'faber', expected: 'positive', mandatory: 1 },
      { code: 'thomas', expected: 'positive', mandatory: 1 },
      { code: 'trendelenburg', expected: 'positive', mandatory: 1 },
      { code: 'fadir', expected: 'positive', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'xray_pelvis_hip', urgency: 'routine', is_primary: 1 },
      { code: 'mri_hip', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Внутрисуставное введение протеза синовиальной жидкости в ТБС под УЗИ', unit_price: 6500, quantity: 1, service_id: 1675 },
      { category: 'orthotics', title: 'Индивидуальные ортопедические стельки с компенсацией перекоса таза', unit_price: 4500, quantity: 1, service_id: 99 },
      { category: 'physio', title: 'Высокоинтенсивная магнитотерапия SIS области ТБС №6', unit_price: 9000, quantity: 1 }
    ]
  },
  {
    title: 'Вертлужный трохантерит (большой вертельный бурсит)',
    joint_name: 'hip',
    default_mkb_code: 'M70.6',
    category: 'Бурситы и синовиты',
    default_side: 'right',
    complaints: 'Боль по наружной поверхности бедра в области «галифе», усиливается при лежании на больном боку, подъеме по лестнице и вставании со стула. В пах не иррадиирует.',
    anamnesis: 'Симптомы возникли после интенсивной ходьбы в неудобной обуви 1 месяц назад.',
    objective: 'Пальпация верхушки большого вертела бедренной кости вызывает резкую локальную боль («симптом прыжка»). Движения в ТБС в полном объеме.',
    rom_preset: { flexion_active: 115, flexion_passive: 125, rotation_ext: 40, rotation_int: 35 },
    recommendations: 'Исключить сон на пораженном боку, курс локальной противовоспалительной терапии.',
    tests: [
      { code: 'faber', expected: 'negative', mandatory: 1 },
      { code: 'fadir', expected: 'negative', mandatory: 1 },
      { code: 'trendelenburg', expected: 'negative', mandatory: 0 },
      { code: 'ober', expected: 'positive', mandatory: 1 }
    ],
    diagnostics: [
      { code: 'us_hip_trochanter', urgency: 'routine', is_primary: 1 },
      { code: 'xray_pelvis_hip', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Периартикулярная блокада трохантерной зоны с бетаметазоном под УЗИ', unit_price: 3000, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Фокусированная УВТ области большого вертела №4', unit_price: 6000, quantity: 1 }
    ]
  },
  {
    title: 'Феморо-ацетабулярный импинджмент (FAI, Cam/Pincer)',
    joint_name: 'hip',
    default_mkb_code: 'M24.8',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'left',
    complaints: 'Острая «стреляющая» боль в глубине паха при глубоком приседании, посадке в низкий автомобиль или занятиях спортом (бег, единоборства).',
    anamnesis: 'Молодой возраст (25–40 лет), регулярные спортивные нагрузки.',
    objective: 'Ограничение внутренней ротации бедра при сгибании 90° (до 10°).',
    rom_preset: { flexion_active: 100, flexion_passive: 110, rotation_ext: 35, rotation_int: 10 },
    recommendations: 'Модификация спортивных нагрузок (исключение глубокого сгибания бедра). Консультация артроскопического хирурга.',
    tests: [
      { code: 'fadir', expected: 'positive', mandatory: 1 },
      { code: 'faber', expected: 'negative', mandatory: 1 }
    ],
    diagnostics: [
      { code: 'xray_pelvis_hip', urgency: 'routine', is_primary: 1 },
      { code: 'mri_hip', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'physio', title: 'Курс физиотерапии SIS тазобедренного сустава №5', unit_price: 7500, quantity: 1 }
    ]
  },
  {
    title: 'Асептический некроз головки бедренной кости (АНГБК) I-II стадии',
    joint_name: 'hip',
    default_mkb_code: 'M87.0',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'right',
    complaints: 'Постоянная глухая боль в паху и ягодице, не проходящая в покое и беспокоящая по ночам. Быстрое прогрессирование хромоты.',
    anamnesis: 'Факторы риска: прием системных кортикостероидов, перенесенная COVID-инфекция, алкогольный анамнез.',
    objective: 'Резкое ограничение ротации бедра из-за боли. Пальпация передней поверхности капсулы ТБС резко болезненна.',
    rom_preset: { flexion_active: 85, flexion_passive: 95, rotation_ext: 15, rotation_int: 10 },
    recommendations: 'Строгая разгрузка конечности костылями (исключение осевой нагрузки). Направление на туннелизацию с PRP.',
    tests: [
      { code: 'faber', expected: 'positive', mandatory: 1 },
      { code: 'fadir', expected: 'positive', mandatory: 1 }
    ],
    diagnostics: [
      { code: 'mri_hip', urgency: 'cito', is_primary: 1 },
      { code: 'xray_pelvis_hip', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Костыли подмышечные с мягкими опорами (пара)', unit_price: 2200, quantity: 1 }
    ]
  },

  // -------------------------------------------------------------------------
  // ANKLE / FOOT (4 templates)
  // -------------------------------------------------------------------------
  {
    title: 'Плантарный фасциит с пяточным энтезофитом («пяточная шпора»)',
    joint_name: 'ankle',
    default_mkb_code: 'M77.3',
    category: 'Энтезопатии и тендиниты',
    default_side: 'right',
    complaints: 'Острая жгучая боль в подошвенной поверхности пятки при первых утренних шагах («стартовая боль»), пациент вынужден наступать на носок. После расхаживания боль немного стихает, к вечеру нарастает.',
    anamnesis: 'Болеет более 6 месяцев, консервативное лечение мазями без стойкого эффекта.',
    objective: 'Локальная резкая болезненность при пальпации медиального бугра пяточной кости. Свод стопы уплощен.',
    rom_preset: { dorsiflexion: 15, plantarflexion: 40 },
    recommendations: 'Ночной страсбургский носок / ночной фиксатор фасции. Индивидуальные ортопедические стельки с разгрузочным окном под пяткой.',
    tests: [
      { code: 'windlass', expected: 'positive', mandatory: 1 },
      { code: 'thompson', expected: 'negative', mandatory: 1 },
      { code: 'anterior_drawer_ankle', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'xray_foot_load', urgency: 'routine', is_primary: 1 },
      { code: 'plantography', urgency: 'routine', is_primary: 1 },
      { code: 'us_achilles', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'physio', title: 'Фокусированная ударно-волновая терапия (УВТ) пяточной зоны №5', unit_price: 7500, quantity: 1 },
      { category: 'orthotics', title: 'Индивидуальные ортопедические стельки с разгрузочным окном под пяточным бугром', unit_price: 4500, quantity: 1, service_id: 99 },
      { category: 'orthotics', title: 'Ночной страсбургский носок для растяжения подошвенной фасции', unit_price: 2400, quantity: 1 }
    ]
  },
  {
    title: 'Частичный разрыв передней таранно-малоберцовой связки голеностопа',
    joint_name: 'ankle',
    default_mkb_code: 'S93.4',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    default_side: 'right',
    complaints: 'Боль по наружной поверхности голеностопа, отек латеральной лодыжки, подкожная гематома. Хромота при нагрузке.',
    anamnesis: 'Подвернул стопу кнутри (супинационная инверсионная травма) на неровной поверхности вчера.',
    objective: 'Отечность в проекции латеральной лодыжки, гематома, распространяющаяся на тыл стопы.',
    rom_preset: { dorsiflexion: 10, plantarflexion: 25 },
    recommendations: 'Иммобилизация голеностопным полужестким ортезом с боковыми пластинами на 3 недели. Режим R.I.C.E.',
    tests: [
      { code: 'anterior_drawer_ankle', expected: 'positive', mandatory: 1 },
      { code: 'talar_tilt', expected: 'positive', mandatory: 1 },
      { code: 'thompson', expected: 'negative', mandatory: 1 }
    ],
    diagnostics: [
      { code: 'xray_foot_load', urgency: 'cito', is_primary: 1 },
      { code: 'us_achilles', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Ортез голеностопный полужесткий с боковыми стабилизирующими ребрами', unit_price: 3800, quantity: 1 },
      { category: 'physio', title: 'Магнитотерапия противоотечная голеностопного сустава №5', unit_price: 5000, quantity: 1 }
    ]
  },
  {
    title: 'Хронический тендинит ахиллова сухожилия (ахиллодиния)',
    joint_name: 'ankle',
    default_mkb_code: 'M76.6',
    category: 'Энтезопатии и тендиниты',
    default_side: 'left',
    complaints: 'Тянущая боль в области задней поверхности голени на 3–5 см выше пятки, возникающая в начале бега и ходьбы. Утолщение сухожилия.',
    anamnesis: 'Боли более 3 месяцев после увеличения беговых объемов.',
    objective: 'Локальное веретенообразное утолщение сухожилия, пальпация резко болезненна.',
    rom_preset: { dorsiflexion: 15, plantarflexion: 40 },
    recommendations: 'Курс эксцентрических тренировок по Альфредсону. Подпяточники силиконовые 1 см.',
    tests: [
      { code: 'thompson', expected: 'negative', mandatory: 1 },
      { code: 'windlass', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'us_achilles', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Локальная PRP-терапия (обогащенная тромбоцитами плазма) паратендинозно под УЗИ', unit_price: 4500, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Фокусированная УВТ ахиллова сухожилия №4', unit_price: 6000, quantity: 1 },
      { category: 'orthotics', title: 'Подпяточники амортизирующие силиконовые', unit_price: 1200, quantity: 1 }
    ]
  },
  {
    title: 'Hallux Valgus II степени, метатарзалгия',
    joint_name: 'ankle',
    default_mkb_code: 'M20.1',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'bilateral',
    complaints: 'Отклонение первого пальца стопы кнаружи, воспаление и натирание «косточки» в обуви. Боль под головками II-III плюсневых костей («натоптыши»).',
    anamnesis: 'Деформация нарастает в течение 5 лет, ношение модельной обуви на высоком каблуке.',
    objective: 'Вальгусное отклонение I пальца >25°, гиперкератоз подошвы под II плюсневой костью.',
    rom_preset: { dorsiflexion: 20, plantarflexion: 45 },
    recommendations: 'Индивидуальные ортопедические стельки с метатарзальным валиком Зейца. Ночной отводящий бандаж.',
    tests: [
      { code: 'windlass', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'xray_foot_load', urgency: 'routine', is_primary: 1 },
      { code: 'plantography', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Индивидуальные ортопедические стельки с метатарзальным валиком', unit_price: 4500, quantity: 1, service_id: 99 },
      { category: 'orthotics', title: 'Ночной корригирующий бандаж первого пальца стопы (пара)', unit_price: 2600, quantity: 1 }
    ]
  },

  // -------------------------------------------------------------------------
  // WRIST / HAND (4 templates)
  // -------------------------------------------------------------------------
  {
    title: 'Синдром запястного (карпального) канала',
    joint_name: 'wrist',
    default_mkb_code: 'G56.0',
    category: 'Туннельные невропатии',
    default_side: 'right',
    complaints: 'Онемение, покалывание и жгучие боли в I, II, III пальцах кисти, особенно ночью и под утро («будят по ночам, приходится трясти кистью»). Слабость удержания чашки, выпадение предметов.',
    anamnesis: 'Болеет 6 месяцев, интенсивная работа за клавиатурой компьютера.',
    objective: 'Гипестезия в зоне иннервации n. medianus (ладонная поверхность 1-3 пальцев). Гипотрофия мышц thenar.',
    rom_preset: { flexion_active: 75, flexion_passive: 80, extension_deficit: 0 },
    recommendations: 'Ночной нейтральный шинирующий ортез на запястье (cock-up splint). Избегать длительного сгибания кисти.',
    tests: [
      { code: 'phalen', expected: 'positive', mandatory: 1 },
      { code: 'tinel_wrist', expected: 'positive', mandatory: 1 },
      { code: 'finkelstein', expected: 'negative', mandatory: 1 },
      { code: 'piano_key', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'enmg_carpal', urgency: 'cito', is_primary: 1 },
      { code: 'us_wrist_carpal', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Гидродиссекция срединного нерва под контролем ультразвука', unit_price: 4500, quantity: 1, service_id: 1675 },
      { category: 'orthotics', title: 'Ночной иммобилизирующий ортез лучезапястный', unit_price: 2800, quantity: 1 }
    ]
  },
  {
    title: 'Стенозирующий лигаментит де Кервена',
    joint_name: 'wrist',
    default_mkb_code: 'M65.4',
    category: 'Энтезопатии и тендиниты',
    default_side: 'right',
    complaints: 'Резкая боль у основания первого пальца и по лучевому краю запястья при захвате предметов, открывании крышек банок, отведении пальца.',
    anamnesis: 'Возникло у молодой матери при постоянном ношении младенца на руках.',
    objective: 'Припухлость и резкая пальпаторная болезненность в проекции шиловидного отростка лучевой кости (I костно-фиброзный канал).',
    rom_preset: { flexion_active: 70, flexion_passive: 75, extension_deficit: 0 },
    recommendations: 'Ортез лучезапястный с жесткой фиксацией I пальца (Spica splint).',
    tests: [
      { code: 'finkelstein', expected: 'positive', mandatory: 1 },
      { code: 'phalen', expected: 'negative', mandatory: 1 },
      { code: 'tinel_wrist', expected: 'negative', mandatory: 1 }
    ],
    diagnostics: [
      { code: 'us_wrist_carpal', urgency: 'routine', is_primary: 1 },
      { code: 'xray_wrist_2v', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Блокада первого костно-фиброзного канала с дипроспаном под УЗИ', unit_price: 3500, quantity: 1, service_id: 1675 },
      { category: 'orthotics', title: 'Ортез лучезапястный с фиксацией I пальца (Spica splint)', unit_price: 2900, quantity: 1 }
    ]
  },
  {
    title: 'Ризартроз (артроз первого запястно-пястного сустава)',
    joint_name: 'wrist',
    default_mkb_code: 'M18.1',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'bilateral',
    complaints: 'Ноющая боль у основания большого пальца кисти при силовом щипковом хвате (поворот ключа в замке, открытие бутылок). Утренняя скованность.',
    anamnesis: 'Боли более 2 лет, профессиональная нагрузка на мелкую моторику.',
    objective: 'Деформация сустава («квадратная кисть»), крепитация при аксиальном давлении.',
    rom_preset: { flexion_active: 75, flexion_passive: 80, extension_deficit: 0 },
    recommendations: 'Индивидуальный термопластичный ортез на седловидный сустав кисти.',
    tests: [
      { code: 'grind_thumb', expected: 'positive', mandatory: 1 },
      { code: 'finkelstein', expected: 'negative', mandatory: 1 }
    ],
    diagnostics: [
      { code: 'xray_wrist_2v', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Внутрисуставное введение PRP мини-иглой в 1-й ПЗП сустав под УЗИ', unit_price: 4000, quantity: 1, service_id: 1675 },
      { category: 'orthotics', title: 'Термопластичный фиксатор седловидного сустава кисти', unit_price: 3200, quantity: 1 }
    ]
  },
  {
    title: 'Посттравматическая нестабильность дистального радиоульнарного сустава (DRUJ)',
    joint_name: 'wrist',
    default_mkb_code: 'M24.2',
    category: 'Травмы и повреждения капсульно-связочного аппарата',
    default_side: 'right',
    complaints: 'Боль по локтевому краю запястья при ротации кисти (выжимание тряпки, поворот ключа), ощущение щелчков и соскальзывания локтевой кости.',
    anamnesis: 'Перелом дистального метаэпифиза лучевой кости (Коллеса) 6 месяцев назад.',
    objective: 'Головка локтевой кости выстоит к тылу, болезненна при пальпации.',
    rom_preset: { flexion_active: 65, flexion_passive: 70, extension_deficit: 0 },
    recommendations: 'Полужесткий фиксатор запястья с ограничением ротации предплечья.',
    tests: [
      { code: 'piano_key', expected: 'positive', mandatory: 1 },
      { code: 'tinel_wrist', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'mri_wrist', urgency: 'routine', is_primary: 1 },
      { code: 'xray_wrist_2v', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Ортез лучезапястный жесткий с шиной', unit_price: 3100, quantity: 1 },
      { category: 'physio', title: 'Высокоинтенсивная магнитотерапия SIS лучезапястного сустава №5', unit_price: 7500, quantity: 1 }
    ]
  },

  // -------------------------------------------------------------------------
  // SPINE (4 templates)
  // -------------------------------------------------------------------------
  {
    title: 'Люмбалгия с радикулопатией L5–S1 (вертеброгенный ишиас)',
    joint_name: 'spine',
    default_mkb_code: 'M54.4',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'right',
    complaints: 'Стреляющая, пронизывающая боль в пояснице, иррадиирующая по ягодице, задне-наружной поверхности правого бедра и голени до пятки и V пальца стопы. Онемение стопы. Усиливается при кашле, чихании и наклоне вперед.',
    anamnesis: 'Обострение 4 дня назад после подъема тяжелого груза с поворотом туловища.',
    objective: 'Сглажен поясничный лордоз, анталгический сколиоз с наклоном туловища в здоровую сторону. Напряжение длинных мышц спины («симптом вожжей»). Снижение правого ахиллова рефлекса.',
    rom_preset: { flexion_active: 40, flexion_passive: 50, extension_deficit: -10 },
    recommendations: 'Полужесткий поясничный корсет при вертикализации. Исключение осевой нагрузки и сидения более 30 минут подряд.',
    tests: [
      { code: 'lasegue', expected: 'positive', mandatory: 1 },
      { code: 'wassermann', expected: 'negative', mandatory: 1 },
      { code: 'adams', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'mri_lumbosacral', urgency: 'cito', is_primary: 1 },
      { code: 'xray_spine_flex', urgency: 'routine', is_primary: 0 }
    ],
    prescriptions: [
      { category: 'manipulation', title: 'Паравертебральная лечебно-медикаментозная блокада корешковой зоны', unit_price: 3500, quantity: 1, service_id: 1675 },
      { category: 'physio', title: 'Высокоинтенсивная магнитотерапия SIS пояснично-крестцового отдела №6', unit_price: 9000, quantity: 1 },
      { category: 'orthotics', title: 'Полужесткий поясничный корсет с 4 металлическими ребрами жесткости', unit_price: 4200, quantity: 1 }
    ]
  },
  {
    title: 'Цервикалгия с миофасциальным болевым синдромом и цефалгией',
    joint_name: 'spine',
    default_mkb_code: 'M54.2',
    category: 'Миофасциальные синдромы',
    default_side: 'bilateral',
    complaints: 'Тяжесть и скованность в шейно-воротниковой зоне, распространяющиеся в затылочную область («каска неврастеника»). Усиливаются к концу рабочего дня за компьютером.',
    anamnesis: 'Хроническое статическое перенапряжение мышц шеи более 1 года.',
    objective: 'Пальпация трапециевидных мышц, мышцы, поднимающей лопатку, выявляет плотные болезненные триггерные тяжи.',
    rom_preset: { flexion_active: 50, flexion_passive: 60, extension_deficit: 0 },
    recommendations: 'Эргономика рабочего места, ортопедическая подушка с эффектом памяти. ЛФК.',
    tests: [
      { code: 'spurling', expected: 'negative', mandatory: 1 },
      { code: 'lasegue', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'xray_spine_flex', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'physio', title: 'Лечебный массаж шейно-воротниковой зоны и курс SIS №5', unit_price: 8500, quantity: 1 },
      { category: 'orthotics', title: 'Ортопедическая подушка под голову с эффектом памяти Memory Foam', unit_price: 3600, quantity: 1 }
    ]
  },
  {
    title: 'Торакалгия на фоне мышечно-тонического синдрома и остеохондроза',
    joint_name: 'spine',
    default_mkb_code: 'M54.6',
    category: 'Дегенеративно-дистрофические заболевания',
    default_side: 'bilateral',
    complaints: 'Межлопаточная боль, чувство «кола» в спине между лопатками, усиливающееся при глубоком вдохе и длительной сидячей позе.',
    anamnesis: 'Сидячий образ жизни, обострения 2–3 раза в год.',
    objective: 'Болезненность паравертебральных точек Th4–Th7. Экскурсия грудной клетки сохранена.',
    rom_preset: { flexion_active: 50, flexion_passive: 55, extension_deficit: 0 },
    recommendations: 'Межлопаточный миофасциальный релиз, курс ЛФК с акцентом на грудной отдел.',
    tests: [
      { code: 'adams', expected: 'negative', mandatory: 1 },
      { code: 'lasegue', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'xray_spine_flex', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'physio', title: 'Высокоинтенсивная магнитотерапия SIS грудного отдела позвоночника №5', unit_price: 7500, quantity: 1 }
    ]
  },
  {
    title: 'Идиопатический сколиоз позвоночника II степени',
    joint_name: 'spine',
    default_mkb_code: 'M41.2',
    category: 'Деформации позвоночника',
    default_side: 'bilateral',
    complaints: 'Асимметрия надплечий, выстояние угла лопатки, быстрая утомляемость спины при статической нагрузке. Боли незначительные.',
    anamnesis: 'Выявлен школьным врачом в пубертатном периоде ускоренного роста (12-14 лет).',
    objective: 'Асимметрия треугольников талии, правое надплечье выше левого. При наклоне вперед контурируется реберный горб.',
    rom_preset: { flexion_active: 60, flexion_passive: 65, extension_deficit: 0 },
    recommendations: 'Специализированная гимнастика по методу Шрот. Консультация ортезиста по корсету Шено.',
    tests: [
      { code: 'adams', expected: 'positive', mandatory: 1 },
      { code: 'lasegue', expected: 'negative', mandatory: 0 }
    ],
    diagnostics: [
      { code: 'xray_spine_total', urgency: 'primary', is_primary: 1 },
      { code: 'plantography', urgency: 'routine', is_primary: 1 }
    ],
    prescriptions: [
      { category: 'orthotics', title: 'Индивидуальные ортопедические стельки с коррекцией косого таза', unit_price: 4500, quantity: 1, service_id: 99 },
      { category: 'physio', title: 'Курс лечебной физкультуры при сколиозе №10', unit_price: 15000, quantity: 1 }
    ]
  }
];

/**
 * Executes full idempotent knowledge base seeder in SQLite
 * @param {sqlite3.Database} db 
 * @param {Function} [callback]
 */
function seedOrthoKnowledgeBase(db, callback) {
  db.serialize(() => {
    console.log('[OrthoSeeder] Starting Knowledge Base 2.0 population...');

    // 1. Upsert Ortho Tests Catalog
    const testStmt = db.prepare(`
      INSERT INTO ortho_test_catalog (
        code, name_ru, name_lat, joint_category, target_structure,
        methodology, positive_criteria, sensitivity_specificity,
        sensitivity_pct, specificity_pct, evidence_level,
        patient_position, doctor_hand_placement, applied_force_direction,
        false_positive_factors, clinical_interpretation, illustration_key,
        icon_type, is_active, sort_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(code) DO UPDATE SET
        name_ru=excluded.name_ru,
        name_lat=excluded.name_lat,
        joint_category=excluded.joint_category,
        target_structure=excluded.target_structure,
        methodology=excluded.methodology,
        positive_criteria=excluded.positive_criteria,
        sensitivity_specificity=excluded.sensitivity_specificity,
        sensitivity_pct=COALESCE(excluded.sensitivity_pct, ortho_test_catalog.sensitivity_pct),
        specificity_pct=COALESCE(excluded.specificity_pct, ortho_test_catalog.specificity_pct),
        evidence_level=COALESCE(excluded.evidence_level, ortho_test_catalog.evidence_level),
        patient_position=COALESCE(excluded.patient_position, ortho_test_catalog.patient_position),
        doctor_hand_placement=COALESCE(excluded.doctor_hand_placement, ortho_test_catalog.doctor_hand_placement),
        applied_force_direction=COALESCE(excluded.applied_force_direction, ortho_test_catalog.applied_force_direction),
        false_positive_factors=COALESCE(excluded.false_positive_factors, ortho_test_catalog.false_positive_factors),
        clinical_interpretation=COALESCE(excluded.clinical_interpretation, ortho_test_catalog.clinical_interpretation),
        illustration_key=COALESCE(excluded.illustration_key, ortho_test_catalog.illustration_key),
        icon_type=excluded.icon_type,
        sort_order=excluded.sort_order
    `);

    ORTHO_TESTS.forEach(t => {
      testStmt.run([
        t.code, t.name_ru, t.name_lat, t.joint_category, t.target_structure,
        t.methodology, t.positive_criteria, t.sensitivity_specificity,
        t.sensitivity_pct || null, t.specificity_pct || null, t.evidence_level || 'B',
        t.patient_position || null, t.doctor_hand_placement || null, t.applied_force_direction || null,
        t.false_positive_factors || null, t.clinical_interpretation || null, t.illustration_key || 'default_joint',
        t.icon_type, t.sort_order
      ]);
    });
    testStmt.finalize();
    console.log(`[OrthoSeeder] Synced ${ORTHO_TESTS.length} orthopedic tests.`);

    // 2. Upsert Diagnostic Methods Catalog
    const diagStmt = db.prepare(`
      INSERT INTO diagnostic_methods_catalog (code, name, modality, target_joint, servdict_id, clinical_indications, protocol_phrase, priority_level, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(code) DO UPDATE SET
        name=excluded.name,
        modality=excluded.modality,
        target_joint=excluded.target_joint,
        servdict_id=excluded.servdict_id,
        clinical_indications=excluded.clinical_indications,
        protocol_phrase=excluded.protocol_phrase,
        priority_level=excluded.priority_level,
        sort_order=excluded.sort_order
    `);

    DIAGNOSTIC_METHODS.forEach(d => {
      diagStmt.run([
        d.code, d.name, d.modality, d.target_joint, d.servdict_id,
        d.clinical_indications, d.protocol_phrase, d.priority_level, d.sort_order
      ]);
    });
    diagStmt.finalize();
    console.log(`[OrthoSeeder] Synced ${DIAGNOSTIC_METHODS.length} diagnostic methods.`);

    // 3. Upsert 28 Gold-Standard Templates & Relations
    let processedTemplates = 0;

    GOLD_TEMPLATES.forEach((tpl, idx) => {
      const templateJson = JSON.stringify({
        complaints: tpl.complaints,
        anamnesis: tpl.anamnesis,
        objective: tpl.objective,
        vas_score: 5,
        joint_area: `${tpl.joint_name}_r`,
        side: tpl.default_side,
        axis: 'norm',
        effusion: 0,
        rom: tpl.rom_preset,
        tests: tpl.tests.reduce((acc, cur) => { acc[cur.code] = cur.expected; return acc; }, {}),
        diagnosis: {
          mkb_code: tpl.default_mkb_code,
          mkb_name: tpl.title,
          side: tpl.default_side,
          stage: tpl.category
        },
        diagnostics_plan: tpl.diagnostics.map(d => d.code),
        prescriptions: tpl.prescriptions
      });

      // Upsert into ortho_templates
      db.get("SELECT id FROM ortho_templates WHERE title = ?", [tpl.title], (err, row) => {
        if (!err && row) {
          // Update existing
          const tId = row.id;
          db.run(`
            UPDATE ortho_templates SET
              joint_name = ?,
              default_mkb_code = ?,
              template_json = ?,
              category = ?,
              default_side = ?,
              complaints_template = ?,
              anamnesis_template = ?,
              objective_template = ?,
              rom_norm_preset = ?,
              recommendations_template = ?,
              is_active = 1,
              sort_order = ?
            WHERE id = ?
          `, [
            tpl.joint_name, tpl.default_mkb_code, templateJson, tpl.category,
            tpl.default_side, tpl.complaints, tpl.anamnesis, tpl.objective,
            JSON.stringify(tpl.rom_preset), tpl.recommendations, idx * 10, tId
          ], () => {
            syncTemplateLinks(db, tId, tpl);
          });
        } else {
          // Insert new
          db.run(`
            INSERT INTO ortho_templates (
              title, joint_name, default_mkb_code, template_json, category,
              default_side, complaints_template, anamnesis_template, objective_template,
              rom_norm_preset, recommendations_template, is_active, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
          `, [
            tpl.title, tpl.joint_name, tpl.default_mkb_code, templateJson, tpl.category,
            tpl.default_side, tpl.complaints, tpl.anamnesis, tpl.objective,
            JSON.stringify(tpl.rom_preset), tpl.recommendations, idx * 10
          ], function () {
            const newId = this.lastID;
            syncTemplateLinks(db, newId, tpl);
          });
        }
      });
    });

    console.log(`[OrthoSeeder] Dispatched synchronization of 28 gold-standard templates.`);
    if (callback) callback();
  });
}

function syncTemplateLinks(db, templateId, tpl) {
  // Clear old links
  db.run("DELETE FROM ortho_template_tests WHERE template_id = ?", [templateId], () => {
    const testLinkStmt = db.prepare(`
      INSERT INTO ortho_template_tests (template_id, test_code, expected_result, is_mandatory, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    tpl.tests.forEach((t, i) => {
      testLinkStmt.run([templateId, t.code, t.expected, t.mandatory, i * 10]);
    });
    testLinkStmt.finalize();
  });

  db.run("DELETE FROM ortho_template_diagnostics WHERE template_id = ?", [templateId], () => {
    const diagLinkStmt = db.prepare(`
      INSERT INTO ortho_template_diagnostics (template_id, diagnostic_code, urgency, default_side, is_primary, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    tpl.diagnostics.forEach((d, i) => {
      diagLinkStmt.run([templateId, d.code, d.urgency, tpl.default_side, d.is_primary, i * 10]);
    });
    diagLinkStmt.finalize();
  });
}

module.exports = {
  seedOrthoKnowledgeBase,
  ORTHO_TESTS,
  DIAGNOSTIC_METHODS,
  GOLD_TEMPLATES
};
