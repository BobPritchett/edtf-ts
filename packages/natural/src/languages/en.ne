@{%
const { createLexer } = require('../lexer.js');
const lexicon = require('../languages/en.js');
const lexer = createLexer(lexicon);
%}
@include "../shared.ne"

shared_day_set -> shared_day_choices __ %of __ month_name _ %comma:? _ calendar_year
  {% d => sharedDaySet(pad4(d[8]), months[d[4]], d[0]) %}

datevalue_base -> ordinal_day __ %of __ %unknownMonth _ %comma:? _ calendar_year {% d => ({ edtf: pad4(d[8]) + '-XX-' + pad2(d[0]), confidence: 0.95 }) %}
  | day_num __ %of __ %unknownMonth _ %comma:? _ calendar_year {% d => ({ edtf: pad4(d[8]) + '-XX-' + pad2(d[0]), confidence: 0.95 }) %}
century_value -> %compactCentury {% d => parseInt(d[0].text, 10) %}

# Bounded catalogue wording; the remainder must still parse in full.
value -> %active __ value {% d => d[2] %}
  | %year __ %inWord __ value {% d => d[4] %}
  | %number %ordinalSuffix:? _ %dash _ ordinal_century __ %century
      {% d => ({ edtf: getIntervalStart(buildCenturyModifierInterval(Number(d[0].value), '')) + '/' + getIntervalEnd(buildCenturyModifierInterval(d[5], '')), confidence: 0.98 }) %}
qualifier -> %uncertain _ %colon {% () => '?' %}
