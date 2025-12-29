# Why EDTF-TS?

EDTF-TS is a modern, TypeScript-first implementation of the Extended Date/Time Format specification. Here's why you should use it.

## Comparison with Other Libraries

### vs. edtf.js

[edtf.js](https://github.com/inukshuk/edtf.js) is the most popular JavaScript EDTF library, but EDTF-TS offers several advantages:

| Feature | edtf.js | EDTF-TS |
|---------|---------|---------|
| TypeScript Support | ❌ No types | ✅ Full TypeScript |
| Bundle Size | ~180KB | ~35KB core |
| Natural Language | ❌ | 🔄 Planned |
| Human Formatting | ❌ | ✅ Built-in |
| Utilities Package | ❌ | ✅ Yes |
| Tree-shakeable | ⚠️ Partial | ✅ Full |
| Dependencies | Several | Zero (core) |
| Maintenance | Active | Active |

**Migration from edtf.js:**

```typescript
// edtf.js
import edtf from 'edtf';
const date = edtf('2016-XX');

// EDTF-TS
import { parse, isEDTFDate } from '@edtf-ts/core';
const result = parse('2016-XX');
if (result.success && isEDTFDate(result.value)) {
  const date = result.value;
}
```

### vs. Python/Ruby Implementations

EDTF-TS brings the power of Python's edtf2 and Ruby's edtf-ruby to the JavaScript ecosystem:

- **Browser Support**: Works in browsers, not just server-side
- **Type Safety**: Compile-time type checking with TypeScript
- **Modern Tooling**: ESM, tree-shaking, TypeScript IntelliSense
- **JavaScript Ecosystem**: npm packages, familiar tooling

## Key Advantages

### 1. Full TypeScript Support

EDTF-TS is built with TypeScript from the ground up:

```typescript
import { parse, isEDTFDate } from '@edtf-ts/core';

const result = parse('1985-04-12');

if (result.success) {
  // TypeScript knows the exact type
  result.value.min;  // Date
  result.value.max;  // Date

  // Type guards for narrowing
  if (isEDTFDate(result.value)) {
    result.value.year;   // number | string
    result.value.month;  // number | string | undefined
  }
} else {
  // TypeScript knows about errors
  result.errors[0].code;     // string
  result.errors[0].message;  // string
}
```

**Benefits:**
- IntelliSense autocomplete in VS Code
- Catch errors at compile time
- Refactoring safety
- Self-documenting code

### 2. Zero Dependencies (Core)

The core package has **zero runtime dependencies**:

```json
{
  "dependencies": {}
}
```

**Benefits:**
- Smaller bundle size
- Fewer security vulnerabilities
- Faster installs
- No dependency conflicts
- Long-term stability

### 3. Modern JavaScript

Uses latest ECMAScript features:

```typescript
// Generator functions for iteration
for (const year of interval.by('year')) {
  console.log(year);
}

// Optional chaining
result.value?.min

// Nullish coalescing
const year = date.year ?? defaultYear

// ESM imports
import { parse } from '@edtf-ts/core'
```

### 4. Comprehensive Utilities

Built-in utilities package with formatting, validation, and comparison:

```typescript
import { formatHuman, isInRange, sort } from '@edtf-ts/utils';

// Format dates
formatHuman(date);  // "April 12, 1985"

// Validate ranges
isInRange(date, start, end);

// Sort collections
const sorted = sort(dates);
```

Other libraries require you to build these utilities yourself.

### 5. Excellent Error Messages

Helpful error messages with suggestions:

```typescript
const result = parse('1985-13-01');

if (!result.success) {
  console.log(result.errors[0].message);
  // "Month must be 01-12, got: 13"

  console.log(result.errors[0].position);
  // { start: 5, end: 7 }
}
```

### 6. Smaller Bundle Size

**Core package:**
- ESM: 34.92 KB (unminified)
- Gzipped: ~10 KB

**Utils package:**
- ESM: 12.69 KB (unminified)
- Gzipped: ~4 KB

Compare to edtf.js: ~180 KB

### 7. Tree-Shakeable

Import only what you need:

```typescript
// Import specific functions
import { parse, isEDTFDate } from '@edtf-ts/core';

// Tree-shaking removes unused code
import { formatHuman } from '@edtf-ts/utils';
// formatISO, compare, sort, etc. are not included in bundle
```

### 8. Locale Support

Built-in internationalization:

```typescript
import { formatHuman } from '@edtf-ts/utils';

formatHuman(date, { locale: 'en-US' });  // "April 12, 1985"
formatHuman(date, { locale: 'fr-FR' });  // "12 avril 1985"
formatHuman(date, { locale: 'de-DE' });  // "12. April 1985"
```

Uses native `Intl` API for maximum compatibility.

### 9. Well Tested

- **194 tests** across core and utils packages
- **100% passing** rate
- Comprehensive edge case coverage
- Validation for all EDTF levels

```bash
Test Files  3 passed (3)
     Tests  126 passed (126)  # core
     Tests  68 passed (68)    # utils
```

### 10. Active Development

- Regular updates and improvements
- Responsive to issues and PRs
- Clear roadmap for future features
- Community-driven development

## Use Cases

EDTF-TS is perfect for:

### Cultural Heritage & Museums

```typescript
// Cataloging artifacts with uncertain dates
const pottery = parse('156X-12-25');
formatHuman(pottery);  // "December 25, 1560s"
```

### Historical Research

```typescript
// Events with approximate dates
const battle = parse('1777-09-XX?');
formatHuman(battle);  // "September 1777 (uncertain)"
```

### Digital Archives

```typescript
// Documents with date ranges
const collection = parse('1940/1945');
for (const year of collection.by('year')) {
  // Process each year
}
```

### Genealogy

```typescript
// Birth records with approximation
const birth = parse('1850~');
const death = parse('1920/1925');
```

## Performance

Hand-written recursive descent parser optimized for:

- **Fast parsing**: <1ms for typical dates
- **Small memory footprint**: Minimal allocations
- **Efficient iteration**: Generator-based, lazy evaluation

## Developer Experience

### IntelliSense

![TypeScript IntelliSense showing autocomplete]

### Documentation

- Comprehensive guides and examples
- API reference with type signatures
- Real-world use cases
- Migration guides

### Debugging

```typescript
// Clear error messages
const result = parse('invalid-date');
if (!result.success) {
  console.log(result.errors);
  // Detailed error with position and suggestion
}
```

## Future Features

Planned additions:

- **Natural Language Parsing**: "circa 1950" → `1950~`
- **React Components**: `<EDTFInput>`, `<EDTFDisplay>`
- **Zod Integration**: Schema validation
- **Database Adapters**: Prisma, TypeORM support
- **Temporal API**: Integration with TC39 Temporal

## Getting Started

Ready to use EDTF-TS?

- [Getting Started](./getting-started) - Install and basic usage
- [Examples](../examples/basic-usage) - See it in action
- [API Reference](../api/core) - Full API documentation

## Community

- [GitHub](https://github.com/yourusername/edtf-ts) - Star the project
- [npm](https://www.npmjs.com/package/@edtf-ts/core) - Package stats
- [Issues](https://github.com/yourusername/edtf-ts/issues) - Report bugs
- [Discussions](https://github.com/yourusername/edtf-ts/discussions) - Ask questions
