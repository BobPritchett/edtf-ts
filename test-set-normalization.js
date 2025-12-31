import { parse } from '@edtf-ts/core';
import { normalize } from '@edtf-ts/compare';

const result = parse('[1667,1668,1670..1672]');
console.log('Parse result:', result.success ? 'SUCCESS' : 'FAILED');

if (result.success) {
  console.log('Parsed value type:', result.value.type);

  const normalized = normalize(result.value);
  console.log('\nNormalized shape:');
  console.log('Number of members:', normalized.members.length);
  console.log('List mode:', normalized.listMode);

  console.log('\nAll members:');
  let idx = 0;
  for (const member of normalized.members) {
    idx++;
    console.log(`\nMember ${idx}:`);
    console.log('  sMin:', member.sMin ? new Date(Number(member.sMin)).toISOString() : null);
    console.log('  sMax:', member.sMax ? new Date(Number(member.sMax)).toISOString() : null);
    console.log('  eMin:', member.eMin ? new Date(Number(member.eMin)).toISOString() : null);
    console.log('  eMax:', member.eMax ? new Date(Number(member.eMax)).toISOString() : null);
  }

  const sMinValues = normalized.members.map(m => m.sMin).filter(v => v !== null);
  const sMaxValues = normalized.members.map(m => m.sMax).filter(v => v !== null);
  const eMinValues = normalized.members.map(m => m.eMin).filter(v => v !== null);
  const eMaxValues = normalized.members.map(m => m.eMax).filter(v => v !== null);

  console.log('\nConvex Hull (what playground should show):');
  console.log('  sMin:', new Date(Number(sMinValues.reduce((a, b) => a < b ? a : b))).toISOString());
  console.log('  sMax:', new Date(Number(sMaxValues.reduce((a, b) => a > b ? a : b))).toISOString());
  console.log('  eMin:', new Date(Number(eMinValues.reduce((a, b) => a < b ? a : b))).toISOString());
  console.log('  eMax:', new Date(Number(eMaxValues.reduce((a, b) => a > b ? a : b))).toISOString());
}
