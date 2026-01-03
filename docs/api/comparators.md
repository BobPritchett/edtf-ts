# Comparators

Comparison and sorting utilities from `@edtf-ts` for EDTF dates.

::: tip
These functions are part of the main `@edtf-ts` package.
:::

## Comparison Mode

Many functions accept a `ComparisonMode` parameter:

```typescript
type ComparisonMode = 'min' | 'max' | 'midpoint';
```

| Mode | Description |
|------|-------------|
| `'min'` | Compare using the earliest possible date |
| `'max'` | Compare using the latest possible date |
| `'midpoint'` | Compare using the midpoint between min and max |

## Functions

### compare()

Compare two EDTF dates.

```typescript
function compare(
  a: EDTFBase,
  b: EDTFBase,
  mode?: ComparisonMode  // default: 'min'
): number
```

Returns a negative number if a < b, positive if a > b, zero if equal.

```typescript
import { parse } from '@edtf-ts';
import { compare } from '@edtf-ts';

const d1 = parse('2000');
const d2 = parse('2001');

if (d1.success && d2.success) {
  compare(d1.value, d2.value);  // negative (2000 < 2001)
  compare(d2.value, d1.value);  // positive (2001 > 2000)
}
```

### sort()

Sort an array of EDTF dates.

```typescript
function sort(
  dates: EDTFBase[],
  mode?: ComparisonMode,   // default: 'min'
  order?: 'asc' | 'desc'   // default: 'asc'
): EDTFBase[]
```

Returns a new sorted array (does not modify the original).

```typescript
const dates = ['2001', '2000', '1999'].map(s => parse(s))
  .filter(r => r.success)
  .map(r => r.value);

sort(dates);                    // [1999, 2000, 2001]
sort(dates, 'min', 'desc');     // [2001, 2000, 1999]
sort(dates, 'max');             // [1999, 2000, 2001]
```

### earliest()

Find the earliest date in an array.

```typescript
function earliest(
  dates: EDTFBase[],
  mode?: ComparisonMode  // default: 'min'
): EDTFBase | undefined
```

```typescript
const dates = ['2001', '2000', '1999'].map(s => parse(s))
  .filter(r => r.success)
  .map(r => r.value);

earliest(dates);  // 1999
```

### latest()

Find the latest date in an array.

```typescript
function latest(
  dates: EDTFBase[],
  mode?: ComparisonMode  // default: 'max'
): EDTFBase | undefined
```

```typescript
const dates = ['2001', '2000', '1999'].map(s => parse(s))
  .filter(r => r.success)
  .map(r => r.value);

latest(dates);  // 2001
```

### groupByYear()

Group dates by year.

```typescript
function groupByYear(
  dates: (EDTFDate | EDTFDateTime)[]
): Map<number, (EDTFDate | EDTFDateTime)[]>
```

```typescript
const dates = ['2000-01', '2000-06', '2001-01'].map(s => parse(s))
  .filter(r => r.success)
  .map(r => r.value);

const groups = groupByYear(dates);
// Map {
//   2000 => [2000-01, 2000-06],
//   2001 => [2001-01]
// }
```

### groupByMonth()

Group dates by month (within the same year).

```typescript
function groupByMonth(
  dates: (EDTFDate | EDTFDateTime)[]
): Map<string, (EDTFDate | EDTFDateTime)[]>
```

```typescript
const dates = ['2000-01-15', '2000-01-20', '2000-02-10'].map(s => parse(s))
  .filter(r => r.success)
  .map(r => r.value);

const groups = groupByMonth(dates);
// Map {
//   '2000-01' => [2000-01-15, 2000-01-20],
//   '2000-02' => [2000-02-10]
// }
```

### duration()

Calculate the duration between two dates in milliseconds.

```typescript
function duration(
  start: EDTFBase,
  end: EDTFBase,
  mode?: ComparisonMode  // default: 'min'
): number
```

```typescript
const start = parse('2000-01-01');
const end = parse('2000-12-31');

if (start.success && end.success) {
  duration(start.value, end.value);  // ~31449600000 (365 days in ms)
}
```

### durationInDays()

Calculate the duration between two dates in days.

```typescript
function durationInDays(
  start: EDTFBase,
  end: EDTFBase,
  mode?: ComparisonMode
): number
```

```typescript
const start = parse('2000-01-01');
const end = parse('2000-01-08');

if (start.success && end.success) {
  durationInDays(start.value, end.value);  // 7
}
```

### durationInYears()

Calculate the duration between two dates in years.

```typescript
function durationInYears(
  start: EDTFBase,
  end: EDTFBase,
  mode?: ComparisonMode
): number
```

```typescript
const start = parse('2000');
const end = parse('2005');

if (start.success && end.success) {
  durationInYears(start.value, end.value);  // ~5
}
```

### findOverlaps()

Find overlapping dates in an array.

```typescript
function findOverlaps(dates: EDTFBase[]): [EDTFBase, EDTFBase][]
```

Returns pairs of dates whose min/max ranges overlap.

```typescript
const dates = ['2000', '2000-06', '2001'].map(s => parse(s))
  .filter(r => r.success)
  .map(r => r.value);

findOverlaps(dates);
// [[2000, 2000-06]] (2000-06 is contained within 2000)
```

### unique()

Remove duplicate dates from an array.

```typescript
function unique(dates: EDTFBase[]): EDTFBase[]
```

Dates are considered duplicates if they have the same EDTF string.

```typescript
const dates = ['2000', '2000', '2001'].map(s => parse(s))
  .filter(r => r.success)
  .map(r => r.value);

unique(dates);  // [2000, 2001]
```
