@{%
const { withWeekday, defer, buildBoundary, collection, withCollectionBounds, choiceRange, sharedMonthRange, sharedDayRange } = require('../semantics.js');
const { applyDateQualifier, romanNumber, months, seasons, northernSeasons, southernSeasons, pad2, pad4, twoDigitYear, isLeapYear, getDaysInMonth, buildMonthModifierInterval, buildYearModifierInterval, buildDecadeModifierInterval, normalizeDecadeStart, normalizeDecadeEnd, buildCenturyModifierInterval, buildBCECenturyModifierInterval, buildMonthCombinationInterval, buildYearCombinationInterval, buildDecadeCombinationInterval, buildCenturyCombinationInterval, buildBCECenturyCombinationInterval, bceToBCE, buildSlashDate, buildPartialQual, getIntervalStart, getIntervalEnd, applyQualifierToInterval } = require('../semantic-helpers.js');
%}
@lexer lexer

# Main entry point
main -> _ value _ {% d => d[1] %}

# Top-level value types
value ->
    boundary {% id %}
  | shared_date_range {% id %}
  | interval {% id %}
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
  | %unknownYear {% () => 'XXXX' %}

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
month_name -> month_word %dot:? {% d => d[0] %}
month_word ->
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
  | temporal_modifier_word modifier_sep century_value
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ temporal_modifier_word __ century_value
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[4], d[2]), confidence: 0.95 }) %}
  # Century with CE/AD: "early 20th century CE"
  | temporal_modifier_word modifier_sep century_value __ era_ce
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ temporal_modifier_word __ century_value __ era_ce
      {% d => ({ type: 'interval', edtf: buildCenturyModifierInterval(d[4], d[2]), confidence: 0.95 }) %}
  # Century with BCE/BC: "early 5th century BCE"
  | temporal_modifier_word modifier_sep century_value __ era_bce
      {% d => ({ type: 'interval', edtf: buildBCECenturyModifierInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ temporal_modifier_word __ century_value __ era_bce
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
  | combination_modifier modifier_sep century_value
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ combination_modifier __ century_value
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[4], d[2]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep century_value __ era_ce
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ combination_modifier __ century_value __ era_ce
      {% d => ({ type: 'interval', edtf: buildCenturyCombinationInterval(d[4], d[2]), confidence: 0.95 }) %}
  | combination_modifier modifier_sep century_value __ era_bce
      {% d => ({ type: 'interval', edtf: buildBCECenturyCombinationInterval(d[2], d[0]), confidence: 0.95 }) %}
  | %the __ combination_modifier __ century_value __ era_bce
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
  | qualifier __ temporal_modifier_word modifier_sep century_value
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
  | temporal_modifier_word modifier_sep century_value
      {% d => ({ edtf: buildCenturyModifierInterval(d[2], d[0]) }) %}
  | %the __ temporal_modifier_word __ century_value
      {% d => ({ edtf: buildCenturyModifierInterval(d[4], d[2]) }) %}
  | combination_modifier modifier_sep century_value
      {% d => ({ edtf: buildCenturyCombinationInterval(d[2], d[0]) }) %}
  | %the __ combination_modifier __ century_value
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
  | qualifier __ temporal_modifier_word modifier_sep century_value
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
      {% d => ({ type: 'interval', edtf: sharedMonthRange(d[8], months[d[2]], months[d[6]], context), confidence: 0.95 }) %}
  | month_name __ %to __ month_name __ year_num
      {% d => ({ type: 'interval', edtf: sharedMonthRange(d[6], months[d[0]], months[d[4]], context), confidence: 0.9 }) %}
  | month_name _ %dash _ month_name __ year_num
      {% d => ({ type: 'interval', edtf: sharedMonthRange(d[6], months[d[0]], months[d[4]], context), confidence: 0.9 }) %}
  | %up __ %to __ datevalue {% d => ({ type: 'interval', edtf: '../' + d[4].edtf, confidence: 0.95 }) %}
  | %from __ datevalue __ %onwards {% d => ({ type: 'interval', edtf: d[2].edtf + '/..', confidence: 0.95 }) %}
  | datevalue __ %onwards {% d => ({ type: 'interval', edtf: d[0].edtf + '/..', confidence: 0.95 }) %}
  # Date, season, and period endpoints share interval semantics.
  | interval_value interval_separator interval_value {% d => ({ edtf: normalizeDecadeStart(getIntervalStart(d[0].edtf)) + '/' + normalizeDecadeEnd(getIntervalEnd(d[2].edtf)), confidence: 0.95 }) %}
  | from_word __ interval_value interval_separator interval_value {% d => ({ edtf: normalizeDecadeStart(getIntervalStart(d[2].edtf)) + '/' + normalizeDecadeEnd(getIntervalEnd(d[4].edtf)), confidence: 0.95 }) %}
  | %between __ interval_value __ %and __ interval_value {% d => ({ edtf: normalizeDecadeStart(getIntervalStart(d[2].edtf)) + '/' + normalizeDecadeEnd(getIntervalEnd(d[6].edtf)), confidence: 0.95 }) %}
  | interval_value interval_separator interval_endpoint {% d => ({ edtf: d[0].edtf + '/' + d[2], confidence: 0.95 }) %}
  | from_word __ interval_value interval_separator interval_endpoint {% d => ({ edtf: d[2].edtf + '/' + d[4], confidence: 0.95 }) %}
  | interval_endpoint interval_separator interval_value {% d => ({ edtf: d[0] + '/' + d[2].edtf, confidence: 0.95 }) %}
  | %until __ interval_value {% d => ({ edtf: '../' + d[2].edtf, confidence: 0.95 }) %}
  | %since __ interval_value {% d => ({ edtf: d[2].edtf + '/..', confidence: 0.95 }) %}
  | %number _ %dash _ %number {% d => {
      const a = d[0].text, b = d[4].text;
      if (a.length !== 4 || b.length !== 2) return null;
      const first = Number(a);
      let last = Math.floor(first / 100) * 100 + Number(b);
      if (last < first) last += 100;
      return { edtf: pad4(first) + '/' + pad4(last), confidence: 0.98 };
    } %}

from_word -> %from {% id %}
interval_value -> datevalue {% id %} | season {% id %}
  | temporal_modifier_interval_value {% id %} | qualified_temporal_modifier_interval_value {% id %}
interval_separator -> __ interval_connector __ {% () => null %}
  | _ %dash _ {% () => null %}
  | __ %slash __ {% () => null %}
interval_connector -> %to {% id %} | %through {% id %} | %until {% id %}
interval_endpoint -> %unknown {% () => '' %} | %questionMark {% () => '' %}
  | %open {% () => '..' %} | %openStart {% () => '..' %}
  | %openEnd {% () => '..' %} | %onwards {% () => '..' %}

# ==========================================
# SETS (Level 2)
# ==========================================

set ->
    %setPrefix _ %colon _ choices {% d => collection('set', d[4]) %}
  | %earlier __ %or __ set {% d => withCollectionBounds(d[4], true, false) %}
  | %one __ %of _ %colon _ choices {% d => collection('set', d[6]) %}
  | %either __ datevalue __ %or __ datevalue {% d => collection('set', [d[2], d[6]]) %}
  | datevalue __ %or __ choices {% d => collection('set', [d[0], ...d[4]]) %}
  | datevalue _ %comma _ choices _ %comma:? _ %or __ datevalue {% d => collection('set', [d[0], ...d[4], d[10]]) %}
choices -> choice_item {% d => [d[0]] %}
  | choice_item __ %or __ choices {% d => [d[0], ...d[4]] %}
  | choice_item _ %comma _ choices {% d => [d[0], ...d[4]] %}
  | choice_item _ %comma _ %or __ choice_item {% d => [d[0], d[6]] %}
choice_item -> collection_member {% id %}
  | collection_member _ %comma:? _ %or __ earlier_word {% d => withCollectionBounds(collection('set', [d[0]]), true, false) %}
  | collection_member _ %comma:? _ %or __ later_word {% d => withCollectionBounds(collection('set', [d[0]]), false, true) %}
list ->
    %listPrefix _ %colon _ inclusions {% d => collection('list', d[4]) %}
  | %earlier __ %and __ list {% d => withCollectionBounds(d[4], true, false) %}
  | %all __ %of _ %colon _ inclusions {% d => collection('list', d[6]) %}
  | %both __ datevalue __ %and __ datevalue {% d => collection('list', [d[2], d[6]]) %}
  | datevalue __ %and __ inclusions {% d => collection('list', [d[0], ...d[4]]) %}
  | datevalue _ %comma _ inclusions _ %comma:? _ %and __ datevalue {% d => collection('list', [d[0], ...d[4], d[10]]) %}
inclusions -> inclusion_item {% d => [d[0]] %}
  | inclusion_item __ %and __ inclusions {% d => [d[0], ...d[4]] %}
  | inclusion_item _ %comma _ inclusions {% d => [d[0], ...d[4]] %}
  | inclusion_item _ %comma _ %and __ inclusion_item {% d => [d[0], d[6]] %}
inclusion_item -> collection_member {% id %}
  | collection_member _ %comma:? _ %and __ earlier_word {% d => withCollectionBounds(collection('set', [d[0]]), true, false) %}
  | collection_member _ %comma:? _ %and __ later_word {% d => withCollectionBounds(collection('set', [d[0]]), false, true) %}
  | collection_member __ %onwards {% d => withCollectionBounds(collection('set', [d[0]]), false, true) %}

collection_member -> datevalue {% id %}
  | season {% id %}
  | datevalue __ interval_connector __ datevalue {% d => choiceRange(d[0], d[4]) %}

# ==========================================
# SEASONS
# ==========================================

season_base ->
    # Northern Hemisphere seasons
    qualifier __ season_name __ hemisphere_north __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[6])}-${northernSeasons[d[2]]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ hemisphere_north __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${northernSeasons[d[0]]}`, confidence: 0.95 }) %}
  # Southern Hemisphere seasons
  | qualifier __ season_name __ hemisphere_south __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[6])}-${southernSeasons[d[2]]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ hemisphere_south __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${southernSeasons[d[0]]}`, confidence: 0.95 }) %}
  # Quarters
  | qualifier __ quarter_name __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | quarter_name __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Quadrimesters
  | qualifier __ quadrimester_name __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | quadrimester_name __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Semestrals
  | qualifier __ semestral_name __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${d[2]}${d[0]}`, confidence: 0.95 }) %}
  | semestral_name __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[2])}-${d[0]}`, confidence: 0.95 }) %}
  # Basic seasons
  | qualifier __ season_name __ calendar_year
      {% d => ({ type: 'season', edtf: `${pad4(d[4])}-${seasons[d[2]]}${d[0]}`, confidence: 0.95 }) %}
  | season_name __ calendar_year
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
          return { type: 'date', edtf: applyDateQualifier(d[0].edtf, qual.qual), confidence: d[0].confidence * 0.9 };
        } else {
          return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
        }
      } %}
  | qualifier _ datevalue
      {% d => ({ type: 'date', edtf: applyDateQualifier(d[2].edtf, d[0]), confidence: d[2].confidence * 0.95 }) %}
  | datevalue _ qualifier
      {% d => ({ type: 'date', edtf: applyDateQualifier(d[0].edtf, d[2]), confidence: d[0].confidence * 0.95 }) %}
  | datevalue {% id %}

