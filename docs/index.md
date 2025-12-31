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
      link: https://github.com/BobPritchett/edtf-ts

features:
  - icon: 🗣️
    title: Natural Language Parsing
    details: Parse human-readable dates like "circa 1950", "early January 1985", and "the 1960s" into EDTF format with confidence scoring.

  - icon: 📅
    title: Full EDTF Support
    details: Complete implementation of Levels 0, 1, and 2 including uncertainty, approximation, and complex date expressions.

  - icon: 🔒
    title: Type-Safe
    details: Built with TypeScript 5.0+ with strict mode. Full type inference and IntelliSense support.

  - icon: 🪶
    title: Zero Dependencies
    details: Core package has zero runtime dependencies. Tree-shakeable for optimal bundle size.

  - icon: 🌍
    title: Locale Support
    details: Built-in internationalization for formatting dates in multiple locales using Intl API. Parse and format in any language.

  - icon: ⚖️
    title: Temporal Reasoning
    details: Allen's interval algebra with four-valued logic (YES/NO/MAYBE/UNKNOWN) for precise temporal comparisons.

  - icon: 🚀
    title: Modern Tooling
    details: ESM and CommonJS dual builds. Works in browsers, Node.js, and modern bundlers.

  - icon: 🤖
    title: AI-Powered Development
    details: Developed collaboratively using advanced AI tools, including Claude Code, Gemini, ChatGPT, and Grok.
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
  console.log(result.value.year); // 1985
  console.log(result.value.month); // 4
  console.log(result.value.day); // 12
  console.log(result.value.min); // Date object
  console.log(result.value.max); // Date object
}

// Parse uncertain dates
const uncertain = parse('1984?');
if (uncertain.success && isEDTFDate(uncertain.value)) {
  console.log(uncertain.value.qualification?.uncertain); // true
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

## Natural Language Parsing

EDTF-TS includes a powerful natural language parser that converts human-readable dates to EDTF format:

```typescript
import { parseNatural } from '@edtf-ts/natural';

// Parse human-readable dates
parseNatural('January 12, 1940');       // → '1940-01-12'
parseNatural('circa 1950');              // → '1950~'
parseNatural('possibly 1984');           // → '1984?'
parseNatural('from 1964 to 2008');       // → '1964/2008'
parseNatural('Spring 2001');             // → '2001-21'
parseNatural('the 1960s');               // → '196X'

// Temporal modifiers for precision
parseNatural('early January 1985');      // → '1985-01-01/1985-01-10'
parseNatural('mid 1990s');               // → '1994/1996'
parseNatural('late 19th century');       // → '1867/1900'

// Handles ambiguous dates with confidence scoring
const results = parseNatural('02/03/2020', { locale: 'en-US' });
// Returns both MM/DD and DD/MM interpretations with confidence scores
```

## Human-Readable Formatting

Convert EDTF dates back to natural language with full i18n support:

```typescript
import { parse } from '@edtf-ts/core';
import { formatHuman } from '@edtf-ts/utils';

formatHuman(parse('1985-04-12').value);  // "April 12, 1985"
formatHuman(parse('1984?').value);       // "1984 (uncertain)"
formatHuman(parse('1950~').value);       // "circa 1950"
formatHuman(parse('2001-21').value);     // "Spring 2001"

// Localization support
formatHuman(parse('1985-04-12').value, { locale: 'de-DE' });  // "12. April 1985"
formatHuman(parse('1985-04-12').value, { locale: 'ja-JP' });  // "1985年4月12日"
```

## Why EDTF-TS?

- **Full Specification Compliance**: Complete implementation of the Library of Congress EDTF specification
- **TypeScript First**: Designed for TypeScript with excellent type inference
- **Developer Experience**: Rich API, helpful error messages, comprehensive documentation
- **Modern JavaScript**: Uses latest ECMAScript features and best practices
- **Small Bundle**: Optimized parser keeps the core package under 35KB
- **AI Collaboration**: Built with the assistance of advanced AI tools for rapid and reliable development

## Packages

| Package                           | Description                              | Size         |
| --------------------------------- | ---------------------------------------- | ------------ |
| [@edtf-ts/core](./api/core)       | Core EDTF parsing and types              | 34.92 KB ESM |
| [@edtf-ts/compare](./api/compare) | Temporal reasoning with Allen's algebra  | 8.5 KB ESM   |
| [@edtf-ts/utils](./api/utils)     | Validators, formatters, comparators      | 12.69 KB ESM |
| [@edtf-ts/natural](./api/natural) | Natural language parsing and formatting  | 15.2 KB ESM  |

## What is EDTF?

Extended Date/Time Format (EDTF) is a standard developed by the Library of Congress for representing dates that are uncertain, approximate, or otherwise complex. It's designed to handle real-world date scenarios like:

- Uncertain dates: `1984?` (possibly 1984)
- Approximate dates: `1950~` (circa 1950)
- Unspecified dates: `199X` (sometime in the 1990s)
- Date ranges: `1940/1945` (from 1940 to 1945)
- Seasons: `2001-21` (Spring 2001)
- Sets: `[1667,1668,1670]` (one of these years)

## Community

- [GitHub Discussions](https://github.com/BobPritchett/edtf-ts/discussions) - Ask questions and share ideas
- [Issue Tracker](https://github.com/BobPritchett/edtf-ts/issues) - Report bugs and request features
- [NPM Package](https://www.npmjs.com/package/@edtf-ts/core) - View package stats and versions

## License

MIT License - see [LICENSE](https://github.com/BobPritchett/edtf-ts/blob/main/LICENSE) for details.
