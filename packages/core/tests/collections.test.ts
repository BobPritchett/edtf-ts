import { describe, it, expect } from 'vitest';
import {
  compactYearRanges,
  formatHuman,
  parse,
  type EDTFSet,
  type EDTFList,
} from '../src/index.js';

function parsed(text: string) {
  const result = parse(text);
  if (!result.success) throw new Error(`Invalid fixture: ${text}`);
  return result.value;
}

describe('adjacent exact year compaction', () => {
  it.each([
    ['[1870,1871,1872]', '[1870..1872]'],
    ['{1870,1871,1872}', '{1870..1872}'],
    ['[1667,1668,1670..1672]', '[1667..1668,1670..1672]'],
    ['[1870..1872,1873,1874..1880]', '[1870..1880]'],
    ['[..1870,1871,1872,1890,1891..]', '[..1870..1872,1890..1891..]'],
    ['{..1870,1871,1872..}', '{..1870..1872..}'],
    ['[-0002,-0001,0000,0001]', '[-0002..0001]'],
    ['[0000,0001,0002]', '[0000..0002]'],
    ['[0098,0099,0100]', '[0098..0100]'],
    ['[9999,Y10000,Y10001]', '[9999..Y10001]'],
    ['[Y-10001,Y-10000,-9999]', '[Y-10001..-9999]'],
    ['[1872,1871,1870]', '[1872,1871,1870]'],
    ['[1870,1870,1871]', '[1870,1870..1871]'],
    ['[1870,1871?,1872,1873~]', '[1870,1871?,1872,1873~]'],
    ['[?1870,1871,1872]', '[?1870,1871..1872]'],
    ['[187X,1880,1881]', '[187X,1880..1881]'],
    ['[1870-01,1870-02,1871,1872]', '[1870-01,1870-02,1871..1872]'],
    ['[1870-01..1870-03,1871,1872]', '[1870-01..1870-03,1871..1872]'],
    ['[1870-21,1871-21,1872,1873]', '[1870-21,1871-21,1872..1873]'],
    ['[1870]', '[1870]'],
  ])('%s → %s preserves every member and its order', (source, expected) => {
    const original = parsed(source) as EDTFSet | EDTFList;
    const compacted = compactYearRanges(original);
    expect(compacted).toBe(expected);
    expect(original.edtf).toBe(source);
    const reduced = parsed(compacted) as EDTFSet | EDTFList;
    expect(reduced.type).toBe(original.type);
    expect(reduced.values.map((v) => v.toJSON())).toEqual(original.values.map((v) => v.toJSON()));
    expect(reduced.earlier).toBe(original.earlier);
    expect(reduced.later).toBe(original.later);
    expect(compactYearRanges(reduced)).toBe(compacted);
  });

  it.each(['1870/1880', '1870/..', '../1870', '1870/', '1870?', '~2004-06'])(
    'leaves other representations unchanged: %s',
    (source) => expect(compactYearRanges(parsed(source))).toBe(source)
  );

  it.each([
    ['en-GB', 'One of: 1870 through 1880'],
    ['es-ES', 'Una de estas fechas: 1870 a 1880'],
    ['fr-FR', 'Une de ces dates: 1870 à 1880'],
  ])('renders a year range concisely in %s', (locale, expected) => {
    expect(formatHuman(parsed('[1870..1880]'), { locale })).toBe(expected);
    expect(
      formatHuman(parsed('[1870,1871,1872,1873,1874,1875,1876,1877,1878,1879,1880]'), { locale })
    ).toBe(expected);
  });
});
