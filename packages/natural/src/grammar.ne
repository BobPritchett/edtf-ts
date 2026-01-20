# Natural Language to EDTF Grammar (v2 - Refactored)
# Uses Moo lexer for token-level parsing with case-insensitive keyword matching

@{%
const moo = require("moo");

// Case-insensitive keyword matching helper
const caseInsensitiveKeywords = (map) => {
  const transform = moo.keywords(map);
  return (text) => transform(text.toLowerCase());
};

// Create lexer with case-insensitive keyword matching
const lexer = moo.compile({
  ws: { match: /\s+/, lineBreaks: true },
  number: /[0-9]+/,
  ordinalSuffix: /(?:st|nd|rd|th)\b/,
  ish: /-?ish\b/,
  decadeSuffix: /'?s\b/,
  doubleDot: /\.\./,
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
  dot: /\./,
  word: {
    match: /[a-zA-Z]+/,
    type: caseInsensitiveKeywords({
      early: 'early',
      mid: ['mid', 'middle'],
      late: 'late',
      from: 'from',
      to: 'to',
      through: ['through', 'thru'],
      until: 'until',
      between: 'between',
      and: 'and',
      or: 'or',
      before: 'before',
      after: 'after',
      since: 'since',
      onwards: ['onwards', 'onward'],
      earlier: 'earlier',
      later: 'later',
      prior: 'prior',
      up: 'up',
      than: 'than',
      open: 'open',
      start: 'start',
      end: 'end',
      circa: 'circa',
      ca: 'ca',
      c: 'c',
      about: 'about',
      around: 'around',
      approximately: ['approximately', 'approx'],
      near: 'near',
      possibly: 'possibly',
      maybe: 'maybe',
      perhaps: 'perhaps',
      probably: 'probably',
      uncertain: 'uncertain',
      approximate: 'approximate',
      the: 'the',
      a: ['a', 'an'],
      of: 'of',
      inWord: 'in',
      on: 'on',
      year: 'year',
      month: 'month',
      day: 'day',
      sometime: 'sometime',
      some: 'some',
      anno: 'anno',
      domini: 'domini',
      common: 'common',
      era: 'era',
      christ: 'christ',
      bce: 'bce',
      bc: 'bc',
      ce: 'ce',
      ad: 'ad',
      b: 'b',
      century: 'century',
      hundreds: 'hundreds',
      spring: 'spring',
      summer: 'summer',
      autumn: 'autumn',
      fall: 'fall',
      winter: 'winter',
      northern: 'northern',
      southern: 'southern',
      hemisphere: 'hemisphere',
      north: 'north',
      south: 'south',
      quarter: 'quarter',
      q: 'q',
      quadrimester: 'quadrimester',
      semestral: 'semestral',
      semester: 'semester',
      first: 'first',
      second: 'second',
      third: 'third',
      fourth: 'fourth',
      fifth: 'fifth',
      sixth: 'sixth',
      seventh: 'seventh',
      eighth: 'eighth',
      ninth: 'ninth',
      tenth: 'tenth',
      eleventh: 'eleventh',
      twelfth: 'twelfth',
      thirteenth: 'thirteenth',
      fourteenth: 'fourteenth',
      fifteenth: 'fifteenth',
      sixteenth: 'sixteenth',
      seventeenth: 'seventeenth',
      eighteenth: 'eighteenth',
      nineteenth: 'nineteenth',
      twentieth: 'twentieth',
      twentyFirst: ['twenty-first'],
      twenties: 'twenties',
      thirties: 'thirties',
      forties: 'forties',
      fifties: 'fifties',
      sixties: 'sixties',
      seventies: 'seventies',
      eighties: 'eighties',
      nineties: 'nineties',
      tens: 'tens',
      eleven: 'eleven',
      twelve: 'twelve',
      thirteen: 'thirteen',
      fourteen: 'fourteen',
      fifteen: 'fifteen',
      sixteen: 'sixteen',
      seventeen: 'seventeen',
      eighteen: 'eighteen',
      nineteen: 'nineteen',
      twenty: 'twenty',
      january: 'january',
      jan: 'jan',
      february: 'february',
      feb: 'feb',
      march: 'march',
      mar: 'mar',
      april: 'april',
      apr: 'apr',
      may: 'may',
      june: 'june',
      jun: 'jun',
      july: 'july',
      jul: 'jul',
      august: 'august',
      aug: 'aug',
      september: 'september',
      sept: 'sept',
      sep: 'sep',
      october: 'october',
      oct: 'oct',
      november: 'november',
      nov: 'nov',
      december: 'december',
      dec: 'dec',
      either: 'either',
      both: 'both',
      one: 'one',
      all: 'all',
      unknown: 'unknown',
    }),
  },
});

// Month lookup
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

// Seasons
const seasons = { 'spring': '21', 'summer': '22', 'autumn': '23', 'fall': '23', 'winter': '24' };
const northernSeasons = { 'spring': '25', 'summer': '26', 'autumn': '27', 'fall': '27', 'winter': '28' };
const southernSeasons = { 'spring': '29', 'summer': '30', 'autumn': '31', 'fall': '31', 'winter': '32' };

// Utility functions
function pad2(n) { return String(n).padStart(2, '0'); }
function pad4(n) { return String(n).padStart(4, '0'); }

function twoDigitYear(yy) {
  const year = parseInt(yy, 10);
  const currentYear = new Date().getFullYear();
  const futureWindow = 20;
  const maxFutureYear = currentYear + futureWindow;
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const thisOption = currentCentury + year;
  const prevOption = thisOption - 100;
  return thisOption <= maxFutureYear ? thisOption : prevOption;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year, month) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month === 2 && isLeapYear(year) ? 29 : (daysInMonth[month - 1] || 0);
}

// Modifier interval builders
function buildMonthModifierInterval(year, month, modifier) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const lastDay = getDaysInMonth(y, m);
  switch (modifier) {
    case 'early': return `${pad4(y)}-${pad2(m)}-01/${pad4(y)}-${pad2(m)}-10`;
    case 'mid': return `${pad4(y)}-${pad2(m)}-11/${pad4(y)}-${pad2(m)}-20`;
    case 'late': return `${pad4(y)}-${pad2(m)}-21/${pad4(y)}-${pad2(m)}-${pad2(lastDay)}`;
    default: return `${pad4(y)}-${pad2(m)}`;
  }
}

function buildYearModifierInterval(year, modifier) {
  const y = parseInt(year, 10);
  switch (modifier) {
    case 'early': return `${pad4(y)}-01/${pad4(y)}-04`;
    case 'mid': return `${pad4(y)}-05/${pad4(y)}-08`;
    case 'late': return `${pad4(y)}-09/${pad4(y)}-12`;
    default: return pad4(y);
  }
}

function buildDecadeModifierInterval(decadeStart, modifier) {
  const d = parseInt(decadeStart, 10);
  switch (modifier) {
    case 'early': return `${d}/${d + 3}`;
    case 'mid': return `${d + 4}/${d + 6}`;
    case 'late': return `${d + 7}/${d + 9}`;
    default: return `${d}/${d + 9}`;
  }
}

