# Natural parsing outcomes and policies

`parseNatural()` retains its array-or-throw calling pattern. The new result API and options let callers inspect failures and choose interpretations explicitly. They are available from the main package and the `/en`, `/es`, and `/fr` entry points. Version 0.6.0 also changes validation, language selection, result types, and some default interpretations; see the [0.5.0 migration guide](./semantics-migration) before upgrading.

## Structured outcomes

```typescript
import { tryParseNatural } from '@edtf-ts/natural';

const outcome = tryParseNatural('10/7/2008');
switch (outcome.kind) {
  case 'matched':
    console.log(outcome.result.edtf);
    break;
  case 'ambiguous':
    console.log(outcome.interpretations.map((result) => result.edtf));
    break;
  case 'noMatch':
    console.log(outcome.reason, outcome.error?.position);
    break;
  case 'error':
    console.log(outcome.error.code); // Invalid options or invalid input type
}
```

```typescript
type NaturalParseOutcome =
  | { kind: 'matched'; result: ParseResult }
  | { kind: 'ambiguous'; interpretations: ParseResult[] }
  | { kind: 'noMatch'; reason: NoMatchReason; error?: ParseError }
  | { kind: 'error'; error: ParseError };

function tryParseNatural(input: string, options?: ParseNaturalOptions): NaturalParseOutcome;
```

| No-match reason     | Example or cause                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `outOfGrammar`      | Empty input or unsupported prose                                                                         |
| `explicitNoDate`    | Whole-input markers such as `unknown`, `undated`, `sin fecha`, or `sans date`                            |
| `impossibleDate`    | A recognized expression with impossible calendar components, such as `February 30, 1985`                 |
| `unsupportedPolicy` | Recognized input excluded by the selected policy, such as a fuzzy cutoff under the default boundary mode |
| `filteredOut`       | All valid candidates were removed by `minConfidence`                                                     |

Invalid options produce `kind: 'error'` with `INVALID_OPTIONS`. Expected parser failures are returned; unexpected programming errors still throw. An uncertain date (`1950?`) and an explicit choice (`1863 or 1864` → `[1863,1864]`) can each be a single match. Parser ambiguity means multiple readings of the input, and remains marked even when `returnAllResults: false` returns only one interpretation.

`ParseError.code` adds stable error categories without changing the existing constructor arguments or `position` type. Syntax positions are zero-based UTF-16 offsets into the **original input**, including before Unicode and whitespace normalization. Semantic failures without a single offending token use the end of the input.

## Conversion notes

Successful `ParseResult` objects may include `notes: ParseNote[]`. Notes describe interpretation decisions; existing `warnings` continue to describe weekday mismatches. Each note has a stable `code`, `policy`, and human-readable `message`. Depend on codes and policy IDs rather than exact message wording.

| Policy | Note codes                                 | Decision                                                                             |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| P1     | `LITERAL_EDTF`, `SEASON_RANGE_COLLISION`   | Valid EDTF takes precedence over prose; some season codes also resemble year ranges. |
| P2     | `RANGE_QUALIFIER_SCOPE`                    | A trailing symbolic qualifier on a prose range follows `rangeQualification`.         |
| P3     | `NUMERIC_DATE_ORDER`                       | Numeric month/day order follows the existing date-order and locale rules.            |
| P4     | `EXCLUSIVE_CUTOFF`, `OPEN_INTERVAL_CUTOFF` | Before/after inclusion and representation follow `boundaryMode`.                     |
| P5     | `CENTURY_BOUNDARIES`                       | Historical centuries use exact boundaries: 19th century = 1801–1900.                 |
| P6     | `MISSING_YEAR`                             | Omitted years remain unspecified; no current year is invented.                       |

Notes annotate recognized decisions; they are not a complete parse trace.

## Opt-in interpretation changes

### Literal versus prose

```typescript
parseNatural('1910-30').map((result) => result.edtf);
// ['1910-30'] — valid EDTF sub-year code

parseNatural('1910-30', { literalPreference: 'all' }).map((result) => result.edtf);
// ['1910-30', '1910/1930']
```

The default is `literalPreference: 'edtf'`. The `all` option exposes the abbreviated year-range reading when a valid season/sub-year code collides with prose. It retains the literal as the first candidate. `active 1910-30` follows the same rule.

### Trailing range qualifiers

```typescript
parseNatural('1868-1871?')[0].edtf;
// '1868/1871?'

parseNatural('1868-1871?', { rangeQualification: 'both' })[0].edtf;
// '1868?/1871?'

parseNatural('1868-1871?', { rangeQualification: 'ambiguous' }).map((result) => result.edtf);
// ['1868/1871?', '1868?/1871?']
```

The default is `rangeQualification: 'end'`. This option applies to trailing symbolic `?`, `~`, or `%` on prose ranges. An explicit EDTF interval such as `1868/1871?` keeps its written qualification scope under every setting.

### Before and after

```typescript
parseNatural('before 1928')[0].edtf; // '[..1927]'

parseNatural('before 1928', { boundaryMode: 'open-interval' })[0].edtf;
// '../1928'

parseNatural('before approx January 1928', {
  boundaryMode: 'open-interval',
})[0].edtf;
// '../1928-01~'
```

The default `boundaryMode: 'exclusive-choice'` shifts an exact cutoff by one written precision unit and represents a possible event date using a set. Fuzzy cutoffs remain unsupported under that default. The opt-in `open-interval` mode keeps the cutoff and its qualification as an interval endpoint. It therefore changes both endpoint inclusion and representation; choose it only when that meaning fits the application.

For an exact period such as a historical century, this mode uses the period's start for `before` and end for `after`: `before 19th century` becomes `../1801`. Masked periods retain their mask. Explicit inclusive choices such as `1870 or earlier` still produce `[..1870]` under either option. Existing strict-conformance restrictions still apply to season endpoints.

## Vocabulary and compatibility

English additionally recognizes `1862 guess`, `uncertain: Jan 18 1862`, `active 17-19th Centuries`, and `year in the 1860s`. These are bounded grammar rules: trailing free-form text such as `1863, printed 1870` is still rejected.

Regression tests preserve the exact default EDTF outputs and candidate ordering for all 92 previously accepted inputs in the attached review corpus. Historical centuries, before/after choices, explicit `or` sets, and literal precedence retain their deliberate differences from the imported expectations. Use the options above where a different interpretation is needed; accepting an input does not imply identical output to the other project.

Of the attachment's 103 expected matches, 95 are recognized by default and eight more with `boundaryMode: 'open-interval'`. The other 32 cases consist of 27 retained rejections and five existing extensions: `1900; 1973`, `1862 (uncertain)`, `month in 1872`, `day in January 1872`, and `day in 1872`. Thus all 135 inputs have an explicit tested disposition.

See [core operations](../api/operations) for canonicalization, lazy enumeration, explicit bounds, significant-year corrections, and relation summaries. The [interoperability guide](./interoperability) documents the existing strict/extended profile.

Some differences from edtf-core remain: masked season years would require widening the public numeric `EDTFSeason.year` field, and wider integer years would need a separate numeric representation. Neither API change is included. The Rust package's validation choices are not automatically adopted as our conformance rules; existing extension policies remain explicit.
