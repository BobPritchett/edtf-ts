@{%
const { createLexer } = require('../lexer.js');
const lexicon = require('../languages/es.js');
const lexer = createLexer(lexicon);
%}
@include "../shared.ne"

shared_day_set -> shared_day_choices __ %of __ month_name __ %of __ calendar_year
  {% d => sharedDaySet(pad4(d[8]), months[d[4]], d[0]) %}

bound_prefix -> %inclusiveBefore {% () => ['before', true] %} | %inclusiveAfter {% () => ['after', true] %}
datevalue_base -> day_num __ %of __ month_name __ %of __ year_num {% d => ({ edtf: pad4(d[8]) + '-' + months[d[4]] + '-' + pad2(d[0]), confidence: 0.95 }) %}
  | %decadeWord __ %number {% d => ({ edtf: String(d[2].value).slice(0,3) + 'X', confidence: 0.95 }) %}
  | %the __ %decadeWord __ %number {% d => ({ edtf: String(d[4].value).slice(0,3) + 'X', confidence: 0.95 }) %}
hemisphere_north -> %lparen _ %hemisphere __ %north _ %rparen {% () => 'north' %}
hemisphere_south -> %lparen _ %hemisphere __ %south _ %rparen {% () => 'south' %}

datevalue_base -> %century __ %number {% d => ({ edtf: buildCenturyModifierInterval(Number(d[2].value), ''), confidence: 0.95 }) %}
  | %century __ %roman {% d => ({ edtf: buildCenturyModifierInterval(romanNumber(d[2].text), ''), confidence: 0.95 }) %}
  | day_num __ %from __ month_name __ %from __ year_num {% d => ({ edtf: pad4(d[8]) + '-' + months[d[4]] + '-' + pad2(d[0]), confidence: 0.95 }) %}

interval -> %from __ datevalue {% d => ({ edtf: d[2].edtf + '/..', confidence: 0.95 }) %}

decade -> %decadeWord __ %number {% d => Number(d[2].value) %}
  | %the __ %decadeWord __ %number {% d => Number(d[4].value) %}
datevalue_base -> %some __ %day __ %of __ month_name __ year_num {% d => ({ edtf: pad4(d[8]) + '-' + months[d[6]] + '-XX', confidence: 0.95 }) %}
  | %some __ %month __ %of __ year_num {% d => ({ edtf: pad4(d[6]) + '-XX', confidence: 0.95 }) %}

datevalue_base -> month_name __ %of __ year_num {% d => ({ edtf: pad4(d[4]) + '-' + months[d[0]], confidence: 0.95 }) %}

century_value -> %century __ %number {% d => Number(d[2].value) %}
  | %century __ %roman {% d => romanNumber(d[2].text) %}
  | %century __ spelled_ordinal_century {% d => d[2] %}

interval -> temporal_modifier_interval_value __ temporal_modifier_interval_value {% d => ({ edtf: getIntervalStart(d[0].edtf) + '/' + getIntervalEnd(d[2].edtf), confidence: 0.95 }) %}
  | %from __ temporal_modifier_interval_value __ temporal_modifier_interval_value {% d => ({ edtf: getIntervalStart(d[2].edtf) + '/' + getIntervalEnd(d[4].edtf), confidence: 0.95 }) %}

combination_modifier -> %early __ %mid {% () => 'early-to-mid' %} | %mid __ %late {% () => 'mid-to-late' %}

from_word -> %of {% id %}
datevalue_base -> %day __ day_num __ %of __ %unknownMonth _ %comma:? _ calendar_year {% d => ({ edtf: pad4(d[10]) + '-XX-' + pad2(d[2]), confidence: 0.95 }) %}
  | %day __ day_num _ %comma _ %some __ %month __ %of __ year_num {% d => ({ edtf: pad4(d[12]) + '-XX-' + pad2(d[2]), confidence: 0.95 }) %}

datevalue_base -> %inWord __ %sometime __ %of __ year_num {% d => ({ edtf: pad4(d[6]) + '-XX-XX', confidence: 0.95 }) %}

# Era markers in the ordinary Spanish calendar spelling: marzo de 5 d. C.
datevalue_base -> month_name __ %of __ era_year {% d => ({ edtf: pad4(d[4]) + '-' + months[d[0]], confidence: 0.95 }) %}
  | day_num __ %of __ month_name __ %of __ era_year {% d => ({ edtf: pad4(d[8]) + '-' + months[d[4]] + '-' + pad2(d[0]), confidence: 0.95 }) %}
