# Grammar Refactoring Plan: Natural Language to EDTF Parser

## Executive Summary

This plan outlines a comprehensive refactoring of `packages/natural/src/grammar.ne` to eliminate the combinatorial explosion that has made the grammar unmaintainable. The current grammar has **328+ alternatives across 44 rules** generating **2,096 lines** of compiled output. We will reduce this to approximately **60-80 alternatives across 25-30 rules** using composition over enumeration, while preserving all 600+ test cases.

---

## Phase 1: Infrastructure Setup

### 1.1 Install and Configure Moo Lexer

**Goal**: Replace character-level parsing with token-level parsing.

**Actions**:
1. Add `moo` as a dependency to `packages/natural`
2. Create `src/lexer.ts` with token definitions
3. Update `grammar.ne` to use `@lexer lexer`

**Token Categories**:
```javascript
const lexer = moo.compile({
  // Whitespace (ignored by default in rules)
  ws: { match: /\s+/, lineBreaks: true },

  // Numbers
  number: /[0-9]+/,

  // Ordinal suffixes
  ordinalSuffix: /(?:st|nd|rd|th)\b/i,

  // Keywords (matched before generic words)
  // Temporal modifiers
  early: /early\b/i,
  mid: /mid(?:dle)?\b/i,
  late: /late\b/i,

  // Interval connectors
  from: /from\b/i,
  to: /to\b/i,
  through: /through\b/i,
  until: /until\b/i,
  between: /between\b/i,
  and: /and\b/i,
  or: /or\b/i,

  // Open interval markers
  before: /before\b/i,
  after: /after\b/i,
  since: /since\b/i,
  onwards: /onwards?\b/i,

  // Qualifiers
  circa: /circa\.?\b|c\.?\b|ca\.?\b/i,
  about: /about\b|around\b|approximately\b|approx\.?\b|near\b/i,
  possibly: /possibly\b|maybe\b|perhaps\b|probably\b/i,
  uncertain: /uncertain\b/i,
  approximate: /approximate\b/i,

  // Articles
  the: /the\b/i,
  a: /an?\b/i,
  of: /of\b/i,
  in: /in\b/i,

  // Era markers
  bc: /b\.?c\.?e?\.?\b|before\s+(?:christ|common\s+era)\b/i,
  ad: /a\.?d\.?\b|c\.?e\.?\b|anno\s+domini\b|common\s+era\b/i,

  // Seasons
  spring: /spring\b/i,
  summer: /summer\b/i,
  autumn: /autumn\b|fall\b/i,
  winter: /winter\b/i,

  // Hemispheres
  northern: /northern\s+hemisphere\b|nh\b/i,
  southern: /southern\s+hemisphere\b|sh\b/i,

  // Divisions
  quarter: /q(?:uarter)?\b/i,
  quadrimester: /quadrimester\b/i,
  semester: /semestral?\b/i,

  // Century/decade indicators
  century: /century\b|c\.\b/i,

  // Unspecified markers
  sometime: /sometime\b/i,
  some: /some\b/i,
  unknown: /unknown\b/i,

  // Set/list markers
  either: /either\b/i,
  both: /both\b/i,
  oneOf: /one\s+of:?\b/i,
  allOf: /all\s+of:?\b/i,

  // Age/birthday
  born: /born\b|b\.\b|dob:?\b/i,
  age: /age\b/i,
  yo: /y\.?o\.?\b|years?\s+old\b/i,
  birthday: /birthday\b/i,

  // Symbols
  dash: /-/,
  slash: /\//,
  comma: /,/,
  colon: /:/,
  questionMark: /\?/,
  tilde: /[~≈]/,
  percent: /%/,
  apostrophe: /['']/,
  lparen: /\(/,
  rparen: /\)/,
  lbracket: /\[/,
  rbracket: /\]/,
  lbrace: /\{/,
  rbrace: /\}/,
  dot: /\.\./,  // For open intervals

  // Generic word (must be last)
  word: /[a-zA-Z]+/,
});
```