datevalue ->
    datevalue _ parenthetical_qualification
      {% d => {
        const qual = d[2];
        if (qual.type === 'global') {
          return { type: 'date', edtf: applyDateQualifier(d[0].edtf, qual.qual), confidence: d[0].confidence * 0.9 };
        } else {
          return { type: 'date', edtf: buildPartialQual(d[0].edtf, qual.quals), confidence: d[0].confidence * 0.85 };
        }
      } %}
  | qualifier _ datevalue
      {% d => ({ type: 'date', edtf: applyDateQualifier(d[2].edtf, d[0]), confidence: d[2].confidence * 0.95 }) %}
  | datevalue _ qualifier
      {% d => ({ type: 'date', edtf: applyDateQualifier(d[0].edtf, d[2]), confidence: d[0].confidence * 0.95 }) %}
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
      {% d => ({ type: 'date', edtf: pad4(1 - parseInt(d[0], 10)), confidence: 0.95 }) %}
  | numeric_year __ %before __ %christ
      {% d => ({ type: 'date', edtf: pad4(1 - parseInt(d[0], 10)), confidence: 0.95 }) %}
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
      {% d => ({ type: 'date', edtf: pad4(1 - parseInt(d[0], 10)), confidence: 0.95 }) %}
  | numeric_year __ %b
      {% d => ({ type: 'date', edtf: pad4(1 - parseInt(d[0], 10)), confidence: 0.9 }) %}
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
      {% d => ({ type: 'date', edtf: pad4(1 - parseInt(d[0], 10)), confidence: 0.9 }) %}
  | numeric_year %bce
      {% d => ({ type: 'date', edtf: pad4(1 - parseInt(d[0], 10)), confidence: 0.9 }) %}
  | %bc numeric_year
      {% d => ({ type: 'date', edtf: pad4(1 - parseInt(d[1], 10)), confidence: 0.9 }) %}
  | %bce numeric_year
      {% d => ({ type: 'date', edtf: pad4(1 - parseInt(d[1], 10)), confidence: 0.9 }) %}
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
  | %the __ century_value __ era_bce
      {% d => ({ type: 'date', edtf: buildBCECenturyModifierInterval(d[2], ''), confidence: 0.95 }) %}
  | century_value __ era_bce
      {% d => ({ type: 'date', edtf: buildBCECenturyModifierInterval(d[0], ''), confidence: 0.95 }) %}
  | %the __ spelled_ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'date', edtf: buildBCECenturyModifierInterval(d[2], ''), confidence: 0.95 }) %}
  | spelled_ordinal_century __ century_word __ era_bce
      {% d => ({ type: 'date', edtf: buildBCECenturyModifierInterval(d[0], ''), confidence: 0.95 }) %}
  | %the __ spelled_century __ %century __ era_bce
      {% d => ({ type: 'date', edtf: buildBCECenturyModifierInterval(Number(d[2]) + 1, ''), confidence: 0.95 }) %}
  | spelled_century __ %century __ era_bce
      {% d => ({ type: 'date', edtf: buildBCECenturyModifierInterval(Number(d[0]) + 1, ''), confidence: 0.95 }) %}
  # Century expressions with CE/AD
  | %the __ century_value __ era_ce
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(d[2], ''), confidence: 0.95 }) %}
  | century_value __ era_ce
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(d[0], ''), confidence: 0.95 }) %}
  | %the __ spelled_century __ %century __ era_ce
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(Number(d[2]) + 1, ''), confidence: 0.95 }) %}
  | spelled_century __ %century __ era_ce
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(Number(d[0]) + 1, ''), confidence: 0.95 }) %}
  # Century expressions (no era)
  | %the __ century_value
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(d[2], ''), confidence: 0.95 }) %}
  | century_value
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(d[0], ''), confidence: 0.95 }) %}
  | %the __ spelled_century __ %century
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(Number(d[2]) + 1, ''), confidence: 0.95 }) %}
  | spelled_century __ %century
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(Number(d[0]) + 1, ''), confidence: 0.95 }) %}
  # Spelled number "hundreds": "the eighteen hundreds"
  | %the __ spelled_number_word __ %hundreds
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(Number(d[2]) + 1, ''), confidence: 0.95 }) %}
  | spelled_number_word __ %hundreds
      {% d => ({ type: 'date', edtf: buildCenturyModifierInterval(Number(d[0]) + 1, ''), confidence: 0.95 }) %}
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
          return { type: 'date', edtf: `${twoDigitYear(second, context)}-${pad2(first)}`, confidence: 0.85 };
        }
        return null;
      } %}
  # Slash dates: component roles are resolved by the shared numeric-order context
  | %number %slash %number %slash %number
      {% d => {
        const first = d[0].value;
        const second = d[2].value;
        const third = d[4].value;
        return buildSlashDate(first, second, third, context);
      } %}
  # Year with -ish suffix
  | year_num %ish
      {% d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 }) %}
  | year_num _ %dash %ish
      {% d => ({ type: 'date', edtf: `${pad4(d[0])}~`, confidence: 0.95 }) %}
  # Plain year
  | year_num
      {% d => ({ type: 'date', edtf: pad4(d[0]), confidence: 0.95 }) %}

