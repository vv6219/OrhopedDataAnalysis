/**
 * syncRomStandards180_v2.js
 * Comprehensive Clinical Goniometry & Biomechanics Sync (Neutral-0 ROM / SFTR)
 * for all 180 Orthopedic Templates in Ortho Workstation 2.0.
 *
 * Source files:
 *  - md/Гониометрия ROM1 _5.md (Clusters 1–4)
 *  - md/Гониометрия ROM5_10.md (Clusters 5–10)
 *  - md/Кластеры180.md (Master Registry)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../db/orthopedic_data_center.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Connecting to database:', dbPath);

// Paths to markdown specifications
const pathRom1_5 = path.resolve(__dirname, '../../md/Гониометрия ROM1 _5.md');
const pathRom5_10 = path.resolve(__dirname, '../../md/Гониометрия ROM5_10.md');

const contentRom1_5 = fs.existsSync(pathRom1_5) ? fs.readFileSync(pathRom1_5, 'utf8') : '';
const contentRom5_10 = fs.existsSync(pathRom5_10) ? fs.readFileSync(pathRom5_10, 'utf8') : '';

console.log(`Loaded markdown specifications: f1=${contentRom1_5.length} bytes, f2=${contentRom5_10.length} bytes`);

// Extract rows from markdown tables: | **#ID** | Title | ...
function parseMarkdownRomRows(text) {
  const map = new Map();
  const lines = text.split('\n');

  for (const line of lines) {
    if (!line.trim().startsWith('|') || !line.includes('**#')) continue;
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length < 4) continue;

    const idMatch = parts[0].match(/\*\*#(\d+)\*\*/);
    if (!idMatch) continue;

    const id = parseInt(idMatch[1], 10);
    const rawTitle = parts[1] ? parts[1].replace(/\[cite:[^\]]+\]/g, '').trim() : '';

    let priority = 'P2';
    let sftrText = '';
    let endFeel = 'EF_CAPS';
    let cutoffs = '';
    let specialTests = '';

    // Check if column 2 contains priority (common in ROM5_10.md)
    if (parts.length >= 5) {
      const pCol = parts[2];
      if (/P0-STOP|STOP|Запрет/i.test(pCol)) priority = 'P0-STOP';
      else if (/P1|Критическ/i.test(pCol)) priority = 'P1';
      else if (/P3|Дифференц/i.test(pCol)) priority = 'P3';
      else if (/P2|Функцион/i.test(pCol)) priority = 'P2';

      specialTests = parts[3].replace(/\[cite:[^\]]+\]/g, '').trim();
      cutoffs = parts[4].replace(/\[cite:[^\]]+\]/g, '').trim();
    } else {
      specialTests = parts[2].replace(/\[cite:[^\]]+\]/g, '').trim();
      cutoffs = parts[3].replace(/\[cite:[^\]]+\]/g, '').trim();
    }

    const fullText = (rawTitle + ' ' + specialTests + ' ' + cutoffs);

    // If priority wasn't explicitly in column 2, infer from clinical text
    if (priority === 'P2') {
      if (/P0-STOP|запрет форсированн|абсолютный запрет|опасный сектор|во избежание вывиха/i.test(fullText)) {
        priority = 'P0-STOP';
      } else if (/P1|разрыв|блокад|контрактур|анкилоз|псевдопаралич|вывих|стеноз|лаг|перелом|дюпюитрен/i.test(fullText)) {
        priority = 'P1';
      } else if (/P3|дифференц|двухпозиционн|сильфвершельд|милл|шобер|дауборн/i.test(fullText)) {
        priority = 'P3';
      }
    }

    // Extract End-Feel code
    const efMatch = fullText.match(/EF_(BONY|CAPS|SPRING|SPASM|EMPTY|MUSHI)/);
    if (efMatch) {
      endFeel = efMatch[0];
    } else {
      if (/кость|остеофит|анкилоз/i.test(fullText)) endFeel = 'EF_BONY';
      else if (/мениск|клин|пружин|кёниг|свободн/i.test(fullText)) endFeel = 'EF_SPRING';
      else if (/дефанс|спазм|септич/i.test(fullText)) endFeel = 'EF_SPASM';
      else if (/пуст|боль до упора|подагр|бурсит/i.test(fullText)) endFeel = 'EF_EMPTY';
      else if (/ватн|разрыв связок|нестабильност|mushi/i.test(fullText)) endFeel = 'EF_MUSHI';
      else endFeel = 'EF_CAPS';
    }

    // Extract SFTR formula
    const sftrMatch = fullText.match(/[S|F|T|R]:\s*[-–0-9°]+\s*[-–]\s*[-–0-9°]+\s*[-–]\s*[-–0-9°]+/);
    if (sftrMatch) {
      sftrText = sftrMatch[0].replace(/–/g, '-');
    }

    map.set(id, {
      id,
      rawTitle,
      priority,
      endFeel,
      sftrText,
      specialTests,
      cutoffs,
      hasStopWarning: priority === 'P0-STOP' || /запрет|stop|опасный сектор/i.test(fullText)
    });
  }

  return map;
}