**Why This Helps**:
- Currently `"e" "a" "r" "l" "y"` becomes a single `%early` token
- Whitespace handling is automatic
- Keywords are matched before generic words, reducing ambiguity
- Faster parsing (fewer parse states)

---

### 1.2 Extract Helper Functions to Separate Module

**Goal**: Decouple business logic from grammar, making both testable independently.

**Actions**:
1. Create `src/helpers/index.ts` - main export
2. Create `src/helpers/modifiers.ts` - temporal modifier interval builders
3. Create `src/helpers/qualifiers.ts` - qualifier application logic
4. Create `src/helpers/dates.ts` - date formatting and validation
5. Create `src/helpers/intervals.ts` - interval manipulation

**Module Structure**:

```typescript
// src/helpers/modifiers.ts
export interface TemporalEntity {
  type: 'date' | 'interval' | 'set' | 'list' | 'season';
  granularity: 'day' | 'month' | 'year' | 'decade' | 'century';
  edtf: string;
  value?: number;
  year?: number;
  month?: number;
  day?: number;
}

export type Precision = 'early' | 'mid' | 'late' | 'early-to-mid' | 'mid-to-late';

export function applyPrecision(entity: TemporalEntity, precision: Precision): TemporalEntity;
export function buildMonthModifierInterval(year: number, month: number, precision: Precision): string;
export function buildYearModifierInterval(year: number, precision: Precision): string;
export function buildDecadeModifierInterval(decadeStart: number, precision: Precision): string;
export function buildCenturyModifierInterval(centuryNum: number, precision: Precision, isBCE?: boolean): string;
```

```typescript
// src/helpers/qualifiers.ts
export type Qualifier = '?' | '~' | '%';

export function applyQualifier(entity: TemporalEntity, qualifier: Qualifier): TemporalEntity;
export function applyQualifierToInterval(edtf: string, qualifier: Qualifier): string;
export function normalizeCombinedQualifiers(edtf: string): string;
```

```typescript
// src/helpers/dates.ts
export function pad2(n: number): string;
export function pad4(n: number): string;
export function twoDigitYear(yy: number): number;
export function isLeapYear(year: number): boolean;
export function getDaysInMonth(year: number, month: number): number;
export function bceToBCE(year: number): string;
```

```typescript
// src/helpers/intervals.ts
export function getIntervalStart(edtf: string): string;
export function getIntervalEnd(edtf: string): string;
export function buildInterval(start: string, end: string): string;
```

**Migration Strategy**:
- Keep existing helper functions in grammar during transition
- Import new modules via `@{% ... %}` block
- Remove old functions once all rules use new imports

---

## Phase 2: Core Grammar Restructuring

### 2.1 Define Atomic Components

**Goal**: Create minimal, composable building blocks.

**New Rule Structure**:

```ne
# ===========================================
# PRIMITIVES (Atomic tokens → semantic values)
# ===========================================

# Numbers
number -> %number {% d => parseInt(d[0].value) %}

# Ordinal numbers: "1st", "2nd", "3rd", "12th", "first", "second"
ordinal ->
    %number %ordinalSuffix {% d => parseInt(d[0].value) %}
  | spelled_ordinal       {% id %}

spelled_ordinal ->
    "first"i      {% () => 1 %}
  | "second"i     {% () => 2 %}
  | "third"i      {% () => 3 %}
  # ... etc (same as current but using tokens)

# Month names (returns 1-12)
month_name ->
    "january"i   {% () => 1 %}
  | "jan"i       {% () => 1 %}
  | "february"i  {% () => 2 %}
  | "feb"i       {% () => 2 %}
  # ... all 24 variants

# Decade words (returns decade start year)
spelled_decade ->
    "twenties"i  {% () => 1920 %}
  | "thirties"i  {% () => 1930 %}
  # ... all variants

# Century words (returns century number)
spelled_century ->
    "first"i     {% () => 1 %}
  | "twentieth"i {% () => 20 %}
  # ... all variants
```

### 2.2 Define Component Groups

**Goal**: Create reusable semantic components.

