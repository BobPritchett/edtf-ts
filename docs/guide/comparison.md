# Temporal Comparison

EDTF-TS provides two approaches to comparing dates, each suited for different use cases.

## Quick Comparison

For simple comparisons using min/max/midpoint logic (all from `@edtf-ts/core`):

```typescript
import { parse } from '@edtf-ts/core';
import { compare, sort, earliest, latest } from '@edtf-ts/core';

const dates = [
  parse('2000').value,
  parse('1985').value,
  parse('1990').value
];

// Basic comparison (-1, 0, or 1)
compare(dates[0], dates[1]);  // 1 (2000 > 1985)

// Sort array
const sorted = sort(dates);  // [1985, 1990, 2000]

// Find extremes
earliest(dates);  // 1985
latest(dates);    // 2000
```

**Use simple comparison when:**
- You need simple before/after comparisons
- You're sorting or filtering dates
- You don't need to reason about uncertainty
- You're working with complete, precise dates

## Advanced Comparison

For precise temporal reasoning with four-valued logic (also from `@edtf-ts/core`):

```typescript
import { parse } from '@edtf-ts/core';
import { isBefore, during, overlaps, equals } from '@edtf-ts/core';

const a = parse('1985').value;
const b = parse('1990').value;

isBefore(a, b);   // 'YES' - definitely before
during(a, b);     // 'NO' - not contained within
overlaps(a, b);   // 'NO' - no time overlap
equals(a, b);     // 'NO' - different ranges
```

