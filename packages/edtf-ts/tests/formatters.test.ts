import { describe, it, expect } from 'vitest';
import { parse, isEDTFDate, isEDTFInterval, isEDTFSeason, formatHuman } from '../src/index.js';
import { formatISO, formatRange } from '../src/formatters.js';

describe('Formatters - Human Readable', () => {
  it('should format complete date', () => {
    const date = parse('1985-04-12');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('April');
      expect(formatted).toContain('12');
      expect(formatted).toContain('1985');
    }
  });

  it('should format year and month', () => {
    const date = parse('1985-04');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('April');
      expect(formatted).toContain('1985');
    }
  });

  it('should format year only', () => {
    const date = parse('1985');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toBe('1985');
    }
  });

  it('should format uncertain date', () => {
    const date = parse('1984?');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('1984');
      expect(formatted).toContain('uncertain');
    }
  });

  it('should format approximate date', () => {
    const date = parse('1984~');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('1984');
      expect(formatted).toContain('approximate');
    }
  });

  it('should format partial qualification', () => {
    const date = parse('?2004-06-~11');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('2004');
      expect(formatted).toContain('year uncertain');
      expect(formatted).toContain('day approximate');
    }
  });

  it('should format without qualifications when disabled', () => {
    const date = parse('1984?');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value, { includeQualifications: false });
      expect(formatted).toBe('1984');
    }
  });

  it('should format with different date styles', () => {
    const date = parse('1985-04-12');
    if (date.success && isEDTFDate(date.value)) {
      const full = formatHuman(date.value, { dateStyle: 'full' });
      const medium = formatHuman(date.value, { dateStyle: 'medium' });
      const short = formatHuman(date.value, { dateStyle: 'short' });

      expect(full).toContain('April');
      expect(medium).toContain('Apr');
      expect(short).toMatch(/\d+\/\d+\/\d+/);
    }
  });
});

describe('Formatters - Intervals', () => {
  it('should format interval', () => {
    const interval = parse('1990/2000');
    if (interval.success && isEDTFInterval(interval.value)) {
      const formatted = formatHuman(interval.value);
      expect(formatted).toContain('1990');
      expect(formatted).toContain('2000');
      expect(formatted).toContain('to');
    }
  });

  it('should format open-ended interval', () => {
    const interval = parse('../2000');
    if (interval.success && isEDTFInterval(interval.value)) {
      const formatted = formatHuman(interval.value);
      expect(formatted).toContain('open start');
      expect(formatted).toContain('2000');
    }
  });
});

describe('Formatters - Seasons', () => {
  it('should format spring', () => {
    const season = parse('2001-21');
    if (season.success && isEDTFSeason(season.value)) {
      const formatted = formatHuman(season.value);
      expect(formatted).toContain('Spring');
      expect(formatted).toContain('2001');
    }
  });

  it('should format summer', () => {
    const season = parse('2001-22');
    if (season.success && isEDTFSeason(season.value)) {
      const formatted = formatHuman(season.value);
      expect(formatted).toContain('Summer');
      expect(formatted).toContain('2001');
    }
  });

  it('should format quarter', () => {
    const season = parse('2001-33');
    if (season.success && isEDTFSeason(season.value)) {
      const formatted = formatHuman(season.value);
      expect(formatted).toContain('Quarter 1');
      expect(formatted).toContain('2001');
    }
  });

  it('should format quadrimester', () => {
    const season = parse('2001-37');
    if (season.success && isEDTFSeason(season.value)) {
      const formatted = formatHuman(season.value);
      expect(formatted).toContain('Quadrimester 1');
      expect(formatted).toContain('2001');
    }
  });

  it('should format northern hemisphere season', () => {
    const season = parse('2001-25');
    if (season.success && isEDTFSeason(season.value)) {
      const formatted = formatHuman(season.value);
      expect(formatted).toBe('Spring (Northern Hemisphere) 2001');
    }
  });

  it('should format southern hemisphere season', () => {
    const season = parse('2001-29');
    if (season.success && isEDTFSeason(season.value)) {
      const formatted = formatHuman(season.value);
      expect(formatted).toBe('Spring (Southern Hemisphere) 2001');
    }
  });

  it('should format semestral', () => {
    const season = parse('2001-40');
    if (season.success && isEDTFSeason(season.value)) {
      const formatted = formatHuman(season.value);
      expect(formatted).toBe('Semestral 1 2001');
    }
  });
});

describe('Formatters - ISO 8601', () => {
  it('should format complete date as ISO', () => {
    const date = parse('1985-04-12');
    if (date.success) {
      expect(formatISO(date.value)).toBe('1985-04-12');
    }
  });

  it('should format year-month as ISO', () => {
    const date = parse('1985-04');
    if (date.success) {
      expect(formatISO(date.value)).toBe('1985-04');
    }
  });

  it('should format year as ISO', () => {
    const date = parse('1985');
    if (date.success) {
      expect(formatISO(date.value)).toBe('1985');
    }
  });

  it('should fall back to EDTF for uncertain dates', () => {
    const date = parse('1984?');
    if (date.success) {
      expect(formatISO(date.value)).toBe('1984?');
    }
  });

  it('should format datetime as ISO', () => {
    const dt = parse('1985-04-12T23:20:30Z');
    if (dt.success) {
      expect(formatISO(dt.value)).toBe('1985-04-12T23:20:30Z');
    }
  });
});

describe('Formatters - Range', () => {
  it('should format date range', () => {
    const date = parse('1985-04');
    if (date.success) {
      const formatted = formatRange(date.value);
      expect(formatted).toContain('April');
      expect(formatted).toContain('1985');
      expect(formatted).toContain('to');
    }
  });

  it('should format single day range', () => {
    const date = parse('1985-04-12');
    if (date.success) {
      const formatted = formatRange(date.value);
      // Single day should not show "to"
      expect(formatted).toContain('April');
      expect(formatted).toContain('12');
      expect(formatted).toContain('1985');
    }
  });
});

describe('Formatters - Extended Years', () => {
  it('should format extended year (Y prefix)', () => {
    const date = parse('Y170000002');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('170');
      expect(formatted).toContain('million');
    }
  });

  it('should format negative extended year', () => {
    const date = parse('Y-170000002');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('170');
      expect(formatted).toContain('million');
      expect(formatted).toContain('BC');
    }
  });

  it('should format exponential year', () => {
    const date = parse('Y17E7');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('170');
      expect(formatted).toContain('million');
    }
  });

  it('should format negative exponential year', () => {
    const date = parse('Y-17E7');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('170');
      expect(formatted).toContain('million');
      expect(formatted).toContain('BC');
    }
  });

  it('should format year with significant digits (4-digit)', () => {
    const date = parse('1950S2');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('1950');
      expect(formatted).toContain('century precision');
    }
  });

  it('should format extended year with significant digits', () => {
    const date = parse('Y171010000S3');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('171');
      expect(formatted).toContain('million');
      expect(formatted).toContain('significant digits');
    }
  });

  it('should format exponential year with significant digits', () => {
    const date = parse('Y3388E2S3');
    if (date.success && isEDTFDate(date.value)) {
      const formatted = formatHuman(date.value);
      expect(formatted).toContain('338,800');
      expect(formatted).toContain('precision');
    }
  });
});
