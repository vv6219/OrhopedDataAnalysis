import React from 'react';

// Keyboard layout transliteration maps (English QWERTY <-> Russian ЙЦУКЕН)
const EN_RU_KEYBOARD_MAP: Record<string, string> = {
  'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ',
  'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж', "'": 'э',
  'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь', ',': 'б', '.': 'ю',
};

const RU_EN_KEYBOARD_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(EN_RU_KEYBOARD_MAP).map(([en, ru]) => [ru, en])
);

/**
 * Transliterates text between English and Russian keyboard layouts
 */
export function switchKeyboardLayout(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split('')
    .map((ch) => EN_RU_KEYBOARD_MAP[ch] || RU_EN_KEYBOARD_MAP[ch] || ch)
    .join('');
}

/**
 * Russian Morphological Stemmer (Porter-style for medical/technical inflections)
 */
export function stemRussian(word: string): string {
  if (!word || word.length < 4) return word.toLowerCase();
  const lower = word.toLowerCase();

  // Strip inflectional suffixes
  const stemmed = lower
    .replace(/(?:ившись|ывшись|ивши|ывши|вшись|ив|ыв)$/, '')
    .replace(/(?:остями|остей|остях|остью|остям|ости|ость|оста|осты)$/, '')
    .replace(/(?:ейшего|ейшему|ейшим|ейшем|ейшая|ейшее|ейшей|ейшую|ейшие|ейших|ейшими|ейше)$/, '')
    .replace(/(?:ившего|ывшего|ующего|ющего|ившему|ывшему|ующему|ющему|ившим|ывшим|ующим|ющим|ившем|ывшем|ующем|ющем|ившая|ывшая|ующая|ющая|ившее|ывшее|ующее|ющее|ившей|ывшей|ующей|ющей|ившую|ывшую|ующую|ющую|ившие|ывшие|ующие|ющие|ивших|ывших|ующих|ющих|ившими|ывшими|ующими|ющими)$/, '')
    .replace(/(?:ального|альному|альным|альном|альная|альное|альной|альную|альные|альных|альными|арентного|ического|ическому|ическим|ическом|ическая|ическое|ической|ическую|ические|ических|ическими)$/, '')
    .replace(/(?:ами|ями|оми|еми|его|ого|ему|ому|ими|ыми|ых|их|ую|юю|ая|яя|ою|ею|ое|ее|ие|ые|ей|ой|ем|ом|им|ым|ий|ый|ой)$/, '')
    .replace(/(?:иями|иях|иям|ием|ией|ионного|ионному|ионным|ионном|ионная|ионное|ионной|ионную|ионные|ионных|ионными|ях|ах|ов|ев|ей|ям|ам|ом|ем|ии|ия|ие|ий|ья|ье|ьи|ью|ию|ей|ой)$/, '')
    .replace(/(?:ила|ыла|ела|али|или|ыли|ели|ить|ыть|еть|ать|ять|ует|уют|ите|ете|ишь|ешь|тся|ться|ся|сь|ет|ит|ут|ют|ат|ят|ал|ил|ыл|ел|на|но|ны|не|ем|им)$/, '')
    .replace(/(?:а|е|и|й|о|у|ы|ь|я|ю)$/, '');

  return stemmed.length >= 3 ? stemmed : lower;
}

/**
 * Simple English Stemmer
 */
export function stemEnglish(word: string): string {
  if (!word || word.length < 4) return word.toLowerCase();
  return word
    .toLowerCase()
    .replace(/(?:ational|tional|ation|ence|ance|able|ible)$/, '')
    .replace(/(?:ically|ful|ing|ive|ize|ise|ism|ity)$/, '')
    .replace(/(?:ed|es|ly|s)$/, '');
}

/**
 * Specialized Orthopedic & ERP Medical Synonyms Dictionary
 */
