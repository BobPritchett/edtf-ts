# Natural Language Parser: Technology Choice & Format Specification

## Parser Technology Analysis

### The Three Options

| Feature            | Hand-written            | Peggy (PEG.js successor)         | Nearley               |
| ------------------ | ----------------------- | -------------------------------- | --------------------- |
| **Algorithm**      | Recursive descent       | PEG (Parsing Expression Grammar) | Earley                |
| **Ambiguity**      | ❌ Must handle manually | ❌ First match wins              | ✅ Returns ALL parses |
| **Bundle Size**    | **~5-10KB**             | ~15-20KB                         | ~40KB                 |
| **Build Step**     | **None**                | Requires compilation             | Requires compilation  |
| **Dependencies**   | **Zero**                | peggy (dev) + runtime            | nearley (runtime)     |
| **Error Messages** | **Full control**        | Good                             | Good                  |
| **Speed**          | **Fastest**             | Fast                             | Slower (but fine)     |
| **Debugging**      | **Plain TypeScript**    | Generated code                   | Generated code        |
| **Used By**        | @edtf-ts/core ✅        | edtfy                            | edtf.js               |

### The Key Insight: Two Different Problems

**EDTF string parsing** and **natural language parsing** are fundamentally different problems requiring different solutions.

**EDTF strings are unambiguous:**

```
"1950~"     → Always means "approximately 1950"
"1950?"     → Always means "uncertain 1950"
"1950/1960" → Always means interval 1950 to 1960
```

**Natural language dates are inherently ambiguous:**

```
"02/03/2020"  → 2020-02-03 (US: MM/DD) OR 2020-03-02 (EU: DD/MM)?
"Spring 2020" → 2020-21 (unambiguous)
"next spring" → Depends on current date (context-dependent)
"1960s"       → 196X (unambiguous)
"the 60s"     → 196X or 206X? (century ambiguous)
```

### Recommendation: Right Tool for Each Job

```
┌─────────────────────────────────────────────────────────────┐
│                        @edtf-ts                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  @edtf-ts/core          │  @edtf-ts/natural                │
│  ──────────────         │  ────────────────                │
│  EDTF String Parsing    │  Natural Language Parsing        │
│                         │                                   │
│  Grammar: UNAMBIGUOUS   │  Grammar: AMBIGUOUS              │
│  "1950~" → one meaning  │  "02/03/2020" → multiple meanings│
│                         │                                   │
│  Tool: HAND-WRITTEN ✅  │  Tool: Nearley                   │
│  (smallest, fastest,    │  (handles ambiguity,             │
│   zero dependencies,    │   returns all valid parses)      │
│   already working)      │                                   │
│                         │                                   │
│  Returns: Single result │  Returns: Multiple interpretations│
│                         │  with confidence scores          │
│                         │                                   │
└─────────────────────────────────────────────────────────────┘
```

### Why Hand-Written for @edtf-ts/core

We have a working, tested hand-written parser. Here's why that's the right choice:

**1. Already Working and Tested**

```typescript
// If it works, don't fix it
parse('1985-04-12'); // ✅ Working
parse('1985-04'); // ✅ Working
parse('1985'); // ✅ Working
parse('1950~'); // ✅ Working
parse('1964/2008'); // ✅ Working
```

**2. Smallest Possible Bundle**

- Hand-written: ~5-10KB
- Peggy: ~15-20KB (2-3x larger)
- No runtime dependencies

**3. No Build Step**

- It's just TypeScript
- No `.peggy` → `.js` compilation
- Simpler CI/CD pipeline

**4. Full Control Over Error Messages**

```typescript
// Hand-written gives us precise, helpful errors
{
  code: 'INVALID_MONTH',
  message: 'Month must be 01-12, got: 13',
  position: { start: 5, end: 7 },
  suggestion: 'Did you mean 03 (March)?'
}
```

**5. Easier to Debug**

- Step through actual TypeScript code
- No generated parser code to trace through
- Stack traces point to real source files

**6. EDTF Spec is Fixed**

- The grammar won't change frequently
- No benefit from "grammar as documentation"
- Maintenance burden is low

### When Would Peggy Be Better?

