# EDTFDate

Represents a calendar date with optional precision, unspecified digits, and qualifications.

## Type Definition

```typescript
interface EDTFDate {
  readonly type: 'Date';
  readonly level: 0 | 1 | 2;
  readonly edtf: string;
  readonly precision: 'year' | 'month' | 'day';

  readonly year: number;
  readonly month?: number;  // 1-12
  readonly day?: number;    // 1-31

  // Unspecified digits
  readonly yearUnspecified?: string;   // e.g., "XXXX", "19XX", "198X"
  readonly monthUnspecified?: string;  // e.g., "XX"
  readonly dayUnspecified?: string;    // e.g., "XX"

  // Component-level qualifications (Level 2)
  readonly yearQualification?: Qualification;
  readonly monthQualification?: Qualification;
  readonly dayQualification?: Qualification;

  // Date-level qualification (Level 1)
  readonly qualification?: Qualification;

  // Calculated bounds
  readonly min: Date;
  readonly max: Date;

  // Serialization
  toJSON(): object;
}

interface Qualification {
  uncertain?: boolean;    // ? marker
  approximate?: boolean;  // ~ marker
  both?: boolean;         // % marker (uncertain AND approximate)
}
```

## Properties

### Core Properties

#### type
```typescript
readonly type: 'Date'
```

Always `'Date'` for EDTFDate objects. Use for type discrimination.

```typescript
import { parse } from '@edtf-ts/core';

const result = parse('1985-04-12');
if (result.success && result.value.type === 'Date') {
  // TypeScript knows this is EDTFDate
  console.log(result.value.year);  // 1985
}
```

#### level
```typescript
readonly level: 0 | 1 | 2
```

EDTF conformance level:
- **0**: ISO 8601 profile (basic dates)
- **1**: Adds uncertainty/approximation qualifications
- **2**: Adds component-level qualifications and unspecified digits

```typescript
parse('1985-04-12').value.level;  // 0
parse('1985?').value.level;       // 1
parse('2004-06-~01').value.level; // 2
```

#### edtf
```typescript
readonly edtf: string
```

Original EDTF string representation.

```typescript
parse('1985-04-12').value.edtf;  // "1985-04-12"
parse('1985?').value.edtf;       // "1985?"
```

#### precision
```typescript
readonly precision: 'year' | 'month' | 'day'
```

The precision level of the date.

```typescript
parse('1985').value.precision;        // 'year'
parse('1985-04').value.precision;     // 'month'
parse('1985-04-12').value.precision;  // 'day'
```

### Date Components

#### year
```typescript
readonly year: number
```

The year value. Can be negative for historical dates.

```typescript
parse('1985-04-12').value.year;   // 1985
parse('0000').value.year;         // 0 (1 BC in historical notation)
parse('-0100').value.year;        // -100 (101 BC)
```

::: tip Astronomical Year Numbering
EDTF uses astronomical year numbering where year 0 = 1 BC, year -1 = 2 BC, etc.
:::

#### month
```typescript
readonly month?: number  // 1-12
```

Month number (1-12). Only present if precision is `'month'` or `'day'`.

```typescript
parse('1985').value.month;        // undefined
parse('1985-04').value.month;     // 4
parse('1985-04-12').value.month;  // 4
```

#### day
```typescript
readonly day?: number  // 1-31
```

Day of month. Only present if precision is `'day'`.

```typescript
parse('1985').value.day;        // undefined
parse('1985-04').value.day;     // undefined
parse('1985-04-12').value.day;  // 12
```

### Unspecified Digits

#### yearUnspecified
```typescript
readonly yearUnspecified?: string
```

Pattern of unspecified year digits using 'X'.

```typescript
parse('19XX').value.yearUnspecified;   // "19XX"
parse('198X').value.yearUnspecified;   // "198X"
parse('XXXX').value.yearUnspecified;   // "XXXX"
```

#### monthUnspecified
```typescript
readonly monthUnspecified?: string
```

Pattern of unspecified month digits.

```typescript
parse('1985-XX').value.monthUnspecified;  // "XX"
```

#### dayUnspecified
```typescript
readonly dayUnspecified?: string
```

Pattern of unspecified day digits.

```typescript
parse('1985-04-XX').value.dayUnspecified;  // "XX"
parse('1985-XX-XX').value.dayUnspecified;  // "XX"
parse('1985-XX-XX').value.monthUnspecified;  // "XX"
```

::: warning Unspecified Values
When digits are unspecified, the corresponding component (`year`, `month`, `day`) represents the **first value** in the range. Use `min` and `max` for the full range.
:::

### Qualifications

#### qualification (Level 1)
```typescript
readonly qualification?: Qualification
```

Whole-date qualification applied to the entire date.

```typescript
parse('1985?').value.qualification;   // { uncertain: true }
parse('1985~').value.qualification;   // { approximate: true }
parse('1985%').value.qualification;   // { both: true }
```

#### Component Qualifications (Level 2)
```typescript
readonly yearQualification?: Qualification
readonly monthQualification?: Qualification
readonly dayQualification?: Qualification
```

Qualifications applied to specific components.

```typescript
// Uncertain year
parse('?1985').value.yearQualification;  // { uncertain: true }

// Approximate month
parse('2004-~06').value.monthQualification;  // { approximate: true }

// Approximate day
parse('2004-06-~01').value.dayQualification;  // { approximate: true }
```

::: tip Level 1 vs Level 2 Qualifications
- **Level 1** (`1985?`): Qualification applies to the whole date
- **Level 2** (`?1985` or `2004-~06`): Qualifications can target specific components
:::

### Calculated Bounds

#### min
```typescript
readonly min: Date
```