export const SYNONYM_DICTIONARY: Record<string, string[]> = {
  'prp': ['прп', 'плазма', 'cortexil', 'кортексил', 'аутоплазма', 'тромбоцит', 'buffy'],
  'прп': ['prp', 'плазма', 'cortexil', 'кортексил', 'аутоплазма'],
  'плазма': ['prp', 'прп', 'cortexil', 'тромбоцит', 'buffy', 'обогащенная'],
  'cortexil': ['prp', 'прп', 'кортексил', 'плазма', 'buffy coat'],
  'кортексил': ['cortexil', 'prp', 'прп', 'плазма'],
  'hilt': ['хилт', 'лазер', '1064', 'nd:yag', 'высокоинтенсивный'],
  'хилт': ['hilt', 'лазер', '1064', 'высокоинтенсивный'],
  'лазер': ['hilt', 'хилт', '1064', 'nd:yag', 'лазеротерапия'],
  'sis': ['сис', 'магнит', 'супериндуктивн', 'магнитное', 'btl', 'тесла'],
  'сис': ['sis', 'магнит', 'индуктивн', 'тесла'],
  'магнит': ['sis', 'сис', 'магнитотерапия', 'тесла', 'электромагнит'],
  'увт': ['uvt', 'eswt', 'reswt', 'feswt', 'ударно-волнов', 'ударная', 'пьезо', 'радиальная', 'фокусированная'],
  'eswt': ['увт', 'reswt', 'feswt', 'ударно-волнов', 'ударная'],
  'tecar': ['текар', 'диатермия', 'радиочастотн', 'емкостн', 'резистивн', '448'],
  'текар': ['tecar', 'диатермия', 'радиочастотн'],
  'game ready': ['гейм реди', 'криокомпрессия', 'криотерапия', 'пневмокомпрессия', 'охлаждение'],
  'крио': ['game ready', 'криокомпрессия', 'криотерапия', 'холод'],
  'лфк': ['lfk', 'кинезиотерапия', 'гимнастика', 'упражнения', 'сильбернагель', 'silbernagel', 'quad sets', 'ckc', 'эксцентрика'],
  'lfk': ['лфк', 'кинезиотерапия', 'silbernagel'],
  'сильбернагель': ['silbernagel', 'лфк', 'pain monitoring', 'ваш', 'шкала боли'],
  'silbernagel': ['сильбернагель', 'лфк', 'pain monitoring', 'ваш'],
  'rom': ['ром', 'гониометрия', 'амплитуда', 'sftr', 'neutral-0', 'контрактура', 'end-feel'],
  'ром': ['rom', 'гониометрия', 'амплитуда', 'sftr', 'neutral-0'],
  'sftr': ['rom', 'neutral-0', 'гониометрия', 'сгибание', 'разгибание', 'отведение'],
  'neutral-0': ['sftr', 'rom', 'гониометрия', 'нейтрал-0'],
  'end-feel': ['конечный упор', 'цириакс', 'cyriax', 'костный', 'пружинящий', 'спазм', 'ватный'],
  'упор': ['end-feel', 'cyriax', 'костный', 'капсульный', 'пружинящий'],
  'стельки': ['formthotics', 'формтотикс', 'ортезы стопы', 'ортопедические', 'супинатор', 'термоформовка'],
  'формтотикс': ['formthotics', 'стельки', 'ортезирование', 'термоформовка'],
  'formthotics': ['формтотикс', 'стельки', 'ортезы', 'ортопедические'],
  'брейс': ['ортез', 'тутор', 'шарнирный', 'rom', 'коленный'],
  'шено': ['cheneau', 'корсет', 'сколиоз', 'деротационный', 'tlso'],
  'cheneau': ['шено', 'корсет', 'сколиоз'],
  'атол': ['atol', '91ф', 'ккт', 'чек', 'фискальный', 'касса', 'ньюджер'],
  'atol': ['атол', '91ф', 'ккт', 'чек', 'касса'],
  'ккт': ['атол', 'atol', '91ф', 'фискализация', 'чек', 'фн', 'офд'],
  'мрт': ['mrt', 'томография', 'магнитно-резонансная', 'stoller', '1.5', '3.0', 'столлер'],
  'mrt': ['мрт', 'томография', 'stoller', 'тесла'],
  'узи': ['uzi', 'ультразвук', 'сонография', 'эхография', 'us-guided', 'датчик', 'заворот', 'допплер', 'цдк'],
  'uzi': ['узи', 'ультразвук', 'us-guided', 'сонография'],
  'ультразвук': ['узи', 'uzi', 'сонография', 'эхография', 'допплер'],
  'лахман': ['lachman', 'пкс', 'нестабильность', 'колено'],
  'lachman': ['лахман', 'пкс', 'передний выдвижной ящик'],
  'bom': ['бом', 'спецификация', 'техкарта', 'расходники', 'нормы расхода', 'материалы'],
  'бом': ['bom', 'спецификация', 'техкарта', 'расходные материалы'],
  'маржа': ['маржинальная', 'доходность', 'выплаты', 'ставка', 'процент'],
  'soft lock': ['софтлок', 'блокировка', 'lock_token', '30 минут'],
  'софтлок': ['soft lock', 'блокировка', 'lock_token'],
  'блокада': ['инъекция', 'us-guided', 'лидокаин', 'дипроспан', 'анестезия', 'гидродиссекция'],
  'пункция': ['аспирация', 'гемартроз', 'синовит', 'эвакуация', 'киста бейкера'],
  'сколиоз': ['корсет', 'шено', 'кобб', 'адамс', 'риссер', 'risser', 'деротация'],
  'адамс': ['adams', 'проба адамса', 'тест адамса', 'признак адамса', 'наклон вперед', 'сколиоз', 'реберный горб', 'торсия'],
  'адамса': ['адамс', 'adams', 'проба адамса', 'тест адамса', 'наклон вперед', 'сколиоз', 'реберный горб'],
  'adams': ['адамс', 'тест адамса', 'проба адамса', 'adams forward bend', 'сколиоз'],
  'проба адамса': ['тест адамса', 'адамс', 'adams', 'adams forward bend', 'сколиоз', 'наклон вперед'],
  'тест адамса': ['проба адамса', 'адамс', 'adams', 'adams forward bend', 'сколиоз'],
  'риссер': ['risser', 'тест риссера', 'признак риссера', 'проба риссера', 'симптом риссера', 'шкала риссера', 'risser sign', 'костная зрелость', 'зоны роста', 'сколиоз', 'апофиз'],
  'риссера': ['риссер', 'risser', 'тест риссера', 'признак риссера', 'проба риссера', 'симптом риссера', 'шкала риссера', 'risser sign', 'костная зрелость', 'зоны роста', 'сколиоз', 'апофиз'],
  'risser': ['риссер', 'тест риссера', 'признак риссера', 'risser sign', 'костная зрелость', 'сколиоз', 'апофиз'],
  'признак риссера': ['тест риссера', 'риссер', 'risser', 'risser sign', 'костная зрелость', 'зоны роста', 'сколиоз', 'апофиз'],
  'тест риссера': ['признак риссера', 'риссер', 'risser', 'risser sign', 'костная зрелость', 'сколиоз', 'апофиз'],
  'risser sign': ['риссер', 'признак риссера', 'тест риссера', 'костная зрелость', 'сколиоз'],
  'признак': ['симптом', 'тест', 'проба', 'феномен', 'sign'],
  'признаки': ['симптомы', 'тесты', 'пробы', 'signs'],
  'симптом': ['признак', 'тест', 'проба', 'феномен', 'symptom'],
  'симптомы': ['признаки', 'тесты', 'пробы', 'symptoms'],
  'проба': ['тест', 'признак', 'симптом', 'пробы', 'test'],
  'пробы': ['тесты', 'признаки', 'симптомы', 'tests'],
  'тест': ['проба', 'признак', 'симптом', 'тесты', 'test'],
  'шкала': ['шкалы', 'классификация', 'стадии', 'score', 'scale', 'тест', 'признак'],
  'плоскостопие': ['стельки', 'формтотикс', 'плантография', 'свод', 'вальгус'],
  'мениск': ['stoller', 'мак-мюррей', 'эпли', 'ручка лейки', 'артроскопия'],
  'пкс': ['лахман', 'передний выдвижной ящик', 'pivot-shift', 'связка', 'стабильность'],
  'эквайринг': ['pos', 'терминал', 'альфа-банк', 'arcus-2', 'inpas', 'слип', 'авторизация'],
  'выплаты': ['зарплата', 'начисления', 'ведомость', 'вознаграждение', 'team cap', 'ставка', 'процент', 'сторно'],
  'диагностика': ['диагностические', 'исследования', 'методы', 'исследование', 'анализ'],
  'манипуляции': ['манипуляция', 'инъекция', 'инъекции', 'блокада', 'блокады', 'пункция', 'пункции', 'prp', 'гиалуронат'],
  'тесты': ['тест', 'проба', 'пробы', 'симптомы', 'симптом', 'признаки', 'признак', 'se', 'sp', 'чувствительность', 'специфичность'],
  'шаблоны': ['шаблон', 'протокол', 'протоколы', 'нозологии', 'нозология', '180'],
  'справочник': ['реестр', 'каталог', 'база знаний']
};