boundary -> bound_prefix _ datevalue {% d => buildBoundary(d[2], d[0][0], d[0][1]) %}
  | %pre _ %dash:? _ datevalue {% d => !d[2] && d[4].writtenNegative ? null : buildBoundary(d[4], 'before', false) %}
  | %post _ %dash:? _ datevalue {% d => !d[2] && d[4].writtenNegative ? null : buildBoundary(d[4], 'after', false) %}
  | datevalue __ %or __ earlier_word {% d => buildBoundary(d[0], 'before', true) %}
  | datevalue __ %or __ later_word {% d => buildBoundary(d[0], 'after', true) %}
  | datevalue __ %and __ earlier_word {% d => collection('list', [buildBoundary(d[0], 'before', true)]) %}
  | datevalue __ %and __ later_word {% d => ({ type: 'interval', edtf: d[0].edtf + '/..', confidence: 0.95 }) %}
  | %sometime __ %between __ datevalue __ %and __ datevalue {% d => choiceRange(d[4], d[8]) %}
earlier_word -> %earlier {% id %} | %before {% id %}
later_word -> %later {% id %} | %after {% id %}
bound_prefix -> %before {% () => ['before', false] %}
  | %earlier __ %than {% () => ['before', false] %}
  | %prior __ %to {% () => ['before', false] %}
  | %after {% () => ['after', false] %}
  | %later __ %than {% () => ['after', false] %}
  | %by {% () => ['before', true] %}
  | %on __ %or __ %before {% () => ['before', true] %}
  | %on __ %or __ %after {% () => ['after', true] %}
  | %no __ %later __ %than {% () => ['before', true] %}
  | %no __ %earlier __ %than {% () => ['after', true] %}
  | %not __ %later __ %than {% () => ['before', true] %}
  | %not __ %earlier __ %than {% () => ['after', true] %}
  | %not __ %after {% () => ['before', true] %}
  | %not __ %before {% () => ['after', true] %}
