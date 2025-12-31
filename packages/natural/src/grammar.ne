# Natural Language to EDTF Grammar
# Nearley grammar for parsing human-readable dates into EDTF format

@{%
const months = {
  'january': '01', 'jan': '01',
  'february': '02', 'feb': '02',
  'march': '03', 'mar': '03',
  'april': '04', 'apr': '04',
  'may': '05',
  'june': '06', 'jun': '06',
  'july': '07', 'jul': '07',
  'august': '08', 'aug': '08',
  'september': '09', 'sep': '09', 'sept': '09',
  'october': '10', 'oct': '10',
  'november': '11', 'nov': '11',
  'december': '12', 'dec': '12'
};

// Seasons (independent of location) - Level 1
const seasons = {
  'spring': '21',
  'summer': '22',
  'autumn': '23', 'fall': '23',
  'winter': '24'
};

// Northern Hemisphere seasons - Level 2
const northernSeasons = {
  'spring': '25',
  'summer': '26',
  'autumn': '27', 'fall': '27',
  'winter': '28'
};

// Southern Hemisphere seasons - Level 2
const southernSeasons = {
  'spring': '29',
  'summer': '30',
  'autumn': '31', 'fall': '31',
  'winter': '32'
};

function pad2(n) { return String(n).padStart(2, '0'); }
function pad4(n) { return String(n).padStart(4, '0'); }

function twoDigitYear(yy) {
  const year = parseInt(yy, 10);
  return year >= 30 ? 1900 + year : 2000 + year;
}

// Check if a year is a leap year
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Get the number of days in a given month
function getDaysInMonth(year, month) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return daysInMonth[month - 1] || 0;
}

// Build intervals for early/mid/late modifiers
// Month: 10-10-Remaining split (1-10, 11-20, 21-end)
function buildMonthModifierInterval(year, month, modifier) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const lastDay = getDaysInMonth(y, m);

  switch (modifier) {
    case 'early':
      return `${pad4(y)}-${pad2(m)}-01/${pad4(y)}-${pad2(m)}-10`;
    case 'mid':
      return `${pad4(y)}-${pad2(m)}-11/${pad4(y)}-${pad2(m)}-20`;
    case 'late':
      return `${pad4(y)}-${pad2(m)}-21/${pad4(y)}-${pad2(m)}-${pad2(lastDay)}`;
    default:
      return `${pad4(y)}-${pad2(m)}`;
  }
}

// Year: Quarterly trisections (Jan-Apr, May-Aug, Sep-Dec)
function buildYearModifierInterval(year, modifier) {
  const y = parseInt(year, 10);

  switch (modifier) {
    case 'early':
      return `${pad4(y)}-01/${pad4(y)}-04`;
    case 'mid':
      return `${pad4(y)}-05/${pad4(y)}-08`;
    case 'late':
      return `${pad4(y)}-09/${pad4(y)}-12`;
    default:
      return pad4(y);
  }
}

// Decade: 4-3-3 Rule (0-3, 4-6, 7-9)
function buildDecadeModifierInterval(decadeStart, modifier) {
  const d = parseInt(decadeStart, 10);

  switch (modifier) {
    case 'early':
      return `${d}/${d + 3}`;
    case 'mid':
      return `${d + 4}/${d + 6}`;
    case 'late':
      return `${d + 7}/${d + 9}`;
    default:
      return `${d}/${d + 9}`;
  }
}

// Century: Mathematical thirds (01-33, 34-66, 67-00)
// Note: centuries are 1-indexed (20th century = 1901-2000)
function buildCenturyModifierInterval(centuryNum, modifier) {
  const c = parseInt(centuryNum, 10);
  const centuryStart = (c - 1) * 100 + 1; // 20th century starts at 1901

  switch (modifier) {
    case 'early':
      return `${pad4(centuryStart)}/${pad4(centuryStart + 32)}`;
    case 'mid':
      return `${pad4(centuryStart + 33)}/${pad4(centuryStart + 65)}`;
    case 'late':
      return `${pad4(centuryStart + 66)}/${pad4(centuryStart + 99)}`;
    default:
      return `${String(c - 1).padStart(2, '0')}XX`;
  }
}

// BCE Century intervals (negative years)
function buildBCECenturyModifierInterval(centuryNum, modifier) {
  const c = parseInt(centuryNum, 10);
  // For BCE, 1st century BCE = -0099 to -0001 (years 100 BCE to 1 BCE)
  const centuryEnd = -((c - 1) * 100); // End year (closer to 0)
  const centuryStart = -(c * 100 - 1);  // Start year (further from 0)

  switch (modifier) {
    case 'early':
      // Early part of BCE century is further from year 0
      return `-${pad4(c * 100 - 1)}/-${pad4((c - 1) * 100 + 67)}`;
    case 'mid':
      return `-${pad4((c - 1) * 100 + 66)}/-${pad4((c - 1) * 100 + 34)}`;
    case 'late':
      // Late part of BCE century is closer to year 0
      return `-${pad4((c - 1) * 100 + 33)}/-${pad4((c - 1) * 100)}`;
    default:
      return `-${String(c - 1).padStart(2, '0')}XX`;
  }
}

