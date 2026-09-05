---
title: Interactive Playground
---

# Interactive Playground

Try EDTF, natural-language dates, comparisons, and age/birthday expressions in English, Spanish, or French.

<EDTFPlayground />

## Choosing a Locale

The top-level **Locale** chooser starts with your browser’s default language tag (`navigator.language`). Select an English, Spanish, or French regional preset, or choose **Custom locale…** to test another tag such as `es-AR`. Select **Browser default** to reset. Overrides apply to this page only and reset on reload.

One selection controls both natural-language date inputs, numeric date ordering, formatted dates, the reference-date display, and all age/birthday parsing and rendering. The status line shows the active language and numeric order. Example buttons change language and use phrases from the shared language test fixtures.

Changing locale reinterprets text you entered while retaining that text. Text generated from an EDTF input is rendered again in the new locale. Choose a new example to try a different language. Unsupported languages and malformed locale tags show an explicit error; choose a supported locale to continue. The page’s interface labels remain in English.

The library API still defaults to `en-US`; browser detection is a playground feature. In your application, pass `locale` explicitly to parsing and rendering functions.

| English (`en-GB`) | Español (`es-ES`) | Français (`fr-FR`) | EDTF |
|---|---|---|---|
| before 1870 | antes de 1870 | avant 1870 | `[..1869]` |
| no earlier than 1870 | no antes de 1870 | pas avant 1870 | `[1870..]` |
| since 1870 | desde 1870 | depuis 1870 | `1870/..` |
| March 12, 1870 | 12 de marzo de 1870 | 12 mars 1870 | `1870-03-12` |

Try `01/02/2020` in both date inputs with `en-US` and `en-GB`: both interpretations remain valid, but the preferred result changes. Try **20 años** or **20 ans** in the age section with the matching locale. Age outputs depend on the displayed current date.

Try the **12th of unknown month, 1870** and **march 1988 - spring 1990** example buttons with **Show all locales** enabled. Their translated renderings should return `1870-XX-12` and `1988-03/1990-21` respectively. The [compatibility review](./guide/compatibility-review) records supported examples and intentional differences from older parsers.

### Comparing All Locales

Check **Show all locales** beside the first Natural Language label. One compact row per other locale preset shows its rendering on the right and its preferred back-parsed EDTF on the left. Enter EDTF directly or use the natural-language input to set the source value.

Green **✓** means the preferred EDTF matches the source after compacting adjacent exact years: `[1870,1871,1872]` and `[1870..1872]` match. This preserves set/list meaning and does not equate a set with an interval. Red **✗** identifies a different preferred result or a rendering/parse failure. A small `(+n)` marks alternate interpretations; hover over the result to see them and their match status. The rows update when the source, selected locale, or formatting options change. On narrow screens, each rendering appears above its back-parsed result.

Numeric order comes from each row’s locale: `en-US` prefers MDY, `en-GB`, `es-ES`, `es-MX`, and `fr-FR` prefer DMY, and `fr-CA` prefers YMD. The parser keeps valid alternatives but ranks the preferred interpretation first. In API calls, `dateOrder: 'MDY' | 'DMY' | 'YMD'` overrides that preference. `06/15/26` can still resolve to June 15 in a DMY locale because 15 cannot be a month.

The test suite follows key examples from English to EDTF, French, EDTF, Spanish, EDTF, and back to English, including compact year sets and lists, open and unknown interval endpoints, BCE/extended years, and qualifiers. Human-readable formatting is not always lossless: hiding qualifications, hiding era markers, or expanding month/day ranges can change the EDTF result, and the comparison shows that difference.

## What Can You Try?

### Level 0 (ISO 8601 Profile)

```
1985-04-12                Complete date
1985-04                   Year and month
1985                      Year only
1964/2008                 Interval
1985-04-12T23:20:30Z      DateTime with timezone
```

### Level 1 (Extensions)

```
1984?                     Uncertain year
2004-06~                  Approximate year and month
2004-06-11%               Uncertain and approximate
201X                      Unspecified digit (decade)
19XX                      Unspecified digits (century)
2004-XX                   Unspecified month
Y170000002                Extended year (5+ digits)
2001-21                   Season (Spring 2001)
../1985-04-12             Open-start interval
1985-04-12/..             Open-end interval
```

### Level 2 (Advanced Features)

```
Y-17E7                    Exponential year
1950S2                    Significant digits
[1667,1668,1670]          Set (one of)
{1667,1668,1670}          List (all of)
?2004-06-~11              Partial qualification
2001-33                   Quarter (Q1)
[..1760-12]               Open set (earlier)
[1760-12..]               Open set (later)
```

## Understanding the Output

### Type

The type of EDTF value:
- **Date**: Simple date (year, month, day)
- **DateTime**: Date with time
- **Interval**: Range between two dates
- **Season**: Seasonal date
- **Set**: One of multiple dates
- **List**: All of multiple dates

### Level

The EDTF conformance level:
- **0**: ISO 8601 profile
- **1**: Basic extensions (uncertainty, approximation)
- **2**: Advanced features (sets, lists, partial qualification)

### Precision

The precision of the date:
- **year**: Only year specified
- **month**: Year and month specified
- **day**: Complete date specified
- **second**: DateTime with seconds

### Date Range (min/max)

For bounded values, the displayed date range gives the outer bounds:
- **min**: Earliest possible date this value could represent
- **max**: Latest possible date this value could represent

For example, `199X` (the 1990s):
- min: `1990-01-01T00:00:00.000Z`
- max: `1999-12-31T23:59:59.999Z`

Open bounds can be unbounded or unknown. Sets and lists can contain gaps: their outer bounds do not make them continuous intervals. Open date choices such as `[..1870]` remain symbolic in comparisons. Timestamps without offsets are floating; comparing them with absolute timestamps returns `UNKNOWN`.

### Qualifications

#### Whole Date Qualifications
- **Uncertain (?)**: The date might not be accurate
- **Approximate (~)**: The date is estimated
- **Uncertain & Approximate (%)**: Both uncertain and approximate

#### Partial Qualifications (Level 2)
Different parts of a date can have different qualifications:
- `?2004-06-~11`: Year is uncertain, day is approximate
- `2004-~06-11`: Only the month is approximate

## Examples by Use Case

### Cultural Heritage

```
156X-12-25                Artifact from 1560s
1887~                     Painting circa 1887
1777-09-XX?               Battle sometime in September 1777 (uncertain)
```

### Historical Research

```
1400/1600                 Renaissance period
1939-09-01/1945-05-08     World War II
Y-17E7                    Astronomical year -170000000
```

### Genealogy

```
1850~                     Birth circa 1850
1920/1925                 Death between 1920-1925
1875-21                   Marriage in Spring 1875
```

### Archives

```
19XX-04                   Letter from April in a year 1900–1999
2004-XX                   Document from some month in 2004
[1667,1668,1670]          Manuscript from one of these years
```

## Learn More

- [Tested language examples](./guide/language-examples) - Shared English, Spanish, and French cases
- [Semantics and migration](./guide/semantics-migration) - Corrected boundaries, result types, and locale behavior
- [EDTF Specification](https://www.loc.gov/standards/datetime/) - Official standard
- [Getting Started](./guide/getting-started) - Installation and usage
- [API Reference](./api/core) - Full documentation
- [Examples](./examples/basic-usage) - Code examples