```ne
# ===========================================
# SEMANTIC COMPONENTS
# ===========================================

# Qualifiers (returns '?' | '~' | '%')
qualifier ->
    %questionMark                  {% () => '?' %}
  | %tilde                         {% () => '~' %}
  | %percent                       {% () => '%' %}
  | %circa                         {% () => '~' %}
  | %about                         {% () => '~' %}
  | %possibly                      {% () => '?' %}
  | "uncertain"i                   {% () => '?' %}
  | "approximate"i                 {% () => '~' %}
  | "uncertain/approximate"i       {% () => '%' %}

# Precision modifiers (returns Precision type)
precision ->
    %early                         {% () => 'early' %}
  | %mid                           {% () => 'mid' %}
  | %late                          {% () => 'late' %}
  | "beginning"i                   {% () => 'early' %}
  | "start"i _ "of"i               {% () => 'early' %}
  | "end"i _ "of"i                 {% () => 'late' %}

# Combination modifiers
combination_precision ->
    precision _ %dash:? _ %to:? _ precision
    {% d => `${d[0]}-to-${d[6]}` %}

# Any precision (single or combination)
any_precision ->
    combination_precision {% id %}
  | precision             {% id %}

# Era suffixes (returns multiplier: 1 for AD/CE, -1 for BC/BCE)
era ->
    %bc  {% () => -1 %}
  | %ad  {% () => 1 %}

# Article (optional, ignored in output)
article -> %the | %a

# Whitespace (optional)
_ -> %ws:?

# Required whitespace
__ -> %ws
```

### 2.3 Define Core Date Types

**Goal**: Create granularity-aware date objects.

```ne
# ===========================================
# CORE DATE TYPES (Granularity-tagged)
# ===========================================

# Year only: "1990", "768"
year_only -> number {% d => ({
  type: 'date',
  granularity: 'year',
  value: d[0],
  edtf: pad4(d[0])
}) %}

# Month + Year: "January 2020", "Jan 2020", "01/2020"
month_year ->
    month_name __ number {% d => ({
      type: 'date',
      granularity: 'month',
      month: d[0],
      year: d[2],
      edtf: `${pad4(d[2])}-${pad2(d[0])}`
    }) %}
  | number %slash number {% d => ({
      type: 'date',
      granularity: 'month',
      month: d[0],
      year: d[2],
      edtf: `${pad4(d[2])}-${pad2(d[0])}`
    }) %}

# Full date: "January 12, 1940", "12 January 1940", "01/12/1940"
full_date ->
    # US format: Month Day, Year
    month_name __ ordinal %comma:? __ number {% d => ({
      type: 'date',
      granularity: 'day',
      month: d[0],
      day: d[2],
      year: d[5],
      edtf: `${pad4(d[5])}-${pad2(d[0])}-${pad2(d[2])}`
    }) %}
  | # EU format: Day Month Year
    ordinal __ month_name __ number {% d => ({
      type: 'date',
      granularity: 'day',
      day: d[0],
      month: d[2],
      year: d[4],
      edtf: `${pad4(d[4])}-${pad2(d[2])}-${pad2(d[0])}`
    }) %}
  | # Formal: "the 12th of January, 1940"
    article:? _ ordinal __ %of __ month_name %comma:? __ number {% d => ({
      type: 'date',
      granularity: 'day',
      day: d[2],
      month: d[6],
      year: d[9],
      edtf: `${pad4(d[9])}-${pad2(d[6])}-${pad2(d[2])}`
    }) %}
  | # Numeric: "01/12/1940" (ambiguous, handled in post-processing)
    number %slash number %slash number {% d => buildSlashDate(d[0], d[2], d[4]) %}

# Decade: "1990s", "the sixties", "'60s"
decade ->
    number "s"i {% d => ({
      type: 'date',
      granularity: 'decade',
      value: Math.floor(d[0] / 10) * 10,
      edtf: `${Math.floor(d[0] / 10)}X`
    }) %}
  | %apostrophe:? number "s"i {% d => ({
      type: 'date',
      granularity: 'decade',
      value: twoDigitDecade(d[1]),
      edtf: `${Math.floor(twoDigitDecade(d[1]) / 10)}X`
    }) %}
  | spelled_decade {% d => ({
      type: 'date',
      granularity: 'decade',
      value: d[0],
      edtf: `${Math.floor(d[0] / 10)}X`
    }) %}

# Century: "20th century", "the nineteenth century"
century ->
    ordinal _ %century {% d => ({
      type: 'date',
      granularity: 'century',
      value: d[0],
      edtf: `${pad2(d[0] - 1)}XX`
    }) %}
  | spelled_century _ %century {% d => ({
      type: 'date',
      granularity: 'century',
      value: d[0],
      edtf: `${pad2(d[0] - 1)}XX`
    }) %}

# Any core date type
core_date ->
    full_date  {% id %}
  | month_year {% id %}
  | year_only  {% id %}
  | decade     {% id %}
  | century    {% id %}
```