**Use advanced comparison when:**
- You need precise temporal relationships (Allen's algebra)
- You're working with intervals, uncertainty, or approximation
- You need database integration
- You want YES/NO/MAYBE/UNKNOWN truth values
- You're building temporal reasoning systems

## Understanding Four-Valued Logic

The compare package returns one of four truth values:

### YES - Definite Truth

The relationship **definitely holds** based on the bounds.

```typescript
import { isBefore, during } from '@edtf-ts/core';

// Completely separate years
isBefore(parse('1980').value, parse('1990').value);  // 'YES'

// Month definitely within year
during(parse('1985-04').value, parse('1985').value);  // 'YES'
```

### NO - Definite Falsehood

The relationship **definitely does not hold**.

```typescript
// Same bounds - cannot be "during"
during(parse('1985').value, parse('1985').value);  // 'NO'

// No overlap
overlaps(parse('1980').value, parse('1990').value);  // 'NO'
```

### MAYBE - Uncertain

The relationship **might hold** but we can't be certain.

```typescript
// Unspecified digits create range uncertainty
const decade = parse('198X').value;  // Could be 1980-1989
const year = parse('1985').value;
equals(decade, year);  // 'MAYBE' - 198X might mean 1985

// Open-ended intervals
const ongoing = parse('2020/..').value;
during(parse('2024').value, ongoing);  // 'MAYBE' - might still be ongoing
```

### UNKNOWN - Missing Information

We **cannot determine** the relationship due to missing data.

```typescript
// Unknown endpoint
const unknown = parse('1985/').value;  // Unknown end
overlaps(unknown, parse('1990').value);  // 'UNKNOWN'
```

## Allen's Interval Algebra

Allen's algebra defines 13 exhaustive, mutually exclusive relations between time intervals.

### The 13 Relations

```
A before B:        A:[====]
                   B:        [====]

A meets B:         A:[====]
                   B:      [====]

A overlaps B:      A:[====]
                   B:    [====]

A starts B:        A:[==]
                   B:[====]

A during B:        A:  [==]
                   B:[======]

A finishes B:      A:    [==]
                   B:[======]

A equals B:        A:[======]
                   B:[======]
```

Plus 6 symmetric relations: `after`, `metBy`, `overlappedBy`, `startedBy`, `contains`, `finishedBy`.

### Practical Examples

#### Museum Artifacts

```typescript
import { parse } from '@edtf-ts/core';
import { during, isBefore, equals } from '@edtf-ts/core';

// Artifact with uncertain dating
const artifact = parse('18XX').value;  // Sometime in 1800s

// Historical periods
const victorian = parse('1837/1901').value;
const earlyModern = parse('1800/1850').value;

// Could it be Victorian?
during(artifact, victorian);  // 'MAYBE' - 18XX could be 1837-1899

// Could it be early modern?
during(artifact, earlyModern);  // 'MAYBE' - 18XX could be 1800-1850

// Specific dating
const specific = parse('1845').value;
during(specific, victorian);  // 'YES' - definitely Victorian
```

#### Project Timelines

```typescript
// Project phases
const planning = parse('2020-01/2020-06').value;
const development = parse('2020-06/2021-01').value;
const launch = parse('2021-01').value;

// Do phases meet?
meets(planning, development);  // 'NO' - there's a gap at day/hour level

// Does development contain launch month?
contains(development, launch);  // 'YES' - launch month is during development
```

#### Historical Events

```typescript
// D-Day with approximate planning date
const planning = parse('1944-06-~01').value;  // ~June 1st
const dday = parse('1944-06-06').value;

// Did planning come before D-Day?
isBefore(planning, dday);  // 'MAYBE' - approximate date creates uncertainty

// More certain dating
const normandy = parse('1944-06').value;
during(dday, normandy);  // 'YES' - D-Day was definitely in June 1944
```

## Four-Bound Normalization

All EDTF values are normalized to four-bound ranges:

```typescript
import { normalize } from '@edtf-ts/core';

const year = parse('1985');
if (year.success) {
  const norm = normalize(year.value);
  console.log(norm.members[0]);
  // {
  //   sMin: 473385600000n,   // Earliest possible start
  //   sMax: 473385600000n,   // Latest possible start
  //   eMin: 504921599999n,   // Earliest possible end
  //   eMax: 504921599999n,   // Latest possible end
  //   startKind: 'closed',
  //   endKind: 'closed',
  //   precision: 'year'
  // }
}
```

### Why Four Bounds?

EDTF values have inherent uncertainty:

**Precise Date** (`1985-04-12`):
- Start is exactly 1985-04-12 00:00:00.000
- End is exactly 1985-04-12 23:59:59.999
- All four bounds are the same

**Year** (`1985`):
- Start is exactly 1985-01-01 00:00:00.000
- End is exactly 1985-12-31 23:59:59.999
- Represents the entire year range

**Unspecified** (`198X`):
- Start could be 1980-01-01 (earliest) or 1989-01-01 (latest start)
- End could be 1980-12-31 (earliest end) or 1989-12-31 (latest)
- Four different bounds capture the uncertainty

**Interval** (`1985/1990`):
- Start is sometime during 1985
- End is sometime during 1990
- sMin/sMax represent start uncertainty, eMin/eMax represent end uncertainty

### Normalization Examples

```typescript
import { normalize } from '@edtf-ts/core';

// Simple date: all bounds are endpoints of the day
normalize(parse('1985-04-12').value);
// sMin = sMax = 1985-04-12T00:00:00.000Z
// eMin = eMax = 1985-04-12T23:59:59.999Z

// Interval: start could be anytime in 1985, end anytime in 1990
normalize(parse('1985/1990').value);
// sMin = 1985-01-01T00:00:00.000Z (earliest start)
// sMax = 1985-12-31T23:59:59.999Z (latest start)
// eMin = 1990-01-01T00:00:00.000Z (earliest end)
// eMax = 1990-12-31T23:59:59.999Z (latest end)

// Unspecified: range of possible years
normalize(parse('198X').value);
// sMin = 1980-01-01T00:00:00.000Z
// sMax = 1989-01-01T00:00:00.000Z
// eMin = 1980-12-31T23:59:59.999Z
// eMax = 1989-12-31T23:59:59.999Z

// Open end: unbounded future
normalize(parse('1985/..').value);
// sMin = sMax = 1985-01-01T00:00:00.000Z
// eMin = eMax = null (unbounded)
// endKind = 'open'

// Unknown end: missing information
normalize(parse('1985/').value);
// sMin = sMax = 1985-01-01T00:00:00.000Z
// eMin = eMax = null (unknown)
// endKind = 'unknown'
```

## Handling Uncertainty

### Qualifiers Don't Widen Bounds

EDTF qualifiers (`?`, `~`, `%`) indicate uncertainty but **don't numerically widen bounds**:

```typescript
// With and without qualifier have same bounds
normalize(parse('1985').value);
normalize(parse('1985?').value);
// Both: 1985-01-01 to 1985-12-31

// Qualifier is stored as metadata
const norm = normalize(parse('1985?').value);
norm.members[0].qualifiers?.uncertain;  // true
```

**Why?** EDTF doesn't define numeric tolerances for qualifiers. `1985?` means "uncertain if 1985" not "1985 ± X years".

### Unspecified Digits DO Widen Bounds

Unspecified digits (`X`) create explicit ranges:

```typescript
normalize(parse('198X').value);
// sMin = 1980-01-01 (could start as early as 1980)
// eMax = 1989-12-31 (could end as late as 1989)

normalize(parse('1985-XX').value);
// sMin = 1985-01-01 (could be January)
// eMax = 1985-12-31 (could be December)
```

### Open vs Unknown Endpoints

**Open** (`..`) means unbounded:
```typescript
const ongoing = parse('2020/..').value;
during(parse('2024').value, ongoing);  // 'MAYBE' - could still be ongoing
```

**Unknown** (empty) means missing data:
```typescript
const incomplete = parse('2020/').value;
during(parse('2024').value, incomplete);  // 'UNKNOWN' - no information about end
```

## Use Cases

### 1. Temporal Search

```typescript
import { during, overlaps, intersects } from '@edtf-ts/core';

// Find artifacts from a specific period
function findArtifacts(artifacts: Artifact[], period: EDTFBase) {
  return artifacts.filter(a => {
    const result = during(a.date, period);
    return result === 'YES' || result === 'MAYBE';
  });
}

// Find overlapping events
function findOverlapping(events: Event[], target: EDTFBase) {
  return events.filter(e => {
    return intersects(e.timespan, target) === 'YES';
  });
}
```

### 2. Timeline Visualization

```typescript
import { isBefore, isAfter, overlaps } from '@edtf-ts/core';

// Sort events chronologically
function sortTimeline(events: Event[]): Event[] {
  return events.sort((a, b) => {
    if (isBefore(a.date, b.date) === 'YES') return -1;
    if (isAfter(a.date, b.date) === 'YES') return 1;
    return 0;
  });
}

// Detect conflicts
function hasConflict(event: Event, others: Event[]): boolean {
  return others.some(other =>
    overlaps(event.timespan, other.timespan) === 'YES'
  );
}
```

### 3. Genealogy Research

```typescript
import { during, isBefore } from '@edtf-ts/core';

// Check if person could have been alive during event
function couldWitness(person: Person, event: Event): boolean {
  const birth = person.birthDate;
  const death = person.deathDate;

  // Was event during their lifetime?
  const lifespan = parse(`${birth}/${death}`).value;
  const result = during(event.date, lifespan);

  return result === 'YES' || result === 'MAYBE';
}

// Parent-child age validation
function plausibleParent(parent: Person, child: Person): boolean {
  // Parent should be born before child
  const result = isBefore(parent.birthDate, child.birthDate);
  return result === 'YES';
}
```

### 4. Archives & Collections

```typescript
import { intersects, during } from '@edtf-ts/core';

// Find documents relevant to a period
function findRelevantDocuments(
  docs: Document[],
  researchPeriod: EDTFBase
): Document[] {
  return docs.filter(doc => {
    // Document creation intersects with research period
    if (intersects(doc.created, researchPeriod) === 'YES') {
      return true;
    }

    // Document subject matter is during research period
    if (doc.subjectDate && during(doc.subjectDate, researchPeriod) === 'YES') {
      return true;
    }

    return false;
  });
}
```

## Comparison Table

| Feature | Simple (compare/sort) | Advanced (isBefore/during/etc) |
|---------|----------------------|--------------------------------|
| Comparison mode | Min/max/midpoint | Four-bound ranges |
| Return type | number (-1, 0, 1) | Truth value |
| Uncertainty handling | Basic | Precise |
| Allen's algebra | ❌ | ✅ |
| Database integration | ❌ | ✅ (coming soon) |
| Performance | Fast | Moderate |
| Use case | Simple sorting | Temporal reasoning |

## Best Practices

### 1. Handle All Truth Values

```typescript
const result = during(a, b);

switch (result) {
  case 'YES':
    console.log('Definitely during');
    break;
  case 'NO':
    console.log('Definitely not during');
    break;
  case 'MAYBE':
    console.log('Possibly during - check with user');
    break;
  case 'UNKNOWN':
    console.log('Cannot determine - need more information');
    break;
}
```

### 2. Understanding Set and List Semantics

Sets and Lists have special semantics that can produce surprising results:

#### Sets Use "One Of" Semantics

A Set like `[1667,1668,1670..1672]` means **"one of these years"**. When comparing Sets, the library checks each member individually and combines results using the `ANY` quantifier.

```typescript
import { equals, normalize } from '@edtf-ts/core';

// Set: "one of these years"
const set = parse('[1667,1668,1670..1672]').value;  // Years: 1667, 1668, 1670, 1671, 1672
const year = parse('1671').value;

// Does the set equal 1671?
equals(set, year);  // 'YES' - because 1671 is one of the values in the set!

// The set has 5 members
const normalized = normalize(set);
console.log(normalized.members.length);  // 5

// But equals() checks: "Does ANY member equal 1671?"
// Since member 4 (year 1671) equals 1671, the answer is YES
```

**Why this is correct:** The Set represents "one of these years". Since 1671 is literally one of the possible values, saying the Set equals 1671 is semantically valid - the Set *could be* 1671.

**Important:** Allen relations operate on the **full EDTF semantics**, not just the bounds. For Sets:
- Bounds show the **convex hull** (earliest start to latest end)
- Relations check **each member** and combine with `ANY` quantifier
- This means `equals([1667,1668,1670..1672], 1671)` returns `YES` even though the convex hull spans 1667-1672

#### Lists Use "All Of" Semantics

Lists with `{...}` syntax mean **"all of these"** and use the `ALL` quantifier:

```typescript
const list = parse('{1985,1990}').value;  // Both years
const period = parse('1980/2000').value;

// Are all dates during the period?
during(list, period);  // 'YES' - both are during

// Does the list equal 1985?
equals(list, parse('1985').value);  // 'NO' - the list is not just 1985
```

#### Choosing Quantifiers Explicitly

You can override the default quantifier:

```typescript
import { during } from '@edtf-ts/core';

const dates = parse('[1985, 1990, 1995]').value;  // Set (defaults to ANY)
const period = parse('1980/2000').value;

// ANY: Is any date during the period?
during(dates, period, 'ANY');  // 'YES' - all happen to be during

// ALL: Are all dates during the period?
during(dates, period, 'ALL');  // 'YES' - all are during

// For a set spanning outside the period
const widerSet = parse('[1970, 1985, 2010]').value;
during(widerSet, period, 'ANY');  // 'YES' - 1985 is during
during(widerSet, period, 'ALL');  // 'NO' - 1970 and 2010 are not
```

### 3. Display Bounds for Debugging

```typescript
import { normalize } from '@edtf-ts/core';

function debugBounds(edtf: EDTFBase) {
  const norm = normalize(edtf);
  const member = norm.members[0];

  console.log('Start range:',
    new Date(Number(member.sMin)),
    'to',
    new Date(Number(member.sMax))
  );
  console.log('End range:',
    new Date(Number(member.eMin)),
    'to',
    new Date(Number(member.eMax))
  );
}
```

### 4. Combine Relations

```typescript
import { isBefore, isAfter, or } from '@edtf-ts/core';

// Is A completely separate from B?
function isDisjoint(a: EDTFBase, b: EDTFBase): boolean {
  const before = isBefore(a, b);
  const after = isAfter(a, b);
  return or(before, after) === 'YES';
}
```

## See Also

- [Temporal Comparison API](/api/compare)
- [Formatting & Utilities API](/api/utils)
- [Intervals & Ranges](/guide/intervals)
- [Uncertainty & Approximation](/guide/uncertainty)
