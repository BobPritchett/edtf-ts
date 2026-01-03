# Member (Four-Bound Range)

The fundamental temporal representation used by `@edtf-ts` for precise temporal reasoning.

## Overview

All EDTF values are normalized to **Members** - four-bound ranges that capture temporal uncertainty. This normalization enables precise comparison using Allen's interval algebra.

## Type Definition

```typescript
interface Member {
  // Four bounds representing range uncertainty
  sMin: bigint | null;  // Earliest possible start
  sMax: bigint | null;  // Latest possible start
  eMin: bigint | null;  // Earliest possible end
  eMax: bigint | null;  // Latest possible end

  // Bound types
  startKind: 'closed' | 'open' | 'unknown';
  endKind: 'closed' | 'open' | 'unknown';

  // Precision level
  precision: 'minute' | 'hour' | 'day' | 'month' | 'year' | 'subyear' | 'mixed' | 'unknown';

  // Optional qualifications
  qualifiers?: {
    uncertain?: boolean;
    approximate?: boolean;
  };
}
```

## Why Four Bounds?

EDTF values have inherent uncertainty that requires four separate bounds:

### Simple Date - Collapsed Bounds
```typescript
// '1985-04-12'
{
  sMin: 482198400000n,   // 1985-04-12T00:00:00.000Z
  sMax: 482198400000n,   // Same - exact start time
  eMin: 482284799999n,   // 1985-04-12T23:59:59.999Z
  eMax: 482284799999n,   // Same - exact end time
  startKind: 'closed',
  endKind: 'closed',
  precision: 'day'
}
```

The start is **exactly** midnight, the end is **exactly** 23:59:59.999.

### Interval - Separated Bounds
```typescript
// '1985/1990'
{
  sMin: 473385600000n,   // 1985-01-01T00:00:00.000Z (earliest start)
  sMax: 504921599999n,   // 1985-12-31T23:59:59.999Z (latest start)
  eMin: 631152000000n,   // 1990-01-01T00:00:00.000Z (earliest end)
  eMax: 662687999999n,   // 1990-12-31T23:59:59.999Z (latest end)
  startKind: 'closed',
  endKind: 'closed',
  precision: 'year'
}
```

The start could be **anytime in 1985**, the end could be **anytime in 1990**.

### Unspecified Digits - Range Uncertainty
```typescript
// '198X' (any year 1980-1989)
{
  sMin: 315532800000n,   // 1980-01-01T00:00:00.000Z
  sMax: 599616000000n,   // 1989-01-01T00:00:00.000Z
  eMin: 347155199999n,   // 1980-12-31T23:59:59.999Z
  eMax: 631151999999n,   // 1989-12-31T23:59:59.999Z
  startKind: 'closed',
  endKind: 'closed',
  precision: 'year'
}
```

Could start as early as 1980, as late as 1989. Could end as early as 1980, as late as 1989.

## Properties

### sMin - Earliest Possible Start

```typescript
sMin: bigint | null
```

The earliest time this value could **start**.

- For `'1985'`: January 1, 1985 at 00:00:00.000
- For `'198X'`: January 1, 1980 at 00:00:00.000 (earliest decade year)
- For `'1985/..'`: January 1, 1985 at 00:00:00.000

### sMax - Latest Possible Start

```typescript
sMax: bigint | null
```

The latest time this value could **start**.

- For `'1985'`: January 1, 1985 at 00:00:00.000 (same as sMin)
- For `'198X'`: January 1, 1989 at 00:00:00.000 (latest decade year start)
- For `'1985/1990'`: December 31, 1985 at 23:59:59.999 (latest start still in 1985)

### eMin - Earliest Possible End

```typescript
eMin: bigint | null
```

The earliest time this value could **end**.

- For `'1985'`: December 31, 1985 at 23:59:59.999
- For `'198X'`: December 31, 1980 at 23:59:59.999 (earliest end if it only lasted one year)
- For `'1985/1990'`: January 1, 1990 at 00:00:00.000 (earliest time in 1990)

### eMax - Latest Possible End

```typescript
eMax: bigint | null
```

The latest time this value could **end**.

- For `'1985'`: December 31, 1985 at 23:59:59.999 (same as eMin)
- For `'198X'`: December 31, 1989 at 23:59:59.999
- For `'1985/1990'`: December 31, 1990 at 23:59:59.999

