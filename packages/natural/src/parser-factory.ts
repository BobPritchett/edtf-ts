import nearley from 'nearley';
import { normalizedSource, type NaturalErrorCode, type ParseNote } from './diagnostics.js';
import { applyDateQualifier } from './semantic-helpers.js';
export type { NaturalErrorCode, ParseNote, ParseNoteCode } from './diagnostics.js';
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
  type ParseOptions,
} from '@edtf-ts/core';
import {
  resolveNode,
  ConstraintError,
  type Candidate,
  type ResolutionContext,
  type ParseWarning,
} from './semantics.js';
export type { ParseWarning } from './semantics.js';

export interface ParseResult {
  edtf: string;
  type: 'date' | 'datetime' | 'interval' | 'season' | 'set' | 'list';
  confidence: number;
  interpretation: string;
  parsed: EDTFBase;
  fuzzyDate: IFuzzyDate;
  ambiguous?: boolean;
  warnings?: ParseWarning[];
  notes?: ParseNote[];
}
export interface ParseNaturalOptions {
  locale?: string;
  language?: Language;
  dateOrder?: DateOrder;
  returnAllResults?: boolean;
  minConfidence?: number;
  referenceDate?: Date;
  conformance?: ParseOptions['conformance'];
  weekdayMismatch?: 'reject' | 'warn';
  /** Preserve literal EDTF by default; all also considers colliding prose year ranges. */
  literalPreference?: 'edtf' | 'all';
  /** Scope of a trailing symbol on a prose range; existing end-only behavior is default. */
  rangeQualification?: 'end' | 'both' | 'ambiguous';
  /** Opt into inclusive open intervals for before/after wording and approximate cutoffs. */
  boundaryMode?: 'exclusive-choice' | 'open-interval';
}
export class ParseError extends Error {
  constructor(
    message: string,
    public input: string,
    public position?: number,
    public code: NaturalErrorCode = 'OUT_OF_GRAMMAR'
  ) {
    super(message);
    this.name = 'ParseError';
  }
}
export function normalizeInput(input: string): string {
  return normalizedSource(input).text;
}
function enrich(
  edtf: string,
  confidence: number,
  locale: string,
  ambiguous = false,
  conformance: ParseOptions['conformance'] = 'extended'
): ParseResult | undefined {
  // Only year-only members: moving a qualifier past a month/day would change scope.
  edtf = edtf.replace(
    /(^|[\[{,\/])([?~%])(-?\d{4})([?~%]?)(?=$|[\]},\/]|\.\.)/g,
    (_, boundary, before, year, after) => {
      const chars = before + after;
      return (
        boundary +
        year +
        (chars.includes('%') || (chars.includes('?') && chars.includes('~')) ? '%' : before)
      );
    }
  );
  const result = parse(edtf, { conformance });
  if (!result.success) {
    const extension = result.errors.find((error) => error.code === 'UNSUPPORTED_EXTENSION');
    if (extension) throw new ConstraintError(extension.message, true);
    return undefined;
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
      throw new ParseError('Input must be a non-empty string', input, 0, 'INVALID_INPUT');
    if (!options || typeof options !== 'object')
      throw new ParseError('Expected parsing options', input, undefined, 'INVALID_OPTIONS');
    const locale = options.locale ?? defaultLocale;
    const source = normalizedSource(input);
    const normalized = source.text;
    if (/^\d{1,2}$/.test(normalized))
      throw new ParseError(
        'A one- or two-digit year requires an era marker or four-digit spelling',
        input
      );
    if (
      !['strict', 'extended'].includes(options.conformance ?? 'extended') ||
      !['reject', 'warn'].includes(options.weekdayMismatch ?? 'reject') ||
      !['edtf', 'all'].includes(options.literalPreference ?? 'edtf') ||
      !['end', 'both', 'ambiguous'].includes(options.rangeQualification ?? 'end') ||
      !['exclusive-choice', 'open-interval'].includes(options.boundaryMode ?? 'exclusive-choice') ||
      !['MDY', 'DMY', 'YMD'].includes(options.dateOrder ?? 'MDY')
    )
      throw new ParseError('Invalid parsing policy option', input, undefined, 'INVALID_OPTIONS');
    let language: Language;
    try {
      language = resolveLanguage(locale, options.language);
    } catch (error) {
      throw new ParseError((error as Error).message, input, undefined, 'INVALID_OPTIONS');
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
      throw new ParseError(
        'minConfidence must be between 0 and 1',
        input,
        undefined,
        'INVALID_OPTIONS'
      );
    const rules = grammars[language];
    if (!rules)
      throw new ParseError(
        `Language ${language} is not included in this parser entry point`,
        input,
        undefined,
        'INVALID_OPTIONS'
      );
    let preferred: DateOrder;
    try {
      preferred = resolveDateOrder(locale, options.dateOrder);
    } catch (error) {
      throw new ParseError((error as Error).message, input, undefined, 'INVALID_OPTIONS');
    }
    const reference = options.referenceDate ?? new Date();
    if (!(reference instanceof Date) || !Number.isFinite(reference.getTime()))
      throw new ParseError('Invalid reference date', input, undefined, 'INVALID_OPTIONS');
    const referenceYear = reference.getFullYear();
    const literalText = language === 'en' ? normalized.replace(/^active\s+/i, '') : normalized;
    const collision = /^\d{4}-(?:2[1-9]|3\d|4[01])[?~%]?$/.test(literalText);
    let literal: ParseResult | undefined;
    try {
      literal = enrich(literalText, 1, renderingLocale, false, options.conformance);
      if (literal) {
        literal.notes = [
          {
            code: 'LITERAL_EDTF',
            policy: 'P1',
            message: 'The date expression was valid EDTF and received literal precedence',
          },
        ];
        if (collision)
          literal.notes.push({
            code: 'SEASON_RANGE_COLLISION',
            policy: 'P1',
            message:
              'This season code can also be read as an abbreviated year range; use literalPreference: all to consider both',
          });
        if (!collision || options.literalPreference !== 'all') return [literal];
      }
    } catch (error) {
      throw new ParseError((error as Error).message, input, undefined, 'UNSUPPORTED_POLICY');
    }
    if (!compiled.has(language)) compiled.set(language, nearley.Grammar.fromCompiled(rules));
    const parser = new nearley.Parser(compiled.get(language)!);
    let text = normalized.toLowerCase();
    if (language === 'en')
      text = text.replace(/\s+(period|epoch|age)$/i, '').replace(/(?<!common)\s+era$/i, '');
    let nodes: unknown[] = [];
    try {
      parser.feed(text);
      nodes = parser.results;
    } catch (error) {
      const token = (error as { token?: { offset?: number } }).token;
      const offset = token?.offset ?? text.length;
      if (!literal)
        throw new ParseError(
          `Failed to parse input: ${(error as Error).message}`,
          input,
          source.offsets[Math.min(offset, source.offsets.length - 1)],
          'OUT_OF_GRAMMAR'
        );
    }
    let candidates: ParseResult[] = literal ? [literal] : [];
    const sharedDayCandidates = new Set<ParseResult>();
    let sawSharedDaySet = false;
    let constraintError: ConstraintError | undefined;
    for (const node of nodes)
      for (const dateOrder of (preferred === 'YMD'
        ? ['YMD', 'MDY', 'DMY']
        : ['MDY', 'DMY']) as DateOrder[])
        for (const crossYear of ['end', 'start'] as const) {
          const context: ResolutionContext = {
            referenceYear,
            dateOrder,
            crossYear,
            weekdayMismatch: options.weekdayMismatch,
            warnings: [],
            notes: [],
            boundaryMode: options.boundaryMode,
          };
          try {
            const candidate = resolveNode(node, context) as Candidate;
            if (!candidate?.edtf) continue;
            if (candidate.sharedDaySet) sawSharedDaySet = true;
            const edtf = candidate.edtf.replace(/[?~%]{2,}/g, (q) =>
              q.includes('%') || (q.includes('?') && q.includes('~')) ? '%' : q[0]!
            );
            const ambiguous = !!(context.numericAmbiguity || context.crossYearAmbiguity);
            let score = candidate.confidence ?? 0.95;
            if (context.numericAmbiguity) score = dateOrder === preferred ? 0.6 : 0.4;
            if (context.crossYearAmbiguity) score = crossYear === 'end' ? 0.6 : 0.4;
            const value = enrich(edtf, score, renderingLocale, ambiguous, options.conformance);
            if (value) {
              if (context.warnings?.length) value.warnings = context.warnings;
              if (context.numericAmbiguity)
                context.notes!.push({
                  code: 'NUMERIC_DATE_ORDER',
                  policy: 'P3',
                  message:
                    'Both numeric orders are valid; locale/dateOrder ranks the interpretations',
                });
              if (context.notes?.length) value.notes = context.notes;
              candidates.push(value);
              if (candidate.sharedDaySet) sharedDayCandidates.add(value);
            }
          } catch (error) {
            if (error instanceof ConstraintError) constraintError = error;
          }
        }
    // Shared days outrank accidental short-year members ("12 or 14 April 1985").
    // Apply this even if calendar validation failed, so an invalid day cannot
    // silently become a year in an otherwise valid set.
    if (sawSharedDaySet) candidates = candidates.filter((value) => sharedDayCandidates.has(value));
    if (/[?~%]$/.test(text) && options.rangeQualification && options.rangeQualification !== 'end') {
      for (const value of [...candidates]) {
        if (value.type !== 'interval' || value === literal) continue;
        const qualifier = value.edtf.match(/[?~%]$/)?.[0];
        if (!qualifier) continue;
        const scoped = enrich(
          applyDateQualifier(value.edtf, qualifier),
          value.confidence,
          renderingLocale,
          false,
          options.conformance
        );
        if (!scoped) continue;
        if (value.warnings) scoped.warnings = value.warnings;
        scoped.notes = [
          ...(value.notes ?? []),
          {
            code: 'RANGE_QUALIFIER_SCOPE',
            policy: 'P2',
            message: 'Trailing prose qualifier applied to both endpoints by caller policy',
          },
        ];
        if (options.rangeQualification === 'both')
          candidates.splice(candidates.indexOf(value), 1, scoped);
        else candidates.push(scoped);
      }
    }
    const unique = new Map<string, ParseResult>();
    for (const result of candidates.sort((a, b) => b.confidence - a.confidence)) {
      const existing = unique.get(result.edtf);
      if (!existing) unique.set(result.edtf, result);
      else {
        if (result.warnings?.length) {
          const warnings = [...(existing.warnings ?? []), ...result.warnings];
          existing.warnings = [
            ...new Map(warnings.map((warning) => [JSON.stringify(warning), warning])).values(),
          ];
        }
        if (result.notes?.length) existing.notes = [...(existing.notes ?? []), ...result.notes];
      }
    }
    let results = [...unique.values()];
    // Prefer an explicit shared-unit range over an accidental short-year interval.
    if (
      !literal &&
      results.some((r) => r.confidence === 0.98) &&
      /\d\s*-\s*\d/.test(text) &&
      /[a-z]/.test(text)
    ) {
      results = results.filter((r) => r.confidence === 0.98);
    }
    for (const result of results) result.ambiguous = results.length > 1;
    for (const result of results) {
      const notes = result.notes ?? [];
      if (result.type === 'interval' && /centur|siglo|siècle|\d+c\b/i.test(text))
        notes.push({
          code: 'CENTURY_BOUNDARIES',
          policy: 'P5',
          message: 'Named centuries use historical calendar boundaries, not digit masks',
        });
      if (result.edtf.includes('XXXX') && !text.toUpperCase().includes('XXXX'))
        notes.push({
          code: 'MISSING_YEAR',
          policy: 'P6',
          message: 'The missing year is unspecified; the current year was not assumed',
        });
      if (result.type === 'interval' && /[?~%]$/.test(text) && result.edtf.endsWith(text.slice(-1)))
        notes.push({
          code: 'RANGE_QUALIFIER_SCOPE',
          policy: 'P2',
          message:
            'Range qualifier scope follows rangeQualification; the default qualifies the end only',
        });
      if (collision && !notes.some((note) => note.code === 'SEASON_RANGE_COLLISION'))
        notes.push({
          code: 'SEASON_RANGE_COLLISION',
          policy: 'P1',
          message: 'The written code has season and abbreviated-year-range readings',
        });
      if (notes.length)
        result.notes = [...new Map(notes.map((note) => [note.code + note.message, note])).values()];
    }
    const hadCandidates = results.length > 0;
    results = results.filter((r) => r.confidence >= (options.minConfidence ?? 0));
    if (!results.length)
      throw new ParseError(
        constraintError?.message ?? 'No valid parse met the confidence threshold',
        input,
        input.length,
        hadCandidates
          ? 'FILTERED_OUT'
          : constraintError?.policy
            ? 'UNSUPPORTED_POLICY'
            : nodes.length
              ? 'IMPOSSIBLE_DATE'
              : 'OUT_OF_GRAMMAR'
      );
    return options.returnAllResults === false ? results.slice(0, 1) : results;
  };
}
