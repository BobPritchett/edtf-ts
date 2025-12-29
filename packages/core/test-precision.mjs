import { parse } from './dist/index.js';

const tests = [
  '1872-01',      // Month precision
  '1872-01-XX',   // Day precision, but day unspecified
  '1872-01-15',   // Day precision, specific day
];

console.log('Testing precision:\n');
tests.forEach(edtf => {
  const result = parse(edtf);
  if (result.success) {
    console.log(`${edtf}:`);
    console.log(`  precision: ${result.value.precision}`);
    console.log(`  year: ${result.value.year}`);
    console.log(`  month: ${result.value.month}`);
    console.log(`  day: ${result.value.day}`);
    console.log();
  }
});
