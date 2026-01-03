# FuzzyDate API Specification

## Executive Summary

This document proposes introducing a `FuzzyDate` immutable value object to @edtf-ts, modeled structurally on TC39's Temporal proposal. The goal is to provide a cleaner, more discoverable API while preserving full backward compatibility with existing functional exports.

**Key Principle:** FuzzyDate is an *additional* API surface, not a replacement. All existing `parse()`, `isBefore()`, `formatHuman()`, etc. functions remain available.

---

## Why "FuzzyDate"?

The name captures what EDTF represents that standard dates don't:

- **Fuzzy** = uncertain, approximate, partially specified
- **Date** = temporal value (familiar concept)

Alternative names considered:
- `EDTFValue` - too technical
- `FlexibleDate` - less evocative
- `HistoricalDate` - too narrow
- `TemporalValue` - conflicts with Temporal proposal

---

## Design Goals

1. **Temporal-like structure** - Static factory methods, instance methods, immutability
2. **Discoverable API** - Methods on objects enable IDE autocomplete
3. **Preserve sophistication** - Four-valued logic, Allen relations, uncertainty modeling
4. **Backward compatible** - Existing functional API unchanged
5. **Tree-shakeable** - Don't force users to import the class if they prefer functions
6. **Natural language optional** - Keep @edtf-ts/natural as separate package

---

## Proposed Type Hierarchy

```
FuzzyDate (abstract base)
├── FuzzyDate.Date        → wraps EDTFDate
├── FuzzyDate.DateTime    → wraps EDTFDateTime
├── FuzzyDate.Interval    → wraps EDTFInterval
├── FuzzyDate.Season      → wraps EDTFSeason
├── FuzzyDate.Set         → wraps EDTFSet
└── FuzzyDate.List        → wraps EDTFList
```

Each subtype is a thin wrapper around the existing plain-object types, adding methods.

---

## API Surface: FuzzyDate Namespace

### Static Factory Methods

```typescript
// Primary parsing entry point - returns Result type
FuzzyDate.from(input: string, options?: ParseOptions): ParseResult<FuzzyDate>
FuzzyDate.from('1985-04-12')        // → { success: true, value: FuzzyDate.Date }
FuzzyDate.from('1985/1990')         // → { success: true, value: FuzzyDate.Interval }
FuzzyDate.from('1985-21')           // → { success: true, value: FuzzyDate.Season }
FuzzyDate.from('[1985,1986,1987]')  // → { success: true, value: FuzzyDate.Set }

// Throws on invalid input (alternative to result object)
FuzzyDate.parse(input: string): FuzzyDate  // throws ParseError

// Type-specific factories
FuzzyDate.Date.from(input: string): ParseResult<FuzzyDate.Date>
FuzzyDate.Interval.from(input: string): ParseResult<FuzzyDate.Interval>

// Wrap existing parsed values
FuzzyDate.wrap(inner: EDTFBase): FuzzyDate

// Validation
FuzzyDate.isValid(input: string): boolean

// Static comparison (for sort callbacks)
FuzzyDate.compare(a: FuzzyDate, b: FuzzyDate, mode?: CompareMode): number
```

### Instance Properties (Immutable)

All FuzzyDate instances expose:

```typescript
interface FuzzyDate {
  // Identity
  readonly type: 'Date' | 'DateTime' | 'Interval' | 'Season' | 'Set' | 'List'
  readonly level: 0 | 1 | 2
  readonly edtf: string           // Original EDTF string

  // Temporal bounds
  readonly min: Date              // Earliest possible instant
  readonly max: Date              // Latest possible instant
  readonly minMs: bigint          // Precise epoch ms (for extreme dates)
  readonly maxMs: bigint          // Precise epoch ms
  readonly isBoundsClamped?: boolean  // True if min/max hit JS Date limits

  // Precision
  readonly precision: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'

  // Uncertainty (type-dependent)
  readonly isUncertain: boolean
  readonly isApproximate: boolean
  readonly hasUnspecified: boolean

  // Access to underlying type (escape hatch)
  readonly inner: EDTFBase        // The wrapped plain object
}
```

