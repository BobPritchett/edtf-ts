# Getting Started

Get up and running with EDTF-TS in minutes.

## Installation

Install the main package:

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

This includes parsing, comparison, and formatting. For natural language parsing, also install:

::: code-group

```bash [pnpm]
pnpm add @edtf-ts/natural
```

```bash [npm]
npm install @edtf-ts/natural
```

```bash [yarn]
yarn add @edtf-ts/natural
```

:::

## The FuzzyDate API (Recommended)

The `FuzzyDate` class provides a Temporal-inspired, method-based API that's discoverable via IDE autocomplete. **This is the recommended way to use EDTF-TS.**

### Parsing Dates

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Parse EDTF strings - throws on invalid input
const date = FuzzyDate.parse('1985-04-12');

console.log(date.type);       // 'Date'
console.log(date.level);      // 0
console.log(date.edtf);       // '1985-04-12'
console.log(date.year);       // 1985
console.log(date.month);      // 4
console.log(date.day);        // 12
console.log(date.precision);  // 'day'

// Result-based parsing (doesn't throw)
const result = FuzzyDate.from('1985-04-12');
if (result.success) {
  console.log(result.value.edtf);   // '1985-04-12'
  console.log(result.level);        // 0
}
```

### Working with Uncertainty

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Uncertain date (?)
const uncertain = FuzzyDate.parse('1984?');
console.log(uncertain.isUncertain);    // true
console.log(uncertain.format());       // "1984 (uncertain)"

// Approximate date (~)
const approx = FuzzyDate.parse('1950~');
console.log(approx.isApproximate);     // true
console.log(approx.format());          // "circa 1950"

// Both uncertain and approximate (%)
const both = FuzzyDate.parse('1920%');
console.log(both.isUncertain);         // true
console.log(both.isApproximate);       // true

// Unspecified digits (X)
const decade = FuzzyDate.parse('198X');
console.log(decade.hasUnspecified);    // true
console.log(decade.format());          // "1980s"
```

### Date Bounds

Every FuzzyDate has `min` and `max` properties representing the earliest and latest possible instants:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const month = FuzzyDate.parse('1985-04');
console.log(month.min);  // 1985-04-01T00:00:00.000Z
console.log(month.max);  // 1985-04-30T23:59:59.999Z

// Useful for unspecified dates
const decade = FuzzyDate.parse('198X');
console.log(decade.min);  // 1980-01-01T00:00:00.000Z
console.log(decade.max);  // 1989-12-31T23:59:59.999Z
```

### Search Bounds (Discovery Layer)

For search and discovery, FuzzyDate provides heuristically expanded bounds that account for human uncertainty:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const circa1920 = FuzzyDate.parse('1920~');

// Strict EDTF bounds: exactly 1920
console.log(circa1920.min.getFullYear());  // 1920
console.log(circa1920.max.getFullYear());  // 1920

// Search bounds: expanded by ±2 years for approximate
console.log(circa1920.searchMin.getFullYear());  // ~1918
console.log(circa1920.searchMax.getFullYear());  // ~1922
```

**Padding by qualifier:**
| Qualifier | Symbol | Padding |
|-----------|--------|---------|
| Uncertain | `?` | ±1 unit |
| Approximate | `~` | ±2 units |
| Both | `%` | ±3 units |

See the [Search & Discovery guide](/guide/search-and-discovery) for details.

### Intervals

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const interval = FuzzyDate.parse('1990/2000');

console.log(interval.type);        // 'Interval'
console.log(interval.start?.year); // 1990
console.log(interval.end?.year);   // 2000

// Iterate through years in the interval
for (const year of interval.by('year')) {
  console.log(year.edtf);  // '1990', '1991', ..., '2000'
}

// Type-specific parsing
const result = FuzzyDate.Interval.from('1985/1990');
if (result.success) {
  // TypeScript knows this is FuzzyDateInterval
  for (const year of result.value.by('year')) {
    console.log(year.format());
  }
}
```

### Comparison

FuzzyDate includes temporal comparison methods using four-valued logic:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const y1980 = FuzzyDate.parse('1980');
const y1990 = FuzzyDate.parse('1990');
const decade = FuzzyDate.parse('198X');

// Four-valued logic: 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN'
y1980.isBefore(y1990);      // 'YES' - definitely before
y1990.isBefore(y1980);      // 'NO' - definitely not before
decade.equals(y1980);       // 'MAYBE' - could be 1980

// Boolean convenience methods
y1980.isDefinitelyBefore(y1990);  // true
decade.isPossiblyBefore(y1980);   // true (could be any year 1980-1989)
```

### Overlap Scoring

