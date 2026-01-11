// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
var grammar_export = (function() {
function id(x) { return x[0]; }

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
  // Resolve 2-digit year to 4-digit year using the "Sliding Window" convention.
  // This uses a -80/+20 rolling century window based on the current year.
  //
  // For example, if the current year is 2026:
  //   - Window spans 1946 to 2046
  //   - "25" -> 2025 (within +20 future window)
  //   - "38" -> 2038 (within +20 future window)
  //   - "50" -> 1950 (beyond +20, falls into -80 past window)
  //   - "99" -> 1999 (beyond +20, falls into -80 past window)
  //
  // This approach is preferred over fixed pivot years (like Excel's 2029 or SQL Server's 2049)
  // because it remains accurate as time progresses. The -80/+20 split reflects that most
  // two-digit year references are historical, while still accommodating near-future dates.
  //
  // See: https://www.youtube.com/watch?v=-5wpm-gesOY (Computerphile: Time & Date glitches)
  const year = parseInt(yy, 10);
  const currentYear = new Date().getFullYear();

  // Calculate the sliding window boundaries
  const futureWindow = 20;  // Years into the future
  const maxFutureYear = currentYear + futureWindow;

  // Determine which century the 2-digit year falls into
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const thisOption = currentCentury + year;
  const prevOption = thisOption - 100;

  // If this century's interpretation is within the +20 future window, use it
  // Otherwise, use the previous century
  if (thisOption <= maxFutureYear) {
    return thisOption;
  }
  return prevOption;
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

// Build slash-delimited date result
// Returns both possible interpretations when ambiguous, or just one when unambiguous
function buildSlashDate(first, second, yearStr) {
  const firstNum = parseInt(first, 10);
  const secondNum = parseInt(second, 10);
  const year = yearStr.length === 2 ? twoDigitYear(yearStr) : parseInt(yearStr, 10);

  const isFirstValidMonth = firstNum >= 1 && firstNum <= 12;
  const isSecondValidMonth = secondNum >= 1 && secondNum <= 12;
  const isFirstValidDay = firstNum >= 1 && firstNum <= 31;
  const isSecondValidDay = secondNum >= 1 && secondNum <= 31;

  // If first number > 12, it must be a day (EU format: DD/MM/YYYY)
  if (firstNum > 12 && isFirstValidDay && isSecondValidMonth) {
    return {
      type: 'date',
      edtf: `${pad4(year)}-${pad2(secondNum)}-${pad2(firstNum)}`,
      confidence: 0.9,
      ambiguous: false
    };
  }

  // If second number > 12, it must be a day (US format: MM/DD/YYYY)
  if (secondNum > 12 && isSecondValidDay && isFirstValidMonth) {
    return {
      type: 'date',
      edtf: `${pad4(year)}-${pad2(firstNum)}-${pad2(secondNum)}`,
      confidence: 0.9,
      ambiguous: false
    };
  }

  // Both could be valid - ambiguous case
  // Return with US interpretation (MM/DD/YYYY) as the primary EDTF
  // The parser will generate both interpretations in post-processing
  if (isFirstValidMonth && isSecondValidDay) {
    return {
      type: 'date',
      edtf: `${pad4(year)}-${pad2(firstNum)}-${pad2(secondNum)}`,
      confidence: 0.5,
      ambiguous: true
    };
  }

  // Invalid date
  return null;
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
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "main", "symbols": ["_", "value", "_"], "postprocess": d => d[1]},
    {"name": "value", "symbols": ["interval"], "postprocess": id},
    {"name": "value", "symbols": ["temporal_modifier"], "postprocess": id},
    {"name": "value", "symbols": ["set"], "postprocess": id},
    {"name": "value", "symbols": ["list"], "postprocess": id},
    {"name": "value", "symbols": ["season"], "postprocess": id},
    {"name": "value", "symbols": ["date"], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[\s]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => null},
    {"name": "__$ebnf$1", "symbols": [/[\s]/]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", /[\s]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": () => null},
    {"name": "temporal_modifier_word$subexpression$1", "symbols": [/[eE]/, /[aA]/, /[rR]/, /[lL]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier_word", "symbols": ["temporal_modifier_word$subexpression$1"], "postprocess": () => 'early'},
    {"name": "temporal_modifier_word$subexpression$2", "symbols": [/[mM]/, /[iI]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier_word", "symbols": ["temporal_modifier_word$subexpression$2"], "postprocess": () => 'mid'},
    {"name": "temporal_modifier_word$subexpression$3", "symbols": [/[mM]/, /[iI]/, /[dD]/, /[dD]/, /[lL]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier_word", "symbols": ["temporal_modifier_word$subexpression$3"], "postprocess": () => 'mid'},
    {"name": "temporal_modifier_word$subexpression$4", "symbols": [/[lL]/, /[aA]/, /[tT]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier_word", "symbols": ["temporal_modifier_word$subexpression$4"], "postprocess": () => 'late'},
    {"name": "modifier_sep", "symbols": ["__"], "postprocess": id},
    {"name": "modifier_sep", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "month_name", "__", "year_num"], "postprocess":  d => {
          const modifier = d[0];
          const month = months[d[2].toLowerCase()];
          const year = d[4];
          return { type: 'interval', edtf: buildMonthModifierInterval(year, month, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "month_name", "_", {"literal":","}, "_", "year_num"], "postprocess":  d => {
          const modifier = d[0];
          const month = months[d[2].toLowerCase()];
          const year = d[6];
          return { type: 'interval', edtf: buildMonthModifierInterval(year, month, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "year_num"], "postprocess":  d => {
          const modifier = d[0];
          const year = d[2];
          return { type: 'interval', edtf: buildYearModifierInterval(year, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$1", "symbols": [{"literal":"'"}]},
    {"name": "temporal_modifier$subexpression$1", "symbols": []},
    {"name": "temporal_modifier$subexpression$2", "symbols": [/[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "digit", "digit", "digit", {"literal":"0"}, "temporal_modifier$subexpression$1", "temporal_modifier$subexpression$2"], "postprocess":  d => {
          const modifier = d[0];
          const decadeStart = parseInt(d[2] + d[3] + d[4] + '0', 10);
          return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$3", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$4", "symbols": [{"literal":"'"}]},
    {"name": "temporal_modifier$subexpression$4", "symbols": []},
    {"name": "temporal_modifier$subexpression$5", "symbols": [/[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "__", "temporal_modifier$subexpression$3", "__", "digit", "digit", "digit", {"literal":"0"}, "temporal_modifier$subexpression$4", "temporal_modifier$subexpression$5"], "postprocess":  d => {
          const modifier = d[0];
          const decadeStart = parseInt(d[4] + d[5] + d[6] + '0', 10);
          return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$6", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$7", "symbols": [{"literal":"'"}]},
    {"name": "temporal_modifier$subexpression$7", "symbols": []},
    {"name": "temporal_modifier$subexpression$8", "symbols": [/[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier$subexpression$6", "__", "temporal_modifier_word", "__", "digit", "digit", "digit", {"literal":"0"}, "temporal_modifier$subexpression$7", "temporal_modifier$subexpression$8"], "postprocess":  d => {
          const modifier = d[2];
          const decadeStart = parseInt(d[4] + d[5] + d[6] + '0', 10);
          return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$9$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$9", "symbols": ["temporal_modifier$subexpression$9$subexpression$1"]},
    {"name": "temporal_modifier$subexpression$9$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$9", "symbols": ["temporal_modifier$subexpression$9$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "temporal_modifier$subexpression$9"], "postprocess":  d => {
          const modifier = d[0];
          const centuryNum = d[2];
          return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$10", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$11$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$11", "symbols": ["temporal_modifier$subexpression$11$subexpression$1"]},
    {"name": "temporal_modifier$subexpression$11$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$11", "symbols": ["temporal_modifier$subexpression$11$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier$subexpression$10", "__", "temporal_modifier_word", "__", "ordinal_century", "__", "temporal_modifier$subexpression$11"], "postprocess":  d => {
          const modifier = d[2];
          const centuryNum = d[4];
          return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$12$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$12", "symbols": ["temporal_modifier$subexpression$12$subexpression$1"]},
    {"name": "temporal_modifier$subexpression$12$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$12", "symbols": ["temporal_modifier$subexpression$12$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$13$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$13$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$13", "symbols": ["temporal_modifier$subexpression$13$subexpression$1", {"literal":"."}, "_", "temporal_modifier$subexpression$13$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$13$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$13$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$13", "symbols": ["temporal_modifier$subexpression$13$subexpression$3", {"literal":"."}, "_", "temporal_modifier$subexpression$13$subexpression$4", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$13$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$13", "symbols": ["temporal_modifier$subexpression$13$subexpression$5"]},
    {"name": "temporal_modifier$subexpression$13$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$13", "symbols": ["temporal_modifier$subexpression$13$subexpression$6"]},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "temporal_modifier$subexpression$12", "__", "temporal_modifier$subexpression$13"], "postprocess":  d => {
          const modifier = d[0];
          const centuryNum = d[2];
          return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$14", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$15$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$15", "symbols": ["temporal_modifier$subexpression$15$subexpression$1"]},
    {"name": "temporal_modifier$subexpression$15$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$15", "symbols": ["temporal_modifier$subexpression$15$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$16$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$16$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$16", "symbols": ["temporal_modifier$subexpression$16$subexpression$1", {"literal":"."}, "_", "temporal_modifier$subexpression$16$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$16$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$16$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$16", "symbols": ["temporal_modifier$subexpression$16$subexpression$3", {"literal":"."}, "_", "temporal_modifier$subexpression$16$subexpression$4", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$16$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$16", "symbols": ["temporal_modifier$subexpression$16$subexpression$5"]},
    {"name": "temporal_modifier$subexpression$16$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$16", "symbols": ["temporal_modifier$subexpression$16$subexpression$6"]},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier$subexpression$14", "__", "temporal_modifier_word", "__", "ordinal_century", "__", "temporal_modifier$subexpression$15", "__", "temporal_modifier$subexpression$16"], "postprocess":  d => {
          const modifier = d[2];
          const centuryNum = d[4];
          return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$17$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$17", "symbols": ["temporal_modifier$subexpression$17$subexpression$1"]},
    {"name": "temporal_modifier$subexpression$17$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$17", "symbols": ["temporal_modifier$subexpression$17$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$18$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$18$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$18$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$18", "symbols": ["temporal_modifier$subexpression$18$subexpression$1", {"literal":"."}, "_", "temporal_modifier$subexpression$18$subexpression$2", {"literal":"."}, "_", "temporal_modifier$subexpression$18$subexpression$3", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$18$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$18$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$18", "symbols": ["temporal_modifier$subexpression$18$subexpression$4", {"literal":"."}, "_", "temporal_modifier$subexpression$18$subexpression$5", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$18$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$18", "symbols": ["temporal_modifier$subexpression$18$subexpression$6"]},
    {"name": "temporal_modifier$subexpression$18$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$18", "symbols": ["temporal_modifier$subexpression$18$subexpression$7"]},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "ordinal_century", "__", "temporal_modifier$subexpression$17", "__", "temporal_modifier$subexpression$18"], "postprocess":  d => {
          const modifier = d[0];
          const centuryNum = d[2];
          return { type: 'interval', edtf: buildBCECenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$19", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$20$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$20", "symbols": ["temporal_modifier$subexpression$20$subexpression$1"]},
    {"name": "temporal_modifier$subexpression$20$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$20", "symbols": ["temporal_modifier$subexpression$20$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$21$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$21$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$21$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$21", "symbols": ["temporal_modifier$subexpression$21$subexpression$1", {"literal":"."}, "_", "temporal_modifier$subexpression$21$subexpression$2", {"literal":"."}, "_", "temporal_modifier$subexpression$21$subexpression$3", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$21$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$21$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$21", "symbols": ["temporal_modifier$subexpression$21$subexpression$4", {"literal":"."}, "_", "temporal_modifier$subexpression$21$subexpression$5", {"literal":"."}]},
    {"name": "temporal_modifier$subexpression$21$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$21", "symbols": ["temporal_modifier$subexpression$21$subexpression$6"]},
    {"name": "temporal_modifier$subexpression$21$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$21", "symbols": ["temporal_modifier$subexpression$21$subexpression$7"]},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier$subexpression$19", "__", "temporal_modifier_word", "__", "ordinal_century", "__", "temporal_modifier$subexpression$20", "__", "temporal_modifier$subexpression$21"], "postprocess":  d => {
          const modifier = d[2];
          const centuryNum = d[4];
          return { type: 'interval', edtf: buildBCECenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$22$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$22", "symbols": ["temporal_modifier$subexpression$22$subexpression$1"]},
    {"name": "temporal_modifier$subexpression$22$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$22", "symbols": ["temporal_modifier$subexpression$22$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "spelled_ordinal_century", "__", "temporal_modifier$subexpression$22"], "postprocess":  d => {
          const modifier = d[0];
          const centuryNum = d[2];
          return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier$subexpression$23", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$24$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$24", "symbols": ["temporal_modifier$subexpression$24$subexpression$1"]},
    {"name": "temporal_modifier$subexpression$24$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier$subexpression$24", "symbols": ["temporal_modifier$subexpression$24$subexpression$2", {"literal":"."}]},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier$subexpression$23", "__", "temporal_modifier_word", "__", "spelled_ordinal_century", "__", "temporal_modifier$subexpression$24"], "postprocess":  d => {
          const modifier = d[2];
          const centuryNum = d[4];
          return { type: 'interval', edtf: buildCenturyModifierInterval(centuryNum, modifier), confidence: 0.95 };
        } },
    {"name": "temporal_modifier", "symbols": ["temporal_modifier_word", "modifier_sep", "spelled_decade"], "postprocess":  d => {
          const modifier = d[0];
          const decadeDigit = d[2];
          const decadeStart = 1900 + parseInt(decadeDigit, 10) * 10;
          return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.9 };
        } },
    {"name": "temporal_modifier$subexpression$25", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "temporal_modifier", "symbols": ["temporal_modifier$subexpression$25", "__", "temporal_modifier_word", "__", "spelled_decade"], "postprocess":  d => {
          const modifier = d[2];
          const decadeDigit = d[4];
          const decadeStart = 1900 + parseInt(decadeDigit, 10) * 10;
          return { type: 'interval', edtf: buildDecadeModifierInterval(decadeStart, modifier), confidence: 0.9 };
        } },
    {"name": "interval$subexpression$1$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$1$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$1$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$1", "symbols": ["interval$subexpression$1$subexpression$1", {"literal":"."}, "_", "interval$subexpression$1$subexpression$2", {"literal":"."}, "_", "interval$subexpression$1$subexpression$3", {"literal":"."}]},
    {"name": "interval$subexpression$1$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$1$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$1", "symbols": ["interval$subexpression$1$subexpression$4", {"literal":"."}, "_", "interval$subexpression$1$subexpression$5", {"literal":"."}]},
    {"name": "interval$subexpression$1$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$1", "symbols": ["interval$subexpression$1$subexpression$6"]},
    {"name": "interval$subexpression$1$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$1", "symbols": ["interval$subexpression$1$subexpression$7"]},
    {"name": "interval", "symbols": ["numeric_year", "_", {"literal":"-"}, "_", "numeric_year", "__", "interval$subexpression$1"], "postprocess":  d => {
          const startYear = parseInt(d[0], 10) - 1;
          const endYear = parseInt(d[4], 10) - 1;
          return { type: 'interval', edtf: `-${pad4(startYear)}/-${pad4(endYear)}`, confidence: 0.98 };
        } },
    {"name": "interval$subexpression$2", "symbols": [/[tT]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$3$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$3$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$3$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$3", "symbols": ["interval$subexpression$3$subexpression$1", {"literal":"."}, "_", "interval$subexpression$3$subexpression$2", {"literal":"."}, "_", "interval$subexpression$3$subexpression$3", {"literal":"."}]},
    {"name": "interval$subexpression$3$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$3$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$3", "symbols": ["interval$subexpression$3$subexpression$4", {"literal":"."}, "_", "interval$subexpression$3$subexpression$5", {"literal":"."}]},
    {"name": "interval$subexpression$3$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$3", "symbols": ["interval$subexpression$3$subexpression$6"]},
    {"name": "interval$subexpression$3$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$3", "symbols": ["interval$subexpression$3$subexpression$7"]},
    {"name": "interval", "symbols": ["numeric_year", "__", "interval$subexpression$2", "__", "numeric_year", "__", "interval$subexpression$3"], "postprocess":  d => {
          const startYear = parseInt(d[0], 10) - 1;
          const endYear = parseInt(d[4], 10) - 1;
          return { type: 'interval', edtf: `-${pad4(startYear)}/-${pad4(endYear)}`, confidence: 0.98 };
        } },
    {"name": "interval$subexpression$4$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$4$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$4", "symbols": ["interval$subexpression$4$subexpression$1", {"literal":"."}, "_", "interval$subexpression$4$subexpression$2", {"literal":"."}]},
    {"name": "interval$subexpression$4$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$4$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$4", "symbols": ["interval$subexpression$4$subexpression$3", {"literal":"."}, "_", "interval$subexpression$4$subexpression$4", {"literal":"."}]},
    {"name": "interval$subexpression$4$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$4", "symbols": ["interval$subexpression$4$subexpression$5"]},
    {"name": "interval$subexpression$4$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$4", "symbols": ["interval$subexpression$4$subexpression$6"]},
    {"name": "interval", "symbols": ["numeric_year", "_", {"literal":"-"}, "_", "numeric_year", "__", "interval$subexpression$4"], "postprocess":  d => {
          const startYear = parseInt(d[0], 10);
          const endYear = parseInt(d[4], 10);
          return { type: 'interval', edtf: `${pad4(startYear)}/${pad4(endYear)}`, confidence: 0.98 };
        } },
    {"name": "interval$subexpression$5", "symbols": [/[tT]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$6$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$6$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$6", "symbols": ["interval$subexpression$6$subexpression$1", {"literal":"."}, "_", "interval$subexpression$6$subexpression$2", {"literal":"."}]},
    {"name": "interval$subexpression$6$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$6$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$6", "symbols": ["interval$subexpression$6$subexpression$3", {"literal":"."}, "_", "interval$subexpression$6$subexpression$4", {"literal":"."}]},
    {"name": "interval$subexpression$6$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$6", "symbols": ["interval$subexpression$6$subexpression$5"]},
    {"name": "interval$subexpression$6$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$6", "symbols": ["interval$subexpression$6$subexpression$6"]},
    {"name": "interval", "symbols": ["numeric_year", "__", "interval$subexpression$5", "__", "numeric_year", "__", "interval$subexpression$6"], "postprocess":  d => {
          const startYear = parseInt(d[0], 10);
          const endYear = parseInt(d[4], 10);
          return { type: 'interval', edtf: `${pad4(startYear)}/${pad4(endYear)}`, confidence: 0.98 };
        } },
    {"name": "interval$subexpression$7", "symbols": [/[fF]/, /[rR]/, /[oO]/, /[mM]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$8", "symbols": [/[tT]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval", "symbols": ["interval$subexpression$7", "__", "month_name", "__", "interval$subexpression$8", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'interval', edtf: `${pad4(d[8])}-${months[d[2].toLowerCase()]}/${pad4(d[8])}-${months[d[6].toLowerCase()]}`, confidence: 0.95 })},
    {"name": "interval$subexpression$9", "symbols": [/[tT]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval", "symbols": ["month_name", "__", "interval$subexpression$9", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'interval', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}/${pad4(d[6])}-${months[d[4].toLowerCase()]}`, confidence: 0.9 })},
    {"name": "interval", "symbols": ["month_name", "_", {"literal":"-"}, "_", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'interval', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}/${pad4(d[6])}-${months[d[4].toLowerCase()]}`, confidence: 0.9 })},
    {"name": "interval$string$1", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"f"}, {"literal":"o"}, {"literal":"r"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$1", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$2", "symbols": [{"literal":"e"}, {"literal":"a"}, {"literal":"r"}, {"literal":"l"}, {"literal":"i"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$3", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"a"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$2", "__", "interval$string$3", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$4", "symbols": [{"literal":"p"}, {"literal":"r"}, {"literal":"i"}, {"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$5", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$4", "__", "interval$string$5", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$6", "symbols": [{"literal":"u"}, {"literal":"p"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$7", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$6", "__", "interval$string$7", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$8", "symbols": [{"literal":"l"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$9", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"a"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$8", "__", "interval$string$9", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[4].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$10", "symbols": [{"literal":"f"}, {"literal":"r"}, {"literal":"o"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$11", "symbols": [{"literal":"o"}, {"literal":"n"}, {"literal":"w"}, {"literal":"a"}, {"literal":"r"}, {"literal":"d"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$10", "__", "datevalue", "__", "interval$string$11"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$12", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$13", "symbols": [{"literal":"a"}, {"literal":"f"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$12", "__", "interval$string$13"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$14", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$15", "symbols": [{"literal":"l"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$14", "__", "interval$string$15"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$16", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$17", "symbols": [{"literal":"a"}, {"literal":"f"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$16", "__", "interval$string$17"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$18", "symbols": [{"literal":"f"}, {"literal":"r"}, {"literal":"o"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$subexpression$10$subexpression$1", "symbols": [/[tT]/, /[hH]/, /[rR]/, /[oO]/, /[uU]/, /[gG]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$10", "symbols": ["interval$subexpression$10$subexpression$1"]},
    {"name": "interval$subexpression$10$subexpression$2", "symbols": [/[tT]/, /[hH]/, /[rR]/, /[uU]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$10", "symbols": ["interval$subexpression$10$subexpression$2"]},
    {"name": "interval", "symbols": ["interval$string$18", "__", "datevalue", "__", "interval$subexpression$10", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 })},
    {"name": "interval$subexpression$11$subexpression$1", "symbols": [/[tT]/, /[hH]/, /[rR]/, /[oO]/, /[uU]/, /[gG]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$11", "symbols": ["interval$subexpression$11$subexpression$1"]},
    {"name": "interval$subexpression$11$subexpression$2", "symbols": [/[tT]/, /[hH]/, /[rR]/, /[uU]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval$subexpression$11", "symbols": ["interval$subexpression$11$subexpression$2"]},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$subexpression$11", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$19", "symbols": [{"literal":"f"}, {"literal":"r"}, {"literal":"o"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$20", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"t"}, {"literal":"i"}, {"literal":"l"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$19", "__", "datevalue", "__", "interval$string$20", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$21", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"t"}, {"literal":"i"}, {"literal":"l"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$21", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$22", "symbols": [{"literal":"f"}, {"literal":"r"}, {"literal":"o"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$23", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$22", "__", "datevalue", "__", "interval$string$23", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$24", "symbols": [{"literal":"f"}, {"literal":"r"}, {"literal":"o"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$25", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$24", "__", "datevalue", "__", "interval$string$25", "__", "interval_endpoint"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/`, confidence: 0.95 })},
    {"name": "interval$string$26", "symbols": [{"literal":"f"}, {"literal":"r"}, {"literal":"o"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$27", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$26", "__", "datevalue", "__", "interval$string$27", "__", "open_endpoint"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$28", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$28", "__", "interval_endpoint"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/`, confidence: 0.95 })},
    {"name": "interval$string$29", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$29", "__", "open_endpoint"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$30", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["open_endpoint", "__", "interval$string$30", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$31", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$31", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval", "symbols": ["datevalue", "_", {"literal":"-"}, "_", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$32", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"t"}, {"literal":"w"}, {"literal":"e"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$33", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$32", "__", "datevalue", "__", "interval$string$33", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$34", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval_endpoint", "__", "interval$string$34", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$35", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"t"}, {"literal":"i"}, {"literal":"l"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$35", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$36", "symbols": [{"literal":"a"}, {"literal":"f"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$36", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$37", "symbols": [{"literal":"s"}, {"literal":"i"}, {"literal":"n"}, {"literal":"c"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$37", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval_endpoint$subexpression$1", "symbols": [/[uU]/, /[nN]/, /[kK]/, /[nN]/, /[oO]/, /[wW]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "interval_endpoint", "symbols": ["interval_endpoint$subexpression$1"], "postprocess": () => ''},
    {"name": "interval_endpoint", "symbols": [{"literal":"?"}], "postprocess": () => ''},
    {"name": "open_endpoint$subexpression$1$subexpression$1", "symbols": [/[oO]/, /[pP]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "open_endpoint$subexpression$1$subexpression$2$subexpression$1", "symbols": [/[sS]/, /[tT]/, /[aA]/, /[rR]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "open_endpoint$subexpression$1$subexpression$2", "symbols": ["open_endpoint$subexpression$1$subexpression$2$subexpression$1"]},
    {"name": "open_endpoint$subexpression$1$subexpression$2$subexpression$2", "symbols": [/[eE]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "open_endpoint$subexpression$1$subexpression$2", "symbols": ["open_endpoint$subexpression$1$subexpression$2$subexpression$2"]},
    {"name": "open_endpoint$subexpression$1", "symbols": ["open_endpoint$subexpression$1$subexpression$1", "__", "open_endpoint$subexpression$1$subexpression$2"]},
    {"name": "open_endpoint", "symbols": ["open_endpoint$subexpression$1"], "postprocess": () => '..'},
    {"name": "open_endpoint$subexpression$2", "symbols": [/[oO]/, /[nN]/, /[wW]/, /[aA]/, /[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "open_endpoint", "symbols": ["open_endpoint$subexpression$2"], "postprocess": () => '..'},
    {"name": "open_endpoint$subexpression$3", "symbols": [/[oO]/, /[nN]/, /[wW]/, /[aA]/, /[rR]/, /[dD]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "open_endpoint", "symbols": ["open_endpoint$subexpression$3"], "postprocess": () => '..'},
    {"name": "set$subexpression$1", "symbols": [/[oO]/, /[nN]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set$subexpression$2", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set", "symbols": ["set$subexpression$1", "__", "set$subexpression$2", "_", {"literal":":"}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf},${d[14].edtf}]`, confidence: 0.95 })},
    {"name": "set$subexpression$3", "symbols": [/[oO]/, /[nN]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set$subexpression$4", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set", "symbols": ["set$subexpression$3", "__", "set$subexpression$4", "_", {"literal":":"}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf}]`, confidence: 0.95 })},
    {"name": "set$subexpression$5", "symbols": [/[eE]/, /[iI]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set$string$1", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set", "symbols": ["set$subexpression$5", "__", "datevalue", "__", "set$string$1", "__", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[2].edtf},${d[6].edtf}]`, confidence: 0.95 })},
    {"name": "set$string$2", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set$string$3", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set", "symbols": ["datevalue", "__", "set$string$2", "__", "datevalue", "__", "set$string$3", "__", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf},${d[8].edtf}]`, confidence: 0.9 })},
    {"name": "set$string$4", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set", "symbols": ["datevalue", "__", "set$string$4", "__", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf}]`, confidence: 0.9 })},
    {"name": "set$string$5", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set$string$6", "symbols": [{"literal":"e"}, {"literal":"a"}, {"literal":"r"}, {"literal":"l"}, {"literal":"i"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set", "symbols": ["datevalue", "__", "set$string$5", "__", "set$string$6"], "postprocess": d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 })},
    {"name": "set$string$7", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set$string$8", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"f"}, {"literal":"o"}, {"literal":"r"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set", "symbols": ["datevalue", "__", "set$string$7", "__", "set$string$8"], "postprocess": d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 })},
    {"name": "list$subexpression$1", "symbols": [/[aA]/, /[lL]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list$subexpression$2", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list", "symbols": ["list$subexpression$1", "__", "list$subexpression$2", "_", {"literal":":"}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf},${d[14].edtf}}`, confidence: 0.95 })},
    {"name": "list$subexpression$3", "symbols": [/[aA]/, /[lL]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list$subexpression$4", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list", "symbols": ["list$subexpression$3", "__", "list$subexpression$4", "_", {"literal":":"}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf}}`, confidence: 0.95 })},
    {"name": "list$subexpression$5", "symbols": [/[bB]/, /[oO]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list$string$1", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "list", "symbols": ["list$subexpression$5", "__", "datevalue", "__", "list$string$1", "__", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[2].edtf},${d[6].edtf}}`, confidence: 0.95 })},
    {"name": "list$string$2", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "list$string$3", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "list", "symbols": ["datevalue", "__", "list$string$2", "__", "datevalue", "__", "list$string$3", "__", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf},${d[8].edtf}}`, confidence: 0.9 })},
    {"name": "list$string$4", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "list", "symbols": ["datevalue", "__", "list$string$4", "__", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf}}`, confidence: 0.9 })},
    {"name": "season", "symbols": ["qualifier", "__", "season_name", "__", "hemisphere_north", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[6])}-${northernSeasons[d[2].toLowerCase()]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["season_name", "__", "hemisphere_north", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${northernSeasons[d[0].toLowerCase()]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "season_name", "__", "hemisphere_south", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[6])}-${southernSeasons[d[2].toLowerCase()]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["season_name", "__", "hemisphere_south", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${southernSeasons[d[0].toLowerCase()]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "quarter_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["quarter_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "quadrimester_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["quadrimester_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "semestral_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["semestral_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["qualifier", "__", "season_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[4])}-${seasons[d[2].toLowerCase()]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["season_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${pad4(d[2])}-${seasons[d[0].toLowerCase()]}`, confidence: 0.95 })},
    {"name": "season_name$subexpression$1$subexpression$1", "symbols": [/[sS]/, /[pP]/, /[rR]/, /[iI]/, /[nN]/, /[gG]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "season_name$subexpression$1", "symbols": ["season_name$subexpression$1$subexpression$1"]},
    {"name": "season_name$subexpression$1$subexpression$2", "symbols": [/[sS]/, /[uU]/, /[mM]/, /[mM]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "season_name$subexpression$1", "symbols": ["season_name$subexpression$1$subexpression$2"]},
    {"name": "season_name$subexpression$1$subexpression$3", "symbols": [/[aA]/, /[uU]/, /[tT]/, /[uU]/, /[mM]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "season_name$subexpression$1", "symbols": ["season_name$subexpression$1$subexpression$3"]},
    {"name": "season_name$subexpression$1$subexpression$4", "symbols": [/[fF]/, /[aA]/, /[lL]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "season_name$subexpression$1", "symbols": ["season_name$subexpression$1$subexpression$4"]},
    {"name": "season_name$subexpression$1$subexpression$5", "symbols": [/[wW]/, /[iI]/, /[nN]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "season_name$subexpression$1", "symbols": ["season_name$subexpression$1$subexpression$5"]},
    {"name": "season_name", "symbols": ["season_name$subexpression$1"], "postprocess": d => d[0][0]},
    {"name": "hemisphere_north$subexpression$1$subexpression$1", "symbols": [/[nN]/, /[oO]/, /[rR]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_north$subexpression$1$subexpression$2", "symbols": [/[hH]/, /[eE]/, /[mM]/, /[iI]/, /[sS]/, /[pP]/, /[hH]/, /[eE]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_north$subexpression$1", "symbols": ["hemisphere_north$subexpression$1$subexpression$1", "__", "hemisphere_north$subexpression$1$subexpression$2"]},
    {"name": "hemisphere_north$subexpression$1$subexpression$3", "symbols": [/[nN]/, /[oO]/, /[rR]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_north$subexpression$1", "symbols": ["hemisphere_north$subexpression$1$subexpression$3"]},
    {"name": "hemisphere_north", "symbols": [{"literal":"("}, "_", "hemisphere_north$subexpression$1", "_", {"literal":")"}], "postprocess": () => 'north'},
    {"name": "hemisphere_north$subexpression$2$subexpression$1", "symbols": [/[nN]/, /[oO]/, /[rR]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_north$subexpression$2$subexpression$2", "symbols": [/[hH]/, /[eE]/, /[mM]/, /[iI]/, /[sS]/, /[pP]/, /[hH]/, /[eE]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_north$subexpression$2", "symbols": ["hemisphere_north$subexpression$2$subexpression$1", "__", "hemisphere_north$subexpression$2$subexpression$2"]},
    {"name": "hemisphere_north$subexpression$2$subexpression$3", "symbols": [/[nN]/, /[oO]/, /[rR]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_north$subexpression$2", "symbols": ["hemisphere_north$subexpression$2$subexpression$3"]},
    {"name": "hemisphere_north", "symbols": [{"literal":","}, "_", "hemisphere_north$subexpression$2"], "postprocess": () => 'north'},
    {"name": "hemisphere_south$subexpression$1$subexpression$1", "symbols": [/[sS]/, /[oO]/, /[uU]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_south$subexpression$1$subexpression$2", "symbols": [/[hH]/, /[eE]/, /[mM]/, /[iI]/, /[sS]/, /[pP]/, /[hH]/, /[eE]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_south$subexpression$1", "symbols": ["hemisphere_south$subexpression$1$subexpression$1", "__", "hemisphere_south$subexpression$1$subexpression$2"]},
    {"name": "hemisphere_south$subexpression$1$subexpression$3", "symbols": [/[sS]/, /[oO]/, /[uU]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_south$subexpression$1", "symbols": ["hemisphere_south$subexpression$1$subexpression$3"]},
    {"name": "hemisphere_south", "symbols": [{"literal":"("}, "_", "hemisphere_south$subexpression$1", "_", {"literal":")"}], "postprocess": () => 'south'},
    {"name": "hemisphere_south$subexpression$2$subexpression$1", "symbols": [/[sS]/, /[oO]/, /[uU]/, /[tT]/, /[hH]/, /[eE]/, /[rR]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_south$subexpression$2$subexpression$2", "symbols": [/[hH]/, /[eE]/, /[mM]/, /[iI]/, /[sS]/, /[pP]/, /[hH]/, /[eE]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_south$subexpression$2", "symbols": ["hemisphere_south$subexpression$2$subexpression$1", "__", "hemisphere_south$subexpression$2$subexpression$2"]},
    {"name": "hemisphere_south$subexpression$2$subexpression$3", "symbols": [/[sS]/, /[oO]/, /[uU]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "hemisphere_south$subexpression$2", "symbols": ["hemisphere_south$subexpression$2$subexpression$3"]},
    {"name": "hemisphere_south", "symbols": [{"literal":","}, "_", "hemisphere_south$subexpression$2"], "postprocess": () => 'south'},
    {"name": "quarter_name$subexpression$1", "symbols": [/[qQ]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$1", {"literal":"1"}], "postprocess": () => '33'},
    {"name": "quarter_name$subexpression$2", "symbols": [/[qQ]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$2", {"literal":"2"}], "postprocess": () => '34'},
    {"name": "quarter_name$subexpression$3", "symbols": [/[qQ]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$3", {"literal":"3"}], "postprocess": () => '35'},
    {"name": "quarter_name$subexpression$4", "symbols": [/[qQ]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$4", {"literal":"4"}], "postprocess": () => '36'},
    {"name": "quarter_name$subexpression$5", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[rR]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$5", "__", {"literal":"1"}], "postprocess": () => '33'},
    {"name": "quarter_name$subexpression$6", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[rR]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$6", "__", {"literal":"2"}], "postprocess": () => '34'},
    {"name": "quarter_name$subexpression$7", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[rR]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$7", "__", {"literal":"3"}], "postprocess": () => '35'},
    {"name": "quarter_name$subexpression$8", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[rR]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$8", "__", {"literal":"4"}], "postprocess": () => '36'},
    {"name": "quarter_name$subexpression$9$subexpression$1", "symbols": [{"literal":"1"}, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name$subexpression$9", "symbols": ["quarter_name$subexpression$9$subexpression$1"]},
    {"name": "quarter_name$subexpression$9$subexpression$2", "symbols": [/[fF]/, /[iI]/, /[rR]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name$subexpression$9", "symbols": ["quarter_name$subexpression$9$subexpression$2"]},
    {"name": "quarter_name$subexpression$10", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[rR]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$9", "__", "quarter_name$subexpression$10"], "postprocess": () => '33'},
    {"name": "quarter_name$subexpression$11$subexpression$1", "symbols": [{"literal":"2"}, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name$subexpression$11", "symbols": ["quarter_name$subexpression$11$subexpression$1"]},
    {"name": "quarter_name$subexpression$11$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[cC]/, /[oO]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name$subexpression$11", "symbols": ["quarter_name$subexpression$11$subexpression$2"]},
    {"name": "quarter_name$subexpression$12", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[rR]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$11", "__", "quarter_name$subexpression$12"], "postprocess": () => '34'},
    {"name": "quarter_name$subexpression$13$subexpression$1", "symbols": [{"literal":"3"}, /[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name$subexpression$13", "symbols": ["quarter_name$subexpression$13$subexpression$1"]},
    {"name": "quarter_name$subexpression$13$subexpression$2", "symbols": [/[tT]/, /[hH]/, /[iI]/, /[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name$subexpression$13", "symbols": ["quarter_name$subexpression$13$subexpression$2"]},
    {"name": "quarter_name$subexpression$14", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[rR]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$13", "__", "quarter_name$subexpression$14"], "postprocess": () => '35'},
    {"name": "quarter_name$subexpression$15$subexpression$1", "symbols": [{"literal":"4"}, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name$subexpression$15", "symbols": ["quarter_name$subexpression$15$subexpression$1"]},
    {"name": "quarter_name$subexpression$15$subexpression$2", "symbols": [/[fF]/, /[oO]/, /[uU]/, /[rR]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name$subexpression$15", "symbols": ["quarter_name$subexpression$15$subexpression$2"]},
    {"name": "quarter_name$subexpression$16", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[rR]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quarter_name", "symbols": ["quarter_name$subexpression$15", "__", "quarter_name$subexpression$16"], "postprocess": () => '36'},
    {"name": "quadrimester_name$subexpression$1", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[dD]/, /[rR]/, /[iI]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name", "symbols": ["quadrimester_name$subexpression$1", "__", {"literal":"1"}], "postprocess": () => '37'},
    {"name": "quadrimester_name$subexpression$2", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[dD]/, /[rR]/, /[iI]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name", "symbols": ["quadrimester_name$subexpression$2", "__", {"literal":"2"}], "postprocess": () => '38'},
    {"name": "quadrimester_name$subexpression$3", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[dD]/, /[rR]/, /[iI]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name", "symbols": ["quadrimester_name$subexpression$3", "__", {"literal":"3"}], "postprocess": () => '39'},
    {"name": "quadrimester_name$subexpression$4$subexpression$1", "symbols": [{"literal":"1"}, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name$subexpression$4", "symbols": ["quadrimester_name$subexpression$4$subexpression$1"]},
    {"name": "quadrimester_name$subexpression$4$subexpression$2", "symbols": [/[fF]/, /[iI]/, /[rR]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name$subexpression$4", "symbols": ["quadrimester_name$subexpression$4$subexpression$2"]},
    {"name": "quadrimester_name$subexpression$5", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[dD]/, /[rR]/, /[iI]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name", "symbols": ["quadrimester_name$subexpression$4", "__", "quadrimester_name$subexpression$5"], "postprocess": () => '37'},
    {"name": "quadrimester_name$subexpression$6$subexpression$1", "symbols": [{"literal":"2"}, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name$subexpression$6", "symbols": ["quadrimester_name$subexpression$6$subexpression$1"]},
    {"name": "quadrimester_name$subexpression$6$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[cC]/, /[oO]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name$subexpression$6", "symbols": ["quadrimester_name$subexpression$6$subexpression$2"]},
    {"name": "quadrimester_name$subexpression$7", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[dD]/, /[rR]/, /[iI]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name", "symbols": ["quadrimester_name$subexpression$6", "__", "quadrimester_name$subexpression$7"], "postprocess": () => '38'},
    {"name": "quadrimester_name$subexpression$8$subexpression$1", "symbols": [{"literal":"3"}, /[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name$subexpression$8", "symbols": ["quadrimester_name$subexpression$8$subexpression$1"]},
    {"name": "quadrimester_name$subexpression$8$subexpression$2", "symbols": [/[tT]/, /[hH]/, /[iI]/, /[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name$subexpression$8", "symbols": ["quadrimester_name$subexpression$8$subexpression$2"]},
    {"name": "quadrimester_name$subexpression$9", "symbols": [/[qQ]/, /[uU]/, /[aA]/, /[dD]/, /[rR]/, /[iI]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "quadrimester_name", "symbols": ["quadrimester_name$subexpression$8", "__", "quadrimester_name$subexpression$9"], "postprocess": () => '39'},
    {"name": "semestral_name$subexpression$1$subexpression$1", "symbols": [/[sS]/, /[eE]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[rR]/, /[aA]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$1", "symbols": ["semestral_name$subexpression$1$subexpression$1"]},
    {"name": "semestral_name$subexpression$1$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$1", "symbols": ["semestral_name$subexpression$1$subexpression$2"]},
    {"name": "semestral_name", "symbols": ["semestral_name$subexpression$1", "__", {"literal":"1"}], "postprocess": () => '40'},
    {"name": "semestral_name$subexpression$2$subexpression$1", "symbols": [/[sS]/, /[eE]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[rR]/, /[aA]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$2", "symbols": ["semestral_name$subexpression$2$subexpression$1"]},
    {"name": "semestral_name$subexpression$2$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$2", "symbols": ["semestral_name$subexpression$2$subexpression$2"]},
    {"name": "semestral_name", "symbols": ["semestral_name$subexpression$2", "__", {"literal":"2"}], "postprocess": () => '41'},
    {"name": "semestral_name$subexpression$3$subexpression$1", "symbols": [{"literal":"1"}, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$3", "symbols": ["semestral_name$subexpression$3$subexpression$1"]},
    {"name": "semestral_name$subexpression$3$subexpression$2", "symbols": [/[fF]/, /[iI]/, /[rR]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$3", "symbols": ["semestral_name$subexpression$3$subexpression$2"]},
    {"name": "semestral_name$subexpression$4$subexpression$1", "symbols": [/[sS]/, /[eE]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[rR]/, /[aA]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$4", "symbols": ["semestral_name$subexpression$4$subexpression$1"]},
    {"name": "semestral_name$subexpression$4$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$4", "symbols": ["semestral_name$subexpression$4$subexpression$2"]},
    {"name": "semestral_name", "symbols": ["semestral_name$subexpression$3", "__", "semestral_name$subexpression$4"], "postprocess": () => '40'},
    {"name": "semestral_name$subexpression$5$subexpression$1", "symbols": [{"literal":"2"}, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$5", "symbols": ["semestral_name$subexpression$5$subexpression$1"]},
    {"name": "semestral_name$subexpression$5$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[cC]/, /[oO]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$5", "symbols": ["semestral_name$subexpression$5$subexpression$2"]},
    {"name": "semestral_name$subexpression$6$subexpression$1", "symbols": [/[sS]/, /[eE]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[rR]/, /[aA]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$6", "symbols": ["semestral_name$subexpression$6$subexpression$1"]},
    {"name": "semestral_name$subexpression$6$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[mM]/, /[eE]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "semestral_name$subexpression$6", "symbols": ["semestral_name$subexpression$6$subexpression$2"]},
    {"name": "semestral_name", "symbols": ["semestral_name$subexpression$5", "__", "semestral_name$subexpression$6"], "postprocess": () => '41'},
    {"name": "date", "symbols": ["datevalue", "_", "parenthetical_qualification"], "postprocess":  d => {
          const qual = d[2];
          if (qual.type === 'global') {
            return { type: 'date', edtf: `${d[0].edtf}${qual.qual}`, confidence: d[0].confidence * 0.9 };
          } else {
            // Partial qualifications
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
            // Partial qualifications
            return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
          }
        } },
    {"name": "datevalue", "symbols": ["qualifier", "_", "datevalue_base"], "postprocess": d => ({ type: 'date', edtf: `${d[2].edtf}${d[0]}`, confidence: d[2].confidence * 0.95 })},
    {"name": "datevalue", "symbols": ["datevalue_base", "_", "qualifier"], "postprocess": d => ({ type: 'date', edtf: `${d[0].edtf}${d[2]}`, confidence: d[0].confidence * 0.95 })},
    {"name": "datevalue", "symbols": ["datevalue_base"], "postprocess": id},
    {"name": "datevalue_base$subexpression$1", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$2", "symbols": [/[yY]/, /[eE]/, /[aA]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$1", "__", "datevalue_base$subexpression$2", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: pad4(d[4]), confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$3", "symbols": [/[yY]/, /[eE]/, /[aA]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$3", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: pad4(d[2]), confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$4", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$4", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: pad4(d[2]), confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$5", "symbols": [/[sS]/, /[oO]/, /[mM]/, /[eE]/, /[tT]/, /[iI]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$6", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$5", "__", "datevalue_base$subexpression$6", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[4].toLowerCase()]}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$7", "symbols": [/[sS]/, /[oO]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$8", "symbols": [/[dD]/, /[aA]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$9", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$7", "__", "datevalue_base$subexpression$8", "__", "datevalue_base$subexpression$9", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6].toLowerCase()]}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$10", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$11", "symbols": [/[dD]/, /[aA]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$12", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$10", "__", "datevalue_base$subexpression$11", "__", "datevalue_base$subexpression$12", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6].toLowerCase()]}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$13", "symbols": [/[sS]/, /[oO]/, /[mM]/, /[eE]/, /[tT]/, /[iI]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$14", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$13", "__", "datevalue_base$subexpression$14", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-XX-XX`, confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$15", "symbols": [/[sS]/, /[oO]/, /[mM]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$16", "symbols": [/[mM]/, /[oO]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$17", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$15", "__", "datevalue_base$subexpression$16", "__", "datevalue_base$subexpression$17", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$18", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$19", "symbols": [/[mM]/, /[oO]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$20", "symbols": [/[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$18", "__", "datevalue_base$subexpression$19", "__", "datevalue_base$subexpression$20", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-XX`, confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$21", "symbols": [/[bB]/, /[eE]/, /[fF]/, /[oO]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$22", "symbols": [/[cC]/, /[oO]/, /[mM]/, /[mM]/, /[oO]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$23", "symbols": [/[eE]/, /[rR]/, /[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "datevalue_base$subexpression$21", "__", "datevalue_base$subexpression$22", "__", "datevalue_base$subexpression$23"], "postprocess":  d => {
          const year = parseInt(d[0], 10);
          const bceYear = year - 1;
          return { type: 'date', edtf: `-${pad4(bceYear)}`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$24", "symbols": [/[bB]/, /[eE]/, /[fF]/, /[oO]/, /[rR]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$25", "symbols": [/[cC]/, /[hH]/, /[rR]/, /[iI]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "datevalue_base$subexpression$24", "__", "datevalue_base$subexpression$25"], "postprocess":  d => {
          const year = parseInt(d[0], 10);
          const bceYear = year - 1;
          return { type: 'date', edtf: `-${pad4(bceYear)}`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$26", "symbols": [/[aA]/, /[nN]/, /[nN]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$27", "symbols": [/[dD]/, /[oO]/, /[mM]/, /[iI]/, /[nN]/, /[iI]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$26", "__", "datevalue_base$subexpression$27", "__", "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[4], 10)), confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$28", "symbols": [/[aA]/, /[nN]/, /[nN]/, /[oO]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$29", "symbols": [/[dD]/, /[oO]/, /[mM]/, /[iI]/, /[nN]/, /[iI]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "datevalue_base$subexpression$28", "__", "datevalue_base$subexpression$29"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$30", "symbols": [/[cC]/, /[oO]/, /[mM]/, /[mM]/, /[oO]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$31", "symbols": [/[eE]/, /[rR]/, /[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$30", "__", "datevalue_base$subexpression$31", "__", "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[4], 10)), confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$32", "symbols": [/[cC]/, /[oO]/, /[mM]/, /[mM]/, /[oO]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$33", "symbols": [/[eE]/, /[rR]/, /[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "datevalue_base$subexpression$32", "__", "datevalue_base$subexpression$33"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$34", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "datevalue_base$subexpression$34"], "postprocess":  d => {
          const year = parseInt(d[0], 10);
          const bceYear = year - 1;
          return { type: 'date', edtf: `-${pad4(bceYear)}`, confidence: 0.9 };
        } },
    {"name": "datevalue_base$subexpression$35", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$35", "__", "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[2], 10)), confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$36", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["numeric_year", "__", "datevalue_base$subexpression$36"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$37$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$37$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$37$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$37", "symbols": ["datevalue_base$subexpression$37$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$37$subexpression$2", {"literal":"."}, "_", "datevalue_base$subexpression$37$subexpression$3", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$37$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$37$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$37", "symbols": ["datevalue_base$subexpression$37$subexpression$4", {"literal":"."}, "_", "datevalue_base$subexpression$37$subexpression$5", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$37$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$37", "symbols": ["datevalue_base$subexpression$37$subexpression$6"]},
    {"name": "datevalue_base$subexpression$37$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$37", "symbols": ["datevalue_base$subexpression$37$subexpression$7"]},
    {"name": "datevalue_base", "symbols": ["numeric_year", "_", "datevalue_base$subexpression$37"], "postprocess":  d => {
          const year = parseInt(d[0], 10);
          const bceYear = year - 1;
          return { type: 'date', edtf: `-${pad4(bceYear)}`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$38$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$38$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$38", "symbols": ["datevalue_base$subexpression$38$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$38$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$38$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$38$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$38", "symbols": ["datevalue_base$subexpression$38$subexpression$3", {"literal":"."}, "_", "datevalue_base$subexpression$38$subexpression$4", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$38$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$38", "symbols": ["datevalue_base$subexpression$38$subexpression$5"]},
    {"name": "datevalue_base$subexpression$38$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$38", "symbols": ["datevalue_base$subexpression$38$subexpression$6"]},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$38", "_", "numeric_year"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[2], 10)), confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$39$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$39$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$39", "symbols": ["datevalue_base$subexpression$39$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$39$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$39$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$39$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$39", "symbols": ["datevalue_base$subexpression$39$subexpression$3", {"literal":"."}, "_", "datevalue_base$subexpression$39$subexpression$4", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$39$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$39", "symbols": ["datevalue_base$subexpression$39$subexpression$5"]},
    {"name": "datevalue_base$subexpression$39$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$39", "symbols": ["datevalue_base$subexpression$39$subexpression$6"]},
    {"name": "datevalue_base", "symbols": ["numeric_year", "_", "datevalue_base$subexpression$39"], "postprocess": d => ({ type: 'date', edtf: pad4(parseInt(d[0], 10)), confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$40", "symbols": [/[oO]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$41", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$42", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$40", "__", "datevalue_base$subexpression$41", "__", "ordinal_day", "__", "datevalue_base$subexpression$42", "__", "month_name", "_", {"literal":","}, "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[12])}-${months[d[8].toLowerCase()]}-${pad2(d[4])}`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$43", "symbols": [/[oO]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$44", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$45", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$43", "__", "datevalue_base$subexpression$44", "__", "ordinal_day", "__", "datevalue_base$subexpression$45", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[10])}-${months[d[8].toLowerCase()]}-${pad2(d[4])}`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$46", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$47", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$46", "__", "ordinal_day", "__", "datevalue_base$subexpression$47", "__", "month_name", "_", {"literal":","}, "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[10])}-${months[d[6].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$48", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$49", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$48", "__", "ordinal_day", "__", "datevalue_base$subexpression$49", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[6].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$50", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["ordinal_day", "__", "datevalue_base$subexpression$50", "__", "month_name", "_", {"literal":","}, "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[4].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$51", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["ordinal_day", "__", "datevalue_base$subexpression$51", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[4].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$52", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "datevalue_base$subexpression$52", "__", "ordinal_day", "_", {"literal":","}, "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[8])}-${months[d[0].toLowerCase()]}-${pad2(d[4])}`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$53", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "datevalue_base$subexpression$53", "__", "ordinal_day", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}-${pad2(d[4])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "ordinal_day", "_", {"literal":","}, "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "ordinal_day", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["ordinal_day", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[2].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "day_num", "_", {"literal":","}, "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[6])}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "day_num", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["day_num", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[4])}-${months[d[2].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[2])}-${months[d[0].toLowerCase()]}`, confidence: 0.95 })},
    {"name": "datevalue_base$string$1", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base$string$2", "symbols": [{"literal":"0"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["datevalue_base$string$1", "__", "digit", "digit", {"literal":"0"}, "datevalue_base$string$2", {"literal":"s"}], "postprocess": d => ({ type: 'date', edtf: `${d[2]}${d[3]}XX`, confidence: 0.98 })},
    {"name": "datevalue_base$string$3", "symbols": [{"literal":"0"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["digit", "digit", {"literal":"0"}, "datevalue_base$string$3", {"literal":"s"}], "postprocess": d => ({ type: 'date', edtf: `${d[0]}${d[1]}XX`, confidence: 0.98 })},
    {"name": "datevalue_base$string$4", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base$string$5", "symbols": [{"literal":"0"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["datevalue_base$string$4", "__", "digit", "digit", {"literal":"0"}, "datevalue_base$string$5"], "postprocess": d => ({ type: 'date', edtf: `${d[2]}${d[3]}XX`, confidence: 0.98 })},
    {"name": "datevalue_base$string$6", "symbols": [{"literal":"0"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["digit", "digit", {"literal":"0"}, "datevalue_base$string$6"], "postprocess": d => ({ type: 'date', edtf: `${d[0]}${d[1]}XX`, confidence: 0.98 })},
    {"name": "datevalue_base$string$7", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base$string$8", "symbols": [{"literal":"0"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["datevalue_base$string$7", "__", "digit", "digit", "digit", "datevalue_base$string$8", {"literal":"s"}], "postprocess": d => ({ type: 'date', edtf: `${d[2]}${d[3]}${d[4]}X`, confidence: 0.95 })},
    {"name": "datevalue_base$string$9", "symbols": [{"literal":"0"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["digit", "digit", "digit", "datevalue_base$string$9", {"literal":"s"}], "postprocess": d => ({ type: 'date', edtf: `${d[0]}${d[1]}${d[2]}X`, confidence: 0.95 })},
    {"name": "datevalue_base$string$10", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base$string$11", "symbols": [{"literal":"0"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["datevalue_base$string$10", "__", "digit", "digit", "digit", "datevalue_base$string$11"], "postprocess": d => ({ type: 'date', edtf: `${d[2]}${d[3]}${d[4]}X`, confidence: 0.95 })},
    {"name": "datevalue_base$string$12", "symbols": [{"literal":"0"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["digit", "digit", "digit", "datevalue_base$string$12"], "postprocess": d => ({ type: 'date', edtf: `${d[0]}${d[1]}${d[2]}X`, confidence: 0.95 })},
    {"name": "datevalue_base$string$13", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["datevalue_base$string$13", "__", {"literal":"'"}, "digit", "digit", {"literal":"s"}], "postprocess": d => ({ type: 'date', edtf: `19${d[3]}X`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": [{"literal":"'"}, "digit", "digit", {"literal":"s"}], "postprocess": d => ({ type: 'date', edtf: `19${d[1]}X`, confidence: 0.9 })},
    {"name": "datevalue_base$subexpression$54", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$55$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$55", "symbols": ["datevalue_base$subexpression$55$subexpression$1"]},
    {"name": "datevalue_base$subexpression$55$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$55", "symbols": ["datevalue_base$subexpression$55$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$56$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$56$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$56$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$56", "symbols": ["datevalue_base$subexpression$56$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$56$subexpression$2", {"literal":"."}, "_", "datevalue_base$subexpression$56$subexpression$3", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$56$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$56$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$56", "symbols": ["datevalue_base$subexpression$56$subexpression$4", {"literal":"."}, "_", "datevalue_base$subexpression$56$subexpression$5", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$56$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$56", "symbols": ["datevalue_base$subexpression$56$subexpression$6"]},
    {"name": "datevalue_base$subexpression$56$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$56", "symbols": ["datevalue_base$subexpression$56$subexpression$7"]},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$54", "__", "ordinal_century", "__", "datevalue_base$subexpression$55", "__", "datevalue_base$subexpression$56"], "postprocess":  d => {
          const centuryNum = d[2];
          const yearPrefix = String(centuryNum - 1).padStart(2, '0');
          return { type: 'date', edtf: `-${yearPrefix}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$57$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$57", "symbols": ["datevalue_base$subexpression$57$subexpression$1"]},
    {"name": "datevalue_base$subexpression$57$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$57", "symbols": ["datevalue_base$subexpression$57$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$58$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$58$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$58$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$58", "symbols": ["datevalue_base$subexpression$58$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$58$subexpression$2", {"literal":"."}, "_", "datevalue_base$subexpression$58$subexpression$3", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$58$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$58$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$58", "symbols": ["datevalue_base$subexpression$58$subexpression$4", {"literal":"."}, "_", "datevalue_base$subexpression$58$subexpression$5", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$58$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$58", "symbols": ["datevalue_base$subexpression$58$subexpression$6"]},
    {"name": "datevalue_base$subexpression$58$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$58", "symbols": ["datevalue_base$subexpression$58$subexpression$7"]},
    {"name": "datevalue_base", "symbols": ["ordinal_century", "__", "datevalue_base$subexpression$57", "__", "datevalue_base$subexpression$58"], "postprocess":  d => {
          const centuryNum = d[0];
          const yearPrefix = String(centuryNum - 1).padStart(2, '0');
          return { type: 'date', edtf: `-${yearPrefix}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$59", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$60$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$60", "symbols": ["datevalue_base$subexpression$60$subexpression$1"]},
    {"name": "datevalue_base$subexpression$60$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$60", "symbols": ["datevalue_base$subexpression$60$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$61$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$61$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$61$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$61", "symbols": ["datevalue_base$subexpression$61$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$61$subexpression$2", {"literal":"."}, "_", "datevalue_base$subexpression$61$subexpression$3", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$61$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$61$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$61", "symbols": ["datevalue_base$subexpression$61$subexpression$4", {"literal":"."}, "_", "datevalue_base$subexpression$61$subexpression$5", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$61$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$61", "symbols": ["datevalue_base$subexpression$61$subexpression$6"]},
    {"name": "datevalue_base$subexpression$61$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$61", "symbols": ["datevalue_base$subexpression$61$subexpression$7"]},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$59", "__", "spelled_ordinal_century", "__", "datevalue_base$subexpression$60", "__", "datevalue_base$subexpression$61"], "postprocess":  d => {
          const centuryNum = d[2];
          const yearPrefix = String(centuryNum - 1).padStart(2, '0');
          return { type: 'date', edtf: `-${yearPrefix}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$62$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$62", "symbols": ["datevalue_base$subexpression$62$subexpression$1"]},
    {"name": "datevalue_base$subexpression$62$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$62", "symbols": ["datevalue_base$subexpression$62$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$63$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$63$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$63$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$63", "symbols": ["datevalue_base$subexpression$63$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$63$subexpression$2", {"literal":"."}, "_", "datevalue_base$subexpression$63$subexpression$3", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$63$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$63$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$63", "symbols": ["datevalue_base$subexpression$63$subexpression$4", {"literal":"."}, "_", "datevalue_base$subexpression$63$subexpression$5", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$63$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$63", "symbols": ["datevalue_base$subexpression$63$subexpression$6"]},
    {"name": "datevalue_base$subexpression$63$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$63", "symbols": ["datevalue_base$subexpression$63$subexpression$7"]},
    {"name": "datevalue_base", "symbols": ["spelled_ordinal_century", "__", "datevalue_base$subexpression$62", "__", "datevalue_base$subexpression$63"], "postprocess":  d => {
          const centuryNum = d[0];
          const yearPrefix = String(centuryNum - 1).padStart(2, '0');
          return { type: 'date', edtf: `-${yearPrefix}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$64", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$65", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$66$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$66$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$66$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$66", "symbols": ["datevalue_base$subexpression$66$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$66$subexpression$2", {"literal":"."}, "_", "datevalue_base$subexpression$66$subexpression$3", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$66$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$66$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$66", "symbols": ["datevalue_base$subexpression$66$subexpression$4", {"literal":"."}, "_", "datevalue_base$subexpression$66$subexpression$5", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$66$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$66", "symbols": ["datevalue_base$subexpression$66$subexpression$6"]},
    {"name": "datevalue_base$subexpression$66$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$66", "symbols": ["datevalue_base$subexpression$66$subexpression$7"]},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$64", "__", "spelled_century", "__", "datevalue_base$subexpression$65", "__", "datevalue_base$subexpression$66"], "postprocess":  d => {
          const centuryPrefix = d[2];
          const year = parseInt(centuryPrefix, 10) * 100;
          return { type: 'date', edtf: `-${pad4(year - 1)}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$67", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$68$subexpression$1", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$68$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$68$subexpression$3", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$68", "symbols": ["datevalue_base$subexpression$68$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$68$subexpression$2", {"literal":"."}, "_", "datevalue_base$subexpression$68$subexpression$3", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$68$subexpression$4", "symbols": [/[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$68$subexpression$5", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$68", "symbols": ["datevalue_base$subexpression$68$subexpression$4", {"literal":"."}, "_", "datevalue_base$subexpression$68$subexpression$5", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$68$subexpression$6", "symbols": [/[bB]/, /[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$68", "symbols": ["datevalue_base$subexpression$68$subexpression$6"]},
    {"name": "datevalue_base$subexpression$68$subexpression$7", "symbols": [/[bB]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$68", "symbols": ["datevalue_base$subexpression$68$subexpression$7"]},
    {"name": "datevalue_base", "symbols": ["spelled_century", "__", "datevalue_base$subexpression$67", "__", "datevalue_base$subexpression$68"], "postprocess":  d => {
          const centuryPrefix = d[0];
          const year = parseInt(centuryPrefix, 10) * 100;
          return { type: 'date', edtf: `-${pad4(year - 1)}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$69", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$70$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$70", "symbols": ["datevalue_base$subexpression$70$subexpression$1"]},
    {"name": "datevalue_base$subexpression$70$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$70", "symbols": ["datevalue_base$subexpression$70$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$71$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$71$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$71", "symbols": ["datevalue_base$subexpression$71$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$71$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$71$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$71$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$71", "symbols": ["datevalue_base$subexpression$71$subexpression$3", {"literal":"."}, "_", "datevalue_base$subexpression$71$subexpression$4", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$71$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$71", "symbols": ["datevalue_base$subexpression$71$subexpression$5"]},
    {"name": "datevalue_base$subexpression$71$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$71", "symbols": ["datevalue_base$subexpression$71$subexpression$6"]},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$69", "__", "ordinal_century", "__", "datevalue_base$subexpression$70", "__", "datevalue_base$subexpression$71"], "postprocess":  d => {
          const centuryNum = d[2];
          const year = (centuryNum - 1) * 100;
          const yearPrefix = String(year).substring(0, 2);
          return { type: 'date', edtf: `${yearPrefix}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$72$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$72", "symbols": ["datevalue_base$subexpression$72$subexpression$1"]},
    {"name": "datevalue_base$subexpression$72$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$72", "symbols": ["datevalue_base$subexpression$72$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$73$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$73$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$73", "symbols": ["datevalue_base$subexpression$73$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$73$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$73$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$73$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$73", "symbols": ["datevalue_base$subexpression$73$subexpression$3", {"literal":"."}, "_", "datevalue_base$subexpression$73$subexpression$4", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$73$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$73", "symbols": ["datevalue_base$subexpression$73$subexpression$5"]},
    {"name": "datevalue_base$subexpression$73$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$73", "symbols": ["datevalue_base$subexpression$73$subexpression$6"]},
    {"name": "datevalue_base", "symbols": ["ordinal_century", "__", "datevalue_base$subexpression$72", "__", "datevalue_base$subexpression$73"], "postprocess":  d => {
          const centuryNum = d[0];
          const year = (centuryNum - 1) * 100;
          const yearPrefix = String(year).substring(0, 2);
          return { type: 'date', edtf: `${yearPrefix}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$74", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$75", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$76$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$76$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$76", "symbols": ["datevalue_base$subexpression$76$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$76$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$76$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$76$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$76", "symbols": ["datevalue_base$subexpression$76$subexpression$3", {"literal":"."}, "_", "datevalue_base$subexpression$76$subexpression$4", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$76$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$76", "symbols": ["datevalue_base$subexpression$76$subexpression$5"]},
    {"name": "datevalue_base$subexpression$76$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$76", "symbols": ["datevalue_base$subexpression$76$subexpression$6"]},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$74", "__", "spelled_century", "__", "datevalue_base$subexpression$75", "__", "datevalue_base$subexpression$76"], "postprocess":  d => {
          const centuryPrefix = d[2];
          const year = (parseInt(centuryPrefix, 10) - 1) * 100;
          return { type: 'date', edtf: `${String(year).padStart(2, '0')}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$77", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$78$subexpression$1", "symbols": [/[aA]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$78$subexpression$2", "symbols": [/[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$78", "symbols": ["datevalue_base$subexpression$78$subexpression$1", {"literal":"."}, "_", "datevalue_base$subexpression$78$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$78$subexpression$3", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$78$subexpression$4", "symbols": [/[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$78", "symbols": ["datevalue_base$subexpression$78$subexpression$3", {"literal":"."}, "_", "datevalue_base$subexpression$78$subexpression$4", {"literal":"."}]},
    {"name": "datevalue_base$subexpression$78$subexpression$5", "symbols": [/[aA]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$78", "symbols": ["datevalue_base$subexpression$78$subexpression$5"]},
    {"name": "datevalue_base$subexpression$78$subexpression$6", "symbols": [/[cC]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$78", "symbols": ["datevalue_base$subexpression$78$subexpression$6"]},
    {"name": "datevalue_base", "symbols": ["spelled_century", "__", "datevalue_base$subexpression$77", "__", "datevalue_base$subexpression$78"], "postprocess":  d => {
          const centuryPrefix = d[0];
          const year = (parseInt(centuryPrefix, 10) - 1) * 100;
          return { type: 'date', edtf: `${String(year).padStart(2, '0')}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$79", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$80$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$80", "symbols": ["datevalue_base$subexpression$80$subexpression$1"]},
    {"name": "datevalue_base$subexpression$80$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$80", "symbols": ["datevalue_base$subexpression$80$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$79", "__", "ordinal_century", "__", "datevalue_base$subexpression$80"], "postprocess":  d => {
          const centuryNum = d[2];
          const year = (centuryNum - 1) * 100;
          return { type: 'date', edtf: `${String(year).substring(0, 2)}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$81$subexpression$1", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$81", "symbols": ["datevalue_base$subexpression$81$subexpression$1"]},
    {"name": "datevalue_base$subexpression$81$subexpression$2", "symbols": [/[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$81", "symbols": ["datevalue_base$subexpression$81$subexpression$2", {"literal":"."}]},
    {"name": "datevalue_base", "symbols": ["ordinal_century", "__", "datevalue_base$subexpression$81"], "postprocess":  d => {
          const centuryNum = d[0];
          const year = (centuryNum - 1) * 100;
          return { type: 'date', edtf: `${String(year).substring(0, 2)}XX`, confidence: 0.95 };
        } },
    {"name": "datevalue_base$subexpression$82", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$83", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$82", "__", "spelled_century", "__", "datevalue_base$subexpression$83"], "postprocess": d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$84", "symbols": [/[cC]/, /[eE]/, /[nN]/, /[tT]/, /[uU]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["spelled_century", "__", "datevalue_base$subexpression$84"], "postprocess": d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$85", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base$subexpression$86", "symbols": [/[hH]/, /[uU]/, /[nN]/, /[dD]/, /[rR]/, /[eE]/, /[dD]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$85", "__", "spelled_number_word", "__", "datevalue_base$subexpression$86"], "postprocess": d => ({ type: 'date', edtf: `${d[2]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$87", "symbols": [/[hH]/, /[uU]/, /[nN]/, /[dD]/, /[rR]/, /[eE]/, /[dD]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["spelled_number_word", "__", "datevalue_base$subexpression$87"], "postprocess": d => ({ type: 'date', edtf: `${d[0]}XX`, confidence: 0.95 })},
    {"name": "datevalue_base$subexpression$88", "symbols": [/[tT]/, /[hH]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "datevalue_base", "symbols": ["datevalue_base$subexpression$88", "__", "spelled_decade"], "postprocess": d => ({ type: 'date', edtf: `19${d[2]}X`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": ["spelled_decade"], "postprocess": d => ({ type: 'date', edtf: `19${d[0]}X`, confidence: 0.9 })},
    {"name": "datevalue_base", "symbols": ["digit", "digit", {"literal":"s"}], "postprocess":  d => {
          const twoDigit = d[0] + d[1];
          const year = parseInt(twoDigit, 10);
          // Determine century: if >= 30, assume 1900s, else 2000s
          const fullYear = year >= 30 ? 1900 + year : 2000 + year;
          return { type: 'date', edtf: `${String(fullYear).substring(0, 3)}X`, confidence: 0.9 };
        } },
    {"name": "datevalue_base", "symbols": ["slash_date_num", {"literal":"/"}, "digit", "digit", "digit", "digit"], "postprocess":  d => {
          const month = parseInt(d[0], 10);
          const year = d[2] + d[3] + d[4] + d[5];
          if (month >= 1 && month <= 12) {
            return { type: 'date', edtf: `${year}-${pad2(month)}`, confidence: 0.9 };
          }
          return null;
        } },
    {"name": "datevalue_base", "symbols": ["slash_date_num", {"literal":"/"}, "slash_date_num", {"literal":"/"}, "digit", "digit", "digit", "digit"], "postprocess":  d => {
          const first = d[0];
          const second = d[2];
          const year = d[4] + d[5] + d[6] + d[7];
          return buildSlashDate(first, second, year);
        } },
    {"name": "datevalue_base", "symbols": ["slash_date_num", {"literal":"/"}, "slash_date_num", {"literal":"/"}, "digit", "digit"], "postprocess":  d => {
          const first = d[0];
          const second = d[2];
          const year = d[4] + d[5];
          return buildSlashDate(first, second, year);
        } },
    {"name": "datevalue_base$string$14", "symbols": [{"literal":"-"}, {"literal":"i"}, {"literal":"s"}, {"literal":"h"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["year_num", "_", "datevalue_base$string$14"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 })},
    {"name": "datevalue_base$string$15", "symbols": [{"literal":"i"}, {"literal":"s"}, {"literal":"h"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue_base", "symbols": ["year_num", "datevalue_base$string$15"], "postprocess": d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 })},
    {"name": "datevalue_base", "symbols": ["year_num"], "postprocess": d => ({ type: 'date', edtf: pad4(d[0]), confidence: 0.95 })},
    {"name": "qualifier", "symbols": [{"literal":"?"}], "postprocess": () => '?'},
    {"name": "qualifier", "symbols": [{"literal":"~"}], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [{"literal":"≈"}], "postprocess": () => '~'},
    {"name": "qualifier$string$1", "symbols": [{"literal":"c"}, {"literal":"i"}, {"literal":"r"}, {"literal":"c"}, {"literal":"a"}, {"literal":"."}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$1"], "postprocess": () => '~'},
    {"name": "qualifier$string$2", "symbols": [{"literal":"c"}, {"literal":"i"}, {"literal":"r"}, {"literal":"c"}, {"literal":"a"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$2"], "postprocess": () => '~'},
    {"name": "qualifier$string$3", "symbols": [{"literal":"c"}, {"literal":"."}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$3"], "postprocess": () => '~'},
    {"name": "qualifier", "symbols": [{"literal":"c"}], "postprocess": () => '~'},
    {"name": "qualifier$string$4", "symbols": [{"literal":"c"}, {"literal":"a"}, {"literal":"."}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$4"], "postprocess": () => '~'},
    {"name": "qualifier$string$5", "symbols": [{"literal":"a"}, {"literal":"b"}, {"literal":"o"}, {"literal":"u"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$5"], "postprocess": () => '~'},
    {"name": "qualifier$string$6", "symbols": [{"literal":"a"}, {"literal":"r"}, {"literal":"o"}, {"literal":"u"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$6"], "postprocess": () => '~'},
    {"name": "qualifier$string$7", "symbols": [{"literal":"n"}, {"literal":"e"}, {"literal":"a"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$7"], "postprocess": () => '~'},
    {"name": "qualifier$string$8", "symbols": [{"literal":"a"}, {"literal":"p"}, {"literal":"p"}, {"literal":"r"}, {"literal":"o"}, {"literal":"x"}, {"literal":"i"}, {"literal":"m"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}, {"literal":"l"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$8"], "postprocess": () => '~'},
    {"name": "qualifier$string$9", "symbols": [{"literal":"a"}, {"literal":"p"}, {"literal":"p"}, {"literal":"r"}, {"literal":"o"}, {"literal":"x"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$9"], "postprocess": () => '~'},
    {"name": "qualifier$string$10", "symbols": [{"literal":"p"}, {"literal":"o"}, {"literal":"s"}, {"literal":"s"}, {"literal":"i"}, {"literal":"b"}, {"literal":"l"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$10"], "postprocess": () => '?'},
    {"name": "qualifier$string$11", "symbols": [{"literal":"m"}, {"literal":"a"}, {"literal":"y"}, {"literal":"b"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$11"], "postprocess": () => '?'},
    {"name": "qualifier$string$12", "symbols": [{"literal":"p"}, {"literal":"e"}, {"literal":"r"}, {"literal":"h"}, {"literal":"a"}, {"literal":"p"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$12"], "postprocess": () => '?'},
    {"name": "qualifier$string$13", "symbols": [{"literal":"p"}, {"literal":"r"}, {"literal":"o"}, {"literal":"b"}, {"literal":"a"}, {"literal":"b"}, {"literal":"l"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$13"], "postprocess": () => '?'},
    {"name": "qualifier$string$14", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"c"}, {"literal":"e"}, {"literal":"r"}, {"literal":"t"}, {"literal":"a"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$14"], "postprocess": () => '?'},
    {"name": "parenthetical_qualification$string$1", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"c"}, {"literal":"e"}, {"literal":"r"}, {"literal":"t"}, {"literal":"a"}, {"literal":"i"}, {"literal":"n"}, {"literal":"/"}, {"literal":"a"}, {"literal":"p"}, {"literal":"p"}, {"literal":"r"}, {"literal":"o"}, {"literal":"x"}, {"literal":"i"}, {"literal":"m"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "parenthetical_qualification", "symbols": [{"literal":"("}, "_", "parenthetical_qualification$string$1", "_", {"literal":")"}], "postprocess": () => ({ type: 'global', qual: '%' })},
    {"name": "parenthetical_qualification$string$2", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"c"}, {"literal":"e"}, {"literal":"r"}, {"literal":"t"}, {"literal":"a"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "parenthetical_qualification$string$3", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "parenthetical_qualification$string$4", "symbols": [{"literal":"a"}, {"literal":"p"}, {"literal":"p"}, {"literal":"r"}, {"literal":"o"}, {"literal":"x"}, {"literal":"i"}, {"literal":"m"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "parenthetical_qualification", "symbols": [{"literal":"("}, "_", "parenthetical_qualification$string$2", "__", "parenthetical_qualification$string$3", "__", "parenthetical_qualification$string$4", "_", {"literal":")"}], "postprocess": () => ({ type: 'global', qual: '%' })},
    {"name": "parenthetical_qualification$string$5", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"c"}, {"literal":"e"}, {"literal":"r"}, {"literal":"t"}, {"literal":"a"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "parenthetical_qualification", "symbols": [{"literal":"("}, "_", "parenthetical_qualification$string$5", "_", {"literal":")"}], "postprocess": () => ({ type: 'global', qual: '?' })},
    {"name": "parenthetical_qualification$string$6", "symbols": [{"literal":"a"}, {"literal":"p"}, {"literal":"p"}, {"literal":"r"}, {"literal":"o"}, {"literal":"x"}, {"literal":"i"}, {"literal":"m"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "parenthetical_qualification", "symbols": [{"literal":"("}, "_", "parenthetical_qualification$string$6", "_", {"literal":")"}], "postprocess": () => ({ type: 'global', qual: '~' })},
    {"name": "parenthetical_qualification", "symbols": [{"literal":"("}, "_", "partial_qual_list", "_", {"literal":")"}], "postprocess": d => ({ type: 'partial', quals: d[2] })},
    {"name": "partial_qual_list", "symbols": ["partial_qual", "_", {"literal":","}, "_", "partial_qual_list"], "postprocess": d => ({ ...d[4], ...d[0] })},
    {"name": "partial_qual_list", "symbols": ["partial_qual", "_", {"literal":","}, "_", "partial_qual"], "postprocess": d => ({ ...d[0], ...d[4] })},
    {"name": "partial_qual_list", "symbols": ["partial_qual"], "postprocess": d => d[0]},
    {"name": "partial_qual$subexpression$1", "symbols": [/[yY]/, /[eE]/, /[aA]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "partial_qual", "symbols": ["partial_qual$subexpression$1", "__", "qual_type"], "postprocess": d => ({ year: d[2] })},
    {"name": "partial_qual$subexpression$2", "symbols": [/[mM]/, /[oO]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "partial_qual", "symbols": ["partial_qual$subexpression$2", "__", "qual_type"], "postprocess": d => ({ month: d[2] })},
    {"name": "partial_qual$subexpression$3", "symbols": [/[dD]/, /[aA]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "partial_qual", "symbols": ["partial_qual$subexpression$3", "__", "qual_type"], "postprocess": d => ({ day: d[2] })},
    {"name": "qual_type$subexpression$1", "symbols": [/[uU]/, /[nN]/, /[cC]/, /[eE]/, /[rR]/, /[tT]/, /[aA]/, /[iI]/, /[nN]/, {"literal":"/"}, /[aA]/, /[pP]/, /[pP]/, /[rR]/, /[oO]/, /[xX]/, /[iI]/, /[mM]/, /[aA]/, /[tT]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "qual_type", "symbols": ["qual_type$subexpression$1"], "postprocess": () => '%'},
    {"name": "qual_type$subexpression$2", "symbols": [/[uU]/, /[nN]/, /[cC]/, /[eE]/, /[rR]/, /[tT]/, /[aA]/, /[iI]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "qual_type", "symbols": ["qual_type$subexpression$2"], "postprocess": () => '?'},
    {"name": "qual_type$subexpression$3", "symbols": [/[aA]/, /[pP]/, /[pP]/, /[rR]/, /[oO]/, /[xX]/, /[iI]/, /[mM]/, /[aA]/, /[tT]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "qual_type", "symbols": ["qual_type$subexpression$3"], "postprocess": () => '~'},
    {"name": "month_name$subexpression$1$subexpression$1", "symbols": [/[jJ]/, /[aA]/, /[nN]/, /[uU]/, /[aA]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$1"]},
    {"name": "month_name$subexpression$1$subexpression$2", "symbols": [/[jJ]/, /[aA]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$2"]},
    {"name": "month_name$subexpression$1$subexpression$3", "symbols": [/[fF]/, /[eE]/, /[bB]/, /[rR]/, /[uU]/, /[aA]/, /[rR]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$3"]},
    {"name": "month_name$subexpression$1$subexpression$4", "symbols": [/[fF]/, /[eE]/, /[bB]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$4"]},
    {"name": "month_name$subexpression$1$subexpression$5", "symbols": [/[mM]/, /[aA]/, /[rR]/, /[cC]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$5"]},
    {"name": "month_name$subexpression$1$subexpression$6", "symbols": [/[mM]/, /[aA]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$6"]},
    {"name": "month_name$subexpression$1$subexpression$7", "symbols": [/[aA]/, /[pP]/, /[rR]/, /[iI]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$7"]},
    {"name": "month_name$subexpression$1$subexpression$8", "symbols": [/[aA]/, /[pP]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$8"]},
    {"name": "month_name$subexpression$1$subexpression$9", "symbols": [/[mM]/, /[aA]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$9"]},
    {"name": "month_name$subexpression$1$subexpression$10", "symbols": [/[jJ]/, /[uU]/, /[nN]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$10"]},
    {"name": "month_name$subexpression$1$subexpression$11", "symbols": [/[jJ]/, /[uU]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$11"]},
    {"name": "month_name$subexpression$1$subexpression$12", "symbols": [/[jJ]/, /[uU]/, /[lL]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$12"]},
    {"name": "month_name$subexpression$1$subexpression$13", "symbols": [/[jJ]/, /[uU]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$13"]},
    {"name": "month_name$subexpression$1$subexpression$14", "symbols": [/[aA]/, /[uU]/, /[gG]/, /[uU]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$14"]},
    {"name": "month_name$subexpression$1$subexpression$15", "symbols": [/[aA]/, /[uU]/, /[gG]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$15"]},
    {"name": "month_name$subexpression$1$subexpression$16", "symbols": [/[sS]/, /[eE]/, /[pP]/, /[tT]/, /[eE]/, /[mM]/, /[bB]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$16"]},
    {"name": "month_name$subexpression$1$subexpression$17", "symbols": [/[sS]/, /[eE]/, /[pP]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$17"]},
    {"name": "month_name$subexpression$1$subexpression$18", "symbols": [/[sS]/, /[eE]/, /[pP]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$18"]},
    {"name": "month_name$subexpression$1$subexpression$19", "symbols": [/[oO]/, /[cC]/, /[tT]/, /[oO]/, /[bB]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$19"]},
    {"name": "month_name$subexpression$1$subexpression$20", "symbols": [/[oO]/, /[cC]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$20"]},
    {"name": "month_name$subexpression$1$subexpression$21", "symbols": [/[nN]/, /[oO]/, /[vV]/, /[eE]/, /[mM]/, /[bB]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$21"]},
    {"name": "month_name$subexpression$1$subexpression$22", "symbols": [/[nN]/, /[oO]/, /[vV]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$22"]},
    {"name": "month_name$subexpression$1$subexpression$23", "symbols": [/[dD]/, /[eE]/, /[cC]/, /[eE]/, /[mM]/, /[bB]/, /[eE]/, /[rR]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$23"]},
    {"name": "month_name$subexpression$1$subexpression$24", "symbols": [/[dD]/, /[eE]/, /[cC]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "month_name$subexpression$1", "symbols": ["month_name$subexpression$1$subexpression$24"]},
    {"name": "month_name", "symbols": ["month_name$subexpression$1"], "postprocess": d => d[0][0]},
    {"name": "year_num", "symbols": ["digit", "digit", "digit", "digit"], "postprocess": d => d[0] + d[1] + d[2] + d[3]},
    {"name": "year_num", "symbols": ["digit", "digit", "digit"], "postprocess": d => d[0] + d[1] + d[2]},
    {"name": "year_num", "symbols": ["digit", "digit"], "postprocess": d => d[0] + d[1]},
    {"name": "year_num", "symbols": ["digit"], "postprocess": d => d[0]},
    {"name": "numeric_year", "symbols": ["digit", "digit", "digit", "digit"], "postprocess": d => d[0] + d[1] + d[2] + d[3]},
    {"name": "numeric_year", "symbols": ["digit", "digit", "digit"], "postprocess": d => d[0] + d[1] + d[2]},
    {"name": "numeric_year", "symbols": ["digit", "digit"], "postprocess": d => d[0] + d[1]},
    {"name": "numeric_year", "symbols": ["digit"], "postprocess": d => d[0]},
    {"name": "day_num", "symbols": ["digit", "digit"], "postprocess": d => parseInt(d[0] + d[1], 10)},
    {"name": "day_num", "symbols": ["digit"], "postprocess": d => parseInt(d[0], 10)},
    {"name": "ordinal_day$subexpression$1$subexpression$1", "symbols": [/[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_day$subexpression$1", "symbols": ["ordinal_day$subexpression$1$subexpression$1"]},
    {"name": "ordinal_day$subexpression$1$subexpression$2", "symbols": [/[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_day$subexpression$1", "symbols": ["ordinal_day$subexpression$1$subexpression$2"]},
    {"name": "ordinal_day$subexpression$1$subexpression$3", "symbols": [/[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_day$subexpression$1", "symbols": ["ordinal_day$subexpression$1$subexpression$3"]},
    {"name": "ordinal_day$subexpression$1$subexpression$4", "symbols": [/[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_day$subexpression$1", "symbols": ["ordinal_day$subexpression$1$subexpression$4"]},
    {"name": "ordinal_day", "symbols": ["digit", "digit", "ordinal_day$subexpression$1"], "postprocess": d => parseInt(d[0] + d[1], 10)},
    {"name": "ordinal_day$subexpression$2$subexpression$1", "symbols": [/[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_day$subexpression$2", "symbols": ["ordinal_day$subexpression$2$subexpression$1"]},
    {"name": "ordinal_day$subexpression$2$subexpression$2", "symbols": [/[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_day$subexpression$2", "symbols": ["ordinal_day$subexpression$2$subexpression$2"]},
    {"name": "ordinal_day$subexpression$2$subexpression$3", "symbols": [/[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_day$subexpression$2", "symbols": ["ordinal_day$subexpression$2$subexpression$3"]},
    {"name": "ordinal_day$subexpression$2$subexpression$4", "symbols": [/[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_day$subexpression$2", "symbols": ["ordinal_day$subexpression$2$subexpression$4"]},
    {"name": "ordinal_day", "symbols": ["digit", "ordinal_day$subexpression$2"], "postprocess": d => parseInt(d[0], 10)},
    {"name": "ordinal_century$subexpression$1$subexpression$1", "symbols": [/[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_century$subexpression$1", "symbols": ["ordinal_century$subexpression$1$subexpression$1"]},
    {"name": "ordinal_century$subexpression$1$subexpression$2", "symbols": [/[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_century$subexpression$1", "symbols": ["ordinal_century$subexpression$1$subexpression$2"]},
    {"name": "ordinal_century$subexpression$1$subexpression$3", "symbols": [/[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_century$subexpression$1", "symbols": ["ordinal_century$subexpression$1$subexpression$3"]},
    {"name": "ordinal_century$subexpression$1$subexpression$4", "symbols": [/[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_century$subexpression$1", "symbols": ["ordinal_century$subexpression$1$subexpression$4"]},
    {"name": "ordinal_century", "symbols": ["digit", "digit", "ordinal_century$subexpression$1"], "postprocess": d => parseInt(d[0] + d[1], 10)},
    {"name": "ordinal_century$subexpression$2$subexpression$1", "symbols": [/[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_century$subexpression$2", "symbols": ["ordinal_century$subexpression$2$subexpression$1"]},
    {"name": "ordinal_century$subexpression$2$subexpression$2", "symbols": [/[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_century$subexpression$2", "symbols": ["ordinal_century$subexpression$2$subexpression$2"]},
    {"name": "ordinal_century$subexpression$2$subexpression$3", "symbols": [/[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_century$subexpression$2", "symbols": ["ordinal_century$subexpression$2$subexpression$3"]},
    {"name": "ordinal_century$subexpression$2$subexpression$4", "symbols": [/[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "ordinal_century$subexpression$2", "symbols": ["ordinal_century$subexpression$2$subexpression$4"]},
    {"name": "ordinal_century", "symbols": ["digit", "ordinal_century$subexpression$2"], "postprocess": d => parseInt(d[0], 10)},
    {"name": "spelled_ordinal_century$subexpression$1", "symbols": [/[fF]/, /[iI]/, /[rR]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$1"], "postprocess": () => 1},
    {"name": "spelled_ordinal_century$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[cC]/, /[oO]/, /[nN]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$2"], "postprocess": () => 2},
    {"name": "spelled_ordinal_century$subexpression$3", "symbols": [/[tT]/, /[hH]/, /[iI]/, /[rR]/, /[dD]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$3"], "postprocess": () => 3},
    {"name": "spelled_ordinal_century$subexpression$4", "symbols": [/[fF]/, /[oO]/, /[uU]/, /[rR]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$4"], "postprocess": () => 4},
    {"name": "spelled_ordinal_century$subexpression$5", "symbols": [/[fF]/, /[iI]/, /[fF]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$5"], "postprocess": () => 5},
    {"name": "spelled_ordinal_century$subexpression$6", "symbols": [/[sS]/, /[iI]/, /[xX]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$6"], "postprocess": () => 6},
    {"name": "spelled_ordinal_century$subexpression$7", "symbols": [/[sS]/, /[eE]/, /[vV]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$7"], "postprocess": () => 7},
    {"name": "spelled_ordinal_century$subexpression$8", "symbols": [/[eE]/, /[iI]/, /[gG]/, /[hH]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$8"], "postprocess": () => 8},
    {"name": "spelled_ordinal_century$subexpression$9", "symbols": [/[nN]/, /[iI]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$9"], "postprocess": () => 9},
    {"name": "spelled_ordinal_century$subexpression$10", "symbols": [/[tT]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$10"], "postprocess": () => 10},
    {"name": "spelled_ordinal_century$subexpression$11", "symbols": [/[eE]/, /[lL]/, /[eE]/, /[vV]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$11"], "postprocess": () => 11},
    {"name": "spelled_ordinal_century$subexpression$12", "symbols": [/[tT]/, /[wW]/, /[eE]/, /[lL]/, /[fF]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$12"], "postprocess": () => 12},
    {"name": "spelled_ordinal_century$subexpression$13", "symbols": [/[tT]/, /[hH]/, /[iI]/, /[rR]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$13"], "postprocess": () => 13},
    {"name": "spelled_ordinal_century$subexpression$14", "symbols": [/[fF]/, /[oO]/, /[uU]/, /[rR]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$14"], "postprocess": () => 14},
    {"name": "spelled_ordinal_century$subexpression$15", "symbols": [/[fF]/, /[iI]/, /[fF]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$15"], "postprocess": () => 15},
    {"name": "spelled_ordinal_century$subexpression$16", "symbols": [/[sS]/, /[iI]/, /[xX]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$16"], "postprocess": () => 16},
    {"name": "spelled_ordinal_century$subexpression$17", "symbols": [/[sS]/, /[eE]/, /[vV]/, /[eE]/, /[nN]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$17"], "postprocess": () => 17},
    {"name": "spelled_ordinal_century$subexpression$18", "symbols": [/[eE]/, /[iI]/, /[gG]/, /[hH]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$18"], "postprocess": () => 18},
    {"name": "spelled_ordinal_century$subexpression$19", "symbols": [/[nN]/, /[iI]/, /[nN]/, /[eE]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$19"], "postprocess": () => 19},
    {"name": "spelled_ordinal_century$subexpression$20", "symbols": [/[tT]/, /[wW]/, /[eE]/, /[nN]/, /[tT]/, /[iI]/, /[eE]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$20"], "postprocess": () => 20},
    {"name": "spelled_ordinal_century$subexpression$21", "symbols": [/[tT]/, /[wW]/, /[eE]/, /[nN]/, /[tT]/, /[yY]/, {"literal":"-"}, /[fF]/, /[iI]/, /[rR]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_ordinal_century", "symbols": ["spelled_ordinal_century$subexpression$21"], "postprocess": () => 21},
    {"name": "spelled_number_word$subexpression$1", "symbols": [/[eE]/, /[iI]/, /[gG]/, /[hH]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$1"], "postprocess": () => '18'},
    {"name": "spelled_number_word$subexpression$2", "symbols": [/[sS]/, /[eE]/, /[vV]/, /[eE]/, /[nN]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$2"], "postprocess": () => '17'},
    {"name": "spelled_number_word$subexpression$3", "symbols": [/[sS]/, /[iI]/, /[xX]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$3"], "postprocess": () => '16'},
    {"name": "spelled_number_word$subexpression$4", "symbols": [/[fF]/, /[iI]/, /[fF]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$4"], "postprocess": () => '15'},
    {"name": "spelled_number_word$subexpression$5", "symbols": [/[fF]/, /[oO]/, /[uU]/, /[rR]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$5"], "postprocess": () => '14'},
    {"name": "spelled_number_word$subexpression$6", "symbols": [/[tT]/, /[hH]/, /[iI]/, /[rR]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$6"], "postprocess": () => '13'},
    {"name": "spelled_number_word$subexpression$7", "symbols": [/[tT]/, /[wW]/, /[eE]/, /[lL]/, /[vV]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$7"], "postprocess": () => '12'},
    {"name": "spelled_number_word$subexpression$8", "symbols": [/[eE]/, /[lL]/, /[eE]/, /[vV]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$8"], "postprocess": () => '11'},
    {"name": "spelled_number_word$subexpression$9", "symbols": [/[nN]/, /[iI]/, /[nN]/, /[eE]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$9"], "postprocess": () => '19'},
    {"name": "spelled_number_word$subexpression$10", "symbols": [/[tT]/, /[wW]/, /[eE]/, /[nN]/, /[tT]/, /[yY]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_number_word", "symbols": ["spelled_number_word$subexpression$10"], "postprocess": () => '20'},
    {"name": "spelled_century$subexpression$1", "symbols": [/[nN]/, /[iI]/, /[nN]/, /[eE]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_century", "symbols": ["spelled_century$subexpression$1"], "postprocess": () => '18'},
    {"name": "spelled_century$subexpression$2", "symbols": [/[eE]/, /[iI]/, /[gG]/, /[hH]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_century", "symbols": ["spelled_century$subexpression$2"], "postprocess": () => '17'},
    {"name": "spelled_century$subexpression$3", "symbols": [/[sS]/, /[eE]/, /[vV]/, /[eE]/, /[nN]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_century", "symbols": ["spelled_century$subexpression$3"], "postprocess": () => '16'},
    {"name": "spelled_century$subexpression$4", "symbols": [/[sS]/, /[iI]/, /[xX]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_century", "symbols": ["spelled_century$subexpression$4"], "postprocess": () => '15'},
    {"name": "spelled_century$subexpression$5", "symbols": [/[fF]/, /[iI]/, /[fF]/, /[tT]/, /[eE]/, /[eE]/, /[nN]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_century", "symbols": ["spelled_century$subexpression$5"], "postprocess": () => '14'},
    {"name": "spelled_century$subexpression$6", "symbols": [/[tT]/, /[wW]/, /[eE]/, /[nN]/, /[tT]/, /[iI]/, /[eE]/, /[tT]/, /[hH]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_century", "symbols": ["spelled_century$subexpression$6"], "postprocess": () => '19'},
    {"name": "spelled_century$subexpression$7", "symbols": [/[tT]/, /[wW]/, /[eE]/, /[nN]/, /[tT]/, /[yY]/, {"literal":"-"}, /[fF]/, /[iI]/, /[rR]/, /[sS]/, /[tT]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_century", "symbols": ["spelled_century$subexpression$7"], "postprocess": () => '20'},
    {"name": "spelled_decade$subexpression$1", "symbols": [/[sS]/, /[iI]/, /[xX]/, /[tT]/, /[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$1"], "postprocess": () => '6'},
    {"name": "spelled_decade$subexpression$2", "symbols": [/[fF]/, /[iI]/, /[fF]/, /[tT]/, /[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$2"], "postprocess": () => '5'},
    {"name": "spelled_decade$subexpression$3", "symbols": [/[fF]/, /[oO]/, /[rR]/, /[tT]/, /[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$3"], "postprocess": () => '4'},
    {"name": "spelled_decade$subexpression$4", "symbols": [/[tT]/, /[hH]/, /[iI]/, /[rR]/, /[tT]/, /[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$4"], "postprocess": () => '3'},
    {"name": "spelled_decade$subexpression$5", "symbols": [/[tT]/, /[wW]/, /[eE]/, /[nN]/, /[tT]/, /[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$5"], "postprocess": () => '2'},
    {"name": "spelled_decade$subexpression$6", "symbols": [/[tT]/, /[eE]/, /[nN]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$6"], "postprocess": () => '1'},
    {"name": "spelled_decade$subexpression$7", "symbols": [/[sS]/, /[eE]/, /[vV]/, /[eE]/, /[nN]/, /[tT]/, /[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$7"], "postprocess": () => '7'},
    {"name": "spelled_decade$subexpression$8", "symbols": [/[eE]/, /[iI]/, /[gG]/, /[hH]/, /[tT]/, /[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$8"], "postprocess": () => '8'},
    {"name": "spelled_decade$subexpression$9", "symbols": [/[nN]/, /[iI]/, /[nN]/, /[eE]/, /[tT]/, /[iI]/, /[eE]/, /[sS]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "spelled_decade", "symbols": ["spelled_decade$subexpression$9"], "postprocess": () => '9'},
    {"name": "slash_date_num", "symbols": ["digit", "digit"], "postprocess": d => d[0] + d[1]},
    {"name": "slash_date_num", "symbols": ["digit"], "postprocess": d => d[0]},
    {"name": "digit", "symbols": [/[0-9]/], "postprocess": id}
]
  , ParserStart: "main"
}


  return grammar;
})();

export default grammar_export;