Type-specific properties:

```typescript
interface FuzzyDate.Date {
  readonly year: number | string   // string for "198X"
  readonly month?: number | string
  readonly day?: number | string
  readonly qualification?: Qualification
}

interface FuzzyDate.Interval {
  readonly start: FuzzyDate | null
  readonly end: FuzzyDate | null
  readonly isOpenStart: boolean
  readonly isOpenEnd: boolean
}

interface FuzzyDate.Season {
  readonly year: number
  readonly season: number         // 21-41
  readonly seasonName: string     // "Spring", "Q1", etc.
}
```

### Instance Methods: Comparison

Return four-valued `Truth` type for honest uncertainty handling:

```typescript
interface FuzzyDate {
  // Allen's interval algebra (returns 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN')
  isBefore(other: FuzzyDate | EDTFBase | Date): Truth
  isAfter(other: FuzzyDate | EDTFBase | Date): Truth
  meets(other: FuzzyDate | EDTFBase): Truth
  overlaps(other: FuzzyDate | EDTFBase): Truth
  during(other: FuzzyDate | EDTFBase): Truth
  contains(other: FuzzyDate | EDTFBase): Truth
  equals(other: FuzzyDate | EDTFBase): Truth
  starts(other: FuzzyDate | EDTFBase): Truth
  finishes(other: FuzzyDate | EDTFBase): Truth

  // Convenience (coerces to boolean, loses MAYBE/UNKNOWN nuance)
  isDefinitelyBefore(other: FuzzyDate | EDTFBase | Date): boolean  // isBefore() === 'YES'
  isDefinitelyAfter(other: FuzzyDate | EDTFBase | Date): boolean
  isPossiblyBefore(other: FuzzyDate | EDTFBase | Date): boolean    // isBefore() !== 'NO'
  isPossiblyAfter(other: FuzzyDate | EDTFBase | Date): boolean

  // Numeric comparison (for sorting)
  compareTo(other: FuzzyDate | EDTFBase, mode?: CompareMode): number
}
```

### Instance Methods: Formatting

```typescript
interface FuzzyDate {
  // Human-readable output
  format(options?: FormatOptions): string
  toLocaleString(locale?: string, options?: FormatOptions): string

  // Machine-readable output
  toString(): string              // Returns this.edtf
  toJSON(): object                // Serializable representation
  toISO(): string                 // Best-effort ISO 8601

  // Range formatting for intervals
  toRangeString(options?: RangeOptions): string
}
```

### Instance Methods: Transformation (Immutable)

```typescript
interface FuzzyDate {
  // Create modified copy
  with(components: Partial<DateComponents>): FuzzyDate
  withQualification(q: Qualification): FuzzyDate

  // Type conversion
  toInterval(): FuzzyDate.Interval      // Date → single-point interval
  toConvexHull(): FuzzyDate.Interval    // Collapse set/list to bounding interval

  // Normalization (for comparison internals)
  normalize(): NormalizedShape
}
```

### Instance Methods: Iteration (Intervals only)

```typescript
interface FuzzyDate.Interval {
  // Generate dates within interval
  by(unit: 'year' | 'month' | 'day'): IterableIterator<FuzzyDate.Date>

  // Array of dates
  toArray(unit: 'year' | 'month' | 'day'): FuzzyDate.Date[]
}
```

---

## Natural Language Integration

### Keeping @edtf-ts/natural Separate

The natural language parser remains a separate package for bundle size reasons. However, FuzzyDate integrates cleanly:

```typescript
// In @edtf-ts/natural
import { FuzzyDate } from '@edtf-ts';

interface NaturalParseResult {
  fuzzyDate: FuzzyDate            // The parsed FuzzyDate object
  edtf: string                    // EDTF string (redundant but convenient)
  confidence: number              // 0-1
  interpretation: string          // Human explanation
  alternatives?: NaturalParseResult[]  // Other interpretations
}

function parseNatural(input: string, options?: NaturalOptions): NaturalParseResult[]
```

**Design Decision:** Confidence is metadata on the parse result, not on FuzzyDate itself. This keeps FuzzyDate pure - it represents an EDTF value regardless of how it was created.

---

## Implementation Strategy

### Phase 1: FuzzyDate Wrapper Classes

Create wrapper classes that delegate to existing functions:

```typescript
// Simplified implementation sketch
class FuzzyDateBase implements FuzzyDate {
  protected readonly _inner: EDTFBase;

  constructor(inner: EDTFBase) {
    this._inner = inner;
    Object.freeze(this);  // Immutable
  }

  get type() { return this._inner.type; }
  get edtf() { return this._inner.edtf; }
  get min() { return this._inner.min; }
  get max() { return this._inner.max; }
  // ... etc

  isBefore(other: FuzzyDate | EDTFBase | Date): Truth {
    const otherInner = this._unwrap(other);
    return isBefore(this._inner, otherInner);
  }

  format(options?: FormatOptions): string {
    return formatHuman(this._inner, options);
  }

  private _unwrap(other: FuzzyDate | EDTFBase | Date): EDTFBase {
    if (other instanceof FuzzyDateBase) return other._inner;
    if (other instanceof Date) return /* convert Date to EDTFBase */;
    return other;  // Already EDTFBase
  }

  static from(input: string): ParseResult<FuzzyDate> {
    const result = parse(input);
    if (!result.success) return result;
    return { success: true, value: FuzzyDateBase.wrap(result.value), level: result.level };
  }

  static parse(input: string): FuzzyDate {
    const result = parse(input);
    if (!result.success) {
      throw new ParseError(result.errors);
    }
    return FuzzyDateBase.wrap(result.value);
  }

  static wrap(inner: EDTFBase): FuzzyDate {
    switch (inner.type) {
      case 'Date': return new FuzzyDateDate(inner);
      case 'DateTime': return new FuzzyDateTime(inner);
      case 'Interval': return new FuzzyDateInterval(inner);
      case 'Season': return new FuzzyDateSeason(inner);
      case 'Set': return new FuzzyDateSet(inner);
      case 'List': return new FuzzyDateList(inner);
    }
  }
}
```

### Phase 2: Type-Specific Subclasses

```typescript
class FuzzyDateDate extends FuzzyDateBase {
  get year() { return (this._inner as EDTFDate).year; }
  get month() { return (this._inner as EDTFDate).month; }
  get day() { return (this._inner as EDTFDate).day; }
  get qualification() { return (this._inner as EDTFDate).qualification; }
}

class FuzzyDateInterval extends FuzzyDateBase {
  get start(): FuzzyDate | null {
    const s = (this._inner as EDTFInterval).start;
    return s ? FuzzyDateBase.wrap(s) : null;
  }

  get end(): FuzzyDate | null {
    const e = (this._inner as EDTFInterval).end;
    return e ? FuzzyDateBase.wrap(e) : null;
  }

  get isOpenStart(): boolean {
    return (this._inner as EDTFInterval).openStart ?? false;
  }

  get isOpenEnd(): boolean {
    return (this._inner as EDTFInterval).openEnd ?? false;
  }

  *by(unit: 'year' | 'month' | 'day'): IterableIterator<FuzzyDateDate> {
    // Implementation using existing interval iteration logic
  }
}
```

### Phase 3: Namespace Export

