import { describe, it, expect } from 'vitest';
import { parse, isValid, isEDTFDate, isEDTFSeason, isEDTFInterval } from '../../src/index.js';

describe('Level 1 - Uncertain Dates', () => {
  it('should parse uncertain year', () => {
    const result = parse('1984?');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(1984);
      expect(result.value.qualification?.uncertain).toBe(true);
      expect(result.level).toBe(1);
    }
  });

  it('should parse uncertain year-month', () => {
    const result = parse('2004-06?');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.qualification?.uncertain).toBe(true);
    }
  });

  it('should parse uncertain complete date', () => {
    const result = parse('2004-06-11?');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.day).toBe(11);
      expect(result.value.qualification?.uncertain).toBe(true);
    }
  });

  it('should validate uncertain dates', () => {
    expect(isValid('1984?')).toBe(true);
    expect(isValid('2004-06?')).toBe(true);
    expect(isValid('2004-06-11?')).toBe(true);
  });
});

describe('Level 1 - Approximate Dates', () => {
  it('should parse approximate year', () => {
    const result = parse('1984~');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(1984);
      expect(result.value.qualification?.approximate).toBe(true);
    }
  });

  it('should parse approximate year-month', () => {
    const result = parse('2004-06~');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(2004);
      expect(result.value.month).toBe(6);
      expect(result.value.qualification?.approximate).toBe(true);
    }
  });

  it('should validate approximate dates', () => {
    expect(isValid('1984~')).toBe(true);
    expect(isValid('2004-06~')).toBe(true);
    expect(isValid('2004-06-11~')).toBe(true);
  });
});

describe('Level 1 - Uncertain and Approximate', () => {
  it('should parse uncertain and approximate year', () => {
    const result = parse('1984%');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(1984);
      expect(result.value.qualification?.uncertainApproximate).toBe(true);
    }
  });

  it('should parse uncertain and approximate date', () => {
    const result = parse('2004-06-11%');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.qualification?.uncertainApproximate).toBe(true);
    }
  });

  it('should validate uncertain and approximate dates', () => {
    expect(isValid('1984%')).toBe(true);
    expect(isValid('2004-06%')).toBe(true);
  });
});

describe('Level 1 - Unspecified Digits', () => {
  it('should parse year with one unspecified digit', () => {
    const result = parse('201X');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe('201X');
      expect(result.value.unspecified?.year).toBe('201X');
    }
  });

  it('should parse year with two unspecified digits', () => {
    const result = parse('20XX');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe('20XX');
      expect(result.value.unspecified?.year).toBe('20XX');
    }
  });

  it('should parse decade (3 unspecified digits)', () => {
    const result = parse('1XXX');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe('1XXX');
    }
  });

  it('should parse date with unspecified month', () => {
    const result = parse('1985-XX');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(1985);
      expect(result.value.month).toBe('XX');
      expect(result.value.unspecified?.month).toBe('XX');
    }
  });

  it('should parse date with unspecified day', () => {
    const result = parse('1985-04-XX');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(1985);
      expect(result.value.month).toBe(4);
      expect(result.value.day).toBe('XX');
      expect(result.value.unspecified?.day).toBe('XX');
    }
  });

  it('should parse fully unspecified date', () => {
    const result = parse('1985-XX-XX');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.month).toBe('XX');
      expect(result.value.day).toBe('XX');
    }
  });

  it('should calculate min/max for unspecified year', () => {
    const result = parse('201X');
    if (result.success) {
      expect(result.value.min.getUTCFullYear()).toBe(2010);
      expect(result.value.max.getUTCFullYear()).toBe(2019);
    }
  });

  it('should calculate min/max for unspecified month', () => {
    const result = parse('1985-XX');
    if (result.success) {
      const min = result.value.min;
      const max = result.value.max;
      expect(min.getUTCMonth()).toBe(0);  // January
      expect(max.getUTCMonth()).toBe(11); // December
    }
  });

  it('should validate unspecified dates', () => {
    expect(isValid('201X')).toBe(true);
    expect(isValid('20XX')).toBe(true);
    expect(isValid('1XXX')).toBe(true);
    expect(isValid('1985-XX')).toBe(true);
    expect(isValid('1985-04-XX')).toBe(true);
  });
});

