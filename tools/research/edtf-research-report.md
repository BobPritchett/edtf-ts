# Extended Date/Time Format (EDTF) Research Report
## Comprehensive Analysis and TypeScript Module Specification

**Date:** December 26, 2025  
**Author:** Research Analysis  
**Purpose:** Document existing EDTF tools and specify requirements for a comprehensive TypeScript NPM module

---

## Executive Summary

The Extended Date/Time Format (EDTF) is a standardized date format developed by the Library of Congress to handle uncertain, approximate, and complex dates commonly found in cultural heritage, archival, and historical data. This report analyzes the current ecosystem of EDTF tools and provides a specification for a comprehensive TypeScript module.

**Key Findings:**
- The JavaScript library `edtf.js` (by inukshuk) is the most mature and feature-complete implementation for JavaScript/TypeScript
- Several Python and Ruby implementations exist with varying levels of completeness
- Critical gaps exist in: TypeScript type safety, modern tooling integration, natural language parsing, and user-friendly rendering
- Opportunity exists for a TypeScript-first implementation with superior developer experience

---

## 1. EDTF Standard Overview

### 1.1 Specification Details

**Official Specification:** [Library of Congress EDTF Specification](https://www.loc.gov/standards/datetime/)  
**Status:** Published February 4, 2019  
**Standard Basis:** ISO 8601-2 (Extended)

### 1.2 Compliance Levels

EDTF defines three conformance levels, each building upon the previous:

#### **Level 0: ISO 8601-1 Profile**
Core features from ISO 8601:
- Complete date representations: `1985-04-12`
- Reduced precision: `1985-04` (month), `1985` (year)
- Date and time combinations with timezone: `1985-04-12T23:20:30Z`
- Time intervals: `1964/2008`, `2004-06/2006-08`

#### **Level 1: Simple Extensions**
Adds uncertainty and basic extensions:
- Letter-prefixed calendar years: `Y170000002`, `Y-170000002`
- Seasons: `2001-21` (Spring 2001)
- Qualification symbols:
  - `?` = uncertain: `1984?`
  - `~` = approximate: `2004-06~`
  - `%` = uncertain and approximate: `2004-06-11%`
- Unspecified digits: `201X`, `2004-XX`, `1985-04-XX`
- Extended intervals:
  - Open intervals: `1985-04-12/..`, `../1985-04-12`
  - Unknown endpoints: `1985-04-12/`, `/1985-04-12`
- Negative years: `-1985`

#### **Level 2: Complex Extensions**
Advanced features for specialized use:
- Exponential years: `Y-17E7` (−17×10⁷)
- Significant digits: `1950S2` (some year 1900-1999, estimated 1950)
- Extended sub-year groupings:
  - Hemisphere-specific seasons: `2001-29` (Spring - Southern Hemisphere)
  - Quarters: `2001-34` (Q2 2001)
  - Quadrimesters and semesters: `2001-40` (Semestral 1)
- Set representations:
  - One of a set: `[1667,1668,1670..1672]`
  - All members: `{1667,1668,1670..1672}`
- Group qualification: `2004-06-11%` (entire date uncertain & approximate)
- Individual component qualification: `?2004-06-~11`
- Unspecified anywhere in component: `156X-12-25`
- Qualified intervals: `2004-06-~01/2004-06-~20`

### 1.3 Key Syntax Changes from Draft (2012)

The 2019 specification introduced breaking changes:
- Unspecified character: `u` → `X` (uppercase)
- Masked precision: eliminated
- Combined uncertain/approximate: `?~` → `%`
- Year prefix: `y` → `Y` (uppercase)
- Exponential indicator: `e` → `E` (uppercase)
- Significant digit indicator: `p` → `S` (uppercase)
- Interval keywords: `unknown`/`open` → null/`..`
- Qualification mechanism: parentheses → left-to-right application

---

## 2. Existing Tools Analysis

### 2.1 JavaScript/TypeScript Ecosystem

#### **edtf.js** (Primary Implementation)
- **Repository:** [github.com/inukshuk/edtf.js](https://github.com/inukshuk/edtf.js)
- **NPM Package:** `edtf` (v4.9.0, BSD-2-Clause)
- **Author:** Sylvester Keil (@inukshuk)
- **Downloads:** ~8,000/week
- **Stars:** 75

**Features:**
- ✅ Full Level 0, 1, 2 compliance (with experimental Level 3)
- ✅ Parser based on Nearley grammar
- ✅ Multiple date type classes: Date, Year, Decade, Century, Season, Interval, List, Set
- ✅ Min/max range calculation for uncertain dates
- ✅ Bitmask-based tracking of uncertain/approximate/unspecified components
- ✅ Iteration support for intervals and ranges
- ✅ Comparison operators (`covers()`, `includes()`)
- ✅ Range generators (`between()`, `until()`, `through()`)
- ✅ Random EDTF string generation (with randexp)
- ✅ ESM + CommonJS dual package (v4.1+)
- ✅ EDTF string normalization

**Limitations:**
- ❌ No TypeScript definitions
- ❌ Limited natural language parsing
- ❌ No human-readable formatting utilities
- ❌ Minimal documentation for TypeScript users
- ❌ No built-in validation error messages
- ❌ Limited locale support

**Technical Architecture:**
```javascript
import edtf, { Date, Interval } from 'edtf'

// Parse and create objects
const date = edtf('2016-XX')  // Returns EDTF Date object
date.min  // 1451606400000 (2016-01-01T00:00:00Z)
date.max  // 1483228799999 (2016-12-31T23:59:59Z)
date.edtf // '2016-XX'

// Uncertainty tracking via bitmasks
edtf('2016?-~02').uncertain.value    // 15
edtf('2016?-~02').approximate.value  // 48
```

#### **edtf-converter**
- **Repository:** [github.com/martin-lorenz/edtf-converter](https://github.com/martin-lorenz/edtf-converter)
- **NPM Package:** `edtf-converter` (v4.1.14)
- **Downloads:** Minimal (<100/week)

**Features:**
- ✅ Natural language to EDTF conversion
- ✅ EDTF to Moment.js date objects
- ✅ TypeScript support
- ✅ Browser and Node.js compatible

**Limitations:**
- ⚠️ Limited Level 1 coverage only
- ⚠️ Depends on Moment.js (deprecated)
- ❌ No Level 2 support
- ❌ Limited documentation
- ❌ No comprehensive test suite visible

**Example Usage:**
```javascript
const { Converter } = require('edtf-converter');
const converter = new Converter();

converter.textToEdtf('1940 until about June 1942')
// -> '1940/1942-06~'

converter.edtfToDate('1940/1942-06~')
// -> { min: moment(...), max: moment(...) }
```

#### **edtfy** (Natural Language → EDTF)
- **Repository:** [github.com/nicompte/edtfy](https://github.com/nicompte/edtfy)
- **NPM Package:** `edtfy` (v0.0.7, last updated 2016)
- **Author:** Nicolas Barbotte (@nicompte)
- **Stars:** 11
- **Live Demo:** [edtfy.barbotte.net](https://edtfy.barbotte.net)

**Unique Approach:** Inverse of other tools - converts natural language TO EDTF (not FROM)

**Features:**
- ✅ Natural language parsing (EN, FR locales)
- ✅ PEG.js-based parser with custom grammar
- ✅ Level 0 complete
- ✅ Level 1 partial (uncertain/approximate, unspecified, extended intervals, seasons)
- ⚠️ Level 2 partial (partial unspecified, sets, masked precision)
- ✅ Web-based demo interface
- ✅ Locale system with extensible translations

**Example Usage:**
```javascript
const edtfy = require('edtfy');
edtfy.locale('fr');
edtfy('29 mars 1988');  // → '1988-03-29'
edtfy('autour de 1984'); // → '1984~'
edtfy('de 1964 à 2008'); // → '1964/2008'
```

**Supported Natural Language Patterns:**
```javascript
// Dates
'december 1988'           → '2008-12'
'02/03/1988'              → '2001-02-03'

// Uncertainty/Approximation
'1984?'                   → '1984?'
'around 1984'             → '1984~'
'about 1984?'             → '1984?~'

// Intervals
'from 1964 to 2008'       → '1964/2008'
'June 2004 - August 2008' → '2004-06/2008-08'
'from around 1984 to June 2004' → '1984~/2004-06'

// Sets
'1667 or 1668 or 1670'    → '[1667,1668,1670]'
'before 1930'             → '[..,1930]'
'after march 2004'        → '[2004-03,..]'

// Seasons
'Spring 2001'             → '2001-21'

// Unspecified
'199u'                    → '199u'
'12/25/156u'              → '156u-12-25'
```

**Limitations:**
- ❌ Not actively maintained (last update 2016)
- ❌ Uses old EDTF draft spec (2012) with 'u' instead of 'X'
- ❌ Limited Level 2 support
- ❌ Only EN and FR locales
- ❌ No TypeScript support
- ❌ No reverse conversion (EDTF → human readable)
- ❌ Uses deprecated PEG.js (now Peggy)
- ❌ No modern build tools

**Significance:** This is the **only JavaScript library** focused specifically on natural language → EDTF conversion with locale support. It demonstrates proven patterns for NLP parsing and internationalization that should be incorporated into a modern TypeScript implementation.

#### **Other JavaScript Tools**
- **edtf-datepicker** (dsi-ehess): UI widget for EDTF input
- **ptgolden/edtf-js**: Minimal library with basic functionality

### 2.2 Python Implementations

#### **edtf2** (Python Package)
- **PyPI:** `edtf2`
- **Features:**
  - ✅ Full Level 0, 1, 2 parsing
  - ✅ Natural language parser
  - ✅ Conversion to Python datetime/struct_time
  - ✅ Handles dates outside 1-9999 AD range
  
**Natural Language Examples:**
```python
from edtf2 import text_to_edtf

text_to_edtf("circa August 1979")     # '1979-08~'
text_to_edtf("1860s")                 # '186X'
text_to_edtf("earlier than 1928")     # '/1928'
text_to_edtf("a day in about Spring 1849?")  # '1849-21-XX?~'
```

#### **python-edtf** (Legacy)
- **PyPI:** `edtf`
- Older implementation, basis for edtf2

#### **edtf-validate** (UNT Libraries)
- **Repository:** [github.com/unt-libraries/edtf-validate](https://github.com/unt-libraries/edtf-validate)
- **Features:**
  - ✅ Validation against Levels 0, 1, 2
  - ✅ Level conformance testing
  - ✅ Command-line interface
  - ✅ Used in production by UNT Libraries for 460,000+ records

**Web Service:**
- Public validation API: `http://digital2.library.unt.edu/edtf/isValid.json?date=2012-01`
- Used for real-time metadata validation in editing interfaces

### 2.3 Ruby Implementation

#### **edtf-ruby**
- **Repository:** [github.com/inukshuk/edtf-ruby](https://github.com/inukshuk/edtf-ruby)
- **Gem:** `edtf`
- **Author:** Same as edtf.js (Sylvester Keil)

**Features:**
- ✅ Full Level 0, 1, 2 support
- ✅ Extension of Ruby Date/Time classes
- ✅ Precision-aware date arithmetic
- ✅ Interval support with Ruby Range semantics
- ✅ Active Support integration

**Unique Features:**
- Precision-aware successor/predecessor
- Calendar reform awareness (Gregorian/Julian)
- Natural enumeration of intervals

#### **edtf-humanize** (Duke University)
- **Repository:** [github.com/duke-libraries/edtf-humanize](https://github.com/duke-libraries/edtf-humanize)
- **Purpose:** Convert EDTF to human-readable strings
- **Example:** `1972~` → "circa 1972"

### 2.4 Other Languages

#### **Rust: edtf-rs**
- **Repository:** [github.com/cormacrelf/edtf-rs](https://github.com/cormacrelf/edtf-rs)
- **Features:**
  - Level 0, Level 1 complete
  - Level 2 in progress
  - ISO calendar validation
  - Historical calendar handling

#### **Dart: edtf**
- **Repository:** [github.com/maalexy/edtf](https://github.com/maalexy/edtf)
- Basic EDTF parsing for Dart/Flutter

#### **Java: freelib-edtf**
- **Repository:** [github.com/ksclarke/freelib-edtf](https://github.com/ksclarke/freelib-edtf)
- **Status:** Early development (v0.1.0-SNAPSHOT)
- Uses ANTLR4 for parsing

#### **Go: sfomuseum-data-architecture**
- SFO Museum implementation for date conversion

---

## 3. Functionality Comparison Matrix

| Feature | edtf.js | edtfy | edtf-converter | edtf2 (Python) | edtf-ruby | edtf-validate | Ideal TS Module |
|---------|---------|-------|----------------|----------------|-----------|---------------|-----------------|
| **Parsing** |
| Level 0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Level 1 | ✅ | ⚠️ Partial | ⚠️ Partial | ✅ | ✅ | ✅ | ✅ |
| Level 2 | ✅ | ⚠️ Partial | ❌ | ✅ | ✅ | ✅ | ✅ |
| Direction | EDTF→Objects | NL→EDTF | Both | EDTF→Objects | EDTF→Objects | EDTF Validate | Both |
| Error reporting | ⚠️ Basic | ⚠️ Basic | ❌ | ⚠️ Basic | ⚠️ Basic | ✅ Good | ✅ Excellent |
| **Type System** |
| TypeScript types | ❌ | ❌ | ✅ | N/A | N/A | N/A | ✅ Full |
| Type guards | ❌ | ❌ | ❌ | N/A | N/A | N/A | ✅ |
| Generic constraints | ❌ | ❌ | ❌ | N/A | N/A | N/A | ✅ |
| **Date Operations** |
| Min/max calculation | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Comparison | ✅ | ❌ | ❌ | ⚠️ Basic | ✅ | ❌ | ✅ Enhanced |
| Iteration | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Range operations | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Uncertainty Handling** |
| Bitmask tracking | ✅ | N/A | ❌ | ✅ | ✅ | ❌ | ✅ Enhanced |
| Component-level queries | ✅ | N/A | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Conversion** |
| To JavaScript Date | ✅ | ❌ | ✅ | N/A | N/A | ❌ | ✅ |
| To Temporal API | ❌ | ❌ | ❌ | N/A | N/A | ❌ | ✅ |
| From natural language | ❌ | ✅ Good | ⚠️ Basic | ✅ Good | ❌ | ❌ | ✅ Excellent |
| **Rendering** |
| To EDTF string | ✅ | ✅ Output | ✅ | ✅ | ✅ | ❌ | ✅ |
| Normalization | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Human-readable | ❌ | ❌ | ❌ | ✅ Basic | ✅ via gem | ❌ | ✅ Excellent |
| Localization | ❌ | ✅ EN, FR | ❌ | ❌ | ❌ | ❌ | ✅ Multi-locale |
| **Validation** |
| Syntax validation | ✅ | ⚠️ Implicit | ⚠️ Basic | ✅ | ✅ | ✅ Excellent | ✅ |
| Semantic validation | ⚠️ Partial | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Level conformance | ✅ | ⚠️ Partial | ❌ | ✅ | ✅ | ✅ | ✅ |
| Custom constraints | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Developer Experience** |
| Documentation | ⚠️ Fair | ⚠️ Fair | ⚠️ Poor | ✅ Good | ✅ Good | ✅ Good | ✅ Excellent |
| Examples | ⚠️ Few | ✅ Many | ⚠️ Few | ✅ Many | ✅ Many | ✅ Some | ✅ Comprehensive |
| IDE support | ❌ | ❌ | ⚠️ Basic | N/A | N/A | N/A | ✅ Full |
| Testing utilities | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Active maintenance | ✅ Recent | ❌ 2016 | ⚠️ 2023 | ✅ Active | ✅ Active | ✅ Active | ✅ |
| **Integration** |
| Framework agnostic | ✅ | ✅ | ✅ | N/A | ❌ (Rails) | ✅ | ✅ |
| Tree-shakeable | ⚠️ Partial | ❌ | ❌ | N/A | N/A | N/A | ✅ |
| Bundle size | ~180KB | Unknown | Unknown | N/A | N/A | N/A | <50KB core |
| Zero dependencies | ❌ | ❌ (PEG) | ❌ | N/A | ❌ | N/A | ✅ Core |

---

## 4. Key Insights from edtfy

### 4.1 The Missing Piece in JavaScript Ecosystem

**edtfy** represents a unique and valuable approach that hasn't been replicated in modern JavaScript:

1. **Inverse Problem:** While most tools parse EDTF strings into structured data, edtfy solves the inverse: converting natural language TO EDTF format
2. **Proven UX Pattern:** Demonstrates that users prefer typing "circa 1950" over "1950~"
3. **Locale-First Architecture:** Built internationalization from the ground up, not as an afterthought
4. **Real-World Validation:** Has a working demo interface showing practical usability

### 4.2 What Works Well in edtfy

**Architecture Decisions:**
- **PEG.js Grammar:** Maintainable, declarable parsing rules
- **Locale Files:** JSON-based translation system is simple and extensible
- **Pattern Matching:** Regular expression patterns for date formats
- **Flexible Input:** Handles various natural language formulations

**User Experience:**
- **Forgiving Parser:** Accepts common date formats (02/03/1988, december 1988)
- **Natural Qualifiers:** Understands "around", "circa", "about", "or", "and"
- **Interval Support:** "from 1964 to 2008" feels natural to type
- **Set Expressions:** "1667 or 1668 or 1670" is intuitive

### 4.3 Critical Limitations

**Technical Debt:**
1. **Outdated Specification:** Uses 2012 EDTF draft with 'u' instead of 'X'
2. **Incomplete Coverage:** Missing many Level 2 features
3. **No Maintenance:** Last update 2016, abandoned project
4. **Deprecated Dependencies:** Uses old PEG.js (now Peggy)
5. **No TypeScript:** Pure JavaScript without types

**Functional Gaps:**
1. **No Reverse Conversion:** Cannot convert EDTF back to natural language
2. **Limited Locales:** Only EN and FR
3. **No Confidence Scoring:** Doesn't indicate ambiguity
4. **No Alternative Suggestions:** Ambiguous dates (02/03/1988) don't show alternatives
5. **No Validation:** Doesn't validate impossible dates

### 4.4 Lessons for Modern Implementation

**What to Adopt:**
- ✅ PEG-based parsing (upgrade to Peggy)
- ✅ Locale file architecture
- ✅ Pattern categories (qualifiers, intervals, sets)
- ✅ Flexible input acceptance

**What to Improve:**
- 🔄 Update to EDTF 2019 specification
- 🔄 Add TypeScript from ground up
- 🔄 Expand locale support (ES, DE, IT, PT, ZH, JA, AR)
- 🔄 Add bidirectional conversion (EDTF ↔ NL)
- 🔄 Implement confidence scoring
- 🔄 Provide alternative interpretations
- 🔄 Add semantic validation
- 🔄 Modern build tools and tree-shaking

**What to Add:**
- ➕ Full Level 2 support
- ➕ Ambiguity resolution
- ➕ Context-aware parsing
- ➕ Integration with EDTF parser (edtf.js successor)
- ➕ React components for date input
- ➕ Accessibility features

### 4.5 Market Opportunity

edtfy proves there's demand for natural language date input, but:
- **No modern alternative exists**
- **No TypeScript-native solution**
- **No maintained JS library** for this use case
- **No bidirectional tool** (NL ↔ EDTF)

A comprehensive TypeScript module that combines:
- edtfy's natural language parsing approach
- edtf.js's complete EDTF implementation
- edtf-humanize's human-readable formatting
- Modern tooling and developer experience

Would fill a significant gap in the ecosystem.

---

## 5. Critical Gaps and Opportunities

### 4.1 Type Safety and Developer Experience
**Current State:** No library provides comprehensive TypeScript types
**Opportunity:**
- Full TypeScript implementation with strict typing
- Branded types for different EDTF levels
- Type guards for runtime type checking
- Generic constraints for operations
- IntelliSense-friendly API design

### 4.2 Natural Language Processing
**Current State:** Limited or non-existent in JS ecosystem, except for edtfy (2016, unmaintained)

**Insights from edtfy:**
- **Proven Pattern:** PEG.js grammar successfully handles NL → EDTF conversion
- **Locale Architecture:** Extensible locale system with translation files works well
- **Bidirectional Gap:** No tool handles both NL → EDTF AND EDTF → Human readable
- **Modernization Need:** Uses deprecated spec (2012) with 'u' instead of 'X'
- **Limited Coverage:** Only EN and FR; lacks other major languages

**Opportunity:**
- Modernize edtfy's approach with current EDTF spec
- Comprehensive NLP for English date expressions
- Multi-language support framework (ES, DE, IT, PT, ZH, JA, AR)
- Fuzzy matching and suggestions
- Context-aware parsing (cultural/regional conventions)
- **Bidirectional conversion:** Both NL → EDTF and EDTF → NL
- Confidence scoring for ambiguous inputs
- Alternative interpretation suggestions

### 4.3 Human-Readable Formatting
**Current State:** Only Ruby has dedicated humanization
**Opportunity:**
- Flexible formatting with templates
- Localization (i18n) support
- Context-aware rendering (full vs. abbreviated)
- Accessibility considerations

### 4.4 Modern JavaScript Features
**Current State:** Limited use of modern APIs
**Opportunity:**
- Temporal API integration (TC39 proposal)
- Web Worker support
- Streaming parser
- Progressive enhancement

### 4.5 Validation and Error Handling
**Current State:** Basic error reporting
**Opportunity:**
- Detailed validation error messages
- Suggestions for fixing invalid dates
- Schema-based validation
- Custom validation rules

### 4.6 Testing and Quality Assurance
**Current State:** Limited testing utilities
**Opportunity:**
- Test data generators
- Snapshot testing helpers
- Property-based testing support
- Mutation testing for edge cases

---

## 9. Specification for Comprehensive TypeScript Module

### 9.1 Project Overview

**Name:** `@edtf/core` (monorepo with specialized packages)  
**License:** MIT or Apache-2.0  
**Language:** TypeScript 5.0+  
**Target:** ES2020+, Node.js 18+, Modern browsers

### 9.2 Architecture

#### **5.2.1 Monorepo Structure**
```
packages/
├── core/              # @edtf/core - Core parsing and data structures
├── temporal/          # @edtf/temporal - Temporal API integration
├── natural/           # @edtf/natural - Natural language processing
├── format/            # @edtf/format - Human-readable formatting
├── validate/          # @edtf/validate - Validation utilities
├── compare/           # @edtf/compare - Comparison and sorting
├── testing/           # @edtf/testing - Testing utilities
└── react/             # @edtf/react - React components and hooks
```

#### **5.2.2 Core Module Design**

**Base Type System:**
```typescript
// Branded types for compile-time safety
type EDTFString<Level extends 0 | 1 | 2 = 0 | 1 | 2> = string & {
  __brand: 'EDTFString';
  __level: Level;
};

// Component precision
type Precision = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

// Uncertainty tracking
interface UncertaintyMask {
  year: boolean;
  month: boolean;
  day: boolean;
  hour: boolean;
  minute: boolean;
  second: boolean;
}

// Base date components
interface DateComponents {
  year: number | null;
  month: number | null;
  day: number | null;
  hour: number | null;
  minute: number | null;
  second: number | null;
  timezone: string | null;
}

// Abstract base for all EDTF types
abstract class EDTFBase {
  abstract readonly level: 0 | 1 | 2;
  abstract readonly type: EDTFType;
  abstract readonly edtf: string;
  abstract readonly min: Date;
  abstract readonly max: Date;
  abstract readonly precision: Precision;
  
  abstract toJSON(): object;
  abstract toString(): string;
  abstract equals(other: EDTFBase): boolean;
}
```

**Specific Type Classes:**
```typescript
class EDTFDate extends EDTFBase {
  readonly type = 'Date';
  readonly components: DateComponents;
  readonly uncertain: UncertaintyMask;
  readonly approximate: UncertaintyMask;
  readonly unspecified: UncertaintyMask;
  
  // Comparison methods
  isBefore(other: EDTFDate | Date): boolean;
  isAfter(other: EDTFDate | Date): boolean;
  covers(other: EDTFDate): boolean;
  overlaps(other: EDTFDate): boolean;
  
  // Conversion methods
  toDate(): Date;
  toTemporalPlainDate(): Temporal.PlainDate;
  toTemporalPlainDateTime(): Temporal.PlainDateTime;
  toISOString(): string;
  
  // Iteration
  *[Symbol.iterator](): Generator<EDTFDate>;
}

class EDTFInterval extends EDTFBase {
  readonly type = 'Interval';
  readonly start: EDTFDate | null;  // null for open/unknown
  readonly end: EDTFDate | null;
  readonly isOpenStart: boolean;
  readonly isOpenEnd: boolean;
  readonly isUnknownStart: boolean;
  readonly isUnknownEnd: boolean;
  
  // Interval operations
  contains(date: EDTFDate): boolean;
  overlaps(other: EDTFInterval): boolean;
  duration(): Duration;
  
  // Iteration
  *by(unit: Precision): Generator<EDTFDate>;
  *[Symbol.iterator](): Generator<EDTFDate>;
}

class EDTFSet extends EDTFBase {
  readonly type = 'Set';
  readonly choice: 'one' | 'all';
  readonly members: Array<EDTFDate | EDTFInterval>;
  
  // Set operations
  includes(date: EDTFDate): boolean;
  union(other: EDTFSet): EDTFSet;
  intersection(other: EDTFSet): EDTFSet;
}

class EDTFSeason extends EDTFBase {
  readonly type = 'Season';
  readonly year: number;
  readonly season: SeasonCode;
  readonly hemisphere?: 'northern' | 'southern';
  
  // Season utilities
  toMonthRange(): { start: number; end: number };
}

// Specialized types for Level 2
class EDTFExponential extends EDTFBase {
  readonly base: number;
  readonly exponent: number;
  readonly significantDigits?: number;
}
```

#### **5.2.3 Parser Architecture**

**Parser Interface:**
```typescript
interface ParserOptions {
  level?: 0 | 1 | 2;
  strict?: boolean;
  allowExperimental?: boolean;
  customValidation?: ValidationRule[];
}

interface ParseResult<T extends EDTFBase = EDTFBase> {
  success: true;
  value: T;
  level: 0 | 1 | 2;
} | {
  success: false;
  errors: ParseError[];
  suggestions?: string[];
}

interface ParseError {
  code: string;
  message: string;
  position: { start: number; end: number };
  severity: 'error' | 'warning';
}

// Main parser function
function parse(input: string, options?: ParserOptions): ParseResult;

// Type-specific parsers
function parseDate(input: string): ParseResult<EDTFDate>;
function parseInterval(input: string): ParseResult<EDTFInterval>;
function parseSeason(input: string): ParseResult<EDTFSeason>;

// Type guards
function isEDTFDate(value: EDTFBase): value is EDTFDate;
function isEDTFInterval(value: EDTFBase): value is EDTFInterval;
```

**Parser Implementation Strategy:**
- **Option A:** PEG parser generator (e.g., Peggy/Pegjs successor)
  - Pros: Maintainable grammar, good error messages
  - Cons: Larger bundle size
  
- **Option B:** Hand-written recursive descent parser
  - Pros: Smaller bundle, full control
  - Cons: More complex maintenance
  
- **Recommendation:** Start with PEG, optimize later with hand-written parser for production

#### **5.2.4 Natural Language Module (@edtf/natural)**

**Design Philosophy:**
Based on proven patterns from edtfy, but modernized and extended:
- PEG-based grammar for maintainability
- Locale-based translation system
- Bidirectional conversion (NL ↔ EDTF)
- Current EDTF spec (2019) compliance

```typescript
interface NaturalLanguageOptions {
  locale?: string;
  timezone?: string;
  era?: 'CE' | 'BCE';
  centuryWindow?: number;  // For 2-digit year interpretation
  impliedPrecision?: Precision;
  returnAlternatives?: boolean;  // Return multiple interpretations
}

interface NLParseResult {
  edtf: string;
  confidence: number;  // 0-1
  interpretation: string;  // Human-readable explanation
  alternatives?: Array<{
    edtf: string;
    confidence: number;
    interpretation: string;
  }>;
}

// Natural language parser (NL → EDTF)
function parseNatural(
  input: string,
  options?: NaturalLanguageOptions
): NLParseResult;

// Reverse: EDTF → Natural language (inspired by edtf-humanize)
function toNatural(
  edtf: string | EDTFBase,
  options?: FormatOptions
): string;

// Locale management (inspired by edtfy)
function setLocale(locale: string): void;
function getLocale(): string;
function getSupportedLocales(): string[];
```

**Locale System Architecture (from edtfy):**
```typescript
// Locale definition structure
interface LocaleDefinition {
  code: string;  // e.g., 'en', 'fr', 'es'
  name: string;  // e.g., 'English', 'Français'
  
  // Date component names
  months: {
    full: string[];      // January, February...
    abbreviated: string[]; // Jan, Feb...
  };
  
  seasons: {
    spring: string[];   // Spring, Printemps...
    summer: string[];
    autumn: string[];
    winter: string[];
  };
  
  // Temporal qualifiers
  qualifiers: {
    uncertain: string[];     // ?, uncertain, possibly...
    approximate: string[];   // ~, circa, about, around...
    before: string[];        // before, earlier than, prior to...
    after: string[];         // after, later than, following...
  };
  
  // Interval connectors
  intervals: {
    to: string[];           // to, until, through...
    from: string[];         // from, since...
  };
  
  // Set operators
  sets: {
    or: string[];           // or, alternatively...
    and: string[];          // and, plus...
  };
  
  // Date format patterns
  patterns: {
    dayMonthYear: RegExp[];
    monthDayYear: RegExp[];
    yearMonthDay: RegExp[];
    // ... more patterns
  };
}
```

**Supported Pattern Categories (expanded from edtfy):**

1. **Temporal qualifiers:**
   ```typescript
   // EN: circa, about, approximately, around, roughly, c., ca.
   // FR: vers, environ, circa
   // ES: circa, alrededor de, aproximadamente
   "circa 1950" → "1950~"
   "vers 1950" → "1950~"  // French
   ```

2. **Uncertainty markers:**
   ```typescript
   // EN: possibly, maybe, probably, likely, perhaps, uncertain
   // FR: peut-être, probablement, incertain
   "possibly 1984" → "1984?"
   "peut-être 1984" → "1984?"  // French
   ```

3. **Relative qualifiers:**
   ```typescript
   // EN: early, late, mid, beginning of, end of
   // FR: début, fin, milieu
   "early 1800s" → "180X"
   "late December 1941" → "1941-12-2X"
   "début des années 1800" → "180X"  // French
   ```

4. **Ranges and intervals:**
   ```typescript
   // EN: between...and, from...to, through, until
   // FR: entre...et, de...à, jusqu'à
   "between 1940 and 1945" → "1940/1945"
   "from June to August 2004" → "2004-06/2004-08"
   "de 1964 à 2008" → "1964/2008"  // French
   ```

5. **Seasons:**
   ```typescript
   // EN: spring, summer, fall, autumn, winter
   // FR: printemps, été, automne, hiver
   "spring 2020" → "2020-21"
   "printemps 2020" → "2020-21"  // French
   ```

6. **Decades and centuries:**
   ```typescript
   // EN: 1960s, 60s, nineteenth century, 19th c.
   // FR: années 1960, XIXe siècle
   "1960s" → "196X"
   "nineteenth century" → "18XX"
   "années 1960" → "196X"  // French
   ```

7. **Before/after expressions:**
   ```typescript
   // EN: before, after, earlier than, later than
   // FR: avant, après
   "before 1930" → "[..,1930]"
   "after march 2004" → "[2004-03,..]"
   "avant 1930" → "[..,1930]"  // French
   ```

8. **Multiple date expressions:**
   ```typescript
   // EN: or, and
   // FR: ou, et
   "1960s or 1970s" → "[196X,197X]"
   "1667 and 1668" → "{1667,1668}"
   "années 1960 ou 1970" → "[196X,197X]"  // French
   ```

9. **Unspecified components:**
   ```typescript
   // EN: some day in, some month in, unknown
   // FR: un jour en, un mois en
   "some day in January 1872" → "1872-01-XX"
   "un jour en janvier 1872" → "1872-01-XX"  // French
   ```

**Grammar Implementation Strategy:**
```typescript
// Modern Peggy (successor to PEG.js) grammar
// Example rule structure:
`
Date = 
  / QualifiedDate
  / SimpleDate
  / RelativeDate
  
QualifiedDate = 
  / UncertainDate
  / ApproximateDate
  / UncertainApproximate
  
UncertainDate = 
  Qualifier:uncertain _ date:SimpleDate {
    return { ...date, uncertain: true }
  }

Qualifier:uncertain = 
  / "possibly"i / "maybe"i / "uncertain"i / "?"
  
// Locale-specific expansion
Qualifier:uncertain:fr = 
  / "peut-être"i / "probablement"i / "incertain"i
`
```

**Bidirectional Examples:**
```typescript
// NL → EDTF (inspired by edtfy)
parseNatural("circa August 1979", { locale: 'en' })
// → { edtf: '1979-08~', confidence: 0.95, interpretation: 'Approximately August 1979' }

// EDTF → NL (new capability)
toNatural('1979-08~', { locale: 'en', style: 'full' })
// → "approximately August 1979"

toNatural('1979-08~', { locale: 'fr', style: 'full' })
// → "vers août 1979"

// Ambiguous input with alternatives
parseNatural("02/03/1988", { 
  locale: 'en',
  returnAlternatives: true 
})
// → {
//   edtf: '1988-02-03',  // Default: MM/DD/YYYY for 'en'
//   confidence: 0.7,
//   alternatives: [
//     { edtf: '1988-03-02', confidence: 0.3 }  // DD/MM/YYYY interpretation
//   ]
// }
```

#### **5.2.5 Formatting Module (@edtf/format)**

```typescript
interface FormatOptions {
  locale?: string;
  style?: 'full' | 'long' | 'medium' | 'short' | 'iso';
  showUncertainty?: boolean;
  uncertaintyStyle?: 'symbol' | 'text' | 'both';
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle'];
  timeStyle?: Intl.DateTimeFormatOptions['timeStyle'];
  calendar?: string;
}

interface FormatTemplate {
  pattern: string;
  locale?: string;
}

class EDTFFormatter {
  constructor(locale?: string);
  
  // Format to human-readable string
  format(edtf: EDTFBase, options?: FormatOptions): string;
  
  // Custom template formatting
  formatTemplate(edtf: EDTFBase, template: FormatTemplate): string;
  
  // Localized formatting
  formatLocale(edtf: EDTFBase, locale: string): string;
}

// Examples of expected output:
// '1950~' -> "circa 1950"
// '1940/1945' -> "1940 to 1945"
// '2020-21' -> "Spring 2020"
// '196X' -> "1960s"
// '1984?' -> "1984 (uncertain)"
// '[1981, 1982-~04, 1983-1987]' -> "1981, approximately April 1982, or between 1983 and 1987"
```

#### **5.2.6 Validation Module (@edtf/validate)**

```typescript
interface ValidationOptions {
  level?: 0 | 1 | 2;
  allowExperimental?: boolean;
  semanticChecks?: boolean;  // E.g., validate February 30 doesn't exist
  customRules?: ValidationRule[];
}

interface ValidationResult {
  valid: boolean;
  level?: 0 | 1 | 2;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  message: string;
  position?: { start: number; end: number };
  suggestion?: string;
}

interface ValidationRule {
  name: string;
  test: (edtf: string) => boolean;
  errorMessage: string | ((edtf: string) => string);
}

// Validation functions
function validate(input: string, options?: ValidationOptions): ValidationResult;
function isValid(input: string, level?: 0 | 1 | 2): boolean;
function conformsToLevel(input: string, level: 0 | 1 | 2): boolean;

// Schema-based validation
interface EDTFSchema {
  level?: 0 | 1 | 2;
  types?: EDTFType[];
  minYear?: number;
  maxYear?: number;
  allowUncertain?: boolean;
  allowApproximate?: boolean;
  customRules?: ValidationRule[];
}

function validateSchema(input: string, schema: EDTFSchema): ValidationResult;
```

#### **5.2.7 Comparison Module (@edtf/compare)**

```typescript
type ComparisonResult = -1 | 0 | 1 | null;  // null for incomparable

interface ComparisonOptions {
  precision?: Precision;
  considerUncertainty?: boolean;
}

// Comparison functions
function compare(
  a: EDTFBase,
  b: EDTFBase,
  options?: ComparisonOptions
): ComparisonResult;

function sort(
  dates: EDTFBase[],
  direction?: 'asc' | 'desc',
  options?: ComparisonOptions
): EDTFBase[];

// Range operations
function intersect(a: EDTFInterval, b: EDTFInterval): EDTFInterval | null;
function union(intervals: EDTFInterval[]): EDTFInterval[];
function merge(intervals: EDTFInterval[]): EDTFInterval[];

// Uncertainty-aware comparison
function possiblyBefore(a: EDTFDate, b: EDTFDate): boolean;
function definitelyBefore(a: EDTFDate, b: EDTFDate): boolean;
```

#### **5.2.8 Testing Module (@edtf/testing)**

```typescript
// Test data generators
interface GeneratorOptions {
  level?: 0 | 1 | 2;
  type?: EDTFType;
  count?: number;
  seed?: number;
}

function generateEDTF(options?: GeneratorOptions): string;
function* generateStream(options?: GeneratorOptions): Generator<string>;

// Snapshot testing helpers
function createSnapshot(edtf: EDTFBase): object;
function compareSnapshots(a: object, b: object): boolean;

// Property-based testing
function forAll(
  predicate: (edtf: string) => boolean,
  options?: GeneratorOptions
): boolean;

// Example test fixtures
const fixtures = {
  level0: [...],
  level1: [...],
  level2: [...],
  invalid: [...],
};
```

#### **5.2.9 React Integration (@edtf/react)**

```typescript
// Hooks
function useEDTF(initialValue?: string): {
  edtf: EDTFBase | null;
  parse: (input: string) => void;
  error: Error | null;
  isValid: boolean;
};

function useEDTFFormatter(locale?: string): {
  format: (edtf: EDTFBase, options?: FormatOptions) => string;
};

// Components
interface EDTFInputProps {
  value?: string;
  onChange?: (edtf: string) => void;
  level?: 0 | 1 | 2;
  showValidation?: boolean;
  placeholder?: string;
}

const EDTFInput: React.FC<EDTFInputProps>;

interface EDTFDisplayProps {
  edtf: string | EDTFBase;
  format?: FormatOptions;
  fallback?: React.ReactNode;
}

const EDTFDisplay: React.FC<EDTFDisplayProps>;
```

### 9.3 Implementation Roadmap

#### **Phase 1: Foundation (Months 1-2)** ✅ **COMPLETED**
- [x] Set up monorepo with TypeScript, build tools (pnpm + tsup)
- [x] Implement core type system (EDTFBase, EDTFDate, EDTFDateTime, EDTFInterval)
- [x] Build Level 0 parser (hand-written recursive descent, not PEG)
- [x] Core data structures (Date, Interval with min/max getters)
- [x] Basic validation (semantic checks for invalid dates)
- [x] Comprehensive test suite for Level 0 (45 tests passing)

**Deliverable:** `@edtf/core@0.1.0` with Level 0 support ✅

#### **Phase 2: Extended Features (Months 3-4)** ✅ **COMPLETED**
- [x] Level 1 parser implementation (uncertainty, approximation, unspecified, extended years, seasons, extended intervals)
- [x] Level 2 parser implementation (sets, lists, exponential years, significant digits, extended seasons)
- [x] Uncertainty/approximate/unspecified tracking (Qualification interface, UnspecifiedDigits interface)
- [x] Season, Set, List implementations (EDTFSeason, EDTFSet, EDTFList with 21-41 season support)
- [x] Min/max range calculation (for dates, seasons, sets, lists with X handling)
- [ ] Iteration support (not yet implemented)

**Deliverable:** `@edtf/core@0.5.0` with full spec support ✅ (117 tests passing - 45 L0 + 48 L1 + 24 L2)

**Notes:**
- Used hand-written parser instead of PEG for smaller bundle size and better control
- Partial qualification (Level 2) marked as NOT_IMPLEMENTED stub
- All tests passing with full build success

#### **Phase 3: Natural Language (Month 5)**
- [ ] Natural language parser framework
- [ ] English pattern library
- [ ] Confidence scoring
- [ ] Multi-interpretation support
- [ ] Integration tests

**Deliverable:** `@edtf/natural@0.1.0`

#### **Phase 4: Formatting & Display (Month 6)**
- [ ] Human-readable formatter
- [ ] Template engine
- [ ] i18n framework
- [ ] Multiple locales (en, es, fr, de initially)
- [ ] Accessibility features

**Deliverable:** `@edtf/format@0.1.0`

#### **Phase 5: Advanced Features (Months 7-8)**
- [ ] Temporal API integration
- [ ] Advanced comparison operations
- [ ] Sorting and range algorithms
- [ ] Testing utilities
- [ ] React components and hooks
- [ ] Documentation site

**Deliverables:**
- `@edtf/temporal@0.1.0`
- `@edtf/compare@0.1.0`
- `@edtf/testing@0.1.0`
- `@edtf/react@0.1.0`

#### **Phase 6: Polish & Performance (Months 9-10)**
- [ ] Bundle size optimization
- [ ] Performance benchmarks
- [ ] Tree-shaking verification
- [ ] Browser compatibility testing
- [ ] Accessibility audit
- [ ] Security audit
- [ ] v1.0.0 preparation

**Deliverable:** All packages at `1.0.0`

### 9.4 Technical Requirements

#### **5.4.1 Build System**
- **Bundler:** Rollup or esbuild
- **Package Manager:** pnpm (for monorepo)
- **Compiler:** TypeScript 5.0+
- **Test Runner:** Vitest
- **Documentation:** TypeDoc + VitePress

#### **5.4.2 Code Quality**
- **Linting:** ESLint with TypeScript rules
- **Formatting:** Prettier
- **Type Checking:** strict mode enabled
- **Coverage Target:** >95% for core
- **Mutation Testing:** Stryker for critical paths

#### **5.4.3 Performance Targets**
- **Parse Time:** <1ms for typical dates
- **Bundle Size:** Core <50KB gzipped
- **Tree-shakeable:** Individual functions
- **Memory:** Minimal allocations for hot paths

#### **5.4.4 Browser Support**
- **Modern Browsers:** Last 2 versions
- **Node.js:** 18.x LTS, 20.x LTS, latest
- **TypeScript:** 5.0+
- **No polyfills required** for target environment

#### **5.4.5 Dependencies**
- **Core:** Zero dependencies (self-contained)
- **Natural:** Minimal NLP utilities (consider lightweight alternatives)
- **Format:** Intl API (built-in)
- **React:** React 18+ (peer dependency)
- **Temporal:** @js-temporal/polyfill (peer/optional)

### 9.5 Documentation Structure

```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── concepts.md
├── guides/
│   ├── parsing.md
│   ├── formatting.md
│   ├── validation.md
│   ├── natural-language.md
│   ├── comparison.md
│   └── migration.md (from edtf.js)
├── api/
│   ├── core/
│   ├── natural/
│   ├── format/
│   ├── validate/
│   ├── compare/
│   └── react/
├── examples/
│   ├── basic-usage.md
│   ├── advanced-parsing.md
│   ├── uncertainty-handling.md
│   ├── date-ranges.md
│   └── react-integration.md
└── reference/
    ├── edtf-specification.md
    ├── type-system.md
    ├── error-codes.md
    └── changelog.md
```

### 9.6 Testing Strategy

#### **Unit Tests**
- Each function has corresponding test
- Edge cases explicitly tested
- Property-based testing for parsers
- Snapshot tests for complex objects

#### **Integration Tests**
- End-to-end parsing workflows
- Cross-module interactions
- Real-world EDTF examples from cultural heritage

#### **Compliance Tests**
- Official EDTF specification examples
- Level conformance verification
- Regression tests for reported issues

#### **Performance Tests**
- Benchmarks vs. edtf.js
- Large dataset parsing
- Memory leak detection

#### **Browser Tests**
- Playwright for E2E
- Multiple browser engines
- Mobile testing

### 9.7 Success Metrics

#### **Adoption Metrics**
- NPM downloads: Target 10,000/month by Year 1
- GitHub stars: Target 500 by Year 1
- Dependent packages: Target 50 by Year 1

#### **Quality Metrics**
- Test coverage: >95%
- Type coverage: 100%
- Zero critical vulnerabilities
- Documentation coverage: 100% of public API

#### **Performance Metrics**
- Faster parsing than edtf.js
- Smaller bundle than edtf.js
- Better tree-shaking than edtf.js

#### **Community Metrics**
- Active issue response: <48 hours
- PR review time: <7 days
- Monthly releases with improvements

---

## 9. Competitive Advantages

### 9.1 vs. edtf.js
**Advantages:**
1. ✅ Full TypeScript with complete type safety
2. ✅ Natural language parsing built-in
3. ✅ Human-readable formatting with i18n
4. ✅ Better error messages and suggestions
5. ✅ Smaller bundle size (tree-shakeable)
6. ✅ Modern JavaScript features (Temporal API)
7. ✅ Comprehensive testing utilities
8. ✅ React integration out of the box

**Migration Path:**
- Compatibility mode for edtf.js users
- Migration guide with examples
- Automated migration tool (codemod)

### 9.2 vs. edtfy
**Advantages:**
1. ✅ **Current EDTF Spec (2019):** Uses 'X' not 'u', all modern features
2. ✅ **Maintained & Active:** Regular updates, security patches, community support
3. ✅ **Complete Level 2:** Full specification coverage
4. ✅ **Bidirectional:** Both NL → EDTF AND EDTF → NL
5. ✅ **More Locales:** Not just EN/FR, but ES, DE, IT, PT, ZH, JA, AR
6. ✅ **TypeScript Native:** Type safety, autocomplete, better DX
7. ✅ **Confidence Scoring:** Indicates ambiguity and uncertainty
8. ✅ **Alternative Suggestions:** Shows multiple interpretations
9. ✅ **Semantic Validation:** Catches impossible dates
10. ✅ **Modern Tooling:** Peggy (not PEG.js), tree-shaking, ESM

**What to Learn from edtfy:**
- ✅ Locale file architecture
- ✅ Pattern-based parsing approach
- ✅ User-friendly input patterns
- ✅ Proven UX patterns for date entry

### 9.3 vs. Python/Ruby Solutions
**Advantages:**
1. ✅ JavaScript/TypeScript ecosystem
2. ✅ Browser and Node.js compatible
3. ✅ Better frontend integration
4. ✅ Type safety for compile-time checks

### 9.4 Unique Features (Not in Any Other Library)
1. **Schema-based validation** for custom business rules
2. **Confidence scoring** for natural language parsing with alternatives
3. **Bidirectional NL ↔ EDTF** conversion (only comprehensive solution)
4. **Accessibility-first** formatting and ARIA support
5. **Temporal API** integration for future-proof date handling
6. **Property-based testing** utilities
7. **React hooks** for modern web development
8. **Multi-locale NL parsing** (8+ languages vs. edtfy's 2)

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Parser complexity | Medium | High | Use proven PEG parser, extensive testing |
| Bundle size bloat | Medium | Medium | Tree-shaking, code splitting, optional features |
| Temporal API changes | Low | Medium | Polyfill support, gradual adoption |
| Browser compatibility | Low | Low | Target modern browsers, clear requirements |
| Performance issues | Low | Medium | Benchmarking from start, optimization phase |

### 9.2 Market Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Low adoption | Medium | High | Strong documentation, examples, community building |
| Competition from edtf.js improvements | Low | Medium | Maintain feature lead, better DX |
| Changing specification | Low | High | Modular design, version support |
| Maintenance burden | Medium | Medium | Good architecture, community contributions |

---

## 9. Conclusion

### 9.1 Summary

The EDTF ecosystem is currently dominated by JavaScript (edtf.js) and Python (edtf2) implementations, with gaps in type safety, natural language processing, and modern tooling integration. A comprehensive TypeScript-first module would fill these gaps while providing superior developer experience.

### 9.2 Key Recommendations

1. **Build TypeScript-first:** Don't just add types to JS—design for TypeScript from the ground up
2. **Prioritize DX:** Focus on error messages, documentation, and tooling
3. **Start modular:** Monorepo structure allows users to install only what they need
4. **Invest in NLP:** Natural language parsing is a major differentiator
5. **Future-proof:** Temporal API integration positions for long-term success
6. **Community-driven:** Open development, clear governance, responsive to feedback

### 9.3 Next Steps

1. Validate market interest (GitHub discussions, surveys)
2. Create technical prototype (Level 0 parser)
3. Establish governance model
4. Begin Phase 1 implementation
5. Build community around project

---

## Appendix A: Example Use Cases

### Cultural Heritage / Museums
```typescript
// Cataloging an artifact with uncertain date
const artifactDate = parse('156X-12-25');
// "December 25, sometime in the 1560s"

format(artifactDate, { style: 'long', showUncertainty: true });
// "December 25, 1560s"
```

### Historical Research
```typescript
// Battle date with approximation
const battleDate = parseNatural('early September 1777');
// Returns: { edtf: '1777-09-0X', confidence: 0.85 }

// Date range for a historical period
const warPeriod = parse('1939-09-01/1945-05-08');
for (const year of warPeriod.by('year')) {
  console.log(year); // Iterate by year
}
```

### Archival Description
```typescript
// Uncertain year, known month
const letter = parse('19XX-04');
validate(letter.edtf, { semanticChecks: true });
// { valid: true, level: 1 }

// Human-readable for catalog display
format(letter, { locale: 'en', style: 'full' });
// "April, 20th century"
```

### Genealogy
```typescript
// Birth record with approximation
const birth = parseNatural('circa 1850');
// { edtf: '1850~' }

// Death range
const death = parse('1920/1925');
if (death.contains(parse('1923'))) {
  // Possible death year
}
```

---

## Appendix B: EDTF Examples by Level

### Level 0 Examples
```
1985-04-12          Complete date
1985-04             Year and month
1985                Year only
2004-06/2006-08     Interval (month precision)
1985-04-12T23:20:30Z  Date and time with UTC
```

### Level 1 Examples
```
Y170000002          Year exceeding 4 digits
2001-21             Season (Spring 2001)
1984?               Uncertain year
2004-06~            Approximate month
2004-06-11%         Uncertain and approximate
201X                Unspecified digit
2004-XX             Unspecified month
1985-04-XX          Unspecified day
1985-04-12/..       Open-end interval
../1985-04-12       Open-start interval
1985-04-12/         Unknown end
/1985-04-12         Unknown start
-1985               Negative year (BCE)
```

### Level 2 Examples
```
Y-17E7              Exponential year
1950S2              Significant digits
2001-29             Spring - Southern Hemisphere
2001-34             Quarter 2
[1667,1668,1670..1672]  One of a set
{1667,1668,1670}    All members of a set
2004-06~-11         Group qualification
?2004-06-~11        Individual component qualification
156X-12-25          Unspecified digit within component
2004-06-~01/2004-06-~20  Interval with qualification
```

---

## Appendix C: References

### Official Specifications
1. Library of Congress EDTF Specification (2019): https://www.loc.gov/standards/datetime/
2. ISO 8601-2:2019 (Date and time — Representations for information interchange — Part 2: Extensions)
3. ISO 8601-1:2019 (Date and time — Representations for information interchange — Part 1: Basic rules)

### Existing Implementations
1. edtf.js: https://github.com/inukshuk/edtf.js
2. edtfy: https://github.com/nicompte/edtfy (NL → EDTF, 2016)
3. edtf-converter: https://github.com/martin-lorenz/edtf-converter  
4. edtf-ruby: https://github.com/inukshuk/edtf-ruby
5. edtf2 (Python): https://pypi.org/project/edtf2/
6. edtf-validate: https://github.com/unt-libraries/edtf-validate
7. edtf-rs (Rust): https://github.com/cormacrelf/edtf-rs
8. edtf-humanize (Ruby): https://github.com/duke-libraries/edtf-humanize

### Research Papers
1. Tarver, H., & Phillips, M. (2013). "Lessons Learned in Implementing the Extended Date/Time Format in a Large Digital Library"
2. Zavalina, O. L., Phillips, M. E., & Tarver, H. S. (2015). "Extended Date/Time Format (EDTF) in the Digital Public Library of America's Metadata: Exploratory Analysis"

### Tools and Services
1. UNT EDTF Validation Service: https://digital2.library.unt.edu/edtf/
2. EDTF Ontology: https://periodo.github.io/edtf-ontology/

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025
