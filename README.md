# EDTF TypeScript and Fuzzy Dates

**Dates, the Way Humans Mean Them**

Modern TypeScript implementation of [Extended Date/Time Format (EDTF)](https://www.loc.gov/standards/datetime/) and tools to parse and render dates in friendly human language.

Try the **[Interactive Playground](https://bobpritchett.github.io/edtf-ts/playground)** now.

## Why EDTF?

People don't experience time like computers do.

We remember _seasons_, _eras_, and _approximate moments_. We inherit records that are incomplete, contradictory, or deliberately vague. We say "around," "before," "after," "early," "late," and "sometime between."

We share our age and/or our birthday, not our date of birth, and we use phrases like 'teenager' and 'late 40s'.

Yet most software still insists on **rigid ISO 8601 dates**, forcing humans to pretend they know more than they do. When software only accepts exact dates, users are forced to guess, invent, default to January 1st, or leave fields blank—all losing valuable information.

**EDTF exists because real time is messy—and pretending otherwise loses information.**

## Features

- **FuzzyDate API** - Temporal-inspired, method-based interface with IDE autocomplete
- **Full EDTF Level 0, 1, 2 support** - Complete spec compliance
- **TypeScript-first** - Complete type safety with discriminated unions
- **Allen's interval algebra** - 13 temporal relations with four-valued logic
- **Age & birthday support** - Parse natural language ages/birthdays to EDTF and render them back
- **Natural language parsing** - Convert human-readable dates to EDTF
- **Human-readable formatting** - i18n-ready output with customizable options
- **Tree-shakeable** - Import only what you need
- **Zero runtime dependencies** - Lightweight core package
- **BigInt support** - Handle extreme historical dates beyond JavaScript Date limits
- **Interactive playground** - Try EDTF parsing and comparison in your browser

## Quick Start

```bash
pnpm add @edtf-ts/core
```

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Parse EDTF strings into FuzzyDate objects
const date = FuzzyDate.parse('1985-04-12');
const interval = FuzzyDate.parse('2004-06/2006-08');
const uncertain = FuzzyDate.parse('1984?');
const decade = FuzzyDate.parse('198X'); // Any year 1980-1989

// Method-based API with IDE autocomplete
date.format(); // "April 12, 1985"
date.isBefore(interval); // 'YES'
uncertain.isUncertain; // true
decade.hasUnspecified; // true

// Temporal comparison with four-valued logic
const a = FuzzyDate.parse('1985');
const b = FuzzyDate.parse('1990');

a.isBefore(b); // 'YES' - definitely before
a.during(b); // 'NO' - not contained within
a.overlaps(b); // 'NO' - no time overlap

// Handle uncertainty honestly
const year = FuzzyDate.parse('1985');
decade.equals(year); // 'MAYBE' - could be 1985

// Type-specific parsing
const result = FuzzyDate.Interval.from('1985/1990');
if (result.success) {
  for (const year of result.value.by('year')) {
    console.log(year.edtf); // '1985', '1986', ... '1990'
  }
}

// Boolean convenience methods for when you need true/false
a.isDefinitelyBefore(b); // true
decade.isPossiblyBefore(year); // true (could be 1980-1984)

// These will throw FuzzyDateParseError
FuzzyDate.parse('April 12, 1985'); // ❌ Natural language, not EDTF syntax
FuzzyDate.parse('1985/13/01'); // ❌ Invalid month (13)
FuzzyDate.parse('85-04-12'); // ❌ Two-digit year not allowed
```

## Packages

### @edtf-ts/core (Main Package)

The main package includes everything you need for EDTF parsing, comparison, and formatting.

#### FuzzyDate API (Recommended)

The `FuzzyDate` class provides a Temporal-inspired, method-based API that's discoverable via IDE autocomplete:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Parse and work with dates
const date = FuzzyDate.parse('1985-04-12');
date.type; // 'Date'
date.precision; // 'day'
date.year; // 1985
date.month; // 4
date.format(); // "April 12, 1985"
date.toISO(); // "1985-04-12"

// Validate without parsing
FuzzyDate.isValid('2004-06-~01'); // true (Level 2)

// Result-based parsing (doesn't throw)
const result = FuzzyDate.from('1985-04-12');
if (result.success) {
  console.log(result.value.edtf); // '1985-04-12'
  console.log(result.level); // 0
}

// Type-specific factories
const interval = FuzzyDate.Interval.from('1985/1990');
const season = FuzzyDate.Season.from('1985-21');
```

#### Age & Birthday Parsing

Parse natural language age and birthday expressions into EDTF:

```typescript
import { parseAgeBirthday } from '@edtf-ts/natural';

// Parse age expressions
parseAgeBirthday('20 yo', { currentDate: new Date('2025-06-01') });
// { edtf: '?2004-?06-?02/?2005-?06-?01', type: 'interval', ageRange: [20, 20] }

parseAgeBirthday('early 30s', { currentDate: new Date('2025-06-01') });
// { edtf: '?1991-?06-?02/?1995-?06-?01', type: 'interval', ageRange: [30, 33] }

// Age with known birthday
parseAgeBirthday('20 y/o, birthday 3/15', { currentDate: new Date('2025-06-01') });
// { edtf: '2005-03-15', type: 'date', birthdayKnown: { month: 3, day: 15 } }

// Birthday only (age unknown)
parseAgeBirthday('March 15th birthday');
// { edtf: 'XXXX-03-15', type: 'date', birthdayKnown: { month: 3, day: 15 } }

// Life stage vocabulary
parseAgeBirthday('teenager', { currentDate: new Date('2025-06-01') });
// { edtf: '?2005-?06-?02/?2012-?06-?01', type: 'interval', ageRange: [13, 19] }

// Birth date marker (delegates to natural date parsing)
parseAgeBirthday('born circa 1950');
// { edtf: '1950~', type: 'date', interpretation: 'Birth date: circa 1950' }
```

#### Age & Birthday Rendering

Convert EDTF birthdates to human-readable ages and birthday strings:

```typescript
import { renderAgeBirthday } from '@edtf-ts/core';

// Exact birthdate
renderAgeBirthday('2005-03-15', { currentDate: new Date('2025-06-01') });
// { age: '20 years old', birthday: 'March 15th', formatted: '20 years old, birthday March 15th' }

// Short form for compact display
renderAgeBirthday('2005-03-15', { currentDate: new Date('2025-06-01'), ageLength: 'short' });
// { age: '20yo', birthday: 'March 15th', formatted: '20yo, birthday March 15th' }

// Uncertain birth year range with known birthday
renderAgeBirthday('?2002-03-15/?2005-03-15', { currentDate: new Date('2025-06-01') });
// { age: 'early 20s', birthday: 'March 15th', formatted: 'early 20s, birthday March 15th' }

// Only year known (birthday unknown)
renderAgeBirthday('2005', { currentDate: new Date('2025-06-01') });
// { age: '19–20 years old', birthday: null, formatted: '19–20 years old' }

// Open-ended: "born no later than 1960"
renderAgeBirthday('../1960', { currentDate: new Date('2025-06-01') });
// { age: '65+ years old', birthday: null, formatted: '65+ years old' }
```

#### Functional API (Also Available)

If you prefer functional programming or need fine-grained tree-shaking, all functions are available as direct imports:

```typescript
import {
  // Parsing
  parse,
  isValid,

  // Type guards
  isEDTFDate,
  isEDTFInterval,
  isEDTFSeason,

  // Comparison (Allen's interval algebra)
  isBefore,
  isAfter,
  meets,
  overlaps,
  during,
  contains,
  equals,
  normalize,
  allen,

  // Formatting
  formatHuman,
  formatISO,

  // Utilities
  compare,
  sort,
  isInRange,
} from '@edtf-ts/core';

const result = parse('1985-04-12');
if (result.success) {
  console.log(formatHuman(result.value)); // "April 12, 1985"
  console.log(isBefore(result.value, parse('1990').value)); // 'YES'
}
```

### @edtf-ts/natural (Optional)

Natural language date parsing to EDTF. Install separately to keep your bundle small if you don't need this feature.

```bash
pnpm add @edtf-ts/natural
```

```typescript
import { parseNatural } from '@edtf-ts/natural';

// Parse human-readable dates
const results = parseNatural('April 1985');
// [{ edtf: '1985-04', confidence: 0.95, fuzzyDate: FuzzyDate, ... }]

// Each result includes a FuzzyDate for the method-based API
const best = results[0];
best.fuzzyDate.format(); // "April 1985"
best.fuzzyDate.isBefore(someDate); // 'YES' | 'NO' | 'MAYBE'

// More examples
parseNatural('sometime in the 1980s');
// [{ edtf: '198X', confidence: 0.85, fuzzyDate: FuzzyDate }]

parseNatural('circa 1950'); // → edtf: '1950~'
parseNatural('early January 1985'); // → edtf: '1985-01-01/1985-01-10'
parseNatural('late 19th century'); // → edtf: '1867/1900'

// These won't parse - throws ParseError
parseNatural('next Tuesday'); // ❌ Relative dates not supported
parseNatural('in 3 weeks'); // ❌ Relative durations not supported
parseNatural('ASAP'); // ❌ Not a date expression
```

## Real History Is Full of Uncertainty

Think about how people actually describe dates:

- "Shakespeare was born **in late April 1564**." → `1564-04~` or `1564-04-20/1564-04-26`
- "The photo was taken **sometime in the 1930s**." → `193X`
- "**Probably 1918**" → `1918?`
- "**No earlier than 1870**" → `../1870`

ISO 8601 can't express this without lying or guessing. EDTF can.

## Documentation

Full documentation is available at **[bobpritchett.github.io/edtf-ts](https://bobpritchett.github.io/edtf-ts/)**

- **[Getting Started Guide](https://bobpritchett.github.io/edtf-ts/guide/getting-started)** - Learn the basics
- **[API Reference](https://bobpritchett.github.io/edtf-ts/api/core)** - Complete API documentation
- **[Comparison Guide](https://bobpritchett.github.io/edtf-ts/guide/comparison)** - Understanding temporal reasoning
- **[Interactive Playground](https://bobpritchett.github.io/edtf-ts/playground)** - Try it in your browser

## EDTF Specification Support

### Level 0 (ISO 8601 Profile)

- Calendar dates: `1985-04-12`
- Reduced precision: `1985-04`, `1985`
- Date/time: `1985-04-12T23:20:30`
- Intervals: `1985/1990`, `1985-04-12/1985-04-15`

### Level 1 (Extended)

- Uncertain/approximate: `1984?`, `1984~`, `1984%`
- Unspecified digits: `199X`, `19XX`, `1985-XX-XX`
- Extended intervals: `1984?/2004~`, `../1985`, `1985/..`
- Years exceeding 4 digits: `Y170000002`
- Seasons: `1985-21` (Spring), `1985-22` (Summer)

### Level 2 (Partial Uncertainty)

- Component-level qualification: `?2004-06`, `2004-~06`, `2004-06-~11`
- Partial unspecified: `156X-12-25`, `15XX-12-25`
- Multiple dates: `1985-04-12, 1985-05, 1985`
- Sets/Lists: `[1985,1990,1995]`, `{1985-04,1985-05}`
- Extended seasons: `1985-25` (Winter, Northern), `1985-40` (Winter, Southern)

## Truth Values in Comparison

The comparison methods use four-valued logic for precise temporal reasoning:

- **YES** - Relationship definitely holds
- **NO** - Relationship definitely does not hold
- **MAYBE** - Relationship might hold (uncertain due to imprecision)
- **UNKNOWN** - Cannot determine (missing information)

```typescript
import { FuzzyDate } from '@edtf-ts/core';

const y1980 = FuzzyDate.parse('1980');
const y1985 = FuzzyDate.parse('1985');
const y1990 = FuzzyDate.parse('1990');
const decade = FuzzyDate.parse('198X');
const openInterval = FuzzyDate.parse('1985/..');

// YES - bounds prove it
y1980.isBefore(y1990); // 'YES'

// NO - bounds disprove it
y1985.during(y1985); // 'NO' (same bounds)

// MAYBE - uncertainty from unspecified digits
decade.equals(y1985); // 'MAYBE' (could be 1985)

// UNKNOWN - missing endpoint information
openInterval.overlaps(y1990); // 'UNKNOWN'

// Boolean convenience methods when you need true/false
y1980.isDefinitelyBefore(y1990); // true
decade.isPossiblyBefore(y1985); // true (could be 1980-1984)
```

## Extended Years and BigInt Support

JavaScript `Date` objects can only represent dates within approximately ±270,000 years from the epoch. For extended years beyond this range (e.g., `Y2000123456` for year 2 billion), the library provides:

- **`minMs` / `maxMs`** - BigInt epoch milliseconds, always accurate for any year
- **`min` / `max`** - JavaScript Date objects, clamped to valid range when necessary
- **`isBoundsClamped`** - Boolean flag indicating if Date values were clamped

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Extended year (2 billion years in the future)
const farFuture = FuzzyDate.parse('Y2000123456');
console.log(farFuture.inner.year); // 2000123456
console.log(farFuture.isBoundsClamped); // true

// Date objects are clamped to valid range
console.log(farFuture.min); // +275760-09-13T00:00:00.000Z (max Date)

// BigInt values are always accurate
console.log(farFuture.minMs); // 63117737727846912000n
console.log(farFuture.maxMs); // 63117737759469311999n

// Normal dates work as expected
const normal = FuzzyDate.parse('2024-06-15');
console.log(normal.isBoundsClamped); // undefined (not clamped)
console.log(normal.min); // 2024-06-15T00:00:00.000Z
console.log(normal.minMs); // 1718409600000n
```

This enables accurate temporal reasoning for astronomical and geological timescales while maintaining compatibility with standard JavaScript Date APIs for typical use cases.

## Who Is This For?

EDTF-TS is for anywhere dates come from **people, memory, or history**—not just sensors and clocks:

- **Cultural heritage** - Museum artifacts, archival materials
- **Historical research** - Events with uncertain or approximate dates
- **Genealogy** - Birth/death dates with varying precision
- **Geology/paleontology** - Deep time with extreme date ranges
- **Digital libraries** - Bibliographic records with partial dates
- **AI systems** - Temporal reasoning about historical events

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run docs locally
pnpm docs:dev
```

## Monorepo Structure

```
edtf-ts/
├── packages/
│   ├── core/          # @edtf-ts/core - Main package (parsing, comparison, formatting)
│   └── natural/       # @edtf-ts/natural - Natural language parsing
├── docs/              # Documentation site
└── tools/             # Research and tooling
```

## License

MIT Copyright 2025 Bob Pritchett

## Contributing

Contributions welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## Acknowledgments

- [EDTF Specification](https://www.loc.gov/standards/datetime/) - Library of Congress
- [Allen's Interval Algebra](https://en.wikipedia.org/wiki/Allen%27s_interval_algebra) - James F. Allen (1983)
- Inspired by [edtf.js](https://github.com/inukshuk/edtf.js) and other EDTF implementations