### Bound Kinds

#### startKind / endKind

```typescript
type BoundKind = 'closed' | 'open' | 'unknown';
```

- **`'closed'`**: Normal, bounded value
- **`'open'`**: Unbounded (infinite) - represented by `null` bounds and `..` in EDTF
- **`'unknown'`**: Missing information - represented by `null` bounds and empty endpoint

```typescript
// Closed bounds - normal date
normalize(parse('1985').value).members[0].startKind;  // 'closed'

// Open end - unbounded future
normalize(parse('1985/..').value).members[0].endKind;  // 'open'

// Unknown end - missing data
normalize(parse('1985/').value).members[0].endKind;  // 'unknown'
```

### Precision

```typescript
type Precision = 'minute' | 'hour' | 'day' | 'month' | 'year' | 'subyear' | 'mixed' | 'unknown';
```

The precision level of the temporal value.

```typescript
normalize(parse('1985').value).members[0].precision;          // 'year'
normalize(parse('1985-04').value).members[0].precision;       // 'month'
normalize(parse('1985-04-12').value).members[0].precision;    // 'day'
normalize(parse('1985-04-12T10:30').value).members[0].precision;  // 'minute'
```

### Qualifiers

```typescript
qualifiers?: {
  uncertain?: boolean;
  approximate?: boolean;
}
```

Stores uncertainty and approximation markers from EDTF.

```typescript
normalize(parse('1985?').value).members[0].qualifiers;
// { uncertain: true }

normalize(parse('1985~').value).members[0].qualifiers;
// { approximate: true }

normalize(parse('1985%').value).members[0].qualifiers;
// { uncertain: true, approximate: true }
```

::: warning Qualifiers Don't Widen Bounds
Qualifiers are metadata only. `1985?` has the same numeric bounds as `1985`. EDTF doesn't define tolerance values for qualifiers.
:::

## BigInt Epoch Milliseconds

All bounds use **BigInt** to support extreme years beyond JavaScript's Date limits:

```typescript
// JavaScript Date limits: ±8.64e15 milliseconds (±273,790 years from 1970)
const jsLimit = new Date(-8640000000000000);  // Sat Apr 19 -271821

// BigInt has no such limits
normalize(parse('-100000').value).members[0].sMin;
// Works! Returns BigInt for 100,001 BC
```

### Converting to JavaScript Date

For display or when you know the year is safe:

```typescript
import { bigIntToNumber, isSafeBigInt } from '@edtf-ts';

const member = normalize(parse('1985').value).members[0];

if (member.sMin !== null && isSafeBigInt(member.sMin)) {
  const ms = bigIntToNumber(member.sMin);
  const date = new Date(ms);
  console.log(date.toISOString());  // "1985-01-01T00:00:00.000Z"
}
```

## Normalization Examples

### Year
```typescript
normalize(parse('1985').value).members[0]
// {
//   sMin: 473385600000n,   // 1985-01-01T00:00:00.000Z
//   sMax: 473385600000n,
//   eMin: 504921599999n,   // 1985-12-31T23:59:59.999Z
//   eMax: 504921599999n,
//   startKind: 'closed',
//   endKind: 'closed',
//   precision: 'year'
// }
```

### Month
```typescript
normalize(parse('1985-04').value).members[0]
// {
//   sMin: 482198400000n,   // 1985-04-01T00:00:00.000Z
//   sMax: 482198400000n,
//   eMin: 484790399999n,   // 1985-04-30T23:59:59.999Z
//   eMax: 484790399999n,
//   startKind: 'closed',
//   endKind: 'closed',
//   precision: 'month'
// }
```

### Interval
```typescript
normalize(parse('2004-06-01/2004-06-20').value).members[0]
// {
//   sMin: 1086048000000n,  // 2004-06-01T00:00:00.000Z
//   sMax: 1086048000000n,  // Same - precise day
//   eMin: 1087775999999n,  // 2004-06-20T23:59:59.999Z
//   eMax: 1087775999999n,  // Same - precise day
//   startKind: 'closed',
//   endKind: 'closed',
//   precision: 'day'
// }
```