function normalizeDecadeStart(edtf) {
  return /^\d{3}X$/.test(edtf) ? `${edtf.slice(0, 3)}0` : edtf;
}

function normalizeDecadeEnd(edtf) {
  return /^\d{3}X$/.test(edtf) ? `${edtf.slice(0, 3)}9` : edtf;
}

function buildCenturyModifierInterval(centuryNum, modifier) {
  const c = parseInt(centuryNum, 10);
  const centuryStart = (c - 1) * 100 + 1;
  switch (modifier) {
    case 'early': return `${pad4(centuryStart)}/${pad4(centuryStart + 32)}`;
    case 'mid': return `${pad4(centuryStart + 33)}/${pad4(centuryStart + 65)}`;
    case 'late': return `${pad4(centuryStart + 66)}/${pad4(centuryStart + 99)}`;
    default: return `${String(c - 1).padStart(2, '0')}XX`;
  }
}

function buildBCECenturyModifierInterval(centuryNum, modifier) {
  const c = parseInt(centuryNum, 10);
  switch (modifier) {
    case 'early': return `-${pad4(c * 100 - 1)}/-${pad4((c - 1) * 100 + 67)}`;
    case 'mid': return `-${pad4((c - 1) * 100 + 66)}/-${pad4((c - 1) * 100 + 34)}`;
    case 'late': return `-${pad4((c - 1) * 100 + 33)}/-${pad4((c - 1) * 100)}`;
    default: return `-${String(c - 1).padStart(2, '0')}XX`;
  }
}

// Combination modifier builders
function buildMonthCombinationInterval(year, month, combo) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const lastDay = getDaysInMonth(y, m);
  switch (combo) {
    case 'early-to-mid': return `${pad4(y)}-${pad2(m)}-01/${pad4(y)}-${pad2(m)}-20`;
    case 'mid-to-late': return `${pad4(y)}-${pad2(m)}-11/${pad4(y)}-${pad2(m)}-${pad2(lastDay)}`;
    default: return `${pad4(y)}-${pad2(m)}`;
  }
}

function buildYearCombinationInterval(year, combo) {
  const y = parseInt(year, 10);
  switch (combo) {
    case 'early-to-mid': return `${pad4(y)}-01/${pad4(y)}-08`;
    case 'mid-to-late': return `${pad4(y)}-05/${pad4(y)}-12`;
    default: return pad4(y);
  }
}

function buildDecadeCombinationInterval(decadeStart, combo) {
  const d = parseInt(decadeStart, 10);
  switch (combo) {
    case 'early-to-mid': return `${d}/${d + 6}`;
    case 'mid-to-late': return `${d + 4}/${d + 9}`;
    default: return `${d}/${d + 9}`;
  }
}

function buildCenturyCombinationInterval(centuryNum, combo) {
  const c = parseInt(centuryNum, 10);
  const centuryStart = (c - 1) * 100 + 1;
  switch (combo) {
    case 'early-to-mid': return `${pad4(centuryStart)}/${pad4(centuryStart + 65)}`;
    case 'mid-to-late': return `${pad4(centuryStart + 33)}/${pad4(centuryStart + 99)}`;
    default: return `${String(c - 1).padStart(2, '0')}XX`;
  }
}

function buildBCECenturyCombinationInterval(centuryNum, combo) {
  const c = parseInt(centuryNum, 10);
  switch (combo) {
    case 'early-to-mid': return `-${pad4(c * 100 - 1)}/-${pad4((c - 1) * 100 + 34)}`;
    case 'mid-to-late': return `-${pad4((c - 1) * 100 + 66)}/-${pad4((c - 1) * 100)}`;
    default: return `-${String(c - 1).padStart(2, '0')}XX`;
  }
}

function bceToBCE(year) { return -(parseInt(year, 10) - 1); }

function buildSlashDate(first, second, yearStr) {
  const firstNum = parseInt(first, 10);
  const secondNum = parseInt(second, 10);
  const year = yearStr.length === 2 ? twoDigitYear(yearStr) : parseInt(yearStr, 10);
  const isFirstValidMonth = firstNum >= 1 && firstNum <= 12;
  const isSecondValidMonth = secondNum >= 1 && secondNum <= 12;
  const isFirstValidDay = firstNum >= 1 && firstNum <= 31;
  const isSecondValidDay = secondNum >= 1 && secondNum <= 31;
  if (firstNum > 12 && isFirstValidDay && isSecondValidMonth) {
    return { type: 'date', edtf: `${pad4(year)}-${pad2(secondNum)}-${pad2(firstNum)}`, confidence: 0.9, ambiguous: false };
  }
  if (secondNum > 12 && isSecondValidDay && isFirstValidMonth) {
    return { type: 'date', edtf: `${pad4(year)}-${pad2(firstNum)}-${pad2(secondNum)}`, confidence: 0.9, ambiguous: false };
  }
  if (isFirstValidMonth && isSecondValidDay) {
    return { type: 'date', edtf: `${pad4(year)}-${pad2(firstNum)}-${pad2(secondNum)}`, confidence: 0.5, ambiguous: true };
  }
  return null;
}

function buildPartialQual(baseEdtf, quals) {
  const parts = baseEdtf.split('-');
  const year = parts[0] || '';
  const month = parts[1] || '';
  const day = parts[2] || '';
  const yearQual = quals.year || '';
  const monthQual = quals.month || '';
  const dayQual = quals.day || '';
  if (day) return `${yearQual}${year}-${monthQual}${month}-${dayQual}${day}`;
  if (month) return `${yearQual}${year}-${monthQual}${month}`;
  return `${yearQual}${year}`;
}

function getIntervalStart(edtf) { var parts = edtf.split('/'); return parts[0] || edtf; }
function getIntervalEnd(edtf) { var parts = edtf.split('/'); return parts[1] || parts[0] || edtf; }
function applyQualifierToInterval(edtf, qualifier) {
  if (!qualifier) return edtf;
  var parts = edtf.split('/');
  if (parts.length === 2) return parts[0] + qualifier + '/' + parts[1] + qualifier;
  return edtf + qualifier;
}
%}

@lexer lexer

# Main entry point
main -> _ value _ {% d => d[1] %}

# Top-level value types
value ->
    interval {% id %}
  | qualified_temporal_modifier {% id %}
  | temporal_modifier {% id %}
  | set {% id %}
  | list {% id %}
  | season {% id %}
  | date {% id %}

# Whitespace handling
_ -> %ws:* {% () => null %}
__ -> %ws:+ {% () => null %}

# ==========================================
# PRIMITIVES
# ==========================================

# Year number (4 digits) - now handled by single number token
year_4digit -> %number {% d => d[0].value %}

# Year number (1-4 digits)
year_num -> %number {% d => d[0].value %}

# Numeric year for era handling
numeric_year -> %number {% d => d[0].value %}

# Day number
day_num -> %number {% d => parseInt(d[0].value, 10) %}

# Ordinal numbers: "1st", "2nd", "12th"
ordinal_num -> %number %ordinalSuffix {% d => parseInt(d[0].value, 10) %}

