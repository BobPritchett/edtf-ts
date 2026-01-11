import moo from "moo";
// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
var grammar_export = (function() {
function id(x) { return x[0]; }



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
var grammar = {
    Lexer: lexer as any,
    ParserRules: [
    {"name": "main", "symbols": ["_", "value", "_"], "postprocess": d => d[1]},
    {"name": "value", "symbols": ["interval"], "postprocess": id},
    {"name": "value", "symbols": ["qualified_temporal_modifier"], "postprocess": id},
    {"name": "value", "symbols": ["temporal_modifier"], "postprocess": id},
    {"name": "value", "symbols": ["set"], "postprocess": id},
    {"name": "value", "symbols": ["list"], "postprocess": id},
    {"name": "value", "symbols": ["season"], "postprocess": id},
    {"name": "value", "symbols": ["date"], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => null},
    {"name": "__$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": () => null},
    {"name": "year_4digit", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => d[0].value},
    {"name": "year_num", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => d[0].value},
    {"name": "numeric_year", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => d[0].value},
    {"name": "day_num", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": d => parseInt(d[0].value, 10)},
    {"name": "ordinal_num", "symbols": [(lexer.has("number") ? {type: "number"} : number), (lexer.has("ordinalSuffix") ? {type: "ordinalSuffix"} : ordinalSuffix)], "postprocess": d => parseInt(d[0].value, 10)},
    {"name": "ordinal_day", "symbols": ["ordinal_num"], "postprocess": id},
    {"name": "ordinal_century", "symbols": ["ordinal_num"], "postprocess": id},
    {"name": "month_name", "symbols": [(lexer.has("january") ? {type: "january"} : january)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("jan") ? {type: "jan"} : jan)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("february") ? {type: "february"} : february)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("feb") ? {type: "feb"} : feb)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("march") ? {type: "march"} : march)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("mar") ? {type: "mar"} : mar)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("april") ? {type: "april"} : april)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("apr") ? {type: "apr"} : apr)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("may") ? {type: "may"} : may)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("june") ? {type: "june"} : june)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("jun") ? {type: "jun"} : jun)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("july") ? {type: "july"} : july)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("jul") ? {type: "jul"} : jul)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("august") ? {type: "august"} : august)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("aug") ? {type: "aug"} : aug)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("september") ? {type: "september"} : september)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("sept") ? {type: "sept"} : sept)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("sep") ? {type: "sep"} : sep)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("october") ? {type: "october"} : october)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("oct") ? {type: "oct"} : oct)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("november") ? {type: "november"} : november)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("nov") ? {type: "nov"} : nov)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("december") ? {type: "december"} : december)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "month_name", "symbols": [(lexer.has("dec") ? {type: "dec"} : dec)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "season_name", "symbols": [(lexer.has("spring") ? {type: "spring"} : spring)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "season_name", "symbols": [(lexer.has("summer") ? {type: "summer"} : summer)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "season_name", "symbols": [(lexer.has("autumn") ? {type: "autumn"} : autumn)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "season_name", "symbols": [(lexer.has("fall") ? {type: "fall"} : fall)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "season_name", "symbols": [(lexer.has("winter") ? {type: "winter"} : winter)], "postprocess": d => d[0].value.toLowerCase()},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("first") ? {type: "first"} : first)], "postprocess": () => 1},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("second") ? {type: "second"} : second)], "postprocess": () => 2},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("third") ? {type: "third"} : third)], "postprocess": () => 3},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("fourth") ? {type: "fourth"} : fourth)], "postprocess": () => 4},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("fifth") ? {type: "fifth"} : fifth)], "postprocess": () => 5},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("sixth") ? {type: "sixth"} : sixth)], "postprocess": () => 6},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("seventh") ? {type: "seventh"} : seventh)], "postprocess": () => 7},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("eighth") ? {type: "eighth"} : eighth)], "postprocess": () => 8},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("ninth") ? {type: "ninth"} : ninth)], "postprocess": () => 9},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("tenth") ? {type: "tenth"} : tenth)], "postprocess": () => 10},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("eleventh") ? {type: "eleventh"} : eleventh)], "postprocess": () => 11},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("twelfth") ? {type: "twelfth"} : twelfth)], "postprocess": () => 12},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("thirteenth") ? {type: "thirteenth"} : thirteenth)], "postprocess": () => 13},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("fourteenth") ? {type: "fourteenth"} : fourteenth)], "postprocess": () => 14},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("fifteenth") ? {type: "fifteenth"} : fifteenth)], "postprocess": () => 15},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("sixteenth") ? {type: "sixteenth"} : sixteenth)], "postprocess": () => 16},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("seventeenth") ? {type: "seventeenth"} : seventeenth)], "postprocess": () => 17},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("eighteenth") ? {type: "eighteenth"} : eighteenth)], "postprocess": () => 18},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("nineteenth") ? {type: "nineteenth"} : nineteenth)], "postprocess": () => 19},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("twentieth") ? {type: "twentieth"} : twentieth)], "postprocess": () => 20},
    {"name": "spelled_ordinal_century", "symbols": [(lexer.has("twenty") ? {type: "twenty"} : twenty), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("first") ? {type: "first"} : first)], "postprocess": () => 21},
    {"name": "spelled_number_word", "symbols": [(lexer.has("eighteen") ? {type: "eighteen"} : eighteen)], "postprocess": () => '18'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("seventeen") ? {type: "seventeen"} : seventeen)], "postprocess": () => '17'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("sixteen") ? {type: "sixteen"} : sixteen)], "postprocess": () => '16'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("fifteen") ? {type: "fifteen"} : fifteen)], "postprocess": () => '15'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("fourteen") ? {type: "fourteen"} : fourteen)], "postprocess": () => '14'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("thirteen") ? {type: "thirteen"} : thirteen)], "postprocess": () => '13'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("twelve") ? {type: "twelve"} : twelve)], "postprocess": () => '12'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("eleven") ? {type: "eleven"} : eleven)], "postprocess": () => '11'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("nineteen") ? {type: "nineteen"} : nineteen)], "postprocess": () => '19'},
    {"name": "spelled_number_word", "symbols": [(lexer.has("twenty") ? {type: "twenty"} : twenty)], "postprocess": () => '20'},
    {"name": "spelled_century", "symbols": [(lexer.has("nineteenth") ? {type: "nineteenth"} : nineteenth)], "postprocess": () => '18'},
    {"name": "spelled_century", "symbols": [(lexer.has("eighteenth") ? {type: "eighteenth"} : eighteenth)], "postprocess": () => '17'},
    {"name": "spelled_century", "symbols": [(lexer.has("seventeenth") ? {type: "seventeenth"} : seventeenth)], "postprocess": () => '16'},
    {"name": "spelled_century", "symbols": [(lexer.has("sixteenth") ? {type: "sixteenth"} : sixteenth)], "postprocess": () => '15'},
    {"name": "spelled_century", "symbols": [(lexer.has("fifteenth") ? {type: "fifteenth"} : fifteenth)], "postprocess": () => '14'},
    {"name": "spelled_century", "symbols": [(lexer.has("twentieth") ? {type: "twentieth"} : twentieth)], "postprocess": () => '19'},
    {"name": "spelled_century", "symbols": [(lexer.has("twenty") ? {type: "twenty"} : twenty), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("first") ? {type: "first"} : first)], "postprocess": () => '20'},
    {"name": "spelled_decade", "symbols": [(lexer.has("sixties") ? {type: "sixties"} : sixties)], "postprocess": () => '6'},
    {"name": "spelled_decade", "symbols": [(lexer.has("fifties") ? {type: "fifties"} : fifties)], "postprocess": () => '5'},
    {"name": "spelled_decade", "symbols": [(lexer.has("forties") ? {type: "forties"} : forties)], "postprocess": () => '4'},
    {"name": "spelled_decade", "symbols": [(lexer.has("thirties") ? {type: "thirties"} : thirties)], "postprocess": () => '3'},
    {"name": "spelled_decade", "symbols": [(lexer.has("twenties") ? {type: "twenties"} : twenties)], "postprocess": () => '2'},
    {"name": "spelled_decade", "symbols": [(lexer.has("tens") ? {type: "tens"} : tens)], "postprocess": () => '1'},
    {"name": "spelled_decade", "symbols": [(lexer.has("seventies") ? {type: "seventies"} : seventies)], "postprocess": () => '7'},
    {"name": "spelled_decade", "symbols": [(lexer.has("eighties") ? {type: "eighties"} : eighties)], "postprocess": () => '8'},
    {"name": "spelled_decade", "symbols": [(lexer.has("nineties") ? {type: "nineties"} : nineties)], "postprocess": () => '9'},
    {"name": "decade", "symbols": [(lexer.has("number") ? {type: "number"} : number), (lexer.has("decadeSuffix") ? {type: "decadeSuffix"} : decadeSuffix)], "postprocess":  d => {
          const num = d[0].value;
          // Must be a 4-digit year ending in 0
          if (num.length === 4 && num.endsWith('0')) {
            return parseInt(num.substring(0, 3) + '0', 10);
          }
          return null;
        } },
    {"name": "qualifier", "symbols": [(lexer.has("questionMark") ? {type: "questionMark"} : questionMark)], "postprocess": () => '?'},
    {"name": "qualifier", "symbols": [(lexer.has("tilde") ? {type: "tilde"} : tilde)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("circa") ? {type: "circa"} : circa)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("circa") ? {type: "circa"} : circa), (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("ca") ? {type: "ca"} : ca)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("ca") ? {type: "ca"} : ca), (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("c") ? {type: "c"} : c), (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("c") ? {type: "c"} : c)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("about") ? {type: "about"} : about)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("around") ? {type: "around"} : around)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("near") ? {type: "near"} : near)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("approximately") ? {type: "approximately"} : approximately)], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [(lexer.has("possibly") ? {type: "possibly"} : possibly)], "postprocess": () => '?'},
    {"name": "qualifier", "symbols": [(lexer.has("maybe") ? {type: "maybe"} : maybe)], "postprocess": () => '?'},
    {"name": "qualifier", "symbols": [(lexer.has("perhaps") ? {type: "perhaps"} : perhaps)], "postprocess": () => '?'},
    {"name": "qualifier", "symbols": [(lexer.has("probably") ? {type: "probably"} : probably)], "postprocess": () => '?'},
    {"name": "qualifier", "symbols": [(lexer.has("uncertain") ? {type: "uncertain"} : uncertain)], "postprocess": () => '?'},
    {"name": "parenthetical_qualification", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("uncertain") ? {type: "uncertain"} : uncertain), (lexer.has("slash") ? {type: "slash"} : slash), (lexer.has("approximate") ? {type: "approximate"} : approximate), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": () => ({ type: 'global', qual: '%' })},
    {"name": "parenthetical_qualification", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("uncertain") ? {type: "uncertain"} : uncertain), "__", (lexer.has("and") ? {type: "and"} : and), "__", (lexer.has("approximate") ? {type: "approximate"} : approximate), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": () => ({ type: 'global', qual: '%' })},
    {"name": "parenthetical_qualification", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("uncertain") ? {type: "uncertain"} : uncertain), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": () => ({ type: 'global', qual: '?' })},
    {"name": "parenthetical_qualification", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("approximate") ? {type: "approximate"} : approximate), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": () => ({ type: 'global', qual: '~' })},
    {"name": "parenthetical_qualification", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "partial_qual_list", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => ({ type: 'partial', quals: d[2] })},
    {"name": "partial_qual_list", "symbols": ["partial_qual", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "partial_qual_list"], "postprocess": d => ({ ...d[4], ...d[0] })},
    {"name": "partial_qual_list", "symbols": ["partial_qual", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "partial_qual"], "postprocess": d => ({ ...d[0], ...d[4] })},
    {"name": "partial_qual_list", "symbols": ["partial_qual"], "postprocess": id},
    {"name": "partial_qual", "symbols": [(lexer.has("year") ? {type: "year"} : year), "__", "qual_type"], "postprocess": d => ({ year: d[2] })},
    {"name": "partial_qual", "symbols": [(lexer.has("month") ? {type: "month"} : month), "__", "qual_type"], "postprocess": d => ({ month: d[2] })},
    {"name": "partial_qual", "symbols": [(lexer.has("day") ? {type: "day"} : day), "__", "qual_type"], "postprocess": d => ({ day: d[2] })},
    {"name": "qual_type", "symbols": [(lexer.has("uncertain") ? {type: "uncertain"} : uncertain), (lexer.has("slash") ? {type: "slash"} : slash), (lexer.has("approximate") ? {type: "approximate"} : approximate)], "postprocess": () => '%'},
    {"name": "qual_type", "symbols": [(lexer.has("uncertain") ? {type: "uncertain"} : uncertain)], "postprocess": () => '?'},
    {"name": "qual_type", "symbols": [(lexer.has("approximate") ? {type: "approximate"} : approximate)], "postprocess": () => '~'},
    {"name": "temporal_modifier_word", "symbols": [(lexer.has("early") ? {type: "early"} : early)], "postprocess": () => 'early'},
    {"name": "temporal_modifier_word", "symbols": [(lexer.has("mid") ? {type: "mid"} : mid)], "postprocess": () => 'mid'},
    {"name": "temporal_modifier_word", "symbols": [(lexer.has("late") ? {type: "late"} : late)], "postprocess": () => 'late'},
    {"name": "combination_modifier", "symbols": [(lexer.has("early") ? {type: "early"} : early), "__", (lexer.has("to") ? {type: "to"} : to), "__", (lexer.has("mid") ? {type: "mid"} : mid)], "postprocess": () => 'early-to-mid'},
    {"name": "combination_modifier", "symbols": [(lexer.has("early") ? {type: "early"} : early), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("mid") ? {type: "mid"} : mid)], "postprocess": () => 'early-to-mid'},
    {"name": "combination_modifier", "symbols": [(lexer.has("early") ? {type: "early"} : early), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("to") ? {type: "to"} : to), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("mid") ? {type: "mid"} : mid)], "postprocess": () => 'early-to-mid'},
    {"name": "combination_modifier", "symbols": [(lexer.has("mid") ? {type: "mid"} : mid), "__", (lexer.has("to") ? {type: "to"} : to), "__", (lexer.has("late") ? {type: "late"} : late)], "postprocess": () => 'mid-to-late'},
    {"name": "combination_modifier", "symbols": [(lexer.has("mid") ? {type: "mid"} : mid), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("late") ? {type: "late"} : late)], "postprocess": () => 'mid-to-late'},
    {"name": "combination_modifier", "symbols": [(lexer.has("mid") ? {type: "mid"} : mid), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("to") ? {type: "to"} : to), (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("late") ? {type: "late"} : late)], "postprocess": () => 'mid-to-late'},
    {"name": "modifier_sep", "symbols": ["__"], "postprocess": id},
    {"name": "modifier_sep", "symbols": [(lexer.has("dash") ? {type: "dash"} : dash)], "postprocess": id},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'interval', edtf: buildMonthModifierInterval(d[4], months[d[2]], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "month_name", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year_num"], "postprocess": d => ({ type: 'interval', edtf: buildMonthModifierInterval(d[6], months[d[2]], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "year_num"], "postprocess": d => ({ type: 'interval', edtf: buildYearModifierInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeModifierInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeModifierInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "__", (lexer.has("the") ? {type: "the"} : the), "__", "decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeModifierInterval(d[4], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "century_word", "__", "era_ce"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "ordinal_century", "__", "century_word", "__", "era_ce"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "century_word", "__", "era_bce"], "postprocess": d => ({ type: 'interval', edtf: buildBCECenturyModifierInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "ordinal_century", "__", "century_word", "__", "era_bce"], "postprocess": d => ({ type: 'interval', edtf: buildBCECenturyModifierInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "spelled_ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "spelled_ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "spelled_decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeModifierInterval(1900 + parseInt(d[2], 10) * 10, d[0]), confidence: 0.9 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "spelled_decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeModifierInterval(1900 + parseInt(d[4], 10) * 10, d[2]), confidence: 0.9 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'interval', edtf: buildMonthCombinationInterval(d[4], months[d[2]], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "month_name", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year_num"], "postprocess": d => ({ type: 'interval', edtf: buildMonthCombinationInterval(d[6], months[d[2]], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "year_num"], "postprocess": d => ({ type: 'interval', edtf: buildYearCombinationInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeCombinationInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeCombinationInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "ordinal_century", "__", "century_word", "__", "era_ce"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "ordinal_century", "__", "century_word", "__", "era_ce"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "ordinal_century", "__", "century_word", "__", "era_bce"], "postprocess": d => ({ type: 'interval', edtf: buildBCECenturyCombinationInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "ordinal_century", "__", "century_word", "__", "era_bce"], "postprocess": d => ({ type: 'interval', edtf: buildBCECenturyCombinationInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "spelled_ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[2], d[0]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "spelled_ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[4], d[2]), confidence: 0.95 })},
    {"name": "temporal_modifier", "symbols": ["combination_modifier", "modifier_sep", "spelled_decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeCombinationInterval(1900 + parseInt(d[2], 10) * 10, d[0]), confidence: 0.9 })},
    {"name": "temporal_modifier", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "spelled_decade"], "postprocess": d => ({ type: 'interval', edtf: buildDecadeCombinationInterval(1900 + parseInt(d[4], 10) * 10, d[2]), confidence: 0.9 })},
    {"name": "qualified_temporal_modifier", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "decade"], "postprocess":  d => {
          const baseEdtf = buildDecadeModifierInterval(d[4], d[2]);
          return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
        } },
    {"name": "qualified_temporal_modifier", "symbols": ["qualifier", "__", "combination_modifier", "modifier_sep", "decade"], "postprocess":  d => {
          const baseEdtf = buildDecadeCombinationInterval(d[4], d[2]);
          return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
        } },
    {"name": "qualified_temporal_modifier", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "year_num"], "postprocess":  d => {
          const baseEdtf = buildYearModifierInterval(d[4], d[2]);
          return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
        } },
    {"name": "qualified_temporal_modifier", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "month_name", "__", "year_num"], "postprocess":  d => {
          const baseEdtf = buildMonthModifierInterval(d[6], months[d[4]], d[2]);
          return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
        } },
    {"name": "qualified_temporal_modifier", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "century_word"], "postprocess":  d => {
          const baseEdtf = buildCenturyModifierInterval(d[4], d[2]);
          return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.9 };
        } },
    {"name": "qualified_temporal_modifier", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "spelled_decade"], "postprocess":  d => {
          const baseEdtf = buildDecadeModifierInterval(1900 + parseInt(d[4], 10) * 10, d[2]);
          return { type: 'interval', edtf: applyQualifierToInterval(baseEdtf, d[0]), confidence: 0.85 };
        } },
    {"name": "temporal_modifier_interval_value", "symbols": ["temporal_modifier_word", "modifier_sep", "decade"], "postprocess": d => ({ edtf: buildDecadeModifierInterval(d[2], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "decade"], "postprocess": d => ({ edtf: buildDecadeModifierInterval(d[4], d[2]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["combination_modifier", "modifier_sep", "decade"], "postprocess": d => ({ edtf: buildDecadeCombinationInterval(d[2], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "decade"], "postprocess": d => ({ edtf: buildDecadeCombinationInterval(d[4], d[2]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["temporal_modifier_word", "modifier_sep", "year_num"], "postprocess": d => ({ edtf: buildYearModifierInterval(d[2], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["combination_modifier", "modifier_sep", "year_num"], "postprocess": d => ({ edtf: buildYearCombinationInterval(d[2], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["temporal_modifier_word", "modifier_sep", "month_name", "__", "year_num"], "postprocess": d => ({ edtf: buildMonthModifierInterval(d[4], months[d[2]], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: buildCenturyModifierInterval(d[2], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: buildCenturyModifierInterval(d[4], d[2]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["combination_modifier", "modifier_sep", "ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: buildCenturyCombinationInterval(d[2], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: buildCenturyCombinationInterval(d[4], d[2]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["temporal_modifier_word", "modifier_sep", "spelled_decade"], "postprocess": d => ({ edtf: buildDecadeModifierInterval(1900 + parseInt(d[2], 10) * 10, d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "spelled_decade"], "postprocess": d => ({ edtf: buildDecadeModifierInterval(1900 + parseInt(d[4], 10) * 10, d[2]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["combination_modifier", "modifier_sep", "spelled_decade"], "postprocess": d => ({ edtf: buildDecadeCombinationInterval(1900 + parseInt(d[2], 10) * 10, d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "spelled_decade"], "postprocess": d => ({ edtf: buildDecadeCombinationInterval(1900 + parseInt(d[4], 10) * 10, d[2]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["temporal_modifier_word", "modifier_sep", "spelled_ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: buildCenturyModifierInterval(d[2], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "temporal_modifier_word", "__", "spelled_ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: buildCenturyModifierInterval(d[4], d[2]) })},
    {"name": "temporal_modifier_interval_value", "symbols": ["combination_modifier", "modifier_sep", "spelled_ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: buildCenturyCombinationInterval(d[2], d[0]) })},
    {"name": "temporal_modifier_interval_value", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "combination_modifier", "__", "spelled_ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: buildCenturyCombinationInterval(d[4], d[2]) })},
    {"name": "qualified_temporal_modifier_interval_value", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "decade"], "postprocess": d => ({ edtf: applyQualifierToInterval(buildDecadeModifierInterval(d[4], d[2]), d[0]) })},
    {"name": "qualified_temporal_modifier_interval_value", "symbols": ["qualifier", "__", "combination_modifier", "modifier_sep", "decade"], "postprocess": d => ({ edtf: applyQualifierToInterval(buildDecadeCombinationInterval(d[4], d[2]), d[0]) })},
    {"name": "qualified_temporal_modifier_interval_value", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "year_num"], "postprocess": d => ({ edtf: applyQualifierToInterval(buildYearModifierInterval(d[4], d[2]), d[0]) })},
    {"name": "qualified_temporal_modifier_interval_value", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "month_name", "__", "year_num"], "postprocess": d => ({ edtf: applyQualifierToInterval(buildMonthModifierInterval(d[6], months[d[4]], d[2]), d[0]) })},
    {"name": "qualified_temporal_modifier_interval_value", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "century_word"], "postprocess": d => ({ edtf: applyQualifierToInterval(buildCenturyModifierInterval(d[4], d[2]), d[0]) })},
    {"name": "qualified_temporal_modifier_interval_value", "symbols": ["qualifier", "__", "temporal_modifier_word", "modifier_sep", "spelled_decade"], "postprocess": d => ({ edtf: applyQualifierToInterval(buildDecadeModifierInterval(1900 + parseInt(d[4], 10) * 10, d[2]), d[0]) })},
    {"name": "century_word", "symbols": [(lexer.has("century") ? {type: "century"} : century)], "postprocess": id},
    {"name": "century_word", "symbols": [(lexer.has("c") ? {type: "c"} : c), (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": id},
    {"name": "era_ce", "symbols": [(lexer.has("ad") ? {type: "ad"} : ad)], "postprocess": id},
    {"name": "era_ce", "symbols": [(lexer.has("ce") ? {type: "ce"} : ce)], "postprocess": id},
    {"name": "era_ce", "symbols": [(lexer.has("a") ? {type: "a"} : a), (lexer.has("dot") ? {type: "dot"} : dot), "_", (lexer.has("d") ? {type: "d"} : d), (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": id},
    {"name": "era_ce", "symbols": [(lexer.has("c") ? {type: "c"} : c), (lexer.has("dot") ? {type: "dot"} : dot), "_", (lexer.has("e") ? {type: "e"} : e), (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": id},
    {"name": "era_ce", "symbols": [(lexer.has("anno") ? {type: "anno"} : anno), "__", (lexer.has("domini") ? {type: "domini"} : domini)], "postprocess": id},
    {"name": "era_ce", "symbols": [(lexer.has("common") ? {type: "common"} : common), "__", (lexer.has("era") ? {type: "era"} : era)], "postprocess": id},
    {"name": "era_a", "symbols": [(lexer.has("a") ? {type: "a"} : a)], "postprocess": id},
    {"name": "era_bce", "symbols": [(lexer.has("bc") ? {type: "bc"} : bc)], "postprocess": id},
    {"name": "era_bce", "symbols": [(lexer.has("bce") ? {type: "bce"} : bce)], "postprocess": id},
    {"name": "era_bce", "symbols": [(lexer.has("b") ? {type: "b"} : b), (lexer.has("dot") ? {type: "dot"} : dot), "_", (lexer.has("c") ? {type: "c"} : c), (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": id},
    {"name": "era_bce", "symbols": [(lexer.has("b") ? {type: "b"} : b), (lexer.has("dot") ? {type: "dot"} : dot), "_", (lexer.has("c") ? {type: "c"} : c), (lexer.has("dot") ? {type: "dot"} : dot), "_", (lexer.has("e") ? {type: "e"} : e), (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": id},
    {"name": "era_bce", "symbols": [(lexer.has("before") ? {type: "before"} : before), "__", (lexer.has("christ") ? {type: "christ"} : christ)], "postprocess": id},
    {"name": "era_bce", "symbols": [(lexer.has("before") ? {type: "before"} : before), "__", (lexer.has("common") ? {type: "common"} : common), "__", (lexer.has("era") ? {type: "era"} : era)], "postprocess": id},
    {"name": "interval", "symbols": ["temporal_modifier_interval_value", "__", "interval_connector", "__", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "temporal_modifier_interval_value", "__", "interval_connector", "__", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": ["temporal_modifier_interval_value", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": ["temporal_modifier_interval_value", "__", "interval_connector", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + d[4].edtf, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "temporal_modifier_interval_value", "__", "interval_connector", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + d[6].edtf, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "__", "interval_connector", "__", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: d[0].edtf + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "datevalue", "__", "interval_connector", "__", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: d[2].edtf + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("between") ? {type: "between"} : between), "__", "temporal_modifier_interval_value", "__", (lexer.has("and") ? {type: "and"} : and), "__", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": ["qualified_temporal_modifier_interval_value", "__", "interval_connector", "__", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": ["qualified_temporal_modifier_interval_value", "__", "interval_connector", "__", "qualified_temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": ["qualified_temporal_modifier_interval_value", "__", "interval_connector", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + d[4].edtf, confidence: 0.95 })},
    {"name": "interval", "symbols": ["temporal_modifier_interval_value", "__", "interval_connector", "__", "qualified_temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "__", "interval_connector", "__", "qualified_temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: d[0].edtf + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "qualified_temporal_modifier_interval_value", "__", "interval_connector", "__", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "qualified_temporal_modifier_interval_value", "__", "interval_connector", "__", "qualified_temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "qualified_temporal_modifier_interval_value", "__", "interval_connector", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + d[6].edtf, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "temporal_modifier_interval_value", "__", "interval_connector", "__", "qualified_temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "datevalue", "__", "interval_connector", "__", "qualified_temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: d[2].edtf + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("between") ? {type: "between"} : between), "__", "qualified_temporal_modifier_interval_value", "__", (lexer.has("and") ? {type: "and"} : and), "__", "temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("between") ? {type: "between"} : between), "__", "qualified_temporal_modifier_interval_value", "__", (lexer.has("and") ? {type: "and"} : and), "__", "qualified_temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("between") ? {type: "between"} : between), "__", "temporal_modifier_interval_value", "__", (lexer.has("and") ? {type: "and"} : and), "__", "qualified_temporal_modifier_interval_value"], "postprocess": d => ({ type: 'interval', edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[6].edtf), confidence: 0.95 })},
    {"name": "interval", "symbols": ["numeric_year", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "numeric_year", "__", "era_bce"], "postprocess":  d => {
          const startYear = parseInt(d[0], 10) - 1;
          const endYear = parseInt(d[4], 10) - 1;
          return { type: 'interval', edtf: `-${pad4(startYear)}/-${pad4(endYear)}`, confidence: 0.98 };
        } },
    {"name": "interval", "symbols": ["numeric_year", "__", (lexer.has("to") ? {type: "to"} : to), "__", "numeric_year", "__", "era_bce"], "postprocess":  d => {
          const startYear = parseInt(d[0], 10) - 1;
          const endYear = parseInt(d[4], 10) - 1;
          return { type: 'interval', edtf: `-${pad4(startYear)}/-${pad4(endYear)}`, confidence: 0.98 };
        } },
    {"name": "interval", "symbols": ["numeric_year", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "numeric_year", "__", "era_ce"], "postprocess": d => ({ type: 'interval', edtf: `${pad4(parseInt(d[0], 10))}/${pad4(parseInt(d[4], 10))}`, confidence: 0.98 })},
    {"name": "interval", "symbols": ["numeric_year", "__", (lexer.has("to") ? {type: "to"} : to), "__", "numeric_year", "__", "era_ce"], "postprocess": d => ({ type: 'interval', edtf: `${pad4(parseInt(d[0], 10))}/${pad4(parseInt(d[4], 10))}`, confidence: 0.98 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "month_name", "__", (lexer.has("to") ? {type: "to"} : to), "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'interval', edtf: `${pad4(d[8])}-${months[d[2]]}/${pad4(d[8])}-${months[d[6]]}`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["month_name", "__", (lexer.has("to") ? {type: "to"} : to), "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'interval', edtf: `${pad4(d[6])}-${months[d[0]]}/${pad4(d[6])}-${months[d[4]]}`, confidence: 0.9 })},
    {"name": "interval", "symbols": ["month_name", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'interval', edtf: `${pad4(d[6])}-${months[d[0]]}/${pad4(d[6])}-${months[d[4]]}`, confidence: 0.9 })},
    {"name": "interval", "symbols": [(lexer.has("before") ? {type: "before"} : before), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("earlier") ? {type: "earlier"} : earlier), "__", (lexer.has("than") ? {type: "than"} : than), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("prior") ? {type: "prior"} : prior), "__", (lexer.has("to") ? {type: "to"} : to), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("up") ? {type: "up"} : up), "__", (lexer.has("to") ? {type: "to"} : to), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("later") ? {type: "later"} : later), "__", (lexer.has("than") ? {type: "than"} : than), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[4].edtf}/..`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "datevalue", "__", (lexer.has("onwards") ? {type: "onwards"} : onwards)], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "__", (lexer.has("and") ? {type: "and"} : and), "__", (lexer.has("after") ? {type: "after"} : after)], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "__", (lexer.has("or") ? {type: "or"} : or), "__", (lexer.has("later") ? {type: "later"} : later)], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "__", (lexer.has("or") ? {type: "or"} : or), "__", (lexer.has("after") ? {type: "after"} : after)], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "datevalue", "__", "interval_connector", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "__", "interval_connector", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "_", (lexer.has("dash") ? {type: "dash"} : dash), "_", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("between") ? {type: "between"} : between), "__", "datevalue", "__", (lexer.has("and") ? {type: "and"} : and), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "datevalue", "__", (lexer.has("to") ? {type: "to"} : to), "__", "interval_endpoint"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("from") ? {type: "from"} : from), "__", "datevalue", "__", (lexer.has("to") ? {type: "to"} : to), "__", "open_endpoint"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "__", (lexer.has("to") ? {type: "to"} : to), "__", "interval_endpoint"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "__", (lexer.has("to") ? {type: "to"} : to), "__", "open_endpoint"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["open_endpoint", "__", (lexer.has("to") ? {type: "to"} : to), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["interval_endpoint", "__", (lexer.has("to") ? {type: "to"} : to), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("until") ? {type: "until"} : until), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("after") ? {type: "after"} : after), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval", "symbols": [(lexer.has("since") ? {type: "since"} : since), "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval_connector", "symbols": [(lexer.has("to") ? {type: "to"} : to)], "postprocess": id},
    {"name": "interval_connector", "symbols": [(lexer.has("through") ? {type: "through"} : through)], "postprocess": id},
    {"name": "interval_connector", "symbols": [(lexer.has("until") ? {type: "until"} : until)], "postprocess": id},
    {"name": "interval_endpoint", "symbols": [(lexer.has("unknown") ? {type: "unknown"} : unknown)], "postprocess": () => ''},
    {"name": "interval_endpoint", "symbols": [(lexer.has("questionMark") ? {type: "questionMark"} : questionMark)], "postprocess": () => ''},
    {"name": "open_endpoint", "symbols": [(lexer.has("open") ? {type: "open"} : open), "__", (lexer.has("start") ? {type: "start"} : start)], "postprocess": () => '..'},
    {"name": "open_endpoint", "symbols": [(lexer.has("open") ? {type: "open"} : open), "__", (lexer.has("end") ? {type: "end"} : end)], "postprocess": () => '..'},
    {"name": "open_endpoint", "symbols": [(lexer.has("onwards") ? {type: "onwards"} : onwards)], "postprocess": () => '..'},
    {"name": "set", "symbols": [(lexer.has("one") ? {type: "one"} : one), "__", (lexer.has("of") ? {type: "of"} : of), "_", (lexer.has("colon") ? {type: "colon"} : colon), "_", "datevalue", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "datevalue", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf},${d[14].edtf}]`, confidence: 0.95 })},
    {"name": "set", "symbols": [(lexer.has("one") ? {type: "one"} : one), "__", (lexer.has("of") ? {type: "of"} : of), "_", (lexer.has("colon") ? {type: "colon"} : colon), "_", "datevalue", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf}]`, confidence: 0.95 })},
    {"name": "set", "symbols": [(lexer.has("either") ? {type: "either"} : either), "__", "datevalue", "__", (lexer.has("or") ? {type: "or"} : or), "__", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[2].edtf},${d[6].edtf}]`, confidence: 0.95 })},
    {"name": "set", "symbols": ["datevalue", "__", (lexer.has("or") ? {type: "or"} : or), "__", "datevalue", "__", (lexer.has("or") ? {type: "or"} : or), "__", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf},${d[8].edtf}]`, confidence: 0.9 })},
    {"name": "set", "symbols": ["datevalue", "__", (lexer.has("or") ? {type: "or"} : or), "__", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf}]`, confidence: 0.9 })},
    {"name": "set", "symbols": ["datevalue", "__", (lexer.has("or") ? {type: "or"} : or), "__", (lexer.has("earlier") ? {type: "earlier"} : earlier)], "postprocess": d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 })},
    {"name": "set", "symbols": ["datevalue", "__", (lexer.has("or") ? {type: "or"} : or), "__", (lexer.has("before") ? {type: "before"} : before)], "postprocess": d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 })},
    {"name": "list", "symbols": [(lexer.has("all") ? {type: "all"} : all), "__", (lexer.has("of") ? {type: "of"} : of), "_", (lexer.has("colon") ? {type: "colon"} : colon), "_", "datevalue", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "datevalue", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf},${d[14].edtf}}`, confidence: 0.95 })},
    {"name": "list", "symbols": [(lexer.has("all") ? {type: "all"} : all), "__", (lexer.has("of") ? {type: "of"} : of), "_", (lexer.has("colon") ? {type: "colon"} : colon), "_", "datevalue", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf}}`, confidence: 0.95 })},
    {"name": "list", "symbols": [(lexer.has("both") ? {type: "both"} : both), "__", "datevalue", "__", (lexer.has("and") ? {type: "and"} : and), "__", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[2].edtf},${d[6].edtf}}`, confidence: 0.95 })},
    {"name": "list", "symbols": ["datevalue", "__", (lexer.has("and") ? {type: "and"} : and), "__", "datevalue", "__", (lexer.has("and") ? {type: "and"} : and), "__", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf},${d[8].edtf}}`, confidence: 0.9 })},
    {"name": "list", "symbols": ["datevalue", "__", (lexer.has("and") ? {type: "and"} : and), "__", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf}}`, confidence: 0.9 })},
    {"name": "season", "symbols": ["qualifier", "__", "season_name", "__", "hemisphere_north", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[6])}-${northernSeasons[d[2]]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["season_name", "__", "hemisphere_north", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${northernSeasons[d[0]]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "season_name", "__", "hemisphere_south", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[6])}-${southernSeasons[d[2]]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["season_name", "__", "hemisphere_south", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${southernSeasons[d[0]]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "quarter_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["quarter_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "quadrimester_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["quadrimester_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "semestral_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["semestral_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "season_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${seasons[d[2]]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["season_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[2])}-${seasons[d[0]]}`, confidence: 0.95 })},
    {"name": "hemisphere_north", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("northern") ? {type: "northern"} : northern), "__", (lexer.has("hemisphere") ? {type: "hemisphere"} : hemisphere), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": () => 'north'},
    {"name": "hemisphere_north", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("north") ? {type: "north"} : north), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": () => 'north'},
    {"name": "hemisphere_north", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_", (lexer.has("northern") ? {type: "northern"} : northern), "__", (lexer.has("hemisphere") ? {type: "hemisphere"} : hemisphere)], "postprocess": () => 'north'},
    {"name": "hemisphere_north", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_", (lexer.has("north") ? {type: "north"} : north)], "postprocess": () => 'north'},
    {"name": "hemisphere_south", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("southern") ? {type: "southern"} : southern), "__", (lexer.has("hemisphere") ? {type: "hemisphere"} : hemisphere), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": () => 'south'},
    {"name": "hemisphere_south", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("south") ? {type: "south"} : south), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": () => 'south'},
    {"name": "hemisphere_south", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_", (lexer.has("southern") ? {type: "southern"} : southern), "__", (lexer.has("hemisphere") ? {type: "hemisphere"} : hemisphere)], "postprocess": () => 'south'},
    {"name": "hemisphere_south", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_", (lexer.has("south") ? {type: "south"} : south)], "postprocess": () => 'south'},
    {"name": "quarter_name", "symbols": [(lexer.has("q") ? {type: "q"} : q), (lexer.has("number") ? {type: "number"} : number)], "postprocess": d => String(32 + parseInt(d[1].value, 10))},
    {"name": "quarter_name", "symbols": [(lexer.has("quarter") ? {type: "quarter"} : quarter), "__", (lexer.has("number") ? {type: "number"} : number)], "postprocess": d => String(32 + parseInt(d[2].value, 10))},
    {"name": "quarter_name", "symbols": ["ordinal_num", "__", (lexer.has("quarter") ? {type: "quarter"} : quarter)], "postprocess": d => String(32 + d[0])},
    {"name": "quarter_name", "symbols": [(lexer.has("first") ? {type: "first"} : first), "__", (lexer.has("quarter") ? {type: "quarter"} : quarter)], "postprocess": () => '33'},
    {"name": "quarter_name", "symbols": [(lexer.has("second") ? {type: "second"} : second), "__", (lexer.has("quarter") ? {type: "quarter"} : quarter)], "postprocess": () => '34'},
    {"name": "quarter_name", "symbols": [(lexer.has("third") ? {type: "third"} : third), "__", (lexer.has("quarter") ? {type: "quarter"} : quarter)], "postprocess": () => '35'},
    {"name": "quarter_name", "symbols": [(lexer.has("fourth") ? {type: "fourth"} : fourth), "__", (lexer.has("quarter") ? {type: "quarter"} : quarter)], "postprocess": () => '36'},
    {"name": "quadrimester_name", "symbols": [(lexer.has("quadrimester") ? {type: "quadrimester"} : quadrimester), "__", (lexer.has("number") ? {type: "number"} : number)], "postprocess": d => String(36 + parseInt(d[2].value, 10))},
    {"name": "quadrimester_name", "symbols": ["ordinal_num", "__", (lexer.has("quadrimester") ? {type: "quadrimester"} : quadrimester)], "postprocess": d => String(36 + d[0])},
    {"name": "quadrimester_name", "symbols": [(lexer.has("first") ? {type: "first"} : first), "__", (lexer.has("quadrimester") ? {type: "quadrimester"} : quadrimester)], "postprocess": () => '37'},
    {"name": "quadrimester_name", "symbols": [(lexer.has("second") ? {type: "second"} : second), "__", (lexer.has("quadrimester") ? {type: "quadrimester"} : quadrimester)], "postprocess": () => '38'},
    {"name": "quadrimester_name", "symbols": [(lexer.has("third") ? {type: "third"} : third), "__", (lexer.has("quadrimester") ? {type: "quadrimester"} : quadrimester)], "postprocess": () => '39'},
    {"name": "semestral_name", "symbols": [(lexer.has("semestral") ? {type: "semestral"} : semestral), "__", (lexer.has("number") ? {type: "number"} : number)], "postprocess": d => String(39 + parseInt(d[2].value, 10))},
    {"name": "semestral_name", "symbols": [(lexer.has("semester") ? {type: "semester"} : semester), "__", (lexer.has("number") ? {type: "number"} : number)], "postprocess": d => String(39 + parseInt(d[2].value, 10))},
    {"name": "semestral_name", "symbols": ["ordinal_num", "__", (lexer.has("semestral") ? {type: "semestral"} : semestral)], "postprocess": d => String(39 + d[0])},
    {"name": "semestral_name", "symbols": ["ordinal_num", "__", (lexer.has("semester") ? {type: "semester"} : semester)], "postprocess": d => String(39 + d[0])},
    {"name": "semestral_name", "symbols": [(lexer.has("first") ? {type: "first"} : first), "__", (lexer.has("semestral") ? {type: "semestral"} : semestral)], "postprocess": () => '40'},
    {"name": "semestral_name", "symbols": [(lexer.has("second") ? {type: "second"} : second), "__", (lexer.has("semestral") ? {type: "semestral"} : semestral)], "postprocess": () => '41'},
    {"name": "semestral_name", "symbols": [(lexer.has("first") ? {type: "first"} : first), "__", (lexer.has("semester") ? {type: "semester"} : semester)], "postprocess": () => '40'},
    {"name": "semestral_name", "symbols": [(lexer.has("second") ? {type: "second"} : second), "__", (lexer.has("semester") ? {type: "semester"} : semester)], "postprocess": () => '41'},
    {"name": "date", "symbols": ["datevalue", "_", "parenthetical_qualification"], "postprocess":  d => {
          const qual = d[2];
          if (qual.type === 'global') {
            return { type: 'date', edtf: `${d[0].edtf}${qual.qual}`, confidence: d[0].confidence * 0.9 };
          } else {
            return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
          }
        } },
    {"name": "date", "symbols": ["qualifier", "_", "datevalue"], "postprocess": d => ({ type: 'date', edtf: `${d[2].edtf}${d[0]}`, confidence: d[2].confidence * 0.95 })},
    {"name": "date", "symbols": ["datevalue", "_", "qualifier"], "postprocess": d => ({ type: 'date', edtf: `${d[0].edtf}${d[2]}`, confidence: d[0].confidence * 0.95 })},
    {"name": "date", "symbols": ["datevalue"], "postprocess": id},
    {"name": "datevalue", "symbols": ["datevalue_base", "_", "parenthetical_qualification"], "postprocess":  d => {
          const qual = d[2];
          if (qual.type === 'global') {
            return { type: 'date', edtf: `${d[0].edtf}${qual.qual}`, confidence: d[0].confidence * 0.9 };
          } else {
            return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
          }
        } },
    {"name": "datevalue", "symbols": ["qualifier", "_", "datevalue_base"], "postprocess": d => ({ type: 'date', edtf: `${d[2].edtf}${d[0]}`, confidence: d[2].confidence * 0.95 })},
    {"name": "datevalue", "symbols": ["datevalue_base", "_", "qualifier"], "postprocess": d => ({ type: 'date', edtf: `${d[0].edtf}${d[2]}`, confidence: d[0].confidence * 0.95 })},
    {"name": "datevalue", "symbols": ["datevalue_base"], "postprocess": id},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", (lexer.has("year") ? {type: "year"} : year), "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: pad4(d[4]), confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("year") ? {type: "year"} : year), "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: pad4(d[2]), confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("inWord") ? {type: "inWord"} : inWord), "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: pad4(d[2]), confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("sometime") ? {type: "sometime"} : sometime), "__", (lexer.has("inWord") ? {type: "inWord"} : inWord), "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[4]]}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("some") ? {type: "some"} : some), "__", (lexer.has("day") ? {type: "day"} : day), "__", (lexer.has("inWord") ? {type: "inWord"} : inWord), "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6]]}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("a") ? {type: "a"} : a), "__", (lexer.has("day") ? {type: "day"} : day), "__", (lexer.has("inWord") ? {type: "inWord"} : inWord), "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6]]}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("sometime") ? {type: "sometime"} : sometime), "__", (lexer.has("inWord") ? {type: "inWord"} : inWord), "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-XX-XX`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("some") ? {type: "some"} : some), "__", (lexer.has("month") ? {type: "month"} : month), "__", (lexer.has("inWord") ? {type: "inWord"} : inWord), "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("a") ? {type: "a"} : a), "__", (lexer.has("month") ? {type: "month"} : month), "__", (lexer.has("inWord") ? {type: "inWord"} : inWord), "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", (lexer.has("before") ? {type: "before"} : before), "__", (lexer.has("common") ? {type: "common"} : common), "__", (lexer.has("era") ? {type: "era"} : era)], "postprocess": d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", (lexer.has("before") ? {type: "before"} : before), "__", (lexer.has("christ") ? {type: "christ"} : christ)], "postprocess": d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("anno") ? {type: "anno"} : anno), "__", (lexer.has("domini") ? {type: "domini"} : domini), "__", "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[4], 10)), confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", (lexer.has("anno") ? {type: "anno"} : anno), "__", (lexer.has("domini") ? {type: "domini"} : domini)], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("common") ? {type: "common"} : common), "__", (lexer.has("era") ? {type: "era"} : era), "__", "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[4], 10)), confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", (lexer.has("common") ? {type: "common"} : common), "__", (lexer.has("era") ? {type: "era"} : era)], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "era_bce"], "postprocess": d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", (lexer.has("b") ? {type: "b"} : b)], "postprocess": d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": ["era_ce", "__", "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[2], 10)), confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "era_ce"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["era_a", "__", "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[2], 10)), confidence: 0.85 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "era_a"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.85 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", (lexer.has("bc") ? {type: "bc"} : bc)], "postprocess": d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", (lexer.has("bce") ? {type: "bce"} : bce)], "postprocess": d => ({ type: 'date', edtf: `-${pad4(parseInt(d[0], 10) - 1)}`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("bc") ? {type: "bc"} : bc), "numeric_year"], "postprocess": d => ({ type: 'date', edtf: `-${pad4(parseInt(d[1], 10) - 1)}`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("bce") ? {type: "bce"} : bce), "numeric_year"], "postprocess": d => ({ type: 'date', edtf: `-${pad4(parseInt(d[1], 10) - 1)}`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", (lexer.has("ad") ? {type: "ad"} : ad)], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": ["numeric_year", (lexer.has("ce") ? {type: "ce"} : ce)], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("ad") ? {type: "ad"} : ad), "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[1], 10)), confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("ce") ? {type: "ce"} : ce), "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[1], 10)), confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("on") ? {type: "on"} : on), "__", (lexer.has("the") ? {type: "the"} : the), "__", "ordinal_day", "__", (lexer.has("of") ? {type: "of"} : of), "__", "month_name", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[12])}-${months[d[8]]}-${pad2(d[4])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("on") ? {type: "on"} : on), "__", (lexer.has("the") ? {type: "the"} : the), "__", "ordinal_day", "__", (lexer.has("of") ? {type: "of"} : of), "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[10])}-${months[d[8]]}-${pad2(d[4])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "ordinal_day", "__", (lexer.has("of") ? {type: "of"} : of), "__", "month_name", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[10])}-${months[d[6]]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "ordinal_day", "__", (lexer.has("of") ? {type: "of"} : of), "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6]]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["ordinal_day", "__", (lexer.has("of") ? {type: "of"} : of), "__", "month_name", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[4]]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["ordinal_day", "__", (lexer.has("of") ? {type: "of"} : of), "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[4]]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", (lexer.has("the") ? {type: "the"} : the), "__", "ordinal_day", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[0]]}-${pad2(d[4])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", (lexer.has("the") ? {type: "the"} : the), "__", "ordinal_day", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0]]}-${pad2(d[4])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "ordinal_day", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0]]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "ordinal_day", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[0]]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["ordinal_day", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[2]]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "day_num", "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0]]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "day_num", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[0]]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["day_num", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[2]]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[2])}-${months[d[0]]}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", (lexer.has("number") ? {type: "number"} : number), (lexer.has("decadeSuffix") ? {type: "decadeSuffix"} : decadeSuffix)], "postprocess":  d => {
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
        } },
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", (lexer.has("number") ? {type: "number"} : number), (lexer.has("decadeSuffix") ? {type: "decadeSuffix"} : decadeSuffix)], "postprocess":  d => {
          const num = d[2].value;
          if (num.length === 4 && num.endsWith('00')) {
            return { type: 'date', edtf: `${num.substring(0, 3)}X`, confidence: 0.9 };
          }
          // Return reject to indicate this rule doesn't apply
          return { __reject: true };
        } },
    {"name": "datevalue_base", "symbols": [(lexer.has("number") ? {type: "number"} : number), (lexer.has("decadeSuffix") ? {type: "decadeSuffix"} : decadeSuffix)], "postprocess":  d => {
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
        } },
    {"name": "datevalue_base", "symbols": [(lexer.has("number") ? {type: "number"} : number), (lexer.has("decadeSuffix") ? {type: "decadeSuffix"} : decadeSuffix)], "postprocess":  d => {
          const num = d[0].value;
          if (num.length === 4 && num.endsWith('00')) {
            return { type: 'date', edtf: `${num.substring(0, 3)}X`, confidence: 0.9 };
          }
          // Return reject to indicate this rule doesn't apply
          return { __reject: true };
        } },
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", (lexer.has("apostrophe") ? {type: "apostrophe"} : apostrophe), (lexer.has("number") ? {type: "number"} : number), (lexer.has("decadeSuffix") ? {type: "decadeSuffix"} : decadeSuffix)], "postprocess": d => ({ type: 'date', edtf: `19${d[3].value.substring(0, 1)}X`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("apostrophe") ? {type: "apostrophe"} : apostrophe), (lexer.has("number") ? {type: "number"} : number), (lexer.has("decadeSuffix") ? {type: "decadeSuffix"} : decadeSuffix)], "postprocess": d => ({ type: 'date', edtf: `19${d[1].value.substring(0, 1)}X`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "ordinal_century", "__", "century_word", "__", "era_bce"], "postprocess": d => ({ type: 'date', edtf: `-${String(d[2] - 1).padStart(2, '0')}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["ordinal_century", "__", "century_word", "__", "era_bce"], "postprocess": d => ({ type: 'date', edtf: `-${String(d[0] - 1).padStart(2, '0')}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "spelled_ordinal_century", "__", "century_word", "__", "era_bce"], "postprocess": d => ({ type: 'date', edtf: `-${String(d[2] - 1).padStart(2, '0')}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["spelled_ordinal_century", "__", "century_word", "__", "era_bce"], "postprocess": d => ({ type: 'date', edtf: `-${String(d[0] - 1).padStart(2, '0')}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "spelled_century", "__", (lexer.has("century") ? {type: "century"} : century), "__", "era_bce"], "postprocess": d => ({ type: 'date', edtf: `-${d[2]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["spelled_century", "__", (lexer.has("century") ? {type: "century"} : century), "__", "era_bce"], "postprocess": d => ({ type: 'date', edtf: `-${d[0]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "ordinal_century", "__", "century_word", "__", "era_ce"], "postprocess": d => ({ type: 'date', edtf: `${String((d[2] - 1) * 100).substring(0, 2)}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["ordinal_century", "__", "century_word", "__", "era_ce"], "postprocess": d => ({ type: 'date', edtf: `${String((d[0] - 1) * 100).substring(0, 2)}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "spelled_century", "__", (lexer.has("century") ? {type: "century"} : century), "__", "era_ce"], "postprocess": d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["spelled_century", "__", (lexer.has("century") ? {type: "century"} : century), "__", "era_ce"], "postprocess": d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'date', edtf: `${String((d[2] - 1) * 100).substring(0, 2)}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["ordinal_century", "__", "century_word"], "postprocess": d => ({ type: 'date', edtf: `${String((d[0] - 1) * 100).substring(0, 2)}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "spelled_century", "__", (lexer.has("century") ? {type: "century"} : century)], "postprocess": d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["spelled_century", "__", (lexer.has("century") ? {type: "century"} : century)], "postprocess": d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "spelled_number_word", "__", (lexer.has("hundreds") ? {type: "hundreds"} : hundreds)], "postprocess": d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["spelled_number_word", "__", (lexer.has("hundreds") ? {type: "hundreds"} : hundreds)], "postprocess": d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("the") ? {type: "the"} : the), "__", "spelled_decade"], "postprocess": d => ({ type: 'date', edtf: `19${d[2]}X`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": ["spelled_decade"], "postprocess": d => ({ type: 'date', edtf: `19${d[0]}X`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [(lexer.has("number") ? {type: "number"} : number), (lexer.has("slash") ? {type: "slash"} : slash), (lexer.has("number") ? {type: "number"} : number)], "postprocess":  d => {
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
        } },
    {"name": "datevalue_base", "symbols": [(lexer.has("number") ? {type: "number"} : number), (lexer.has("slash") ? {type: "slash"} : slash), (lexer.has("number") ? {type: "number"} : number), (lexer.has("slash") ? {type: "slash"} : slash), (lexer.has("number") ? {type: "number"} : number)], "postprocess":  d => {
          const first = d[0].value;
          const second = d[2].value;
          const third = d[4].value;
          // Third part should be the year
          const yearStr = third.length === 2 ? String(twoDigitYear(third)) : third;
          return buildSlashDate(first, second, yearStr);
        } },
    {"name": "datevalue_base", "symbols": ["year_num", (lexer.has("ish") ? {type: "ish"} : ish)], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["year_num", "_", (lexer.has("dash") ? {type: "dash"} : dash), (lexer.has("ish") ? {type: "ish"} : ish)], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["year_num"], "postprocess": d => ({ type: 'date', edtf: pad4(d[0]), confidence: 0.95 })}
]
  , ParserStart: "main"
}


  return grammar;
})();

export default grammar_export;