Earliest possible date represented by this EDTF value.

```typescript
parse('1985').value.min;          // Date('1985-01-01T00:00:00.000Z')
parse('1985-04').value.min;       // Date('1985-04-01T00:00:00.000Z')
parse('198X').value.min;          // Date('1980-01-01T00:00:00.000Z')
parse('1985-XX').value.min;       // Date('1985-01-01T00:00:00.000Z')
```

#### max
```typescript
readonly max: Date
```

Latest possible date represented by this EDTF value.

```typescript
parse('1985').value.max;          // Date('1985-12-31T23:59:59.999Z')
parse('1985-04').value.max;       // Date('1985-04-30T23:59:59.999Z')
parse('198X').value.max;          // Date('1989-12-31T23:59:59.999Z')
parse('1985-XX').value.max;       // Date('1985-12-31T23:59:59.999Z')
```

::: warning Bounds Represent Ranges
`min` and `max` represent the **full time range** of the precision level. A year spans from January 1st 00:00:00.000 to December 31st 23:59:59.999.
:::

## Methods

### toJSON()
```typescript
toJSON(): object
```

Serialize to a plain JavaScript object.

```typescript
const date = parse('1985-04-12');
if (date.success) {
  const json = date.value.toJSON();
  // {
  //   type: 'Date',
  //   level: 0,
  //   edtf: '1985-04-12',
  //   precision: 'day',
  //   year: 1985,
  //   month: 4,
  //   day: 12,
  //   min: '1985-04-12T00:00:00.000Z',
  //   max: '1985-04-12T23:59:59.999Z'
  // }

  JSON.stringify(json);  // Safe for JSON serialization
}
```

## Examples

### Level 0: Basic Dates

```typescript
import { parse } from '@edtf-ts/core';

// Year
const year = parse('1985').value;
// { type: 'Date', precision: 'year', year: 1985, level: 0 }

// Year-month
const month = parse('1985-04').value;
// { type: 'Date', precision: 'month', year: 1985, month: 4, level: 0 }

// Complete date
const day = parse('1985-04-12').value;
// { type: 'Date', precision: 'day', year: 1985, month: 4, day: 12, level: 0 }

// Historical dates (astronomical year numbering)
const bc = parse('-0100').value;  // 101 BC
// { year: -100 }
```

### Level 1: Qualifications

```typescript
// Uncertain
const uncertain = parse('1984?').value;
// { year: 1984, qualification: { uncertain: true }, level: 1 }

// Approximate
const approx = parse('1984~').value;
// { year: 1984, qualification: { approximate: true }, level: 1 }

// Both uncertain and approximate
const both = parse('1984%').value;
// { year: 1984, qualification: { both: true }, level: 1 }
```

### Level 2: Partial Qualifications

```typescript
// Uncertain year
const uncertainYear = parse('?1984').value;
// { year: 1984, yearQualification: { uncertain: true }, level: 2 }

// Approximate month
const approxMonth = parse('2004-~06').value;
// { year: 2004, month: 6, monthQualification: { approximate: true }, level: 2 }

// Approximate day
const approxDay = parse('2004-06-~11').value;
// { year: 2004, month: 6, day: 11, dayQualification: { approximate: true }, level: 2 }

// Qualifier after year, before month
const qualAfterYear = parse('2004?-06').value;
// { year: 2004, month: 6, yearQualification: { uncertain: true }, level: 2 }
```

### Level 2: Unspecified Digits

```typescript
// Unspecified decade
const decade = parse('198X').value;
// {
//   year: 1980,
//   yearUnspecified: '198X',
//   min: Date('1980-01-01'),
//   max: Date('1989-12-31'),
//   level: 2
// }

// Unspecified month
const anyMonth = parse('1985-XX').value;
// {
//   year: 1985,
//   month: 1,
//   monthUnspecified: 'XX',
//   min: Date('1985-01-01'),
//   max: Date('1985-12-31'),
//   level: 2
// }

// Unspecified day
const anyDay = parse('1985-04-XX').value;
// {
//   year: 1985,
//   month: 4,
//   day: 1,
//   dayUnspecified: 'XX',
//   min: Date('1985-04-01'),
//   max: Date('1985-04-30'),
//   level: 2
// }

// Multiple unspecified
const anyDayAnyMonth = parse('1985-XX-XX').value;
// {
//   year: 1985,
//   month: 1,
//   monthUnspecified: 'XX',
//   day: 1,
//   dayUnspecified: 'XX',
//   min: Date('1985-01-01'),
//   max: Date('1985-12-31'),
//   level: 2
// }
```

## Type Guards

Use type guards to check if a value is an EDTFDate:

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

const result = parse('1985-04-12');

if (result.success && isEDTFDate(result.value)) {
  // TypeScript knows result.value is EDTFDate
  console.log(result.value.year);   // ✓ TypeScript knows this exists
  console.log(result.value.month);  // ✓ TypeScript knows this might be undefined
}
```

## Working with Bounds

The `min` and `max` properties provide JavaScript Date objects representing the full range:

```typescript
import { parse } from '@edtf-ts/core';
import { isInRange } from '@edtf-ts/utils';

const date = parse('1985-04').value;

// Check if a specific date falls within this range
const specific = new Date('1985-04-15');
const inRange = specific >= date.min && specific <= date.max;  // true

// Use with utilities
const target = parse('1985-04-15').value;
isInRange(target, date, date);  // true
```

## See Also

- [EDTFDateTime](/api/types/datetime) - Dates with time components
- [EDTFInterval](/api/types/interval) - Date ranges and intervals
- [@edtf-ts/compare](/api/compare) - Advanced temporal comparison
- [Uncertainty & Approximation](/guide/uncertainty)