function bceToBCE(year) {
  return -(parseInt(year, 10) - 1);
}

// Build EDTF with partial qualifications
// e.g., buildPartialQual('2004-06-11', { year: '?', day: '~' }) => '?2004-06-~11'
function buildPartialQual(baseEdtf, quals) {
  const parts = baseEdtf.split('-');
  const year = parts[0] || '';
  const month = parts[1] || '';
  const day = parts[2] || '';

  const yearQual = quals.year || '';
  const monthQual = quals.month || '';
  const dayQual = quals.day || '';

  if (day) {
    // Full date: YYYY-MM-DD
    return `${yearQual}${year}-${monthQual}${month}-${dayQual}${day}`;
  } else if (month) {
    // Year-month: YYYY-MM
    return `${yearQual}${year}-${monthQual}${month}`;
  } else {
    // Year only
    return `${yearQual}${year}`;
  }
}
%}

# Main entry point
main -> _ value _ {% d => d[1] %}

# Top-level value types
value ->
    interval {% id %}
  | temporal_modifier {% id %}
  | set {% id %}
  | list {% id %}
  | season {% id %}
  | date {% id %}

# Whitespace
_ -> [\s]:* {% () => null %}
__ -> [\s]:+ {% () => null %}

# ==========================================
# TEMPORAL MODIFIERS (Early/Mid/Late)
# ==========================================

# The modifier word (early, mid, late)
temporal_modifier_word ->
    "early"i {% () => 'early' %}
  | "mid"i {% () => 'mid' %}
  | "middle"i {% () => 'mid' %}
  | "late"i {% () => 'late' %}

# Optional separator between modifier and date (space or hyphen)
modifier_sep -> __ {% id %} | "-" {% id %}

# Main temporal modifier rules
temporal_modifier ->
    # Early/Mid/Late + Month + Year: "early March 2024", "mid-January 1995"
    temporal_modifier_word modifier_sep month_name __ year_num
      {% d => {
        const modifier = d[0];
        const month = months[d[2].toLowerCase()];
        const year = d[4];
        return { type: 'interval', edtf: buildMonthModifierInterval(year, month, modifier), confidence: 0.95 };
      } %}
  | temporal_modifier_word modifier_sep month_name _ "," _ year_num
      {% d => {
        const modifier = d[0];
        const month = months[d[2].toLowerCase()];
        const year = d[6];
        return { type: 'interval', edtf: buildMonthModifierInterval(year, month, modifier), confidence: 0.95 };
      } %}
  # Early/Mid/Late + Year: "early 1995", "mid-2020"
  | temporal_modifier_word modifier_sep year_num
      {% d => {
        const modifier = d[0];
        const year = d[2];
        return { type: 'interval', edtf: buildYearModifierInterval(year, modifier), confidence: 0.95 };
      } %}
  # Early/Mid/Late + Decade: "early 1990s", "mid-1920s", "late 1880s"
  | temporal_modifier_word modifier_sep digit digit digit "0" ("'" | null) "s"i
      {% d => {
        const modifier = d[0];
        const decadeStart = parseInt(d[2] + d[3] + d[4] + '0', 10);
        return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.95 };
      } %}
  # Early/Mid/Late + "the" + Decade: "early the 1990s"
  | temporal_modifier_word __ "the"i __ digit digit digit "0" ("'" | null) "s"i
      {% d => {
        const modifier = d[0];
        const decadeStart = parseInt(d[4] + d[5] + d[6] + '0', 10);
        return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.95 };
      } %}
  # "the early 1990s"
  | "the"i __ temporal_modifier_word __ digit digit digit "0" ("'" | null) "s"i
      {% d => {
        const modifier = d[2];
        const decadeStart = parseInt(d[4] + d[5] + d[6] + '0', 10);
        return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.95 };
      } %}
  # Early/Mid/Late + Ordinal Century + "century": "early 20th century", "mid-19th century"
  | temporal_modifier_word modifier_sep ordinal_century __ ("century"i | "c"i ".")
      {% d => {
        const modifier = d[0];
        const centuryNum = d[2];
        return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
      } %}
  # "the early 20th century"
  | "the"i __ temporal_modifier_word __ ordinal_century __ ("century"i | "c"i ".")
      {% d => {
        const modifier = d[2];
        const centuryNum = d[4];
        return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
      } %}
  # Early/Mid/Late + Ordinal Century + "century" + CE/AD: "early 20th century CE"
  | temporal_modifier_word modifier_sep ordinal_century __ ("century"i | "c"i ".") __ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => {
        const modifier = d[0];
        const centuryNum = d[2];
        return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
      } %}
  # "the early 20th century CE"
  | "the"i __ temporal_modifier_word __ ordinal_century __ ("century"i | "c"i ".") __ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => {
        const modifier = d[2];
        const centuryNum = d[4];
        return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
      } %}
  # Early/Mid/Late + Ordinal Century + "century" + BCE/BC: "early 5th century BCE"
  | temporal_modifier_word modifier_sep ordinal_century __ ("century"i | "c"i ".") __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const modifier = d[0];
        const centuryNum = d[2];
        return { type: 'interval', edtf: buildBCECenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
      } %}
  # "the early 5th century BCE"
  | "the"i __ temporal_modifier_word __ ordinal_century __ ("century"i | "c"i ".") __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const modifier = d[2];
        const centuryNum = d[4];
        return { type: 'interval', edtf: buildBCECenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
      } %}
  # Early/Mid/Late + Spelled Ordinal Century + "century": "early twentieth century"
  | temporal_modifier_word modifier_sep spelled_ordinal_century __ ("century"i | "c"i ".")
      {% d => {
        const modifier = d[0];
        const centuryNum = d[2];
        return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
      } %}
  # "the early twentieth century"
  | "the"i __ temporal_modifier_word __ spelled_ordinal_century __ ("century"i | "c"i ".")
      {% d => {
        const modifier = d[2];
        const centuryNum = d[4];
        return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
      } %}
  # Spelled decades: "early sixties", "mid-seventies"
  | temporal_modifier_word modifier_sep spelled_decade
      {% d => {
        const modifier = d[0];
        const decadeDigit = d[2];
        const decadeStart = 1900 + parseInt(decadeDigit, 10) * 10;
        return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.9 };
      } %}
  # "the early sixties"
  | "the"i __ temporal_modifier_word __ spelled_decade
      {% d => {
        const modifier = d[2];
        const decadeDigit = d[4];
        const decadeStart = 1900 + parseInt(decadeDigit, 10) * 10;
        return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.9 };
      } %}

