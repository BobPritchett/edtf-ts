# Fork vs. Fresh Start: Strategic Analysis for TypeScript EDTF Module

## Executive Summary

**Recommendation: Start from scratch with TypeScript-first architecture**

While forking edtf.js or edtfy seems faster initially, the architectural requirements for a modern TypeScript module make a fresh start the better long-term choice. We can leverage existing libraries' learnings while avoiding their technical debt.

---

## Available Libraries for Forking

### Option 1: Fork edtf.js (BSD-2-Clause)
**Repository:** https://github.com/inukshuk/edtf.js  
**License:** BSD-2-Clause ✅ (fork-friendly)

#### What You'd Get:
- ✅ Complete Level 0, 1, 2 implementation
- ✅ Extensive test suite (valuable reference)
- ✅ Proven parser (Nearley-based)
- ✅ Battle-tested in production
- ✅ All core EDTF types implemented
- ✅ Bitmask uncertainty tracking

#### Critical Problems:
- ❌ **JavaScript, not TypeScript** - Types would be retrofitted, not native
- ❌ **Monolithic structure** - Single 180KB bundle, not tree-shakeable
- ❌ **Nearley dependency** (~40KB) - Parser generator adds weight
- ❌ **Legacy API design** - Built for JavaScript users, not TypeScript DX
- ❌ **No natural language parsing** - Would need to add entirely new subsystem
- ❌ **Module system** - ESM/CJS dual package added later, not designed-in
- ❌ **Architecture** - Not designed for monorepo/separation of concerns

#### Refactoring Required:
```typescript
// Current edtf.js (JavaScript):
const edtf = require('edtf')
edtf('2016-XX')  // Returns weakly-typed object

// Would need massive refactor to:
import { parseDate } from '@edtf/core'
const result = parseDate('2016-XX')  // Strongly typed EDTFDate
```

**Estimated refactoring effort:** 60-70% of the codebase
- Rewrite in TypeScript with proper types
- Split into monorepo modules
- Replace/optimize parser
- Add natural language system
- Make tree-shakeable

**Time estimate:** 6-8 months of refactoring vs. 8-10 months fresh

### Option 2: Fork edtfy (MIT)
**Repository:** https://github.com/nicompte/edtfy  
**License:** MIT ✅ (fork-friendly)

#### What You'd Get:
- ✅ Natural language parsing patterns
- ✅ Locale file architecture
- ✅ PEG-based parser (good foundation)
- ✅ Proven UX patterns

#### Critical Problems:
- ❌ **2012 EDTF spec** - Uses 'u' instead of 'X', wrong syntax throughout
- ❌ **Incomplete** - Partial Level 1, partial Level 2
- ❌ **Abandoned** - Last update 2016, no maintenance
- ❌ **JavaScript** - No TypeScript
- ❌ **Old PEG.js** - Now deprecated, should use Peggy
- ❌ **No EDTF parsing** - Only does NL→EDTF, not EDTF parsing itself
- ❌ **Limited locales** - Only EN, FR

