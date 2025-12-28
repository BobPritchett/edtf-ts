# @edtf-ts/core

Modern TypeScript implementation of EDTF (Extended Date/Time Format) - Level 0 support.

## Features

- **Level 0 EDTF Support**: Full implementation of ISO 8601 profile
- **Type-Safe**: Fully typed with TypeScript
- **Zero Dependencies**: No runtime dependencies
- **Tree-Shakeable**: Import only what you need
- **Comprehensive**: Dates, DateTimes, and Intervals
- **Well-Tested**: 45 test cases covering all Level 0 features

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
import { parse, isValid } from '@edtf-ts/core';

// Parse a complete date
const result = parse('1985-04-12');
if (result.success) {
  console.log(result.value.year);   // 1985
  console.log(result.value.month);  // 4
  console.log(result.value.day);    // 12
  console.log(result.value.min);    // Date object
  console.log(result.value.max);    // Date object
}

// Validate EDTF strings
isValid('1985-04-12');  // true
isValid('1985-13-01');  // false (invalid month)
```

## Supported Formats (Level 0)

### Complete Date
```typescript
parse('1985-04-12')
// Year, month, and day
```

### Year and Month
```typescript
parse('1985-04')
// Year and month only
```

### Year Only
```typescript
parse('1985')
// Year only (represents entire year)
```

### DateTime with Timezone
```typescript
parse('1985-04-12T23:20:30Z')
parse('1985-04-12T23:20:30+05:00')
parse('1985-04-12T23:20:30-08:00')
// ISO 8601 datetime with optional timezone
```

### Intervals
```typescript
parse('1964/2008')                  // Year interval
parse('2004-06/2006-08')            // Month interval
parse('2004-02-01/2005-02-08')      // Day interval
parse('1985-04-12T23:20:30Z/1986-05-13T01:30:45Z')  // DateTime interval
// Two dates or datetimes separated by '/'
```

## API Reference

### `parse(input: string): ParseResult`

Parses an EDTF string and returns a result object.

**Returns:**
- On success: `{ success: true, value: EDTFDate | EDTFDateTime | EDTFInterval, level: 0 }`
- On failure: `{ success: false, errors: ParseError[] }`

**Example:**
```typescript
const result = parse('1985-04-12');
if (result.success) {
  // TypeScript knows result.value exists
  console.log(result.value.type);  // 'Date'
  console.log(result.value.precision);  // 'day'
} else {
  // TypeScript knows result.errors exists
  console.error(result.errors[0].message);
}
```

### `isValid(input: string, level?: EDTFLevel): boolean`

Validates an EDTF string.

**Parameters:**
- `input`: The EDTF string to validate
- `level`: EDTF conformance level (only 0 is currently supported)

**Returns:** `true` if valid, `false` otherwise

**Example:**
```typescript
isValid('1985-04-12');  // true
isValid('1985-13-01');  // false
isValid('2000-02-29');  // true (leap year)
isValid('2001-02-29');  // false (not a leap year)
```

### Type Guards

```typescript
isEDTFDate(value: unknown): value is EDTFDate
isEDTFDateTime(value: unknown): value is EDTFDateTime
isEDTFInterval(value: unknown): value is EDTFInterval
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

## Type Definitions

### `EDTFDate`

```typescript
interface EDTFDate {
  type: 'Date';
  level: 0;
  edtf: string;
  precision: 'year' | 'month' | 'day';
  year: number;
  month?: number;  // 1-12
  day?: number;    // 1-31
  min: Date;       // Earliest possible date
  max: Date;       // Latest possible date
  toJSON(): object;
  toString(): string;
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
  level: 0;
  edtf: string;
  precision: Precision;
  start: EDTFDate | EDTFDateTime;
  end: EDTFDate | EDTFDateTime;
  min: Date;  // start.min
  max: Date;  // end.max
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

## What's Not Supported (Yet)

This package currently implements **Level 0 only**. The following features are not yet supported:

- **Level 1**: Uncertainty (`?`), approximation (`~`), unspecified digits (`X`), extended intervals, years beyond 4 digits, seasons
- **Level 2**: Partial uncertainty, exponential years, sets, significant digits

These will be added in future releases.

## Development

```bash
# Run tests
pnpm test

# Build
pnpm build

# Watch mode for development
pnpm dev
```

## License

MIT

## Contributing

This is part of the `edtf-ts` monorepo. See the main repository for contribution guidelines.

## Resources

- [EDTF Specification](https://www.loc.gov/standards/datetime/)
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
