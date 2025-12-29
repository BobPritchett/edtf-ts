---
layout: home

hero:
  name: EDTF-TS
  text: Extended Date/Time Format
  tagline: Modern TypeScript implementation with full Level 0, 1, and 2 support
  image:
    src: /logo.svg
    alt: EDTF-TS
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: brand
      text: Try Playground
      link: /playground
    - theme: alt
      text: View on GitHub
      link: https://github.com/yourusername/edtf-ts

features:
  - icon: 📅
    title: Full EDTF Support
    details: Complete implementation of Levels 0, 1, and 2 including uncertainty, approximation, and complex date expressions.

  - icon: 🔒
    title: Type-Safe
    details: Built with TypeScript 5.0+ with strict mode. Full type inference and IntelliSense support.

  - icon: 🪶
    title: Zero Dependencies
    details: Core package has zero runtime dependencies. Tree-shakeable for optimal bundle size.

  - icon: ✅
    title: Well Tested
    details: 194 tests passing across core and utils packages. Comprehensive coverage of all features.

  - icon: 🌍
    title: Locale Support
    details: Built-in internationalization for formatting dates in multiple locales using Intl API.

  - icon: 🚀
    title: Modern Tooling
    details: ESM and CommonJS dual builds. Works in browsers, Node.js, and modern bundlers.

  - icon: 📖
    title: Rich API
    details: Comparison methods, interval operations, iteration support, and comprehensive utilities.

  - icon: 🎯
    title: Production Ready
    details: Used in cultural heritage, archival, and historical data applications worldwide.

  - icon: ⚡
    title: Fast Parsing
    details: Hand-written recursive descent parser optimized for performance and bundle size.
---

## Quick Start

Install the package:

::: code-group

```bash [pnpm]
pnpm add @edtf-ts/core
```

```bash [npm]
npm install @edtf-ts/core
```

```bash [yarn]
yarn add @edtf-ts/core
```

:::

Parse your first EDTF date:

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

// Parse a simple date
const result = parse('1985-04-12');

if (result.success && isEDTFDate(result.value)) {
  console.log(result.value.year);   // 1985
  console.log(result.value.month);  // 4
  console.log(result.value.day);    // 12
  console.log(result.value.min);    // Date object
  console.log(result.value.max);    // Date object
}

// Parse uncertain dates
const uncertain = parse('1984?');
if (uncertain.success && isEDTFDate(uncertain.value)) {
  console.log(uncertain.value.qualification?.uncertain);  // true
}

// Parse intervals
const interval = parse('1990/2000');
// Iterate through years
if (interval.success && isEDTFInterval(interval.value)) {
  for (const year of interval.value.by('year')) {
    console.log(year.edtf);
  }
}
```

## Why EDTF-TS?

- **Full Specification Compliance**: Complete implementation of the Library of Congress EDTF specification
- **TypeScript First**: Designed for TypeScript with excellent type inference
- **Developer Experience**: Rich API, helpful error messages, comprehensive documentation
- **Modern JavaScript**: Uses latest ECMAScript features and best practices
- **Small Bundle**: Hand-written parser keeps the core package under 35KB
- **Utilities Included**: Formatting, validation, comparison, and more in separate packages

## Packages

| Package | Description | Size |
|---------|-------------|------|
| [@edtf-ts/core](./api/core) | Core EDTF parsing and types | 34.92 KB ESM |
| [@edtf-ts/utils](./api/utils) | Validators, formatters, comparators | 12.69 KB ESM |

## What is EDTF?

Extended Date/Time Format (EDTF) is a standard developed by the Library of Congress for representing dates that are uncertain, approximate, or otherwise complex. It's commonly used in:

- **Cultural Heritage**: Museums, archives, libraries
- **Historical Research**: Academic and genealogical work
- **Digital Humanities**: Scholarly databases and projects
- **Archives & Special Collections**: Metadata for historical materials

EDTF extends ISO 8601 to handle real-world date scenarios like:

- Uncertain dates: `1984?` (possibly 1984)
- Approximate dates: `1950~` (circa 1950)
- Unspecified dates: `199X` (sometime in the 1990s)
- Date ranges: `1940/1945` (from 1940 to 1945)
- Seasons: `2001-21` (Spring 2001)
- Sets: `[1667,1668,1670]` (one of these years)

## Community

- [GitHub Discussions](https://github.com/yourusername/edtf-ts/discussions) - Ask questions and share ideas
- [Issue Tracker](https://github.com/yourusername/edtf-ts/issues) - Report bugs and request features
- [NPM Package](https://www.npmjs.com/package/@edtf-ts/core) - View package stats and versions

## License

MIT License - see [LICENSE](https://github.com/yourusername/edtf-ts/blob/main/LICENSE) for details.