#### Refactoring Required:
- Rewrite entire parser for EDTF 2019 spec
- Add complete EDTF parser (doesn't exist)
- Convert to TypeScript
- Modernize build system
- Add 6+ more locales
- Add bidirectional conversion

**Estimated refactoring effort:** 80-90% would be new code

**Time estimate:** 7-9 months (almost same as fresh start)

### Option 3: Fork edtf-converter
- Smaller library, limited features
- TypeScript exists but basic
- Depends on Moment.js (deprecated)
- Would need similar level of work as starting fresh

---

## Fresh Start Analysis

### What We'd Build From Scratch:

#### 1. **Parser** (Most Critical Component)

**Decision Point:** Hand-written vs. Grammar-generated

**Option A: Hand-written Recursive Descent Parser**
```typescript
// Full control, smallest bundle, optimized
class EDTFParser {
  parse(input: string): ParseResult {
    // Custom TypeScript implementation
    // ~5KB after minification
  }
}
```

**Pros:**
- Smallest possible bundle size
- Full control over error messages
- No parser generator dependency
- Fastest performance
- Easy to optimize

**Cons:**
- More code to write initially
- Need to handle all edge cases manually
- Harder to maintain complex grammar

**Option B: Peggy-generated Parser**
```typescript
// Grammar file (edtf.peggy)
Date = year:Year "-" month:Month "-" day:Day {
  return { type: 'Date', year, month, day }
}
```

**Pros:**
- Declarative, maintainable grammar
- Good error messages
- Easier to update for spec changes
- Can study edtfy's grammar

**Cons:**
- ~15-20KB additional bundle size
- Less control over generated code
- Build step dependency

**Recommendation:** Start with Peggy for speed, optimize to hand-written later if needed

#### 2. **Type System** (TypeScript-First)

```typescript
// Fresh start allows perfect types from day 1
type EDTFString<Level extends 0 | 1 | 2 = 0 | 1 | 2> = 
  string & { __brand: 'EDTF'; __level: Level };

// Generic-constrained operations
function parseDate<L extends 0 | 1 | 2>(
  input: string,
  options?: { level?: L }
): ParseResult<EDTFDate, L>;

// vs. retrofitted types in edtf.js:
// export function parse(input: string, options?: any): any;
```

**Why this matters:**
- IntelliSense autocomplete works perfectly
- Type errors caught at compile time
- Generic constraints prevent misuse
- Branded types prevent string confusion

#### 3. **Monorepo Architecture**

```
@edtf/
├── core/           # 30KB - Just parsing & types
├── natural/        # 25KB - Natural language (optional)
├── format/         # 15KB - Human formatting (optional)
├── compare/        # 10KB - Comparison utilities (optional)
├── validate/       # 8KB  - Validation (optional)
├── temporal/       # 12KB - Temporal API (optional)
├── react/          # 15KB - React hooks (optional)
└── testing/        # 20KB - Test utilities (dev only)

// User installs only what they need:
import { parse } from '@edtf/core'  // 30KB
// vs.
import edtf from 'edtf'             // 180KB
```

**Benefits:**
- Tree-shakeable by design
- Users pay only for what they use
- Clear separation of concerns
- Each module can version independently

#### 4. **What We Learn From Each Library**

**From edtf.js (study, don't fork):**
```typescript
// ✅ Copy their test cases (BSD license allows)
// ✅ Study their bitmask approach for uncertainty
// ✅ Learn edge cases they discovered
// ✅ Understand their type class hierarchy

// Example: Bitmask pattern (can implement cleanly in TS)
class UncertaintyMask {
  private value: number;
  
  is(component: 'year' | 'month' | 'day'): boolean {
    return (this.value & MASKS[component]) !== 0;
  }
}
```

**From edtfy (study, don't fork):**
```typescript
// ✅ Copy locale file structure (MIT allows)
// ✅ Study their natural language patterns
// ✅ Learn their PEG grammar approach

// Example: Locale system (improved)
interface Locale {
  code: string;
  qualifiers: {
    approximate: string[];  // ["circa", "about", "~"]
    uncertain: string[];    // ["possibly", "maybe", "?"]
  };
  // ... from edtfy but modernized
}
```

**From edtf-converter:**
```typescript
// ✅ Study their NL→EDTF patterns
// ✅ Learn from their date format handling
```

---

## Detailed Comparison

### Architecture Quality

| Aspect | Fork edtf.js | Fork edtfy | Fresh Start |
|--------|--------------|------------|-------------|
| **TypeScript Native** | ❌ Retrofitted | ❌ None | ✅ Day 1 |
| **Tree-shakeable** | ❌ Would need full rewrite | ❌ Would need rewrite | ✅ Designed-in |
| **Monorepo Structure** | ❌ Major refactor | ❌ Doesn't exist | ✅ Clean modules |
| **Zero Dependencies** | ❌ Has Nearley | ❌ Has PEG.js | ✅ Optional only |
| **Modern Build Tools** | ⚠️ Need to update | ⚠️ Need to update | ✅ Latest |
| **Bundle Size** | ❌ 180KB → would need optimization | ⚠️ Unknown | ✅ <50KB core |

### Feature Completeness

| Aspect | Fork edtf.js | Fork edtfy | Fresh Start |
|--------|--------------|------------|-------------|
| **EDTF Parsing** | ✅ Complete | ❌ Missing | 🔨 Build it |
| **Natural Language** | ❌ Missing | ✅ Partial | 🔨 Build it |
| **Current Spec (2019)** | ✅ Yes | ❌ No (2012) | ✅ Yes |
| **Level 0** | ✅ Yes | ✅ Yes | 🔨 Build it |
| **Level 1** | ✅ Yes | ⚠️ Partial | 🔨 Build it |
| **Level 2** | ✅ Yes | ⚠️ Partial | 🔨 Build it |

### Developer Experience

| Aspect | Fork edtf.js | Fork edtfy | Fresh Start |
|--------|--------------|------------|-------------|
| **API Design** | ⚠️ JavaScript-era | ⚠️ Basic | ✅ Modern TypeScript |
| **Error Messages** | ⚠️ Basic | ⚠️ Basic | ✅ Detailed + suggestions |
| **Type Safety** | ❌ Weak | ❌ None | ✅ Strong |
| **Documentation** | ⚠️ Fair | ⚠️ Fair | ✅ Excellent (planned) |
| **IDE Support** | ❌ Limited | ❌ None | ✅ Full IntelliSense |

### Time & Risk

| Aspect | Fork edtf.js | Fork edtfy | Fresh Start |
|--------|--------------|------------|-------------|
| **Initial Speed** | ✅ Faster start | ⚠️ Medium | ❌ Slower start |
| **Total Time** | ⚠️ 6-8 months | ⚠️ 7-9 months | ⚠️ 8-10 months |
| **Technical Debt** | ❌ Inherit legacy | ❌ Inherit problems | ✅ None |
| **Maintenance** | ⚠️ Harder | ⚠️ Harder | ✅ Easier |
| **Future-Proof** | ❌ Limited | ❌ Limited | ✅ Yes |

---

## The "Time to Market" Myth

**Common assumption:** "Forking saves time"

**Reality check:**

### Fork edtf.js Path:
```
Month 1-2:  Study codebase, set up TypeScript conversion
Month 3-5:  Convert to TypeScript (60% of code)
Month 4-6:  Refactor for tree-shaking (major architecture change)
Month 5-7:  Add natural language module (doesn't exist)
Month 6-8:  Add monorepo structure, split modules
Month 7-8:  Fix issues from refactoring, update tests
Month 8:    Polish, documentation

Total: 8 months, with lots of "fighting the existing structure"
```

### Fresh Start Path:
```
Month 1:    Core parser + Level 0 (study edtf.js tests)
Month 2:    Level 1 + Level 2 (reference edtf.js grammar)
Month 3:    Uncertainty/approximate tracking (learn from edtf.js)
Month 4:    Natural language module (learn from edtfy)
Month 5:    Formatting + i18n
Month 6:    Validation + comparison
Month 7:    React + testing utilities
Month 8:    Temporal API integration
Month 9-10: Polish, docs, performance optimization

Total: 10 months, clean architecture throughout
```

**Time difference:** 2 months

**Quality difference:** Massive

---

## Recommended Approach: "Learn and Build"

### Phase 1: Research (Month 1, first 2 weeks)

```bash
# Study existing libraries in depth
git clone https://github.com/inukshuk/edtf.js
git clone https://github.com/nicompte/edtfy

# Extract valuable assets:
# 1. Copy test cases from edtf.js (BSD allows)
# 2. Copy locale files from edtfy (MIT allows)
# 3. Document edge cases from both
# 4. Map out grammar rules
# 5. Identify patterns and anti-patterns
```

**Deliverables:**
- Test case repository (from edtf.js)
- Locale templates (from edtfy)
- Edge case documentation
- Grammar specification document
- Architecture design document

### Phase 2: Foundation (Month 1-2)

```typescript
// Start with clean TypeScript architecture
// @edtf/core - Monorepo structure from day 1

packages/
├── core/
│   ├── src/
│   │   ├── parser/
│   │   │   ├── grammar.peggy      // Learn from both libraries
│   │   │   └── parser.ts
│   │   ├── types/
│   │   │   ├── EDTFDate.ts       // Inspired by edtf.js
│   │   │   ├── EDTFInterval.ts
│   │   │   └── ...
│   │   └── index.ts
│   └── tests/
│       └── fixtures/              // From edtf.js (BSD allows)
```

### Phase 3: Natural Language (Month 4-5)

```typescript
// @edtf/natural - Learn from edtfy's approach

packages/
├── natural/
│   ├── locales/
│   │   ├── en.json    // Expand from edtfy's structure
│   │   ├── fr.json    // Use edtfy's as base (MIT allows)
│   │   ├── es.json    // New
│   │   ├── de.json    // New
│   │   └── ...
│   └── src/
│       ├── parser.peggy   // Inspired by edtfy but for 2019 spec
│       └── index.ts
```

### What We Legally Can Copy:

**From edtf.js (BSD-2-Clause):**
- ✅ Test cases (extremely valuable)
- ✅ Test fixtures and examples
- ✅ Concept of bitmask uncertainty tracking
- ✅ General architecture ideas
- ❌ Cannot copy code directly without attribution
- ✅ Must include BSD license notice for copied portions

**From edtfy (MIT):**
- ✅ Locale file structure and content
- ✅ Natural language patterns
- ✅ Grammar approach (but update for 2019 spec)
- ✅ Can copy code with attribution
- ✅ Must include MIT license notice

**Best Practice:**
```typescript
/**
 * Uncertainty tracking using bitmasks
 * Concept inspired by edtf.js (BSD-2-Clause)
 * Implementation independently created
 */
class UncertaintyMask {
  // Our own TypeScript implementation
}
```

---

## Technical Advantages of Fresh Start

### 1. TypeScript-First Type System

**Fork approach:**
```typescript
// Retrofitted types (weak)
export function parse(input: string): any;

// Have to cast everywhere
const date = parse('2016-XX') as EDTFDate;
```

**Fresh start:**
```typescript
// Strong types from day 1
export function parseDate(input: string): ParseResult<EDTFDate>;

// Type inference works
const result = parseDate('2016-XX');
if (result.success) {
  result.value  // TypeScript knows this is EDTFDate
}
```

### 2. Optimal Bundle Size

**Fork approach:**
```typescript
// edtf.js: ~180KB (everything bundled)
import edtf from 'edtf';
// User gets everything whether they need it or not
```

**Fresh start:**
```typescript
// Tree-shakeable modules
import { parseDate } from '@edtf/core';        // 30KB
import { parseNatural } from '@edtf/natural';  // +25KB if needed
import { format } from '@edtf/format';         // +15KB if needed

// User pays only for what they use
```

### 3. Modern API Design

**Fork approach:**
```javascript
// JavaScript API style (edtf.js)
const edtf = require('edtf');
edtf('2016-XX');  // Magic function
edtf.parse('2016-XX');  // Also exists?
edtf.Date();  // Constructor?
```

**Fresh start:**
```typescript
// Clean TypeScript API
import { parseDate, parseInterval, parseSeason } from '@edtf/core';

// Clear, typed functions
const date = parseDate('2016-XX');
const interval = parseInterval('2016/2017');
const season = parseSeason('2016-21');

// Type guards
if (isEDTFDate(result)) {
  // TypeScript knows properties available
}
```

### 4. Error Handling

**Fork approach:**
```javascript
// Basic errors
try {
  edtf.parse('invalid');
} catch (e) {
  console.log(e.message);  // "Parse error at position 5"
}
```

**Fresh start:**
```typescript
// Rich error information
const result = parseDate('invalid');

if (!result.success) {
  result.errors.forEach(error => {
    console.log(error.code);        // 'INVALID_MONTH'
    console.log(error.message);     // 'Month must be 01-12'
    console.log(error.position);    // { start: 5, end: 7 }
    console.log(error.suggestion);  // '2016-01' (maybe?)
  });
}
```

---

## Risk Mitigation

**Concern:** "What if we miss edge cases?"

**Mitigation:**
1. Copy all test cases from edtf.js (BSD allows)
2. Cross-reference with edtfy's examples
3. Test against official EDTF spec examples
4. Use property-based testing for edge case discovery
5. Extensive validation in CI

**Concern:** "What if the parser is wrong?"

**Mitigation:**
1. Study edtf.js grammar (Nearley) and edtfy grammar (PEG)
2. Reference official EDTF specification
3. Validate against all three libraries' outputs
4. Comprehensive test suite from day 1

**Concern:** "What about maintenance?"

**Mitigation:**
1. Clean architecture = easier maintenance
2. TypeScript = refactoring confidence
3. Monorepo = isolated changes
4. Good docs = easier for contributors

---

## Final Recommendation

### Start Fresh, But Stand on Giants' Shoulders

**DO:**
- ✅ Study edtf.js architecture thoroughly
- ✅ Copy edtf.js test cases (BSD license allows)
- ✅ Learn from edtf.js's bitmask approach
- ✅ Copy edtfy locale files (MIT allows)
- ✅ Study edtfy's natural language patterns
- ✅ Reference both grammars for edge cases
- ✅ Build TypeScript-first from day 1
- ✅ Design for tree-shaking from day 1
- ✅ Use modern tooling (Peggy, esbuild, pnpm)

**DON'T:**
- ❌ Fork and fight legacy architecture
- ❌ Retrofit TypeScript onto JavaScript
- ❌ Inherit technical debt
- ❌ Copy code without understanding it
- ❌ Ignore lessons from existing libraries

### Why This Works

1. **Faster learning curve:** Study existing code first
2. **Validated approach:** Know what works from existing libraries
3. **Clean architecture:** No compromises for legacy support
4. **Better DX:** API designed for TypeScript users
5. **Future-proof:** Modern patterns from day 1
6. **Smaller bundle:** Tree-shakeable by design
7. **Easier maintenance:** Clean code is easier to maintain

### Time Investment

**Initial research:** 2 weeks  
**Development:** 8-9 months  
**Polish:** 1-2 months  
**Total:** 10 months

**vs. Fork + Refactor:** 8 months (but with compromises)

**The 2-month difference buys you:**
- Clean architecture
- No technical debt
- Better developer experience
- Smaller bundle size
- Easier long-term maintenance

---

## Conclusion

**For a TypeScript-first, well-organized, modern EDTF library, starting fresh is the clear winner.**

The time difference is minimal (2 months), but the quality difference is substantial. You'll build exactly what you want, with no compromises, using modern tools and patterns.

The existing libraries are invaluable as **references and validation**, but not as **foundations to build upon**.

Think of it as: **"Learn from edtf.js and edtfy, then build what they should have been if they started today with TypeScript."**
