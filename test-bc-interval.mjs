import { parseNatural } from './packages/natural/dist/index.js';

console.log('\n=== Testing BC Interval Parsing ===\n');

const testCases = [
  '50 - 40 BC',
  '50 to 40 BC',
  '100 - 50 BCE',
];

for (const input of testCases) {
  console.log(`Input: "${input}"`);
  const results = parseNatural(input);
  console.log(`  Results count: ${results.length}`);
  results.forEach((r, i) => {
    console.log(`  [${i}] edtf="${r.edtf}" confidence=${r.confidence} type=${r.type}`);
  });
  console.log();
}
