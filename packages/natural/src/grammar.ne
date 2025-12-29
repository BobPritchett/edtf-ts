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

const seasons = {
  'spring': '21',
  'summer': '22',
  'autumn': '23', 'fall': '23',
  'winter': '24'
};

function pad2(n) { return String(n).padStart(2, '0'); }
function pad4(n) { return String(n).padStart(4, '0'); }

function twoDigitYear(yy) {
  const year = parseInt(yy, 10);
  return year >= 30 ? 1900 + year : 2000 + year;
}

function bceToBCE(year) {
  return -(parseInt(year, 10) - 1);
}
%}

# Main entry point
main -> _ value _ {% d => d[1] %}

# Top-level value types
value ->
    interval {% id %}
  | set {% id %}
  | list {% id %}
  | season {% id %}
  | date {% id %}

# Whitespace
_ -> [\s]:* {% () => null %}
__ -> [\s]:+ {% () => null %}

# ==========================================
# INTERVALS
# ==========================================

interval ->
    "before" __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 }) %}
  | "until" __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 }) %}
  | "after" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}
  | "since" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ "or" __ "later"
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  | "from" __ datevalue __ "to" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 }) %}
  | datevalue __ "to" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 }) %}
  | "between" __ datevalue __ "and" __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 }) %}

# ==========================================
# SETS (Level 2)
# ==========================================

set ->
    "one"i __ "of"i _ ":" _ datevalue _ "," _ datevalue _ "," _ datevalue
      {% d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf},${d[14].edtf}]`, confidence: 0.95 }) %}
  | "one"i __ "of"i _ ":" _ datevalue _ "," _ datevalue
      {% d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf}]`, confidence: 0.95 }) %}
  | datevalue __ "or" __ datevalue __ "or" __ datevalue
      {% d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf},${d[8].edtf}]`, confidence: 0.9 }) %}
  | datevalue __ "or" __ datevalue
      {% d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf}]`, confidence: 0.9 }) %}
  | datevalue __ "or" __ "earlier"
      {% d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 }) %}

# ==========================================
# LISTS (Level 2)
# ==========================================

list ->
    "all"i __ "of"i _ ":" _ datevalue _ "," _ datevalue _ "," _ datevalue
      {% d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf},${d[14].edtf}}`, confidence: 0.95 }) %}
  | "all"i __ "of"i _ ":" _ datevalue _ "," _ datevalue
      {% d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf}}`, confidence: 0.95 }) %}
  | datevalue __ "and" __ datevalue __ "and" __ datevalue
      {% d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf},${d[8].edtf}}`, confidence: 0.9 }) %}
  | datevalue __ "and" __ datevalue
      {% d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf}}`, confidence: 0.9 }) %}

# ==========================================
# SEASONS
# ==========================================

season ->
    qualifier __ season_name __ year_num
      {% d => ({ type: 'season', edtf: `${d[4]}-${seasons[d[2].toLowerCase()]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ year_num
      {% d => ({ type: 'season', edtf: `${d[2]}-${seasons[d[0].toLowerCase()]}`, confidence: 0.95 }) %}

season_name -> ("spring"i | "summer"i | "autumn"i | "fall"i | "winter"i) {% d => d[0][0] %}

# ==========================================
# DATES
# ==========================================

date ->
    qualifier __ datevalue
      {% d => ({ type: 'date', edtf: `${d[2].edtf}${d[0]}`, confidence: d[2].confidence * 0.95 }) %}
  | datevalue __ qualifier
      {% d => ({ type: 'date', edtf: `${d[0].edtf}${d[2]}`, confidence: d[0].confidence * 0.95 }) %}
  | datevalue {% id %}

datevalue ->
    month_name __ day_num _ "," _ year_num
      {% d => ({ type: 'date', edtf: `${d[6]}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | month_name __ day_num __ year_num
      {% d => ({ type: 'date', edtf: `${d[4]}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | day_num __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${d[4]}-${months[d[2].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  | month_name __ year_num
      {% d => ({ type: 'date', edtf: `${d[2]}-${months[d[0].toLowerCase()]}`, confidence: 0.95 }) %}
  | "the" __ digit digit digit "0s"
      {% d => ({ type: 'date', edtf: `${d[2]}${d[3]}XX`, confidence: 0.95 }) %}
  | digit digit digit "0s"
      {% d => ({ type: 'date', edtf: `${d[0]}${d[1]}XX`, confidence: 0.95 }) %}
  | "the" __ digit digit digit digit "s"
      {% d => ({ type: 'date', edtf: `${d[2]}${d[3]}${d[4]}X`, confidence: 0.95 }) %}
  | digit digit digit digit "s"
      {% d => ({ type: 'date', edtf: `${d[0]}${d[1]}${d[2]}X`, confidence: 0.95 }) %}
  | year_num {% d => ({ type: 'date', edtf: d[0], confidence: 0.95 }) %}

# ==========================================
# QUALIFIERS
# ==========================================

qualifier ->
    "?" {% () => '?' %}
  | "~" {% () => '~' %}
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

day_num ->
    digit digit {% d => parseInt(d[0] + d[1], 10) %}
  | digit {% d => parseInt(d[0], 10) %}

digit -> [0-9] {% id %}