```typescript
// In @edtf-ts main export
export const FuzzyDate = {
  from: FuzzyDateBase.from,
  parse: FuzzyDateBase.parse,
  wrap: FuzzyDateBase.wrap,
  isValid,
  compare: (a: FuzzyDate, b: FuzzyDate, mode?: CompareMode) =>
    compare(a.inner, b.inner, mode),

  Date: FuzzyDateDate,
  DateTime: FuzzyDateTime,
  Interval: FuzzyDateInterval,
  Season: FuzzyDateSeason,
  Set: FuzzyDateSet,
  List: FuzzyDateList,
};

// Type export for consumers
export type FuzzyDate = FuzzyDateBase;
export namespace FuzzyDate {
  export type Date = FuzzyDateDate;
  export type DateTime = FuzzyDateTime;
  export type Interval = FuzzyDateInterval;
  export type Season = FuzzyDateSeason;
  export type Set = FuzzyDateSet;
  export type List = FuzzyDateList;
}
```

---

## Backward Compatibility

### Existing API Unchanged

```typescript
// All of these continue to work exactly as before:
import {
  parse,
  isBefore,
  formatHuman,
  isEDTFDate,
  // ... all existing exports
} from '@edtf-ts';

const result = parse('1985-04-12');
if (result.success) {
  const truth = isBefore(result.value, otherDate);
  const formatted = formatHuman(result.value);
}
```

### Migration Path

Users can adopt FuzzyDate incrementally:

```typescript
// Step 1: Start using FuzzyDate.parse() for new code
const date = FuzzyDate.parse('1985-04-12');

// Step 2: Or use FuzzyDate.from() for result-based error handling
const result = FuzzyDate.from('1985-04-12');
if (result.success) {
  result.value.format();
}

// Step 3: Wrap existing parsed values if needed
const legacyResult = parse('1985-04-12');
if (legacyResult.success) {
  const fuzzy = FuzzyDate.wrap(legacyResult.value);
}

// Step 4: Access inner value if legacy code needs plain object
legacyFunction(date.inner);
```

---

## Design Decisions Summary

| Question | Decision |
|----------|----------|
| `from()` return type | Returns `ParseResult<FuzzyDate>`, `parse()` throws |
| Confidence integration | Metadata on parse result, not on FuzzyDate |
| Method input types | Accept `FuzzyDate`, `EDTFBase`, and `Date` |
| Boolean coercion | Separate methods: `isDefinitelyBefore()`, `isPossiblyBefore()` |
| Arithmetic operations | Deferred to future version |
| Allen relation exposure | Individual methods (13 total) |

---

## File Structure

```
packages/edtf-ts/src/
├── fuzzy-date/
│   ├── index.ts              # Main FuzzyDate namespace export
│   ├── base.ts               # FuzzyDateBase class
│   ├── date.ts               # FuzzyDate.Date
│   ├── date-time.ts          # FuzzyDate.DateTime
│   ├── interval.ts           # FuzzyDate.Interval
│   ├── season.ts             # FuzzyDate.Season
│   ├── set.ts                # FuzzyDate.Set
│   ├── list.ts               # FuzzyDate.List
│   └── types.ts              # FuzzyDate type definitions
├── index.ts                  # Add FuzzyDate to main exports
└── ... (existing files unchanged)

packages/natural/src/
├── index.ts                  # Add FuzzyDate integration
└── ... (existing files)
```

---

## Summary

FuzzyDate provides a Temporal-inspired API layer over the existing EDTF-TS implementation:

1. **Wrapper classes** delegate to existing functions (no duplication)
2. **Namespace pattern** (`FuzzyDate.Date`, `FuzzyDate.Interval`) mirrors Temporal
3. **Immutable instances** with methods for comparison, formatting, transformation
4. **Four-valued logic preserved** - methods return `Truth`, not boolean
5. **Natural language stays separate** - @edtf-ts/natural returns FuzzyDate instances
6. **Full backward compatibility** - all existing exports unchanged

The implementation is primarily an API surface improvement, making the library's powerful temporal reasoning capabilities more accessible through a modern, discoverable interface.