Peggy would make sense if:

- Starting from scratch with no existing parser
- Grammar is extremely complex and evolving rapidly
- Multiple developers need to modify parsing rules frequently
- You want the grammar file to serve as documentation

None of these apply to @edtf-ts/core.

### Why Nearley for @edtf-ts/natural

Natural language parsing is a completely different problem where Nearley's features are essential:

**1. Multiple Parse Results (Critical for NL)**

```typescript
// Nearley can return ALL valid parses
const results = parser.parse('02/03/2020');
// [
//   { edtf: "2020-02-03", confidence: 0.6, interpretation: "February 3, 2020 (US format)" },
//   { edtf: "2020-03-02", confidence: 0.4, interpretation: "March 2, 2020 (EU format)" }
// ]
```

**2. Handles Overlapping Patterns Gracefully**

```
// Nearley explores all possibilities
date -> month_name day "," year   # "January 12, 1940"
date -> day month_name year       # "12 January 1940"
date -> month "/" day "/" year    # "1/12/1940" or "01/12/1940"
date -> day "/" month "/" year    # "12/1/1940" (EU)
```

**3. Proven in EDTF Space**

- edtf.js uses Nearley successfully
- We can reference their grammar patterns
- Known to handle date complexity well

**4. Ambiguity Is the Feature, Not a Bug**

- Users WANT to see "this could mean X or Y"
- Confidence scoring requires multiple interpretations
- Let the user disambiguate when needed

### Final Recommendation

```typescript
// @edtf-ts/core - Hand-written parser (KEEP WHAT WE HAVE)
import { parse } from '@edtf-ts/core';
parse('1950~'); // Single, definitive result
// ✅ Smallest bundle
// ✅ Zero dependencies
// ✅ Fastest performance
// ✅ Already working

// @edtf-ts/natural - Nearley parser (NEW)
import { parseNatural } from '@edtf-ts/natural';
parseNatural('02/03/2020'); // Multiple interpretations with confidence
// ✅ Handles ambiguity
// ✅ Returns all valid parses
// ✅ Proven approach (edtf.js uses it)
```

**Benefits of This Split:**

1. ✅ Users who don't need NL get smallest possible bundle
2. ✅ Right tool for each problem
3. ✅ Clear separation of concerns
4. ✅ Core package has zero dependencies
5. ✅ Natural package gets proper ambiguity handling

---

## Human-Readable Date Formats Specification

### Overview

This is the comprehensive list of human-readable formats the `@edtf-ts/natural` package will accept.

### Format Categories

## 1. Complete Dates

### 1.1 Standard Formats

| Input              | EDTF Output  | Notes                     |
| ------------------ | ------------ | ------------------------- |
| `January 12, 1940` | `1940-01-12` | US long format            |
| `12 January 1940`  | `1940-01-12` | EU long format            |
| `Jan 12, 1940`     | `1940-01-12` | US abbreviated            |
| `12 Jan 1940`      | `1940-01-12` | EU abbreviated            |
| `1940-01-12`       | `1940-01-12` | ISO format (pass-through) |

### 1.2 Numeric Formats (AMBIGUOUS - returns multiple)

| Input        | Interpretations   | Confidence            |
| ------------ | ----------------- | --------------------- |
| `01/12/1940` | `1940-01-12` (US) | 0.6 (if locale=en-US) |
|              | `1940-12-01` (EU) | 0.4                   |
| `12/01/1940` | `1940-12-01` (US) | 0.6 (if locale=en-US) |
|              | `1940-01-12` (EU) | 0.4                   |
| `1/12/1940`  | `1940-01-12` (US) | 0.6                   |
| `12/1/1940`  | `1940-12-01` (US) | 0.6                   |

### 1.3 Two-Digit Years

| Input      | EDTF Output  | Notes                     |
| ---------- | ------------ | ------------------------- |
| `01/12/40` | `1940-01-12` | Century window: 1930-2029 |
| `01/12/99` | `1999-01-12` |                           |
| `01/12/25` | `2025-01-12` |                           |

## 2. Partial Dates

### 2.1 Month and Year