# Ordinal day/century
ordinal_day -> ordinal_num {% id %}
ordinal_century -> ordinal_num {% id %}

# Month names - using token types from lexer
month_name ->
    %january {% d => d[0].value.toLowerCase() %}
  | %jan {% d => d[0].value.toLowerCase() %}
  | %february {% d => d[0].value.toLowerCase() %}
  | %feb {% d => d[0].value.toLowerCase() %}
  | %march {% d => d[0].value.toLowerCase() %}
  | %mar {% d => d[0].value.toLowerCase() %}
  | %april {% d => d[0].value.toLowerCase() %}
  | %apr {% d => d[0].value.toLowerCase() %}
  | %may {% d => d[0].value.toLowerCase() %}
  | %june {% d => d[0].value.toLowerCase() %}
  | %jun {% d => d[0].value.toLowerCase() %}
  | %july {% d => d[0].value.toLowerCase() %}
  | %jul {% d => d[0].value.toLowerCase() %}
  | %august {% d => d[0].value.toLowerCase() %}
  | %aug {% d => d[0].value.toLowerCase() %}
  | %september {% d => d[0].value.toLowerCase() %}
  | %sept {% d => d[0].value.toLowerCase() %}
  | %sep {% d => d[0].value.toLowerCase() %}
  | %october {% d => d[0].value.toLowerCase() %}
  | %oct {% d => d[0].value.toLowerCase() %}
  | %november {% d => d[0].value.toLowerCase() %}
  | %nov {% d => d[0].value.toLowerCase() %}
  | %december {% d => d[0].value.toLowerCase() %}
  | %dec {% d => d[0].value.toLowerCase() %}

# Season names
season_name ->
    %spring {% d => d[0].value.toLowerCase() %}
  | %summer {% d => d[0].value.toLowerCase() %}
  | %autumn {% d => d[0].value.toLowerCase() %}
  | %fall {% d => d[0].value.toLowerCase() %}
  | %winter {% d => d[0].value.toLowerCase() %}

# Spelled ordinal centuries
spelled_ordinal_century ->
    %first {% () => 1 %}
  | %second {% () => 2 %}
  | %third {% () => 3 %}
  | %fourth {% () => 4 %}
  | %fifth {% () => 5 %}
  | %sixth {% () => 6 %}
  | %seventh {% () => 7 %}
  | %eighth {% () => 8 %}
  | %ninth {% () => 9 %}
  | %tenth {% () => 10 %}
  | %eleventh {% () => 11 %}
  | %twelfth {% () => 12 %}
  | %thirteenth {% () => 13 %}
  | %fourteenth {% () => 14 %}
  | %fifteenth {% () => 15 %}
  | %sixteenth {% () => 16 %}
  | %seventeenth {% () => 17 %}
  | %eighteenth {% () => 18 %}
  | %nineteenth {% () => 19 %}
  | %twentieth {% () => 20 %}
  | %twenty %dash %first {% () => 21 %}

# Spelled number words (for "eighteen hundreds", etc.)
spelled_number_word ->
    %eighteen {% () => '18' %}
  | %seventeen {% () => '17' %}
  | %sixteen {% () => '16' %}
  | %fifteen {% () => '15' %}
  | %fourteen {% () => '14' %}
  | %thirteen {% () => '13' %}
  | %twelve {% () => '12' %}
  | %eleven {% () => '11' %}
  | %nineteen {% () => '19' %}
  | %twenty {% () => '20' %}

# Spelled centuries (returns century prefix)
spelled_century ->
    %nineteenth {% () => '18' %}
  | %eighteenth {% () => '17' %}
  | %seventeenth {% () => '16' %}
  | %sixteenth {% () => '15' %}
  | %fifteenth {% () => '14' %}
  | %twentieth {% () => '19' %}
  | %twenty %dash %first {% () => '20' %}

# Spelled decades (returns decade digit 0-9)
spelled_decade ->
    %sixties {% () => '6' %}
  | %fifties {% () => '5' %}
  | %forties {% () => '4' %}
  | %thirties {% () => '3' %}
  | %twenties {% () => '2' %}
  | %tens {% () => '1' %}
  | %seventies {% () => '7' %}
  | %eighties {% () => '8' %}
  | %nineties {% () => '9' %}

# Decade pattern: 1990s or 1990's
decade -> %number %decadeSuffix
  {% d => {
    const num = d[0].value;
    // Must be a 4-digit year ending in 0
    if (num.length === 4 && num.endsWith('0')) {
      return parseInt(num.substring(0, 3) + '0', 10);
    }
    return null;
  } %}

# ==========================================
# QUALIFIERS
# ==========================================

qualifier ->
    %questionMark {% () => '?' %}
  | %tilde {% () => '~' %}
  | %circa {% () => '~' %}
  | %circa %dot {% () => '~' %}
  | %ca {% () => '~' %}
  | %ca %dot {% () => '~' %}
  | %c %dot {% () => '~' %}
  | %c {% () => '~' %}
  | %about {% () => '~' %}
  | %around {% () => '~' %}
  | %near {% () => '~' %}
  | %approximately {% () => '~' %}
  | %possibly {% () => '?' %}
  | %maybe {% () => '?' %}
  | %perhaps {% () => '?' %}
  | %probably {% () => '?' %}
  | %uncertain {% () => '?' %}

# Parenthetical qualifications
parenthetical_qualification ->
    %lparen _ %uncertain %slash %approximate _ %rparen {% () => ({ type: 'global', qual: '%' }) %}
  | %lparen _ %uncertain __ %and __ %approximate _ %rparen {% () => ({ type: 'global', qual: '%' }) %}
  | %lparen _ %uncertain _ %rparen {% () => ({ type: 'global', qual: '?' }) %}
  | %lparen _ %approximate _ %rparen {% () => ({ type: 'global', qual: '~' }) %}
  | %lparen _ partial_qual_list _ %rparen {% d => ({ type: 'partial', quals: d[2] }) %}

partial_qual_list ->
    partial_qual _ %comma _ partial_qual_list {% d => ({ ...d[4], ...d[0] }) %}
  | partial_qual _ %comma _ partial_qual {% d => ({ ...d[0], ...d[4] }) %}
  | partial_qual {% id %}

partial_qual ->
    %year __ qual_type {% d => ({ year: d[2] }) %}
  | %month __ qual_type {% d => ({ month: d[2] }) %}
  | %day __ qual_type {% d => ({ day: d[2] }) %}

qual_type ->
    %uncertain %slash %approximate {% () => '%' %}
  | %uncertain {% () => '?' %}
  | %approximate {% () => '~' %}

# ==========================================
# TEMPORAL MODIFIERS
# ==========================================

temporal_modifier_word ->
    %early {% () => 'early' %}
  | %mid {% () => 'mid' %}
  | %late {% () => 'late' %}

combination_modifier ->
    %early __ %to __ %mid {% () => 'early-to-mid' %}
  | %early %dash %mid {% () => 'early-to-mid' %}
  | %early %dash %to %dash %mid {% () => 'early-to-mid' %}
  | %mid __ %to __ %late {% () => 'mid-to-late' %}
  | %mid %dash %late {% () => 'mid-to-late' %}
  | %mid %dash %to %dash %late {% () => 'mid-to-late' %}

