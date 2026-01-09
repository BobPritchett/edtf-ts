---
layout: home

hero:
  name: EDTF-TS
  text: Dates, the Way Humans Mean Them
  tagline: Because real time is messy—and pretending otherwise loses information
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
    title: Speak Human. Parse Human.
    details: Parse dates the way people think—"circa 1950", "early January 1985", "the 1960s"—instead of forcing rigid timestamps.

  - icon: 📅
    title: Full EDTF Specification
    details: Complete Levels 0, 1, and 2 support. Uncertainty, approximation, unspecified digits, seasons, sets, and intervals.

  - icon: 🔒
    title: Type-Safe
    details: Built with TypeScript 5.0+ strict mode. Full type inference and IntelliSense for every edge case.

  - icon: 🪶
    title: Zero Dependencies
    details: Core package has zero runtime dependencies. Tree-shakeable for optimal bundle size.

  - icon: 🌍
    title: Locale Support
    details: Built-in i18n for formatting dates in any locale using the Intl API. Parse and format worldwide.

  - icon: ⚖️
    title: Temporal Reasoning
    details: Allen's interval algebra with four-valued logic (YES/NO/MAYBE/UNKNOWN) for honest temporal comparisons.

  - icon: 🚀
    title: Modern Tooling
    details: ESM and CommonJS dual builds. Works in browsers, Node.js, and modern bundlers.

  - icon: 🤖
    title: AI-Powered Development
    details: Developed collaboratively using advanced AI tools, including Claude Code, Gemini, ChatGPT, and Grok.
---

## Dates Aren't Always Exact — and That's OK

People don't experience time like computers do.

We remember *seasons*, *eras*, and *approximate moments*.
We inherit records that are incomplete, contradictory, or deliberately vague.
We say "around," "before," "after," "early," "late," and "sometime between."

Yet most software still insists on **rigid ISO 8601 dates**, forcing humans to pretend they know more than they do.

EDTF exists because **real time is messy** — and pretending otherwise loses information.

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

Parse your first EDTF date with the **FuzzyDate API**:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Parse EDTF strings into FuzzyDate objects
const date = FuzzyDate.parse('1985-04-12');
console.log(date.year);           // 1985
console.log(date.month);          // 4
console.log(date.day);            // 12
console.log(date.format());       // "April 12, 1985"

// Work with uncertainty naturally
const uncertain = FuzzyDate.parse('1984?');
console.log(uncertain.isUncertain);   // true
console.log(uncertain.format());      // "1984 (uncertain)"

// Approximate dates
const circa = FuzzyDate.parse('1950~');
console.log(circa.isApproximate);     // true
console.log(circa.format());          // "circa 1950"

// Unspecified digits
const decade = FuzzyDate.parse('198X');
console.log(decade.hasUnspecified);   // true
console.log(decade.min.getFullYear()); // 1980
console.log(decade.max.getFullYear()); // 1989

// Parse intervals and iterate
const interval = FuzzyDate.parse('1990/2000');
for (const year of interval.by('year')) {
  console.log(year.edtf);  // '1990', '1991', ..., '2000'
}

// Temporal comparison with four-valued logic
const y1980 = FuzzyDate.parse('1980');
const y1990 = FuzzyDate.parse('1990');
y1980.isBefore(y1990);      // 'YES' - definitely before
decade.equals(y1980);       // 'MAYBE' - could be 1980

// These will throw FuzzyDateParseError
FuzzyDate.parse('April 12, 1985'); // ❌ Natural language, not EDTF syntax
FuzzyDate.parse('1985-13-01');     // ❌ Invalid month (13)
FuzzyDate.parse('85-04-12');       // ❌ Two-digit year not allowed
```

## Humans Speak in Time Ranges, Not Timestamps

Think about how people actually describe dates:

* "Shakespeare was born **in late April 1564**."
* "The photo was taken **sometime in the 1930s**."
* "She moved to New York **in the early 2000s**."
* "This letter dates to **around the end of the 18th century**."

None of these are bugs. They are *truthful descriptions of what is known*.

ISO 8601 can't express this without lying or guessing. EDTF can.

## Natural Language Parsing

EDTF-TS includes a powerful natural language parser that converts human-readable dates to EDTF format:

```typescript
import { parseNatural } from '@edtf-ts/natural';

// Parse human-readable dates
parseNatural('January 12, 1940');     // → '1940-01-12'
parseNatural('circa 1950');           // → '1950~'
parseNatural('possibly 1984');        // → '1984?'
parseNatural('from 1964 to 2008');    // → '1964/2008'
parseNatural('Spring 2001');          // → '2001-21'
parseNatural('the 1960s');            // → '196X'

// Temporal modifiers for precision
parseNatural('early January 1985');   // → '1985-01-01/1985-01-10'
parseNatural('mid 1990s');            // → '1994/1996'
parseNatural('late 19th century');    // → '1867/1900'

// Handles ambiguous dates with confidence scoring
const results = parseNatural('02/03/2020', { locale: 'en-US' });
// Returns both MM/DD and DD/MM interpretations with confidence scores

