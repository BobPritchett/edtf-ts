# @edtf-ts/core

Modern TypeScript implementation of EDTF (Extended Date/Time Format) with full support for Levels 0, 1, and 2.

## Features

- **Full EDTF Support**: Complete implementation of Levels 0, 1, and 2
- **Type-Safe**: Fully typed with TypeScript 5.0+
- **Zero Dependencies**: No runtime dependencies
- **Tree-Shakeable**: Import only what you need
- **Comprehensive**: Dates, DateTimes, Intervals, Seasons, Sets, and Lists
- **Well-Tested**: 117 test cases covering all features
- **Rich API**: Comparison methods, iteration, interval operations

## Installation

```bash
pnpm add @edtf-ts/core
# or
npm install @edtf-ts/core
# or
yarn add @edtf-ts/core
```

## Quick Start

```typescript
import { parse, isValid, isEDTFDate, isEDTFInterval } from '@edtf-ts/core';

// Parse a complete date
const result = parse('1985-04-12');
if (result.success) {
  console.log(result.value.year);   // 1985
  console.log(result.value.month);  // 4
  console.log(result.value.day);    // 12
  console.log(result.value.min);    // Date object
  console.log(result.value.max);    // Date object
}

// Parse uncertain dates (Level 1)
const uncertain = parse('1984?');
if (uncertain.success && isEDTFDate(uncertain.value)) {
  console.log(uncertain.value.qualification?.uncertain);  // true
}

// Parse sets (Level 2)
const set = parse('[1667,1668,1670..1672]');
console.log(set.success);  // true

// Use comparison methods
const d1 = parse('2000');
const d2 = parse('2001');
if (d1.success && d2.success && isEDTFDate(d1.value) && isEDTFDate(d2.value)) {
  console.log(d1.value.isBefore!(d2.value));  // true
}

// Iterate through intervals
const interval = parse('2020/2022');
if (interval.success && isEDTFInterval(interval.value)) {
  for (const year of interval.value.by!('year')) {
    console.log(year.edtf);  // '2020', '2021', '2022'
  }
}

// Validate EDTF strings
isValid('1985-04-12');  // true
isValid('1985-13-01');  // false (invalid month)
isValid('1984?');       // true (Level 1 - uncertain)
isValid('[1667,1668]'); // true (Level 2 - set)
```

## Supported Formats

### Level 0 (ISO 8601 Profile)

#### Complete Date
```typescript
parse('1985-04-12')  // Year, month, and day
parse('1985-04')     // Year and month only
parse('1985')        // Year only (represents entire year)
```

#### DateTime with Timezone
```typescript
parse('1985-04-12T23:20:30Z')
parse('1985-04-12T23:20:30+05:00')
parse('1985-04-12T23:20:30-08:00')
```

#### Intervals
```typescript
parse('1964/2008')                  // Year interval
parse('2004-06/2006-08')            // Month interval
parse('2004-02-01/2005-02-08')      // Day interval
parse('1985-04-12T23:20:30Z/1986-05-13T01:30:45Z')  // DateTime interval
```

### Level 1 (Extended Features)

#### Uncertainty and Approximation
```typescript
parse('1984?')       // Uncertain year
parse('2004-06~')    // Approximate month
parse('2004-06-11?~') // Uncertain and approximate
```

#### Unspecified Digits
```typescript
parse('199X')        // Decade (1990-1999)
parse('19XX')        // Century (1900-1999)
parse('2004-XX')     // Some month in 2004
parse('2004-06-XX')  // Some day in June 2004
```

#### Extended Years
```typescript
parse('Y-17000')     // Year -17000
parse('Y170000')     // Year 170000
```

#### Seasons
```typescript
parse('2001-21')     // Spring 2001
parse('2001-22')     // Summer 2001
parse('2001-23')     // Autumn 2001
parse('2001-24')     // Winter 2001
```

#### Extended Intervals
```typescript
parse('1964/2008')   // Normal interval
parse('../2006')     // Unknown start, known end
parse('2004-06/..')  // Known start, unknown end
```

### Level 2 (Advanced Features)

#### Sets (One of a Set)
```typescript
parse('[1667,1668,1670..1672]')  // Set with range
parse('[..1760-12]')              // Open start
parse('[1760-12..]')              // Open end
```

#### Lists (All Members)
```typescript
parse('{1667,1668,1670..1672}')  // List with range
parse('{1960,1961-12}')          // Mixed precision
```

#### Extended Seasons
```typescript
parse('2001-25')     // Southern Hemisphere Spring
parse('2001-33')     // Quarter 1
parse('2001-37')     // Quadrimester 1
parse('2001-40')     // Semestral 1
```

#### Exponential Years
```typescript
parse('Y-17E7')      // -17 × 10^7 = -170,000,000
```

#### Significant Digits
```typescript
parse('1950S2')      // Year 1950 with 2 significant digits (century precision)
```