modifier_sep -> __ {% id %} | %dash {% id %}

# Main temporal modifier rules
temporal_modifier ->
    # Month modifiers: "early March 2024"
    temporal_modifier_word modifier_sep month_name __ year_num
      {% d => ({ type: 'interval', edtf: buildMonthModifierInterval(d[4], months[d[2]], d[0]), confidence: 0.95 }) %}
  | temporal_modifier_word modifier_sep month_name _ %comma _ year_num
      {% d => ({ type: 'interval', edtf: buildMonthModifierInterval(d[6], months[d[2]], d[0]), confidence: 0.95 }) %}
  # Year modifiers: "early 1995"
  | temporal_modifier_word modifier_sep year_num
      {% d => ({ type: 'interval', edtf: buildYearModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  # Decade modifiers: "early 1990s"
  | temporal_modifier_word modifier_sep decade
      {% d => ({ type: 'interval', edtf: buildDecadeModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ temporal_modifier_word __ decade
      {% d => ({ type: 'interval', edtf: buildDecadeModifierInterval(d[4], d[2]), confidence: 0.95 }) %}
  | temporal_modifier_word __ %the __ decade
      {% d => ({ type: 'interval', edtf: buildDecadeModifierInterval(d[4], d[0]), confidence: 0.95 }) %}
  # Century modifiers: "early 20th century"
  | temporal_modifier_word modifier_sep ordinal_century __ century_word
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ temporal_modifier_word __ ordinal_century __ century_word
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[4], d[2]), confidence: 0.95 }) %}
  # Century with CE/AD: "early 20th century CE"
  | temporal_modifier_word modifier_sep ordinal_century __ century_word __ era_ce
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ temporal_modifier_word __ ordinal_century __ century_word __ era_ce
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[4], d[2]), confidence: 0.95 }) %}
  # Century with BCE/BC: "early 5th century BCE"
  | temporal_modifier_word modifier_sep ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'interval', edtf: buildBCECenturyModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ temporal_modifier_word __ ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'interval', edtf: buildBCECenturyModifierInterval(d[4], d[2]), confidence: 0.95 }) %}
  # Spelled ordinal century: "early twentieth century"
  | temporal_modifier_word modifier_sep spelled_ordinal_century __ century_word
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ temporal_modifier_word __ spelled_ordinal_century __ century_word
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[4], d[2]), confidence: 0.95 }) %}
  # Spelled decades: "early sixties"
  | temporal_modifier_word modifier_sep spelled_decade
      {% d => ({ type: 'interval', edtf: buildDecadeModifierInterval(1900 + parseInt(d[2], 10) * 10, d[0]), confidence: 0.9 }) %}
  | %the __ temporal_modifier_word __ spelled_decade
      {% d => ({ type: 'interval', edtf: buildDecadeModifierInterval(1900 + parseInt(d[4], 10) * 10, d[2]), confidence: 0.9 }) %}
  # Combination modifiers: "early-to-mid March 2024"
  | combination_modifier modifier_sep month_name __ year_num
      {% d => ({ type: 'interval', edtf: buildMonthCombinationInterval(d[4], months[d[2]], d[0]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep month_name _ %comma _ year_num
      {% d => ({ type: 'interval', edtf: buildMonthCombinationInterval(d[6], months[d[2]], d[0]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep year_num
      {% d => ({ type: 'interval', edtf: buildYearCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep decade
      {% d => ({ type: 'interval', edtf: buildDecadeCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ combination_modifier __ decade
      {% d => ({ type: 'interval', edtf: buildDecadeCombinationInterval(d[4], d[2]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep ordinal_century __ century_word
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ combination_modifier __ ordinal_century __ century_word
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[4], d[2]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep ordinal_century __ century_word __ era_ce
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ combination_modifier __ ordinal_century __ century_word __ era_ce
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[4], d[2]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'interval', edtf: buildBCECenturyCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ combination_modifier __ ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'interval', edtf: buildBCECenturyCombinationInterval(d[4], d[2]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep spelled_ordinal_century __ century_word
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ combination_modifier __ spelled_ordinal_century __ century_word
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[4], d[2]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep spelled_decade
      {% d => ({ type: 'interval', edtf: buildDecadeCombinationInterval(1900 + parseInt(d[2], 10) * 10, d[0]), confidence: 0.9 }) %}
  | %the __ combination_modifier __ spelled_decade
      {% d => ({ type: 'interval', edtf: buildDecadeCombinationInterval(1900 + parseInt(d[4], 10) * 10, d[2]), confidence: 0.9 }) %}

# ==========================================
# QUALIFIED TEMPORAL MODIFIERS
# ==========================================

qualified_temporal_modifier ->
    qualifier __ temporal_modifier_word modifier_sep decade
      {% d => {
        const baseEdtf = buildDecadeModifierInterval(d[4], d[2]);
        return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
      } %}
  | qualifier __ combination_modifier modifier_sep decade
      {% d => {
        const baseEdtf = buildDecadeCombinationInterval(d[4], d[2]);
        return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
      } %}
  | qualifier __ temporal_modifier_word modifier_sep year_num
      {% d => {
        const baseEdtf = buildYearModifierInterval(d[4], d[2]);
        return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
      } %}
  | qualifier __ temporal_modifier_word modifier_sep month_name __ year_num
      {% d => {
        const baseEdtf = buildMonthModifierInterval(d[6], months[d[4]], d[2]);
        return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
      } %}
  | qualifier __ temporal_modifier_word modifier_sep ordinal_century __ century_word
      {% d => {
        const baseEdtf = buildCenturyModifierInterval(d[4], d[2]);
        return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
      } %}
  | qualifier __ temporal_modifier_word modifier_sep spelled_decade
      {% d => {
        const baseEdtf = buildDecadeModifierInterval(1900 + parseInt(d[4], 10) * 10, d[2]);
        return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.85 };
      } %}

# ==========================================
# TEMPORAL MODIFIER INTERVAL VALUES
# (For use as interval endpoints)
# ==========================================

temporal_modifier_interval_value ->
    temporal_modifier_word modifier_sep decade
      {% d => ({ edtf: buildDecadeModifierInterval(d[2], d[0]) }) %}
  | %the __ temporal_modifier_word __ decade
      {% d => ({ edtf: buildDecadeModifierInterval(d[4], d[2]) }) %}
  | combination_modifier modifier_sep decade
      {% d => ({ edtf: buildDecadeCombinationInterval(d[2], d[0]) }) %}
  | %the __ combination_modifier __ decade
      {% d => ({ edtf: buildDecadeCombinationInterval(d[4], d[2]) }) %}
  | temporal_modifier_word modifier_sep year_num
      {% d => ({ edtf: buildYearModifierInterval(d[2], d[0]) }) %}
  | combination_modifier modifier_sep year_num
      {% d => ({ edtf: buildYearCombinationInterval(d[2], d[0]) }) %}
  | temporal_modifier_word modifier_sep month_name __ year_num
      {% d => ({ edtf: buildMonthModifierInterval(d[4], months[d[2]], d[0]) }) %}
  | temporal_modifier_word modifier_sep ordinal_century __ century_word
      {% d => ({ edtf: buildCenturyModifierInterval(d[2], d[0]) }) %}
  | %the __ temporal_modifier_word __ ordinal_century __ century_word
      {% d => ({ edtf: buildCenturyModifierInterval(d[4], d[2]) }) %}
  | combination_modifier modifier_sep ordinal_century __ century_word
      {% d => ({ edtf: buildCenturyCombinationInterval(d[2], d[0]) }) %}
  | %the __ combination_modifier __ ordinal_century __ century_word
      {% d => ({ edtf: buildCenturyCombinationInterval(d[4], d[2]) }) %}
  | temporal_modifier_word modifier_sep spelled_decade
      {% d => ({ edtf: buildDecadeModifierInterval(1900 + parseInt(d[2], 10) * 10, d[0]) }) %}
  | %the __ temporal_modifier_word __ spelled_decade
      {% d => ({ edtf: buildDecadeModifierInterval(1900 + parseInt(d[4], 10) * 10, d[2]) }) %}
  | combination_modifier modifier_sep spelled_decade
      {% d => ({ edtf: buildDecadeCombinationInterval(1900 + parseInt(d[2], 10) * 10, d[0]) }) %}
  | %the __ combination_modifier __ spelled_decade
      {% d => ({ edtf: buildDecadeCombinationInterval(1900 + parseInt(d[4], 10) * 10, d[2]) }) %}
  | temporal_modifier_word modifier_sep spelled_ordinal_century __ century_word
      {% d => ({ edtf: buildCenturyModifierInterval(d[2], d[0]) }) %}
  | %the __ temporal_modifier_word __ spelled_ordinal_century __ century_word
      {% d => ({ edtf: buildCenturyModifierInterval(d[4], d[2]) }) %}
  | combination_modifier modifier_sep spelled_ordinal_century __ century_word
      {% d => ({ edtf: buildCenturyCombinationInterval(d[2], d[0]) }) %}
  | %the __ combination_modifier __ spelled_ordinal_century __ century_word
      {% d => ({ edtf: buildCenturyCombinationInterval(d[4], d[2]) }) %}

qualified_temporal_modifier_interval_value ->
    qualifier __ temporal_modifier_word modifier_sep decade
      {% d => ({ edtf: applyQualifierToInterval(buildDecadeModifierInterval(d[4], d[2]), d[0]) }) %}
  | qualifier __ combination_modifier modifier_sep decade
      {% d => ({ edtf: applyQualifierToInterval(buildDecadeCombinationInterval(d[4], d[2]), d[0]) }) %}
  | qualifier __ temporal_modifier_word modifier_sep year_num
      {% d => ({ edtf: applyQualifierToInterval(buildYearModifierInterval(d[4], d[2]), d[0]) }) %}
  | qualifier __ temporal_modifier_word modifier_sep month_name __ year_num
      {% d => ({ edtf: applyQualifierToInterval(buildMonthModifierInterval(d[6], months[d[4]], d[2]), d[0]) }) %}
  | qualifier __ temporal_modifier_word modifier_sep ordinal_century __ century_word
      {% d => ({ edtf: applyQualifierToInterval(buildCenturyModifierInterval(d[4], d[2]), d[0]) }) %}
  | qualifier __ temporal_modifier_word modifier_sep spelled_decade
      {% d => ({ edtf: applyQualifierToInterval(buildDecadeModifierInterval(1900 + parseInt(d[4], 10) * 10, d[2]), d[0]) }) %}

# ==========================================
# HELPER RULES
# ==========================================

century_word -> %century {% id %} | %c %dot {% id %}

era_ce ->
    %ad {% id %}
  | %ce {% id %}
  | %a %dot _ %d %dot {% id %}
  | %c %dot _ %e %dot {% id %}
  | %anno __ %domini {% id %}
  | %common __ %era {% id %}

# Single letter "A" for AD (narrow form)
era_a -> %a {% id %}

era_bce ->
    %bc {% id %}
  | %bce {% id %}
  | %b %dot _ %c %dot {% id %}
  | %b %dot _ %c %dot _ %e %dot {% id %}
  | %before __ %christ {% id %}
  | %before __ %common __ %era {% id %}

# ==========================================
# INTERVALS
# ==========================================

interval ->
    temporal_modifier_interval_value __ interval_connector __ temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 }) %}
  | %from __ temporal_modifier_interval_value __ interval_connector __ temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 }) %}
  | temporal_modifier_interval_value _ %dash _ temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 }) %}
  | temporal_modifier_interval_value __ interval_connector __ datevalue
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + d[4].edtf, confidence: 0.95 }) %}
  | %from __ temporal_modifier_interval_value __ interval_connector __ datevalue
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + d[6].edtf, confidence: 0.95 }) %}
  | datevalue __ interval_connector __ temporal_modifier_interval_value
      {% d => {
        if (!d[0] || !d[0].edtf) return { __reject: true };
        return { type: 'interval', edtf: normalizeDecadeStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 };
      } %}
  | %from __ datevalue __ interval_connector __ temporal_modifier_interval_value
      {% d => {
        if (!d[2] || !d[2].edtf) return { __reject: true };
        return { type: 'interval', edtf: normalizeDecadeStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 };
      } %}
  | %between __ temporal_modifier_interval_value __ %and __ temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 }) %}
  | qualified_temporal_modifier_interval_value __ interval_connector __ temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 }) %}
  | qualified_temporal_modifier_interval_value __ interval_connector __ qualified_temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 }) %}
  | qualified_temporal_modifier_interval_value __ interval_connector __ datevalue
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + d[4].edtf, confidence: 0.95 }) %}
  | temporal_modifier_interval_value __ interval_connector __ qualified_temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 }) %}
  | datevalue __ interval_connector __ qualified_temporal_modifier_interval_value
      {% d => {
        if (!d[0] || !d[0].edtf) return { __reject: true };
        return { type: 'interval', edtf: normalizeDecadeStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 };
      } %}
  | %from __ qualified_temporal_modifier_interval_value __ interval_connector __ temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 }) %}
  | %from __ qualified_temporal_modifier_interval_value __ interval_connector __ qualified_temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 }) %}
  | %from __ qualified_temporal_modifier_interval_value __ interval_connector __ datevalue
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + d[6].edtf, confidence: 0.95 }) %}
  | %from __ temporal_modifier_interval_value __ interval_connector __ qualified_temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 }) %}
  | %from __ datevalue __ interval_connector __ qualified_temporal_modifier_interval_value
      {% d => {
        if (!d[2] || !d[2].edtf) return { __reject: true };
        return { type: 'interval', edtf: normalizeDecadeStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 };
      } %}
  | %between __ qualified_temporal_modifier_interval_value __ %and __ temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 }) %}
  | %between __ qualified_temporal_modifier_interval_value __ %and __ qualified_temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 }) %}
  | %between __ temporal_modifier_interval_value __ %and __ qualified_temporal_modifier_interval_value
      {% d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 }) %}
  # BCE year ranges
  | numeric_year _ %dash _ numeric_year __ era_bce
      {% d => {
        const startYear = parseInt(d[0], 10) - 1;
        const endYear = parseInt(d[4], 10) - 1;
        return { type: 'interval', edtf: `-${pad4(startYear)}/-${pad4(endYear)}`, confidence: 0.98 };
      } %}
  | numeric_year __ %to __ numeric_year __ era_bce
      {% d => {
        const startYear = parseInt(d[0], 10) - 1;
        const endYear = parseInt(d[4], 10) - 1;
        return { type: 'interval', edtf: `-${pad4(startYear)}/-${pad4(endYear)}`, confidence: 0.98 };
      } %}
  # CE year ranges
  | numeric_year _ %dash _ numeric_year __ era_ce
      {% d => ({ type: 'interval', edtf: `${pad4(parseInt(d[0], 10))}/${pad4(parseInt(d[4], 10))}`, confidence: 0.98 }) %}
  | numeric_year __ %to __ numeric_year __ era_ce
      {% d => ({ type: 'interval', edtf: `${pad4(parseInt(d[0], 10))}/${pad4(parseInt(d[4], 10))}`, confidence: 0.98 }) %}
  # Month ranges within a year
  | %from __ month_name __ %to __ month_name __ year_num
      {% d => ({ type: 'interval', edtf: `${pad4(d[8])}-${months[d[2]]}/${pad4(d[8])}-${months[d[6]]}`, confidence: 0.95 }) %}
  | month_name __ %to __ month_name __ year_num
      {% d => ({ type: 'interval', edtf: `${pad4(d[6])}-${months[d[0]]}/${pad4(d[6])}-${months[d[4]]}`, confidence: 0.9 }) %}
  | month_name _ %dash _ month_name __ year_num
      {% d => ({ type: 'interval', edtf: `${pad4(d[6])}-${months[d[0]]}/${pad4(d[6])}-${months[d[4]]}`, confidence: 0.9 }) %}
  # Open intervals
  | %before __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 }) %}
  | %earlier __ %than __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 }) %}
  | %prior __ %to __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 }) %}
  | %up __ %to __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 }) %}
  | %later __ %than __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[4].edtf}/..`, confidence: 0.95 }) %}
  | %from __ datevalue __ %onwards
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ %and __ %after
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ %or __ %later
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ %or __ %after
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  # Standard intervals
  | %from __ datevalue __ interval_connector __ datevalue
      {% d => {
        if (!d[2] || !d[2].edtf || !d[6] || !d[6].edtf) return { __reject: true };
        return {
          type: 'interval',
          edtf: `${normalizeDecadeStart(d[2].edtf)}/${normalizeDecadeEnd(d[6].edtf)}`,
          confidence: 0.95,
        };
      } %}
  | datevalue __ interval_connector __ datevalue
      {% d => {
        if (!d[0] || !d[0].edtf || !d[4] || !d[4].edtf) return { __reject: true };
        return {
          type: 'interval',
          edtf: `${normalizeDecadeStart(d[0].edtf)}/${normalizeDecadeEnd(d[4].edtf)}`,
          confidence: 0.95,
        };
      } %}
  | datevalue _ %dash _ datevalue
      {% d => {
        if (!d[0] || !d[0].edtf || !d[4] || !d[4].edtf) return { __reject: true };
        return {
          type: 'interval',
          edtf: `${normalizeDecadeStart(d[0].edtf)}/${normalizeDecadeEnd(d[4].edtf)}`,
          confidence: 0.95,
        };
      } %}
  | %between __ datevalue __ %and __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 }) %}
  # Unknown/open endpoints
  | %from __ datevalue __ %to __ interval_endpoint
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/`, confidence: 0.95 }) %}
  | %from __ datevalue __ %to __ open_endpoint
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}
  | datevalue __ %to __ interval_endpoint
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/`, confidence: 0.95 }) %}
  | datevalue __ %to __ open_endpoint
      {% d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 }) %}
  | open_endpoint __ %to __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 }) %}
  | interval_endpoint __ %to __ datevalue
      {% d => ({ type: 'interval', edtf: `/${d[4].edtf}`, confidence: 0.95 }) %}
  | %until __ datevalue
      {% d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 }) %}
  | %after __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}
  | %since __ datevalue
      {% d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 }) %}

interval_connector -> %to {% id %} | %through {% id %} | %until {% id %}

interval_endpoint -> %unknown {% () => '' %} | %questionMark {% () => '' %}

open_endpoint ->
    %open __ %start {% () => '..' %}
  | %open __ %end {% () => '..' %}
  | %onwards {% () => '..' %}

# ==========================================
# SETS (Level 2)
# ==========================================

set ->
    %one __ %of _ %colon _ datevalue _ %comma _ datevalue _ %comma _ datevalue
      {% d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf},${d[14].edtf}]`, confidence: 0.95 }) %}
  | %one __ %of _ %colon _ datevalue _ %comma _ datevalue
      {% d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf}]`, confidence: 0.95 }) %}
  | %either __ datevalue __ %or __ datevalue
      {% d => ({ type: 'set', edtf: `[${d[2].edtf},${d[6].edtf}]`, confidence: 0.95 }) %}
  | datevalue __ %or __ datevalue __ %or __ datevalue
      {% d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf},${d[8].edtf}]`, confidence: 0.9 }) %}
  | datevalue __ %or __ datevalue
      {% d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf}]`, confidence: 0.9 }) %}
  | datevalue __ %or __ %earlier
      {% d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 }) %}
  | datevalue __ %or __ %before
      {% d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 }) %}

# ==========================================
# LISTS (Level 2)
# ==========================================

list ->
    %all __ %of _ %colon _ datevalue _ %comma _ datevalue _ %comma _ datevalue
      {% d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf},${d[14].edtf}}`, confidence: 0.95 }) %}
  | %all __ %of _ %colon _ datevalue _ %comma _ datevalue
      {% d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf}}`, confidence: 0.95 }) %}
  | %both __ datevalue __ %and __ datevalue
      {% d => ({ type: 'list', edtf: `{${d[2].edtf},${d[6].edtf}}`, confidence: 0.95 }) %}
  | datevalue __ %and __ datevalue __ %and __ datevalue
      {% d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf},${d[8].edtf}}`, confidence: 0.9 }) %}
  | datevalue __ %and __ datevalue
      {% d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf}}`, confidence: 0.9 }) %}

# ==========================================
# SEASONS
# ==========================================

season ->
    # Northern Hemisphere seasons
    qualifier __ season_name __ hemisphere_north __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[6])}-${northernSeasons[d[2]]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ hemisphere_north __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${northernSeasons[d[0]]}`, confidence: 0.95 }) %}
  # Southern Hemisphere seasons
  | qualifier __ season_name __ hemisphere_south __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[6])}-${southernSeasons[d[2]]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ hemisphere_south __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${southernSeasons[d[0]]}`, confidence: 0.95 }) %}
  # Quarters
  | qualifier __ quarter_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | quarter_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Quadrimesters
  | qualifier __ quadrimester_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | quadrimester_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Semestrals
  | qualifier __ semestral_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | semestral_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Basic seasons
  | qualifier __ season_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${seasons[d[2]]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ year_num
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${seasons[d[0]]}`, confidence: 0.95 }) %}