const parsedMap1 = parseMarkdownRomRows(contentRom1_5);
const parsedMap2 = parseMarkdownRomRows(contentRom5_10);
const allParsedRows = new Map([...parsedMap1, ...parsedMap2]);

console.log(`Parsed total of ${allParsedRows.size} template specs from markdown.`);

const END_FEEL_LABELS = {
  EF_BONY: 'Жесткий костный («Кость о кость» / Hard bony)',
  EF_CAPS: 'Плотный капсульный (Firm leathery capsular)',
  EF_SPRING: 'Упруго-пружинящий блок (Springy rebound)',
  EF_SPASM: 'Рефлекторный мышечный дефанс (Muscle spasm)',
  EF_EMPTY: '«Пустой» упор от острой боли (Empty pain-stopped)',
  EF_MUSHI: 'Мягкий «ватный» без упора (Soft / Mushy laxity)'
};

// Build rich ROM JSON payload for a template
function buildEnrichedRomPayload(tpl, parsed) {
  const id = tpl.id;
  const title = tpl.title || '';
  const jName = (tpl.joint_name || '').toLowerCase();
  const cluster = (tpl.cluster_id || '').toLowerCase();

  let jointCategory = 'knee';
  if (jName === 'knee' || cluster === 'cluster_knee') jointCategory = 'knee';
  else if (jName === 'shoulder' || cluster === 'cluster_shoulder') jointCategory = 'shoulder';
  else if (jName === 'hip' || cluster === 'cluster_hip_pelvis') jointCategory = 'hip';
  else if (jName === 'ankle' || cluster === 'cluster_foot_ankle') {
    jointCategory = /hallux|подагр|ригид|пальц|сесамоид/i.test(title) ? 'foot_mtp' : 'ankle';
  } else if (jName === 'elbow' || cluster === 'cluster_elbow') jointCategory = 'elbow';
  else if (jName === 'wrist' || cluster === 'cluster_wrist_hand') jointCategory = 'wrist';
  else if (jName === 'spine' || cluster === 'cluster_spine') jointCategory = 'spine';
  else if (cluster === 'cluster_pediatric') {
    if (/бедро|тбс|дисплази|юэгбк|пертес/i.test(title)) jointCategory = 'hip';
    else if (/стоп|косолапост/i.test(title)) jointCategory = 'ankle';
    else if (/локт/i.test(title)) jointCategory = 'elbow';
    else jointCategory = 'knee';
  } else if (cluster === 'cluster_systemic') {
    jointCategory = /гипермобильн|элерс/i.test(title) ? 'systemic_hypermobile' : 'knee';
  } else if (cluster === 'cluster_postop') {
    if (/тэкс|мениск|пкс/i.test(title)) jointCategory = 'knee';
    else if (/тэтс|вертлуж/i.test(title)) jointCategory = 'hip';
    else if (/плеч|rsa|tsa|ротатор/i.test(title)) jointCategory = 'shoulder';
    else if (/ахилл|лодыжк/i.test(title)) jointCategory = 'ankle';
    else if (/локт/i.test(title)) jointCategory = 'elbow';
    else if (/дистальн.*радиус|vlp/i.test(title)) jointCategory = 'wrist';
    else jointCategory = 'knee';
  }

  // Priority and End-Feel resolution
  let priority = parsed?.priority || 'P2';
  let endFeel = parsed?.endFeel || 'EF_CAPS';
  let hasStop = parsed?.hasStopWarning || false;

  // Specific high-risk P0-STOP overrides
  if (id === 41 || id === 113 || id === 122 || id === 180 || /юэгбк|шов ахилл|вывих эндопротез|онконасторожен/i.test(title)) {
    priority = 'P0-STOP';
    hasStop = true;
  }

  // Specific P1 diagnostic overrides
  if ([1, 3, 5, 7, 8, 9, 10, 15, 18, 20, 23, 29, 30, 32, 43, 49, 57, 60, 63, 64, 66, 73, 74, 82, 83, 95, 104, 114, 117, 120, 129, 150, 151, 152, 153, 154, 155, 167, 171, 172, 174, 176].includes(id)) {
    if (priority !== 'P0-STOP') priority = 'P1';
  }

  let sftr = parsed?.sftrText || '';
  let cutoffs = parsed?.cutoffs || '';
  let specialTxt = parsed?.specialTests || '';

  // Tags compilation
  const tags = [`sftr_${jointCategory}`, 'end_feel_evaluation'];
  if (priority === 'P1') tags.push('priority_p1_critical');
  if (priority === 'P0-STOP') tags.push('cdss_stop_rom');
  if (/arom.*prom|лаг|lag|диссоциац/i.test(specialTxt + ' ' + cutoffs)) tags.push('arom_prom_dissociation');
  if (/капсульн.*паттерн/i.test(specialTxt + ' ' + cutoffs)) tags.push('capsular_pattern');

  // Axes and flat numeric values definition per joint
  let axes = [];
  let flatValues = {};
  let severityLevel = 'moderate';

  if (jointCategory === 'knee') {
    let flexAct = 115, flexPass = 120, extDef = 5;
    if (/тяжел|iii стади|контрактур|#1|#3|#104/i.test(title)) {
      flexAct = 90; flexPass = 95; extDef = 10; severityLevel = 'severe';
    } else if (/норма|тендинопат|ушиб|#12|#13|#14/i.test(title)) {
      flexAct = 135; flexPass = 140; extDef = 0; severityLevel = 'mild';
    }
    if (!sftr) sftr = `S: 0°-${extDef}°-${flexPass}°`;

    flatValues = { flexion_active: flexAct, flexion_passive: flexPass, extension_deficit: extDef };
    axes = [
      {
        key: 'flexion_active',
        labelRu: 'Активное сгибание (AROM)',
        labelLat: 'Flexio activa',
        normMin: 130, normMax: 140, unit: '°',
        val: flexAct,
        priority: 'P1',
        cutoff_condition: '<90° — стойкая функциональная контрактура ходьбы по лестнице',
        clinical_note: 'Оценка силы четырехглавой мышцы и разгибательного аппарата'
      },
      {
        key: 'flexion_passive',
        labelRu: 'Пассивное сгибание (PROM)',
        labelLat: 'Flexio passiva',
        normMin: 140, normMax: 145, unit: '°',
        val: flexPass,
        priority: 'P2',
        clinical_note: 'Ограничение натяжением задней капсулы и ретракцией квадрицепса'
      },
      {
        key: 'extension_deficit',
        labelRu: 'Дефицит разгибания (контрактура)',
        labelLat: 'Deficit extensio',
        normMin: 0, normMax: 0, unit: '°',
        val: extDef,
        isDeficit: true,
        priority: 'P1',
        cutoff_condition: '≥10° — фиксированная контрактура, показание к заднему капсулярному релизу',
        clinical_note: 'Prone hang test: 1 см разницы уровня пяток = 1° сгибательной контрактуры'
      }
    ];
  } else if (jointCategory === 'shoulder') {
    let flexAct = 130, flexPass = 145, abd = 120, er = 45, ir = 40;
    if (/капсулит|#20|псевдопаралич|#18/i.test(title)) {
      flexAct = 90; flexPass = 100; abd = 70; er = 15; ir = 30; severityLevel = 'severe';
    }
    if (!sftr) sftr = `S: 40°-0°-${flexPass}°, F: ${abd}°-0°-30°, R: ${er}°-0°-${ir}°`;

    flatValues = { flexion_active: flexAct, flexion_passive: flexPass, abduction: abd, external_rotation: er, internal_rotation: ir };
    axes = [
      {
        key: 'flexion_active',
        labelRu: 'Активное сгибание / Элевация',
        labelLat: 'Elevatio anterior',
        normMin: 165, normMax: 180, unit: '°',
        val: flexAct,
        priority: 'P1',
        cutoff_condition: '<90° — псевдопаралич ротаторной манжеты (Collin) / парез подмышечного нерва'
      },
      {
        key: 'abduction',
        labelRu: 'Отведение во фронтальной плоскости',
        labelLat: 'Abductio',
        normMin: 160, normMax: 180, unit: '°',
        val: abd,
        priority: 'P2',
        cutoff_condition: 'Болезненная дуга Дауборна строго в окне 60°–120° = субакромиальный импинджмент'
      },
      {
        key: 'external_rotation',
        labelRu: 'Наружная ротация при 0° (ER1)',
        labelLat: 'Rotatio externa',
        normMin: 60, normMax: 70, unit: '°',
        val: er,
        priority: 'P1',
        cutoff_condition: '<20°–30° — маркер адгезивного капсулита («замороженное плечо») по Cyriax'
      },
      {
        key: 'internal_rotation',
        labelRu: 'Внутренняя ротация (IR)',
        labelLat: 'Rotatio interna',
        normMin: 60, normMax: 70, unit: '°',
        val: ir,
        priority: 'P2',
        clinical_note: 'GIRD: дефицит внутренней ротации >18°–20° относительно здоровой руки'
      }
    ];
  } else if (jointCategory === 'hip') {
    let flexAct = 100, flexPass = 105, abd = 30, er = 35, ir = 15;
    if (/коксартроз iii|#30|#31/i.test(title)) {
      flexAct = 85; flexPass = 90; abd = 15; er = 20; ir = 5; severityLevel = 'severe';
    }
    if (!sftr) sftr = `S: 0°-5°-${flexPass}°, F: ${abd}°-0°-15°, R: ${er}°-0°-${ir}°`;

    flatValues = { flexion_active: flexAct, flexion_passive: flexPass, abduction: abd, external_rotation: er, internal_rotation: ir };
    axes = [
      {
        key: 'internal_rotation',
        labelRu: 'Внутренняя ротация при 90° (IR)',
        labelLat: 'Rotatio interna',
        normMin: 30, normMax: 40, unit: '°',
        val: ir,
        priority: 'P1',
        cutoff_condition: '<15° — самый ранний объективный маркер коксартроза и FAI (импинджмента)'
      },
      {
        key: 'flexion_active',
        labelRu: 'Сгибание (Flexio)',
        labelLat: 'Flexio',
        normMin: 115, normMax: 125, unit: '°',
        val: flexAct,
        priority: 'P1',
        cutoff_condition: '<90° — затруднение надевания обуви и носков (критерий Charnley/Harris)'
      },
      {
        key: 'abduction',
        labelRu: 'Отведение (Abductio)',
        labelLat: 'Abductio',
        normMin: 40, normMax: 45, unit: '°',
        val: abd,
        priority: 'P2',
        cutoff_condition: '<20° — ограничение ширины шага и хромота Тренделенбурга'
      }
    ];
  } else if (jointCategory === 'elbow') {
    let flexAct = 125, flexPass = 130, extDef = 10, sup = 70, pro = 70;
    if (/артроз локтя|дуга мори|#66/i.test(title)) {
      flexAct = 115; flexPass = 120; extDef = 25; severityLevel = 'severe';
    }
    if (!sftr) sftr = `S: 0°-${extDef}°-${flexPass}°, R: ${sup}°-0°-${pro}°`;

    flatValues = { flexion_active: flexAct, flexion_passive: flexPass, extension_deficit: extDef, supination: sup, pronation: pro };
    axes = [
      {
        key: 'flexion_active',
        labelRu: 'Сгибание локтя (Flexio)',
        labelLat: 'Flexio cubiti',
        normMin: 140, normMax: 145, unit: '°',
        val: flexAct,
        priority: 'P1',
        cutoff_condition: '<130° — выпадение функциональной дуги Мори (Morrey Arc)'
      },
      {
        key: 'extension_deficit',
        labelRu: 'Дефицит разгибания (контрактура)',
        labelLat: 'Deficit extensio',
        normMin: 0, normMax: 0, unit: '°',
        val: extDef,
        isDeficit: true,
        priority: 'P1',
        cutoff_condition: '>30° — критерий стойкой утраты функции по шкале Mayo Elbow Performance Score'
      },
      {
        key: 'supination',
        labelRu: 'Супинация предплечья',
        labelLat: 'Supinatio',
        normMin: 80, normMax: 85, unit: '°',
        val: sup,
        priority: 'P2',
        cutoff_condition: '<50° — невозможность удержать предмет на ладони'
      },
      {
        key: 'pronation',
        labelRu: 'Пронация предплечья',
        labelLat: 'Pronatio',
        normMin: 75, normMax: 80, unit: '°',
        val: pro,
        priority: 'P2',
        cutoff_condition: '<50° — затруднение печати на клавиатуре и работы за столом'
      }
    ];
  } else if (jointCategory === 'wrist') {
    let dors = 60, palm = 65, rad = 15, uln = 25;
    if (/дюпюитрен|#74/i.test(title)) {
      dors = 45; palm = 70; severityLevel = 'severe';
    }
    if (!sftr) sftr = `S: ${dors}°-0°-${palm}°, F: ${rad}°-0°-${uln}°`;

    flatValues = { dorsal_flexion: dors, palmar_flexion: palm, radial_deviation: rad, ulnar_deviation: uln };
    axes = [
      {
        key: 'dorsal_flexion',
        labelRu: 'Тыльное разгибание запястья',
        labelLat: 'Extensio dorsalis',
        normMin: 65, normMax: 70, unit: '°',
        val: dors,
        priority: 'P1',
        cutoff_condition: '<40° — дефицит функционального захвата кисти (дуга Палмера)'
      },
      {
        key: 'palmar_flexion',
        labelRu: 'Ладонное сгибание запястья',
        labelLat: 'Flexio palmaris',
        normMin: 70, normMax: 75, unit: '°',
        val: palm,
        priority: 'P2',
        clinical_note: 'Тест Фалена: онемение в пальцах при удержании 60 сек под 90°'
      },
      {
        key: 'ulnar_deviation',
        labelRu: 'Локтевое отведение (девиация)',
        labelLat: 'Deviatio ulnaris',
        normMin: 30, normMax: 35, unit: '°',
        val: uln,
        priority: 'P2',
        clinical_note: 'Тест Финкельштейна: провокация тендовагинита де Кервена'
      }
    ];
  } else if (jointCategory === 'ankle' || jointCategory === 'foot_mtp') {
    let dors = 12, plan = 40, sup = 25, pro = 10;
    if (/ахилл|шов|#122/i.test(title)) {
      dors = 0; plan = 35; severityLevel = 'severe';
    }
    if (!sftr) sftr = `S: ${dors}°-0°-${plan}°, R: ${sup}°-0°-${pro}°`;

    flatValues = { dorsal_flexion: dors, plantar_flexion: plan, supination: sup, pronation: pro };
    axes = [
      {
        key: 'dorsal_flexion',
        labelRu: 'Тыльное сгибание (Дорсифлексия)',
        labelLat: 'Flexio dorsalis',
        normMin: 20, normMax: 25, unit: '°',
        val: dors,
        priority: 'P1',
        cutoff_condition: '<10° — эквинусная установка, перегрузка переднего отдела стопы и фасции'
      },
      {
        key: 'plantar_flexion',
        labelRu: 'Подошвенное сгибание (Плантарфлексия)',
        labelLat: 'Flexio plantaris',
        normMin: 40, normMax: 50, unit: '°',
        val: plan,
        priority: 'P2',
        clinical_note: 'Сила отталкивания стопы при беге и ходьбе в гору'
      }
    ];
  } else if (jointCategory === 'spine') {
    let schober = 3.5, lFlex = 65, lExt = 15;
    if (/бехтерев|спондилит|#81|#118/i.test(title)) {
      schober = 1.5; lFlex = 30; lExt = 5; severityLevel = 'severe';
    }
    if (!sftr) sftr = `Шобер: +${schober} см, S: ${lExt}°-0°-${lFlex}°`;

    flatValues = { schober_cm: schober, lumbar_flexion: lFlex, lumbar_extension: lExt };
    axes = [
      {
        key: 'schober_cm',
        labelRu: 'Ленточная проба Шобера (прирост длины)',
        labelLat: 'Schober index',
        normMin: 5.0, normMax: 7.0, unit: 'см',
        val: schober,
        priority: 'P1',
        cutoff_condition: '<4.0 см — подозрение на анкилозирующий спондилит (болезнь Бехтерева)',
        clinical_note: 'Стандарт оценки поясничной подвижности по шкале BASMI'
      },
      {
        key: 'lumbar_flexion',
        labelRu: 'Сгибание поясницы (Flexio)',
        labelLat: 'Flexio lumbalis',
        normMin: 80, normMax: 90, unit: '°',
        val: lFlex,
        priority: 'P2',
        clinical_note: 'Расстояние пальцы-пол (норма 0–5 см)'
      }
    ];
  } else {
    flatValues = { beighton_score: 5, knee_hyperextension: 10, elbow_hyperextension: 10 };
    axes = [
      {
        key: 'beighton_score',
        labelRu: 'Шкала гипермобильности Бейтона',
        labelLat: 'Beighton score',
        normMin: 0, normMax: 3, unit: 'баллов',
        val: 5,
        priority: 'P1',
        cutoff_condition: '≥5/9 баллов — синдром генерализованной гипермобильности (Бейтон / Элерс-Данло)'
      }
    ];
    sftr = 'Beighton: 5/9 баллов';
  }

  // Clinical interpretation
  let interp = parsed?.cutoffs || '';
  if (!interp) {
    interp = `Движения сустава (${jointCategory}) по международной системе Neutral-0: ${sftr}. Конечный упор: ${END_FEEL_LABELS[endFeel] || endFeel}.`;
  }

  // CDSS Stop Warning Note
  let cdssWarning = null;
  if (hasStop) {
    if (id === 41 || /тэтс/i.test(title)) {
      cdssWarning = 'ЗАПРЕТ СППВР: Внутренняя ротация и приведение бедра >0° строго противопоказаны в первые 6 недель (высокий риск заднего вывиха головки эндопротеза).';
    } else if (id === 113 || /юэгбк/i.test(title)) {
      cdssWarning = 'ЗАПРЕТ СППВР: Форсированная внутренняя ротация и осевая нагрузка категорически запрещены (угроза острого эпифизеолиза и асептического некроза головки бедра).';
    } else if (id === 122 || /ахилл/i.test(title)) {
      cdssWarning = 'ЗАПРЕТ СППВР: Пассивная дорсифлексия >0° запрещена до 8–12 недель после шва сухожилия (угроза разрыва или несостоятельного удлинения регенерата).';
    } else if (id === 180 || /онко/i.test(title)) {
      cdssWarning = 'ЗАПРЕТ СППВР: Любые мануальные стресс-пробы и форсированная ротация запрещены до верификации биопсией (риск патологического перелома).';
    } else {
      cdssWarning = 'ЗАПРЕТ СППВР: Форсированные движения за пределами охранительного сектора запрещены в остром периоде.';
    }
  }

  // Final structured JSON
  const romPayload = {
    joint_category: jointCategory,
    priority: priority,
    priority_level: priority === 'P1' ? 'critical' : (priority === 'P0-STOP' ? 'safety_stop' : (priority === 'P3' ? 'differential' : 'high')),
    rom_tags: tags,
    sftr_notation: sftr,
    severity_level: severityLevel,
    end_feel_expected: endFeel,
    end_feel_label: END_FEEL_LABELS[endFeel] || endFeel,
    axes: axes,
    special_measurements: [
      {
        name: 'Дифференциальный угловой тест нозологии',
        priority: priority === 'P1' ? 'P2' : 'P3',
        description: specialTxt ? specialTxt.slice(0, 180) : 'Стандартные клинические тесты по протоколу'
      }
    ],
    cutoffs_text: cutoffs || 'Нормативная амплитуда движений согласно рекомендациям АТОР / AAOS.',
    clinical_interpretation: interp,
    cdss_stop_warning: cdssWarning,
    cdss_safety_note: cdssWarning,
    ...flatValues
  };

  return {
    romPayload,
    priority,
    sftrPreview: sftr,
    endFeel,
    hasStopWarning: hasStop ? 1 : 0
  };
}

