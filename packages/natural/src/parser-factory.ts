import { compactYearRanges } from '@edtf-ts/core';
import nearley from 'nearley';
import {
  parse,
  FuzzyDate,
  formatHuman,
  resolveLanguage,
  resolveDateOrder,
  type EDTFBase,
  type IFuzzyDate,
  type Language,
  type DateOrder,
} from '@edtf-ts/core';
import {
  resolveNode,
  ConstraintError,
  type Candidate,
  type ResolutionContext,
} from './semantics.js';

export interface ParseResult {
  edtf: string;
  type: 'date' | 'datetime' | 'interval' | 'season' | 'set' | 'list';
  confidence: number;
  interpretation: string;
  parsed: EDTFBase;
  fuzzyDate: IFuzzyDate;
  ambiguous?: boolean;
}
export interface ParseNaturalOptions {
  locale?: string;
  language?: Language;
  dateOrder?: DateOrder;
  returnAllResults?: boolean;
  minConfidence?: number;
  referenceDate?: Date;
}
export class ParseError extends Error {
  constructor(
    message: string,
    public input: string,
    public position?: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}
export function normalizeInput(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
function enrich(
  edtf: string,
  confidence: number,
  locale: string,
  ambiguous = false,
  compact = false
): ParseResult | undefined {
  let result = parse(edtf);
  if (!result.success) return undefined;
  if (compact) {
    const compacted = compactYearRanges(result.value);
    if (compacted !== edtf) {
      edtf = compacted;
      result = parse(edtf);
      if (!result.success) return undefined;
    }
  }
  return {
    edtf,
    confidence,
    ambiguous,
    type: result.value.type.toLowerCase() as ParseResult['type'],
    interpretation: formatHuman(result.value, { locale }),
    parsed: result.value,
    fuzzyDate: FuzzyDate.wrap(result.value),
  };
}
/** Each entry point supplies only its compiled grammars; the resolver is shared. */
export function createNaturalParser(
  grammars: Partial<Record<Language, nearley.CompiledRules>>,
  defaultLocale = 'en-US'
) {
  const compiled = new Map<Language, nearley.Grammar>();
  return function parseNatural(input: string, options: ParseNaturalOptions = {}): ParseResult[] {
    if (typeof input !== 'string' || !input.trim())
      throw new ParseError('Input must be a non-empty string', input);
    const locale = options.locale ?? defaultLocale;
    const normalized = normalizeInput(input);
    let language: Language;
    try {
      language = resolveLanguage(locale, options.language);
    } catch (error) {
      throw new ParseError((error as Error).message, input);
    }
    const renderingLocale = options.language
      ? new Intl.Locale(locale, { language }).toString()
      : locale;
    if (
      options.minConfidence !== undefined &&
      (!Number.isFinite(options.minConfidence) ||
        options.minConfidence < 0 ||
        options.minConfidence > 1)
    )
      throw new ParseError('minConfidence must be between 0 and 1', input);
    const rules = grammars[language];
    if (!rules)
      throw new ParseError(
        `Language ${language} is not included in this parser entry point`,
        input
      );
    const literal = enrich(normalized, 1, renderingLocale);
    if (literal) return [literal];
    if (!compiled.has(language)) compiled.set(language, nearley.Grammar.fromCompiled(rules));
    const parser = new nearley.Parser(compiled.get(language)!);
    let text = normalized.toLowerCase();
    if (language === 'en')
      text = text.replace(/\s+(period|epoch|age)$/i, '').replace(/(?<!common)\s+era$/i, '');
    try {
      parser.feed(text);
    } catch (error) {
      throw new ParseError(`Failed to parse input: ${(error as Error).message}`, input);
    }
    const preferred = resolveDateOrder(locale, options.dateOrder);
    const referenceYear = (options.referenceDate ?? new Date()).getFullYear();
    if (!Number.isFinite(referenceYear)) throw new ParseError('Invalid reference date', input);
    const candidates: ParseResult[] = [];
    let constraintError: Error | undefined;
    for (const node of parser.results)
      for (const dateOrder of (preferred === 'YMD'
        ? ['YMD', 'MDY', 'DMY']
        : ['MDY', 'DMY']) as DateOrder[])
        for (const crossYear of ['end', 'start'] as const) {
          const context: ResolutionContext = { referenceYear, dateOrder, crossYear };
          try {
            const candidate = resolveNode(node, context) as Candidate;
            if (!candidate?.edtf) continue;
            const edtf = candidate.edtf.replace(/[?~%]{2,}/g, (q) =>
              q.includes('%') || (q.includes('?') && q.includes('~')) ? '%' : q[0]!
            );
            const ambiguous = !!(context.numericAmbiguity || context.crossYearAmbiguity);
            let score = candidate.confidence ?? 0.95;
            if (context.numericAmbiguity) score = dateOrder === preferred ? 0.6 : 0.4;
            if (context.crossYearAmbiguity) score = crossYear === 'end' ? 0.6 : 0.4;
            const value = enrich(edtf, score, renderingLocale, ambiguous, true);
            if (value) candidates.push(value);
          } catch (error) {
            if (error instanceof ConstraintError) constraintError = error;
          }
        }
    const unique = new Map<string, ParseResult>();
    for (const result of candidates.sort((a, b) => b.confidence - a.confidence))
      if (!unique.has(result.edtf)) unique.set(result.edtf, result);
    let results = [...unique.values()];
    // Prefer an explicit shared-day range over an accidental short-year interval.
    if (
      results.some((r) => r.confidence === 0.98) &&
      /\d\s*-\s*\d/.test(text) &&
      /[a-z]/.test(text)
    ) {
      results = results.filter((r) => r.confidence === 0.98);
    }
    for (const result of results) result.ambiguous = results.length > 1;
    results = results.filter((r) => r.confidence >= (options.minConfidence ?? 0));
    if (!results.length)
      throw new ParseError(
        constraintError?.message ?? 'No valid parse met the confidence threshold',
        input
      );
    return options.returnAllResults === false ? results.slice(0, 1) : results;
  };
}
