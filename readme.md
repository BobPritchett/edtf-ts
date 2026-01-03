# EDTF TypeScript

**Dates, the Way Humans Mean Them**

Modern TypeScript implementation of [Extended Date/Time Format (EDTF)](https://www.loc.gov/standards/datetime/) with comprehensive temporal reasoning capabilities.

## Why EDTF?

People don't experience time like computers do.

We remember *seasons*, *eras*, and *approximate moments*. We inherit records that are incomplete, contradictory, or deliberately vague. We say "around," "before," "after," "early," "late," and "sometime between."

Yet most software still insists on **rigid ISO 8601 dates**, forcing humans to pretend they know more than they do. When software only accepts exact dates, users are forced to guess, invent, default to January 1st, or leave fields blank—all losing valuable information.

**EDTF exists because real time is messy—and pretending otherwise loses information.**

## Features

- **Full EDTF Level 0, 1, 2 support** - Complete spec compliance
- **TypeScript-first** - Complete type safety with discriminated unions
- **Allen's interval algebra** - 13 temporal relations with four-valued logic
- **Natural language parsing** - Convert human-readable dates to EDTF
- **Human-readable formatting** - i18n-ready output with customizable options
- **Tree-shakeable** - Import only what you need
- **Zero runtime dependencies** - Lightweight core package
- **BigInt support** - Handle extreme historical dates beyond JavaScript Date limits
- **Interactive playground** - Try EDTF parsing and comparison in your browser

## Quick Start

```bash
pnpm add @edtf-ts
```

```typescript
import { parse, isBefore, during, overlaps, equals, formatHuman } from '@edtf-ts';

// Parse EDTF strings
const date = parse('1985-04-12');
const interval = parse('2004-06/2006-08');
const uncertain = parse('1984?');
const unspecified = parse('198X'); // Any year 1980-1989

// Temporal comparison with four-valued logic
const a = parse('1985').value;
const b = parse('1990').value;

isBefore(a, b); // 'YES' - definitely before
during(a, b); // 'NO' - not contained within
overlaps(a, b); // 'NO' - no time overlap

// Handle uncertainty
const decade = parse('198X').value; // 1980-1989
const year = parse('1985').value;
equals(decade, year); // 'MAYBE' - could be 1985

// Human-readable formatting
formatHuman(parse('1985-04-12').value); // "April 12, 1985"
formatHuman(parse('1984?').value); // "1984 (uncertain)"

// These will fail - parse returns { success: false }
parse('April 12, 1985');  // ❌ Natural language, not EDTF syntax
parse('1985/13/01');      // ❌ Invalid month (13)
parse('85-04-12');        // ❌ Two-digit year not allowed
```

## Packages

### @edtf-ts (Main Package)

The main package includes everything you need for EDTF parsing, comparison, and formatting:

```typescript
import {
  // Parsing
  parse, isValid,

  // Type guards
  isEDTFDate, isEDTFInterval, isEDTFSeason,

  // Comparison (Allen's interval algebra)
  isBefore, isAfter, meets, overlaps, during, contains, equals,
  normalize, allen,

  // Formatting
  formatHuman, formatISO,

  // Utilities
  compare, sort, isInRange
} from '@edtf-ts';

const result = parse('1985-04-12');
if (result.success) {
  console.log(result.value.type); // 'Date'
  console.log(result.value.precision); // 'day'
  console.log(result.level); // 0
}

isValid('2004-06-~01'); // true (Level 2)
```

### @edtf-ts/natural (Optional)

Natural language date parsing to EDTF. Install separately to keep your bundle small if you don't need this feature.

```bash
pnpm add @edtf-ts/natural
```

```typescript
import { parseNatural } from '@edtf-ts/natural';

// Parse human-readable dates
parseNatural('April 1985');
// [{ edtf: '1985-04', confidence: 0.95, interpretation: 'April 1985' }]

parseNatural('sometime in the 1980s');
// [{ edtf: '198X', confidence: 0.85, interpretation: '1980s' }]

parseNatural('circa 1950');           // → '1950~'
parseNatural('early January 1985');   // → '1985-01-01/1985-01-10'
parseNatural('late 19th century');    // → '1867/1900'

// These won't parse - returns empty array []
parseNatural('next Tuesday');     // ❌ Relative dates not supported
parseNatural('in 3 weeks');       // ❌ Relative durations not supported
parseNatural('ASAP');             // ❌ Not a date expression
```

## Real History Is Full of Uncertainty

Think about how people actually describe dates:

* "Shakespeare was born **in late April 1564**." → `1564-04~` or `1564-04-20/1564-04-26`
* "The photo was taken **sometime in the 1930s**." → `193X`
* "**Probably 1918**" → `1918?`
* "**No earlier than 1870**" → `../1870`

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

The comparison functions use four-valued logic for precise temporal reasoning:

- **YES** - Relationship definitely holds
- **NO** - Relationship definitely does not hold
- **MAYBE** - Relationship might hold (uncertain due to imprecision)
- **UNKNOWN** - Cannot determine (missing information)

```typescript
import { parse, isBefore, equals, during, overlaps } from '@edtf-ts';

// YES - bounds prove it
isBefore(parse('1980').value, parse('1990').value); // 'YES'

// NO - bounds disprove it
during(parse('1985').value, parse('1985').value); // 'NO' (same bounds)

// MAYBE - uncertainty from unspecified digits
equals(parse('198X').value, parse('1985').value); // 'MAYBE'

// UNKNOWN - missing endpoint information
overlaps(parse('1985/').value, parse('1990').value); // 'UNKNOWN'
```

## Extended Years and BigInt Support

JavaScript `Date` objects can only represent dates within approximately ±270,000 years from the epoch. For extended years beyond this range (e.g., `Y2000123456` for year 2 billion), the library provides:

- **`minMs` / `maxMs`** - BigInt epoch milliseconds, always accurate for any year
- **`min` / `max`** - JavaScript Date objects, clamped to valid range when necessary
- **`isBoundsClamped`** - Boolean flag indicating if Date values were clamped

```typescript
import { parse } from '@edtf-ts';

// Extended year (2 billion years in the future)
const result = parse('Y2000123456');
if (result.success) {
  console.log(result.value.year);           // 2000123456
  console.log(result.value.isBoundsClamped); // true

  // Date objects are clamped to valid range
  console.log(result.value.min);  // +275760-09-13T00:00:00.000Z (max Date)

  // BigInt values are always accurate
  console.log(result.value.minMs); // 63117737727846912000n
  console.log(result.value.maxMs); // 63117737759469311999n
}

// Normal dates work as expected
const normal = parse('2024-06-15');
if (normal.success) {
  console.log(normal.value.isBoundsClamped); // undefined (not clamped)
  console.log(normal.value.min);   // 2024-06-15T00:00:00.000Z
  console.log(normal.value.minMs); // 1718409600000n
}
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
│   ├── edtf-ts/       # @edtf-ts - Main package (parsing, comparison, formatting)
│   └── natural/       # @edtf-ts/natural - Natural language parsing
├── docs/              # Documentation site
└── tools/             # Research and tooling
```

## Migrating from v0.1

The library has been consolidated from 4 packages to 2:

| Old Package | New Package |
|-------------|-------------|
| @edtf-ts/core | @edtf-ts |
| @edtf-ts/compare | @edtf-ts |
| @edtf-ts/utils | @edtf-ts |
| @edtf-ts/natural | @edtf-ts/natural (unchanged) |

```bash
# Remove old packages
pnpm remove @edtf-ts/core @edtf-ts/compare @edtf-ts/utils

# Install new package
pnpm add @edtf-ts
```

All exports remain the same - only the import source changes:

```typescript
// Before
import { parse } from '@edtf-ts/core';
import { isBefore, normalize } from '@edtf-ts/compare';
import { formatHuman } from '@edtf-ts/utils';

// After
import { parse, isBefore, normalize, formatHuman } from '@edtf-ts';
```

## License

MIT Copyright 2025 Bob Pritchett

## Contributing

Contributions welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## Acknowledgments

- [EDTF Specification](https://www.loc.gov/standards/datetime/) - Library of Congress
- [Allen's Interval Algebra](https://en.wikipedia.org/wiki/Allen%27s_interval_algebra) - James F. Allen (1983)
- Inspired by [edtf.js](https://github.com/inukshuk/edtf.js) and other EDTF implementations
