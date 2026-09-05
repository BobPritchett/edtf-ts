import { parse, formatYear, type EDTFDate, type Qualification } from '@edtf-ts/core';
import type { ResolutionContext, Candidate } from './semantics.js';
// Month lookup
export const months: Record<string, string> = {
  january: '01',
  jan: '01',
  february: '02',
  feb: '02',
  march: '03',
  mar: '03',
  april: '04',
  apr: '04',
  may: '05',
  june: '06',
  jun: '06',
  july: '07',
  jul: '07',
  august: '08',
  aug: '08',
  september: '09',
  sep: '09',
  sept: '09',
  october: '10',
  oct: '10',
  november: '11',
  nov: '11',
  december: '12',
  dec: '12',
};

// Seasons
export const seasons: Record<string, string> = {
  spring: '21',
  summer: '22',
  autumn: '23',
  fall: '23',
  winter: '24',
};
export const northernSeasons: Record<string, string> = {
  spring: '25',
  summer: '26',
  autumn: '27',
  fall: '27',
  winter: '28',
};
export const southernSeasons: Record<string, string> = {
  spring: '29',
  summer: '30',
  autumn: '31',
  fall: '31',
  winter: '32',
};

// Utility functions
export function pad2(n: any): any {
  return String(n).padStart(2, '0');
}
export function pad4(n: any): any {
  if (typeof n === 'string' && /^[0-9X]{4}$/i.test(n) && /X/i.test(n)) return n.toUpperCase();
  return formatYear(Number(n));
}

// Resolves a two-digit year against the reference year (the caller's
// referenceDate option, falling back to the current system date).
export function twoDigitYear(yy: any, context: any): any {
  const limit = context.referenceYear + 20;
  return limit - ((((limit - Number(yy)) % 100) + 100) % 100);
}

export function isLeapYear(year: any): any {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: any, month: any): any {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month === 2 && isLeapYear(year) ? 29 : daysInMonth[month - 1] || 0;
}

// Modifier interval builders
export function buildMonthModifierInterval(year: any, month: any, modifier: any): any {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const lastDay = getDaysInMonth(y, m);
  switch (modifier) {
    case 'early':
      return `${pad4(y)}-${pad2(m)}-01/${pad4(y)}-${pad2(m)}-10`;
    case 'mid':
      return `${pad4(y)}-${pad2(m)}-11/${pad4(y)}-${pad2(m)}-20`;
    case 'late':
      return `${pad4(y)}-${pad2(m)}-21/${pad4(y)}-${pad2(m)}-${pad2(lastDay)}`;
    default:
      return `${pad4(y)}-${pad2(m)}`;
  }
}

export function buildYearModifierInterval(year: any, modifier: any): any {
  const y = parseInt(year, 10);
  switch (modifier) {
    case 'early':
      return `${pad4(y)}-01/${pad4(y)}-04`;
    case 'mid':
      return `${pad4(y)}-05/${pad4(y)}-08`;
    case 'late':
      return `${pad4(y)}-09/${pad4(y)}-12`;
    default:
      return pad4(y);
  }
}

export function buildDecadeModifierInterval(decadeStart: any, modifier: any): any {
  const d = parseInt(decadeStart, 10);
  switch (modifier) {
    case 'early':
      return `${d}/${d + 3}`;
    case 'mid':
      return `${d + 4}/${d + 6}`;
    case 'late':
      return `${d + 7}/${d + 9}`;
    default:
      return `${d}/${d + 9}`;
  }
}

export function normalizeDecadeStart(edtf: any): any {
  return /^\d{3}X$/.test(edtf) ? `${edtf.slice(0, 3)}0` : edtf;
}

export function normalizeDecadeEnd(edtf: any): any {
  return /^\d{3}X$/.test(edtf) ? `${edtf.slice(0, 3)}9` : edtf;
}

export function buildCenturyModifierInterval(centuryNum: any, modifier: any): any {
  const c = parseInt(centuryNum, 10);
  const centuryStart = (c - 1) * 100 + 1;
  switch (modifier) {
    case 'early':
      return `${pad4(centuryStart)}/${pad4(centuryStart + 32)}`;
    case 'mid':
      return `${pad4(centuryStart + 33)}/${pad4(centuryStart + 65)}`;
    case 'late':
      return `${pad4(centuryStart + 66)}/${pad4(centuryStart + 99)}`;
    default:
      return `${pad4(centuryStart)}/${pad4(centuryStart + 99)}`;
  }
}

export function buildBCECenturyModifierInterval(centuryNum: any, modifier: any): any {
  const c = parseInt(centuryNum, 10);
  switch (modifier) {
    case 'early':
      return `-${pad4(c * 100 - 1)}/-${pad4((c - 1) * 100 + 67)}`;
    case 'mid':
      return `-${pad4((c - 1) * 100 + 66)}/-${pad4((c - 1) * 100 + 34)}`;
    case 'late':
      return `-${pad4((c - 1) * 100 + 33)}/-${pad4((c - 1) * 100)}`;
    default:
      return `${formatYear(1 - c * 100)}/${formatYear(-(c - 1) * 100)}`;
  }
}

// Combination modifier builders
export function buildMonthCombinationInterval(year: any, month: any, combo: any): any {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const lastDay = getDaysInMonth(y, m);
  switch (combo) {
    case 'early-to-mid':
      return `${pad4(y)}-${pad2(m)}-01/${pad4(y)}-${pad2(m)}-20`;
    case 'mid-to-late':
      return `${pad4(y)}-${pad2(m)}-11/${pad4(y)}-${pad2(m)}-${pad2(lastDay)}`;
    default:
      return `${pad4(y)}-${pad2(m)}`;
  }
}

