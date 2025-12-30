import { parseNatural } from './packages/natural/src/parser.ts';

console.log('\n=== Testing Character Normalization ===\n');

const testCases = [
  { input: '1940–2001', description: 'En-dash interval' },
  { input: '1940—2001', description: 'Em-dash interval' },
  { input: '1940-2001', description: 'Regular hyphen interval' },
  { input: "the '60s", description: 'Unicode apostrophe' },
  { input: "the '60s", description: 'ASCII apostrophe' },
];

for (const { input, description } of testCases) {
  console.log(`${description}: "${input}"`);
  try {
    const results = parseNatural(input, { returnAllResults: false });
    if (results.length > 0) {
      console.log(`  ✓ EDTF: ${results[0].edtf}`);
      console.log(`  Confidence: ${results[0].confidence}`);
      console.log(`  Interpretation: ${results[0].interpretation}`);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }
  console.log();
}
