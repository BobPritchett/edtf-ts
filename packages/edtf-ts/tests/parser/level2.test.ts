import { describe, it, expect } from 'vitest';
import { parse, isValid, isEDTFSet, isEDTFList, isEDTFDate, isEDTFSeason } from '../../src/index.js';

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

  it('should parse extended year with significant digits', () => {
    const result = parse('Y171010000S3');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(171010000);
      expect(result.value.significantDigitsYear).toBe(3);
      expect(result.level).toBe(2);
    }
  });

  it('should parse exponential year with significant digits', () => {
    const result = parse('Y3388E2S3');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(338800);
      expect(result.value.exponential).toBe(2);
      expect(result.value.significantDigitsYear).toBe(3);
      expect(result.level).toBe(2);
    }
  });

  it('should validate significant digits', () => {
    expect(isValid('1950S2')).toBe(true);
    expect(isValid('2000S3')).toBe(true);
    expect(isValid('Y171010000S3')).toBe(true);
    expect(isValid('Y3388E2S3')).toBe(true);
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

describe('Level 2 - Partial Qualification', () => {
  it('should parse date with uncertain year and approximate day', () => {
    const result = parse('?2004-06-~11');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.day).toBe(11);
      expect(result.value.yearQualification?.uncertain).toBe(true);
      expect(result.value.dayQualification?.approximate).toBe(true);
      expect(result.level).toBe(2);
    }
  });

  it('should parse date with uncertain year and approximate month', () => {
    const result = parse('?2004-~06');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.yearQualification?.uncertain).toBe(true);
      expect(result.value.monthQualification?.approximate).toBe(true);
    }
  });

  it('should parse date with only approximate month', () => {
    const result = parse('2004-~06-11');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.day).toBe(11);
      expect(result.value.yearQualification).toBeUndefined();
      expect(result.value.monthQualification?.approximate).toBe(true);
      expect(result.value.dayQualification).toBeUndefined();
    }
  });

  it('should parse date with uncertain year only', () => {
    const result = parse('?2004-06');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.yearQualification?.uncertain).toBe(true);
      expect(result.value.monthQualification).toBeUndefined();
    }
  });

  it('should parse with uncertain-approximate qualifier', () => {
    const result = parse('%2004-06-11');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.yearQualification?.uncertainApproximate).toBe(true);
    }
  });

  it('should validate partial qualification dates', () => {
    expect(isValid('?2004-06-~11')).toBe(true);
    expect(isValid('?2004-~06')).toBe(true);
    expect(isValid('2004-~06-11')).toBe(true);
    expect(isValid('%2004-06-11')).toBe(true);
  });

  it('should accept Level 1 qualification at end', () => {
    // Note: '2004-06-11~' is valid Level 1 (whole date approximate), not partial qualification
    expect(isValid('2004-06-11~')).toBe(true);
    const result = parse('2004-06-11~');
    if (result.success && isEDTFDate(result.value)) {
      // This should be Level 1, not Level 2 partial qualification
      expect(result.level).toBe(1);
      expect(result.value.qualification?.approximate).toBe(true);
    }
  });

  it('should calculate min/max correctly for partial qualification', () => {
    const result = parse('?2004-06-~11');
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.min).toBeInstanceOf(Date);
      expect(result.value.max).toBeInstanceOf(Date);
      expect(result.value.min.getUTCFullYear()).toBe(2004);
      expect(result.value.min.getUTCMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(result.value.min.getUTCDate()).toBe(11);
    }
  });

  it('should serialize partial qualification to JSON', () => {
    const result = parse('?2004-06-~11');
    if (result.success && isEDTFDate(result.value)) {
      const json = result.value.toJSON();
      expect(json).toHaveProperty('year', 2004);
      expect(json).toHaveProperty('month', 6);
      expect(json).toHaveProperty('day', 11);
      expect(json).toHaveProperty('yearQualification');
      expect(json).toHaveProperty('dayQualification');
    }
  });
});

describe('Level 2 - Group Qualification', () => {
  // Group Qualification: qualifier to the RIGHT of a component applies to
  // that component AND all components to the left

  it('should parse uncertain year (2004?-06-11)', () => {
    const result = parse('2004?-06-11');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.day).toBe(11);
      expect(result.level).toBe(2);
      // Year is uncertain, month and day are known
      expect(result.value.yearQualification?.uncertain).toBe(true);
    }
  });

  it('should parse approximate year and month (2004-06~-11)', () => {
    const result = parse('2004-06~-11');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.day).toBe(11);
      expect(result.level).toBe(2);
      // Year and month are approximate, day is known
      expect(result.value.yearQualification?.approximate).toBe(true);
      expect(result.value.monthQualification?.approximate).toBe(true);
    }
  });

  it('should parse uncertain-approximate entire date (2004-06-11%)', () => {
    const result = parse('2004-06-11%');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.day).toBe(11);
      // % at end means entire date is uncertain and approximate
      expect(result.value.qualification?.uncertainApproximate).toBe(true);
    }
  });

  it('should parse approximate year (2004~-06-11)', () => {
    const result = parse('2004~-06-11');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.day).toBe(11);
      expect(result.level).toBe(2);
      expect(result.value.yearQualification?.approximate).toBe(true);
    }
  });

  it('should validate group qualification dates', () => {
    expect(isValid('2004?-06-11')).toBe(true);
    expect(isValid('2004-06~-11')).toBe(true);
    expect(isValid('2004~-06-11')).toBe(true);
    expect(isValid('2004%-06-11')).toBe(true);
    expect(isValid('2004-06%-11')).toBe(true);
  });
});
