export interface RomAxisDef {
  key: string;
  labelRu: string;
  labelLat: string;
  normMin: number;
  normMax: number;
  unit: string;
  normText: string;
  isDeficit?: boolean;
  clinicalNote?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P0-STOP' | string;
  cutoff_condition?: string;
}

export interface EndFeelOption {
  id: string;
  code: string;
  label: string;
  sub: string;
  icon: string;
  color: string;
  desc: string;
  description: string;
  isPathological: boolean;
}

export const END_FEEL_OPTIONS: EndFeelOption[] = [
  { id: 'bone', code: 'EF_BONY', label: 'Костный', sub: 'Hard bony', icon: '🦴', color: '#475569', desc: 'Твердый упор («кость о кость»). Остеофиты артроза, анкилоз.', description: 'Твердый упор («кость о кость»). Остеофиты артроза, анкилоз.', isPathological: false },
  { id: 'capsule', code: 'EF_CAPS', label: 'Капсульный', sub: 'Firm leathery', icon: '🛡️', color: '#D97706', desc: 'Плотное капсулярное натяжение. Адгезивный капсулит, фиброз, артроз.', description: 'Плотное капсулярное натяжение. Адгезивный капсулит, фиброз, артроз.', isPathological: false },
  { id: 'springy', code: 'EF_SPRING', label: 'Пружинящий', sub: 'Springy rebound', icon: '🌀', color: '#EA580C', desc: 'Упругий блок. Блокада мениска («ручка лейки»), свободное тело, Кёниг.', description: 'Упругий блок. Блокада мениска («ручка лейки»), свободное тело, Кёниг.', isPathological: true },
  { id: 'spasm', code: 'EF_SPASM', label: 'Мышечный дефанс', sub: 'Muscle spasm', icon: '⚡', color: '#DC2626', desc: 'Рефлекторная остановка движения спазмированными мышцами от острой боли.', description: 'Рефлекторная остановка движения спазмированными мышцами от острой боли.', isPathological: true },
  { id: 'empty', code: 'EF_EMPTY', label: '«Пустой» упор', sub: 'Empty pain', icon: '⚠️', color: '#9333EA', desc: 'Движение прервано пациентом из-за резкой боли до достижения упора.', description: 'Движение прервано пациентом из-за резкой боли до достижения упора.', isPathological: true },
  { id: 'mushy', code: 'EF_MUSHI', label: 'Ватный упор', sub: 'Soft / Mushy', icon: '🌊', color: '#0284C7', desc: 'Отсутствие конечной точки упора при стресс-пробе. Полный разрыв связок.', description: 'Отсутствие конечной точки упора при стресс-пробе. Полный разрыв связок.', isPathological: true }
];