#### Partial Qualification
```typescript
parse('?2004-06-~11')  // Uncertain year, approximate day
parse('?2004-~06')      // Uncertain year, approximate month
parse('2004-~06-11')    // Only approximate month
```

## API Reference

### `parse(input: string, level?: EDTFLevel): ParseResult`

Parses an EDTF string and returns a result object.

**Parameters:**
- `input`: The EDTF string to parse
- `level`: Optional EDTF conformance level (0, 1, or 2). If omitted, tries all levels.

**Returns:**
- On success: `{ success: true, value: EDTFBase, level: EDTFLevel }`
- On failure: `{ success: false, errors: ParseError[] }`

**Example:**
```typescript
const result = parse('1985-04-12');
if (result.success) {
  // TypeScript knows result.value exists
  console.log(result.value.type);       // 'Date'
  console.log(result.value.precision);  // 'day'
  console.log(result.level);            // 0
} else {
  // TypeScript knows result.errors exists
  console.error(result.errors[0].message);
}
```

### `isValid(input: string, level?: EDTFLevel): boolean`

Validates an EDTF string.

**Parameters:**
- `input`: The EDTF string to validate
- `level`: Optional EDTF conformance level (0, 1, or 2)

**Returns:** `true` if valid, `false` otherwise

**Example:**
```typescript
isValid('1985-04-12');  // true
isValid('1985-13-01');  // false
isValid('2000-02-29');  // true (leap year)
isValid('2001-02-29');  // false (not a leap year)
isValid('1984?');       // true (Level 1)
isValid('[1667,1668]'); // true (Level 2)
```

### Type Guards

```typescript
isEDTFDate(value: unknown): value is EDTFDate
isEDTFDateTime(value: unknown): value is EDTFDateTime
isEDTFInterval(value: unknown): value is EDTFInterval
isEDTFSeason(value: unknown): value is EDTFSeason
isEDTFSet(value: unknown): value is EDTFSet
isEDTFList(value: unknown): value is EDTFList
```

Use these to narrow the type of a parsed value:

```typescript
const result = parse('1985-04-12');
if (result.success && isEDTFDate(result.value)) {
  // TypeScript knows this is an EDTFDate
  console.log(result.value.year);
  console.log(result.value.month);
  console.log(result.value.day);
}
```

### Date Comparison Methods

EDTFDate objects include optional comparison methods:

```typescript
isBefore?(other: EDTFDate | Date): boolean
isAfter?(other: EDTFDate | Date): boolean
equals?(other: EDTFDate): boolean
covers?(other: EDTFDate): boolean
```

**Example:**
```typescript
const d1 = parse('2000');
const d2 = parse('2001');
if (d1.success && d2.success && isEDTFDate(d1.value) && isEDTFDate(d2.value)) {
  console.log(d1.value.isBefore!(d2.value));  // true
  console.log(d2.value.isAfter!(d1.value));   // true
  console.log(d1.value.equals!(d2.value));    // false
}

const year = parse('2000');
const month = parse('2000-06');
if (year.success && month.success && isEDTFDate(year.value) && isEDTFDate(month.value)) {
  console.log(year.value.covers!(month.value));  // true (year contains month)
}
```

### Interval Operations

EDTFInterval objects include methods for containment, overlap checking, and iteration:

```typescript
contains?(date: EDTFDate | EDTFDateTime | Date): boolean
overlaps?(other: EDTFInterval): boolean
by?(unit: 'year' | 'month' | 'day'): IterableIterator<EDTFDate>
```

**Example:**
```typescript
const interval = parse('1990/2000');
const testDate = parse('1995');

if (interval.success && testDate.success && isEDTFInterval(interval.value) && isEDTFDate(testDate.value)) {
  // Check containment
  console.log(interval.value.contains!(testDate.value));  // true

  // Iterate through years
  if (interval.value.by) {
    for (const year of interval.value.by('year')) {
      console.log(year.edtf);  // '1990', '1991', ..., '2000'
    }
  }
}

// Check overlap
const interval1 = parse('1990/1995');
const interval2 = parse('1993/2000');
if (interval1.success && interval2.success && isEDTFInterval(interval1.value) && isEDTFInterval(interval2.value)) {
  console.log(interval1.value.overlaps!(interval2.value));  // true
}
```

## Type Definitions

### `EDTFDate`