# ==========================================
# INTERVALS
# ==========================================

interval ->
    numeric_year _ "-" _ numeric_year __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const startYear = parseInt(d[0], 10) - 1;
        const endYear = parseInt(d[4], 10) - 1;
        return { type: 'interval', edtf: `-${pad4(startYear)}/-${pad4(endYear)}`, confidence: 0.98 };
      } %}
  | numeric_year __ "to"i __ numeric_year __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const startYear = parseInt(d[0], 10) - 1;
        const endYear = parseInt(d[4], 10) - 1;
        return { type: 'interval', edtf: `-${pad4(startYear)}/-${pad4(endYear)}`, confidence: 0.98 };
      } %}
  | numeric_year _ "-" _ numeric_year __ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => {
        const startYear = parseInt(d[0], 10);
        const endYear = parseInt(d[4], 10);
        return { type: 'interval', edtf: `${pad4(startYear)}/${pad4(endYear)}`, confidence: 0.98 };
      } %}
  | numeric_year __ "to"i __ numeric_year __ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => {
        const startYear = parseInt(d[0], 10);
        const endYear = parseInt(d[4], 10);
        return { type: 'interval', edtf: `${pad4(startYear)}/${pad4(endYear)}`, confidence: 0.98 };
      } %}
  | "from"i __ month_name __ "to"i __ month_name __ year_num
      {% d => ({ type: 'interval', edtf: `${pad4(d[8])}-${months[d[2].toLowerCase()]}/${pad4(d[8])}-${months[d[6].toLowerCase()]}`, confidence: 0.95 }) %}
  | month_name __ "to"i __ month_name __ year_num
      {% d => ({ type: 'interval', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}/${pad4(d[6])}-${months[d[4].toLowerCase()]}`, confidence: 0.9 }) %}
  | month_name _ "-" _ month_name __ year_num
      {% d => ({ type: 'interval', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}/${pad4(d[6])}-${months[d[4].toLowerCase()]}`, confidence: 0.9 }) %}
  | "before" __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 }) %}
  | "earlier" __ "than" __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 }) %}
  | "prior" __ "to" __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 }) %}
  | "up" __ "to" __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 }) %}
  | "later" __ "than" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[4].edtf}/..`, confidence: 0.95 }) %}
  | "from" __ datevalue __ "onwards"
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ "and" __ "after"
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ "or" __ "later"
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ "or" __ "after"
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  | "from" __ datevalue __ "through" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 }) %}
  | datevalue __ "through" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 }) %}
  | "from" __ datevalue __ "until" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 }) %}
  | datevalue __ "until" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 }) %}
  | "from" __ datevalue __ "to" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 }) %}
  | "from" __ datevalue __ "to" __ interval_endpoint
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/`, confidence: 0.95 }) %}
  | "from" __ datevalue __ "to" __ open_endpoint
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ "to" __ interval_endpoint
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/`, confidence: 0.95 }) %}
  | datevalue __ "to" __ open_endpoint
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  | open_endpoint __ "to" __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 }) %}
  | datevalue __ "to" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 }) %}
  | datevalue _ "-" _ datevalue
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 }) %}
  | "between" __ datevalue __ "and" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 }) %}
  | interval_endpoint __ "to" __ datevalue
      {% d => ({ type: 'interval', edtf: `/${d[4].edtf}`, confidence: 0.95 }) %}
  | "until" __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 }) %}
  | "after" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}
  | "since" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}

# Unknown/open endpoints for intervals
interval_endpoint ->
    "unknown"i {% () => '' %}
  | "?" {% () => '' %}

# Open endpoints for intervals (returns '..' for EDTF)
open_endpoint ->
    ("open"i __ ("start"i | "end"i)) {% () => '..' %}
  | "onward"i {% () => '..' %}
  | "onwards"i {% () => '..' %}

# ==========================================
# SETS (Level 2)
# ==========================================

set ->
    "one"i __ "of"i _ ":" _ datevalue _ "," _ datevalue _ "," _ datevalue
      {% d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf},${d[14].edtf}]`, confidence: 0.95 }) %}
  | "one"i __ "of"i _ ":" _ datevalue _ "," _ datevalue
      {% d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf}]`, confidence: 0.95 }) %}
  | "either"i __ datevalue __ "or" __ datevalue
      {% d => ({ type: 'set', edtf: `[${d[2].edtf},${d[6].edtf}]`, confidence: 0.95 }) %}
  | datevalue __ "or" __ datevalue __ "or" __ datevalue
      {% d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf},${d[8].edtf}]`, confidence: 0.9 }) %}
  | datevalue __ "or" __ datevalue
      {% d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf}]`, confidence: 0.9 }) %}
  | datevalue __ "or" __ "earlier"
      {% d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 }) %}
  | datevalue __ "or" __ "before"
      {% d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 }) %}

# ==========================================
# LISTS (Level 2)
# ==========================================

list ->
    "all"i __ "of"i _ ":" _ datevalue _ "," _ datevalue _ "," _ datevalue
      {% d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf},${d[14].edtf}}`, confidence: 0.95 }) %}
  | "all"i __ "of"i _ ":" _ datevalue _ "," _ datevalue
      {% d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf}}`, confidence: 0.95 }) %}
  | "both"i __ datevalue __ "and" __ datevalue
      {% d => ({ type: 'list', edtf: `{${d[2].edtf},${d[6].edtf}}`, confidence: 0.95 }) %}
  | datevalue __ "and" __ datevalue __ "and" __ datevalue
      {% d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf},${d[8].edtf}}`, confidence: 0.9 }) %}
  | datevalue __ "and" __ datevalue
      {% d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf}}`, confidence: 0.9 }) %}

# ==========================================
# SEASONS
# ==========================================

season ->
    # Northern Hemisphere seasons: "Spring (Northern Hemisphere) 1985"
    qualifier __ season_name __ hemisphere_north __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[6])}-${northernSeasons[d[2].toLowerCase()]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ hemisphere_north __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${northernSeasons[d[0].toLowerCase()]}`, confidence: 0.95 }) %}
  # Southern Hemisphere seasons: "Spring (Southern Hemisphere) 1985"
  | qualifier __ season_name __ hemisphere_south __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[6])}-${southernSeasons[d[2].toLowerCase()]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ hemisphere_south __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${southernSeasons[d[0].toLowerCase()]}`, confidence: 0.95 }) %}
  # Quarters: "Q1 1985", "Quarter 1 1985", "1st Quarter 1985"
  | qualifier __ quarter_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | quarter_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Quadrimesters: "Quadrimester 1 1985", "1st Quadrimester 1985"
  | qualifier __ quadrimester_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | quadrimester_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Semesters: "Semester 1 1985", "1st Semester 1985"
  | qualifier __ semester_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | semester_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Basic seasons (independent of location): "Spring 1985"
  | qualifier __ season_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${seasons[d[2].toLowerCase()]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${seasons[d[0].toLowerCase()]}`, confidence: 0.95 }) %}

