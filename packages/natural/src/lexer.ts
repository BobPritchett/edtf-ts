import moo from 'moo';
export type Lexicon = Record<string, string | string[]>;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Language vocabulary is matched as tokens, retaining source offsets and text. */
export function createLexer(lexicon: Lexicon) {
  const entries = Object.entries(lexicon).flatMap(([type, values]) =>
    (Array.isArray(values) ? values : [values]).map((value) => [value, type] as const)
  );
  const types = new Map(entries);
  const pattern = new RegExp(
    '(?:' +
      [...types.keys()]
        .sort((a, b) => b.length - a.length)
        .map((value) => escape(value) + (value.endsWith("'") ? '' : '(?![a-zÀ-ÖØ-öø-ÿ])'))
        .join('|') +
      ')'
  );
  return moo.compile({
    ws: { match: /\s+/, lineBreaks: true },
    maskedDate: /(?=[0-9x-]*x)[0-9x]{4}(?:-[0-9x]{2}){0,2}[?~%]?/,
    ...(lexicon.compactCentury ? { compactCentury: /[1-9][0-9]?c\.?(?![a-z0-9])/ } : {}),
    number: /[0-9]+/,
    keyword: {
      match: pattern,
      type: (text: string) => types.get(text)!,
      value: (text: string) => types.get(text)!,
    },
    ordinalSuffix: /(?:st|nd|rd|th|er|ère|ème|è|e|º|ª)(?![a-zÀ-ÖØ-öø-ÿ])/,
    ...(lexicon.roman
      ? {
          roman: {
            match:
              /(?:xxi|xix|xviii|xvii|xvi|xiv|xiii|xii|viii|vii|iii|xx|xv|xi|ix|vi|iv|ii|x|v|i)(?=(?:st|nd|rd|th|ère|ème|er|è|e)(?![a-zà-ÿ])|\s|$)/,
            value: (text: string) => text,
          },
        }
      : {}),
    ish: /-?ish\b/,
    decadeSuffix: /'?s\b/,
    doubleDot: /\.\./,
    dash: /-/,
    slash: /\//,
    comma: /,/,
    semicolon: /;/,
    colon: /:/,
    questionMark: /\?/,
    tilde: /[~≈]/,
    percent: /%/,
    apostrophe: /'/,
    lparen: /\(/,
    rparen: /\)/,
    lbracket: /\[/,
    rbracket: /\]/,
    lbrace: /\{/,
    rbrace: /\}/,
    dot: /\./,
    word: /[a-zÀ-ÖØ-öø-ÿ]+/,
  });
}
