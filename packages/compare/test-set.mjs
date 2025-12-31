import { parse } from '../core/dist/index.js';
import { normalize } from './dist/index.js';

const result = parse('[1667,1668,1670..1672]');
console.log('Parse success:', result.success);

if (result.success) {
  const normalized = normalize(result.value);
  console.log('Members:', normalized.members.length);
  console.log('List mode:', normalized.listMode);
  
  console.log('\nAll members:');
  for (let i = 0; i < normalized.members.length; i++) {
    const m = normalized.members[i];
    console.log('Member', i+1);
    console.log('  sMin:', m.sMin ? new Date(Number(m.sMin)).toISOString() : null);
    console.log('  eMax:', m.eMax ? new Date(Number(m.eMax)).toISOString() : null);
  }
}
