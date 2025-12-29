import { describe, it, expect } from 'vitest';
import { parse, isValid, isEDTFSet, isEDTFList, isEDTFDate, isEDTFSeason } from '../src/index.js';

describe('Level 2 - Sets', () => {
  it('should parse simple set', () => {
    const result = parse('[1667,1668,1670]');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.type).toBe('Set');
      expect(result.value.values.length).toBe(3);
      expect(result.level).toBe(2);
    }
  });

  it('should parse set with range', () => {
    const result = parse('[1667,1668,1670..1672]');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.values.length).toBeGreaterThan(3);
    }
  });

  it('should parse open-ended set (earlier)', () => {
    const result = parse('[..1760-12]');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.earlier).toBe(true);
    }
  });

  it('should parse open-ended set (later)', () => {
    const result = parse('[1760-12..]');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSet(result.value)) {
      expect(result.value.later).toBe(true);
    }
  });

  it('should validate sets', () => {
    expect(isValid('[1667,1668]')).toBe(true);
    expect(isValid('[1670..1672]')).toBe(true);
  });
});

describe('Level 2 - Lists', () => {
  it('should parse simple list', () => {
    const result = parse('{1667,1668,1670}');
    expect(result.success).toBe(true);
    if (result.success && isEDTFList(result.value)) {
      expect(result.value.type).toBe('List');
      expect(result.value.values.length).toBe(3);
    }
  });

  it('should parse list with range', () => {
    const result = parse('{1667,1668,1670..1672}');
    expect(result.success).toBe(true);
    if (result.success && isEDTFList(result.value)) {
      expect(result.value.values.length).toBeGreaterThan(3);
    }
  });

  it('should validate lists', () => {
    expect(isValid('{1667,1668}')).toBe(true);
    expect(isValid('{1670..1672}')).toBe(true);
  });
});

describe('Level 2 - Exponential Years', () => {
  it('should parse positive exponential year', () => {
    const result = parse('Y17E7');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(170000000);
      expect(result.value.exponential).toBe(7);
    }
  });

  it('should parse negative exponential year', () => {
    const result = parse('Y-17E7');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(-170000000);
      expect(result.value.exponential).toBe(7);
    }
  });

  it('should validate exponential years', () => {
    expect(isValid('Y17E7')).toBe(true);
    expect(isValid('Y-17E7')).toBe(true);
  });
});

describe('Level 2 - Significant Digits', () => {
  it('should parse year with significant digits', () => {
    const result = parse('1950S2');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(1950);
      expect(result.value.significantDigitsYear).toBe(2);
    }
  });

  it('should validate significant digits', () => {
    expect(isValid('1950S2')).toBe(true);
    expect(isValid('2000S3')).toBe(true);
  });
});

describe('Level 2 - Extended Seasons', () => {
  it('should parse southern hemisphere spring', () => {
    const result = parse('2001-25');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSeason(result.value)) {
      expect(result.value.season).toBe(25);
      expect(result.level).toBe(2);
    }
  });

  it('should parse quarter', () => {
    const result = parse('2001-33');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSeason(result.value)) {
      expect(result.value.season).toBe(33);
    }
  });

  it('should validate extended seasons', () => {
    expect(isValid('2001-25')).toBe(true); // Southern Spring
    expect(isValid('2001-33')).toBe(true); // Q1
    expect(isValid('2001-41')).toBe(true); // Semester
  });
});

describe('Level 2 - Auto-detection', () => {
  it('should detect Level 2 for sets', () => {
    const result = parse('[1667,1668]');
    expect(result.success && result.level).toBe(2);
  });

  it('should detect Level 2 for lists', () => {
    const result = parse('{1667,1668}');
    expect(result.success && result.level).toBe(2);
  });

  it('should detect Level 2 for exponential years', () => {
    const result = parse('Y17E7');
    expect(result.success && result.level).toBe(2);
  });

  it('should detect Level 2 for significant digits', () => {
    const result = parse('1950S2');
    expect(result.success && result.level).toBe(2);
  });
});

describe('Level 2 - Serialization', () => {
  it('should serialize set to JSON', () => {
    const result = parse('[1667,1668]');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toHaveProperty('type', 'Set');
      expect(json).toHaveProperty('values');
    }
  });

  it('should serialize exponential year to JSON', () => {
    const result = parse('Y17E7');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toHaveProperty('exponential', 7);
    }
  });
});

describe('Level 2 - Backward Compatibility', () => {
  it('should still parse Level 0 dates', () => {
    expect(isValid('1985-04-12', 2)).toBe(true);
  });

  it('should still parse Level 1 features', () => {
    expect(isValid('1985?', 2)).toBe(true);
    expect(isValid('201X', 2)).toBe(true);
  });
});
