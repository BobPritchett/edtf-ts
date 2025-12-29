/**
 * Partial Qualification Examples (Level 2)
 * Demonstrates different parts of dates with different qualifications
 */

import { parse, isEDTFDate } from '../src/index.js';

console.log('=== Partial Qualification Examples ===\n');

// Example 1: Uncertain year, approximate day
console.log('1. Uncertain year, approximate day:');
const ex1 = parse('?2004-06-~11');
if (ex1.success && isEDTFDate(ex1.value)) {
  console.log(`  Input: ?2004-06-~11`);
  console.log(`  Year uncertain: ${ex1.value.yearQualification?.uncertain}`);
  console.log(`  Day approximate: ${ex1.value.dayQualification?.approximate}`);
  console.log(`  Level: ${ex1.level}`);
  console.log();
}

// Example 2: Uncertain year, approximate month
console.log('2. Uncertain year, approximate month:');
const ex2 = parse('?2004-~06');
if (ex2.success && isEDTFDate(ex2.value)) {
  console.log(`  Input: ?2004-~06`);
  console.log(`  Year uncertain: ${ex2.value.yearQualification?.uncertain}`);
  console.log(`  Month approximate: ${ex2.value.monthQualification?.approximate}`);
  console.log();
}

// Example 3: Only month is approximate
console.log('3. Only month is approximate:');
const ex3 = parse('2004-~06-11');
if (ex3.success && isEDTFDate(ex3.value)) {
  console.log(`  Input: 2004-~06-11`);
  console.log(`  Year qualification: ${ex3.value.yearQualification || 'none'}`);
  console.log(`  Month approximate: ${ex3.value.monthQualification?.approximate}`);
  console.log(`  Day qualification: ${ex3.value.dayQualification || 'none'}`);
  console.log();
}

// Example 4: Uncertain-approximate year
console.log('4. Uncertain-approximate year:');
const ex4 = parse('%2004-06-11');
if (ex4.success && isEDTFDate(ex4.value)) {
  console.log(`  Input: %2004-06-11`);
  console.log(`  Year uncertain-approximate: ${ex4.value.yearQualification?.uncertainApproximate}`);
  console.log();
}

console.log('=== Examples Complete ===');
