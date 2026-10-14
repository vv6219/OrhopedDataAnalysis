const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../DB/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

/**
 * 37 New Evidence-Based Orthopedic Tests (expanding catalog from 39 to 76 tests)
 */
const NEW_ORTHO_TESTS = [
  // ANKLE & FOOT (6 tests)
  {
    code: 'kleiger',
    name_ru: 'Тест Клейгера (наружной ротации)',
    name_lat: "Kleiger's external rotation test",
    joint_category: 'ankle',
    target_structure: 'Дистальный межберцовый синдесмоз и дельтовидная связка',
    methodology: 'Пациент сидит со свободно свисающей голенью под 90°. Врач одной рукой фиксирует дистальный отдел голени, а другой берет стопу за пятку и подошву и выполняет пассивную наружную ротацию стопы при нейтральном положении (90° тыльного сгибания).',
    positive_criteria: 'Резкая локальная боль по передне-латеральной поверхности голеностопного сустава над межберцовым синдесмозом.',
    sensitivity_specificity: 'Se: 71%, Sp: 85%',
    icon_type: 'joint_stress',
    sort_order: 40
  },
  {
    code: 'squeeze_ankle',
    name_ru: 'Тест сжатия голени (Squeeze test)',
    name_lat: 'Squeeze test of the leg',
    joint_category: 'ankle',
    target_structure: 'Высокое повреждение синдесмоза голени',
    methodology: 'Пациент лежит на спине. Врач производит компрессию обеими ладонями большеберцовой и малоберцовой костей в средней трети голени, сдавливая их по направлению друг к другу.',
    positive_criteria: 'Иррадиация острой боли дистально в область межберцового синдесмоза.',
    sensitivity_specificity: 'Se: 45%, Sp: 92%',
    icon_type: 'joint_stress',
    sort_order: 41
  },
  {
    code: 'mulder_click',
    name_ru: 'Тест и щелчок Малдера',
    name_lat: "Mulder's click sign",
    joint_category: 'ankle',
    target_structure: 'Неврома Мортона (III–IV плюсневый промежуток)',
    methodology: 'Врач одной рукой сдавливает головки плюсневых костей с боков в поперечном направлении, а большим пальцем другой руки надавливает на подошвенную поверхность межплюсневого промежутка снизу вверх.',
    positive_criteria: 'Ощущение щелчка (выскальзывания невромы) с резкой жгучей болью и иррадиацией в смежные пальцы.',
    sensitivity_specificity: 'Se: 88%, Sp: 95%',
    icon_type: 'nerve_percussion',
    sort_order: 42
  },
  {
    code: 'silfverskiold',
    name_ru: 'Проба Сильвершельда',
    name_lat: "Silfverskiöld test",
    joint_category: 'ankle',
    target_structure: 'Изолированная контрактура икроножной мышцы vs камбаловидной мышцы',
    methodology: 'Оценка тыльного сгибания стопы в положении разогнутого коленного сустава (натяжение m. gastrocnemius), а затем повторно при согнутом колене под 90° (расслабление икроножной мышцы).',
    positive_criteria: 'Дефицит тыльного сгибания стопы при разогнутом колене, который полностью устраняется при сгибании колена (подтверждает изолированное укорочение икроножной мышцы).',
    sensitivity_specificity: 'Se: 90%, Sp: 88%',
    icon_type: 'rom_assessment',
    sort_order: 43
  },
  {
    code: 'jack_test',
    name_ru: 'Тест Джека (Hubscher maneuver)',
    name_lat: "Jack's test (Great toe extension)",
    joint_category: 'ankle',
    target_structure: 'Мобильность продольного свода стопы и эффект лебёдки',
    methodology: 'Пациент стоит на твердой поверхности с полной нагрузкой весом тела. Врач пассивно максимально разгибает I палец стопы вверх за дистальную фалангу.',
    positive_criteria: 'Углубление продольного свода стопы и наружная ротация голени подтверждают мобильное эластичное плоскостопие; отсутствие подъема свода указывает на ригидную деформацию/коалицию.',
    sensitivity_specificity: 'Se: 85%, Sp: 90%',
    icon_type: 'joint_stress',
    sort_order: 44
  },
  {
    code: 'coleman_block',
    name_ru: 'Проба Коулмана с деревянным блоком',
    name_lat: 'Coleman block test',
    joint_category: 'ankle',
    target_structure: 'Эластичность варусной деформации заднего отдела стопы',
    methodology: 'Пациент встает пяткой и латеральным краем стопы на деревянный блок толщиной 2.5–4 см, так что головки I–II плюсневых костей свободно свисают над полом.',
    positive_criteria: 'Коррекция варуса пятки в нейтральное положение указывает на вторичный характер деформации вследствие пронации переднего отдела; сохранение варуса свидетельствует о фиксированном варусе заднего отдела.',
    sensitivity_specificity: 'Se: 82%, Sp: 89%',
    icon_type: 'rom_assessment',
    sort_order: 45
  },

  // KNEE (7 tests)
  {
    code: 'thessaly_20',
    name_ru: 'Тест Тессали под углом 20°',
    name_lat: 'Thessaly test at 20° flexion',
    joint_category: 'knee',
    target_structure: 'Мениски коленного сустава (динамическая ротация под нагрузкой)',
    methodology: 'Пациент стоит на тестируемой ноге, слегка придерживаясь за руки врача. Колено сгибается до угла 20°. Пациент выполняет 3 цикла внутренней и наружной ротации туловища и бедра на опорной ноге.',
    positive_criteria: 'Локальная боль по медиальной или латеральной суставной щели, механический щелчок или чувство блокады.',
    sensitivity_specificity: 'Se: 89%, Sp: 92%',
    icon_type: 'joint_stress',
    sort_order: 25
  },
  {
    code: 'dial_test_30_90',
    name_ru: 'Дайл-тест (ротация голени под 30° и 90°)',
    name_lat: 'Dial test of tibial external rotation',
    joint_category: 'knee',
    target_structure: 'Заднелатеральный угол (PLC) и задняя крестообразная связка (ЗКС)',
    methodology: 'Пациент лежит на животе. Врач стабилизирует бедра и пассивно ротирует обе стопы и голени кнаружи сначала при сгибании коленей 30°, затем при 90°. Сравнивается угол наружной ротации.',
    positive_criteria: 'Асимметрия наружной ротации более 10–15°: при 30° — изолированное повреждение PLC; при 30° и 90° — комбинированное повреждение PLC и ЗКС.',
    sensitivity_specificity: 'Se: 86%, Sp: 91%',
    icon_type: 'rom_assessment',
    sort_order: 26
  },
  {
    code: 'godfrey_sag',
    name_ru: 'Проба провисания голени Годфри (Posterior sag)',
    name_lat: "Godfrey's 90-90 posterior sag test",
    joint_category: 'knee',
    target_structure: 'Задняя крестообразная связка (ЗКС)',
    methodology: 'Пациент лежит на спине. Врач поднимает обе ноги за стопы, сгибая тазобедренные и коленные суставы строго под углом 90°. Оценивается контур бугристостей большеберцовых костей сбоку.',
    positive_criteria: 'Западение проксимального отдела голени кзади под действием гравитации на стороне повреждения ЗКС.',
    sensitivity_specificity: 'Se: 94%, Sp: 99%',
    icon_type: 'joint_stress',
    sort_order: 27
  },
  {
    code: 'slocum',
    name_ru: 'Тест Слокума (ротационная нестабильность)',
    name_lat: "Slocum's rotatory instability test",
    joint_category: 'knee',
    target_structure: 'Переднемедиальная и переднелатеральная ротационная нестабильность (AMRI / ALRI)',
    methodology: 'Выдвижной ящик колена под 90° при фиксации стопы в положении внутренней ротации на 30° (ALRI) и наружной ротации на 15° (AMRI).',
    positive_criteria: 'Патологическая избыточная трансляция медиального или латерального мыщелка большеберцовой кости.',
    sensitivity_specificity: 'Se: 78%, Sp: 84%',
    icon_type: 'joint_stress',
    sort_order: 28
  },
  {
    code: 'wilson_knee',
    name_ru: 'Тест Вильсона',
    name_lat: "Wilson's test",
    joint_category: 'knee',
    target_structure: 'Рассекающий остеохондрит медиального мыщелка бедренной кости (болезнь Кенига)',
    methodology: 'Пациент сидит. Врач разгибает голень из угла 90° с одновременной активной внутренней ротацией стопы до появления боли (около 30° сгибания), затем поворачивает стопу кнаружи.',
    positive_criteria: 'Появление боли в медиальном отделе колена при внутренней ротации и её исчезновение при наружной ротации.',
    sensitivity_specificity: 'Se: 75%, Sp: 88%',
    icon_type: 'joint_stress',
    sort_order: 29
  },
  {
    code: 'noble_itb',
    name_ru: 'Тест компрессии Нобеля',
    name_lat: "Noble's compression test",
    joint_category: 'knee',
    target_structure: 'Синдром трения илиотибиального тракта (ITB friction syndrome)',
    methodology: 'Пациент на спине. Колено согнуто под 90°. Врач прижимает большой палец к латеральному надмыщелку бедра и плавно разгибает колено пациента.',
    positive_criteria: 'Острая резкая боль под пальцем врача в диапазоне 30–40° сгибания в момент трения тракта о надмыщелок.',
    sensitivity_specificity: 'Se: 84%, Sp: 82%',
    icon_type: 'joint_stress',
    sort_order: 30
  },
  {
    code: 'mcconnell',
    name_ru: 'Тест надколенника Макконнелла',
    name_lat: 'McConnell patellofemoral test',
    joint_category: 'knee',
    target_structure: 'Хондромаляция надколенника и пателлофеморальный болевой синдром',
    methodology: 'Пациент сидит со свисающими ногами. Врач тестирует изометрическое разгибание голени против сопротивления под углами 0°, 30°, 60°, 90°. При возникновении боли врач смещает надколенник медиально и повторяет пробу.',
    positive_criteria: 'Уменьшение или исчезновение ретропателлярной боли при медиализации надколенника.',
    sensitivity_specificity: 'Se: 82%, Sp: 86%',
    icon_type: 'joint_stress',
    sort_order: 31
  },

  // SHOULDER (7 tests)
  {
    code: 'obrien_slap',
    name_ru: "Тест активной компрессии О'Брайена",
    name_lat: "O'Brien's active compression test",
    joint_category: 'shoulder',
    target_structure: 'Повреждение верхней суставной губы гленоида (SLAP-синдром)',
    methodology: 'Рука согнута вперед на 90°, приведена на 10–15° кнутри и максимально ротирована внутрь (большой палец смотрит в пол). Пациент сопротивляется давлению врача вниз. Затем проба повторяется при полной супинации (ладонь вверх).',
    positive_criteria: 'Боль или глубокий щелчок внутри плеча в положении пронации, которые значительно уменьшаются или исчезают при супинации.',
    sensitivity_specificity: 'Se: 88%, Sp: 91%',
    icon_type: 'joint_stress',
    sort_order: 36
  },
  {
    code: 'yergason',
    name_ru: 'Тест Йергасона',
    name_lat: "Yergason's test",
    joint_category: 'shoulder',
    target_structure: 'Нестабильность и теносиновит сухожилия длинной головки бицепса',
    methodology: 'Локоть согнут под 90°, предплечье в пронации. Врач одной рукой пальпирует межбугорковую борозду, а другой оказывает сопротивление активной супинации предплечья и сгибанию в локте.',
    positive_criteria: 'Локальная боль в межбугорковой борозде или выскальзывание сухожилия бицепса из борозды при разрыве поперечной связки.',
    sensitivity_specificity: 'Se: 43%, Sp: 89%',
    icon_type: 'joint_stress',
    sort_order: 37
  },
  {
    code: 'hornblower',
    name_ru: 'Симптом горниста (Хорнбловера)',
    name_lat: "Hornblower's sign (Patte test)",
    joint_category: 'shoulder',
    target_structure: 'Массивный разрыв подостной и малой круглой мышц (m. infraspinatus / teres minor)',
    methodology: 'Рука отведена на 90° в плоскости лопатки, локоть согнут под 90°. Врач просит удерживать наружную ротацию против силы тяжести.',
    positive_criteria: 'Неспособность удержать наружную ротацию — предплечье падает вперед, либо пациент вынужден поднимать локоть выше кисти (поза горниста).',
    sensitivity_specificity: 'Se: 85%, Sp: 93%',
    icon_type: 'rom_assessment',
    sort_order: 38
  },
  {
    code: 'bear_hug',
    name_ru: 'Тест «объятия медведя» (Bear-hug test)',
    name_lat: 'Bear-hug test',
    joint_category: 'shoulder',
    target_structure: 'Верхняя треть сухожилия подлопаточной мышцы (m. subscapularis)',
    methodology: 'Пациент кладет ладонь больной руки на противоположное плечо с пальцами, вытянутыми прямо, локоть приподнят. Врач пытается оторвать ладонь пациента от плеча перпендикулярным усилием вверх.',
    positive_criteria: 'Неспособность удержать ладонь прижатой к плечу или выраженная слабость и боль.',
    sensitivity_specificity: 'Se: 89%, Sp: 96%',
    icon_type: 'joint_stress',
    sort_order: 39
  },
  {
    code: 'belly_press',
    name_ru: 'Тест прижатия к животу (Наполеона)',
    name_lat: 'Belly-press test (Napoleon sign)',
    joint_category: 'shoulder',
    target_structure: 'Сухожилие подлопаточной мышцы (m. subscapularis)',
    methodology: 'Пациент прижимает ладонь к животу, удерживая локоть кпереди в плоскости туловища.',
    positive_criteria: 'При слабости подлопаточной мышцы пациент отводит локоть кзади и разгибает запястье, чтобы компенсировать дефицит внутренней ротации.',
    sensitivity_specificity: 'Se: 80%, Sp: 92%',
    icon_type: 'rom_assessment',
    sort_order: 40
  },
  {
    code: 'sulcus_sign',
    name_ru: 'Симптом борозды (Sulcus sign)',
    name_lat: 'Sulcus sign of shoulder',
    joint_category: 'shoulder',
    target_structure: 'Нижняя и разнонаправленная нестабильность плечевого сустава (MDI)',
    methodology: 'Пациент сидит, рука расслаблена вдоль туловища. Врач захватывает руку за локоть и производит плавную осевую тракцию вниз.',
    positive_criteria: 'Появление видимого западения (борозды) глубже 1–2 см между акромионом и головкой плечевой кости.',
    sensitivity_specificity: 'Se: 72%, Sp: 85%',
    icon_type: 'joint_stress',
    sort_order: 41
  },
  {
    code: 'paxinos',
    name_ru: 'Тест Паксиноса',
    name_lat: 'Paxinos test',
    joint_category: 'shoulder',
    target_structure: 'Акромиально-ключичное сочленение (АКС)',
    methodology: 'Врач кладет большой палец на заднелатеральный угол акромиона, а указательный и средний пальцы — на дистальную треть ключицы спереди. Сжимает пальцы навстречу друг другу.',
    positive_criteria: 'Локальная боль непосредственно в проекции акромиально-ключичного сочленения.',
    sensitivity_specificity: 'Se: 79%, Sp: 86%',
    icon_type: 'joint_stress',
    sort_order: 42
  },

  // HIP & PELVIS (6 tests)
  {
    code: 'gaenslen',
    name_ru: 'Тест Генслена (Gaenslen)',
    name_lat: "Gaenslen's test",
    joint_category: 'hip',
    target_structure: 'Крестцово-подвздошное сочленение (сакроилеит)',
    methodology: 'Пациент лежит на краю кушетки. Одна нога максимально согнута в ТБС и прижата руками к груди. Тестируемая нога свободно свисает с края кушетки в положение переразгибания. Врач мягко надавливает на свисающее бедро вниз.',
    positive_criteria: 'Боль глубоко в ягодичной области в проекции крестцово-подвздошного сочленения на стороне свисающей ноги.',
    sensitivity_specificity: 'Se: 71%, Sp: 83%',
    icon_type: 'joint_stress',
    sort_order: 55
  },
  {
    code: 'thigh_thrust',
    name_ru: 'Тест тяги бедра назад (Thigh thrust)',
    name_lat: 'Thigh thrust test (Posterior shear)',
    joint_category: 'hip',
    target_structure: 'Крестцово-подвздошное сочленение (КПС)',
    methodology: 'Пациент на спине. Бедро согнуто под 90°. Врач подкладывает одну ладонь под крестец со стороны поражения, а другой рукой надавливает вдоль оси бедренной кости вниз, сдвигая подвздошную кость относительно крестца.',
    positive_criteria: 'Воспроизведение привычной боли пациента в области крестца / КПС.',
    sensitivity_specificity: 'Se: 88%, Sp: 92%',
    icon_type: 'joint_stress',
    sort_order: 56
  },
  {
    code: 'fair_piriformis',
    name_ru: 'Тест FAIR (сгибание, приведение, ротация)',
    name_lat: 'FAIR test (Flexion, Adduction, Internal Rotation)',
    joint_category: 'hip',
    target_structure: 'Синдром грушевидной мышцы (компрессия седалищного нерва)',
    methodology: 'Пациент на здоровом боку. Тестируемая нога согнута в ТБС под 60° и в колене под 90°. Врач фиксирует таз и приводит бедро к кушетке с внутренней ротацией, натягивая грушевидную мышцу.',
    positive_criteria: 'Локальная боль в ягодице с иррадиацией парестезий или боли по задней поверхности бедра по ходу n. ischiadicus.',
    sensitivity_specificity: 'Se: 88%, Sp: 83%',
    icon_type: 'nerve_percussion',
    sort_order: 57
  },
  {
    code: 'craig_anteversion',
    name_ru: 'Тест Крейга на антеверсию шейки бедра',
    name_lat: "Craig's test of femoral anteversion",
    joint_category: 'hip',
    target_structure: 'Угол антеверсии шейки бедренной кости',
    methodology: 'Пациент на животе, колено согнуто под 90°. Врач пальпирует большой вертел снаружи и плавно вращает голень внутрь и наружу до точки максимального выступания вертела. Угол голени относительно вертикали равен углу антеверсии.',
    positive_criteria: 'Угол более 15–20° указывает на патологическую избыточную антеверсию шейки бедра.',
    sensitivity_specificity: 'Se: 80%, Sp: 87%',
    icon_type: 'rom_assessment',
    sort_order: 58
  },
  {
    code: 'ely_quad',
    name_ru: 'Проба Эли (Ely test)',
    name_lat: "Ely's test of rectus femoris tightness",
    joint_category: 'hip',
    target_structure: 'Контрактура и укорочение прямой мышцы бедра',
    methodology: 'Пациент лежит на животе. Врач пассивно сгибает колено пациента, приближая пятку к ягодице.',
    positive_criteria: 'Самопроизвольный подъем таза от кушетки при сгибании колена свидетельствует о выраженном укорочении m. rectus femoris.',
    sensitivity_specificity: 'Se: 76%, Sp: 85%',
    icon_type: 'rom_assessment',
    sort_order: 59
  },
  {
    code: 'stinchfield',
    name_ru: 'Тест Стинчфилда с сопротивлением',
    name_lat: "Stinchfield's resisted hip flexion test",
    joint_category: 'hip',
    target_structure: 'Внутрисуставная патология ТБС / стресс-перелом шейки бедра',
    methodology: 'Пациент на спине. Нога выпрямлена и приподнята от кушетки на 30°. Пациент удерживает ногу против вертикального сопротивления врача вниз.',
    positive_criteria: 'Глубокая боль в паховой области или по передней поверхности бедра.',
    sensitivity_specificity: 'Se: 82%, Sp: 88%',
    icon_type: 'joint_stress',
    sort_order: 60
  },

  // ELBOW (3 tests)
  {
    code: 'hook_biceps',
    name_ru: 'Крючковый тест дистального бицепса (Hook test)',
    name_lat: 'Hook test of distal biceps tendon',
    joint_category: 'elbow',
    target_structure: 'Полный отрыв дистального сухожилия двуглавой мышцы плеча',
    methodology: 'Пациент активно сгибает локоть под 90° и полностью супинирует предплечье. Врач указательным пальцем пытается «зацепить» сухожилие бицепса с латеральной стороны в локтевой ямке в виде шнура.',
    positive_criteria: 'Отсутствие шнуровидного сухожилия под пальцем (палец проваливается в ямку) подтверждает полный отрыв дистального бицепса.',
    sensitivity_specificity: 'Se: 100%, Sp: 100%',
    icon_type: 'joint_stress',
    sort_order: 16
  },
  {
    code: 'pronator_teres_test',
    name_ru: 'Тест круглого пронатора',
    name_lat: 'Pronator teres syndrome test',
    joint_category: 'elbow',
    target_structure: 'Компрессия срединного нерва круглым пронатором',
    methodology: 'Пациент сидит, локоть согнут под 90°. Врач удерживает кисть пациента в рукопожатии и оказывает сопротивление форсированной пронации предплечья при одновременном постепенном разгибании локтя.',
    positive_criteria: 'Появление или усиление боли и покалывания по ходу срединного нерва в ладонь и I–III пальцы.',
    sensitivity_specificity: 'Se: 74%, Sp: 88%',
    icon_type: 'nerve_percussion',
    sort_order: 17
  },
  {
    code: 'moving_valgus_elbow',
    name_ru: 'Динамический вальгус-тест локтя (Moving valgus test)',
    name_lat: 'Moving valgus stress test of elbow',
    joint_category: 'elbow',
    target_structure: 'Медиальная коллатеральная связка локтя (UCL)',
    methodology: 'Плечо отведено на 90° и максимально ротировано наружу. Врач прикладывает постоянную вальгусную нагрузку на локоть и быстро разгибает его из 120° до 30°.',
    positive_criteria: 'Резкая боль по медиальной линии сустава в дуге между 120° и 70° сгибания.',
    sensitivity_specificity: 'Se: 100%, Sp: 75%',
    icon_type: 'joint_stress',
    sort_order: 18
  },

  // WRIST & HAND (4 tests)
  {
    code: 'watson_scaphoid',
    name_ru: 'Тест сдвига ладьевидной кости Уотсона',
    name_lat: "Watson's scaphoid shift test",
    joint_category: 'wrist',
    target_structure: 'Ладьевидно-полулунная диссоциация (повреждение SL-связки)',
    methodology: 'Врач фиксирует бугорок ладьевидной кости большим пальцем снизу. Другой рукой выполняет пассивное движение кисти от ульнарного отведения к радиальному с легким сгибанием.',
    positive_criteria: 'Болезненный щелчок или выскальзывание проксимального полюса ладьевидной кости с последующим вправлением при снятии пальца.',
    sensitivity_specificity: 'Se: 69%, Sp: 82%',
    icon_type: 'joint_stress',
    sort_order: 65
  },
  {
    code: 'fovea_sign',
    name_ru: 'Симптом Фовеа (ульнарный стресс-тест)',
    name_lat: 'Fovea sign / TFCC stress test',
    joint_category: 'wrist',
    target_structure: 'Триангулярный волокнисто-хрящевой комплекс (TFCC)',
    methodology: 'Врач прицельно пальпирует углубление (fovea) между шиловидным отростком локтевой кости, сухожилием FCU и гороховидной костью при нейтральном положении кисти.',
    positive_criteria: 'Резкая локальная болезненность в фовеолярной ямке по сравнению со здоровой кистью.',
    sensitivity_specificity: 'Se: 95%, Sp: 87%',
    icon_type: 'joint_stress',
    sort_order: 66
  },
  {
    code: 'froment_sign',
    name_ru: 'Симптом Фромана',
    name_lat: "Froment's sign of ulnar nerve",
    joint_category: 'wrist',
    target_structure: 'Нейропатия локтевого нерва (парез m. adductor pollicis)',
    methodology: 'Пациент удерживает лист плотной бумаги между большим и указательным пальцами обеих кистей. Врач пытается выдернуть лист.',
    positive_criteria: 'Компенсаторное сгибание дистальной фаланги I пальца (гиперфункция длинного сгибателя, иннервируемого срединным нервом) из-за слабости приводящей мышцы.',
    sensitivity_specificity: 'Se: 88%, Sp: 94%',
    icon_type: 'nerve_percussion',
    sort_order: 67
  },
  {
    code: 'eichhoff',
    name_ru: 'Тест Айххоффа',
    name_lat: "Eichhoff's test",
    joint_category: 'wrist',
    target_structure: 'Болезнь де Кервена (1-й компартмент разгибателей кисти)',
    methodology: 'Пациент сжимает большой палец в кулак, после чего врач или пациент пассивно отклоняет кисть в сторону локтевой кости.',
    positive_criteria: 'Острая резкая боль в области шиловидного отростка лучевой кости.',
    sensitivity_specificity: 'Se: 89%, Sp: 84%',
    icon_type: 'joint_stress',
    sort_order: 68
  },

  // SPINE & SYSTEMIC (4 tests)
  {
    code: 'slump_test',
    name_ru: 'Сламп-тест сгибания (нейродинамический тест)',
    name_lat: 'Slump test of neural dynamics',
    joint_category: 'spine',
    target_structure: 'Натяжение корешков пояснично-крестцового сплетения и твердой мозговой оболочки',
    methodology: 'Пациент сидит, округлив грудной и поясничный отделы спины («сутулая поза»). Голова сгибается к грудине. Врач разгибает голень пациента и выполняет тыльное сгибание стопы.',
    positive_criteria: 'Воспроизведение корешковой боли по ходу седалищного нерва, которая уменьшается при разгибании шеи.',
    sensitivity_specificity: 'Se: 84%, Sp: 83%',
    icon_type: 'nerve_percussion',
    sort_order: 48
  },
  {
    code: 'kemp_quadrant',
    name_ru: 'Квадрант-тест Кемпа',
    name_lat: "Kemp's (Quadrant) test of lumbar spine",
    joint_category: 'spine',
    target_structure: 'Фасеточный синдром поясничного отдела и фораминальный стеноз',
    methodology: 'Пациент стоит. Врач производит пассивное разгибание позвоночника с одновременным боковым наклоном и ротацией в сторону поражения, сжимая задние суставные отростки.',
    positive_criteria: 'Локальная боль в пояснице с иррадиацией в ягодицу или ногу на стороне наклона.',
    sensitivity_specificity: 'Se: 70%, Sp: 67%',
    icon_type: 'joint_stress',
    sort_order: 49
  },
  {
    code: 'schober',
    name_ru: 'Модифицированный тест Шобера',
    name_lat: "Modified Schober's test",
    joint_category: 'spine',
    target_structure: 'Подвижность поясничного отдела (анкилозирующий спондилоартрит)',
    methodology: 'Врач отмечает линию на уровне остистого отростка S1 (на уровне ямочек Венеры) и вторую точку на 10 см выше. Пациент максимально наклоняется вперед с прямыми коленями. Расстояние измеряется повторно.',
    positive_criteria: 'Увеличение расстояния менее чем на 4–5 см (в норме >= 15 см) указывает на патологическое ограничение сгибания при болезни Бехтерева.',
    sensitivity_specificity: 'Se: 85%, Sp: 90%',
    icon_type: 'rom_assessment',
    sort_order: 50
  },
  {
    code: 'beighton_score',
    name_ru: 'Шкала гипермобильности Бейтона (9 баллов)',
    name_lat: 'Beighton hypermobility score',
    joint_category: 'general',
    target_structure: 'Генерализованная дисплазия соединительной ткани и гипермобильность',
    methodology: 'Оценка 5 критериев (макс 9 баллов): пассивное переразгибание V пальца кисти > 90° (2 балла), прижатие I пальца к предплечью (2 балла), переразгибание локтей > 10° (2 балла), переразгибание коленей > 10° (2 балла), наклон вперед с ладонями на полу (1 балл).',
    positive_criteria: 'Суммарный балл 5 из 9 и выше свидетельствует о генерализованной гипермобильности суставов.',
    sensitivity_specificity: 'Se: 88%, Sp: 89%',
    icon_type: 'rom_assessment',
    sort_order: 95
  }
];

