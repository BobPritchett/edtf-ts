/**
 * Basic usage examples for @edtf-ts/core
 */

import { parse, isValid, isEDTFDate, isEDTFInterval } from '../src/index.js';

console.log('=== EDTF TypeScript Library - Basic Usage Examples ===\n');

// Example 1: Parse a simple date
console.log('1. Parsing simple dates:');
const date1 = parse('1985-04-12');
if (date1.success && isEDTFDate(date1.value)) {
  console.log(`  Input: 1985-04-12`);
  console.log(`  Level: ${date1.level}`);
  console.log(`  Min: ${date1.value.min}`);
  console.log(`  Max: ${date1.value.max}`);
  console.log();
}

// Example 2: Parse an uncertain date
console.log('2. Parsing uncertain dates (Level 1):');
const date2 = parse('1984?');
if (date2.success && isEDTFDate(date2.value)) {
  console.log(`  Input: 1984?`);
  console.log(`  Uncertain: ${date2.value.qualification?.uncertain}`);
  console.log(`  Level: ${date2.level}`);
  console.log();
}

// Example 3: Parse a set (Level 2)
console.log('3. Parsing sets (Level 2):');
const set = parse('[1667,1668,1670]');
if (set.success) {
  console.log(`  Input: [1667,1668,1670]`);
  console.log(`  Type: ${set.value.type}`);
  console.log(`  Level: ${set.level}`);
  console.log();
}

// Example 4: Use comparison methods
console.log('4. Comparison methods:');
const d1 = parse('2000');
const d2 = parse('2001');
if (d1.success && d2.success && isEDTFDate(d1.value) && isEDTFDate(d2.value)) {
  console.log(`  2000 is before 2001: ${d1.value.isBefore!(d2.value)}`);
  console.log(`  2001 is after 2000: ${d2.value.isAfter!(d1.value)}`);
  console.log();
}

// Example 5: Iterate through an interval
console.log('5. Iterating through an interval:');
const interval = parse('2020/2022');
if (interval.success && isEDTFInterval(interval.value)) {
  console.log(`  Input: 2020/2022`);
  console.log(`  Iterating by year:`);

  if (interval.value.by) {
    for (const year of interval.value.by('year')) {
      console.log(`    - ${year.edtf}`);
    }
  }
  console.log();
}

// Example 6: Check if interval contains a date
console.log('6. Interval operations:');
const interval2 = parse('1990/2000');
const testDate = parse('1995');
if (interval2.success && testDate.success && isEDTFInterval(interval2.value) && isEDTFDate(testDate.value)) {
  console.log(`  Interval: 1990/2000`);
  console.log(`  Contains 1995? ${interval2.value.contains!(testDate.value)}`);
  console.log();
}

// Example 7: Validate EDTF strings
console.log('7. Validation:');
console.log(`  isValid('1985-04-12'): ${isValid('1985-04-12')}`);
console.log(`  isValid('1984?'): ${isValid('1984?')}`);
console.log(`  isValid('[1667,1668]'): ${isValid('[1667,1668]')}`);
console.log(`  isValid('invalid'): ${isValid('invalid')}`);
console.log();

console.log('=== Examples Complete ===');