// These won't parse - returns empty array []
parseNatural('next Tuesday');     // ❌ Relative dates not supported
parseNatural('in 3 weeks');       // ❌ Relative durations not supported
parseNatural('ASAP');             // ❌ Not a date expression
parseNatural('the distant past'); // ❌ Too vague to map to EDTF
```

## Real History Is Full of Uncertainty

### William Shakespeare's Birth

We do **not** know Shakespeare's exact birthdate.

What we know:
* He was baptized on **April 26, 1564**
* Infants were typically baptized within a few days of birth

So historians infer: *Born circa late April 1564*

With EDTF, that uncertainty is preserved:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

// Approximate month
const birth = FuzzyDate.parse('1564-04~');
console.log(birth.format());  // "circa April 1564"

// Or as an interval
const interval = FuzzyDate.parse('1564-04-20/1564-04-26');
console.log(interval.format());  // "April 20, 1564 to April 26, 1564"
```

No false precision. No invented birthday. Just honest data.

### Photographs, Letters, and Archives

Archivists deal with dates like:

* "**Probably 1918**" → `1918?`
* "**After the war, but before 1925**" → `1919/1924`
* "**Mid-19th century**" → `1850/1870`
* "**No earlier than 1870**" → `../1870`

Forcing these into `YYYY-MM-DD` destroys information. EDTF preserves it.

## Human-Readable Formatting

Convert EDTF dates back to natural language with full i18n support:

```typescript
import { FuzzyDate } from '@edtf-ts/core';

FuzzyDate.parse('1985-04-12').format();  // "April 12, 1985"
FuzzyDate.parse('1984?').format();       // "1984 (uncertain)"
FuzzyDate.parse('1950~').format();       // "circa 1950"
FuzzyDate.parse('2001-21').format();     // "Spring 2001"

// Localization support
FuzzyDate.parse('1985-04-12').format({ locale: 'de-DE' });  // "12. April 1985"
FuzzyDate.parse('1985-04-12').format({ locale: 'ja-JP' });  // "1985年4月12日"
```

## Stop Making People Lie to Databases

When software only accepts exact dates, users are forced to:

* **Guess** — picking a plausible date
* **Invent** — making something up entirely
* **Default** — choosing January 1st "just to make it work"
* **Omit** — leaving fields blank

All four options lose valuable information.

EDTF allows users to say: *"This is everything we know — no more, no less."*

That's better data.

## Precision When You Have It. Flexibility When You Don't.

EDTF doesn't replace ISO 8601 — it *extends* it.

* If you know the exact date, use it.
* If you don't, say what you *do* know.
* If something is uncertain, mark it as such.
* If it's approximate, say so explicitly.

That honesty unlocks:

* Better historical modeling
* Better archival metadata
* Better timelines
* Better AI reasoning
* Better user experiences

## Why EDTF-TS?

- **Full Specification Compliance**: Complete implementation of the Library of Congress EDTF specification
- **TypeScript First**: Designed for TypeScript with excellent type inference
- **Developer Experience**: Rich API, helpful error messages, comprehensive documentation
- **Modern JavaScript**: Uses latest ECMAScript features and best practices
- **Small Bundle**: Optimized parser keeps the core package under 35KB
- **AI Collaboration**: Built with the assistance of advanced AI tools for rapid and reliable development

## Packages

| Package                           | Description                             | Size         |
| --------------------------------- | --------------------------------------- | ------------ |
| [@edtf-ts/core](./api/core)            | Core EDTF parsing, comparison, formatting | ~56 KB ESM |
| [@edtf-ts/natural](./api/natural) | Natural language parsing                | ~15 KB ESM   |

## What is EDTF?

Extended Date/Time Format (EDTF) is a standard developed by the Library of Congress for representing dates that are uncertain, approximate, or otherwise complex. It's designed to handle real-world date scenarios like:

- Uncertain dates: `1984?` (possibly 1984)
- Approximate dates: `1950~` (circa 1950)
- Unspecified dates: `199X` (sometime in the 1990s)
- Date ranges: `1940/1945` (from 1940 to 1945)
- Seasons: `2001-21` (Spring 2001)
- Sets: `[1667,1668,1670]` (one of these years)

## Who Is This For?

EDTF-TS is for anywhere dates come from **people, memory, or history** — not just sensors and clocks:

* Libraries, archives, and museums
* Genealogy and biography software
* Historical research
* Content management systems
* Timelines and visualization tools
* AI systems that reason about time

## Community

- [GitHub Discussions](https://github.com/BobPritchett/edtf-ts/discussions) - Ask questions and share ideas
- [Issue Tracker](https://github.com/BobPritchett/edtf-ts/issues) - Report bugs and request features
- [NPM Package](https://www.npmjs.com/package/@edtf-ts/core) - View package stats and versions

## License

MIT License - see [LICENSE](https://github.com/BobPritchett/edtf-ts/blob/main/LICENSE) for details.