/**
 * 22 New Diagnostic and Laboratory Methods (expanding catalog from 26 to 48 methods)
 */
const NEW_DIAGNOSTIC_METHODS = [
  {
    code: 'xray_long_leg_axis',
    name: 'Телерентгенография нижних конечностей стоя с механической осью',
    modality: 'xray',
    target_joint: 'knee',
    servdict_id: 114, // 1 800 руб.
    clinical_indications: 'Расчет механической оси конечности (ось Микулича), планирование корригирующей остеотомии бедра/голени при варусном/вальгусном гонартрозе.',
    protocol_phrase: 'Панорамная цифровая телерентгенография обеих нижних конечностей стоя с захватом таза и стоп с расчетом механической оси (HKA angle).',
    priority_level: 'primary',
    sort_order: 25
  },
  {
    code: 'xray_patella_axial',
    name: 'Аксиальная рентгенография надколенников по Мерчанту',
    modality: 'xray',
    target_joint: 'knee',
    servdict_id: 114,
    clinical_indications: 'Верификация латеральной гиперпрессии и подвывиха надколенника, расчет угла конгруэнтности и угла борозды (sulcus angle).',
    protocol_phrase: 'Аксиальная рентгенография надколенников в укладке по Мерчанту под углом сгибания 30° и 45°.',
    priority_level: 'primary',
    sort_order: 26
  },
  {
    code: 'xray_pelvis_dunn',
    name: 'Рентгенография тазобедренных суставов в проекции Данна (Dunn 45°)',
    modality: 'xray',
    target_joint: 'hip',
    servdict_id: 114,
    clinical_indications: 'Оценка передне-верхнего перехода головки в шейку бедренной кости, измерение альфа-угла при феморо-ацетабулярном Cam-импинджменте.',
    protocol_phrase: 'Рентгенография тазобедренного сустава в проекции Данна (сгибание 45°, отведение 20°).',
    priority_level: 'primary',
    sort_order: 35
  },
  {
    code: 'xray_cervical_flex',
    name: 'Функциональная рентгенография ШОП со сгибанием и разгибанием',
    modality: 'xray',
    target_joint: 'spine',
    servdict_id: 114,
    clinical_indications: 'Выявление патологической подвижности и псевдоспондилолистеза позвонков шейного отдела.',
    protocol_phrase: 'Рентгенография шейного отдела позвоночника в боковой проекции в нейтральном положении, максимальном сгибании и разгибании.',
    priority_level: 'secondary',
    sort_order: 63
  },
  {
    code: 'xray_scapula_y',
    name: 'Рентгенография лопатки в Y-проекции (Outlet view)',
    modality: 'xray',
    target_joint: 'shoulder',
    servdict_id: 81, // 1 500 руб.
    clinical_indications: 'Определение анатомического типа акромиона по Биглиани (I–III тип), выявление остеофитов нижней поверхности акромиона.',
    protocol_phrase: 'Рентгенография лопатки в Y-проекции (проекция выхода надостной мышцы supraspinatus outlet view).',
    priority_level: 'primary',
    sort_order: 33
  },
  {
    code: 'xray_clavicle',
    name: 'Прицельная рентгенография ключицы',
    modality: 'xray',
    target_joint: 'shoulder',
    servdict_id: 77, // 1 500 руб.
    clinical_indications: 'Диагностика переломов тела и акромиального конца ключицы, оценка консолидации костной мозоли.',
    protocol_phrase: 'Прицельная цифровая рентгенография ключицы в прямой переднезадней проекции.',
    priority_level: 'primary',
    sort_order: 34
  },
  {
    code: 'xray_ac_joint',
    name: 'Рентгенография акромиально-ключичных сочленений с нагрузкой',
    modality: 'xray',
    target_joint: 'shoulder',
    servdict_id: 78, // 1 500 руб.
    clinical_indications: 'Оценка степени вывиха акромиального конца ключицы по классификации Tossy / Rockwood.',
    protocol_phrase: 'Сравнительная цифровая рентгенография обоих АКС стоя с подвешиванием груза 5 кг на запястья (Zanca view).',
    priority_level: 'primary',
    sort_order: 35
  },
  {
    code: 'xray_sternum',
    name: 'Рентгенография грудины и грудино-ключичных сочленений',
    modality: 'xray',
    target_joint: 'spine',
    servdict_id: 80, // 1 800 руб.
    clinical_indications: 'Дифференциальная диагностика переломов грудины, артроза грудино-ключичного сустава и синдрома Титце.',
    protocol_phrase: 'Рентгенография грудины в боковой проекции и обзорная спондилограмма.',
    priority_level: 'secondary',
    sort_order: 64
  },
  {
    code: 'xray_ankle_stress',
    name: 'Стресс-рентгенография голеностопного сустава под нагрузкой',
    modality: 'xray',
    target_joint: 'ankle',
    servdict_id: 114,
    clinical_indications: 'Количественное измерение патологического угла наклона таранной кости (talar tilt) и передней трансляции при нестабильности.',
    protocol_phrase: 'Рентгенография голеностопного сустава со стресс-нагрузкой (инверсия стопы и передняя тяга).',
    priority_level: 'secondary',
    sort_order: 15
  },
  {
    code: 'xray_scaphoid_4v',
    name: 'Ладьевидная серия рентгенограмм кисти (4 проекции)',
    modality: 'xray',
    target_joint: 'wrist',
    servdict_id: 114,
    clinical_indications: 'Выявление скрытых переломов талии ладьевидной кости, ложных суставов и асептического некроза.',
    protocol_phrase: 'Специальная серия рентгенограмм ладьевидной кости кисти в 4 проекциях с ульнарным отведением.',
    priority_level: 'primary',
    sort_order: 74
  },
  {
    code: 'mri_si_joints_stir',
    name: 'МРТ крестцово-подвздошных суставов (режим STIR / T1)',
    modality: 'mri',
    target_joint: 'hip',
    servdict_id: null,
    clinical_indications: 'Ранняя верификация активного сакроилеита (субхондральный отек костного мозга) при спондилоартритах по критериям ASAS.',
    protocol_phrase: 'МРТ крестцово-подвздошных сочленений на томографе 1.5–3.0 Тл в косых коронарных проекциях с импульсными последовательностями T1 и STIR.',
    priority_level: 'primary',
    sort_order: 36
  },
  {
    code: 'mri_cervical',
    name: 'Высокопольная МРТ шейного отдела позвоночника',
    modality: 'mri',
    target_joint: 'spine',
    servdict_id: null,
    clinical_indications: 'Диагностика грыж межпозвонковых дисков C5–C7, фораминального стеноза, компрессионной шейной миелопатии.',
    protocol_phrase: 'МРТ шейного отдела позвоночника и спинного мозга на томографе 1.5 Тл.',
    priority_level: 'primary',
    sort_order: 65
  },
  {
    code: 'mri_thoracic',
    name: 'МРТ грудного отдела позвоночника',
    modality: 'mri',
    target_joint: 'spine',
    servdict_id: null,
    clinical_indications: 'Исключение грыж грудных дисков, спондилодисцита, гемангиом тел позвонков, болезни Шейермана-Мау.',
    protocol_phrase: 'МРТ грудного отдела позвоночника в сагиттальной и аксиальной плоскостях (T1, T2, STIR).',
    priority_level: 'secondary',
    sort_order: 66
  },
  {
    code: 'mri_ankle_high',
    name: 'Высокопольная МРТ голеностопа и заднего отдела стопы',
    modality: 'mri',
    target_joint: 'ankle',
    servdict_id: null,
    clinical_indications: 'Остеохондральные дефекты блока таранной кости, разрывы связок синдесмоза и ATFL, теносиновит сухожилий малоберцовых мышц.',
    protocol_phrase: 'МРТ голеностопного сустава и предплюсны на высокопольном томографе 1.5–3.0 Тл.',
    priority_level: 'primary',
    sort_order: 16
  },
  {
    code: 'us_hip_pediatric',
    name: 'УЗИ тазобедренных суставов у детей по Графу (Graf)',
    modality: 'ultrasound',
    target_joint: 'hip',
    servdict_id: 1675, // 1 500 руб.
    clinical_indications: 'Ранний скрининг врожденной дисплазии и вывиха бедра у младенцев, измерение углов альфа и бета костного/хрящевого эркера.',
    protocol_phrase: 'Ультразвуковое исследование тазобедренных суставов у ребенка по методике R. Graf с определением типа дисплазии.',
    priority_level: 'primary',
    sort_order: 37
  },
  {
    code: 'us_dvt_veins',
    name: 'Дуплексное сканирование глубоких вен нижних конечностей',
    modality: 'ultrasound',
    target_joint: 'general',
    servdict_id: 1675,
    clinical_indications: 'Исключение тромбоза глубоких вен голени и бедра при посттравматическом отеке, гипсовании и подготовке к операциям.',
    protocol_phrase: 'Ультразвуковое триплексное сканирование вен нижних конечностей с компрессионными пробами.',
    priority_level: 'primary',
    sort_order: 85
  },
  {
    code: 'us_hand_synovitis',
    name: 'УЗИ суставов кисти с энергетическим допплером (Power Doppler)',
    modality: 'ultrasound',
    target_joint: 'wrist',
    servdict_id: 1675,
    clinical_indications: 'Оценка активного синовита суставов запястья и пальцев, эррозий костей, теносиновита сгибателей при полиартрите.',
    protocol_phrase: 'УЗИ суставов кисти и сухожильных влагалищ с оценкой кровотока в режиме Power Doppler.',
    priority_level: 'primary',
    sort_order: 75
  },
  {
    code: 'dexa_densitometry',
    name: 'Двухэнергетическая рентгеновская абсорбциометрия (DEXA)',
    modality: 'bone_scan',
    target_joint: 'general',
    servdict_id: null,
    clinical_indications: 'Золотой стандарт измерения минеральной плотности кости поясничного отдела и шейки бедра, расчет Т-критерия и Z-критерия остеопороза.',
    protocol_phrase: 'Рентгеновская денситометрия (DEXA) поясничного отдела позвоночника (L1–L4) и проксимального отдела бедренной кости.',
    priority_level: 'primary',
    sort_order: 86
  },
  {
    code: 'baropodometry',
    name: 'Компьютерная динамическая бароподометрия стопы',
    modality: 'plantography',
    target_joint: 'ankle',
    servdict_id: 99, // 99 руб.
    clinical_indications: 'Динамическое картирование распределения давления под стопой во время шагового цикла, подбор индивидуальных ортопедических стелек.',
    protocol_phrase: 'Компьютерная подометрия и бароподометрия стоп с фазовым анализом шага.',
    priority_level: 'primary',
    sort_order: 17
  },
  {
    code: 'enmg_peroneal_tibial',
    name: 'Стимуляционная ЭНМГ малоберцового и большеберцового нервов',
    modality: 'enmg',
    target_joint: 'ankle',
    servdict_id: null,
    clinical_indications: 'Диагностика туннельной невропатии тарзального канала, травматического повреждения малоберцового нерва при травмах голени.',
    protocol_phrase: 'Электронейромиография (ЭНМГ) двигательных и чувствительных волокон малоберцового и большеберцового нервов.',
    priority_level: 'primary',
    sort_order: 18
  },
  {
    code: 'lab_osteoporosis_panel',
    name: 'Биохимическая панель метаболизма костной ткани',
    modality: 'lab',
    target_joint: 'general',
    servdict_id: 1600, // 1 400 руб.
    clinical_indications: 'Лабораторная оценка остеопороза: 25-OH витамин D, кальций ионизированный, фосфор неорганический, паратгормон, маркер резорбции Beta-CrossLaps.',
    protocol_phrase: 'Комплексный анализ крови на маркеры метаболизма кости (25-OH витамин D, ионизированный Ca, фосфор, паратгормон, CrossLaps).',
    priority_level: 'primary',
    sort_order: 87
  },
  {
    code: 'lab_hla_b27_panel',
    name: 'Генетическое типирование HLA-B27 и маркеры воспаления',
    modality: 'lab',
    target_joint: 'general',
    servdict_id: 1600,
    clinical_indications: 'Дифференциальная диагностика серонегативных спондилоартритов (болезнь Бехтерева, псориатический артрит, сакроилеит).',
    protocol_phrase: 'ПЦР-исследование крови на антиген HLA-B27, высокочувствительный С-реактивный белок (СРБ).',
    priority_level: 'primary',
    sort_order: 88
  }
];

