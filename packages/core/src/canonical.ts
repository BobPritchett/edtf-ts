import { parse } from './parser.js';
import { resolveEDTF, type EDTFInput } from './operations.js';
import type { EDTFBase, EDTFDate, EDTFLevel, ParseOptions, Qualification } from './types/index.js';

const mask = (q?: Qualification): number =>
  (q?.uncertain || q?.uncertainApproximate ? 1 : 0) |
  (q?.approximate || q?.uncertainApproximate ? 2 : 0);
const symbol = ['', '?', '~', '%'];

/** @internal Preserve component scope while preferring whole/group qualification. */
export function canonicalDate(date: EDTFDate): string {
  const spelling = date.edtf.match(
    /^([?~%]?)(-?[\dX]{4})([?~%]?)(?:-([?~%]?)([\dX]{2})([?~%]?))?(?:-([?~%]?)([\dX]{2})([?~%]?))?$/
  );
  // Extended years, S-years, and exponentials retain their numerical notation.
  if (!spelling) return date.edtf;
  const components = [spelling[2]!, spelling[5], spelling[8]].filter(
    (v): v is string => v !== undefined
  );
  const global = mask(date.qualification);
  const qualifiers = [date.yearQualification, date.monthQualification, date.dayQualification]
    .slice(0, components.length)
    .map((q) => mask(q) | global);
  const before = components.map(() => 0),
    after = components.map(() => 0);
  // Group each shared leading run, independently for uncertainty and approximation.
  for (const bit of [1, 2]) {
    let prefix = 0;
    while (prefix < qualifiers.length && qualifiers[prefix]! & bit) prefix++;
    if (prefix) after[prefix - 1]! |= bit;
    for (let i = prefix; i < qualifiers.length; i++) if (qualifiers[i]! & bit) before[i]! |= bit;
  }
  return components.map((part, i) => symbol[before[i]!] + part + symbol[after[i]!]).join('-');
}

function render(value: EDTFBase): string {
  if (value.type === 'Date') return canonicalDate(value as EDTFDate);
  if (value.type === 'Set' || value.type === 'List') {
    return (
      value.edtf[0] +
      value.edtf
        .slice(1, -1)
        .split(',')
        .map((element) =>
          element
            .split('..')
            .map((text) => (text ? canonicalize(text) : ''))
            .join('..')
        )
        .join(',') +
      value.edtf.slice(-1)
    );
  }
  if (value.type === 'Interval')
    return value.edtf
      .split('/')
      .map((text) =>
        text === '' || text === '..'
          ? text
          : text
              .split('..')
              .map((part) => (part ? canonicalize(part) : ''))
              .join('..')
      )
      .join('/');
  return value.edtf;
}

/**
 * Canonical qualifier spelling without changing the input or collection structure.
 * Throws EDTFOperationError for invalid strings. Original edtf/toString() stay intact.
 */
export function canonicalize(input: EDTFInput, options?: ParseOptions): string {
  return render(resolveEDTF(input, options));
}

/** Minimum level of the canonical spelling; parse().level retains its existing meaning. */
export function canonicalLevel(input: EDTFInput, options?: ParseOptions): EDTFLevel {
  const result = parse(canonicalize(input, options));
  if (!result.success) throw new Error('Canonical EDTF failed to reparse');
  return result.level;
}
