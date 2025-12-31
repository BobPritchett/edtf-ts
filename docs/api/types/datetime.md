# EDTFDateTime

Represents a precise moment in time with optional timezone (Level 0).

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
| `timezone` | `string?` | Timezone (e.g., 'Z', '+05:00', '-08:00') |

### Inherited from EDTFBase

| Property | Type | Description |
|----------|------|-------------|
| `level` | `0` | Always Level 0 |
| `edtf` | `string` | Original EDTF string |
| `precision` | `Precision` | Always 'second' for DateTime |
| `min` | `Date` | JavaScript Date representation |
| `max` | `Date` | Same as min for DateTime |

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

DateTime is always at second precision:

```typescript
const result = parse('1985-04-12T23:20:30Z');
if (result.success) {
  console.log(result.value.precision);  // 'second'
}
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
