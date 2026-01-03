/**
 * Proleptic Gregorian calendar calculations.
 *
 * This module handles date arithmetic using the proleptic Gregorian calendar,
 * which extends the Gregorian calendar backwards indefinitely. This allows
 * consistent handling of historical dates before the Gregorian calendar's
 * adoption (1582).
 *
 * Year numbering uses astronomical year numbering:
 * - Year 0 = 1 BC
 * - Year -1 = 2 BC
 * - Year 1 = 1 AD
 */

/**
 * Check if a year is a leap year in the proleptic Gregorian calendar.
 *
 * Rules:
 * - Divisible by 4: leap year
 * - Divisible by 100: not a leap year
 * - Divisible by 400: leap year
 *
 * @param year Astronomical year (0 = 1 BC, -1 = 2 BC)
 */
export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  if (year % 4 === 0) return true;
  return false;
}

/**
 * Get the number of days in a month.
 *
 * @param year Astronomical year
 * @param month Month (1-12)
 */
export function getDaysInMonth(year: number, month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }

  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return daysInMonth[month - 1]!;
}

/**
 * Get the number of days in a year.
 *
 * @param year Astronomical year
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Calculate the number of days since Unix epoch (1970-01-01).
 *
 * This uses the proleptic Gregorian calendar for all dates.
 * Negative values indicate dates before the epoch.
 *
 * Algorithm based on Howard Hinnant's algorithm for date calculations:
 * http://howardhinnant.github.io/date_algorithms.html
 *
 * @param year Astronomical year
 * @param month Month (1-12)
 * @param day Day of month (1-31)
 */
export function daysSinceEpoch(year: number, month: number, day: number): bigint {
  // Validate inputs
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }

  const daysInMonth = getDaysInMonth(year, month);
  if (day < 1 || day > daysInMonth) {
    throw new Error(`Invalid day: ${day} for ${year}-${month}`);
  }

  // Adjust year and month for algorithm (March = month 0)
  let y = year;
  let m = month;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  // Calculate era (400-year cycles) - use Math.floor for integer division
  const era = Math.floor((y >= 0 ? y : y - 399) / 400);
  const yoe = y - era * 400; // year of era (0-399)
  const doy = Math.floor((153 * (m - 3) + 2) / 5) + day - 1; // day of year
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; // day of era

  const daysSince0000 = BigInt(era) * 146_097n + BigInt(doe) - 719_468n;

  // Unix epoch is 1970-01-01, which is 719162 days after 0000-03-01
  // Total offset from 0000-03-01 to 1970-01-01 is 719162 + 306 = 719468
  return daysSince0000;
}

/**
 * Convert astronomical year to historical year notation.
 *
 * - 1 → 1 AD
 * - 0 → 1 BC
 * - -1 → 2 BC
 * - -99 → 100 BC
 *
 * @param year Astronomical year
 * @returns { year, era } where era is 'BC' or 'AD'
 */
export function astronomicalToHistorical(year: number): {
  year: number;
  era: 'BC' | 'AD';
} {
  if (year <= 0) {
    return { year: Math.abs(year) + 1, era: 'BC' };
  }
  return { year, era: 'AD' };
}

/**
 * Convert historical year to astronomical year.
 *
 * - 1 AD → 1
 * - 1 BC → 0
 * - 2 BC → -1
 * - 100 BC → -99
 *
 * @param year Historical year (positive integer)
 * @param era 'BC' or 'AD'
 */
export function historicalToAstronomical(
  year: number,
  era: 'BC' | 'AD'
): number {
  if (era === 'AD') {
    return year;
  }
  // year 1 BC = 0, year 2 BC = -1, etc.
  // Use explicit 0 to avoid -0
  const result = -(year - 1);
  return result === 0 ? 0 : result;
}