| Input          | EDTF Output |
| -------------- | ----------- |
| `January 2020` | `2020-01`   |
| `Jan 2020`     | `2020-01`   |
| `01/2020`      | `2020-01`   |
| `2020-01`      | `2020-01`   |

### 2.2 Year Only

| Input           | EDTF Output |
| --------------- | ----------- |
| `2020`          | `2020`      |
| `the year 2020` | `2020`      |
| `in 2020`       | `2020`      |

## 3. Uncertain Dates (Level 1: ?)

| Input                | EDTF Output   |
| -------------------- | ------------- |
| `1984?`              | `1984?`       |
| `possibly 1984`      | `1984?`       |
| `maybe 1984`         | `1984?`       |
| `perhaps 1984`       | `1984?`       |
| `probably 1984`      | `1984?`       |
| `uncertain: 1984`    | `1984?`       |
| `1984 (uncertain)`   | `1984?`       |
| `1984 (?)`           | `1984?`       |
| `June 2004?`         | `2004-06?`    |
| `possibly June 2004` | `2004-06?`    |
| `June 11, 2004?`     | `2004-06-11?` |

## 4. Approximate Dates (Level 1: ~)

| Input                 | EDTF Output   |
| --------------------- | ------------- |
| `circa 1950`          | `1950~`       |
| `c. 1950`             | `1950~`       |
| `c 1950`              | `1950~`       |
| `ca. 1950`            | `1950~`       |
| `ca 1950`             | `1950~`       |
| `about 1950`          | `1950~`       |
| `around 1950`         | `1950~`       |
| `approximately 1950`  | `1950~`       |
| `approx. 1950`        | `1950~`       |
| `approx 1950`         | `1950~`       |
| `roughly 1950`        | `1950~`       |
| `~1950`               | `1950~`       |
| `1950 (approximate)`  | `1950~`       |
| `circa June 1950`     | `1950-06~`    |
| `about June 12, 1950` | `1950-06-12~` |

## 5. Uncertain AND Approximate (Level 1: %)

| Input                            | EDTF Output |
| -------------------------------- | ----------- |
| `circa 1984?`                    | `1984%`     |
| `about 1984?`                    | `1984%`     |
| `possibly around 1984`           | `1984%`     |
| `maybe circa 1984`               | `1984%`     |
| `approximately 1984 (uncertain)` | `1984%`     |
| `~1984?`                         | `1984%`     |

## 6. Unspecified Digits (Level 1: X)

### 6.1 Decades

| Input         | EDTF Output |
| ------------- | ----------- | ----------------------------- |
| `the 1960s`   | `196X`      |
| `1960s`       | `196X`      |
| `the sixties` | `196X`      |
| `60s`         | `196X`      | Context: 20th century default |
| `the '60s`    | `196X`      |
| `'60s`        | `196X`      |

### 6.2 Centuries

| Input                    | EDTF Output |
| ------------------------ | ----------- |
| `the 1800s`              | `18XX`      |
| `1800s`                  | `18XX`      |
| `the nineteenth century` | `18XX`      |
| `19th century`           | `18XX`      |
| `the 19th century`       | `18XX`      |
| `19th c.`                | `18XX`      |
| `19th c`                 | `18XX`      |

### 6.3 Partial Unspecified

| Input                      | EDTF Output  |
| -------------------------- | ------------ |
| `sometime in 1999`         | `1999-XX-XX` |
| `a month in 1999`          | `1999-XX`    |
| `some month in 1999`       | `1999-XX`    |
| `a day in January 1872`    | `1872-01-XX` |
| `some day in January 1872` | `1872-01-XX` |
| `sometime in January 1872` | `1872-01-XX` |
| `a day in 1872`            | `1872-XX-XX` |
| `December 25, 156Xs`       | `156X-12-25` |

### 6.4 Qualified Decades

| Input            | EDTF Output |
| ---------------- | ----------- | -------------------------------------- |
| `circa 1960s`    | `196X~`     |
| `possibly 1960s` | `196X?`     |
| `early 1960s`    | `196X`      | Note: "early" is semantic, not in EDTF |
| `late 1960s`     | `196X`      | Note: "late" is semantic               |
| `mid-1960s`      | `196X`      | Note: "mid" is semantic                |

