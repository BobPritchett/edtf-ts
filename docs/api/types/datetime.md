# EDTFDateTime

Represents a date and time with optional timezone (Level 0). The default extended profile also accepts ISO fractional seconds and signed six-digit years, including `Date.toISOString()` output.

## Interface

```typescript
interface EDTFDateTime extends EDTFBase {
  type: 'DateTime';
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  fractionalSecond?: string;
  timezone?: string;
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'DateTime'` | Type discriminator |
| `year` | `number` | Year |
| `month` | `number` | Month (1-12) |
| `day` | `number` | Day (1-31) |
| `hour` | `number` | Hour (0-23) |
| `minute` | `number` | Minute (0-59) |
| `second` | `number` | Second (0-59) |
| `fractionalSecond` | `string?` | Written fractional digits (1–3), including trailing zeros; extended profile only |
| `timezone` | `string?` | Timezone (e.g., 'Z', '+05:00', '-08:00') |

### Inherited from EDTFBase

| Property | Type | Description |
|----------|------|-------------|
| `level` | `0` | Always Level 0 |
| `edtf` | `string` | Original EDTF string |
| `precision` | `Precision` | `'second'`; `fractionalSecond` optionally refines the resolution |
| `min` | `Date` | Beginning of the written time unit |
| `max` | `Date` | End of the written time unit; equal to `min` for three fractional digits |

## Usage

```typescript
import { parse, isEDTFDateTime } from '@edtf-ts/core';

const result = parse('1985-04-12T23:20:30Z');

if (result.success && isEDTFDateTime(result.value)) {
  const dt = result.value;

  console.log(dt.year);      // 1985
  console.log(dt.month);     // 4
  console.log(dt.day);       // 12
  console.log(dt.hour);      // 23
  console.log(dt.minute);    // 20
  console.log(dt.second);    // 30
  console.log(dt.timezone);  // 'Z'
}
```

## Timezone Formats

DateTime supports several timezone formats:

```typescript
// UTC
parse('1985-04-12T23:20:30Z');

// Positive offset
parse('1985-04-12T23:20:30+05:00');
parse('1985-04-12T23:20:30+05:30');

// Negative offset
parse('1985-04-12T23:20:30-08:00');

// Local time (no timezone)
parse('1985-04-12T23:20:30');
```

## Precision Levels

The `precision` property remains `'second'` for compatibility. Optional `fractionalSecond` digits refine the bounds without adding a case to the precision union:

```typescript
const result = parse('1985-04-12T23:20:30Z');
if (result.success) {
  console.log(result.value.precision);  // 'second'
}
```

| Written seconds | Millisecond bounds within that second |
| --- | --- |
| `30` | 000–999 |
| `30.1` | 100–199 |
| `30.12` | 120–129 |
| `30.123` | 123–123 |
| `30.000` | 000–000 |

Fractions survive `edtf`, `formatISO()`, `FuzzyDate.toISO()`, human formatting, and JSON serialization. Bounds, normalization, and comparisons use the fraction. More than three fractional digits are rejected instead of truncated. With `conformance: 'strict'`, fractional seconds and signed six-digit datetime years return `UNSUPPORTED_EXTENSION`.

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const input = new Date('2024-02-29T12:30:00.123Z').toISOString();
const timestamp = FuzzyDate.parse(input);
console.log(timestamp.toISO()); // 2024-02-29T12:30:00.123Z
console.log(timestamp.min.getTime() === timestamp.max.getTime()); // true
```

## Converting to JavaScript Date

Use the `.min` property:

```typescript
const result = parse('1985-04-12T23:20:30Z');
if (result.success) {
  const jsDate = result.value.min;
  console.log(jsDate.toISOString());  // '1985-04-12T23:20:30.000Z'
}
```

## Type Guard

```typescript
import { isEDTFDateTime } from '@edtf-ts/core';

const result = parse(input);
if (result.success && isEDTFDateTime(result.value)) {
  // TypeScript knows result.value is EDTFDateTime
  console.log(result.value.hour);
}
```