season_name -> ("spring"i | "summer"i | "autumn"i | "fall"i | "winter"i) {% d => d[0][0] %}

# Hemisphere indicators
hemisphere_north ->
    "(" _ ("northern"i __ "hemisphere"i | "north"i) _ ")" {% () => 'north' %}
  | "," _ ("northern"i __ "hemisphere"i | "north"i) {% () => 'north' %}

hemisphere_south ->
    "(" _ ("southern"i __ "hemisphere"i | "south"i) _ ")" {% () => 'south' %}
  | "," _ ("southern"i __ "hemisphere"i | "south"i) {% () => 'south' %}

# Quarter names (codes 33-36)
quarter_name ->
    "Q"i "1" {% () => '33' %}
  | "Q"i "2" {% () => '34' %}
  | "Q"i "3" {% () => '35' %}
  | "Q"i "4" {% () => '36' %}
  | "quarter"i __ "1" {% () => '33' %}
  | "quarter"i __ "2" {% () => '34' %}
  | "quarter"i __ "3" {% () => '35' %}
  | "quarter"i __ "4" {% () => '36' %}
  | ("1st"i | "first"i) __ "quarter"i {% () => '33' %}
  | ("2nd"i | "second"i) __ "quarter"i {% () => '34' %}
  | ("3rd"i | "third"i) __ "quarter"i {% () => '35' %}
  | ("4th"i | "fourth"i) __ "quarter"i {% () => '36' %}