shared_date_range -> month_name __ day_num _ %dash _ day_num _ %comma:? _ year_num
  {% d => sharedDayRange(d[10], months[d[0]], d[2], d[6]) %}
  | day_num _ %dash _ day_num __ month_name __ year_num
  {% d => sharedDayRange(d[8], months[d[6]], d[0], d[4]) %}

season_base -> season_name __ calendar_year __ hemisphere_north {% d => ({ edtf: pad4(d[2]) + '-' + northernSeasons[d[0]], confidence: 0.95 }) %}
  | season_name __ calendar_year __ hemisphere_south {% d => ({ edtf: pad4(d[2]) + '-' + southernSeasons[d[0]], confidence: 0.95 }) %}

datevalue_base -> %maskedDate {% d => ({ edtf: d[0].text.toUpperCase(), confidence: 0.95 }) %}

century_value -> ordinal_century __ century_word {% d => d[0] %}

# Explicit semicolons enumerate all dates. Descriptive prose is not discarded.
list -> semicolon_members {% d => collection('list', d[0]) %}
semicolon_members -> collection_member _ %semicolon _ collection_member {% d => [d[0],d[4]] %}
  | collection_member _ %semicolon _ semicolon_members {% d => [d[0],...d[4]] %}

# Short dates without a year are supported at the top level, without guessing
# shared years across interval/list members.
date -> missing_year_date {% id %}
  | qualifier _ missing_year_date {% d => ({ ...d[2], edtf: applyDateQualifier(d[2].edtf,d[0]) }) %}
  | missing_year_date _ qualifier {% d => ({ ...d[0], edtf: applyDateQualifier(d[0].edtf,d[2]) }) %}