hemisphere_north ->
    %lparen _ %northern __ %hemisphere _ %rparen {% () => 'north' %}
  | %lparen _ %north _ %rparen {% () => 'north' %}
  | %comma _ %northern __ %hemisphere {% () => 'north' %}
  | %comma _ %north {% () => 'north' %}

hemisphere_south ->
    %lparen _ %southern __ %hemisphere _ %rparen {% () => 'south' %}
  | %lparen _ %south _ %rparen {% () => 'south' %}
  | %comma _ %southern __ %hemisphere {% () => 'south' %}
  | %comma _ %south {% () => 'south' %}

quarter_name ->
    %q %number {% d => String(32 + parseInt(d[1].value, 10)) %}
  | %quarter __ %number {% d => String(32 + parseInt(d[2].value, 10)) %}
  | ordinal_num __ %quarter {% d => String(32 + d[0]) %}
  | %first __ %quarter {% () => '33' %}
  | %second __ %quarter {% () => '34' %}
  | %third __ %quarter {% () => '35' %}
  | %fourth __ %quarter {% () => '36' %}

quadrimester_name ->
    %quadrimester __ %number {% d => String(36 + parseInt(d[2].value, 10)) %}
  | ordinal_num __ %quadrimester {% d => String(36 + d[0]) %}
  | %first __ %quadrimester {% () => '37' %}
  | %second __ %quadrimester {% () => '38' %}
  | %third __ %quadrimester {% () => '39' %}

