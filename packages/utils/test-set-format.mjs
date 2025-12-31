import { parse } from '../core/dist/index.js';
import { formatHuman } from './dist/index.js';

// Test the reported issue
const result1 = parse('[2025-01..2026-11]');
console.log('Parse [2025-01..2026-11]:', result1.success);
if (result1.success) {
  console.log('Type:', result1.value.type);
  console.log('Values:', result1.value.values);
  console.log('Formatted:', formatHuman(result1.value));
}

console.log('\n---\n');

// Test with days
const result2 = parse('[2025-01-15..2025-01-20]');
console.log('Parse [2025-01-15..2025-01-20]:', result2.success);
if (result2.success) {
  console.log('Type:', result2.value.type);
  console.log('Formatted:', formatHuman(result2.value));
}