missing_year_date -> month_name {% d => ({ edtf: 'XXXX-' + months[d[0]], confidence: 0.98 }) %}
  | month_name __ %number {% d => d[2].text.length <= 2 && Number(d[2].value) >= 1 && Number(d[2].value) <= 31 ? { edtf: 'XXXX-' + months[d[0]] + '-' + pad2(d[2].value), confidence: 0.98 } : null %}
  | month_name __ ordinal_day {% d => ({ edtf: 'XXXX-' + months[d[0]] + '-' + pad2(d[2]), confidence: 0.98 }) %}
  | day_num __ month_name {% d => ({ edtf: 'XXXX-' + months[d[2]] + '-' + pad2(d[0]), confidence: 0.98 }) %}
  | ordinal_day __ month_name {% d => ({ edtf: 'XXXX-' + months[d[2]] + '-' + pad2(d[0]), confidence: 0.98 }) %}

datevalue_base -> month_name _ %comma _ %unknownYear {% d => ({ edtf: 'XXXX-' + months[d[0]], confidence: 0.95 }) %}
  | %apostrophe %number {% d => d[1].text.length === 2 ? { edtf: pad4(twoDigitYear(d[1].value, context)), confidence: 0.95 } : null %}
  | %month __ %inWord __ year_num {% d => ({ edtf: pad4(d[4]) + '-XX', confidence: 0.95 }) %}
  | %day __ %inWord __ month_name __ year_num {% d => ({ edtf: pad4(d[6]) + '-' + months[d[4]] + '-XX', confidence: 0.95 }) %}
  | %day __ %inWord __ year_num {% d => ({ edtf: pad4(d[4]) + '-XX-XX', confidence: 0.95 }) %}
  | %the __ datevalue_base {% d => d[2] %}
  | month_name __ %the __ day_num __ year_num {% d => ({ edtf: pad4(d[6]) + '-' + months[d[0]] + '-' + pad2(d[4]), confidence: 0.95 }) %}

