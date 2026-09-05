@{%
const { createLexer } = require('../lexer.js');
const lexicon = require('../languages/en.js');
const lexer = createLexer(lexicon);
%}
@include "../shared.ne"

datevalue_base -> ordinal_day __ %of __ %unknownMonth _ %comma:? _ calendar_year {% d => ({ edtf: pad4(d[8]) + '-XX-' + pad2(d[0]), confidence: 0.95 }) %}
  | day_num __ %of __ %unknownMonth _ %comma:? _ calendar_year {% d => ({ edtf: pad4(d[8]) + '-XX-' + pad2(d[0]), confidence: 0.95 }) %}
century_value -> %compactCentury {% d => parseInt(d[0].text, 10) %}
