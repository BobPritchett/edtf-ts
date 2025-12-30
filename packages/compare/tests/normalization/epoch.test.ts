import { describe, it, expect } from 'vitest';
import {
  dateToEpochMs,
  epochMsToDate,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from '../../src/normalization/epoch.js';

describe('epoch conversion', () => {
  describe('dateToEpochMs', () => {
    it('converts Unix epoch correctly', () => {
      const result = dateToEpochMs({ year: 1970, month: 1, day: 1 });
      expect(result).toBe(0n);
    });

    it('converts known dates correctly', () => {
      // 1985-04-12 00:00:00.000
      const result = dateToEpochMs({ year: 1985, month: 4, day: 12 });
      expect(result).toBe(482_112_000_000n);
    });

    it('includes time components', () => {
      const result = dateToEpochMs({
        year: 1985,
        month: 4,
        day: 12,
        hour: 10,
        minute: 30,
        second: 45,
        millisecond: 500,
      });

      // Should be 482112000000 + (10*3600 + 30*60 + 45)*1000 + 500
      expect(result).toBe(482_149_845_500n);
    });

    it('handles BC dates', () => {
      // Year 0 = 1 BC
      const result = dateToEpochMs({ year: 0, month: 1, day: 1 });
      expect(result).toBe(-62_167_219_200_000n);
    });

    it('throws on invalid time components', () => {
      expect(() =>
        dateToEpochMs({ year: 2024, month: 1, day: 1, hour: 24 })
      ).toThrow('Invalid hour');

      expect(() =>
        dateToEpochMs({ year: 2024, month: 1, day: 1, minute: 60 })
      ).toThrow('Invalid minute');

      expect(() =>
        dateToEpochMs({ year: 2024, month: 1, day: 1, second: 60 })
      ).toThrow('Invalid second');

      expect(() =>
        dateToEpochMs({ year: 2024, month: 1, day: 1, millisecond: 1000 })
      ).toThrow('Invalid millisecond');
    });
  });

  describe('epochMsToDate', () => {
    it('converts epoch 0 correctly', () => {
      const result = epochMsToDate(0n);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(0);
    });

    it('converts known dates correctly', () => {
      const result = epochMsToDate(482_112_000_000n);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe('1985-04-12T00:00:00.000Z');
    });

    it('returns null for extreme values', () => {
      const tooSmall = epochMsToDate(-9_000_000_000_000_000n);
      expect(tooSmall).toBeNull();

      const tooLarge = epochMsToDate(9_000_000_000_000_000n);
      expect(tooLarge).toBeNull();
    });
  });

  describe('startOfDay / endOfDay', () => {
    it('calculates start and end of day correctly', () => {
      const start = startOfDay(1985, 4, 12);
      const end = endOfDay(1985, 4, 12);

      // Difference should be 86,399,999 milliseconds (23:59:59.999)
      expect(end - start).toBe(86_399_999n);

      // Start should be at 00:00:00.000
      expect(start).toBe(482_112_000_000n);

      // End should be at 23:59:59.999
      expect(end).toBe(482_198_399_999n);
    });
  });

  describe('startOfMonth / endOfMonth', () => {
    it('calculates start and end of month correctly', async () => {
      // April 1985 (30 days)
      const start = startOfMonth(1985, 4);
      const end = await endOfMonth(1985, 4);

      // Should span entire month
      expect(start).toBe(dateToEpochMs({ year: 1985, month: 4, day: 1 }));
      expect(end).toBe(
        dateToEpochMs({ year: 1985, month: 4, day: 30, hour: 23, minute: 59, second: 59, millisecond: 999 })
      );
    });

    it('handles February in leap years', async () => {
      const start = startOfMonth(2024, 2);
      const end = await endOfMonth(2024, 2);

      // February 2024 has 29 days
      expect(end).toBe(
        dateToEpochMs({ year: 2024, month: 2, day: 29, hour: 23, minute: 59, second: 59, millisecond: 999 })
      );
    });
  });

  describe('startOfYear / endOfYear', () => {
    it('calculates start and end of year correctly', () => {
      const start = startOfYear(1985);
      const end = endOfYear(1985);

      expect(start).toBe(dateToEpochMs({ year: 1985, month: 1, day: 1 }));
      expect(end).toBe(
        dateToEpochMs({ year: 1985, month: 12, day: 31, hour: 23, minute: 59, second: 59, millisecond: 999 })
      );
    });
  });
});