## 7. Intervals (Level 0 & 1)

### 7.1 Basic Intervals

| Input                   | EDTF Output |
| ----------------------- | ----------- | --------------- |
| `1964/2008`             | `1964/2008` | Pass-through    |
| `1964-2008`             | `1964/2008` | Hyphen to slash |
| `1964 to 2008`          | `1964/2008` |
| `1964 - 2008`           | `1964/2008` |
| `from 1964 to 2008`     | `1964/2008` |
| `between 1964 and 2008` | `1964/2008` |
| `1964 through 2008`     | `1964/2008` |
| `1964 until 2008`       | `1964/2008` |

### 7.2 Mixed Precision Intervals

| Input                      | EDTF Output             |
| -------------------------- | ----------------------- |
| `June 2004 to August 2006` | `2004-06/2006-08`       |
| `June 2004 - August 2006`  | `2004-06/2006-08`       |
| `2/1/2004 to 2/8/2005`     | `2004-02-01/2005-02-08` |
| `February 1, 2004 to 2005` | `2004-02-01/2005`       |
| `2005 to June 2006`        | `2005/2006-06`          |

### 7.3 Qualified Intervals

| Input                           | EDTF Output     |
| ------------------------------- | --------------- |
| `circa 1984 to June 2004`       | `1984~/2004-06` |
| `from around 1984 to June 2004` | `1984~/2004-06` |
| `1984 to circa June 2004`       | `1984/2004-06~` |
| `1984 to about June 2004`       | `1984/2004-06~` |
| `circa 1984 to circa 2004`      | `1984~/2004~`   |
| `1984? to 2004?`                | `1984?/2004?`   |

### 7.4 Open Intervals

| Input                   | EDTF Output  |
| ----------------------- | ------------ |
| `before 1930`           | `../1930`    |
| `earlier than 1930`     | `../1930`    |
| `prior to 1930`         | `../1930`    |
| `until 1930`            | `../1930`    |
| `up to 1930`            | `../1930`    |
| `after 1930`            | `1930/..`    |
| `later than 1930`       | `1930/..`    |
| `since 1930`            | `1930/..`    |
| `from 1930 onwards`     | `1930/..`    |
| `1930 or later`         | `1930/..`    |
| `1930 and after`        | `1930/..`    |
| `before January 1928`   | `../1928-01` |
| `after about the 1920s` | `192X~/..`   |

### 7.5 Unknown Endpoint Intervals

| Input                          | EDTF Output   |
| ------------------------------ | ------------- |
| `from June 1, 2004 to unknown` | `2004-06-01/` |
| `1984 to unknown`              | `1984/`       |
| `unknown to 1984`              | `/1984`       |
| `? to 1984`                    | `/1984`       |

## 8. Seasons (Level 1)

| Input         | EDTF Output | Season Code |
| ------------- | ----------- | ----------- |
| `Spring 2001` | `2001-21`   | 21          |
| `spring 2001` | `2001-21`   | 21          |
| `Summer 2001` | `2001-22`   | 22          |
| `summer 2001` | `2001-22`   | 22          |
| `Autumn 2001` | `2001-23`   | 23          |
| `autumn 2001` | `2001-23`   | 23          |
| `Fall 2001`   | `2001-23`   | 23          |
| `fall 2001`   | `2001-23`   | 23          |
| `Winter 2001` | `2001-24`   | 24          |
| `winter 2001` | `2001-24`   | 24          |

### 8.1 Qualified Seasons

| Input                  | EDTF Output |
| ---------------------- | ----------- |
| `circa Spring 2001`    | `2001-21~`  |
| `possibly Spring 2001` | `2001-21?`  |
| `about Fall 2020`      | `2020-23~`  |

## 9. Sets (Level 2)

### 9.1 One of a Set (Square Brackets)

| Input                              | EDTF Output                 |
| ---------------------------------- | --------------------------- |
| `1667 or 1668 or 1670`             | `[1667,1668,1670]`          |
| `either 1667 or 1668`              | `[1667,1668]`               |
| `1667, 1668, or 1670`              | `[1667,1668,1670]`          |
| `Jan 1760 or Feb 1760 or Dec 1760` | `[1760-01,1760-02,1760-12]` |
| `1667 or December 1760`            | `[1667,1760-12]`            |

