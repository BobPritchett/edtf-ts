# @edtf-ts/compare

Advanced temporal comparison using Allen's interval algebra and four-valued logic for EDTF dates.

## Installation

```bash
pnpm add @edtf-ts/compare
```

::: tip
@edtf-ts/compare depends on @edtf-ts/core. Both packages will be installed.
:::

## Overview

The compare package provides:

- **Allen's 13 interval relations** - Complete temporal relationship algebra
- **Four-valued logic** - YES/NO/MAYBE/UNKNOWN truth values for precise reasoning
- **Four-bound normalization** - All EDTF types converted to (sMin, sMax, eMin, eMax) ranges
- **BigInt support** - Handle extreme years beyond JavaScript Date limits
- **Database preparation** - Convert EDTF to queryable columns (coming soon)

## Quick Start

```typescript
import { parse } from '@edtf-ts/core';
import { isBefore, during, overlaps } from '@edtf-ts/compare';

const a = parse('1985');
const b = parse('1990');

if (a.success && b.success) {
  isBefore(a.value, b.value);  // 'YES'
  during(a.value, b.value);    // 'NO'
  overlaps(a.value, b.value);  // 'NO'
}
```

## Truth Values

All comparison functions return one of four truth values:

- **`YES`** - Definitely true (bounds prove the relation holds)
- **`NO`** - Definitely false (bounds prove the relation cannot hold)
- **`MAYBE`** - Uncertain (bounds allow but don't prove the relation)
- **`UNKNOWN`** - Cannot determine (missing endpoint information)

```typescript
type Truth = 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN';
```

### When You Get Each Value

#### YES - Definite Truth
```typescript
// Ranges completely separate
isBefore(parse('1980').value, parse('1990').value);  // 'YES'

// Ranges completely nested
during(parse('1985-04').value, parse('1985').value);  // 'YES'
```

#### NO - Definite Falsehood
```typescript
// Same start time - cannot be "during"
during(parse('2004-06-01/2004-06-20').value, parse('2004-06').value);  // 'NO'

// Completely separate - cannot overlap
overlaps(parse('1980').value, parse('1990').value);  // 'NO'
```

#### MAYBE - Uncertain
```typescript
// Unspecified digits create uncertainty
const decade = parse('198X').value;  // 1980-1989
const year = parse('1985').value;
equals(decade, year);  // 'MAYBE' - could be 1985 or another year

// Open endpoints create possibility
const ongoing = parse('2020/..').value;  // Started 2020, unbounded end
during(parse('2024').value, ongoing);  // 'MAYBE' - could still be ongoing
```

#### UNKNOWN - Missing Information
```typescript
// Empty endpoint means unknown
const unknown = parse('1985/').value;  // Unknown end
overlaps(unknown, parse('1990').value);  // 'UNKNOWN'
```

## Allen Relations (Simple API)

These functions take two EDTF values and return a truth value.

### Temporal Ordering

#### isBefore()
```typescript
function isBefore(a: EDTFBase, b: EDTFBase): Truth
```

Check if A ends before B starts.

```typescript
isBefore(parse('1980').value, parse('1990').value);  // 'YES'
isBefore(parse('1985').value, parse('1985').value);  // 'NO'
```

#### isAfter()
```typescript
function isAfter(a: EDTFBase, b: EDTFBase): Truth
```

Check if A starts after B ends. Symmetric to `isBefore`.

### Adjacency

#### meets()
```typescript
function meets(a: EDTFBase, b: EDTFBase): Truth
```

Check if A ends exactly where B starts (adjacent, no gap).

```typescript
// With day precision, there's a 1ms gap
meets(parse('1985-04').value, parse('1985-05').value);  // 'NO'

// Must meet at exact same instant
meets(parse('1985/1990').value, parse('1990/1995').value);  // 'NO'
```

### Overlap

#### overlaps()
```typescript
function overlaps(a: EDTFBase, b: EDTFBase): Truth
```

Check if A and B overlap (share some time period).

```typescript
overlaps(parse('1980/1990').value, parse('1985/1995').value);  // 'YES'
overlaps(parse('1980').value, parse('1990').value);            // 'NO'
```

### Containment

#### starts()
```typescript
function starts(a: EDTFBase, b: EDTFBase): Truth
```

Check if A and B start together, but A ends first.

```typescript
starts(parse('1985-04').value, parse('1985').value);  // 'YES'
starts(parse('1985').value, parse('1985').value);     // 'NO' (must end first)
```

#### during()
```typescript
function during(a: EDTFBase, b: EDTFBase): Truth
```

Check if A is completely contained within B (starts after, ends before).

```typescript
during(parse('1985-04').value, parse('1985').value);  // 'YES'
during(parse('1985').value, parse('1985').value);     // 'NO' (same bounds)
```

#### contains()
```typescript
function contains(a: EDTFBase, b: EDTFBase): Truth
```

Check if A completely contains B. Symmetric to `during`.

#### finishes()
```typescript
function finishes(a: EDTFBase, b: EDTFBase): Truth
```

Check if A and B end together, but A starts later.

```typescript
finishes(parse('1985-12').value, parse('1985').value);  // 'YES'
```

### Equality

#### equals()
```typescript
function equals(a: EDTFBase, b: EDTFBase): Truth
```

Check if A and B have identical bounds.

```typescript
equals(parse('1985').value, parse('1985').value);  // 'YES'
equals(parse('1985').value, parse('1985-01').value);  // 'NO'

// Unspecified digits create uncertainty
equals(parse('198X').value, parse('1985').value);  // 'MAYBE'
```

## Derived Relations

Higher-level relations built from Allen's base relations.

#### intersects()
```typescript
function intersects(a: EDTFBase, b: EDTFBase): Truth
```

Check if A and B share any time period (overlaps, starts, during, finishes, or equals).

```typescript
intersects(parse('1980/1990').value, parse('1985/1995').value);  // 'YES'
intersects(parse('1980').value, parse('1990').value);            // 'NO'
```

#### disjoint()
```typescript
function disjoint(a: EDTFBase, b: EDTFBase): Truth
```

Check if A and B do not share any time period (before or after).

#### touches()
```typescript
function touches(a: EDTFBase, b: EDTFBase): Truth
```

Check if A and B are adjacent (meets or metBy).

#### duringOrEqual()
```typescript
function duringOrEqual(a: EDTFBase, b: EDTFBase): Truth
```

Check if A is during B or equals B.

```typescript
duringOrEqual(parse('1985-04').value, parse('1985').value);  // 'YES'
duringOrEqual(parse('1985').value, parse('1985').value);     // 'YES'
```

#### containsOrEqual()
```typescript
function containsOrEqual(a: EDTFBase, b: EDTFBase): Truth
```

Check if A contains B or equals B.

## Normalization

Convert EDTF values to four-bound ranges for advanced use cases.

### normalize()

```typescript
function normalize(edtf: EDTFBase): Shape
```

Convert an EDTF value to normalized Member(s).

```typescript
import { parse } from '@edtf-ts/core';
import { normalize } from '@edtf-ts/compare';

const year = parse('1985');
if (year.success) {
  const norm = normalize(year.value);
  console.log(norm.members[0]);
  // {
  //   sMin: 473385600000n,      // 1985-01-01T00:00:00.000Z
  //   sMax: 473385600000n,
  //   eMin: 504921599999n,      // 1985-12-31T23:59:59.999Z
  //   eMax: 504921599999n,
  //   startKind: 'closed',
  //   endKind: 'closed',
  //   precision: 'year'
  // }
}
```

### Member Type

The fundamental four-bound range representation.

```typescript
interface Member {
  sMin: bigint | null;  // Earliest possible start
  sMax: bigint | null;  // Latest possible start
  eMin: bigint | null;  // Earliest possible end
  eMax: bigint | null;  // Latest possible end

  startKind: 'closed' | 'open' | 'unknown';
  endKind: 'closed' | 'open' | 'unknown';

  precision: 'minute' | 'hour' | 'day' | 'month' | 'year' | 'subyear' | 'mixed' | 'unknown';

  qualifiers?: {
    uncertain?: boolean;
    approximate?: boolean;
  };
}
```

**Bound Meanings:**
- **Closed**: Normal range with defined bounds
- **Open**: Unbounded (e.g., `1985/..` has open end)
- **Unknown**: Missing information (e.g., `1985/` has unknown end)

### Normalization Examples

#### Simple Date
```typescript
normalize(parse('1985-04-12').value);
// sMin = sMax = 1985-04-12T00:00:00.000Z
// eMin = eMax = 1985-04-12T23:59:59.999Z
```

#### Interval
```typescript
normalize(parse('1985/1990').value);
// sMin = sMax = 1985-01-01T00:00:00.000Z
// eMin = eMax = 1990-12-31T23:59:59.999Z
```

#### Unspecified Digits
```typescript
normalize(parse('198X').value);
// sMin = 1980-01-01T00:00:00.000Z  (earliest possible)
// sMax = 1989-01-01T00:00:00.000Z  (latest possible start)
// eMin = 1980-12-31T23:59:59.999Z  (earliest possible end)
// eMax = 1989-12-31T23:59:59.999Z  (latest possible)
```

#### Open Endpoints
```typescript
normalize(parse('1985/..').value);
// sMin = sMax = 1985-01-01T00:00:00.000Z
// eMin = eMax = null  (unbounded)
// endKind = 'open'
```

#### Unknown Endpoints
```typescript
normalize(parse('1985/').value);
// sMin = sMax = 1985-01-01T00:00:00.000Z
// eMin = eMax = null  (unknown)
// endKind = 'unknown'
```

## Advanced API

For power users who need direct access to the Member-level functions.

### Allen Relations (Member-level)

```typescript
import { allen } from '@edtf-ts/compare';

const a: Member = { sMin: 0n, sMax: 10n, eMin: 20n, eMax: 30n, ... };
const b: Member = { sMin: 25n, sMax: 35n, eMin: 45n, eMax: 55n, ... };

allen.before(a, b);   // 'YES'
allen.during(a, b);   // 'NO'
allen.overlaps(a, b); // 'YES'
```

Available as `allen.*`:
- `before`, `after`
- `meets`, `metBy`
- `overlaps`, `overlappedBy`
- `starts`, `startedBy`
- `during`, `contains`
- `finishes`, `finishedBy`
- `equals`

### Named Exports

Member-level functions are also available as named exports with `allen` prefix:

```typescript
import { allenBefore, allenDuring, allenEquals } from '@edtf-ts/compare';
```

### Derived Relations (Member-level)

```typescript
import { derived } from '@edtf-ts/compare';

derived.intersects(a, b);
derived.disjoint(a, b);
derived.touches(a, b);
derived.duringOrEqual(a, b);
derived.containsOrEqual(a, b);
```

Also available with `derived` prefix:
```typescript
import { derivedIntersects, derivedDisjoint } from '@edtf-ts/compare';
```

## Truth Value Combinators

Combine multiple truth values with quantifiers.

### combineWithAny()

```typescript
function combineWithAny(truths: Truth[]): Truth
```

Returns YES if **any** value is YES, otherwise propagates UNKNOWN/MAYBE/NO.

```typescript
import { combineWithAny } from '@edtf-ts/compare';

combineWithAny(['YES', 'NO', 'MAYBE']);     // 'YES'
combineWithAny(['NO', 'MAYBE', 'UNKNOWN']); // 'UNKNOWN'
combineWithAny(['NO', 'MAYBE']);            // 'MAYBE'
combineWithAny(['NO', 'NO']);               // 'NO'
```

### combineWithAll()

```typescript
function combineWithAll(truths: Truth[]): Truth
```

Returns NO if **any** value is NO, otherwise propagates UNKNOWN/MAYBE/YES.

```typescript
import { combineWithAll } from '@edtf-ts/compare';

combineWithAll(['YES', 'YES', 'YES']);      // 'YES'
combineWithAll(['YES', 'MAYBE']);           // 'MAYBE'
combineWithAll(['YES', 'NO']);              // 'NO'
```

### negate()

```typescript
function negate(truth: Truth): Truth
```

Logical negation of a truth value.

```typescript
import { negate } from '@edtf-ts/compare';

negate('YES');     // 'NO'
negate('NO');      // 'YES'
negate('MAYBE');   // 'MAYBE'
negate('UNKNOWN'); // 'UNKNOWN'
```

### and() / or()

```typescript
function and(a: Truth, b: Truth): Truth
function or(a: Truth, b: Truth): Truth
```

Logical AND/OR operations.

## Epoch Conversion

Convert dates to BigInt epoch milliseconds.

### dateToEpochMs()

```typescript
function dateToEpochMs(date: DateComponents): bigint
```

```typescript
import { dateToEpochMs } from '@edtf-ts/compare';

dateToEpochMs({ year: 1985, month: 4, day: 12 });
// 482198400000n

// Supports extreme years
dateToEpochMs({ year: -100000, month: 1, day: 1 });
// Works with BigInt!
```

### Helper Functions

```typescript
function startOfYear(year: number): bigint
function startOfMonth(year: number, month: number): bigint
function startOfDay(year: number, month: number, day: number): bigint

function endOfYear(year: number): bigint
function endOfMonth(year: number, month: number): bigint
function endOfDay(year: number, month: number, day: number): bigint
```

## Utilities

### BigInt Utilities

```typescript
function minBigInt(...values: bigint[]): bigint
function maxBigInt(...values: bigint[]): bigint
function clampBigInt(value: bigint, min: bigint, max: bigint): bigint
function bigIntToNumber(value: bigint): number
function isSafeBigInt(value: bigint): boolean
```

### Calendar Utilities

```typescript
function isLeapYear(year: number): boolean
function getDaysInMonth(year: number, month: number): number
function daysSinceEpoch(year: number, month: number, day: number): number
function astronomicalToHistorical(year: number): string
function historicalToAstronomical(yearStr: string): number
```

## Season Mappings

Configure how seasons map to months.

### DEFAULT_SEASON_MAPPINGS

```typescript
import { DEFAULT_SEASON_MAPPINGS } from '@edtf-ts/compare';

console.log(DEFAULT_SEASON_MAPPINGS[21]);
// { start: { month: 3 }, end: { month: 5 } }  // Spring: March-May
```

### SeasonMapping Type

```typescript
interface SeasonMapping {
  start: { month: number; day?: number };
  end: { month: number; day?: number };
}
```

## Examples

### Museum Collection Dating

```typescript
import { parse } from '@edtf-ts/core';
import { during, isBefore } from '@edtf-ts/compare';

// Artifact dated to "sometime in the 1800s"
const artifact = parse('18XX').value;

// Exhibition period
const exhibition = parse('1850/1860').value;

// Could the artifact be from the exhibition period?
during(artifact, exhibition);  // 'MAYBE' - 18XX could be 1850-1859
```

### Historical Event Ordering

```typescript
// D-Day with approximate date for planning
const planning = parse('1944-06-~01').value;  // Approximately early June
const dday = parse('1944-06-06').value;

// Did planning happen before D-Day?
isBefore(planning, dday);  // 'MAYBE' - approximate date creates uncertainty
```

### Ongoing Projects

```typescript
// Project with open end date
const project = parse('2020-01/..').value;
const now = parse('2024').value;

// Is the project still ongoing?
during(now, project);  // 'MAYBE' - open end means it could still be active
```

## See Also

- [Comparison Guide](/guide/comparison) - Conceptual overview and use cases
- [Core Types](/api/types/date) - EDTF type reference
- [@edtf-ts/utils](/api/utils) - Simple comparison utilities