describe('Level 1 - Extended Years', () => {
  it('should parse 5-digit year', () => {
    const result = parse('Y170000002');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(170000002);
      expect(result.value.significantDigits).toBe(9);
    }
  });

  it('should parse negative extended year', () => {
    const result = parse('Y-170000002');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe(-170000002);
    }
  });

  it('should validate extended years', () => {
    expect(isValid('Y170000002')).toBe(true);
    expect(isValid('Y-170000002')).toBe(true);
  });
});

describe('Level 1 - Seasons', () => {
  it('should parse Spring', () => {
    const result = parse('2001-21');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSeason(result.value)) {
      expect(result.value.type).toBe('Season');
      expect(result.value.year).toBe(2001);
      expect(result.value.season).toBe(21);
    }
  });

  it('should parse Summer', () => {
    const result = parse('2001-22');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSeason(result.value)) {
      expect(result.value.season).toBe(22);
    }
  });

  it('should parse Autumn', () => {
    const result = parse('2001-23');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSeason(result.value)) {
      expect(result.value.season).toBe(23);
    }
  });

  it('should parse Winter', () => {
    const result = parse('2001-24');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSeason(result.value)) {
      expect(result.value.season).toBe(24);
    }
  });

  it('should parse uncertain season', () => {
    const result = parse('2001-21?');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSeason(result.value)) {
      expect(result.value.qualification?.uncertain).toBe(true);
    }
  });

  it('should parse approximate season', () => {
    const result = parse('2001-22~');
    expect(result.success).toBe(true);
    if (result.success && isEDTFSeason(result.value)) {
      expect(result.value.qualification?.approximate).toBe(true);
    }
  });

  it('should calculate season min/max correctly', () => {
    const result = parse('2001-21'); // Spring
    if (result.success && isEDTFSeason(result.value)) {
      // Season spans are approximate - min should be start of year at minimum
      expect(result.value.min).toBeInstanceOf(Date);
      expect(result.value.max).toBeInstanceOf(Date);
      expect(result.value.min.getUTCFullYear()).toBe(2001);
      expect(result.value.max.getUTCFullYear()).toBeGreaterThanOrEqual(2001);
    }
  });

  it('should validate seasons', () => {
    expect(isValid('2001-21')).toBe(true);
    expect(isValid('2001-22')).toBe(true);
    expect(isValid('2001-23')).toBe(true);
    expect(isValid('2001-24')).toBe(true);
    // Note: 25+ are Level 2 extended seasons, but still valid
    expect(isValid('2001-25')).toBe(true); // Level 2 Southern Spring
  });
});

describe('Level 1 - Extended Intervals', () => {
  it('should parse interval with uncertain endpoints', () => {
    const result = parse('1984?/2004-06~');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      expect(result.value.type).toBe('Interval');
      if (isEDTFDate(result.value.start)) {
        expect(result.value.start.qualification?.uncertain).toBe(true);
      }
      if (isEDTFDate(result.value.end)) {
        expect(result.value.end.qualification?.approximate).toBe(true);
      }
    }
  });

  it('should parse open-start interval', () => {
    const result = parse('../1985');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      expect(result.value.openStart).toBe(true);
      expect(result.value.start).toBeNull();
    }
  });

  it('should parse open-end interval', () => {
    const result = parse('1985/..');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      expect(result.value.openEnd).toBe(true);
      expect(result.value.end).toBeNull();
    }
  });

  it('should parse unknown-start interval', () => {
    const result = parse('/1985');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      expect(result.value.start).toBeNull();
      expect(result.value.openStart).toBeUndefined();
    }
  });

  it('should parse unknown-end interval', () => {
    const result = parse('1985/');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      expect(result.value.end).toBeNull();
      expect(result.value.openEnd).toBeUndefined();
    }
  });

  it('should parse season interval', () => {
    const result = parse('2001-21/2001-22');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      expect(isEDTFSeason(result.value.start)).toBe(true);
      expect(isEDTFSeason(result.value.end)).toBe(true);
    }
  });

  it('should validate extended intervals', () => {
    expect(isValid('1984?/2004')).toBe(true);
    expect(isValid('../1985')).toBe(true);
    expect(isValid('1985/..')).toBe(true);
    expect(isValid('/1985')).toBe(true);
    expect(isValid('1985/')).toBe(true);
  });
});