### 9.2 All of a Set (Curly Braces)

| Input                    | EDTF Output        |
| ------------------------ | ------------------ |
| `1667 and 1668 and 1670` | `{1667,1668,1670}` |
| `both 1667 and 1668`     | `{1667,1668}`      |
| `1667, 1668, and 1670`   | `{1667,1668,1670}` |
| `1960 and December 1961` | `{1960,1961-12}`   |

### 9.3 Set with Range

| Input                           | EDTF Output              |
| ------------------------------- | ------------------------ |
| `1667, 1668, 1670 through 1672` | `[1667,1668,1670..1672]` |
| `1984 or earlier`               | `[..1984]`               |
| `1984 or before`                | `[..1984]`               |
| `December 1760 or later`        | `[1760-12..]`            |
| `December 1760 or after`        | `[1760-12..]`            |

## 10. Ordinal Day Variants (Level 0)

### 10.1 Basic Ordinals

| Input                       | EDTF Output  | Notes          |
| --------------------------- | ------------ | -------------- |
| `January 12th, 1940`        | `1940-01-12` | US format      |
| `12th January 1940`         | `1940-01-12` | EU format      |
| `the 12th of January, 1940` | `1940-01-12` | Spoken prose   |
| `April 1st, 1985`           | `1985-04-01` | 1st ordinal    |
| `December 2nd, 2004`        | `2004-12-02` | 2nd ordinal    |
| `March 3rd, 1999`           | `1999-03-03` | 3rd ordinal    |
| `January the 12th, 1940`    | `1940-01-12` | Spoken variant |
| `on the 1st of May 2000`    | `2000-05-01` | With preposition |

**Normalization**: Ordinal suffixes (st, nd, rd, th) are stripped before parsing.

## 11. Approximation Symbol Variants (Level 1)

| Input            | EDTF Output | Notes                    |
| ---------------- | ----------- | ------------------------ |
| `≈ 1950`         | `1950~`     | Approximation symbol     |
| `≈1950`          | `1950~`     | No space                 |
| `~ 1950`         | `1950~`     | Tilde with space         |
| `~1950`          | `1950~`     | Tilde no space           |
| `1950-ish`       | `1950~`     | Suffix with hyphen       |
| `1950ish`        | `1950~`     | Suffix no hyphen         |
| `circa. 1950`    | `1950~`     | Period after circa       |
| `circa.1950`     | `1950~`     | Period, no space         |
| `c.1950`         | `1950~`     | Abbreviated, no space    |
| `c. 1950`        | `1950~`     | Abbreviated with space   |
| `ca.1950`        | `1950~`     | Latin abbreviation       |

**Normalization**: All approximation symbols and suffixes map to `~` qualifier.

## 12. Apostrophe Variants (Level 1)

### 12.1 Decades with Apostrophes

| Input          | EDTF Output | Notes                  |
| -------------- | ----------- | ---------------------- |
| `the 1960's`   | `196X`      | Apostrophe before s    |
| `1960's`       | `196X`      | Without "the"          |
| `the 1800's`   | `18XX`      | Century with apostrophe|
| `1800's`       | `18XX`      | Century informal       |
| `'60s`         | `196X`      | Leading apostrophe     |
| `the '60s`     | `196X`      | With "the"             |
| `1960's era`   | `196X`      | Trailing noise ignored |

**Normalization**: Both ASCII `'` and Unicode `'` apostrophes are accepted equivalently.

## 13. Era Markers (BCE/BC/AD/CE)

### 13.1 BC/BCE Single Years

| Input          | EDTF Output | Notes                  |
| -------------- | ----------- | ---------------------- |
| `-1985`        | `-1985`     | Direct negative        |
| `44 BC`        | `-0043`     | Space variant          |
| `44BC`         | `-0043`     | No space               |
| `44 BCE`       | `-0043`     | Modern notation        |
| `44 B.C.`      | `-0043`     | Punctuated             |
| `44 B.C.E.`    | `-0043`     | Punctuated modern      |
| `44 bce`       | `-0043`     | Lowercase              |
| `c.44 BC`      | `-0043~`    | Approximate            |
| `circa 44 BCE` | `-0043~`    | Approximate variant    |
| `circa 500 BCE`| `-0499~`    | Approximate century    |

