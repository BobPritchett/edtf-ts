import { parse } from '../core/dist/index.js';

const result = parse('[2025-01..2026]');
console.log('Success:', result.success);
if (!result.success) {
  console.log('Errors:', result.errors);
}
