/**
 * Basic usage examples for @edtf-ts/core
 * Demonstrates Level 0 EDTF parsing capabilities
 */

import { parse, isValid, isEDTFDate, isEDTFDateTime, isEDTFInterval } from '../src/index.js';

console.log('=== EDTF Level 0 Basic Usage ===\n');

// Example 1: Complete Date
console.log('1. Complete Date:');
const date1 = parse('1985-04-12');
if (date1.success) {
  console.log('  Input: 1985-04-12');
  console.log('  Type:', date1.value.type);
  console.log('  Year:', (date1.value as any).year);
  console.log('  Month:', (date1.value as any).month);
  console.log('  Day:', (date1.value as any).day);
  console.log('  Min:', date1.value.min.toISOString());
  console.log('  Max:', date1.value.max.toISOString());
}
console.log();

// Example 2: Year and Month
console.log('2. Year-Month:');
const date2 = parse('1985-04');
if (date2.success && isEDTFDate(date2.value)) {
  console.log('  Input: 1985-04');
  console.log('  Year:', date2.value.year);
  console.log('  Month:', date2.value.month);
  console.log('  Precision:', date2.value.precision);
  console.log('  Range: from', date2.value.min.toISOString(), 'to', date2.value.max.toISOString());
}
console.log();

// Example 3: Year Only
console.log('3. Year Only:');
const date3 = parse('1985');
if (date3.success && isEDTFDate(date3.value)) {
  console.log('  Input: 1985');
  console.log('  Year:', date3.value.year);
  console.log('  Precision:', date3.value.precision);
  console.log('  Spans entire year:', date3.value.min.toISOString(), 'to', date3.value.max.toISOString());
}
console.log();

// Example 4: DateTime with Timezone
console.log('4. DateTime with Timezone:');
const date4 = parse('1985-04-12T23:20:30Z');
if (date4.success && isEDTFDateTime(date4.value)) {
  console.log('  Input: 1985-04-12T23:20:30Z');
  console.log('  Date:', date4.value.year, date4.value.month, date4.value.day);
  console.log('  Time:', date4.value.hour, date4.value.minute, date4.value.second);
  console.log('  Timezone:', date4.value.timezone);
}
console.log();

// Example 5: Interval
console.log('5. Year Interval:');
const date5 = parse('1964/2008');
if (date5.success && isEDTFInterval(date5.value)) {
  console.log('  Input: 1964/2008');
  console.log('  Start year:', (date5.value.start as any).year);
  console.log('  End year:', (date5.value.end as any).year);
  console.log('  Total range:', date5.value.min.toISOString(), 'to', date5.value.max.toISOString());
}
console.log();

// Example 6: Validation
console.log('6. Validation:');
console.log('  isValid("1985-04-12"):', isValid('1985-04-12'));
console.log('  isValid("1985-13-01"):', isValid('1985-13-01')); // Invalid month
console.log('  isValid("1985-02-30"):', isValid('1985-02-30')); // Invalid day
console.log('  isValid("2000-02-29"):', isValid('2000-02-29')); // Leap year
console.log();

// Example 7: Error Handling
console.log('7. Error Handling:');
const invalidDate = parse('1985-13-01');
if (!invalidDate.success) {
  console.log('  Input: 1985-13-01');
  console.log('  Error:', invalidDate.errors[0].message);
  console.log('  Code:', invalidDate.errors[0].code);
}
console.log();

// Example 8: JSON Serialization
console.log('8. JSON Serialization:');
const date8 = parse('1985-04-12');
if (date8.success) {
  console.log('  Input: 1985-04-12');
  console.log('  JSON:', JSON.stringify(date8.value.toJSON(), null, 2));
}