# Calendar years retain explicit eras; unspecified-year text is not guessed.
calendar_year -> year_num {% id %} | era_year {% id %}
era_year -> numeric_year _ era_bce {% d => pad4(1 - Number(d[0])) %}
  | numeric_year _ era_ce {% d => pad4(Number(d[0])) %}
season -> season_base {% id %}
  | qualifier _ season {% d => ({ ...d[2], edtf: applyDateQualifier(d[2].edtf,d[0]) }) %}
  | season _ qualifier {% d => ({ ...d[0], edtf: applyDateQualifier(d[0].edtf,d[2]) }) %}
  | season _ parenthetical_qualification {% d => d[2].type === 'global' ? { ...d[0], edtf: applyDateQualifier(d[0].edtf,d[2].qual) } : null %}
  | %the _ season {% d => d[2] %}
century_value -> %number __ %century {% d => Number(d[0].value) %}
ordinal_century -> %roman %ordinalSuffix:? {% d => romanNumber(d[0].text) %}
datevalue_base -> day_num __ month_name __ era_year {% d => ({ edtf: pad4(d[4]) + '-' + months[d[2]] + '-' + pad2(d[0]), confidence: 0.95 }) %}
  | ordinal_day __ month_name __ era_year {% d => ({ edtf: pad4(d[4]) + '-' + months[d[2]] + '-' + pad2(d[0]), confidence: 0.95 }) %}
  | month_name __ day_num _ %comma:? _ era_year {% d => ({ edtf: pad4(d[6]) + '-' + months[d[0]] + '-' + pad2(d[2]), confidence: 0.95 }) %}
  | month_name __ era_year {% d => ({ edtf: pad4(d[2]) + '-' + months[d[0]], confidence: 0.95 }) %}

datevalue_base -> %dash %number {% d => ({ edtf: pad4(-Number(d[1].text)), confidence: 0.95, writtenNegative: true }) %}

datevalue_base -> weekday _ %comma:? _ datevalue_base {% d => withWeekday(d[4], d[0]) %}
weekday -> %weekday0 %dot:? {% () => 0 %}
  | %weekday1 %dot:? {% () => 1 %}
  | %weekday2 %dot:? {% () => 2 %}
  | %weekday3 %dot:? {% () => 3 %}
  | %weekday4 %dot:? {% () => 4 %}
  | %weekday5 %dot:? {% () => 5 %}
  | %weekday6 %dot:? {% () => 6 %}

calendar_year -> %dash %number {% d => pad4(-Number(d[1].text)) %}
