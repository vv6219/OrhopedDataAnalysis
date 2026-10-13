/**
 * Utility to parse and format historical Firebird XML protocol content
 * Structure: <root><item kind="4" capt="Жалобы" bold="-1">...</item></root>
 */

export interface ParsedProtocolItem {
  capt: string;
  text: string;
}

export interface ParsedProtocolContent {
  isXml: boolean;
  complaints: string;
  anamnesis: string;
  objective: string;
  diagnosis: string;
  mkb: string;
  performed: string;
  recommendations: string;
  items: ParsedProtocolItem[];
  formattedFullText: string;
  summarySnippet: string;
}

/**
 * Decodes standard XML entities and replaces '||' delimiters with newlines
 */
export function decodeXmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\|\|/g, '\n')
    .trim();
}

/**
 * Parses raw protocol content. If XML is detected, extracts structured sections.
 * If plain text, returns structured fallback.
 */
export function parseProtocolContent(rawContent: string | null | undefined): ParsedProtocolContent {
  if (!rawContent || typeof rawContent !== 'string') {
    return {
      isXml: false,
      complaints: '',
      anamnesis: '',
      objective: '',
      diagnosis: '',
      mkb: '',
      performed: '',
      recommendations: '',
      items: [],
      formattedFullText: '',
      summarySnippet: ''
    };
  }

  const trimmed = rawContent.trim();
  const isXml = trimmed.startsWith('<root>') || trimmed.includes('<item ');

  if (!isXml) {
    const clean = decodeXmlEntities(trimmed);
    return {
      isXml: false,
      complaints: '',
      anamnesis: '',
      objective: '',
      diagnosis: clean,
      mkb: '',
      performed: '',
      recommendations: '',
      items: [],
      formattedFullText: clean,
      summarySnippet: clean.slice(0, 160)
    };
  }

  const items: ParsedProtocolItem[] = [];
  // Regex to match <item ... capt="..." ...>text</item> or self-closing <item ... />
  const itemRegex = /<item\b([^>]*?)(?:\/>|>(.*?)<\/item>)/gs;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(trimmed)) !== null) {
    const attrs = match[1] || '';
    const body = match[2] || '';
    const captMatch = attrs.match(/capt="([^"]*)"/i);
    const capt = captMatch ? captMatch[1].trim() : '';
    const text = decodeXmlEntities(body);
    if (capt || text) {
      items.push({ capt, text });
    }
  }

  let complaints = '';
  let anamnesis = '';
  let objective = '';
  let diagnosis = '';
  let mkb = '';
  let performed = '';
  let recommendations = '';

  const complaintsArr: string[] = [];
  const anamnesisArr: string[] = [];
  const objectiveArr: string[] = [];
  const diagnosisArr: string[] = [];
  const mkbArr: string[] = [];
  const performedArr: string[] = [];
  const recommendationsArr: string[] = [];

  for (const item of items) {
    const lowerCapt = item.capt.toLowerCase();
    const text = item.text;
    if (!text && !item.capt) continue;

    if (/жалоб/.test(lowerCapt)) {
      complaintsArr.push(text);
    } else if (/анамнез/.test(lowerCapt)) {
      anamnesisArr.push(text);
    } else if (/мкб|код/.test(lowerCapt)) {
      mkbArr.push(text);
    } else if (/диагноз/.test(lowerCapt)) {
      diagnosisArr.push(text);
    } else if (/сделано|обезболиван|манипуляц/.test(lowerCapt)) {
      performedArr.push(item.capt.endsWith(':') ? `${item.capt} ${text}` : `${item.capt}: ${text}`);
    } else if (/рекоменд|план|лечени|назначен|повторн/.test(lowerCapt)) {
      if (text) {
        recommendationsArr.push(text);
      } else if (item.capt) {
        recommendationsArr.push(`[${item.capt}]`);
      }
    } else if (/объективн|местн|локальн|исследован|рентген|статус/.test(lowerCapt)) {
      objectiveArr.push(item.capt ? `${item.capt} ${text}` : text);
    } else {
      // General section
      if (text) {
        objectiveArr.push(item.capt ? `${item.capt}: ${text}` : text);
      }
    }
  }

  complaints = complaintsArr.filter(Boolean).join('\n');
  anamnesis = anamnesisArr.filter(Boolean).join('\n');
  objective = objectiveArr.filter(Boolean).join('\n');
  diagnosis = diagnosisArr.filter(Boolean).join('\n');
  mkb = mkbArr.filter(Boolean).join(' ');
  performed = performedArr.filter(Boolean).join('\n');
  recommendations = recommendationsArr.filter(Boolean).join('\n');

  // Build formatted full text
  const sections: string[] = [];
  if (complaints) sections.push(`ЖАЛОБЫ:\n${complaints}`);
  if (anamnesis) sections.push(`АНАМНЕЗ:\n${anamnesis}`);
  if (objective) sections.push(`ОБЪЕКТИВНЫЙ СТАТУС:\n${objective}`);
  if (diagnosis) sections.push(`ДИАГНОЗ:\n${diagnosis}`);
  if (performed) sections.push(`ВЫПОЛНЕНО:\n${performed}`);
  if (recommendations) sections.push(`РЕКОМЕНДАЦИИ И ЛЕЧЕНИЕ:\n${recommendations}`);

  const formattedFullText = sections.length > 0 ? sections.join('\n\n') : items.map((i) => `${i.capt ? i.capt + ': ' : ''}${i.text}`).join('\n');

  // Summary snippet for grid cell / tooltip
  const summarySnippet = diagnosis || complaints || formattedFullText.slice(0, 160);

  return {
    isXml: true,
    complaints,
    anamnesis,
    objective,
    diagnosis,
    mkb,
    performed,
    recommendations,
    items,
    formattedFullText,
    summarySnippet
  };
}

/**
 * Strips XML tags and returns a single-line clean preview string
 */
export function stripProtocolXml(rawContent: string | null | undefined, maxLength = 140): string {
  if (!rawContent) return '';
  const parsed = parseProtocolContent(rawContent);
  const clean = (parsed.diagnosis || parsed.summarySnippet || parsed.formattedFullText)
    .replace(/\r?\n+/g, ' ')
    .trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength) + '...';
}
