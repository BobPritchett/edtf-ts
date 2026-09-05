/** Stable policy identifiers documented in guide/parsing-policies. */
export type ParseNoteCode =
  | 'LITERAL_EDTF'
  | 'SEASON_RANGE_COLLISION'
  | 'RANGE_QUALIFIER_SCOPE'
  | 'NUMERIC_DATE_ORDER'
  | 'CENTURY_BOUNDARIES'
  | 'EXCLUSIVE_CUTOFF'
  | 'OPEN_INTERVAL_CUTOFF'
  | 'MISSING_YEAR';
export interface ParseNote {
  code: ParseNoteCode;
  policy: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
  message: string;
}

export type NaturalErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_OPTIONS'
  | 'OUT_OF_GRAMMAR'
  | 'IMPOSSIBLE_DATE'
  | 'UNSUPPORTED_POLICY'
  | 'FILTERED_OUT';

/** @internal Normalize spelling while retaining UTF-16 offsets into the original input. */
export function normalizedSource(input: string): { text: string; offsets: number[] } {
  let text = '';
  const offsets: number[] = [];
  for (const match of input.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
    const part = match[0]
      .normalize('NFC')
      .replace(/[\u2010-\u2015\u2212]/g, '-')
      .replace(/[\u2018\u2019]/g, "'");
    for (const c of part) {
      if (/\s/u.test(c)) {
        if (!text || text.endsWith(' ')) continue;
        text += ' ';
        offsets.push(match.index!);
      } else {
        text += c;
        for (let i = 0; i < c.length; i++) offsets.push(match.index!);
      }
    }
  }
  if (text.endsWith(' ')) {
    text = text.slice(0, -1);
    offsets.pop();
  }
  offsets.push(input.length);
  return { text, offsets };
}
