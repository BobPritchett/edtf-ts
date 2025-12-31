# EDTF TypeScript

Modern TypeScript implementation of [Extended Date/Time Format (EDTF)](https://www.loc.gov/standards/datetime/) with comprehensive temporal reasoning capabilities.

## Features

- ✅ **Full EDTF Level 0, 1, 2 support** - Complete spec compliance
- ✅ **TypeScript-first** - Complete type safety with discriminated unions
- ✅ **Allen's interval algebra** - 13 temporal relations with four-valued logic
- ✅ **Natural language parsing** - Convert human-readable dates to EDTF
- ✅ **Human-readable formatting** - i18n-ready output with customizable options
- ✅ **Tree-shakeable** - Monorepo architecture, import only what you need
- ✅ **Zero runtime dependencies** - Lightweight core packages
- ✅ **BigInt support** - Handle extreme historical dates beyond JavaScript Date limits
- ✅ **Interactive playground** - Try EDTF parsing and comparison in your browser

## Quick Start

```bash
pnpm add @edtf-ts/core @edtf-ts/compare
```

```typescript
import { parse } from '@edtf-ts/core';
import { isBefore, during, overlaps } from '@edtf-ts/compare';

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
```

## Packages

### Core Packages

#### [@edtf-ts/core](./packages/core)

Core EDTF parsing, validation, and type definitions.

```typescript
import { parse, isValid } from '@edtf-ts/core';

const result = parse('1985-04-12');
if (result.success) {
  console.log(result.value.type); // 'Date'
  console.log(result.value.precision); // 'day'
  console.log(result.level); // 0
}

isValid('2004-06-~01'); // true (Level 2)
```

#### [@edtf-ts/compare](./packages/compare)

Advanced temporal comparison using Allen's interval algebra and four-valued logic.

```typescript
import { parse } from '@edtf-ts/core';
import { normalize, isBefore, during, overlaps } from '@edtf-ts/compare';

// Simple API - EDTF level
isBefore(parse('1980').value, parse('1990').value); // 'YES'

// Advanced API - Member level (four-bound ranges)
const norm = normalize(parse('198X').value);
console.log(norm.members[0]);
// {
//   sMin: 315532800000n,  // 1980-01-01
//   sMax: 599616000000n,  // 1989-01-01
//   eMin: 347155199999n,  // 1980-12-31
//   eMax: 631151999999n,  // 1989-12-31
// }
```

**Features:**

- 13 Allen relations (before, after, meets, overlaps, starts, during, finishes, equals, + symmetrics)
- Four-valued logic: YES/NO/MAYBE/UNKNOWN
- Four-bound normalization (sMin, sMax, eMin, eMax)
- BigInt epoch milliseconds for extreme dates
- Database preparation utilities (coming soon)

#### [@edtf-ts/utils](./packages/utils)

Utility functions for formatting, validation, and basic comparison.

```typescript
import { formatHuman, compare, sort, isInRange } from '@edtf-ts/utils';

// Human-readable formatting
formatHuman(parse('1985-04-12').value);
// "April 12, 1985"

formatHuman(parse('1984?').value);
// "1984 (uncertain)"

// Simple comparison and sorting
const dates = [parse('2000').value, parse('1985').value, parse('1990').value];
const sorted = sort(dates); // [1985, 1990, 2000]
```

#### [@edtf-ts/natural](./packages/natural)

Natural language date parsing to EDTF.

```typescript
import { parseNatural } from '@edtf-ts/natural';

const results = parseNatural('April 1985');
// [{ edtf: '1985-04', confidence: 0.95, interpretation: 'April 1985' }]

const results2 = parseNatural('sometime in the 1980s');
// [{ edtf: '198X', confidence: 0.85, interpretation: '1980s' }]
```

## Documentation

Full documentation is available at **[bobpritchett.github.io/edtf-ts](https://bobpritchett.github.io/edtf-ts/)**

- **[Getting Started Guide](https://bobpritchett.github.io/edtf-ts/guide/getting-started)** - Learn the basics
- **[API Reference](https://bobpritchett.github.io/edtf-ts/api/core)** - Complete API documentation
- **[Comparison Guide](https://bobpritchett.github.io/edtf-ts/guide/comparison)** - Understanding temporal reasoning
- **[Interactive Playground](https://bobpritchett.github.io/edtf-ts/playground)** - Try it in your browser

## EDTF Specification Support

### Level 0 (ISO 8601 Profile)

- ✅ Calendar dates: `1985-04-12`
- ✅ Reduced precision: `1985-04`, `1985`
- ✅ Date/time: `1985-04-12T23:20:30`
- ✅ Intervals: `1985/1990`, `1985-04-12/1985-04-15`

### Level 1 (Extended)

- ✅ Uncertain/approximate: `1984?`, `1984~`, `1984%`
- ✅ Unspecified digits: `199X`, `19XX`, `1985-XX-XX`
- ✅ Extended intervals: `1984?/2004~`, `../1985`, `1985/..`
- ✅ Years exceeding 4 digits: `Y170000002`
- ✅ Seasons: `1985-21` (Spring), `1985-22` (Summer)

### Level 2 (Partial Uncertainty)

- ✅ Component-level qualification: `?2004-06`, `2004-~06`, `2004-06-~11`
- ✅ Partial unspecified: `156X-12-25`, `15XX-12-25`
- ✅ Multiple dates: `1985-04-12, 1985-05, 1985`
- ✅ Sets/Lists: `[1985,1990,1995]`, `{1985-04,1985-05}`
- ✅ Extended seasons: `1985-25` (Winter, Northern), `1985-40` (Winter, Southern)

## Truth Values in Comparison

The `@edtf-ts/compare` package uses four-valued logic for precise temporal reasoning:

- **YES** - Relationship definitely holds
- **NO** - Relationship definitely does not hold
- **MAYBE** - Relationship might hold (uncertain due to imprecision)
- **UNKNOWN** - Cannot determine (missing information)

```typescript
import { isBefore, equals, during } from '@edtf-ts/compare';

// YES - bounds prove it
isBefore(parse('1980').value, parse('1990').value); // 'YES'

// NO - bounds disprove it
during(parse('1985').value, parse('1985').value); // 'NO' (same bounds)

// MAYBE - uncertainty from unspecified digits
equals(parse('198X').value, parse('1985').value); // 'MAYBE'

// UNKNOWN - missing endpoint information
overlaps(parse('1985/').value, parse('1990').value); // 'UNKNOWN'
```

## Use Cases

- **Cultural heritage** - Museum artifacts, archival materials
- **Historical research** - Events with uncertain or approximate dates
- **Genealogy** - Birth/death dates with varying precision
- **Geology/paleontology** - Deep time with extreme date ranges
- **Digital libraries** - Bibliographic records with partial dates
- **Academic research** - Historical document dating

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
│   ├── core/          # @edtf-ts/core - Parsing and types
│   ├── compare/       # @edtf-ts/compare - Temporal reasoning
│   ├── utils/         # @edtf-ts/utils - Utilities
│   └── natural/       # @edtf-ts/natural - Natural language
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
