import { ParseError, type ParseNaturalOptions, type ParseResult } from './parser-factory.js';

export type NoMatchReason =
  | 'outOfGrammar'
  | 'explicitNoDate'
  | 'impossibleDate'
  | 'unsupportedPolicy'
  | 'filteredOut';
export type NaturalParseOutcome =
  | { kind: 'matched'; result: ParseResult }
  | { kind: 'ambiguous'; interpretations: ParseResult[] }
  | { kind: 'noMatch'; reason: NoMatchReason; error?: ParseError }
  | { kind: 'error'; error: ParseError };

/** @internal Bind the result API to the same grammar entry point as its throwing parser. */
export function createNaturalOutcomeParser(
  parser: (input: string, options?: ParseNaturalOptions) => ParseResult[]
) {
  return (input: string, options: ParseNaturalOptions = {}): NaturalParseOutcome => {
    try {
      const results = parser(input, options);
      return results.length > 1 || results[0]!.ambiguous
        ? { kind: 'ambiguous', interpretations: results }
        : { kind: 'matched', result: results[0]! };
    } catch (error) {
      // Do not hide programming errors behind a fabricated no-match outcome.
      if (!(error instanceof ParseError)) throw error;
      if (
        error.code === 'INVALID_OPTIONS' ||
        (error.code === 'INVALID_INPUT' && typeof input !== 'string')
      )
        return { kind: 'error', error };
      const explicitNoDate =
        /^\s*(?:unknown|undated|no date|date unknown|sin fecha|fecha desconocida|sans date|date inconnue)\s*$/iu.test(
          input
        );
      const reason: NoMatchReason = explicitNoDate
        ? 'explicitNoDate'
        : error.code === 'IMPOSSIBLE_DATE'
          ? 'impossibleDate'
          : error.code === 'UNSUPPORTED_POLICY'
            ? 'unsupportedPolicy'
            : error.code === 'FILTERED_OUT'
              ? 'filteredOut'
              : 'outOfGrammar';
      return { kind: 'noMatch', reason, error };
    }
  };
}