```typescript
interface EDTFDate {
  type: 'Date';
  level: 0 | 1 | 2;
  edtf: string;
  precision: 'year' | 'month' | 'day';
  year: number | string;  // Can include 'X' for unspecified
  month?: number | string;
  day?: number | string;
  min: Date;       // Earliest possible date
  max: Date;       // Latest possible date

  // Level 1+ properties
  qualification?: Qualification;      // Uncertainty/approximation
  unspecified?: UnspecifiedDigits;   // X digits

  // Level 2 properties
  exponential?: number;              // For Y-17E7 format
  significantDigitsYear?: number;    // For 1950S2 format

  // Partial qualification (Level 2)
  yearQualification?: Qualification;
  monthQualification?: Qualification;
  dayQualification?: Qualification;

  // Optional methods
  isBefore?(other: EDTFDate | Date): boolean;
  isAfter?(other: EDTFDate | Date): boolean;
  equals?(other: EDTFDate): boolean;
  covers?(other: EDTFDate): boolean;

  toJSON(): object;
  toString(): string;
}

interface Qualification {
  uncertain?: boolean;
  approximate?: boolean;
  uncertainApproximate?: boolean;
}

interface UnspecifiedDigits {
  year?: string;
  month?: string;
  day?: string;
}
```

### `EDTFDateTime`

```typescript
interface EDTFDateTime {
  type: 'DateTime';
  level: 0;
  edtf: string;
  precision: 'second';
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone?: string;  // e.g., 'Z', '+05:00', '-08:00'
  min: Date;
  max: Date;
  toJSON(): object;
  toString(): string;
}
```

### `EDTFInterval`

```typescript
interface EDTFInterval {
  type: 'Interval';
  level: 0 | 1;
  edtf: string;
  precision: Precision;
  start: EDTFDate | EDTFDateTime | EDTFSeason | null;  // null for unknown
  end: EDTFDate | EDTFDateTime | EDTFSeason | null;
  openStart?: boolean;  // .. at start (Level 1)
  openEnd?: boolean;    // .. at end (Level 1)
  qualification?: Qualification;
  min: Date;  // start.min
  max: Date;  // end.max

  // Optional methods
  contains?(date: EDTFDate | EDTFDateTime | Date): boolean;
  overlaps?(other: EDTFInterval): boolean;
  by?(unit: 'year' | 'month' | 'day'): IterableIterator<EDTFDate>;

  toJSON(): object;
  toString(): string;
}
```

### `EDTFSeason`

```typescript
interface EDTFSeason {
  type: 'Season';
  level: 1 | 2;  // 1 for 21-24, 2 for 25-41
  edtf: string;
  precision: 'month';
  year: number;
  season: number;  // 21-24 (Level 1), 25-41 (Level 2)
  qualification?: Qualification;
  min: Date;
  max: Date;
  toJSON(): object;
  toString(): string;
}
```

### `EDTFSet` and `EDTFList`

```typescript
interface EDTFSet {
  type: 'Set';
  level: 2;
  edtf: string;
  precision: Precision;
  values: (EDTFDate | EDTFDateTime | EDTFSeason)[];
  earlier?: boolean;  // .. at start
  later?: boolean;    // .. at end
  min: Date;
  max: Date;
  toJSON(): object;
  toString(): string;
}

interface EDTFList {
  type: 'List';
  level: 2;
  edtf: string;
  precision: Precision;
  values: (EDTFDate | EDTFDateTime | EDTFSeason)[];
  earlier?: boolean;
  later?: boolean;
  min: Date;
  max: Date;
  toJSON(): object;
  toString(): string;
}
```

## Min/Max Dates

All EDTF objects provide `min` and `max` properties that represent the earliest and latest possible dates:

```typescript
const result = parse('1985-04');
if (result.success) {
  console.log(result.value.min);  // 1985-04-01T00:00:00.000Z
  console.log(result.value.max);  // 1985-04-30T23:59:59.999Z
}
```

This is useful for:
- Querying databases with date ranges
- Comparing uncertain dates
- Understanding the full span of a date specification

## Validation

The parser validates:
- Month values (01-12)
- Day values (01-31, accounting for month length)
- Leap years (correctly handles century rules)
- Time components (hours: 00-23, minutes: 00-59, seconds: 00-59)
- Interval order (start must be before or equal to end)

## Error Handling

Errors include helpful messages and suggestions:

```typescript
const result = parse('1985-13-01');
if (!result.success) {
  console.log(result.errors[0].code);        // 'INVALID_MONTH'
  console.log(result.errors[0].message);     // 'Month must be 01-12, got: 13'
  console.log(result.errors[0].position);    // { start: 5, end: 7 }
  console.log(result.errors[0].suggestion);  // May include helpful hint
}
```

## Examples

Check out the [examples](./examples) directory for more comprehensive usage examples:

```bash
# Run the basic usage examples
pnpm exec tsx examples/basic-usage.ts
```

The example file demonstrates:
- Parsing dates, uncertain dates, and sets
- Using comparison methods (isBefore, isAfter)
- Iterating through intervals
- Checking interval containment
- Validating EDTF strings

## Development

```bash
# Run tests
pnpm test

# Build
pnpm build

# Watch mode for development
pnpm dev

# Run examples
pnpm exec tsx examples/basic-usage.ts
```

## License

MIT

## Contributing

This is part of the `edtf-ts` monorepo. See the main repository for contribution guidelines.

## Resources

- [EDTF Specification](https://www.loc.gov/standards/datetime/)
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