**Note**: BC/BCE years are off-by-one (44 BC = year -43 in astronomical year numbering).

### 13.2 AD/CE Single Years

| Input          | EDTF Output | Notes                  |
| -------------- | ----------- | ---------------------- |
| `AD 79`        | `0079`      | Prefix form            |
| `AD79`         | `0079`      | No space               |
| `A.D. 79`      | `0079`      | Punctuated             |
| `79 AD`        | `0079`      | Suffix form            |
| `CE 79`        | `0079`      | Modern notation        |
| `79 CE`        | `0079`      | Modern suffix          |
| `c.79 AD`      | `0079~`     | Approximate            |
| `circa AD 800` | `0800~`     | Approximate variant    |

**Normalization**: Spaces around era markers are optional.

## 11. Long Years (Level 1: Y prefix)

| Input                   | EDTF Output   |
| ----------------------- | ------------- |
| `170000002`             | `Y170000002`  |
| `170,000,002`           | `Y170000002`  |
| `170 million years ago` | `Y-170000000` |
| `-170000002`            | `Y-170000002` |

## 12. Exponential Years (Level 2)

| Input      | EDTF Output |
| ---------- | ----------- |
| `17×10^7`  | `Y17E7`     |
| `17E7`     | `Y17E7`     |
| `-17×10^7` | `Y-17E7`    |

## 13. Significant Digits (Level 2)

| Input                                       | EDTF Output    | Meaning             |
| ------------------------------------------- | -------------- | ------------------- |
| `approximately 1950 (2 significant digits)` | `1950S2`       | 1900-1999           |
| `circa 171010000 (3 sig figs)`              | `Y171010000S3` | 171000000-171999999 |

---

## Round-Tripping Specification

### The Question

Can we parse everything we format, and vice versa?

### Answer: YES, with Semantic Equality

Round-tripping works on **semantic meaning**, not exact strings.

### Format → Parse → Format (Stable)

```typescript
const edtf = '1950~';
const human = format(edtf); // "circa 1950" (canonical form)
const parsed = parseNatural(human); // { edtf: "1950~", ... }
parsed.edtf === edtf; // ✅ true
```

### Parse → Format → Parse (Stable, but normalized)

```typescript
const input1 = 'about 1950';
const input2 = 'around 1950';
const input3 = 'circa 1950';
const input4 = '~1950';
const input5 = 'approximately 1950';

// All parse to the same EDTF
parseNatural(input1).edtf; // "1950~"
parseNatural(input2).edtf; // "1950~"
parseNatural(input3).edtf; // "1950~"
parseNatural(input4).edtf; // "1950~"
parseNatural(input5).edtf; // "1950~"

// Format produces canonical form
format('1950~'); // "circa 1950" (canonical)

// Re-parsing canonical form works
parseNatural(format('1950~')).edtf; // "1950~" ✅
```

### Canonical Forms (What format() produces)

| EDTF               | Canonical Human Form     |
| ------------------ | ------------------------ |
| `1950`             | "1950"                   |
| `1950-06`          | "June 1950"              |
| `1950-06-15`       | "June 15, 1950"          |
| `1950~`            | "circa 1950"             |
| `1950?`            | "1950 (uncertain)"       |
| `1950%`            | "circa 1950 (uncertain)" |
| `196X`             | "1960s"                  |
| `18XX`             | "19th century"           |
| `1950/1960`        | "1950 to 1960"           |
| `../1950`          | "before 1950"            |
| `1950/..`          | "after 1950"             |
| `2001-21`          | "Spring 2001"            |
| `[1667,1668,1670]` | "1667, 1668, or 1670"    |
| `{1667,1668,1670}` | "1667, 1668, and 1670"   |
| `-0043`            | "44 BCE"                 |

### Round-Trip Guarantees