---

## Phase 3: Composition Engine

### 3.1 Unified Single Date Rule

**The Key Insight**: Instead of 110+ rules for modifier combinations, we have ONE rule that optionally applies modifiers.

```ne
# ===========================================
# COMPOSITION ENGINE
# ===========================================

# A single date: [Qualifier?] [Article?] [Precision?] [CoreDate] [Era?]
single_date ->
    qualifier:? _ article:? _ any_precision:? _ core_date _ era:?
    {% d => {
      let result = d[6]; // The core date object

      // 1. Apply Era (BC/AD) if present
      if (d[8]) {
        result = applyEra(result, d[8]);
      }

      // 2. Apply Precision (early/mid/late) if present
      if (d[4]) {
        result = applyPrecision(result, d[4]);
      }

      // 3. Apply Qualifier (approx/uncertain) if present
      if (d[0]) {
        result = applyQualifier(result, d[0]);
      }

      return result;
    } %}
```

**This single rule replaces**:
- `temporal_modifier` (110+ alternatives)
- `qualified_temporal_modifier` (7+ alternatives)
- `combination_modifier` applications
- All era suffix combinations

### 3.2 Unified Interval Rule

**Goal**: One interval rule that accepts any two endpoints.

```ne
# ===========================================
# INTERVALS
# ===========================================

# Interval connectors
interval_start -> %from | %between
interval_separator -> %to | %through | %until | %and | %dash

# An interval endpoint can be any single_date
endpoint -> single_date {% id %}

# Standard interval: "from X to Y", "X to Y", "between X and Y"
interval ->
    interval_start:? _ endpoint _ interval_separator _ endpoint
    {% d => ({
      type: 'interval',
      start: d[2],
      end: d[6],
      edtf: `${getIntervalStart(d[2].edtf)}/${getIntervalEnd(d[6].edtf)}`
    }) %}

# Open-ended intervals
open_interval ->
    # "before 1930", "prior to 1930", "earlier than 1930"
    (%before | "prior"i _ %to | "earlier"i _ "than"i) _ endpoint
    {% d => ({ type: 'interval', edtf: `../${d[2].edtf}` }) %}

  | # "after 1930", "since 1930", "later than 1930"
    (%after | %since | "later"i _ "than"i) _ endpoint
    {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..` }) %}

  | # "1930 or earlier", "1930 or before"
    endpoint _ %or _ (%before | "earlier"i)
    {% d => ({ type: 'interval', edtf: `../${d[0].edtf}` }) %}

  | # "1930 or later", "1930 and after"
    endpoint _ %or _ (%after | "later"i)
    {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..` }) %}

# Unknown endpoint intervals
unknown_interval ->
    endpoint _ interval_separator _ %unknown
    {% d => ({ type: 'interval', edtf: `${d[0].edtf}/` }) %}
  | %unknown _ interval_separator _ endpoint
    {% d => ({ type: 'interval', edtf: `/${d[4].edtf}` }) %}
  | %questionMark _ interval_separator _ endpoint
    {% d => ({ type: 'interval', edtf: `/${d[4].edtf}` }) %}
```

**This single pattern replaces** the 47+ interval rules by letting `endpoint` be any valid `single_date` (which already includes qualifiers and modifiers).

### 3.3 Unified Season Rule

```ne
# ===========================================
# SEASONS
# ===========================================

season_name ->
    %spring {% () => 21 %}
  | %summer {% () => 22 %}
  | %autumn {% () => 23 %}
  | %winter {% () => 24 %}

hemisphere ->
    %northern {% () => 4 %}  # +4 for northern-specific codes
  | %southern {% () => 8 %}  # +8 for southern-specific codes

# Quarter/Quadrimester/Semester divisions
division ->
    %quarter _ ordinal      {% d => 32 + d[2] %}  # Q1=33, Q2=34, Q3=35, Q4=36
  | ordinal _ %quarter      {% d => 32 + d[0] %}
  | %quadrimester _ ordinal {% d => 36 + d[2] %}  # QD1=37, QD2=38, QD3=39
  | ordinal _ %quadrimester {% d => 36 + d[0] %}
  | %semester _ ordinal     {% d => 39 + d[2] %}  # S1=40, S2=41
  | ordinal _ %semester     {% d => 39 + d[0] %}

# Season with optional hemisphere
season ->
    qualifier:? _ season_name _ %lparen:? hemisphere:? %rparen:? _ number
    {% d => {
      let code = d[2];
      if (d[5]) code += d[5]; // Add hemisphere offset
      let result = { type: 'season', edtf: `${pad4(d[8])}-${code}` };
      if (d[0]) result = applyQualifier(result, d[0]);
      return result;
    } %}
  | qualifier:? _ division _ number
    {% d => {
      let result = { type: 'season', edtf: `${pad4(d[4])}-${d[2]}` };
      if (d[0]) result = applyQualifier(result, d[0]);
      return result;
    } %}
```

### 3.4 Sets and Lists

```ne
# ===========================================
# SETS AND LISTS
# ===========================================

# Set items (one-of)
set_items ->
    endpoint (_ %comma _ endpoint):+ {% d => [d[0], ...d[1].map(x => x[3])] %}

set ->
    # "either X or Y"
    %either _ endpoint _ %or _ endpoint
    {% d => ({ type: 'set', edtf: `[${d[2].edtf},${d[6].edtf}]` }) %}

  | # "X or Y or Z"
    endpoint (_ %or _ endpoint):+
    {% d => {
      const items = [d[0], ...d[1].map(x => x[3])];
      return { type: 'set', edtf: `[${items.map(i => i.edtf).join(',')}]` };
    } %}

  | # "one of: X, Y, Z"
    %oneOf _ set_items
    {% d => ({ type: 'set', edtf: `[${d[2].map(i => i.edtf).join(',')}]` }) %}

# List items (all-of)
list ->
    # "both X and Y"
    %both _ endpoint _ %and _ endpoint
    {% d => ({ type: 'list', edtf: `{${d[2].edtf},${d[6].edtf}}` }) %}

  | # "X and Y and Z"
    endpoint (_ %and _ endpoint):+
    {% d => {
      const items = [d[0], ...d[1].map(x => x[3])];
      return { type: 'list', edtf: `{${items.map(i => i.edtf).join(',')}}` };
    } %}

  | # "all of: X, Y, Z"
    %allOf _ set_items
    {% d => ({ type: 'list', edtf: `{${d[2].map(i => i.edtf).join(',')}]` }) %}
```

---

## Phase 4: Helper Function Implementation

### 4.1 Precision Application Logic

The `applyPrecision` function is the heart of the refactored system. It must handle all granularities uniformly.

```typescript
// src/helpers/modifiers.ts

export function applyPrecision(entity: TemporalEntity, precision: Precision): TemporalEntity {
  switch (entity.granularity) {
    case 'day':
      // Days don't support early/mid/late - return unchanged
      return entity;

    case 'month':
      return applyMonthPrecision(entity, precision);

    case 'year':
      return applyYearPrecision(entity, precision);

    case 'decade':
      return applyDecadePrecision(entity, precision);

    case 'century':
      return applyCenturyPrecision(entity, precision);

    default:
      return entity;
  }
}

function applyMonthPrecision(entity: TemporalEntity, precision: Precision): TemporalEntity {
  const { year, month } = entity;
  const daysInMonth = getDaysInMonth(year, month);

  let start: number, end: number;

  switch (precision) {
    case 'early':
      start = 1; end = 10;
      break;
    case 'mid':
      start = 11; end = 20;
      break;
    case 'late':
      start = 21; end = daysInMonth;
      break;
    case 'early-to-mid':
      start = 1; end = 20;
      break;
    case 'mid-to-late':
      start = 11; end = daysInMonth;
      break;
  }

  return {
    ...entity,
    type: 'interval',
    edtf: `${pad4(year)}-${pad2(month)}-${pad2(start)}/${pad4(year)}-${pad2(month)}-${pad2(end)}`
  };
}

function applyYearPrecision(entity: TemporalEntity, precision: Precision): TemporalEntity {
  const year = entity.value;

  let startMonth: number, endMonth: number;

  switch (precision) {
    case 'early':
      startMonth = 1; endMonth = 4;
      break;
    case 'mid':
      startMonth = 5; endMonth = 8;
      break;
    case 'late':
      startMonth = 9; endMonth = 12;
      break;
    case 'early-to-mid':
      startMonth = 1; endMonth = 8;
      break;
    case 'mid-to-late':
      startMonth = 5; endMonth = 12;
      break;
  }

  return {
    ...entity,
    type: 'interval',
    edtf: `${pad4(year)}-${pad2(startMonth)}/${pad4(year)}-${pad2(endMonth)}`
  };
}

function applyDecadePrecision(entity: TemporalEntity, precision: Precision): TemporalEntity {
  const decadeStart = entity.value; // e.g., 1990

  let startOffset: number, endOffset: number;

  // 4-3-3 split for decades
  switch (precision) {
    case 'early':
      startOffset = 0; endOffset = 3;
      break;
    case 'mid':
      startOffset = 4; endOffset = 6;
      break;
    case 'late':
      startOffset = 7; endOffset = 9;
      break;
    case 'early-to-mid':
      startOffset = 0; endOffset = 6;
      break;
    case 'mid-to-late':
      startOffset = 4; endOffset = 9;
      break;
  }

  return {
    ...entity,
    type: 'interval',
    edtf: `${decadeStart + startOffset}/${decadeStart + endOffset}`
  };
}

function applyCenturyPrecision(entity: TemporalEntity, precision: Precision): TemporalEntity {
  const centuryNum = entity.value; // e.g., 20 for "20th century"
  const centuryStart = (centuryNum - 1) * 100 + 1; // 1901 for 20th century

  let startOffset: number, endOffset: number;

  // 33-33-34 split for centuries
  switch (precision) {
    case 'early':
      startOffset = 0; endOffset = 32;
      break;
    case 'mid':
      startOffset = 33; endOffset = 65;
      break;
    case 'late':
      startOffset = 66; endOffset = 99;
      break;
    case 'early-to-mid':
      startOffset = 0; endOffset = 65;
      break;
    case 'mid-to-late':
      startOffset = 33; endOffset = 99;
      break;
  }

  return {
    ...entity,
    type: 'interval',
    edtf: `${centuryStart + startOffset}/${centuryStart + endOffset}`
  };
}
```

### 4.2 Qualifier Application Logic

```typescript
// src/helpers/qualifiers.ts

export function applyQualifier(entity: TemporalEntity, qualifier: Qualifier): TemporalEntity {
  if (entity.type === 'interval') {
    return {
      ...entity,
      edtf: applyQualifierToInterval(entity.edtf, qualifier)
    };
  }

  return {
    ...entity,
    edtf: entity.edtf + qualifier
  };
}

export function applyQualifierToInterval(edtf: string, qualifier: Qualifier): string {
  const [start, end] = edtf.split('/');

  // Apply qualifier to both endpoints
  const qualifiedStart = start === '..' ? start : start + qualifier;
  const qualifiedEnd = end === '..' ? end : end + qualifier;

  return `${qualifiedStart}/${qualifiedEnd}`;
}
```

### 4.3 Era Application Logic

```typescript
// src/helpers/dates.ts

export function applyEra(entity: TemporalEntity, eraMultiplier: number): TemporalEntity {
  if (eraMultiplier === 1) {
    // AD/CE - no change needed for positive years
    return entity;
  }

  // BC/BCE - convert to negative EDTF format
  // Note: 1 BC = year 0, 2 BC = -0001, etc.
  const year = entity.value || entity.year;
  const negativeYear = -(year - 1);

  return {
    ...entity,
    edtf: entity.edtf.replace(pad4(year), bceToBCE(year))
  };
}

export function bceToBCE(year: number): string {
  // 1 BC = 0000, 2 BC = -0001, 44 BC = -0043
  const negYear = year - 1;
  return negYear === 0 ? '0000' : `-${pad4(negYear)}`;
}
```

---

## Phase 5: Migration Strategy

### 5.1 Parallel Development Approach

**Goal**: Allow incremental migration without breaking existing functionality.

**Steps**:

1. **Create new grammar file**: `src/grammar-v2.ne`
   - Implement new structure incrementally
   - Can coexist with `grammar.ne` during development

2. **Create adapter in parser.ts**:
   ```typescript
   // During migration, try both parsers
   function parseWithBothGrammars(input: string) {
     const v1Results = parseWithGrammarV1(input);
     const v2Results = parseWithGrammarV2(input);

     // Log any differences for debugging
     if (JSON.stringify(v1Results) !== JSON.stringify(v2Results)) {
       console.warn('Grammar mismatch:', { input, v1: v1Results, v2: v2Results });
     }

     return v1Results; // Return v1 until v2 is fully validated
   }
   ```

3. **Run test suite against both grammars**:
   - Ensure v2 passes all 600+ tests before switching
   - Use test output to identify any regressions

4. **Swap grammars once v2 is complete**:
   - Replace `grammar.ne` with contents of `grammar-v2.ne`
   - Remove adapter code
   - Delete v2 file

### 5.2 Test-Driven Migration Order

Migrate rules in this order, running tests after each batch:

1. **Primitives** (lowest risk)
   - `number`, `ordinal`, `month_name`
   - Test: `smoke.test.ts` passes

2. **Core dates** (foundation)
   - `year_only`, `month_year`, `full_date`
   - Test: `complete-dates.test.ts`, `partial-dates.test.ts` pass

3. **Decades and centuries**
   - `decade`, `century`
   - Test: `unspecified.test.ts` passes

4. **Qualifiers**
   - `qualifier`, `applyQualifier`
   - Test: `qualifications.test.ts` passes

5. **Precision modifiers**
   - `precision`, `combination_precision`, `applyPrecision`
   - Test: `temporal-modifiers.test.ts` passes

6. **Single date composition**
   - `single_date` rule
   - Test: All modifier + date combinations work

7. **Intervals**
   - `interval`, `open_interval`, `unknown_interval`
   - Test: `intervals.test.ts`, `interval-improvements.test.ts` pass

8. **Seasons**
   - `season`, `division`
   - Test: `seasons-sets-lists.test.ts` (season portion) passes

9. **Sets and lists**
   - `set`, `list`
   - Test: `seasons-sets-lists.test.ts` (set/list portion) passes

10. **Era handling**
    - Era application across all date types
    - Test: `short-year.test.ts`, era portions of other tests pass

11. **Age/birthday** (if applicable)
    - Special handling for age-based dates
    - Test: `age-birthday.test.ts` passes

12. **Final integration**
    - Full test suite
    - Performance benchmarking

---

## Phase 6: Validation and Cleanup

### 6.1 Performance Benchmarking

**Create benchmark script**: `scripts/benchmark.ts`

```typescript
import { parseNatural } from '../src';

const testInputs = [
  // Simple dates
  '2020', 'January 2020', 'January 12, 1940',

  // Qualified dates
  'circa 1950', 'possibly 1984', '1984?',

  // Temporal modifiers (current pain point)
  'early 1990s', 'mid-to-late 20th century', 'circa early March 2024',

  // Intervals
  'from 1964 to 2008', 'early 1980s to late 1990s',

  // Complex combinations
  'circa early-to-mid 1980s to late 1990s',
];

function benchmark(iterations: number = 1000) {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    for (const input of testInputs) {
      parseNatural(input);
    }
  }

  const elapsed = performance.now() - start;
  console.log(`${iterations * testInputs.length} parses in ${elapsed.toFixed(2)}ms`);
  console.log(`Average: ${(elapsed / (iterations * testInputs.length)).toFixed(4)}ms per parse`);
}

benchmark();
```

**Target Metrics**:
- 50%+ reduction in average parse time for complex inputs
- Compiled grammar size reduced by 60%+
- Grammar source reduced from 1,492 lines to ~400 lines

### 6.2 Documentation Updates

1. Update `CLAUDE.md` with new build instructions if changed
2. Document helper function API in source files
3. Add inline comments explaining composition strategy
4. Create migration guide if external consumers exist

### 6.3 Cleanup Checklist

- [ ] Remove `grammar-v2.ne` (merged into `grammar.ne`)
- [ ] Remove adapter code from `parser.ts`
- [ ] Remove deprecated helper functions
- [ ] Update `grammar-wrapper.ts` if lexer import changes
- [ ] Verify all 600+ tests pass
- [ ] Run performance benchmark
- [ ] Update package.json scripts if needed

---

## Expected Outcomes

### Before (Current State)
- **Grammar rules**: 44 top-level, 328+ alternatives
- **Compiled size**: 2,096 lines (239 KB)
- **Source size**: 1,492 lines
- **Helper functions**: 22, embedded in grammar header
- **Maintenance burden**: High (changes require touching multiple rules)

### After (Target State)
- **Grammar rules**: ~25-30 top-level, ~60-80 alternatives
- **Compiled size**: ~600-800 lines (estimated 60-70% reduction)
- **Source size**: ~300-400 lines
- **Helper functions**: Modular, in separate files, fully testable
- **Maintenance burden**: Low (composition means changes propagate automatically)

### Key Benefits
1. **Extensibility**: Adding a new precision modifier (e.g., "beginning") requires changing ONE rule
2. **Testability**: Helper functions can be unit tested independently
3. **Performance**: Fewer parse states = faster parsing
4. **Readability**: Clear separation between syntax (grammar) and semantics (helpers)
5. **Debugging**: Smaller grammar is easier to trace through

---

## Risk Mitigation

### Risk 1: Lexer Keyword Conflicts
**Issue**: Keywords like "mid" might appear in other contexts
**Mitigation**: Use careful token ordering in Moo (keywords before generic words) and test edge cases

### Risk 2: Ambiguity Increase
**Issue**: More general rules might create parse ambiguities
**Mitigation**: Use Nearley's `@lexer` for automatic whitespace handling; add explicit disambiguation where needed

### Risk 3: Regression in Edge Cases
**Issue**: Some obscure test cases might fail
**Mitigation**: Run full test suite after each migration phase; maintain v1 grammar until v2 is proven

### Risk 4: Performance Regression
**Issue**: New architecture might be slower in some cases
**Mitigation**: Benchmark before and after; the lexer should provide net speedup

---

## Appendix: Rule Reduction Summary

| Category | Current Rules | Target Rules | Reduction |
|----------|--------------|--------------|-----------|
| Temporal Modifiers | 110+ | 3 (composed) | ~97% |
| Intervals | 47+ | 8 | ~83% |
| Date Formats | 80+ | 15 | ~81% |
| Qualifiers | 17 | 5 | ~71% |
| Centuries/Decades | 25+ | 6 | ~76% |
| Seasons | 12+ | 4 | ~67% |
| Sets/Lists | 11 | 4 | ~64% |
| **Total** | **328+** | **~60-80** | **~75-80%** |
