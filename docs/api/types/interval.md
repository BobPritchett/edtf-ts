# EDTFInterval

Represents a time interval between two dates (Levels 0 and 1).

## Interface

```typescript
interface EDTFInterval extends EDTFBase {
  type: 'Interval';
  start: EDTFDate | EDTFDateTime | EDTFSeason | null;
  end: EDTFDate | EDTFDateTime | EDTFSeason | null;
  openStart?: boolean;
  openEnd?: boolean;
  qualification?: Qualification;

  contains?(date: EDTFDate | EDTFDateTime | Date): boolean;
  overlaps?(other: EDTFInterval): boolean;
  by?(unit: 'year' | 'month' | 'day'): IterableIterator<EDTFDate>;
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'Interval'` | Type discriminator |
| `start` | `EDTFDate \| EDTFDateTime \| EDTFSeason \| null` | Start of interval (null if unknown) |
| `end` | `EDTFDate \| EDTFDateTime \| EDTFSeason \| null` | End of interval (null if unknown) |
| `openStart` | `boolean?` | True if interval has open start (`..`) |
| `openEnd` | `boolean?` | True if interval has open end (`..`) |
| `qualification` | `Qualification?` | Uncertainty/approximation flags |

### Inherited from EDTFBase

| Property | Type | Description |
|----------|------|-------------|
| `level` | `0 \| 1` | Level 0 or 1 |
| `edtf` | `string` | Original EDTF string |
| `precision` | `Precision` | Precision of the interval |
| `min` | `Date` | Start of the interval range |
| `max` | `Date` | End of the interval range |

## Usage

```typescript
import { parse, isEDTFInterval } from '@edtf-ts/core';

const result = parse('1964/2008');

if (result.success && isEDTFInterval(result.value)) {
  const interval = result.value;

  console.log(interval.start?.edtf);  // '1964'
  console.log(interval.end?.edtf);    // '2008'
  console.log(interval.min);          // Date: 1964-01-01
  console.log(interval.max);          // Date: 2008-12-31
}
```

## Interval Types

### Closed Intervals

Both start and end are specified:

```typescript
parse('1964/2008');           // Year interval
parse('2004-06/2006-08');     // Month interval
parse('2004-02-01/2005-02-08');  // Day interval
```

### Open Intervals

Use `..` to indicate an open (unbounded) end:

```typescript
parse('../1985-04-12');  // Before a date
parse('1985-04-12/..');  // After a date
```

```typescript
const result = parse('../1985-04-12');
if (result.success && isEDTFInterval(result.value)) {
  console.log(result.value.openStart);  // true
  console.log(result.value.start);      // null
  console.log(result.value.end?.edtf);  // '1985-04-12'
}
```

### Unknown Endpoints

Use empty string for unknown (but existing) endpoints:

```typescript
parse('/1985-04-12');   // Unknown start
parse('1985-04-12/');   // Unknown end
```

## Qualified Intervals

Endpoints can have qualifications (Level 1):

```typescript
parse('1984?/2004~');  // Uncertain start, approximate end
parse('1984~/2004?');  // Approximate start, uncertain end
```

```typescript
const result = parse('1984?/2004~');
if (result.success && isEDTFInterval(result.value)) {
  console.log(result.value.start?.qualification?.uncertain);    // true
  console.log(result.value.end?.qualification?.approximate);    // true
}
```

## Methods

### contains()

Check if a date is within the interval:

```typescript
const result = parse('2000/2010');
if (result.success && isEDTFInterval(result.value)) {
  const interval = result.value;

  interval.contains(new Date('2005-06-15'));  // true
  interval.contains(new Date('1990-01-01'));  // false
}
```

### overlaps()

Check if two intervals overlap:

```typescript
const r1 = parse('2000/2010');
const r2 = parse('2005/2015');

if (r1.success && r2.success &&
    isEDTFInterval(r1.value) && isEDTFInterval(r2.value)) {
  r1.value.overlaps(r2.value);  // true
}
```

### by()

Iterate through the interval:

```typescript
const result = parse('2000/2003');
if (result.success && isEDTFInterval(result.value)) {
  for (const year of result.value.by('year')) {
    console.log(year.edtf);  // '2000', '2001', '2002', '2003'
  }
}
```

## Type Guard

```typescript
import { isEDTFInterval } from '@edtf-ts/core';

const result = parse(input);
if (result.success && isEDTFInterval(result.value)) {
  // TypeScript knows result.value is EDTFInterval
  console.log(result.value.start);
}
```
