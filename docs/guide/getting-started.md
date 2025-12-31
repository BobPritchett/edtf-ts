# Getting Started

Get up and running with EDTF-TS in minutes.

## Installation

Install the core package:

::: code-group

```bash [pnpm]
pnpm add @edtf-ts/core
```

```bash [npm]
npm install @edtf-ts/core
```

```bash [yarn]
yarn add @edtf-ts/core
```

:::

For additional utilities (formatting, validation, comparison):

::: code-group

```bash [pnpm]
pnpm add @edtf-ts/utils
```

```bash [npm]
npm install @edtf-ts/utils
```

```bash [yarn]
yarn add @edtf-ts/utils
```

:::

## Basic Usage

### Parsing Dates

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

const result = parse('1985-04-12');

if (result.success) {
  console.log(result.value.type);       // 'Date'
  console.log(result.value.level);      // 0
  console.log(result.value.edtf);       // '1985-04-12'

  if (isEDTFDate(result.value)) {
    console.log(result.value.year);     // 1985
    console.log(result.value.month);    // 4
    console.log(result.value.day);      // 12
  }
} else {
  console.error(result.errors);
}
```

### Working with Uncertainty

```typescript
// Parse an uncertain date
const uncertain = parse('1984?');

if (uncertain.success && isEDTFDate(uncertain.value)) {
  console.log(uncertain.value.qualification?.uncertain);  // true
  console.log(uncertain.value.edtf);                      // '1984?'
}

// Parse an approximate date
const approx = parse('1950~');

if (approx.success && isEDTFDate(approx.value)) {
  console.log(approx.value.qualification?.approximate);   // true
}
```

### Parsing Intervals

```typescript
import { parse, isEDTFInterval } from '@edtf-ts/core';

const interval = parse('1990/2000');

if (interval.success && isEDTFInterval(interval.value)) {
  console.log(interval.value.start?.year);  // 1990
  console.log(interval.value.end?.year);    // 2000

  // Iterate through years
  for (const year of interval.value.by!('year')) {
    console.log(year.edtf);  // '1990', '1991', ..., '2000'
  }
}
```

### Min/Max Date Ranges

Every EDTF value has `min` and `max` properties representing the earliest and latest possible dates:

```typescript
const result = parse('1985-04');

if (result.success) {
  console.log(result.value.min);  // 1985-04-01T00:00:00.000Z
  console.log(result.value.max);  // 1985-04-30T23:59:59.999Z
}

// Useful for unspecified dates
const decade = parse('198X');
if (decade.success) {
  console.log(decade.value.min);  // 1980-01-01T00:00:00.000Z
  console.log(decade.value.max);  // 1989-12-31T23:59:59.999Z
}
```

### Extended Years (BigInt Support)

For dates beyond JavaScript's ~±270,000 year Date limit, use `minMs` and `maxMs` (BigInt values):

```typescript
import { parse } from '@edtf-ts/core';

// Parse an extended year (2 million years in the future)
const extended = parse('Y2000000');

if (extended.success) {
  // Check if Date values were clamped
  if (extended.value.isBoundsClamped) {
    // Use BigInt for accurate values
    console.log(extended.value.minMs);  // Accurate epoch milliseconds
    console.log(extended.value.maxMs);
  }

  // Year is always accurate
  console.log(extended.value.year);  // 2000000
}
```

::: tip
For normal dates within the ~±270,000 year range, `min`/`max` Date properties work perfectly. The `isBoundsClamped` flag tells you when to use BigInt values instead.
:::

## Using Utilities

The `@edtf-ts/utils` package provides formatting, validation, and comparison utilities:

### Formatting

```typescript
import { parse } from '@edtf-ts/core';
import { formatHuman, formatISO } from '@edtf-ts/utils';

const date = parse('1985-04-12');

if (date.success) {
  formatHuman(date.value);  // "April 12, 1985"
  formatISO(date.value);    // "1985-04-12"
}

const uncertain = parse('1984?');
if (uncertain.success) {
  formatHuman(uncertain.value);  // "1984 (uncertain)"
}
```

### Validation

```typescript
import { isValid, isInRange } from '@edtf-ts/utils';

// Validate EDTF strings
isValid('1985-04-12');  // true
isValid('1985-13-01');  // false (invalid month)

// Check if date is in range
const date = parse('2000-06-15');
const start = parse('2000-01-01');
const end = parse('2000-12-31');

if (date.success && start.success && end.success) {
  isInRange(date.value, start.value, end.value);  // true
}
```

### Comparison

```typescript
import { parse } from '@edtf-ts/core';
import { compare, sort, earliest, latest } from '@edtf-ts/utils';

const dates = [
  parse('2001'),
  parse('2000'),
  parse('1999')
].filter(d => d.success).map(d => d.value);

// Sort dates
const sorted = sort(dates);  // [1999, 2000, 2001]

// Find earliest/latest
earliest(dates);  // 1999
latest(dates);    // 2001
```

## Validation

Check if an EDTF string is valid:

```typescript
import { isValid } from '@edtf-ts/core';

isValid('1985-04-12');  // true
isValid('1985-13-01');  // false (invalid month)
isValid('2000-02-29');  // true (leap year)
isValid('2001-02-29');  // false (not a leap year)
isValid('1984?');       // true (Level 1)
isValid('[1667,1668]'); // true (Level 2)
```

## Error Handling

The parser returns detailed error information:

```typescript
const result = parse('1985-13-01');

if (!result.success) {
  console.log(result.errors[0].code);        // 'INVALID_MONTH'
  console.log(result.errors[0].message);     // 'Month must be 01-12, got: 13'
  console.log(result.errors[0].position);    // { start: 5, end: 7 }
}
```

## Type Guards

Use type guards to narrow types:

```typescript
import { parse, isEDTFDate, isEDTFInterval, isEDTFSeason } from '@edtf-ts/core';

const result = parse(input);

if (result.success) {
  if (isEDTFDate(result.value)) {
    // TypeScript knows this is EDTFDate
    console.log(result.value.year);
  } else if (isEDTFInterval(result.value)) {
    // TypeScript knows this is EDTFInterval
    console.log(result.value.start);
  } else if (isEDTFSeason(result.value)) {
    // TypeScript knows this is EDTFSeason
    console.log(result.value.season);
  }
}
```

## Next Steps

- [EDTF Levels](./edtf-levels) - Learn about conformance levels
- [Parsing Guide](./parsing) - Deep dive into parsing
- [Formatting Guide](./formatting) - Format dates for display
- [Examples](../examples/basic-usage) - See more examples