// Execute synchronization against SQLite
db.all('SELECT id, title, joint_name, cluster_id, default_mkb_code, stage_or_severity FROM ortho_templates ORDER BY id ASC', (err, rows) => {
  if (err) {
    console.error('Error querying ortho_templates:', err.message);
    process.exit(1);
  }

  console.log(`Starting transactional synchronization for ${rows.length} templates...`);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    const stmt = db.prepare(`
      UPDATE ortho_templates SET
        rom_norm_preset = ?,
        rom_priority = ?,
        rom_sftr_preview = ?,
        rom_end_feel = ?,
        rom_has_stop_warning = ?
      WHERE id = ?
    `);

    let updatedCount = 0;
    const stats = { P1: 0, P2: 0, P3: 0, 'P0-STOP': 0, withStopWarning: 0 };

    for (const tpl of rows) {
      const parsed = allParsedRows.get(tpl.id);
      const { romPayload, priority, sftrPreview, endFeel, hasStopWarning } = buildEnrichedRomPayload(tpl, parsed);

      stats[priority] = (stats[priority] || 0) + 1;
      if (hasStopWarning) stats.withStopWarning++;

      stmt.run([
        JSON.stringify(romPayload),
        priority,
        sftrPreview,
        endFeel,
        hasStopWarning,
        tpl.id
      ]);

      updatedCount++;
    }

    stmt.finalize();

    db.run('COMMIT;', (commitErr) => {
      if (commitErr) {
        console.error('Commit failed:', commitErr.message);
        db.run('ROLLBACK;');
        process.exit(1);
      }

      console.log('=== SYNCHRONIZATION COMPLETED SUCCESSFULLY ===');
      console.log(`Total templates updated: ${updatedCount}`);
      console.log('Priority breakdown:', stats);

      // Verify a sample of updated templates
      db.all(`
        SELECT id, title, rom_priority, rom_sftr_preview, rom_end_feel, rom_has_stop_warning
        FROM ortho_templates
        WHERE id IN (1, 18, 41, 66, 74, 110, 113, 122, 180)
        ORDER BY id ASC
      `, (vErr, samples) => {
        if (vErr) console.error(vErr);
        else {
          console.log('\n--- VERIFICATION SAMPLES ---');
          console.table(samples);
        }
        db.close();
      });
    });
  });
});