export function buildYearCombinationInterval(year: any, combo: any): any {
  const y = parseInt(year, 10);
  switch (combo) {
    case 'early-to-mid':
      return `${pad4(y)}-01/${pad4(y)}-08`;
    case 'mid-to-late':
      return `${pad4(y)}-05/${pad4(y)}-12`;
    default:
      return pad4(y);
  }
}

export function buildDecadeCombinationInterval(decadeStart: any, combo: any): any {
  const d = parseInt(decadeStart, 10);
  switch (combo) {
    case 'early-to-mid':
      return `${d}/${d + 6}`;
    case 'mid-to-late':
      return `${d + 4}/${d + 9}`;
    default:
      return `${d}/${d + 9}`;
  }
}

export function buildCenturyCombinationInterval(centuryNum: any, combo: any): any {
  const c = parseInt(centuryNum, 10);
  const centuryStart = (c - 1) * 100 + 1;
  switch (combo) {
    case 'early-to-mid':
      return `${pad4(centuryStart)}/${pad4(centuryStart + 65)}`;
    case 'mid-to-late':
      return `${pad4(centuryStart + 33)}/${pad4(centuryStart + 99)}`;
    default:
      return `${pad4(centuryStart)}/${pad4(centuryStart + 99)}`;
  }
}

export function buildBCECenturyCombinationInterval(centuryNum: any, combo: any): any {
  const c = parseInt(centuryNum, 10);
  switch (combo) {
    case 'early-to-mid':
      return `-${pad4(c * 100 - 1)}/-${pad4((c - 1) * 100 + 34)}`;
    case 'mid-to-late':
      return `-${pad4((c - 1) * 100 + 66)}/-${pad4((c - 1) * 100)}`;
    default:
      return `${formatYear(1 - c * 100)}/${formatYear(-(c - 1) * 100)}`;
  }
}

export function bceToBCE(year: any): any {
  return -(parseInt(year, 10) - 1);
}

export function buildSlashDate(
  first: string,
  second: string,
  third: string,
  context: ResolutionContext
): Candidate | null {
  // The grammar captures three numbers. Resolve their roles once per candidate,
  // keeping that same ordering through qualifiers, ranges, and collections.
  if (first.length === 4 || context.dateOrder === 'YMD') {
    const year = first.length === 2 ? twoDigitYear(first, context) : Number(first);
    return { edtf: pad4(year) + '-' + pad2(second) + '-' + pad2(third), confidence: 0.95 };
  }
  const firstNum = Number(first),
    secondNum = Number(second);
  const year = third.length === 2 ? twoDigitYear(third, context) : Number(third);
  const month = context.dateOrder === 'DMY' ? secondNum : firstNum;
  const day = context.dateOrder === 'DMY' ? firstNum : secondNum;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const ambiguous = firstNum <= 12 && secondNum <= 12 && firstNum !== secondNum;
  context.numericAmbiguity ||= ambiguous;
  return {
    type: 'date',
    edtf: pad4(year) + '-' + pad2(month) + '-' + pad2(day),
    confidence: firstNum > 12 || secondNum > 12 ? 0.9 : 0.95,
    ambiguous,
  };
}

function qualifierCharacter(q?: Qualification): string {
  return q?.uncertainApproximate || (q?.uncertain && q?.approximate)
    ? '%'
    : q?.uncertain
      ? '?'
      : q?.approximate
        ? '~'
        : '';
}
function mergeQualifier(...values: string[]): string {
  const all = values.join('');
  return all.includes('%') || (all.includes('?') && all.includes('~'))
    ? '%'
    : all.includes('?')
      ? '?'
      : all.includes('~')
        ? '~'
        : '';
}
/** Resolve component scope before serializing a natural-language qualification. */
export function buildPartialQual(baseEdtf: string, quals: Record<string, string>): string {
  const parsed = parse(baseEdtf);
  if (!parsed.success || parsed.value.type !== 'Date')
    throw new Error('Component qualification requires a valid date');
  const date = parsed.value as EDTFDate;
  return (['year', 'month', 'day'] as const)
    .filter((key) => date[key] !== undefined)
    .map((key) => {
      const q = mergeQualifier(
        qualifierCharacter(date.qualification),
        qualifierCharacter(date[(key + 'Qualification') as 'yearQualification']),
        quals[key] ?? ''
      );
      const component = date[key]!;
      return (
        q +
        (key === 'year' && typeof component === 'number'
          ? formatYear(component)
          : String(component).padStart(key === 'year' ? 4 : 2, '0'))
      );
    })
    .join('-');
}
export function applyDateQualifier(edtf: string, qualifier: string): string {
  if (edtf.includes('/'))
    return edtf
      .split('/')
      .map((part) => (part && part !== '..' ? applyDateQualifier(part, qualifier) : part))
      .join('/');
  // A global suffix combines with an existing global suffix; prefix scope is retained.
  const suffix = edtf.match(/[?~%]$/)?.[0] ?? '';
  return (suffix ? edtf.slice(0, -1) : edtf) + mergeQualifier(suffix, qualifier);
}

export function getIntervalStart(edtf: any): any {
  var parts = edtf.split('/');
  return parts[0] || edtf;
}
export function getIntervalEnd(edtf: any): any {
  var parts = edtf.split('/');
  return parts[1] || parts[0] || edtf;
}
export function applyQualifierToInterval(edtf: any, qualifier: any): any {
  if (!qualifier) return edtf;
  var parts = edtf.split('/');
  if (parts.length === 2) return parts[0] + qualifier + '/' + parts[1] + qualifier;
  return edtf + qualifier;
}

export function romanNumber(text: string): number {
  const v: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  return [...text].reduce((n, c, i) => n + (v[c]! < (v[text[i + 1]!] ?? 0) ? -v[c]! : v[c]!), 0);
}