### Unspecified Decade
```typescript
normalize(parse('198X').value).members[0]
// {
//   sMin: 315532800000n,   // 1980-01-01T00:00:00.000Z
//   sMax: 599616000000n,   // 1989-01-01T00:00:00.000Z
//   eMin: 347155199999n,   // 1980-12-31T23:59:59.999Z
//   eMax: 631151999999n,   // 1989-12-31T23:59:59.999Z
//   startKind: 'closed',
//   endKind: 'closed',
//   precision: 'year'
// }
```

### Open End
```typescript
normalize(parse('1985/..').value).members[0]
// {
//   sMin: 473385600000n,   // 1985-01-01T00:00:00.000Z
//   sMax: 473385600000n,
//   eMin: null,            // Unbounded
//   eMax: null,
//   startKind: 'closed',
//   endKind: 'open',       // Indicates unbounded
//   precision: 'year'
// }
```

### Unknown End
```typescript
normalize(parse('1985/').value).members[0]
// {
//   sMin: 473385600000n,   // 1985-01-01T00:00:00.000Z
//   sMax: 473385600000n,
//   eMin: null,            // Unknown
//   eMax: null,
//   startKind: 'closed',
//   endKind: 'unknown',    // Indicates missing data
//   precision: 'year'
// }
```

## Shape Type

The `normalize()` function returns a `Shape` that contains one or more Members:

```typescript
interface Shape {
  members: Member[];
  listMode?: 'oneOf' | 'allOf';
}
```

**Most EDTF values produce a single Member:**
```typescript
normalize(parse('1985').value).members.length;  // 1
```

**Sets and Lists produce multiple Members:**
```typescript
normalize(parse('[1985,1990,1995]').value).members.length;  // 3
```

## Using Members

### Direct Comparison

```typescript
import { normalize, allen } from '@edtf-ts';

const a = normalize(parse('1985').value).members[0];
const b = normalize(parse('1990').value).members[0];

allen.before(a, b);   // 'YES'
allen.during(a, b);   // 'NO'
allen.overlaps(a, b); // 'NO'
```

### Building Custom Relations

```typescript
import { normalize } from '@edtf-ts';

function startsInSameYear(a: EDTFBase, b: EDTFBase): boolean {
  const normA = normalize(a).members[0];
  const normB = normalize(b).members[0];

  if (!normA || !normB || normA.sMin === null || normB.sMin === null) {
    return false;
  }

  const yearA = new Date(Number(normA.sMin)).getUTCFullYear();
  const yearB = new Date(Number(normB.sMin)).getUTCFullYear();

  return yearA === yearB;
}
```

### Visualizing Bounds

```typescript
import { normalize, dateToEpochMs } from '@edtf-ts';

function visualizeBounds(edtf: string) {
  const parsed = parse(edtf);
  if (!parsed.success) return;

  const member = normalize(parsed.value).members[0];

  console.log(`EDTF: ${edtf}`);
  console.log(`Start range: ${formatBound(member.sMin)} to ${formatBound(member.sMax)}`);
  console.log(`End range: ${formatBound(member.eMin)} to ${formatBound(member.eMax)}`);
  console.log(`Start kind: ${member.startKind}`);
  console.log(`End kind: ${member.endKind}`);
}

function formatBound(value: bigint | null): string {
  if (value === null) return 'null (unbounded/unknown)';
  try {
    return new Date(Number(value)).toISOString();
  } catch {
    return value.toString();
  }
}

visualizeBounds('1985');
// EDTF: 1985
// Start range: 1985-01-01T00:00:00.000Z to 1985-01-01T00:00:00.000Z
// End range: 1985-12-31T23:59:59.999Z to 1985-12-31T23:59:59.999Z
// Start kind: closed
// End kind: closed

visualizeBounds('198X');
// EDTF: 198X
// Start range: 1980-01-01T00:00:00.000Z to 1989-01-01T00:00:00.000Z
// End range: 1980-12-31T23:59:59.999Z to 1989-12-31T23:59:59.999Z
// Start kind: closed
// End kind: closed
```

## See Also

- [Comparison Guide](/guide/comparison) - Understanding four-valued logic
- [@edtf-ts API](/api/compare) - Full comparison API
- [EDTFDate](/api/types/date) - Source date type
- [EDTFInterval](/api/types/interval) - Interval representation
