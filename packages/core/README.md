# @edtf-ts/core - EDTF TypeScript and Fuzzy Dates

**Dates, the Way Humans Mean Them**

[![npm version](https://img.shields.io/npm/v/@edtf-ts/core.svg)](https://www.npmjs.com/package/@edtf-ts/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modern TypeScript implementation of [Extended Date/Time Format (EDTF)](https://www.loc.gov/standards/datetime/) with temporal reasoning, fuzzy date comparison, and human-readable formatting.

**[GitHub Repository](https://github.com/BobPritchett/edtf-ts)** | **[Documentation](https://bobpritchett.github.io/edtf-ts/)** | **[Interactive Playground](https://bobpritchett.github.io/edtf-ts/playground)**

## Why EDTF?

People don't experience time like computers do. We remember _seasons_, _eras_, and _approximate moments_. We say "around," "before," "after," and "sometime between."

Yet most software insists on **rigid ISO 8601 dates**, forcing humans to pretend they know more than they do. When software only accepts exact dates, users are forced to guess, invent, or leave fields blank—losing valuable information.

**EDTF exists because real time is messy—and pretending otherwise loses information.**

## Features

- **FuzzyDate API** - Temporal-inspired, method-based interface with IDE autocomplete
- **Full EDTF Level 0, 1, 2 support** - Complete spec compliance
- **TypeScript-first** - Complete type safety with discriminated unions
- **Allen's interval algebra** - 13 temporal relations with four-valued logic
- **Human-readable formatting** - i18n-ready output with customizable options
- **Zero runtime dependencies** - Lightweight and fast
- **BigInt support** - Handle extreme historical dates beyond JavaScript Date limits
- **Tree-shakeable** - Import only what you need

## Installation

```bash
npm install @edtf-ts/core
# or
pnpm add @edtf-ts/core
# or
yarn add @edtf-ts/core
```

## Quick Start

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

// Boolean convenience methods for when you need true/false
a.isDefinitelyBefore(b); // true
decade.isPossiblyBefore(year); // true (could be 1980-1984)
```

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
- Sets/Lists: `[1985,1990,1995]`, `{1985-04,1985-05}`
- Extended seasons: `1985-25` (Winter, Northern)

## Truth Values in Comparison

The comparison methods use four-valued logic for precise temporal reasoning:

- **YES** - Relationship definitely holds
- **NO** - Relationship definitely does not hold
- **MAYBE** - Relationship might hold (uncertain due to imprecision)
- **UNKNOWN** - Cannot determine (missing information)

```typescript
const y1980 = FuzzyDate.parse('1980');
const y1990 = FuzzyDate.parse('1990');
const decade = FuzzyDate.parse('198X');

y1980.isBefore(y1990); // 'YES' - bounds prove it
decade.equals(y1985); // 'MAYBE' - could be 1985

// Boolean convenience methods
y1980.isDefinitelyBefore(y1990); // true
decade.isPossiblyBefore(y1985); // true
```

## Documentation

Full documentation is available at **[bobpritchett.github.io/edtf-ts](https://bobpritchett.github.io/edtf-ts/)**

- **[Getting Started Guide](https://bobpritchett.github.io/edtf-ts/guide/getting-started)**
- **[API Reference](https://bobpritchett.github.io/edtf-ts/api/core)**
- **[Comparison Guide](https://bobpritchett.github.io/edtf-ts/guide/comparison)**
- **[Interactive Playground](https://bobpritchett.github.io/edtf-ts/playground)**

## Related Packages

- **[@edtf-ts/natural](https://www.npmjs.com/package/@edtf-ts/natural)** - Natural language date parsing ("circa 1950", "early January 1985")

## License

MIT Copyright 2025 Bob Pritchett

## Contributing

Contributions welcome! See the [GitHub repository](https://github.com/BobPritchett/edtf-ts) for details.
