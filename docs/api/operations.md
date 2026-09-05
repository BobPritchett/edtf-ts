# Canonicalization, bounds, enumeration, and relations

These functions extend `@edtf-ts/core` without changing existing `FuzzyDate` interfaces or methods. Unless otherwise indicated, they accept an `EDTFInput`: an EDTF string, a parsed `EDTFBase`, or a `FuzzyDate` instance (through its `inner` property). Invalid strings throw `EDTFOperationError`, whose `errors` property contains the structured core parsing errors.

## canonicalize() and canonicalLevel()

```typescript
import { canonicalize, canonicalLevel, FuzzyDate } from '@edtf-ts/core';

const date = FuzzyDate.parse('?2004-?06-?11');
canonicalize(date); // '2004-06-11?'
canonicalLevel(date); // 1
date.toString(); // '?2004-?06-?11'
```

```typescript
function canonicalize(input: EDTFInput, options?: ParseOptions): string;
function canonicalLevel(input: EDTFInput, options?: ParseOptions): EDTFLevel;
```

Canonicalization combines equivalent component qualifications while preserving their scope. It operates recursively on interval endpoints and collection members, preserving collection order, duplicates, and written ranges. It does not mutate the original value, sort collections, compact ranges, or replace significant-digit/exponential year notation. `canonicalLevel` reports the level required by the canonical spelling; the original parsed `level` continues to describe its original syntax.

Optional parse options validate string inputs. Already parsed objects are trusted; pass their `edtf` strings to revalidate them under another conformance policy. Canonical strings are useful for consistent spelling, but are not a complete semantic equality key for every EDTF construct.

## getYearRange()

```typescript
import { getYearRange, parse, isEDTFDate } from '@edtf-ts/core';

const result = parse('1950S2');
if (result.success && isEDTFDate(result.value)) {
  result.value.year; // 1950: retained estimate
  getYearRange(result.value); // { min: 1900, max: 1999 }
}
```

```typescript
interface YearRange {
  min: number;
  max: number;
}
function getYearRange(date: EDTFDate): YearRange;
```

The inclusive range describes calendar years represented by a numeric year, a masked year, or a significant-digit year. It does not add a tolerance for `?` or `~`. Negative significant-digit ranges follow signed magnitude: `Y-3388E2S3` represents -338999 through -338000.

Significant digits must be between 1 and the year width (four digits for ordinary years; the resolved magnitude's width for `Y` notation). `1950S0` and `1950S5` now return `INVALID_SIGNIFICANT_DIGITS`. Bounds and comparisons now use the full represented range, so `isBefore('1950S2', '1960')` returns `MAYBE`. This corrects previously exact-year behavior; the `year` property, original spelling, and public signatures are retained. Years and their represented range must remain within JavaScript's safe integer range.

## getBounds()

```typescript
type TemporalBound =
  | { kind: 'finite'; epochMs: bigint; date: { year: number; month: number; day: number } }
  | { kind: 'negativeInfinity' }
  | { kind: 'positiveInfinity' }
  | { kind: 'unknown' };

interface TemporalBounds {
  earliest: TemporalBound;
  latest: TemporalBound;
}

function getBounds(input: EDTFInput): TemporalBounds;
```

```typescript
import { getBounds } from '@edtf-ts/core';

getBounds('../2000').earliest; // { kind: 'negativeInfinity' }
getBounds('/2000').earliest; // { kind: 'unknown' }
getBounds('2000/..').latest; // { kind: 'positiveInfinity' }
```

Finite endpoints are inclusive outer bounds. `epochMs` retains exact time precision, including values outside the JavaScript `Date` range; `date` is its Gregorian calendar day. Existing UTC versus floating-time conventions apply. The original `min`, `max`, `minMs`, `maxMs`, and clamping metadata remain available with their existing contracts.

Collection bounds span any gaps. Use `normalize()` when individual members and gaps matter.

## enumerateValues()

```typescript
function enumerateValues(input: EDTFInput, options?: ParseOptions): IterableIterator<EDTFBase>;
```

```typescript
import { enumerateValues } from '@edtf-ts/core';

[...enumerateValues('2024-02-2X')].map((value) => value.edtf);
// '2024-02-20' through '2024-02-29'

[...enumerateValues('1950S2')].length; // 100 year-precision values

const dates = enumerateValues('[0000-01-01..9999-12-31]');
dates.next().value.edtf; // '0000-01-01', without expanding millions of days
```

Pass a **string** to avoid the legacy parser's eager collection expansion. Existing set/list `values` arrays remain eager and unchanged. Enumeration validates the input, options, and finite-enumeration requirements before returning an iterator, then yields completions lazily. Only valid calendar dates are yielded; written precision, qualifications, collection order, and duplicates are retained. Significant-digit years yield their represented exact years. An exact scalar date, date-time, or season yields one value.

`EnumerationError` has a stable `code`:

| Code                   | Meaning                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `INTERVAL`             | An interval describes an extent. Use its existing `by(unit)` traversal instead. |
| `UNBOUNDED_COLLECTION` | An open set/list has no finite enumeration.                                     |

Malformed input throws `EDTFOperationError`. Parse options apply to string and object spellings for enumeration, including strict conformance restrictions on season members.

## relate()

```typescript
interface RelationOptions {
  quantifierA?: Quantifier; // 'ANY' (default) or 'ALL'
  quantifierB?: Quantifier; // 'ANY' (default) or 'ALL'
}
interface RelationSummary {
  relations: Record<AllenRelationName, Truth>;
  definite: AllenRelationName[]; // YES
  possible: AllenRelationName[]; // YES or MAYBE
  unknown: AllenRelationName[]; // UNKNOWN
}
function relate(a: EDTFInput, b: EDTFInput, options?: RelationOptions): RelationSummary;
```

```typescript
import { relate } from '@edtf-ts/core';

relate('1950', '1960').relations.before; // 'YES'
relate('1950S2', '1960').relations.before; // 'MAYBE'
```

This convenience function normalizes each operand once and evaluates all 13 existing Allen relations. It retains four-valued logic and time-aware semantics. `UNKNOWN` is reported separately from `possible`; missing information does not become an asserted possibility. Collections can produce more than one definite relation, depending on the quantifiers. Existing individual relation functions remain unchanged.