# Quadrimester names (codes 37-39)
quadrimester_name ->
    "quadrimester"i __ "1" {% () => '37' %}
  | "quadrimester"i __ "2" {% () => '38' %}
  | "quadrimester"i __ "3" {% () => '39' %}
  | ("1st"i | "first"i) __ "quadrimester"i {% () => '37' %}
  | ("2nd"i | "second"i) __ "quadrimester"i {% () => '38' %}
  | ("3rd"i | "third"i) __ "quadrimester"i {% () => '39' %}

# Semester names (codes 40-41)
semester_name ->
    "semester"i __ "1" {% () => '40' %}
  | "semester"i __ "2" {% () => '41' %}
  | ("1st"i | "first"i) __ "semester"i {% () => '40' %}
  | ("2nd"i | "second"i) __ "semester"i {% () => '41' %}

# ==========================================
# DATES
# ==========================================

date ->
    datevalue _ parenthetical_qualification
      {% d => {
        const qual = d[2];
        if (qual.type === 'global') {
          return { type: 'date', edtf: `${d[0].edtf}${qual.qual}`, confidence: d[0].confidence * 0.9 };
        } else {
          // Partial qualifications
          return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
        }
      } %}
  | qualifier _ datevalue
      {% d => ({ type: 'date', edtf: `${d[2].edtf}${d[0]}`, confidence: d[2].confidence * 0.95 }) %}
  | datevalue _ qualifier
      {% d => ({ type: 'date', edtf: `${d[0].edtf}${d[2]}`, confidence: d[0].confidence * 0.95 }) %}
  | datevalue {% id %}

datevalue ->
    datevalue_base _ parenthetical_qualification
      {% d => {
        const qual = d[2];
        if (qual.type === 'global') {
          return { type: 'date', edtf: `${d[0].edtf}${qual.qual}`, confidence: d[0].confidence * 0.9 };
        } else {
          // Partial qualifications
          return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
        }
      } %}
  | qualifier _ datevalue_base
      {% d => ({ type: 'date', edtf: `${d[2].edtf}${d[0]}`, confidence: d[2].confidence * 0.95 }) %}
  | datevalue_base _ qualifier
      {% d => ({ type: 'date', edtf: `${d[0].edtf}${d[2]}`, confidence: d[0].confidence * 0.95 }) %}
  | datevalue_base {% id %}