semestral_name ->
    %semestral __ %number {% d => String(39 + parseInt(d[2].value, 10)) %}
  | %semester __ %number {% d => String(39 + parseInt(d[2].value, 10)) %}
  | ordinal_num __ %semestral {% d => String(39 + d[0]) %}
  | ordinal_num __ %semester {% d => String(39 + d[0]) %}
  | %first __ %semestral {% () => '40' %}
  | %second __ %semestral {% () => '41' %}
  | %first __ %semester {% () => '40' %}
  | %second __ %semester {% () => '41' %}

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
          return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
        }
      } %}
  | qualifier _ datevalue_base
      {% d => ({ type: 'date', edtf: `${d[2].edtf}${d[0]}`, confidence: d[2].confidence * 0.95 }) %}
  | datevalue_base _ qualifier
      {% d => ({ type: 'date', edtf: `${d[0].edtf}${d[2]}`, confidence: d[0].confidence * 0.95 }) %}
  | datevalue_base {% id %}

datevalue_base ->
    # Year with "the year" prefix
    %the __ %year __ year_num
      {% d => ({ type: 'date', edtf: pad4(d[4]), confidence: 0.95 }) %}
  | %year __ year_num
      {% d => ({ type: 'date', edtf: pad4(d[2]), confidence: 0.95 }) %}
  | %inWord __ year_num
      {% d => ({ type: 'date', edtf: pad4(d[2]), confidence: 0.9 }) %}
  # Unspecified day in month
  | %sometime __ %inWord __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[4]]}-XX`, confidence: 0.9 }) %}
  | %some __ %day __ %inWord __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6]]}-XX`, confidence: 0.9 }) %}
  | %a __ %day __ %inWord __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6]]}-XX`, confidence: 0.9 }) %}
  # Unspecified month/day in year
  | %sometime __ %inWord __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-XX-XX`, confidence: 0.9 }) %}
  | %some __ %month __ %inWord __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-XX`, confidence: 0.9 }) %}
  | %a __ %month __ %inWord __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-XX`, confidence: 0.9 }) %}
  # BCE/BC dates (full spelled out)
  | numeric_year __ %before __ %common __ %era
      {% d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.95 }) %}
  | numeric_year __ %before __ %christ
      {% d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.95 }) %}
  # Anno Domini
  | %anno __ %domini __ numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[4], 10)), confidence: 0.95 }) %}
  | numeric_year __ %anno __ %domini
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 }) %}
  # Common Era
  | %common __ %era __ numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[4], 10)), confidence: 0.95 }) %}
  | numeric_year __ %common __ %era
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 }) %}
  # Short BCE/BC
  | numeric_year __ era_bce
      {% d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.95 }) %}
  | numeric_year __ %b
      {% d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.9 }) %}
  # Short CE/AD
  | era_ce __ numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[2], 10)), confidence: 0.95 }) %}
  | numeric_year __ era_ce
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 }) %}
  # Narrow "A" for AD
  | era_a __ numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[2], 10)), confidence: 0.85 }) %}
  | numeric_year __ era_a
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.85 }) %}
  # No-space era markers: 44BC, BC44, 79AD, AD79
  | numeric_year %bc
      {% d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.9 }) %}
  | numeric_year %bce
      {% d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.9 }) %}
  | %bc numeric_year
      {% d => ({ type: 'date', edtf: `-${pad4(parseInt(d[1], 10) - 1)}`, confidence: 0.9 }) %}
  | %bce numeric_year
      {% d => ({ type: 'date', edtf: `-${pad4(parseInt(d[1], 10) - 1)}`, confidence: 0.9 }) %}
  | numeric_year %ad
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.9 }) %}
  | numeric_year %ce
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.9 }) %}
  | %ad numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[1], 10)), confidence: 0.9 }) %}
  | %ce numeric_year
      {% d => ({ type: 'date', edtf: pad4(parseInt(d[1], 10)), confidence: 0.9 }) %}
  # Full dates with ordinal day: "on the 5th of March, 2024"
  | %on __ %the __ ordinal_day __ %of __ month_name _ %comma _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[12])}-${months[d[8]]}-${pad2(d[4])}`, confidence: 0.95 }) %}
  | %on __ %the __ ordinal_day __ %of __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[10])}-${months[d[8]]}-${pad2(d[4])}`, confidence: 0.95 }) %}
  | %the __ ordinal_day __ %of __ month_name _ %comma _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[10])}-${months[d[6]]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | %the __ ordinal_day __ %of __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6]]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | ordinal_day __ %of __ month_name _ %comma _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[4]]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  | ordinal_day __ %of __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[4]]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  # Month the Nth: "March the 5th, 2024"
  | month_name __ %the __ ordinal_day _ %comma _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[0]]}-${pad2(d[4])}`, confidence: 0.95 }) %}
  | month_name __ %the __ ordinal_day __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0]]}-${pad2(d[4])}`, confidence: 0.95 }) %}
  | month_name __ ordinal_day _ %comma _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0]]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | month_name __ ordinal_day __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[0]]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  # Day Month Year
  | ordinal_day __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[2]]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  # Month Day Year (with comma or space)
  | month_name __ day_num _ %comma _ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0]]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | month_name __ day_num __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[0]]}-${pad2(d[2])}`, confidence: 0.95 }) %}
  | day_num __ month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[2]]}-${pad2(d[0])}`, confidence: 0.95 }) %}
  # Month Year
  | month_name __ year_num
      {% d => ({ type: 'date', edtf: `${pad4(d[2])}-${months[d[0]]}`, confidence: 0.95 }) %}
  # Decades: "the 1960s" -> 196X, "the 1800s" -> 18XX (century) or 180X (decade)
  | %the __ %number %decadeSuffix
      {% d => {
        const num = d[2].value;
        if (num.length === 4) {
          if (num.endsWith('00')) {
            // Century interpretation: 1800s -> 18XX
            return { type: 'date', edtf: `${num.substring(0, 2)}XX`, confidence: 0.98 };
          }
          // Regular decade: 1960s -> 196X
          return { type: 'date', edtf: `${num.substring(0, 3)}X`, confidence: 0.95 };
        }
        return null;
      } %}
  # Decades: "the 1800s" -> 180X (secondary interpretation for ambiguous X00s)
  # Use reject instead of null to avoid parse errors
  | %the __ %number %decadeSuffix
      {% d => {
        const num = d[2].value;
        if (num.length === 4 && num.endsWith('00')) {
          return { type: 'date', edtf: `${num.substring(0, 3)}X`, confidence: 0.9 };
        }
        // Return reject to indicate this rule doesn't apply
        return { __reject: true };
      } %}
  # Decades: "1960s" -> 196X, "1800s" -> 18XX (century) or 180X (decade)
  | %number %decadeSuffix
      {% d => {
        const num = d[0].value;
        if (num.length === 4) {
          if (num.endsWith('00')) {
            // Century interpretation: 1800s -> 18XX
            return { type: 'date', edtf: `${num.substring(0, 2)}XX`, confidence: 0.98 };
          }
          // Regular decade: 1960s -> 196X
          return { type: 'date', edtf: `${num.substring(0, 3)}X`, confidence: 0.95 };
        }
        // Two-digit decade: 60s
        if (num.length === 2) {
          const year = parseInt(num, 10);
          const fullYear = year >= 30 ? 1900 + year : 2000 + year;
          return { type: 'date', edtf: `${String(fullYear).substring(0, 3)}X`, confidence: 0.9 };
        }
        return null;
      } %}
  # Decades: "1800s" -> 180X (secondary interpretation for ambiguous X00s)
  # Use reject instead of null to avoid parse errors
  | %number %decadeSuffix
      {% d => {
        const num = d[0].value;
        if (num.length === 4 && num.endsWith('00')) {
          return { type: 'date', edtf: `${num.substring(0, 3)}X`, confidence: 0.9 };
        }
        // Return reject to indicate this rule doesn't apply
        return { __reject: true };
      } %}
  # Two-digit decades: '60s, the '60s
  | %the __ %apostrophe %number %decadeSuffix
      {% d => ({ type: 'date', edtf: `19${d[3].value.substring(0, 1)}X`, confidence: 0.9 }) %}
  | %apostrophe %number %decadeSuffix
      {% d => ({ type: 'date', edtf: `19${d[1].value.substring(0, 1)}X`, confidence: 0.9 }) %}
  # Century expressions with BCE/BC
  | %the __ ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'date', edtf: `-${String(d[2] - 1).padStart(2, '0')}XX`, confidence: 0.95 }) %}
  | ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'date', edtf: `-${String(d[0] - 1).padStart(2, '0')}XX`, confidence: 0.95 }) %}
  | %the __ spelled_ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'date', edtf: `-${String(d[2] - 1).padStart(2, '0')}XX`, confidence: 0.95 }) %}
  | spelled_ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'date', edtf: `-${String(d[0] - 1).padStart(2, '0')}XX`, confidence: 0.95 }) %}
  | %the __ spelled_century __ %century __ era_bce
      {% d => ({ type: 'date', edtf: `-${d[2]}XX`, confidence: 0.95 }) %}
  | spelled_century __ %century __ era_bce
      {% d => ({ type: 'date', edtf: `-${d[0]}XX`, confidence: 0.95 }) %}
  # Century expressions with CE/AD
  | %the __ ordinal_century __ century_word __ era_ce
      {% d => ({ type: 'date', edtf: `${String((d[2] - 1) * 100).substring(0, 2)}XX`, confidence: 0.95 }) %}
  | ordinal_century __ century_word __ era_ce
      {% d => ({ type: 'date', edtf: `${String((d[0] - 1) * 100).substring(0, 2)}XX`, confidence: 0.95 }) %}
  | %the __ spelled_century __ %century __ era_ce
      {% d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 }) %}
  | spelled_century __ %century __ era_ce
      {% d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 }) %}
  # Century expressions (no era)
  | %the __ ordinal_century __ century_word
      {% d => ({ type: 'date', edtf: `${String((d[2] - 1) * 100).substring(0, 2)}XX`, confidence: 0.95 }) %}
  | ordinal_century __ century_word
      {% d => ({ type: 'date', edtf: `${String((d[0] - 1) * 100).substring(0, 2)}XX`, confidence: 0.95 }) %}
  | %the __ spelled_century __ %century
      {% d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 }) %}
  | spelled_century __ %century
      {% d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 }) %}
  # Spelled number "hundreds": "the eighteen hundreds"
  | %the __ spelled_number_word __ %hundreds
      {% d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 }) %}
  | spelled_number_word __ %hundreds
      {% d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 }) %}
  # Spelled decades: "the sixties"
  | %the __ spelled_decade
      {% d => ({ type: 'date', edtf: `19${d[2]}X`, confidence: 0.9 }) %}
  | spelled_decade
      {% d => ({ type: 'date', edtf: `19${d[0]}X`, confidence: 0.9 }) %}
  # Slash dates: MM/YYYY (e.g., 3/2024)
  | %number %slash %number
      {% d => {
        const first = parseInt(d[0].value, 10);
        const second = d[2].value;
        // If second is 4 digits and first is 1-12, treat as MM/YYYY
        if (second.length === 4 && first >= 1 && first <= 12) {
          return { type: 'date', edtf: `${second}-${pad2(first)}`, confidence: 0.9 };
        }
        // If second is 2 digits and first is 1-12, treat as MM/YY
        if (second.length === 2 && first >= 1 && first <= 12) {
          return { type: 'date', edtf: `${twoDigitYear(second)}-${pad2(first)}`, confidence: 0.85 };
        }
        return null;
      } %}
  # Slash dates: MM/DD/YYYY or DD/MM/YYYY
  | %number %slash %number %slash %number
      {% d => {
        const first = d[0].value;
        const second = d[2].value;
        const third = d[4].value;
        // Third part should be the year
        const yearStr = third.length === 2 ? String(twoDigitYear(third)) : third;
        return buildSlashDate(first, second, yearStr);
      } %}
  # Year with -ish suffix
  | year_num %ish
      {% d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 }) %}
  | year_num _ %dash %ish
      {% d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 }) %}
  # Plain year
  | year_num
      {% d => ({ type: 'date', edtf: pad4(d[0]), confidence: 0.95 }) %}
