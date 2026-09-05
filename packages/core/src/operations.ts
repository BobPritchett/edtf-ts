import { parse } from './parser.js';
import type { EDTFBase, ParseError, ParseOptions } from './types/index.js';

/** Existing parsed objects, FuzzyDate instances, and EDTF strings are accepted. */
export type EDTFInput = string | EDTFBase | { readonly inner: EDTFBase };

/** Invalid input to an operation; core parse() itself remains nonthrowing. */
export class EDTFOperationError extends Error {
  constructor(public readonly errors: ParseError[]) {
    super(errors.map((error) => error.message).join('; '));
    this.name = 'EDTFOperationError';
  }
}

/** @internal */
export function resolveEDTF(input: EDTFInput, options?: ParseOptions): EDTFBase {
  if (typeof input !== 'string') return 'inner' in input ? input.inner : input;
  const result = parse(input, options);
  if (!result.success) throw new EDTFOperationError(result.errors);
  return result.value;
}
