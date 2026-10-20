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
  'узи': ['uzi', 'ультразвук', 'сонография', 'эхография', 'us-guided', 'датчик', 'заворот'],
  'uzi': ['узи', 'ультразвук', 'us-guided'],
  'лахман': ['lachman', 'пкс', 'нестабильность', 'колено'],
  'lachman': ['лахман', 'пкс', 'передний выдвижной ящик'],
  'bom': ['бом', 'спецификация', 'техкарта', 'расходники', 'нормы расхода', 'материалы'],
  'бом': ['bom', 'спецификация', 'техкарта', 'расходные материалы'],
  'маржа': ['маржинальная', 'доходность', 'выплаты', 'ставка', 'процент'],
  'soft lock': ['софтлок', 'блокировка', 'lock_token', '30 минут'],
  'софтлок': ['soft lock', 'блокировка', 'lock_token'],
  'блокада': ['инъекция', 'us-guided', 'лидокаин', 'дипроспан', 'анестезия', 'гидродиссекция'],
  'пункция': ['аспирация', 'гемартроз', 'синовит', 'эвакуация', 'киста бейкера'],
  'контрактура': ['тугоподвижность', 'rom', 'дефицит', 'анкилоз', 'сгибание'],
  'сколиоз': ['корсет', 'шено', 'кобб', 'адамс', 'деротация'],
  'плоскостопие': ['стельки', 'формтотикс', 'плантография', 'свод', 'вальгус'],
  'мениск': ['stoller', 'мак-мюррей', 'эпли', 'ручка лейки', 'артроскопия'],
  'пкс': ['лахман', 'передний выдвижной ящик', 'pivot-shift', 'связка', 'стабильность']
};

export interface ParsedSearchQuery {
  raw: string;
  originalTokens: string[];
  expandedTokens: string[];
  tokenGroups: string[][];
}

/**
 * Parses user input into structured token groups with transliteration and clinical synonyms
 */
export function parseAndExpandQuery(query: string): ParsedSearchQuery {
  const raw = query.trim();
  if (!raw) {
    return { raw: '', originalTokens: [], expandedTokens: [], tokenGroups: [] };
  }

  const originalTokens = raw.toLowerCase().split(/\s+/).filter(Boolean);
  const tokenGroups: string[][] = [];
  const allExpandedSet = new Set<string>();

  for (const token of originalTokens) {
    const groupSet = new Set<string>();
    groupSet.add(token);
    allExpandedSet.add(token);

    // Layout switch transliteration (e.g. "ghg" -> "прп", "ehn" -> "узи")
    const switched = switchKeyboardLayout(token);
    if (switched && switched !== token) {
      groupSet.add(switched);
      allExpandedSet.add(switched);
    }

    // Direct synonyms
    if (SYNONYM_DICTIONARY[token]) {
      SYNONYM_DICTIONARY[token].forEach((s) => {
        groupSet.add(s);
        allExpandedSet.add(s);
      });
    }

    // Switched synonyms
    if (SYNONYM_DICTIONARY[switched]) {
      SYNONYM_DICTIONARY[switched].forEach((s) => {
        groupSet.add(s);
        allExpandedSet.add(s);
      });
    }

    // Substring synonym check for word stems (min 4 chars)
    if (token.length >= 4) {
      for (const [key, syns] of Object.entries(SYNONYM_DICTIONARY)) {
        if (token.startsWith(key) || key.startsWith(token)) {
          syns.forEach((s) => {
            groupSet.add(s);
            allExpandedSet.add(s);
          });
        }
      }
    }

    tokenGroups.push(Array.from(groupSet));
  }

  return {
    raw,
    originalTokens,
    expandedTokens: Array.from(allExpandedSet),
    tokenGroups,
  };
}

/**
 * Checks if target text matches all token groups (boolean AND between groups, OR within group)
 */
export function matchesQuery(aggregateText: string, parsedQuery: ParsedSearchQuery): boolean {
  if (!parsedQuery.tokenGroups || parsedQuery.tokenGroups.length === 0) return true;
  const lower = aggregateText.toLowerCase();

  return parsedQuery.tokenGroups.every((group) =>
    group.some((variant) => lower.includes(variant))
  );
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
      pos += t.length;
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
  contextRadius = 70
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
  const validTokens = Array.from(new Set(tokens.filter((t) => t && t.length >= 2))).sort(
    (a, b) => b.length - a.length
  );

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

export interface QuickSearchChipDef {
  id: string;
  label: string;
  query: string;
  categoryName?: string;
  color: string;
  icon?: string;
}

/**
 * Curated Quick Search Chips covering key clinical, biomechanical, diagnostic, and financial queries
 */
export const QUICK_SEARCH_CHIPS: QuickSearchChipDef[] = [
  { id: 'prp', label: 'PRP Cortexil 10/20 мл', query: 'PRP Cortexil', color: '#0F766E', icon: '💉' },
  { id: 'hilt', label: 'HILT Лазер 1064 нм', query: 'HILT 1064', color: '#1E40AF', icon: '⚡' },
  { id: 'sis', label: 'SIS Магнит 3.0 Тл', query: 'SIS 3.0 Тл', color: '#1D4ED8', icon: '🧲' },
  { id: 'uvt', label: 'УВТ пьезо / радиал', query: 'УВТ пьезо', color: '#0369A1', icon: '🔊' },
  { id: 'formthotics', label: 'Стельки Formthotics', query: 'Formthotics', color: '#6D28D9', icon: '🛡️' },
  { id: 'cheneau', label: 'Корсет Шено', query: 'Шено корсет', color: '#7C3AED', icon: '🦺' },
  { id: 'silbernagel', label: 'Silbernagel ЛФК (ВАШ)', query: 'Silbernagel', color: '#047857', icon: '🏃' },
  { id: 'rom', label: 'SFTR Neutral-0 (10 суставов)', query: 'Neutral-0 SFTR', color: '#0F3C64', icon: '📐' },
  { id: 'endfeel', label: 'End-Feel Cyriax', query: 'End-Feel', color: '#B45309', icon: '🦴' },
  { id: 'mrt', label: 'МРТ 3.0 Тл Stoller', query: 'МРТ 3.0 Тл', color: '#0284C7', icon: '🩻' },
  { id: 'us_guided', label: 'Блокады под УЗИ (US-guided)', query: 'US-guided', color: '#0D9488', icon: '🎯' },
  { id: 'lachman', label: 'Тест Лахмана (ПКС)', query: 'Лахман', color: '#BE123C', icon: '🩺' },
  { id: 'atol', label: 'ККТ АТОЛ 91Ф (54-ФЗ)', query: 'АТОЛ 91Ф', color: '#B91C1C', icon: '🧾' },
  { id: 'bom', label: 'Спецификации BOM', query: 'BOM спецификация', color: '#475569', icon: '🧮' },
  { id: 'softlock', label: 'Soft Lock 30 мин', query: 'Soft Lock', color: '#4338CA', icon: '🔒' },
];
