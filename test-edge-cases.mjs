import { parseNatural } from './packages/natural/dist/index.js';

console.log('\n=== Testing Edge Cases ===\n');

const testCases = [
  // Ordinal dates
  { input: 'January the 12th, 1940', expected: '1940-01-12', description: 'Ordinal with "the"' },
  { input: 'on the 1st of May 2000', expected: '2000-05-01', description: 'Ordinal with "of"' },

  // Decades with apostrophes
  { input: "the 1800's", expected: '18XX', description: 'Century decade with apostrophe-s' },
  { input: "'60s", expected: '196X', description: 'Short decade with apostrophe' },
  { input: "the '60s", expected: '196X', description: 'Short decade with "the"' },
  { input: "1960's era", expected: '196X', description: 'Decade with era suffix' },

  // Century names
  { input: 'the eighteen hundreds', expected: '18XX', description: 'Century in words' },
  { input: '5th century BC', expected: '-04XX', description: '5th century BC' },
  { input: 'fifth century BCE', expected: '-04XX', description: 'Fifth century BCE' },
  { input: '12th century AD', expected: '11XX', description: '12th century AD' },
];

for (const { input, expected, description } of testCases) {
  console.log(`${description}: "${input}"`);
  console.log(`  Expected: ${expected}`);
  try {
    const results = parseNatural(input, { returnAllResults: false });
    if (results.length > 0) {
      const actual = results[0].edtf;
      const match = actual === expected ? '✓' : '✗';
      console.log(`  ${match} Actual: ${actual} (confidence: ${results[0].confidence})`);
      if (match === '✗') {
        console.log(`  Interpretation: ${results[0].interpretation}`);
      }
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }
  console.log();
}