datevalue_base ->
    "sometime"i __ "in"i __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[4].toLowerCase()]}-XX`, confidence: 0.9 }) %}
  | "some"i __ "day"i __ "in"i __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6].toLowerCase()]}-XX`, confidence: 0.9 }) %}
  | "a"i __ "day"i __ "in"i __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6].toLowerCase()]}-XX`, confidence: 0.9 }) %}
  | "sometime"i __ "in"i __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-XX-XX`, confidence: 0.9 }) %}
  | "some"i __ "month"i __ "in"i __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-XX`, confidence: 0.9 }) %}
  | "a"i __ "month"i __ "in"i __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-XX`, confidence: 0.9 }) %}
  | numeric_year __ "Before"i __ "Common"i __ "Era"i
      {% d => {
        const year = parseInt(d[0], 10);
        const bceYear = year - 1;
        return { type: 'date', edtf: `-${pad4(bceYear)}`, confidence: 0.95 };
      } %}
  | numeric_year __ "Before"i __ "Christ"i
      {% d => {
        const year = parseInt(d[0], 10);
        const bceYear = year - 1;
        return { type: 'date', edtf: `-${pad4(bceYear)}`, confidence: 0.95 };
      } %}
  | "Anno"i __ "Domini"i __ numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[4], 10)), confidence: 0.95 }) %}
  | numeric_year __ "Anno"i __ "Domini"i
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 }) %}
  | "Common"i __ "Era"i __ numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[4], 10)), confidence: 0.95 }) %}
  | numeric_year __ "Common"i __ "Era"i
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 }) %}
  | numeric_year __ "B"i
      {% d => {
        const year = parseInt(d[0], 10);
        const bceYear = year - 1;
        return { type: 'date', edtf: `-${pad4(bceYear)}`, confidence: 0.9 };
      } %}
  | "A"i __ numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[2], 10)), confidence: 0.9 }) %}
  | numeric_year __ "A"i
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.9 }) %}
  | numeric_year _ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const year = parseInt(d[0], 10);
        const bceYear = year - 1;
        return { type: 'date', edtf: `-${pad4(bceYear)}`, confidence: 0.95 };
      } %}
  | ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i) _ numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[2], 10)), confidence: 0.95 }) %}
  | numeric_year _ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 }) %}
  | "on"i __ "the"i __ ordinal_day __ "of"i __ month_name _ "," _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[12])}-${months[d[8].toLowerCase()]}-${pad2(d[4])}`, confidence: 0.95 }) %}
  | "on"i __ "the"i __ ordinal_day __ "of"i __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[10])}-${months[d[8].toLowerCase()]}-${pad2(d[4])}`, confidence: 0.95 }) %}
  | "the"i __ ordinal_day __ "of"i __ month_name _ "," _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[10])}-${months[d[6].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | "the"i __ ordinal_day __ "of"i __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | ordinal_day __ "of"i __ month_name _ "," _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[4].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  | ordinal_day __ "of"i __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[4].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  | month_name __ "the"i __ ordinal_day _ "," _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[0].toLowerCase()]}-${pad2(d[4])}`, confidence: 0.95 }) %}
  | month_name __ "the"i __ ordinal_day __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}-${pad2(d[4])}`, confidence: 0.95 }) %}
  | month_name __ ordinal_day _ "," _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | month_name __ ordinal_day __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | ordinal_day __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[2].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  | month_name __ day_num _ "," _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | month_name __ day_num __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | day_num __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[2].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  | month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[2])}-${months[d[0].toLowerCase()]}`, confidence: 0.95 }) %}
  | "the" __ digit digit "0" "0'" "s"
      {% d => ({ type: 'date', edtf: `${d[2]}${d[3]}XX`, confidence: 0.98 }) %}
  | digit digit "0" "0'" "s"
      {% d => ({ type: 'date', edtf: `${d[0]}${d[1]}XX`, confidence: 0.98 }) %}
  | "the" __ digit digit "0" "0s"
      {% d => ({ type: 'date', edtf: `${d[2]}${d[3]}XX`, confidence: 0.98 }) %}
  | digit digit "0" "0s"
      {% d => ({ type: 'date', edtf: `${d[0]}${d[1]}XX`, confidence: 0.98 }) %}
  | "the" __ digit digit digit "0'" "s"
      {% d => ({ type: 'date', edtf: `${d[2]}${d[3]}${d[4]}X`, confidence: 0.95 }) %}
  | digit digit digit "0'" "s"
      {% d => ({ type: 'date', edtf: `${d[0]}${d[1]}${d[2]}X`, confidence: 0.95 }) %}
  | "the" __ digit digit digit "0s"
      {% d => ({ type: 'date', edtf: `${d[2]}${d[3]}${d[4]}X`, confidence: 0.95 }) %}
  | digit digit digit "0s"
      {% d => ({ type: 'date', edtf: `${d[0]}${d[1]}${d[2]}X`, confidence: 0.95 }) %}
  | "the" __ "'" digit digit "s"
      {% d => ({ type: 'date', edtf: `19${d[3]}X`, confidence: 0.9 }) %}
  | "'" digit digit "s"
      {% d => ({ type: 'date', edtf: `19${d[1]}X`, confidence: 0.9 }) %}
  | "the"i __ ordinal_century __ ("century"i | "c"i ".") __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const centuryNum = d[2];
        const yearPrefix = String(centuryNum - 1).padStart(2, '0');
        return { type: 'date', edtf: `-${yearPrefix}XX`, confidence: 0.95 };
      } %}
  | ordinal_century __ ("century"i | "c"i ".") __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const centuryNum = d[0];
        const yearPrefix = String(centuryNum - 1).padStart(2, '0');
        return { type: 'date', edtf: `-${yearPrefix}XX`, confidence: 0.95 };
      } %}
  | "the"i __ spelled_ordinal_century __ ("century"i | "c"i ".") __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const centuryNum = d[2];
        const yearPrefix = String(centuryNum - 1).padStart(2, '0');
        return { type: 'date', edtf: `-${yearPrefix}XX`, confidence: 0.95 };
      } %}
  | spelled_ordinal_century __ ("century"i | "c"i ".") __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const centuryNum = d[0];
        const yearPrefix = String(centuryNum - 1).padStart(2, '0');
        return { type: 'date', edtf: `-${yearPrefix}XX`, confidence: 0.95 };
      } %}
  | "the"i __ spelled_century __ "century"i __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const centuryPrefix = d[2];
        const year = parseInt(centuryPrefix, 10) * 100;
        return { type: 'date', edtf: `-${pad4(year - 1)}XX`, confidence: 0.95 };
      } %}
  | spelled_century __ "century"i __ ("B"i "." _ "C"i "." _ "E"i "." | "B"i "." _ "C"i "." | "BCE"i | "BC"i)
      {% d => {
        const centuryPrefix = d[0];
        const year = parseInt(centuryPrefix, 10) * 100;
        return { type: 'date', edtf: `-${pad4(year - 1)}XX`, confidence: 0.95 };
      } %}
  | "the"i __ ordinal_century __ ("century"i | "c"i ".") __ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => {
        const centuryNum = d[2];
        const year = (centuryNum - 1) * 100;
        const yearPrefix = String(year).substring(0, 2);
        return { type: 'date', edtf: `${yearPrefix}XX`, confidence: 0.95 };
      } %}
  | ordinal_century __ ("century"i | "c"i ".") __ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => {
        const centuryNum = d[0];
        const year = (centuryNum - 1) * 100;
        const yearPrefix = String(year).substring(0, 2);
        return { type: 'date', edtf: `${yearPrefix}XX`, confidence: 0.95 };
      } %}
  | "the"i __ spelled_century __ "century"i __ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => {
        const centuryPrefix = d[2];
        const year = (parseInt(centuryPrefix, 10) - 1) * 100;
        return { type: 'date', edtf: `${String(year).padStart(2, '0')}XX`, confidence: 0.95 };
      } %}
  | spelled_century __ "century"i __ ("A"i "." _ "D"i "." | "C"i "." _ "E"i "." | "AD"i | "CE"i)
      {% d => {
        const centuryPrefix = d[0];
        const year = (parseInt(centuryPrefix, 10) - 1) * 100;
        return { type: 'date', edtf: `${String(year).padStart(2, '0')}XX`, confidence: 0.95 };
      } %}
  | "the"i __ ordinal_century __ ("century"i | "c"i ".")
      {% d => {
        const centuryNum = d[2];
        const year = (centuryNum - 1) * 100;
        return { type: 'date', edtf: `${String(year).substring(0, 2)}XX`, confidence: 0.95 };
      } %}
  | ordinal_century __ ("century"i | "c"i ".")
      {% d => {
        const centuryNum = d[0];
        const year = (centuryNum - 1) * 100;
        return { type: 'date', edtf: `${String(year).substring(0, 2)}XX`, confidence: 0.95 };
      } %}
  | "the"i __ spelled_century __ "century"i
      {% d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 }) %}
  | spelled_century __ "century"i
      {% d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 }) %}
  | "the"i __ spelled_number_word __ "hundreds"i
      {% d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 }) %}
  | spelled_number_word __ "hundreds"i
      {% d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 }) %}
  | "the"i __ spelled_decade
      {% d => ({ type: 'date', edtf: `19${d[2]}X`, confidence: 0.9 }) %}
  | spelled_decade
      {% d => ({ type: 'date', edtf: `19${d[0]}X`, confidence: 0.9 }) %}
  | digit digit "s"
      {% d => {
        const twoDigit = d[0] + d[1];
        const year = parseInt(twoDigit, 10);
        // Determine century: if >= 30, assume 1900s, else 2000s
        const fullYear = year >= 30 ? 1900 + year : 2000 + year;
        return { type: 'date', edtf: `${String(fullYear).substring(0, 3)}X`, confidence: 0.9 };
      } %}
  | year_num _ "-ish"
      {% d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 }) %}
  | year_num "ish"
      {% d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 }) %}
  | year_num {% d => ({ type: 'date', edtf: pad4(d[0]), confidence: 0.95 }) %}

# ==========================================
# QUALIFIERS
# ==========================================

qualifier ->
    "?" {% () => '?' %}
  | "~" {% () => '~' %}
  | "≈" {% () => '~' %}
  | "circa." {% () => '~' %}
  | "circa" {% () => '~' %}
  | "c." {% () => '~' %}
  | "ca." {% () => '~' %}
  | "about" {% () => '~' %}
  | "around" {% () => '~' %}
  | "approximately" {% () => '~' %}
  | "possibly" {% () => '?' %}
  | "maybe" {% () => '?' %}
  | "perhaps" {% () => '?' %}
  | "probably" {% () => '?' %}
  | "uncertain" {% () => '?' %}

# Parenthetical qualifications like "(uncertain)" or "(year uncertain, day approximate)"
parenthetical_qualification ->
    "(" _ "uncertain/approximate" _ ")"
      {% () => ({ type: 'global', qual: '%' }) %}
  | "(" _ "uncertain" __ "and" __ "approximate" _ ")"
      {% () => ({ type: 'global', qual: '%' }) %}
  | "(" _ "uncertain" _ ")"
      {% () => ({ type: 'global', qual: '?' }) %}
  | "(" _ "approximate" _ ")"
      {% () => ({ type: 'global', qual: '~' }) %}
  | "(" _ partial_qual_list _ ")"
      {% d => ({ type: 'partial', quals: d[2] }) %}

# Partial qualifications - returns an object with year/month/day qualifications
partial_qual_list ->
    partial_qual _ "," _ partial_qual_list
      {% d => ({ ...d[4], ...d[0] }) %}
  | partial_qual _ "," _ partial_qual
      {% d => ({ ...d[0], ...d[4] }) %}
  | partial_qual
      {% d => d[0] %}

partial_qual ->
    "year"i __ qual_type
      {% d => ({ year: d[2] }) %}
  | "month"i __ qual_type
      {% d => ({ month: d[2] }) %}
  | "day"i __ qual_type
      {% d => ({ day: d[2] }) %}

qual_type ->
    "uncertain/approximate"i {% () => '%' %}
  | "uncertain"i {% () => '?' %}
  | "approximate"i {% () => '~' %}

# ==========================================
# PRIMITIVES
# ==========================================

month_name ->
    ("january"i | "jan"i | "february"i | "feb"i | "march"i | "mar"i | "april"i | "apr"i |
     "may"i | "june"i | "jun"i | "july"i | "jul"i | "august"i | "aug"i |
     "september"i | "sep"i | "sept"i | "october"i | "oct"i | "november"i | "nov"i |
     "december"i | "dec"i)
      {% d => d[0][0] %}

year_num ->
    digit digit digit digit {% d => d[0] + d[1] + d[2] + d[3] %}
  | digit digit digit {% d => d[0] + d[1] + d[2] %}
  | digit digit {% d => d[0] + d[1] %}
  | digit {% d => d[0] %}

# Numeric year for BC/AD/BCE/CE (1-4 digits)
numeric_year ->
    digit digit digit digit {% d => d[0] + d[1] + d[2] + d[3] %}
  | digit digit digit {% d => d[0] + d[1] + d[2] %}
  | digit digit {% d => d[0] + d[1] %}
  | digit {% d => d[0] %}

day_num ->
    digit digit {% d => parseInt(d[0] + d[1], 10) %}
  | digit {% d => parseInt(d[0], 10) %}

# Ordinal days (1st, 2nd, 3rd, 12th)
ordinal_day ->
    digit digit ("st"i | "nd"i | "rd"i | "th"i) {% d => parseInt(d[0] + d[1], 10) %}
  | digit ("st"i | "nd"i | "rd"i | "th"i) {% d => parseInt(d[0], 10) %}

# Ordinal centuries (19th, 20th, etc.)
ordinal_century ->
    digit digit ("st"i | "nd"i | "rd"i | "th"i) {% d => parseInt(d[0] + d[1], 10) %}
  | digit ("st"i | "nd"i | "rd"i | "th"i) {% d => parseInt(d[0], 10) %}

# Spelled-out ordinal numbers for centuries
spelled_ordinal_century ->
    "first"i {% () => 1 %}
  | "second"i {% () => 2 %}
  | "third"i {% () => 3 %}
  | "fourth"i {% () => 4 %}
  | "fifth"i {% () => 5 %}
  | "sixth"i {% () => 6 %}
  | "seventh"i {% () => 7 %}
  | "eighth"i {% () => 8 %}
  | "ninth"i {% () => 9 %}
  | "tenth"i {% () => 10 %}
  | "eleventh"i {% () => 11 %}
  | "twelfth"i {% () => 12 %}
  | "thirteenth"i {% () => 13 %}
  | "fourteenth"i {% () => 14 %}
  | "fifteenth"i {% () => 15 %}
  | "sixteenth"i {% () => 16 %}
  | "seventeenth"i {% () => 17 %}
  | "eighteenth"i {% () => 18 %}
  | "nineteenth"i {% () => 19 %}
  | "twentieth"i {% () => 20 %}
  | "twenty-first"i {% () => 21 %}

# Spelled-out number words (for "eighteen hundreds", etc.)
spelled_number_word ->
    "eighteen"i {% () => '18' %}
  | "seventeen"i {% () => '17' %}
  | "sixteen"i {% () => '16' %}
  | "fifteen"i {% () => '15' %}
  | "fourteen"i {% () => '14' %}
  | "thirteen"i {% () => '13' %}
  | "twelve"i {% () => '12' %}
  | "eleven"i {% () => '11' %}
  | "nineteen"i {% () => '19' %}
  | "twenty"i {% () => '20' %}

# Spelled-out centuries
spelled_century ->
    "nineteenth"i {% () => '18' %}
  | "eighteenth"i {% () => '17' %}
  | "seventeenth"i {% () => '16' %}
  | "sixteenth"i {% () => '15' %}
  | "fifteenth"i {% () => '14' %}
  | "twentieth"i {% () => '19' %}
  | "twenty-first"i {% () => '20' %}

# Spelled-out decades (defaults to 20th century)
spelled_decade ->
    "sixties"i {% () => '6' %}
  | "fifties"i {% () => '5' %}
  | "forties"i {% () => '4' %}
  | "thirties"i {% () => '3' %}
  | "twenties"i {% () => '2' %}
  | "tens"i {% () => '1' %}
  | "seventies"i {% () => '7' %}
  | "eighties"i {% () => '8' %}
  | "nineties"i {% () => '9' %}

digit -> [0-9] {% id %}