export interface TokenVariant {
  text: string;
  isRegex: boolean;
  regex?: RegExp;
}

export interface ParsedSearchQuery {
  raw: string;
  originalTokens: string[];
  tokenGroups: TokenVariant[][];
  highlightTokens: string[];
  expandedTokens: string[];
}

/**
 * Strips punctuation around words while preserving internal hyphens, dots, and wildcards
 */
function cleanRawToken(tok: string): string {
  // Strip leading and trailing quotes, brackets, commas, colons, etc.
  return tok.replace(/^[«"'\(\)\[\]\{\}\.,;:!<>]+|[«"'\(\)\[\]\{\}\.,;:!<>]+$/g, '').trim();
}

/**
 * Builds a RegEx from a pattern with wildcard characters (* and ?)
 */
function compileWildcard(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex specials except * and ?
    .replace(/\*/g, '[\\wа-яёА-ЯЁ-]*')
    .replace(/\?/g, '[\\wа-яёА-ЯЁ-]');
  return new RegExp(`(?:^|\\W)(${escaped})(?:$|\\W)`, 'i');
}

/**
 * Parses user input into structured token groups with wildcards, transliteration, morphology, and clinical synonyms
 */
export function parseAndExpandQuery(query: string): ParsedSearchQuery {
  const raw = query.trim();
  if (!raw) {
    return { raw: '', originalTokens: [], tokenGroups: [], highlightTokens: [], expandedTokens: [] };
  }

  // Tokenize by spaces and commas, then clean tokens
  const rawTokens = raw.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const originalTokens = rawTokens.map(cleanRawToken).filter(Boolean);

  const tokenGroups: TokenVariant[][] = [];
  const highlightTokenSet = new Set<string>();

  for (const token of originalTokens) {
    const groupVariants: TokenVariant[] = [];
    const seenStrings = new Set<string>();

    const addStringVariant = (str: string) => {
      const s = str.trim().toLowerCase();
      if (!s || seenStrings.has(s)) return;
      seenStrings.add(s);
      groupVariants.push({ text: s, isRegex: false });
      if (s.length >= 2 && !s.includes('*') && !s.includes('?')) {
        highlightTokenSet.add(s);
      }
    };

    // 1. Wildcard Check (* or ?)
    if (token.includes('*') || token.includes('?')) {
      const cleanWildcard = token.toLowerCase();
      try {
        const regex = compileWildcard(cleanWildcard);
        groupVariants.push({ text: cleanWildcard, isRegex: true, regex });
        
        // Also add base word without wildcards for highlighting
        const baseWord = cleanWildcard.replace(/[*?]/g, '');
        if (baseWord.length >= 2) {
          addStringVariant(baseWord);
        }
      } catch {
        addStringVariant(cleanWildcard);
      }
      
      // Also try layout-switched wildcard
      const switched = switchKeyboardLayout(token);
      if (switched && switched !== token) {
        try {
          const swRegex = compileWildcard(switched);
          groupVariants.push({ text: switched, isRegex: true, regex: swRegex });
        } catch {}
      }

      tokenGroups.push(groupVariants);
      continue;
    }

    // 2. Exact token
    addStringVariant(token);

    // 3. Hyphen normalization (e.g., "54-фз" -> "54 фз", "54фз")
    if (token.includes('-')) {
      addStringVariant(token.replace(/-/g, ' '));
      addStringVariant(token.replace(/-/g, ''));
    }

    // 4. Keyboard Layout Transliteration (e.g., "ghg" -> "прп", "ehn" -> "узи")
    const switched = switchKeyboardLayout(token);
    if (switched && switched !== token) {
      addStringVariant(switched);
      if (switched.includes('-')) {
        addStringVariant(switched.replace(/-/g, ' '));
        addStringVariant(switched.replace(/-/g, ''));
      }
    }

    // 5. Morphological Stemming (Russian & English)
    if (token.length >= 4) {
      const ruStem = stemRussian(token);
      if (ruStem && ruStem !== token && ruStem.length >= 3) {
        addStringVariant(ruStem);
      }
      const enStem = stemEnglish(token);
      if (enStem && enStem !== token && enStem.length >= 3) {
        addStringVariant(enStem);
      }

      if (switched && switched !== token) {
        const ruSwitchedStem = stemRussian(switched);
        if (ruSwitchedStem && ruSwitchedStem.length >= 3) {
          addStringVariant(ruSwitchedStem);
        }
      }
    }

    // 6. Direct and partial synonyms from SYNONYM_DICTIONARY
    if (SYNONYM_DICTIONARY[token]) {
      SYNONYM_DICTIONARY[token].forEach(addStringVariant);
    }
    if (switched && SYNONYM_DICTIONARY[switched]) {
      SYNONYM_DICTIONARY[switched].forEach(addStringVariant);
    }

    // Substring synonym check for word roots (min 4 chars)
    if (token.length >= 4) {
      for (const [key, syns] of Object.entries(SYNONYM_DICTIONARY)) {
        if (token.startsWith(key) || key.startsWith(token)) {
          syns.forEach(addStringVariant);
        }
      }
    }

    tokenGroups.push(groupVariants);
  }

  const sortedHighlights = Array.from(highlightTokenSet).sort((a, b) => b.length - a.length);

  return {
    raw,
    originalTokens,
    tokenGroups,
    highlightTokens: sortedHighlights,
    expandedTokens: sortedHighlights,
  };
}

/**
 * Checks if target text matches all token groups (boolean AND between groups, OR within group)
 */
export function matchesQuery(aggregateText: string, parsedQuery: ParsedSearchQuery): boolean {
  if (!parsedQuery.tokenGroups || parsedQuery.tokenGroups.length === 0) return true;
  const lower = aggregateText.toLowerCase();

  // 1. Direct multi-word raw phrase match (e.g. "признак риссера")
  if (parsedQuery.raw && parsedQuery.raw.length >= 3 && lower.includes(parsedQuery.raw.toLowerCase())) {
    return true;
  }

  // 2. Token groups evaluation (AND between tokens, OR within variants)
  return parsedQuery.tokenGroups.every((group) => {
    return group.some((variant) => {
      if (variant.isRegex && variant.regex) {
        return variant.regex.test(lower);
      }
      return lower.includes(variant.text);
    });
  });
}

/**
 * Counts total keyword matches in given text
 */
export function countKeywordMatches(text: string, tokens: string[]): number {
  if (!text || tokens.length === 0) return 0;
  const lower = text.toLowerCase();
  let count = 0;

  for (const t of tokens) {
    if (t.length < 2) continue;
    let pos = 0;
    while ((pos = lower.indexOf(t, pos)) !== -1) {
      count++;
      pos += Math.max(1, t.length);
    }
  }

  return count;
}

/**
 * Extracts a concise snippet centered on the first match
 */
export function extractMatchSnippet(
  searchableText: string,
  tokens: string[],
  contextRadius = 85
): string | null {
  if (!searchableText || tokens.length === 0) return null;
  const lower = searchableText.toLowerCase();

  let bestIndex = -1;
  let matchedToken = '';

  for (const t of tokens) {
    if (t.length < 2) continue;
    const idx = lower.indexOf(t);
    if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
      bestIndex = idx;
      matchedToken = t;
    }
  }

  if (bestIndex === -1) return null;

  const start = Math.max(0, bestIndex - contextRadius);
  const end = Math.min(searchableText.length, bestIndex + matchedToken.length + contextRadius);

  let snippet = searchableText.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snippet = '… ' + snippet;
  if (end < searchableText.length) snippet = snippet + ' …';

  return snippet;
}

/**
 * React Component that renders text with matching tokens highlighted in warm amber
 */
export interface HighlightMatchProps {
  text: string;
  tokens: string[];
  style?: React.CSSProperties;
}

export const HighlightMatch: React.FC<HighlightMatchProps> = ({ text, tokens, style }) => {
  if (!text) return null;
  if (!tokens || tokens.length === 0) return <span style={style}>{text}</span>;

  // Filter valid tokens and sort by length descending to match longest phrases first
  const validTokens = Array.from(
    new Set(tokens.filter((t) => t && t.length >= 2 && !t.includes('*') && !t.includes('?')))
  ).sort((a, b) => b.length - a.length);

  if (validTokens.length === 0) return <span style={style}>{text}</span>;

  // Build safe regex
  const escaped = validTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');

  const parts = text.split(regex);

  return (
    <span style={style}>
      {parts.map((part, i) => {
        const isMatch = validTokens.some((t) => t.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={i}
              style={{
                backgroundColor: '#FEF08A',
                color: '#854D0E',
                fontWeight: 700,
                padding: '0 3px',
                borderRadius: '3px',
                boxShadow: '0 0 0 1px #FDE047',
              }}
            >
              {part}
            </mark>
          );
        }
        return part;
      })}
    </span>
  );
};