Calculate how well two dates overlap for search ranking:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const query = FuzzyDate.parse('1919');
const exact1919 = FuzzyDate.parse('1919');
const circa1920 = FuzzyDate.parse('1920~');
const far1950 = FuzzyDate.parse('1950');

query.overlapScore(exact1919);   // 1.0 - perfect match
query.overlapScore(circa1920);   // ~0.2 - partial overlap
query.overlapScore(far1950);     // 0.0 - no overlap
```

### Formatting

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const date = FuzzyDate.parse('1985-04-12');

date.format();        // "April 12, 1985"
date.toISO();         // "1985-04-12"
date.toString();      // "1985-04-12" (the EDTF string)

// With options
date.format({ dateStyle: 'short' });  // "4/12/1985"
date.format({ locale: 'de-DE' });     // "12. April 1985"

// Uncertainty is shown
const uncertain = FuzzyDate.parse('1984?');
uncertain.format();   // "1984 (uncertain)"
```

### Seasons

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const spring = FuzzyDate.parse('2001-21');  // Spring 2001

console.log(spring.type);        // 'Season'
console.log(spring.year);        // 2001
console.log(spring.season);      // 21
console.log(spring.seasonName);  // 'Spring'
console.log(spring.format());    // "Spring 2001"
```

### Sets and Lists

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Set: "one of these dates"
const set = FuzzyDate.parse('[1667,1668,1670]');
console.log(set.type);           // 'Set'
console.log(set.values.length);  // 3

// List: "all of these dates"
const list = FuzzyDate.parse('{1985,1986,1987}');
console.log(list.type);          // 'List'

// Access individual members
for (const member of set.values) {
  console.log(member.edtf);  // '1667', '1668', '1670'
}
```

### Extended Years (BigInt Support)

For dates beyond JavaScript's ~±270,000 year Date limit, use BigInt properties:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Extended year (2 million years in the future)
const farFuture = FuzzyDate.parse('Y2000000');

// Check if Date values were clamped
if (farFuture.isBoundsClamped) {
  // Use BigInt for accurate values
  console.log(farFuture.minMs);  // Accurate epoch milliseconds (bigint)
  console.log(farFuture.maxMs);  // Accurate epoch milliseconds (bigint)
}

// The inner year is always accurate
console.log(farFuture.inner.year);  // 2000000
```

::: tip
For normal dates within the ~±270,000 year range, `min`/`max` Date properties work perfectly. The `isBoundsClamped` flag tells you when to use BigInt values instead.
:::

## Validation

Check if an EDTF string is valid without parsing:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

FuzzyDate.isValid('1985-04-12');  // true
FuzzyDate.isValid('1985-13-01');  // false (invalid month)
FuzzyDate.isValid('2000-02-29');  // true (leap year)
FuzzyDate.isValid('2001-02-29');  // false (not a leap year)
FuzzyDate.isValid('1984?');       // true (Level 1)
FuzzyDate.isValid('[1667,1668]'); // true (Level 2)
```

## Error Handling

When parsing fails, FuzzyDate provides detailed error information:

```typescript
import { FuzzyDate, FuzzyDateParseError } from '@edtf-ts/core';

// Using parse() (throws)
try {
  FuzzyDate.parse('1985-13-01');
} catch (error) {
  if (error instanceof FuzzyDateParseError) {
    console.log(error.errors[0].code);     // 'INVALID_MONTH'
    console.log(error.errors[0].message);  // 'Month must be 01-12, got: 13'
  }
}

// Using from() (returns result object)
const result = FuzzyDate.from('1985-13-01');
if (!result.success) {
  console.log(result.errors[0].code);      // 'INVALID_MONTH'
  console.log(result.errors[0].message);   // 'Month must be 01-12, got: 13'
}
```

## Functional API (Also Available)

If you prefer functional programming or need fine-grained tree-shaking, all functions are also available as direct imports:

```typescript
import {
  parse,
  isValid,
  isEDTFDate,
  isEDTFInterval,
  isBefore,
  formatHuman,
  formatISO,
} from '@edtf-ts/core';

const result = parse('1985-04-12');

if (result.success) {
  if (isEDTFDate(result.value)) {
    console.log(result.value.year);         // 1985
    console.log(formatHuman(result.value)); // "April 12, 1985"
  }
}
```

See the [API Reference](/api/core) for the complete functional API.

## Next Steps

- [Parsing Guide](./parsing) - Deep dive into parsing all EDTF levels
- [Formatting Guide](./formatting) - Format dates for display
- [Comparison Guide](./comparison) - Temporal reasoning with Allen's algebra
- [Search & Discovery](./search-and-discovery) - Heuristic bounds and overlap scoring
- [Examples](../examples/basic-usage) - See more examples
