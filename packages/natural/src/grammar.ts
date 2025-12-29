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
    {"name": "interval$string$1", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"f"}, {"literal":"o"}, {"literal":"r"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$1", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$2", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"t"}, {"literal":"i"}, {"literal":"l"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$2", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `../${d[2].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$3", "symbols": [{"literal":"a"}, {"literal":"f"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$3", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$4", "symbols": [{"literal":"s"}, {"literal":"i"}, {"literal":"n"}, {"literal":"c"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$4", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$5", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$6", "symbols": [{"literal":"l"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$5", "__", "interval$string$6"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/..`, confidence: 0.95 })},
    {"name": "interval$string$7", "symbols": [{"literal":"f"}, {"literal":"r"}, {"literal":"o"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$8", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$7", "__", "datevalue", "__", "interval$string$8", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$9", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["datevalue", "__", "interval$string$9", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[0].edtf}/${d[4].edtf}`, confidence: 0.95 })},
    {"name": "interval$string$10", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"t"}, {"literal":"w"}, {"literal":"e"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval$string$11", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "interval", "symbols": ["interval$string$10", "__", "datevalue", "__", "interval$string$11", "__", "datevalue"], "postprocess": d => ({ type: 'interval', edtf: `${d[2].edtf}/${d[6].edtf}`, confidence: 0.95 })},
    {"name": "set$subexpression$1", "symbols": [/[oO]/, /[nN]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set$subexpression$2", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set", "symbols": ["set$subexpression$1", "__", "set$subexpression$2", "_", {"literal":":"}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf},${d[14].edtf}]`, confidence: 0.95 })},
    {"name": "set$subexpression$3", "symbols": [/[oO]/, /[nN]/, /[eE]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set$subexpression$4", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "set", "symbols": ["set$subexpression$3", "__", "set$subexpression$4", "_", {"literal":":"}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[6].edtf},${d[10].edtf}]`, confidence: 0.95 })},
    {"name": "set$string$1", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set$string$2", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set", "symbols": ["datevalue", "__", "set$string$1", "__", "datevalue", "__", "set$string$2", "__", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf},${d[8].edtf}]`, confidence: 0.9 })},
    {"name": "set$string$3", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set", "symbols": ["datevalue", "__", "set$string$3", "__", "datevalue"], "postprocess": d => ({ type: 'set', edtf: `[${d[0].edtf},${d[4].edtf}]`, confidence: 0.9 })},
    {"name": "set$string$4", "symbols": [{"literal":"o"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set$string$5", "symbols": [{"literal":"e"}, {"literal":"a"}, {"literal":"r"}, {"literal":"l"}, {"literal":"i"}, {"literal":"e"}, {"literal":"r"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "set", "symbols": ["datevalue", "__", "set$string$4", "__", "set$string$5"], "postprocess": d => ({ type: 'set', edtf: `[..${d[0].edtf}]`, confidence: 0.9 })},
    {"name": "list$subexpression$1", "symbols": [/[aA]/, /[lL]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list$subexpression$2", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list", "symbols": ["list$subexpression$1", "__", "list$subexpression$2", "_", {"literal":":"}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf},${d[14].edtf}}`, confidence: 0.95 })},
    {"name": "list$subexpression$3", "symbols": [/[aA]/, /[lL]/, /[lL]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list$subexpression$4", "symbols": [/[oO]/, /[fF]/], "postprocess": function(d) {return d.join(""); }},
    {"name": "list", "symbols": ["list$subexpression$3", "__", "list$subexpression$4", "_", {"literal":":"}, "_", "datevalue", "_", {"literal":","}, "_", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[6].edtf},${d[10].edtf}}`, confidence: 0.95 })},
    {"name": "list$string$1", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "list$string$2", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "list", "symbols": ["datevalue", "__", "list$string$1", "__", "datevalue", "__", "list$string$2", "__", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf},${d[8].edtf}}`, confidence: 0.9 })},
    {"name": "list$string$3", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "list", "symbols": ["datevalue", "__", "list$string$3", "__", "datevalue"], "postprocess": d => ({ type: 'list', edtf: `{${d[0].edtf},${d[4].edtf}}`, confidence: 0.9 })},
    {"name": "season", "symbols": ["qualifier", "__", "season_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${d[4]}-${seasons[d[2].toLowerCase()]}${d[0]}`, confidence: 0.95 })},
    {"name": "season", "symbols": ["season_name", "__", "year_num"], "postprocess": d => ({ type: 'season', edtf: `${d[2]}-${seasons[d[0].toLowerCase()]}`, confidence: 0.95 })},
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
    {"name": "date", "symbols": ["datevalue", "_", "parenthetical_qualification"], "postprocess":  d => {
          const qual = d[2];
          if (qual.type === 'global') {
            return { type: 'date', edtf: `${d[0].edtf}${qual.qual}`, confidence: d[0].confidence * 0.9 };
          } else {
            // Partial qualifications
            return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
          }
        } },
    {"name": "date", "symbols": ["qualifier", "__", "datevalue"], "postprocess": d => ({ type: 'date', edtf: `${d[2].edtf}${d[0]}`, confidence: d[2].confidence * 0.95 })},
    {"name": "date", "symbols": ["datevalue", "__", "qualifier"], "postprocess": d => ({ type: 'date', edtf: `${d[0].edtf}${d[2]}`, confidence: d[0].confidence * 0.95 })},
    {"name": "date", "symbols": ["datevalue"], "postprocess": id},
    {"name": "datevalue", "symbols": ["month_name", "__", "day_num", "_", {"literal":","}, "_", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${d[6]}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue", "symbols": ["month_name", "__", "day_num", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${d[4]}-${months[d[0].toLowerCase()]}-${pad2(d[2])}`, confidence: 0.95 })},
    {"name": "datevalue", "symbols": ["day_num", "__", "month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${d[4]}-${months[d[2].toLowerCase()]}-${pad2(d[0])}`, confidence: 0.95 })},
    {"name": "datevalue", "symbols": ["month_name", "__", "year_num"], "postprocess": d => ({ type: 'date', edtf: `${d[2]}-${months[d[0].toLowerCase()]}`, confidence: 0.95 })},
    {"name": "datevalue$string$1", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue$string$2", "symbols": [{"literal":"0"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue", "symbols": ["datevalue$string$1", "__", "digit", "digit", "digit", "datevalue$string$2"], "postprocess": d => ({ type: 'date', edtf: `${d[2]}${d[3]}XX`, confidence: 0.95 })},
    {"name": "datevalue$string$3", "symbols": [{"literal":"0"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue", "symbols": ["digit", "digit", "digit", "datevalue$string$3"], "postprocess": d => ({ type: 'date', edtf: `${d[0]}${d[1]}XX`, confidence: 0.95 })},
    {"name": "datevalue$string$4", "symbols": [{"literal":"t"}, {"literal":"h"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "datevalue", "symbols": ["datevalue$string$4", "__", "digit", "digit", "digit", "digit", {"literal":"s"}], "postprocess": d => ({ type: 'date', edtf: `${d[2]}${d[3]}${d[4]}X`, confidence: 0.95 })},
    {"name": "datevalue", "symbols": ["digit", "digit", "digit", "digit", {"literal":"s"}], "postprocess": d => ({ type: 'date', edtf: `${d[0]}${d[1]}${d[2]}X`, confidence: 0.95 })},
    {"name": "datevalue", "symbols": ["year_num"], "postprocess": d => ({ type: 'date', edtf: d[0], confidence: 0.95 })},
    {"name": "qualifier", "symbols": [{"literal":"?"}], "postprocess": () => '?'},
    {"name": "qualifier", "symbols": [{"literal":"~"}], "postprocess": () => '~'},
    {"name": "qualifier$string$1", "symbols": [{"literal":"c"}, {"literal":"i"}, {"literal":"r"}, {"literal":"c"}, {"literal":"a"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$1"], "postprocess": () => '~'},
    {"name": "qualifier$string$2", "symbols": [{"literal":"c"}, {"literal":"."}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$2"], "postprocess": () => '~'},
    {"name": "qualifier$string$3", "symbols": [{"literal":"c"}, {"literal":"a"}, {"literal":"."}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$3"], "postprocess": () => '~'},
    {"name": "qualifier$string$4", "symbols": [{"literal":"a"}, {"literal":"b"}, {"literal":"o"}, {"literal":"u"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$4"], "postprocess": () => '~'},
    {"name": "qualifier$string$5", "symbols": [{"literal":"a"}, {"literal":"r"}, {"literal":"o"}, {"literal":"u"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$5"], "postprocess": () => '~'},
    {"name": "qualifier$string$6", "symbols": [{"literal":"a"}, {"literal":"p"}, {"literal":"p"}, {"literal":"r"}, {"literal":"o"}, {"literal":"x"}, {"literal":"i"}, {"literal":"m"}, {"literal":"a"}, {"literal":"t"}, {"literal":"e"}, {"literal":"l"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$6"], "postprocess": () => '~'},
    {"name": "qualifier$string$7", "symbols": [{"literal":"p"}, {"literal":"o"}, {"literal":"s"}, {"literal":"s"}, {"literal":"i"}, {"literal":"b"}, {"literal":"l"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$7"], "postprocess": () => '?'},
    {"name": "qualifier$string$8", "symbols": [{"literal":"m"}, {"literal":"a"}, {"literal":"y"}, {"literal":"b"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$8"], "postprocess": () => '?'},
    {"name": "qualifier$string$9", "symbols": [{"literal":"p"}, {"literal":"e"}, {"literal":"r"}, {"literal":"h"}, {"literal":"a"}, {"literal":"p"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$9"], "postprocess": () => '?'},
    {"name": "qualifier$string$10", "symbols": [{"literal":"p"}, {"literal":"r"}, {"literal":"o"}, {"literal":"b"}, {"literal":"a"}, {"literal":"b"}, {"literal":"l"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$10"], "postprocess": () => '?'},
    {"name": "qualifier$string$11", "symbols": [{"literal":"u"}, {"literal":"n"}, {"literal":"c"}, {"literal":"e"}, {"literal":"r"}, {"literal":"t"}, {"literal":"a"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "qualifier", "symbols": ["qualifier$string$11"], "postprocess": () => '?'},
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
    {"name": "day_num", "symbols": ["digit", "digit"], "postprocess": d => parseInt(d[0] + d[1], 10)},
    {"name": "day_num", "symbols": ["digit"], "postprocess": d => parseInt(d[0], 10)},
    {"name": "digit", "symbols": [/[0-9]/], "postprocess": id}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
}

  return grammar;
})();

export default grammar_export;