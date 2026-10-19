/**
 * syncOrthoticsStandards180.js
 * Comprehensive synchronization script for:
 * 1. ortho_orthotics_catalog (25 standardized catalog items with servdict links)
 * 2. ortho_templates (orthotics_priority, orthotics_weight_bearing, orthotics_summary, orthotics_has_stop, orthotics_stop_rationale)
 * 3. ortho_template_orthotics (full EBM relations with ISO codes, hinge settings, wearing regimes, stop warnings)
 * Source of truth: md/OrthoIzdeliya1_6.md and md/OrthoIzdeliya6_10.md
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('../node_modules/sqlite3').verbose();

const DB_PATH = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const FILE_1 = path.resolve(__dirname, '../../md/OrthoIzdeliya1_6.md');
const FILE_2 = path.resolve(__dirname, '../../md/OrthoIzdeliya6_10.md');

const CATALOG_ITEMS = [
  {
    code: 'orth_insole_formthotics',
    name: 'Изготовление индивидуальных ортопедических стелек Formthotics (термоформовка)',
    subcategory: 'insole',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2617,
    servdict_code: 'В05.050.001',
    description: 'Индивидуальное ортезирование стоп по международной медицинской системе Formthotics (Новая Зеландия). Термоформовка разогретой заготовки из пены Ultralon под стопой пациента с последующей динамической коррекцией клиньями.',
    technique_details: 'Плантоскопическая и функциональная биомеханическая оценка стопы, разогрев заготовки в аппарате Formthotics до 85°C, моделирование в нейтральном положении подтаранного сустава при осевой нагрузке.',
    regimen_standard: 'Первичная адаптация 3–4 недели, повторный осмотр с установкой функциональных клиньев (коррекция гиперпронации/супинации).',
    patient_preparation: 'Принести закрытую повседневную и спортивную обувь с жестким задником и съемной заводской стелькой.',
    post_procedure_care: 'Ежедневное ношение, постепенное увеличение времени с 2 до 8 часов в первые 5 дней.',
    clinical_indications: 'Плантарный фасциит, пяточная шпора, метатарзалгия, вальгусная деформация первого пальца (Hallux valgus), продольно-поперечное плоскостопие, пателлофеморальный синдром, медиальный гонартроз.',
    contraindications: 'Острые язвы и трофические нарушения подошвенной поверхности стопы, острый флегмонозный процесс.'
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
    description: 'Индивидуальная иммобилизация низкотемпературным термопластиком TurboCast с вспененным полимерным подкладочным слоем и микроперфорацией. Влагостойкая, гигиеничная, рентгенопрозрачная альтернатива гипсу.',
    technique_details: 'Разогрев термопластика на водяной бане до 65–70°C, моделирование по контуру лучезапястного сустава и кисти в физиологическом положении (разгибание 15°–20°), фиксация застежками Velcro.',
    regimen_standard: 'Круглосуточно на срок иммобилизации (от 2 до 6 недель в зависимости от патологии). Разрешены водные процедуры.',
    patient_preparation: 'Туалет кожных покровов, снятие ювелирных украшений с пальцев.',
    post_procedure_care: 'Контроль отсутствия сдавления пальцев и отека. При дискомфорте возможна терморемоделировка.',
    clinical_indications: 'Переломы дистального метаэпифиза лучевой кости, ладьевидной кости, растяжения связок кисти, посттравматический артрозоартрит, синдром запястного канала.',
    contraindications: 'Острый компартмент-синдром, обширные открытые инфицированные раны с обильной экссудацией.'
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
    description: 'Анатомическая иммобилизация голеностопного сустава термопластиком TurboCast с возможностью полного снятия для обработки ран и ранней разработки движений.',
    technique_details: 'Моделирование пластикового сапожка в положении нейтральной дорсифлексии 0° с плотным охватом лодыжек и подошвенной поверхности.',
    regimen_standard: 'Круглосуточно с соблюдением назначенного режима осевой нагрузки (NWB/PWB).',
    patient_preparation: 'Очищение кожи, удаление волосяного покрова при необходимости.',
    post_procedure_care: 'Исключить перегрев ортеза выше 50°C (радиаторы, сауны).',
    clinical_indications: 'Повреждения связок голеностопного сустава II–III ст., переломы лодыжек без смещения, иммобилизация после шва ахиллова сухожилия.',
    contraindications: 'Некупированный нарастающий отек стопы с угрозой трофических нарушений.'
  },
  {
    code: 'orth_turbocast_finger',
    name: 'Наложение пластиковой иммобилизирующей повязки из Турбокаста на палец кисти',
    subcategory: 'turbocast',
    target_joint: 'wrist',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2151,
    servdict_code: 'A15.03.002',
    description: 'Индивидуальная шина из термопластика на дистальные или средние фаланги пальцев кисти.',
    technique_details: 'Моделирование в физиологическом разгибании 0° при повреждении разгибателя или в положении Intrinsic-plus.',
    regimen_standard: 'Непрерывное круглосуточное ношение 6–8 недель без снятия.',
    patient_preparation: 'Антисептическая обработка.',
    post_procedure_care: 'Защита от случайного сгибания пальца.',
    clinical_indications: 'Mallet finger, повреждение капсульно-связочного аппарата фаланг, переломы фаланг без смещения.',
    contraindications: 'Открытый гнойный панариций.'
  },
  {
    code: 'orth_tutor_rigid_knee',
    name: 'Жесткий тутор на коленный сустав (иммобилизация в разгибании 0°)',
    subcategory: 'tutor_rigid',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Трехпанельный или разъемный тутор с металлическими моделируемыми шинами (задней и двумя боковыми), обеспечивающий полную иммобилизацию коленного сустава в угле разгибания 0°.',
    technique_details: 'Индивидуальная подгонка шин по задней поверхности бедра и голени с фиксацией ремнями Velcro. Контроль парапателлярного зазора.',
    regimen_standard: 'Краткосрочно в острой фазе (до 48–72 ч) или на период заживления разрыва сухожилия надколенника/четырехглавой мышцы.',
    patient_preparation: 'Примерка на тонкое хлопчатобумажное белье.',
    post_procedure_care: 'Не допускать ношения дольше рекомендованного срока во избежание контрактуры.',
    clinical_indications: 'Острый гемартроз, разрыв собственной связки надколенника, послеоперационная иммобилизация, острый вывих чашечки.',
    contraindications: 'Адгезивный артрофиброз, тромбоз глубоких вен нижних конечностей без антикоагулянтной защиты.'
  },
  {
    code: 'orth_brace_knee_hinged',
    name: 'Шарнирный коленный ортез с полицентрическими шарнирами и замком ROM',
    subcategory: 'brace_hinged',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Функциональный ортез с двухосевыми шарнирами и возможностью дискретной регулировки угла сгибания/разгибания с шагом 10°–15° (ROM control).',
    technique_details: 'Выставление секторов движения на шарнирах по клиническому протоколу (например, разгибание 0°, сгибание 90°), центрирование шарниров по оси мыщелков бедра.',
    regimen_standard: 'Дневное ношение при осевой нагрузке и ходьбе.',
    patient_preparation: 'Подбор по окружности бедра на 15 см выше щели сустава.',
    post_procedure_care: 'Регулярная проверка затяжки ремней и соосности шарниров.',
    clinical_indications: 'Повреждения коллатеральных связок (MCL/LCL II–III ст.), состояние после пластики ПКС/ЗКС, нестабильность сустава.',
    contraindications: 'Тяжелый декомпенсированный варикоз с трофическими язвами в зоне прилегания манжет.'
  },
  {
    code: 'orth_brace_knee_unloader',
    name: '3-точечный разгружающий ортез коленного сустава (Valgus / Varus Unloader OA Brace)',
    subcategory: 'brace_hinged',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Высокотехнологичный ортез с динамической 3-точечной системой рычагов, раскрывающей суженную суставную щель медиального или латерального компартмента колена при ходьбе.',
    technique_details: 'Регулировка динамического натяжителя (корригирующий момент вальгуса при медиальном гонартрозе, варуса — при латеральном).',
    regimen_standard: 'Ношение при любой осевой нагрузке, ходьбе на дистанции >200 м.',
    patient_preparation: 'Биомеханическая разметка оси конечности.',
    post_procedure_care: 'Оценка кожи в точках упора мыщелковых пелотов.',
    clinical_indications: 'Одномыщелковый гонартроз II–III ст., рассекающий остеохондрит мыщелка (болезнь Кёнига), состояние после шва корня мениска.',
    contraindications: 'Тяжелый трехкомпартментный деформирующий гонартроз с сгибательной контрактурой >20°.'
  },
  {
    code: 'orth_brace_pcl_dynamic',
    name: 'Динамический ортез ЗКС с пружинной передней поддержкой голени (Dynamic Anterior-Drawer PCL)',
    subcategory: 'brace_hinged',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Специализированный брейс (типа Rebound PCL / Jack PCL), создающий постоянную передне-направленную силу на верхнюю треть большеберцовой кости для противодействия гравитационному заднему провисанию голени.',
    technique_details: 'Регулировка динамического упора в зависимости от угла сгибания колена.',
    regimen_standard: 'Непрерывное ношение 24/7 (включая сон) на протяжении 12–16 недель.',
    patient_preparation: 'Индивидуальная подгонка упора икры.',
    post_procedure_care: 'Сон строго с подушкой под голенью.',
    clinical_indications: 'Разрыв задней крестообразной связки (ЗКС), повреждение заднелатерального угла (PLC).',
    contraindications: 'Изолированный разрыв ПКС (противопоказан, так как толкает голень вперед!).'
  },
  {
    code: 'orth_brace_patellar_trupull',
    name: 'Динамический пателлофеморальный стабилизирующий ортез с латеральным упором (Tru-Pull / J-Brace)',
    subcategory: 'brace_hinged',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Ортез с C- или J-образным силиконовым валиком и эластичными перекрестными тягами, динамически удерживающими надколенник в межмыщелковой борозде при сгибании 0°–45°.',
    technique_details: 'Фиксация латерального полукольца с медиализирующей регулируемой тягой.',
    regimen_standard: 'При физических нагрузках, ходьбе по лестнице, занятиях ЛФК.',
    patient_preparation: 'Центрирование кольца строго вокруг чашечки.',
    post_procedure_care: 'Контроль отсутствия передавливания подколенной ямки.',
    clinical_indications: 'Привычный подвывих надколенника, латеральная гиперпрессия, дисплазия блока бедренной кости, пателлофеморальный артроз.',
    contraindications: 'Фиксированный невправимый латеральный вывих чашечки.'
  },
  {
    code: 'orth_strap_patellar',
    name: 'Инфрапателлярный контрфорсный ремень надколенника (Cho-Pat / Patellar Tendon Strap)',
    subcategory: 'strap',
    target_joint: 'knee',
    service_scope: 'internal',
    default_priority: 'medium',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Узкий бандаж с плотным анатомическим пелотом, накладываемый непосредственно на собственную связку надколенника между нижним полюсом чашечки и бугристостью ББК.',
    technique_details: 'Затяжка ремня на середине связки с умеренной компрессией.',
    regimen_standard: 'Исключительно на время беговых, прыжковых тренировок и быстрой ходьбы.',
    patient_preparation: 'Пальпаторное определение связки в положении сгибания 30°.',
    post_procedure_care: 'Снятие в покое во избежание венозного стаза.',
    clinical_indications: 'Тендинопатия связки надколенника («колено прыгуна»), болезнь Осгуда-Шлаттера у подростков, синдром Синдинга-Ларсена.',
    contraindications: 'Болезнь Гоффа (липоартрит — ремень вдавливает жировое тело!).'
  },
  {
    code: 'orth_boot_walker_hinged',
    name: 'Регулируемый жесткий ортез-сапожок Walker с набором эквинусных подпяточных клиньев',
    subcategory: 'brace_hinged',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1795,
    servdict_code: 'А15.03.007',
    description: 'Высокий жесткий ортез с пневмокамерами для точной фиксации голени и перекатной подошвой (Rocker bottom). Комплектуется клиньями 20°–30° эквинуса.',
    technique_details: 'Поэтапное удаление клиньев (каждые 2 недели на 1 клин) для постепенного выведения стопы в нейтраль 0°.',
    regimen_standard: 'Круглосуточно с переходом на режим PWB/WBAT.',
    patient_preparation: 'Подбор размера по длине стопы.',
    post_procedure_care: 'Подкачка пневмокамер для плотного прилегания.',
    clinical_indications: 'Разрыв ахиллова сухожилия (консервативное лечение и после шва), переломы лодыжек, перелом костей предплюсны, тарзальный туннельный синдром.',
    contraindications: 'Открытые переломы с нестабильностью отломков без остеосинтеза.'
  },
  {
    code: 'orth_brace_ankle_laceup',
    name: 'Полужесткий голеностопный ортез на шнуровке со спиральными ребрами и 8-образными ремнями',
    subcategory: 'brace_hinged',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2164,
    servdict_code: 'А15.03.087',
    description: 'Ортез плотной посадки с боковыми металлическими/пластиковыми вставками и перекрестными стабилизирующими лентами, имитирующими спортивный тейпинг.',
    technique_details: 'Шнуровка с плотным обжатием подъема стопы, затяжка латерального ремня с легкой эверсией.',
    regimen_standard: 'Дневное ношение в обуви при осевой нагрузке.',
    patient_preparation: 'Надевание на плотный хлопчатобумажный носок.',
    post_procedure_care: 'Контроль кровообращения пальцев стопы.',
    clinical_indications: 'Хроническая латеральная нестабильность голеностопного сустава, разрыв передней таранно-малоберцовой связки (ATFL), синдром пазухи предплюсны.',
    contraindications: 'Острый массивный отек мягких тканей в первые часы после травмы.'
  },
  {
    code: 'orth_afo_dropfoot',
    name: 'Динамический стоподержатель (Ankle-Foot Orthosis AFO) из карбона/термопластика',
    subcategory: 'brace_rigid',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 1795,
    servdict_code: 'А15.03.007',
    description: 'Легкий задне- или переднеопорный ортез, фиксирующий голеностопный сустав в нейтрали 0° и аккумулирующий энергию при наступании на пятку.',
    technique_details: 'Установка в стандартную закрытую обувь с задником.',
    regimen_standard: 'Постоянно при ходьбе для исключения степпажа («петушиной походки»).',
    patient_preparation: 'Индивидуальная подгонка по ширине стопы и высоте икроножной мышцы.',
    post_procedure_care: 'Осмотр кожи передней поверхности голени и пятки.',
    clinical_indications: 'Парез малоберцового нерва («отвисающая стопа»), последствия травмы седалищного нерва, L5-радикулопатия, миодистрофии.',
    contraindications: 'Фиксированная ригидная эквинусная контрактура стопы >15° (требует ахиллопластики).'
  },
  {
    code: 'orth_shoe_barouk',
    name: 'Разгрузочная ортопедическая обувь Барука для переднего отдела стопы',
    subcategory: 'shoe',
    target_joint: 'ankle',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Специальная послеоперационная обувь с укороченной подошвой и клиновидным скосом под углом 10°, переносящая 100% осевой нагрузки на пятку и средний отдел стопы.',
    technique_details: 'Фиксация ремнями Velcro с компенсацией высоты на второй ноге.',
    regimen_standard: 'Круглосуточно при любой попытке встать с постели и ходить на срок 4–6 недель.',
    patient_preparation: 'Подбор по размеру стопы с учетом объемной повязки.',
    post_procedure_care: 'Запрет наступания на носок!',
    clinical_indications: 'После остеотомий первой плюсневой кости (Scarf, Chevron, Akin), операции Weil при молоткообразных пальцах, резекции невромы Мортона, стресс-переломы плюсневых костей.',
    contraindications: 'Патология заднего отдела стопы (перелом пяточной кости, фасциит).'
  },
  {
    code: 'orth_shoulder_abduction_sling',
    name: 'Отводящая шина-подушка плечевого сустава (Abduction Pillow Sling 30°–45°)',
    subcategory: 'brace_hinged',
    target_joint: 'shoulder',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Анатомическая подушка из плотного пенополиуретана с фиксацией к туловищу широким поясом и поддерживающим предплечье карманом.',
    technique_details: 'Укладка руки в плоскости лопатки (30° отведения, 10°–15° сгибания, нейтральная ротация). Снимает натяжение надостной мышцы.',
    regimen_standard: 'Постоянно 4–6 недель (включая сон). Разрешены движения пальцами и лучезапястным суставом.',
    patient_preparation: 'Регулировка поясного и плечевого ремней на уровне гребня подвздошной кости.',
    post_procedure_care: 'Ежедневная гигиена подмышечной впадины.',
    clinical_indications: 'Полнослойные разрывы вращательной манжеты плеча (после артроскопического шва и при консервативном ведении), переломы большого бугорка, кальцифицирующий тендинит в острую фазу.',
    contraindications: 'Передний вывих плеча без репозиции.'
  },
  {
    code: 'orth_sling_desault',
    name: 'Иммобилизирующий косыночный ортез с торакальным поясом (повязка Дезо)',
    subcategory: 'sling',
    target_joint: 'shoulder',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Ортез из воздухопроницаемого материала с мягкой косынкой для предплечья и опоясывающим грудную клетку фиксирующим ремнем, приводящим плечо к туловищу.',
    technique_details: 'Угол в локтевом суставе 90°, плечо фиксировано к туловищу.',
    regimen_standard: 'Не более 2–3 недель у молодых, не более 10–14 дней у пожилых (во избежание контрактуры!).',
    patient_preparation: 'Надевание поверх тонкой футболки.',
    post_procedure_care: 'Обязательное начало пассивных маятниковых упражнений с 10–14 дня.',
    clinical_indications: 'Переломы ключицы, проксимального отдела плеча без смещения, острый акромиально-ключичный вывих I–II ст., ушиб плечевого сустава.',
    contraindications: 'Адгезивный капсулит («замороженное плечо»), задний вывих плеча, поздний реабилитационный этап.'
  },
  {
    code: 'orth_splint_stack_finger',
    name: 'Дистальная фаланговая шина Стака (Stack Splint) 0° разгибания',
    subcategory: 'splint',
    target_joint: 'wrist',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 2151,
    servdict_code: 'A15.03.002',
    description: 'Колпачковая перфорированная шина из жесткого пластика, фиксирующая дистальный межфаланговый сустав (ДМФС) строго в нейтральном положении 0° или гиперэкстензии +5° при полной свободе проксимального сустава (ПМФС).',
    technique_details: 'Крепление лейкопластырем по средней фаланге без сдавления ногтевого ложа.',
    regimen_standard: 'СТРОГО НЕПРЕРЫВНО 24/7 в течение 6–8 недель. Если палец хотя бы раз согнется при смене шины — таймер 6 недель сбрасывается на ноль!',
    patient_preparation: 'Кожа должна быть сухой и чистой.',
    post_procedure_care: 'Смена фиксирующего пластыря только на плоской поверхности стола с прижатой подушечкой пальца.',
    clinical_indications: 'Подкожный отрыв сухожилия разгибателя пальца (Mallet finger / «палец-молоточек»), переломы дистальной фаланги.',
    contraindications: 'Открытые инфицированные раны ногтевой фаланги.'
  },
  {
    code: 'orth_splint_spica_thumb',
    name: 'Ортез Spica для иммобилизации первого луча кисти (Thumb Spica Orthosis)',
    subcategory: 'splint',
    target_joint: 'wrist',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 252,
    servdict_code: 'А.15.03.007',
    description: 'Ортез с жесткой моделируемой шиной по лучевому краю, блокирующий движения в первом пястно-фаланговом и запястно-пястном суставах.',
    technique_details: 'Фиксация I пальца в положении легкого отведения и противопоставления («положение бокала»).',
    regimen_standard: 'Постоянно 3–4 недели при обострении, далее при выполнении физической работы.',
    patient_preparation: 'Регулировка прилегания застежек Velcro.',
    post_procedure_care: 'Свободные движения II–V пальцами кисти.',
    clinical_indications: 'Болезнь де Кервена (стенозирующий лигаментит I канала), ризартроз (артроз первого запястно-пястного сустава), повреждение локтевой связки I пальца («палец лыжника»).',
    contraindications: 'Инфекция кожи в первом межпальцевом промежутке.'
  },
  {
    code: 'orth_splint_wrist_night',
    name: 'Ночной шинирующий ортез лучезапястного сустава в нейтральном положении (0°–5°)',
    subcategory: 'splint',
    target_joint: 'wrist',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Волярная шина, удерживающая кисть строго в нейтральном положении (разгибание 0°–5°), при котором внутриканальное давление в карпальном туннеле минимально (2–5 мм рт. ст. против 30–50 при сгибании!).',
    technique_details: 'Анатомическая волярная алюминиевая шина.',
    regimen_standard: 'Каждую ночь во время сна на протяжении 6–12 недель.',
    patient_preparation: 'Шина не должна врезаться в дистальную ладонную складку.',
    post_procedure_care: 'Днем разрешены свободные движения.',
    clinical_indications: 'Синдром запястного канала (компрессия n. medianus), лучезапястный стилоидит, теносиновит разгибателей.',
    contraindications: 'Острый гнойный теносиновит карпального канала.'
  },
  {
    code: 'orth_corset_lso',
    name: 'Пояснично-крестцовый полужесткий корсет с моделируемыми ребрами жесткости (LSO)',
    subcategory: 'corset_lso',
    target_joint: 'spine',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Корсет из эластичного дышащего полотна с 4–6 металлическими или пластиковыми ребрами жесткости и дополнительными эластичными стяжками, снижающий внутридисковое давление на 25–30%.',
    technique_details: 'Моделирование ребер по поясничному лордозу в положении стоя или лежа.',
    regimen_standard: 'Ношение строго при осевой нагрузке (ходьба, сидение, подъем тяжестей). Не более 4–6 часов в сутки. В покое и лежа корсет снимается!',
    patient_preparation: 'Подбор по окружности талии/бедер на уровне гребней подвздошных костей.',
    post_procedure_care: 'Параллельное укрепление глубоких мышц кора (ЛФК).',
    clinical_indications: 'Острая люмбоишиалгия, грыжа межпозвонкового диска L4-L5, L5-S1, спондилолистез I ст., фасеточный синдром, ранний период после дискэктомии.',
    contraindications: 'Анкилозирующий спондилоартрит (болезнь Бехтерева — корсеты стимулируют анкилоз!).'
  },
  {
    code: 'orth_corset_cheneau',
    name: 'Асимметричный жесткий деротационный корсет типа Шено (Chêneau 3D-CAD/CAM TLSO)',
    subcategory: 'corset_tlso',
    target_joint: 'spine',
    service_scope: 'external',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Индивидуальный жесткий полимерный корсет, изготовленный по 3D-скану туловища. Создает зоны направленного давления на вершины дуг деформации и зоны расширения (камеры разгрузки).',
    technique_details: '3D сканирование, моделирование в CAD-программе, термоформовка из полиэтилена высокой плотности.',
    regimen_standard: '20–23 часа в сутки до завершения костного роста (тест Риссера 4–5).',
    patient_preparation: 'Специальное бесшовное хлопковое белье под корсет.',
    post_procedure_care: 'Контрольные рентгенограммы в корсете через 1–2 месяца.',
    clinical_indications: 'Прогрессирующий идиопатический сколиоз у подростков при угле Кобба от 20° до 45° с незавершенным ростом.',
    contraindications: 'Завершенный скелетный рост (Риссер 5), тяжелые декомпенсированные пороки сердца.'
  },
  {
    code: 'orth_belt_sacroiliac',
    name: 'Тазовый компрессионный стабилизирующий пояс крестцово-подвздошного сочленения (SIO)',
    subcategory: 'belt',
    target_joint: 'hip',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Узкий нерастяжимый пояс с боковыми эластичными дотяжками, накладываемый циркулярно вокруг таза чуть выше больших вертелов для компрессии КПС (force closure).',
    technique_details: 'Затяжка ремней непосредственно над лонным сочленением и большими вертелами.',
    regimen_standard: 'При длительной ходьбе, подъеме по лестнице и статических нагрузках.',
    patient_preparation: 'Проверка положительного эффекта компрессии таза (Active Straight Leg Raise test).',
    post_procedure_care: 'Снятие в положении сидя.',
    clinical_indications: 'Дисфункция крестцово-подвздошного сочленения (КПС), симфизиопатия у беременных и родильниц, сакроилеит.',
    contraindications: 'Переломы костей таза с нарушением непрерывности тазового кольца.'
  },
  {
    code: 'orth_crutches_pair',
    name: 'Разгрузочные локтевые или подмышечные костыли с мягкими опорами (пара)',
    subcategory: 'crutches',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Регулируемые по высоте костыли с анатомическими рукоятками и противоскользящими резиновыми насадками для реализации режимов NWB, TTWB и PWB.',
    technique_details: 'Высота локтевых костылей: рукоятка на уровне большого вертела (локоть согнут под 20°). Обучение 3- и 4-точечной походке.',
    regimen_standard: 'В течение всего периода разгрузки конечности.',
    patient_preparation: 'Напольные весы для калибровки силы нажатия (10% массы при TTWB, 30–50% при PWB).',
    post_procedure_care: 'Регулярная проверка целостности резиновых наконечников.',
    clinical_indications: 'Переломы костей нижних конечностей, остеонекроз (АНГБК, Кёниг), синдром отека костного мозга BMES, швы менисков и связок, ЮЭГБК.',
    contraindications: 'Тяжелая атаксия, когнитивные нарушения без сопровождающего лица.'
  },
  {
    code: 'orth_cane_contralateral',
    name: 'Анатомическая опорная трость (ношение строго в контрлатеральной руке)',
    subcategory: 'cane',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Трость с эргономичной рукояткой (под правую или левую кисть) и устройством противоскольжения (УПС).',
    technique_details: 'Регулировка по высоте большого вертела. Ношение СТРОГО В РУКЕ, ПРОТИВОПОЛОЖНОЙ больной ноге (рычаг Паувелса: снижает нагрузку на тазобедренный сустав на 30–40%, на медиальное колено на 15–25%!).',
    regimen_standard: 'При любой ходьбе вне дома.',
    patient_preparation: 'Инструктаж по кинематике шага: трость выносится вперед одновременно с больной ногой.',
    post_procedure_care: 'Контроль отсутствия мозолей на ладони.',
    clinical_indications: 'Гонартроз II–IV ст., коксартроз II–III ст., реабилитация после эндопротезирования, старческая астения.',
    contraindications: 'Парез кисти на контрлатеральной стороне.'
  },
  {
    code: 'orth_cushion_abductor_hips',
    name: 'Ортопедическая контурная подушка-абдуктор между коленями для сна на боку',
    subcategory: 'cushion',
    target_joint: 'hip',
    service_scope: 'internal',
    default_priority: 'medium',
    servdict_id: 190,
    servdict_code: 'A15.03.007',
    description: 'Анатомическая подушка из пены с эффектом памяти (Memory Foam) с ремнем крепления к бедру, поддерживающая ноги в нейтральном параллельном отведении 10°–15° во время сна на боку.',
    technique_details: 'Размещение между бедрами/коленями при положении лежа на здоровом боку.',
    regimen_standard: 'Ежедневно на весь период ночного сна.',
    patient_preparation: 'Подгонка эластичного ремня.',
    post_procedure_care: 'Съемный чехол для стирки.',
    clinical_indications: 'Вертлужный трохантерит (GTPS), синдром грушевидной мышцы, коксартроз, ишиофеморальный импинджмент, состояние после ТЭТС.',
    contraindications: 'Острый тромбоз глубоких вен без лечения.'
  },
  {
    code: 'orth_contra_stop_alert',
    name: 'Клиническое ограничение и запрет СППВР (Safety Constraint / CDSS Red Flag)',
    subcategory: 'contraindication_warning',
    target_joint: 'general',
    service_scope: 'internal',
    default_priority: 'high',
    servdict_id: null,
    servdict_code: null,
    description: 'Автоматический запрет опасной иммобилизации, преждевременной осевой нагрузки или нерационального ортезирования.',
    technique_details: 'Блокировка назначения в СППВР.',
    regimen_standard: 'Строгое соблюдение предписанного охранительного режима.',
    patient_preparation: 'Информирование пациента о рисках вторичного смещения/осложнений.',
    post_procedure_care: 'Контроль за соблюдением охранительного режима.',
    clinical_indications: 'Ургентные состояния и противопоказания (Red Flags).',
    contraindications: 'Нарушение регламента безопасности.'
  }
];

function parseAllMarkdown() {
  const templatesMap = new Map();

  function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/^\|\s*\*\*#(\d+)\*\*/);
      if (!match) continue;

      const id = parseInt(match[1], 10);
      const parts = line.split('|').map(p => p.trim());
      // parts[0] is empty
      // parts[1] is **#ID**
      // parts[2] is nosology
      // parts[3] is priority
      // parts[4] is col3
      // parts[5] is col4
      const nosology = parts[2] || '';
      const priorityRaw = parts[3] || '';
      const col3 = parts[4] || '';
      const col4 = parts[5] || '';

      const combinedText = `${priorityRaw} ${col3} ${col4}`;

      // 1. Determine Stop Warning and Priority
      let hasStop = 0;
      let stopRationale = '';
      if (
        combinedText.includes('P0-STOP') || 
        combinedText.includes('P0-CONTRA') || 
        combinedText.includes('ЗАПРЕТ') || 
        combinedText.includes('Запрет') ||
        combinedText.includes('КАТЕГОРИЧЕСКИЙ ЗАПРЕТ')
      ) {
        hasStop = 1;
        // extract rationale
        const stopMatch = combinedText.match(/(\[P0-(?:STOP|CONTRA)\][^\n\r<|*]+|КАТЕГОРИЧЕСКИЙ ЗАПРЕТ[^\n\r<|*]+|ЗАПРЕТ[^\n\r<|*]+)/i);
        if (stopMatch) {
          stopRationale = stopMatch[0].replace(/\[cite:\s*\d+\]/g, '').replace(/<[^>]+>/g, '').trim();
        } else {
          stopRationale = 'Клинический запрет нерациональной иммобилизации или преждевременной осевой нагрузки (Red Flag СППВР).';
        }
      }

      let priority = 'P2';
      if (priorityRaw.includes('P1')) {
        priority = 'P1';
      } else if (priorityRaw.includes('P0-STOP') || priorityRaw.includes('P0-CONTRA')) {
        priority = priorityRaw.includes('P2') ? 'P2' : (priorityRaw.includes('P3') ? 'P3' : 'P0-STOP');
      } else if (priorityRaw.includes('P3')) {
        priority = 'P3';
      } else if (priorityRaw.includes('P2')) {
        priority = 'P2';
      }

      // 2. Determine Weight-Bearing Status
      let wbMode = 'FWB';
      const upperText = combinedText.toUpperCase();
      if (upperText.includes('NWB') || combinedText.includes('0% массы') || combinedText.includes('без касания стопой')) {
        wbMode = 'NWB';
      } else if (upperText.includes('TTWB') || combinedText.includes('касание стопой пола 10%') || combinedText.includes('касание носком')) {
        wbMode = 'TTWB';
      } else if (upperText.includes('PWB') || combinedText.includes('частичная разгрузка')) {
        wbMode = 'PWB';
      } else if (upperText.includes('WBAT') || combinedText.includes('по переносимости')) {
        wbMode = 'WBAT';
      } else if (upperText.includes('FWB') || combinedText.includes('полная опора')) {
        wbMode = 'FWB';
      } else {
        // If upper limb or spine
        if (id >= 16 && id <= 29 || id >= 51 && id <= 80 || id >= 103 && id <= 105 || id >= 137 && id <= 140 || id >= 148 && id <= 159 || id >= 177 && id <= 178) {
          wbMode = 'N/A'; // Верхняя конечность
        } else if (id >= 81 && id <= 90 || id >= 118 && id <= 121 || id >= 162 && id <= 166 || id === 179) {
          wbMode = 'FWB'; // Позвоночник
        } else {
          wbMode = 'WBAT';
        }
      }

      // 3. Extract devices and generate summary
      let cleanSummary = `${col3}; ${col4}`
        .replace(/\[cite:\s*\d+\]/g, '')
        .replace(/<br>/gi, ' ')
        .replace(/\*\*+/g, '')
        .replace(/`+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanSummary.length > 250) {
        cleanSummary = cleanSummary.substring(0, 247) + '...';
      }

      // Store in map
      templatesMap.set(id, {
        id,
        nosology,
        priority,
        wbMode,
        hasStop,
        stopRationale,
        summary: cleanSummary,
        rawCol3: col3,
        rawCol4: col4
      });
    }
  }

  processFile(FILE_1);
  processFile(FILE_2);

  return templatesMap;
}

function linkOrthoticsToTemplate(templateData) {
  const { id, priority, wbMode, hasStop, stopRationale, rawCol3, rawCol4 } = templateData;
  const combined = `${rawCol3} ${rawCol4}`.toLowerCase();
  const assignments = [];

  function addRel(code, ebmPrio, wb, iso, hinge, regimen, isStop, stopRat, mandatory) {
    if (assignments.some(a => a.code === code)) return;
    assignments.push({
      code,
      ebm_priority: ebmPrio || priority,
      weight_bearing_mode: wb || wbMode,
      device_type_iso: iso,
      hinge_settings: hinge || 'Стандарт',
      wearing_regimen: regimen || 'По клиническому регламенту',
      is_stop_warning: isStop ? 1 : 0,
      stop_rationale: stopRat || '',
      is_mandatory: mandatory !== undefined ? mandatory : (ebmPrio === 'P1' ? 1 : 0),
      service_scope: 'internal',
      priority_level: ebmPrio === 'P1' ? 'high' : (ebmPrio === 'P2' ? 'medium' : 'low')
    });
  }

  // STOP Red Flag assignment
  if (hasStop) {
    addRel(
      'orth_contra_stop_alert',
      'P0-STOP',
      wbMode,
      'ISO-STOP',
      'Блокировка',
      'Запрет назначения опасного ортезирования / нагрузки',
      1,
      stopRationale,
      0
    );
  }

  // 1. Crutches & Canes based on WB mode
  if (wbMode === 'NWB' || wbMode === 'TTWB') {
    addRel('orth_crutches_pair', 'P1', wbMode, 'Mobility', 'Полная разгрузка', 'Постоянно при передвижении', 0, '', 1);
  } else if (wbMode === 'PWB') {
    addRel('orth_crutches_pair', 'P1', wbMode, 'Mobility', 'Частичная разгрузка 20-50%', 'При ходьбе на 2 костылях', 0, '', 1);
  } else if (combined.includes('трость') || combined.includes('контрлатеральн') || id === 1 || id === 30 || id === 104) {
    addRel('orth_cane_contralateral', priority === 'P1' ? 'P1' : 'P2', wbMode, 'Mobility', 'Рычаг Паувелса', 'В руке, противоположной больной ноге', 0, '', 0);
  }

  // 2. Specific knee devices
  if (combined.includes('unloader') || combined.includes('разгружающ') && combined.includes('колен')) {
    addRel('orth_brace_knee_unloader', 'P2', wbMode, 'KO', '3-точечный вальгус/варус', 'При ходьбе >200 м', 0, '', 1);
  }
  if (combined.includes('rebound pcl') || combined.includes('зкс-ортез') || combined.includes('anterior-drawer') || id === 8) {
    addRel('orth_brace_pcl_dynamic', 'P1', wbMode, 'KO', 'Anterior-drawer упор', 'Круглосуточно 24/7 (включая сон) 12-16 нед.', 0, '', 1);
  }
  if (combined.includes('tru-pull') || combined.includes('пателлярн') && combined.includes('стабилизатор') || id === 4 || id === 133) {
    addRel('orth_brace_patellar_trupull', 'P1', wbMode, 'KO', 'Медиализирующая тяга 0°-45°', 'При ходьбе и ЛФК', 0, '', 1);
  }
  if (combined.includes('инфрапателлярн') || combined.includes('cho-pat') || combined.includes('колено прыгуна') || id === 12) {
    addRel('orth_strap_patellar', 'P2', wbMode, 'KO', 'Компрессия собственной связки', 'На время бега и прыжков', 0, '', 0);
  }
  if (combined.includes('тутор') && (combined.includes('колен') || combined.includes('0°')) || id === 2 || id === 133) {
    addRel('orth_tutor_rigid_knee', 'P2', wbMode, 'KO', 'Жесткое разгибание 0°', 'Краткосрочно 48-72 ч в острой фазе', 0, '', 0);
  }
  if (combined.includes('шарнирный наколенник') || combined.includes('шарнирный ортез') && combined.includes('колен') || id === 3 || id === 5 || id === 7 || id === 9 || id === 10) {
    addRel('orth_brace_knee_hinged', priority === 'P1' ? 'P1' : 'P2', wbMode, 'KO', 'Сектор 0°-90° с расширением', 'При ходьбе в дневное время', 0, '', priority === 'P1' ? 1 : 0);
  }

  // 3. Foot & Ankle devices
  if (combined.includes('стельк') || combined.includes('formthotics') || combined.includes('формтотикс') || combined.includes('супинатор') || id === 1 || id === 4 || id === 13 || id === 30 || id === 42 || id === 43 || id === 44 || id === 45 || id === 48 || id === 49) {
    addRel('orth_insole_formthotics', priority === 'P1' ? 'P1' : 'P2', wbMode, 'FO', 'Индивидуальная термоформовка', 'Постоянно в закрытую обувь', 0, '', 0);
  }
  if (combined.includes('walker') || combined.includes('сапожок') || combined.includes('клинь') && combined.includes('эквинус') || id === 47 || id === 122 || id === 123) {
    addRel('orth_boot_walker_hinged', 'P1', wbMode, 'AFO', 'Эквинус 20°-30° со ступенчатым снижением', 'Круглосуточно с переходом на дневное', 0, '', 1);
  }
  if (combined.includes('барук') || combined.includes('barouk') || id === 171 || id === 172) {
    addRel('orth_shoe_barouk', 'P1', 'WBAT', 'FO', 'Срез переднего отдела под 10°', 'При любой ходьбе 4-6 недель', 0, '', 1);
  }
  if (combined.includes('afo') || combined.includes('стоподержатель') || combined.includes('отвисающ') || id === 10 || id === 147) {
    addRel('orth_afo_dropfoot', 'P1', wbMode, 'AFO', 'Нейтраль 0° дорсифлексии', 'Постоянно при ходьбе в обувь', 0, '', 1);
  }
  if (combined.includes('голеностоп') && (combined.includes('шнуровк') || combined.includes('тривес') || combined.includes('бандаж')) || id === 46 || id === 50) {
    addRel('orth_brace_ankle_laceup', 'P2', wbMode, 'AFO', 'Спиральные ребра + 8-образный ремень', 'При осевой нагрузке', 0, '', 0);
  }
  if (combined.includes('турбокаст') && (combined.includes('стоп') || combined.includes('голеностоп')) || id === 41 || id === 47) {
    addRel('orth_turbocast_ankle', 'P1', wbMode, 'AFO', 'Нейтраль 0° по индивидуальному слепку', 'Круглосуточная иммобилизация', 0, '', 1);
  }

  // 4. Hand & Wrist devices
  if (combined.includes('стак') || combined.includes('stack') || combined.includes('mallet') || id === 154) {
    addRel('orth_splint_stack_finger', 'P1', 'N/A', 'WHO', 'Разгибание 0° в ДМФС', 'СТРОГО 24/7 без снятия 6-8 недель!', 0, '', 1);
  }
  if (combined.includes('spica') || combined.includes('кервен') || combined.includes('ризартроз') || id === 68 || id === 70 || id === 155) {
    addRel('orth_splint_spica_thumb', 'P1', 'N/A', 'WHO', 'Положение бокала (отведение I пальца)', 'Постоянно 3-4 нед., далее при нагрузке', 0, '', 1);
  }
  if (combined.includes('карпальн') || combined.includes('запястн') && combined.includes('ночн') || id === 67) {
    addRel('orth_splint_wrist_night', 'P2', 'N/A', 'WHO', 'Волярная нейтраль 0°-5°', 'Каждую ночь во время сна 6-12 нед.', 0, '', 0);
  }
  if (combined.includes('турбокаст') && (combined.includes('кист') || combined.includes('предплечь') || combined.includes('лучезапяст')) || id === 77 || id === 78 || id === 177) {
    addRel('orth_turbocast_wrist', 'P1', 'N/A', 'WHO', 'Функциональное разгибание 15°-20°', 'Круглосуточно 3-5 недель', 0, '', 1);
  }
  if (combined.includes('палец') && combined.includes('турбокаст') || id === 153 || id === 178) {
    addRel('orth_turbocast_finger', 'P1', 'N/A', 'WHO', 'Физиологическая лонгета на фалангу', 'Круглосуточно 4-6 недель', 0, '', 1);
  }

  // 5. Shoulder devices
  if (combined.includes('подушк') || combined.includes('отводящ') || combined.includes('abduction') || id === 18 || id === 22 || id === 137) {
    addRel('orth_shoulder_abduction_sling', priority === 'P1' ? 'P1' : 'P2', 'N/A', 'SO', 'Отведение 30°-45° в плоскости лопатки', 'Круглосуточно 4-6 недель', 0, '', priority === 'P1' ? 1 : 0);
  }
  if (combined.includes('дезо') || combined.includes('косынк') || combined.includes('sling') || id === 21 || id === 27 || id === 28 || id === 103) {
    if (!combined.includes('запрет')) {
      addRel('orth_sling_desault', 'P1', 'N/A', 'SO', 'Приведение к туловищу 90° в локте', '3 недели с ранними упражнениями с 14 дня', 0, '', 1);
    }
  }

  // 6. Hip & Pelvis devices
  if (combined.includes('подушка между колен') || combined.includes('разделитель') || id === 32 || id === 35 || id === 106) {
    addRel('orth_cushion_abductor_hips', 'P2', 'FWB', 'Support', 'Нейтральное отведение 10°-15°', 'Ежедневно во время сна на боку', 0, '', 0);
  }
  if (combined.includes('тазовый') || combined.includes('кпс') || combined.includes('sio') || id === 36 || id === 160) {
    addRel('orth_belt_sacroiliac', 'P2', 'WBAT', 'SIO', 'Циркулярная компрессия тазового кольца', 'При ходьбе и статических нагрузках', 0, '', 0);
  }

  // 7. Spine devices
  if (combined.includes('шено') || combined.includes('cheneau') || id === 85) {
    addRel('orth_corset_cheneau', 'P1', 'FWB', 'TLSO', '3D-деротационные пелоты', '20-23 часа в сутки до Риссера 4-5', 0, '', 1);
  }
  if (combined.includes('корсет') && (combined.includes('lso') || combined.includes('поясничн') || combined.includes('люмбалг')) || id === 81 || id === 83 || id === 84) {
    if (!combined.includes('запрет постоянного ношения')) {
      addRel('orth_corset_lso', 'P2', 'WBAT', 'LSO', '4-6 ребер жесткости по лордозу', 'При ходьбе и сидении, до 4-6 ч/день', 0, '', 0);
    }
  }

  // Fallback: if no specific device was added, attach standard supportive recommendation
  if (assignments.length === 0) {
    if (wbMode === 'NWB' || wbMode === 'TTWB' || wbMode === 'PWB') {
      addRel('orth_crutches_pair', priority === 'P1' ? 'P1' : 'P2', wbMode, 'Mobility', 'Осевая разгрузка', 'При любой ходьбе', 0, '', 1);
    } else {
      addRel('orth_insole_formthotics', 'P3', wbMode, 'FO', 'Разгрузка свода', 'Для снижения ударной нагрузки', 0, '', 0);
    }
  }

  return assignments;
}

function runSync() {
  console.log('Starting Orthotics & Offloading Standards 180 Synchronization...');

  const db = new sqlite3.Database(DB_PATH);
  const templatesMap = parseAllMarkdown();
  console.log(`Parsed ${templatesMap.size} templates from markdown files.`);

  db.serialize(() => {
    // 1. Upsert CATALOG_ITEMS into ortho_orthotics_catalog
    const catalogStmt = db.prepare(`
      INSERT INTO ortho_orthotics_catalog (
        code, name, subcategory, target_joint, service_scope, default_priority,
        servdict_id, servdict_code, description, technique_details, regimen_standard,
        patient_preparation, post_procedure_care, clinical_indications, contraindications,
        is_active, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        subcategory = excluded.subcategory,
        target_joint = excluded.target_joint,
        service_scope = excluded.service_scope,
        default_priority = excluded.default_priority,
        servdict_id = excluded.servdict_id,
        servdict_code = excluded.servdict_code,
        description = excluded.description,
        technique_details = excluded.technique_details,
        regimen_standard = excluded.regimen_standard,
        patient_preparation = excluded.patient_preparation,
        post_procedure_care = excluded.post_procedure_care,
        clinical_indications = excluded.clinical_indications,
        contraindications = excluded.contraindications
    `);

    CATALOG_ITEMS.forEach(item => {
      catalogStmt.run(
        item.code, item.name, item.subcategory, item.target_joint, item.service_scope,
        item.default_priority, item.servdict_id, item.servdict_code, item.description,
        item.technique_details, item.regimen_standard, item.patient_preparation,
        item.post_procedure_care, item.clinical_indications, item.contraindications
      );
    });
    catalogStmt.finalize();
    console.log(`Upserted ${CATALOG_ITEMS.length} standardized items into ortho_orthotics_catalog.`);

    // 2. Prepare statements for templates and template_orthotics
    const updateTemplateStmt = db.prepare(`
      UPDATE ortho_templates
      SET orthotics_priority = ?,
          orthotics_weight_bearing = ?,
          orthotics_summary = ?,
          orthotics_has_stop = ?,
          orthotics_stop_rationale = ?
      WHERE id = ?
    `);

    const deleteRelStmt = db.prepare(`DELETE FROM ortho_template_orthotics WHERE template_id = ?`);

    const insertRelStmt = db.prepare(`
      INSERT INTO ortho_template_orthotics (
        template_id, orthotics_code, dosage_or_regimen, is_mandatory, sort_order,
        priority_level, service_scope, ebm_priority, weight_bearing_mode, device_type_iso,
        hinge_settings, wearing_regimen, is_stop_warning, stop_rationale, cdss_contraindication_tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let totalRels = 0;
    let p1Count = 0;
    let p2Count = 0;
    let p3Count = 0;
    let stopCount = 0;

    for (let id = 1; id <= 180; id++) {
      const tData = templatesMap.get(id);
      if (!tData) {
        console.warn(`Template ID #${id} not found in parsed markdown!`);
        continue;
      }

      // Update ortho_templates table
      updateTemplateStmt.run(
        tData.priority,
        tData.wbMode,
        tData.summary,
        tData.hasStop,
        tData.stopRationale,
        id
      );

      if (tData.hasStop === 1) stopCount++;
      if (tData.priority === 'P1') p1Count++;
      else if (tData.priority === 'P2') p2Count++;
      else if (tData.priority === 'P3') p3Count++;

      // Delete existing relations
      deleteRelStmt.run(id);

      // Link items
      const rels = linkOrthoticsToTemplate(tData);
      rels.forEach((r, idx) => {
        totalRels++;
        insertRelStmt.run(
          id,
          r.code,
          r.wearing_regimen,
          r.is_mandatory,
          idx,
          r.priority_level,
          r.service_scope,
          r.ebm_priority,
          r.weight_bearing_mode,
          r.device_type_iso,
          r.hinge_settings,
          r.wearing_regimen,
          r.is_stop_warning,
          r.stop_rationale,
          JSON.stringify([r.device_type_iso, r.weight_bearing_mode, r.ebm_priority])
        );
      });
    }

    updateTemplateStmt.finalize();
    deleteRelStmt.finalize();
    insertRelStmt.finalize();

    console.log(`\n=== Synchronization Results ===`);
    console.log(`Total Templates processed: 180`);
    console.log(`Priority P1 (Critical): ${p1Count}`);
    console.log(`Priority P2 (High Biomechanical): ${p2Count}`);
    console.log(`Priority P3 (Ergonomic): ${p3Count}`);
    console.log(`Templates with CDSS STOP Red Flags: ${stopCount}`);
    console.log(`Total template_orthotics relations created: ${totalRels}`);

    db.close();
  });
}

runSync();