function seedCatalogs() {
  db.serialize(() => {
    console.log('[CatalogSeeder] Seeding 37 validated orthopedic tests...');
    const testStmt = db.prepare(`
      INSERT OR REPLACE INTO ortho_test_catalog (
        code, name_ru, name_lat, joint_category, target_structure,
        methodology, positive_criteria, sensitivity_specificity, icon_type, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    NEW_ORTHO_TESTS.forEach(t => {
      testStmt.run([
        t.code, t.name_ru, t.name_lat, t.joint_category, t.target_structure,
        t.methodology, t.positive_criteria, t.sensitivity_specificity, t.icon_type, t.sort_order
      ]);
    });
    testStmt.finalize();

    console.log('[CatalogSeeder] Seeding 22 diagnostic methods...');
    const diagStmt = db.prepare(`
      INSERT OR REPLACE INTO diagnostic_methods_catalog (
        code, name, modality, target_joint, servdict_id,
        clinical_indications, protocol_phrase, priority_level, is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    NEW_DIAGNOSTIC_METHODS.forEach(d => {
      diagStmt.run([
        d.code, d.name, d.modality, d.target_joint, d.servdict_id,
        d.clinical_indications, d.protocol_phrase, d.priority_level, d.sort_order
      ]);
    });
    diagStmt.finalize();

    // Verify counts
    db.get('SELECT count(*) as total FROM ortho_test_catalog', (e1, r1) => {
      console.log(`[CatalogSeeder] Total Orthopedic Tests in Catalog: ${r1.total}`);
    });

    db.get('SELECT count(*) as total FROM diagnostic_methods_catalog', (e2, r2) => {
      console.log(`[CatalogSeeder] Total Diagnostic Methods in Catalog: ${r2.total}`);
      db.close();
    });
  });
}

seedCatalogs();