```typescript
// GUARANTEE 1: EDTF → Human → EDTF is exact
function testEdtfRoundTrip(edtf: string): boolean {
  const human = format(edtf);
  const result = parseNatural(human);
  return result.edtf === edtf;  // Always true for valid EDTF
}

// GUARANTEE 2: Human → EDTF → Human is semantically equivalent
function testHumanRoundTrip(human: string): boolean {
  const edtf = parseNatural(human).edtf;
  const canonical = format(edtf);
  const reparsed = parseNatural(canonical).edtf;
  return reparsed === edtf;  // Always true (canonical form)
}

// NOTE: Original human string may differ from canonical
"about 1950" → "1950~" → "circa 1950"  // Different string, same meaning
```

### What This Means for Users

```typescript
import { parse, format, parseNatural } from '@edtf-ts/natural';

// User types natural language
const input = 'around January 1950';
const result = parseNatural(input);
// { edtf: "1950-01~", confidence: 0.95, ... }

// Store the EDTF string in database
database.save(result.edtf); // "1950-01~"

// Later, display to user
const stored = database.load(); // "1950-01~"
const display = format(stored); // "circa January 1950"

// User can edit and re-save
const edited = parseNatural('about Feb 1950');
database.save(edited.edtf); // "1950-02~"
```

### Edge Cases

| Input         | EDTF         | Format Output      | Notes                        |
| ------------- | ------------ | ------------------ | ---------------------------- |
| `02/03/2020`  | `2020-02-03` | `February 3, 2020` | Disambiguated by locale      |
| `the 60s`     | `196X`       | `1960s`            | Century assumed              |
| `next spring` | N/A          | N/A                | Relative dates not supported |
| `last year`   | N/A          | N/A                | Relative dates not supported |

---

## Test Matrix for Round-Tripping

### Required Tests

```typescript
describe('Round-trip: EDTF → Human → EDTF', () => {
  const testCases = [
    '1950',
    '1950-06',
    '1950-06-15',
    '1950~',
    '1950?',
    '1950%',
    '196X',
    '18XX',
    '1950/1960',
    '../1950',
    '1950/..',
    '2001-21',
    '[1667,1668,1670]',
    '{1667,1668,1670}',
    '-0043',
    'Y170000002',
  ];

  testCases.forEach((edtf) => {
    it(`should round-trip: ${edtf}`, () => {
      const human = format(edtf);
      const result = parseNatural(human);
      expect(result.success).toBe(true);
      expect(result.edtf).toBe(edtf);
    });
  });
});

describe('Round-trip: Human → EDTF → Human (canonical)', () => {
  const testCases = [
    { input: 'about 1950', canonical: 'circa 1950' },
    { input: 'around 1950', canonical: 'circa 1950' },
    { input: 'approximately 1950', canonical: 'circa 1950' },
    { input: '~1950', canonical: 'circa 1950' },
    { input: 'possibly 1984', canonical: '1984 (uncertain)' },
    { input: 'maybe 1984', canonical: '1984 (uncertain)' },
    { input: 'the sixties', canonical: '1960s' },
    { input: "the '60s", canonical: '1960s' },
    { input: '19th century', canonical: '19th century' },
    { input: 'the nineteenth century', canonical: '19th century' },
  ];

  testCases.forEach(({ input, canonical }) => {
    it(`should normalize: "${input}" → "${canonical}"`, () => {
      const edtf = parseNatural(input).edtf;
      const output = format(edtf);
      expect(output).toBe(canonical);
      // And re-parsing should give same EDTF
      expect(parseNatural(output).edtf).toBe(edtf);
    });
  });
});
```

---

## Summary

### Parser Technology

- **@edtf-ts/core:** Use **hand-written parser** (smallest bundle, zero dependencies, already working and tested)
- **@edtf-ts/natural:** Use **Nearley** (handles ambiguity, returns multiple parses with confidence scores)

### Human-Readable Formats

- **200+ input patterns** across 13 categories
- All Level 0, 1, and 2 features covered
- Locale-aware for ambiguous formats

### Round-Tripping

- ✅ **EDTF → Human → EDTF:** Exact equality guaranteed
- ✅ **Human → EDTF → Human:** Semantic equality (canonical form)
- ✅ All formatted output is parseable
- ✅ Canonical forms are consistent and predictable