describe('Level 1 - Combined Features', () => {
  it('should parse unspecified with qualification', () => {
    const result = parse('201X?');
    expect(result.success).toBe(true);
    if (result.success && isEDTFDate(result.value)) {
      expect(result.value.year).toBe('201X');
      expect(result.value.qualification?.uncertain).toBe(true);
    }
  });

  it('should parse complex interval', () => {
    const result = parse('1984~/2004-06-11%');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      if (isEDTFDate(result.value.start)) {
        expect(result.value.start.qualification?.approximate).toBe(true);
      }
      if (isEDTFDate(result.value.end)) {
        expect(result.value.end.qualification?.uncertainApproximate).toBe(true);
      }
    }
  });

  it('should parse interval with unspecified dates', () => {
    const result = parse('1984-XX/2004-XX');
    expect(result.success).toBe(true);
    if (result.success && isEDTFInterval(result.value)) {
      if (isEDTFDate(result.value.start)) {
        expect(result.value.start.month).toBe('XX');
      }
      if (isEDTFDate(result.value.end)) {
        expect(result.value.end.month).toBe('XX');
      }
    }
  });
});

describe('Level 1 - Backward Compatibility', () => {
  it('should still parse Level 0 dates', () => {
    expect(isValid('1985-04-12', 1)).toBe(true);
    expect(isValid('1985-04', 1)).toBe(true);
    expect(isValid('1985', 1)).toBe(true);
    expect(isValid('1964/2008', 1)).toBe(true);
  });

  it('should detect level automatically', () => {
    const l0Result = parse('1985-04-12');
    expect(l0Result.success && l0Result.level).toBe(0);

    const l1Result = parse('1985?');
    expect(l1Result.success && l1Result.level).toBe(1);
  });
});

describe('Level 1 - Serialization', () => {
  it('should serialize uncertain date to JSON', () => {
    const result = parse('1984?');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toHaveProperty('qualification');
      expect((json as any).qualification.uncertain).toBe(true);
    }
  });

  it('should serialize unspecified date to JSON', () => {
    const result = parse('201X');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toHaveProperty('unspecified');
    }
  });

  it('should serialize season to JSON', () => {
    const result = parse('2001-21');
    if (result.success) {
      const json = result.value.toJSON();
      expect(json).toHaveProperty('season');
      expect((json as any).season).toBe(21);
    }
  });
});

describe('Level 1 - Error Cases', () => {
  it('should reject invalid season numbers', () => {
    expect(isValid('2001-20')).toBe(false);
    expect(isValid('2001-42')).toBe(false); // Beyond valid range
  });

  it('should reject malformed uncertain dates', () => {
    // Note: '?1984' is actually valid Level 2 (Individual Qualification)
    // so we only reject truly malformed patterns
    expect(isValid('1984??')).toBe(false); // Double qualifier is invalid
  });

  it('should provide helpful error messages', () => {
    const result = parse('2001-42');
    expect(result.success).toBe(false);
    if (!result.success) {
      // 42 is out of range for both months and seasons
      expect(result.errors[0].message.length).toBeGreaterThan(0);
    }
  });
});