export function getRomPriorityBadge(priority?: string): { code: string; label: string; bg: string; color: string; border: string } {
  switch (priority) {
    case 'P0-STOP':
      return { code: 'P0-STOP', label: '🚨 P0-STOP Ограничение', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' };
    case 'P1':
      return { code: 'P1', label: '⭐ P1 Критический', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' };
    case 'P3':
      return { code: 'P3', label: '🔍 P3 Дифференциал', bg: '#F0FDFA', color: '#0D9488', border: '#99F6E4' };
    default:
      return { code: 'P2', label: '🎯 P2 Функция', bg: '#F0F9FF', color: '#0284C7', border: '#BAE6FD' };
  }
}

export interface JointRomConfig {
  category: string;
  titleRu: string;
  titleLat: string;
  iconColor: string;
  axes: RomAxisDef[];
  defaultNorm: Record<string, any>;
  defaultMild: Record<string, any>;
  defaultSevere: Record<string, any>;
}

// Runtime object fallback so value imports from stale bundles / HMR never throw SyntaxError
export const JointRomConfig = {};
export const RomAxisDef = {};

export const ROM_CONFIGS: Record<string, JointRomConfig> = {
  knee: {
    category: 'knee',
    titleRu: 'Коленный сустав',
    titleLat: 'Articulatio genus',
    iconColor: '#0284C7',
    axes: [
      { key: 'flexion_active', labelRu: 'Активное сгибание', labelLat: 'Flexio activa', normMin: 130, normMax: 145, unit: '°', normText: '130°–145°', clinicalNote: 'Функциональный предел активной флексии' },
      { key: 'flexion_passive', labelRu: 'Пассивное сгибание', labelLat: 'Flexio passiva', normMin: 140, normMax: 150, unit: '°', normText: '140°–150°', clinicalNote: 'Тест мягкотканого упора в крайних углах' },
      { key: 'extension_deficit', labelRu: 'Дефицит разгибания', labelLat: 'Deficit extensionis', normMin: 0, normMax: 0, unit: '°', normText: '0° (норма)', isDeficit: true, clinicalNote: 'Маркер сгибательной контрактуры или блока мениска' }
    ],
    defaultNorm: { flexion_active: 135, flexion_passive: 140, extension_deficit: 0 },
    defaultMild: { flexion_active: 120, flexion_passive: 125, extension_deficit: 0 },
    defaultSevere: { flexion_active: 90, flexion_passive: 95, extension_deficit: 15 }
  },
  shoulder: {
    category: 'shoulder',
    titleRu: 'Плечевой сустав и пояс',
    titleLat: 'Articulatio humeri',
    iconColor: '#9333EA',
    axes: [
      { key: 'abduction', labelRu: 'Отведение во фронтальной пл.', labelLat: 'Abductio', normMin: 160, normMax: 180, unit: '°', normText: '160°–180°', clinicalNote: 'Болезненная дуга Дауборна 70°–120°' },
      { key: 'flexion_active', labelRu: 'Элевация / Сгибание вперед', labelLat: 'Anteversio / Elevatio', normMin: 160, normMax: 180, unit: '°', normText: '160°–180°', clinicalNote: 'Лопаточно-плечевой ритм' },
      { key: 'external_rotation', labelRu: 'Наружная ротация', labelLat: 'Rotatio externa', normMin: 60, normMax: 90, unit: '°', normText: '60°–90°', clinicalNote: 'Ранний маркер замороженного плеча / манжеты' },
      { key: 'internal_rotation', labelRu: 'Внутренняя ротация', labelLat: 'Rotatio interna', normMin: 60, normMax: 80, unit: '°', normText: '60°–80°', clinicalNote: 'Ориентир: заведение кисти за спину до Th7–Th10' },
      { key: 'extension_deficit', labelRu: 'Ретракция / Дефицит', labelLat: 'Deficit extensionis', normMin: 0, normMax: 10, unit: '°', normText: '0°–10°', isDeficit: true, clinicalNote: 'Капсулярная ретракция заднего отдела' }
    ],
    defaultNorm: { abduction: 170, flexion_active: 170, external_rotation: 75, internal_rotation: 75, extension_deficit: 0 },
    defaultMild: { abduction: 150, flexion_active: 160, external_rotation: 65, internal_rotation: 65, extension_deficit: 0 },
    defaultSevere: { abduction: 75, flexion_active: 85, external_rotation: 15, internal_rotation: 25, extension_deficit: 20 }
  },
  hip: {
    category: 'hip',
    titleRu: 'Тазобедренный сустав',
    titleLat: 'Articulatio coxae',
    iconColor: '#16A34A',
    axes: [
      { key: 'flexion_active', labelRu: 'Сгибание бедра', labelLat: 'Flexio', normMin: 115, normMax: 125, unit: '°', normText: '115°–125°', clinicalNote: 'Сгибание до контакта бедра с животом' },
      { key: 'abduction', labelRu: 'Отведение бедра', labelLat: 'Abductio', normMin: 40, normMax: 45, unit: '°', normText: '40°–45°', clinicalNote: 'Амплитуда отведения при фиксированном тазе' },
      { key: 'internal_rotation', labelRu: 'Внутренняя ротация (артроз)', labelLat: 'Rotatio interna', normMin: 30, normMax: 35, unit: '°', normText: '30°–35°', clinicalNote: 'Главный ранний маркер коксартроза / FAI!' },
      { key: 'external_rotation', labelRu: 'Наружная ротация', labelLat: 'Rotatio externa', normMin: 40, normMax: 45, unit: '°', normText: '40°–45°', clinicalNote: 'Ротация бедра наружу при сгибании 90°' },
      { key: 'extension_deficit', labelRu: 'Дефицит разгибания', labelLat: 'Deficit extensionis', normMin: 0, normMax: 0, unit: '°', normText: '0° (норма)', isDeficit: true, clinicalNote: 'Сгибательная контрактура бедра (тест Томаса)' }
    ],
    defaultNorm: { flexion_active: 120, abduction: 45, internal_rotation: 35, external_rotation: 45, extension_deficit: 0 },
    defaultMild: { flexion_active: 110, abduction: 35, internal_rotation: 20, external_rotation: 35, extension_deficit: 0 },
    defaultSevere: { flexion_active: 70, abduction: 15, internal_rotation: 5, external_rotation: 15, extension_deficit: 15 }
  },
  ankle: {
    category: 'ankle',
    titleRu: 'Голеностопный сустав и стопа',
    titleLat: 'Articulatio talocruralis',
    iconColor: '#0D9488',
    axes: [
      { key: 'dorsal_flexion', labelRu: 'Тыльное сгибание (дорсифлексия)', labelLat: 'Dorsiflexio', normMin: 20, normMax: 25, unit: '°', normText: '20°–25°', clinicalNote: 'Ограничено при ригидности ахиллова сухожилия' },
      { key: 'plantar_flexion', labelRu: 'Подошвенное сгибание', labelLat: 'Plantarflexio', normMin: 45, normMax: 50, unit: '°', normText: '45°–50°', clinicalNote: 'Функция икроножно-камбаловидного комплекса' },
      { key: 'supination', labelRu: 'Супинация / Инверсия стопы', labelLat: 'Supinatio / Inversio', normMin: 30, normMax: 35, unit: '°', normText: '30°–35°', clinicalNote: 'Амплитуда подтаранного сустава' },
      { key: 'pronation', labelRu: 'Пронация / Эверсия стопы', labelLat: 'Pronatio / Eversio', normMin: 15, normMax: 20, unit: '°', normText: '15°–20°', clinicalNote: 'Стабильность малоберцовых сухожилий' }
    ],
    defaultNorm: { dorsal_flexion: 20, plantar_flexion: 45, supination: 30, pronation: 15 },
    defaultMild: { dorsal_flexion: 15, plantar_flexion: 40, supination: 25, pronation: 15 },
    defaultSevere: { dorsal_flexion: 5, plantar_flexion: 20, supination: 10, pronation: 8 }
  },
  foot_mtp: {
    category: 'foot_mtp',
    titleRu: 'I плюснефаланговый сустав и стопа',
    titleLat: 'Articulatio metatarsophalangea I',
    iconColor: '#059669',
    axes: [
      { key: 'mtp1_dorsiflexion', labelRu: 'Разгибание I ПФС (I палец)', labelLat: 'Extensio MTP-1', normMin: 65, normMax: 70, unit: '°', normText: '65°–70°', clinicalNote: 'Критично при Hallux Valgus / Hallux Rigidus / Подагре' },
      { key: 'mtp1_plantarflexion', labelRu: 'Сгибание I ПФС', labelLat: 'Flexio MTP-1', normMin: 35, normMax: 45, unit: '°', normText: '35°–45°', clinicalNote: 'Функция короткого сгибателя большого пальца' },
      { key: 'dorsal_flexion', labelRu: 'Тыльное сгибание голеностопа', labelLat: 'Dorsiflexio', normMin: 20, normMax: 25, unit: '°', normText: '20°–25°', clinicalNote: 'Общая дорсифлексия стопы' },
      { key: 'plantar_flexion', labelRu: 'Подошвенное сгибание', labelLat: 'Plantarflexio', normMin: 45, normMax: 50, unit: '°', normText: '45°–50°', clinicalNote: 'Толчковая фаза шага' }
    ],
    defaultNorm: { mtp1_dorsiflexion: 65, mtp1_plantarflexion: 35, dorsal_flexion: 20, plantar_flexion: 45 },
    defaultMild: { mtp1_dorsiflexion: 40, mtp1_plantarflexion: 25, dorsal_flexion: 15, plantar_flexion: 40 },
    defaultSevere: { mtp1_dorsiflexion: 20, mtp1_plantarflexion: 15, dorsal_flexion: 10, plantar_flexion: 30 }
  },
  elbow: {
    category: 'elbow',
    titleRu: 'Локтевой сустав',
    titleLat: 'Articulatio cubiti',
    iconColor: '#EA580C',
    axes: [
      { key: 'flexion_active', labelRu: 'Сгибание в локтевом суставе', labelLat: 'Flexio', normMin: 140, normMax: 150, unit: '°', normText: '140°–150°', clinicalNote: 'Рабочая амплитуда самообслуживания (≥120°)' },
      { key: 'extension_deficit', labelRu: 'Дефицит разгибания', labelLat: 'Deficit extensionis', normMin: 0, normMax: 0, unit: '°', normText: '0° (норма)', isDeficit: true, clinicalNote: 'Посттравматическая сгибательная контрактура' },
      { key: 'supination', labelRu: 'Супинация предплечья', labelLat: 'Supinatio', normMin: 85, normMax: 90, unit: '°', normText: '85°–90°', clinicalNote: 'Ротация ладонью вверх' },
      { key: 'pronation', labelRu: 'Пронация предплечья', labelLat: 'Pronatio', normMin: 85, normMax: 90, unit: '°', normText: '85°–90°', clinicalNote: 'Ротация ладонью вниз' }
    ],
    defaultNorm: { flexion_active: 145, extension_deficit: 0, supination: 85, pronation: 85 },
    defaultMild: { flexion_active: 135, extension_deficit: 0, supination: 85, pronation: 85 },
    defaultSevere: { flexion_active: 105, extension_deficit: 15, supination: 65, pronation: 70 }
  },
  wrist: {
    category: 'wrist',
    titleRu: 'Лучезапястный сустав и кисть',
    titleLat: 'Articulatio radiocarpalis',
    iconColor: '#DB2777',
    axes: [
      { key: 'palmar_flexion', labelRu: 'Ладонное сгибание', labelLat: 'Palmarflexio', normMin: 70, normMax: 80, unit: '°', normText: '70°–80°', clinicalNote: 'Провокация Фалена при карпальном синдроме' },
      { key: 'dorsal_flexion', labelRu: 'Тыльное разгибание', labelLat: 'Dorsiflexio', normMin: 65, normMax: 75, unit: '°', normText: '65°–75°', clinicalNote: 'Необходимо для сильного захвата кисти' },
      { key: 'radial_deviation', labelRu: 'Лучевое отведение', labelLat: 'Deviatio radialis', normMin: 20, normMax: 25, unit: '°', normText: '20°–25°', clinicalNote: 'Отвод кисти в сторону I пальца' },
      { key: 'ulnar_deviation', labelRu: 'Локтевое отведение', labelLat: 'Deviatio ulnaris', normMin: 30, normMax: 35, unit: '°', normText: '30°–35°', clinicalNote: 'Провокация де Кервена (тест Финкельштейна)' }
    ],
    defaultNorm: { palmar_flexion: 75, dorsal_flexion: 70, radial_deviation: 20, ulnar_deviation: 30 },
    defaultMild: { palmar_flexion: 65, dorsal_flexion: 60, radial_deviation: 20, ulnar_deviation: 25 },
    defaultSevere: { palmar_flexion: 45, dorsal_flexion: 45, radial_deviation: 15, ulnar_deviation: 20 }
  },
  spine: {
    category: 'spine',
    titleRu: 'Позвоночный столб',
    titleLat: 'Columna vertebralis',
    iconColor: '#475569',
    axes: [
      { key: 'schober_cm', labelRu: 'Проба Шобера (прирост длины)', labelLat: 'Schober index', normMin: 5.0, normMax: 7.0, unit: 'см', normText: '≥ 5.0 см', clinicalNote: 'Критерий анкилозирующего спондилита (болезнь Бехтерева)' },
      { key: 'lumbar_flexion', labelRu: 'Сгибание поясницы (Flexio)', labelLat: 'Flexio lumbalis', normMin: 80, normMax: 90, unit: '°', normText: '80°–90°', clinicalNote: 'Расстояние пальцы-пол (норма: 0–5 см)' },
      { key: 'lumbar_extension', labelRu: 'Разгибание (Extensio)', labelLat: 'Extensio', normMin: 25, normMax: 30, unit: '°', normText: '25°–30°', clinicalNote: 'Ограничено при фасеточном синдроме' },
      { key: 'lateral_flexion_left', labelRu: 'Боковой наклон влево', labelLat: 'Lateroflexio sin.', normMin: 25, normMax: 35, unit: '°', normText: '25°–35°', clinicalNote: 'Фронтальная подвижность' },
      { key: 'lateral_flexion_right', labelRu: 'Боковой наклон вправо', labelLat: 'Lateroflexio dex.', normMin: 25, normMax: 35, unit: '°', normText: '25°–35°', clinicalNote: 'Фронтальная подвижность' },
      { key: 'cervical_flexion', labelRu: 'Сгибание шейного отдела', labelLat: 'Flexio cervicalis', normMin: 40, normMax: 45, unit: '°', normText: '40°–45°', clinicalNote: 'Расстояние подбородок-грудина (норма: 0 см)' },
      { key: 'cervical_rotation', labelRu: 'Ротация шейного отдела', labelLat: 'Rotatio cervicalis', normMin: 70, normMax: 80, unit: '°', normText: '70°–80°', clinicalNote: 'Поворот головы в каждую сторону' }
    ],
    defaultNorm: { schober_cm: 5.0, lumbar_flexion: 85, lumbar_extension: 25, lateral_flexion_left: 30, lateral_flexion_right: 30, cervical_flexion: 45, cervical_rotation: 75 },
    defaultMild: { schober_cm: 4.0, lumbar_flexion: 70, lumbar_extension: 15, lateral_flexion_left: 20, lateral_flexion_right: 20, cervical_flexion: 35, cervical_rotation: 60 },
    defaultSevere: { schober_cm: 2.0, lumbar_flexion: 35, lumbar_extension: 5, lateral_flexion_left: 10, lateral_flexion_right: 10, cervical_flexion: 20, cervical_rotation: 30 }
  },
  systemic_hypermobile: {
    category: 'systemic_hypermobile',
    titleRu: 'Гипермобильность суставов',
    titleLat: 'Hypermobilitas articularis',
    iconColor: '#7C3AED',
    axes: [
      { key: 'beighton_score', labelRu: 'Шкала Бейтона (баллы)', labelLat: 'Beighton score', normMin: 0, normMax: 3, unit: 'баллов', normText: '0–3 баллов', clinicalNote: '≥ 4 баллов указывает на генерализованную гипермобильность' },
      { key: 'knee_hyperextension', labelRu: 'Переразгибание коленей', labelLat: 'Genu recurvatum', normMin: 0, normMax: 0, unit: '°', normText: '0° (гипер >10°)', isDeficit: true, clinicalNote: 'Рекурвация коленных суставов' },
      { key: 'elbow_hyperextension', labelRu: 'Переразгибание локтей', labelLat: 'Cubitus recurvatus', normMin: 0, normMax: 0, unit: '°', normText: '0° (гипер >10°)', isDeficit: true, clinicalNote: 'Рекурвация локтевых суставов' }
    ],
    defaultNorm: { beighton_score: 1, knee_hyperextension: 0, elbow_hyperextension: 0 },
    defaultMild: { beighton_score: 4, knee_hyperextension: 5, elbow_hyperextension: 5 },
    defaultSevere: { beighton_score: 8, knee_hyperextension: 15, elbow_hyperextension: 15 }
  }
};

export function resolveRomConfig(template: { joint_name?: string; title?: string; rom_norm_preset?: any }): JointRomConfig {
  const romPreset = template?.rom_norm_preset || {};
  let category = romPreset.joint_category;

  if (!category || category === 'general' || category === 'systemic_general') {
    const title = (template?.title || '').toLowerCase();
    const jName = (template?.joint_name || '').toLowerCase();

    if (jName === 'knee' || /колен|тэкс|мениск|пкс|зкс|пателл|осгуд|гоффа|синдинг|блаунт/i.test(title)) {
      category = 'knee';
    } else if (jName === 'shoulder' || /плеч|акс|ключиц|ротатор|манжет|латарже|банкарт|субакромиал|tsa|rsa/i.test(title)) {
      category = 'shoulder';
    } else if (jName === 'hip' || /тазобедр|тбс|кокс|тэтс|пертес|юэгбк|scfe|вертлуж|fai/i.test(title)) {
      category = 'hip';
    } else if (jName === 'ankle' || /стоп|голеностоп|ахилл|пятк|север|келер|фрейберг|hallux|вальгус стоп|плоскостоп|косолапост|подагр|подошвен|плантар/i.test(title)) {
      category = /hallux|подагр|первого пальц|сесамоид/i.test(title) ? 'foot_mtp' : 'ankle';
    } else if (jName === 'elbow' || /локт|эпикондил|олекранон|лучев.*кост.*локт|няни/i.test(title)) {
      category = 'elbow';
    } else if (jName === 'wrist' || /кист|запяст|лучезапяст|дистальн.*радиус|карпал|туннел|де кёрвен|vlp|пальц|дюпюитрен/i.test(title)) {
      category = 'wrist';
    } else if (jName === 'spine' || /позвоноч|дискэктоми|спондилодез|tlif|plif|шейн|пояснич|дорсопат|сколиоз|бехтерев|кривоше/i.test(title)) {
      category = 'spine';
    } else if (/гипермобильн|элерс/i.test(title)) {
      category = 'systemic_hypermobile';
    } else {
      category = jName || 'knee';
    }
  }

  return ROM_CONFIGS[category] || ROM_CONFIGS['knee'];
}

export function evaluateRomAxisStatus(axis: RomAxisDef, val: number | undefined): { text: string; color: string; isAbnormal: boolean } {
  if (val === undefined || val === null || isNaN(val)) {
    return { text: 'Не исследовано', color: '#64748B', isAbnormal: false };
  }
  if (axis.isDeficit) {
    if (val === 0) return { text: 'Норма (дефицит 0°)', color: '#16A34A', isAbnormal: false };
    if (val <= 5) return { text: `Минимальный дефицит (${val}°)`, color: '#D97706', isAbnormal: true };
    return { text: `Контрактура / Дефицит (${val}°)!`, color: '#DC2626', isAbnormal: true };
  }
  if (val >= axis.normMin) {
    return { text: 'В пределах нормы', color: '#16A34A', isAbnormal: false };
  }
  const deficit = axis.normMin - val;
  if (deficit <= 15) {
    return { text: `Легкое ограничение (-${deficit}${axis.unit})`, color: '#0284C7', isAbnormal: true };
  }
  if (deficit <= 30) {
    return { text: `Умеренное ограничение (-${deficit}${axis.unit})`, color: '#EA580C', isAbnormal: true };
  }
  return { text: `Тяжелая контрактура (-${deficit}${axis.unit})`, color: '#DC2626', isAbnormal: true };
}
