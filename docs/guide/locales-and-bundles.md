# Locales and bundle sizes

Regional locales share a language grammar. `en-ZA`, `en-GB`, `en-AU`, and other `en-*` tags all use English; `es-MX` uses Spanish and `fr-CA` uses French. There is no separate parser or downloaded locale file for each country.

## Language and regional date order

The locale's language selects one of the shipped grammars (`en`, `es`, or `fr`). The complete locale tag is passed to `Intl.DateTimeFormat` to determine numeric date order. We keep the region when choosing that order, so selecting English grammar does not force US dates.

Representative defaults in the tested Node 24 / ICU runtime:

| Locale | Grammar | Preferred numeric order |
| --- | --- | --- |
| `en-US` | English | MDY |
| `en-GB` | English | DMY |
| `en-ZA` | English | YMD |
| `en-AU`, `en-NZ`, `en-IN`, `en-IE` | English | DMY |
| `en-CA` | English | YMD |
| `es-ES`, `es-MX` | Spanish | DMY |
| `fr-FR` | French | DMY |
| `fr-CA` | French | YMD |

These preferences come from the runtime's locale data, which can change between browsers or ICU/CLDR versions. An unavailable regional formatting locale can fall back through `Intl` locale negotiation. A supported base language still selects its grammar; an unsupported language such as `de` raises a natural parsing error unless `language` is explicitly supplied. See the [ECMA-402 locale matching specification](https://tc39.es/ecma402/#sec-resolvelocale).

Use `dateOrder` for an application-defined order. It changes the preferred interpretation; unambiguous alternatives remain available. Use `language` to specify the input grammar independently of the user's regional settings:

```typescript
import { parseNatural } from '@edtf-ts/natural/en';

const referenceDate = new Date(2026, 0, 1);
parseNatural('26/06/05', { locale: 'en-ZA', referenceDate })[0]!.edtf;
// '2026-06-05'
parseNatural('06/05/26', { locale: 'en-ZA', dateOrder: 'DMY', referenceDate })[0]!.edtf;
// '2026-05-06'
parseNatural('March 12, 1870', { locale: 'de-DE', language: 'en' })[0]!.edtf;
// '1870-03-12'
```

The playground includes US, UK, and South African English to demonstrate all three numeric orders. Other regions can be entered using its custom locale field. The library defaults to `en-US`; the playground initially uses the browser's locale.

## Choosing what to load

The root import includes all three language grammars and a shared Nearley/Moo parser runtime. Each language entry point includes its own grammar and the common parsing machinery. The core EDTF parser is a dependency, included in the browser measurements below.

```typescript
// English grammar, including all supported English regional preferences:
import { parseNatural } from '@edtf-ts/natural/en';

// For an application using Spanish only, use '@edtf-ts/natural/es'.
// For French only, use '@edtf-ts/natural/fr'.
// For an application using all three, use '@edtf-ts/natural'.
```

These entry points expose the same synchronous parsing APIs, including `parseAgeBirthday()` and `tryParseNatural()`. A language-specific entry rejects a request for a grammar it does not contain.

Setting `locale: 'en-US'` on a root-imported parser does not remove the other grammars from the bundle: they remain reachable through its runtime language selection. Select the `/en` module to exclude them. ESM tree shaking removes unused declarations when possible, but does not specialize a parser based on an options object; see [esbuild's tree-shaking documentation](https://esbuild.github.io/api/#tree-shaking).

For occasional natural parsing, a dynamic import can defer its download:

```typescript
async function parseEnglishInput(text: string) {
  const { parseNatural } = await import('@edtf-ts/natural/en');
  return parseNatural(text);
}
```

For several languages loaded together, prefer the root import. The current per-language builds are standalone, so combining multiple language entries can duplicate common code. Separate npm packages are unnecessary to select languages.

## Measured sizes

Measured from the 0.6.0 build with esbuild 0.27.2, targeting ES2020 browsers. Each browser bundle exports only `parse` (core) or `parseNatural` (natural); it includes the code reachable from that API, including core, grammar, and parser runtime. Source maps and declarations are excluded. Gzip uses level 9; actual application bundles and server compression will differ.

| Import | Built ESM file | Browser, minified | Browser, minified + gzip |
| --- | ---: | ---: | ---: |
| `@edtf-ts/core` | 170.8 KiB | 64.9 KiB | 17.3 KiB |
| `@edtf-ts/natural/en` | 239.7 KiB | 220.4 KiB | 49.3 KiB |
| `@edtf-ts/natural/es` | 245.7 KiB | 224.4 KiB | 49.8 KiB |
| `@edtf-ts/natural/fr` | 244.2 KiB | 223.4 KiB | 49.7 KiB |
| `@edtf-ts/natural` | 532.4 KiB | 407.5 KiB | 65.6 KiB |

The natural ESM file column excludes its external core dependency; the browser columns include it. Country-code variants add no grammar bytes. Most of the cost of one language is shared machinery, so adding Spanish and French together costs about 16.3 KiB gzip beyond English in this measurement. The extra uncompressed code still has a download/decompression/JavaScript processing cost.

Using all three is reasonable for a multilingual application. For a single-language application, select its entry point. As languages are added, retain selective imports and consider loading languages on demand instead of making every consumer load every grammar.

After building the packages, reproduce the table with:

```bash
pnpm --filter @edtf-ts/natural measure:bundles
# Machine-readable byte counts:
pnpm --filter @edtf-ts/natural measure:bundles --json
```
