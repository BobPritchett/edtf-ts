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

  // Integer arithmetic keeps long-year bounds exact, including negative era division.
  let y = BigInt(year),
    m = BigInt(month);
  if (m <= 2n) {
    y--;
    m += 12n;
  }
  const era = y / 400n - (y % 400n < 0n ? 1n : 0n);
  const yoe = y - era * 400n;
  const doy = (153n * (m - 3n) + 2n) / 5n + BigInt(day) - 1n;
  const doe = yoe * 365n + yoe / 4n - yoe / 100n + doy;
  return era * 146097n + doe - 719468n;
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
export function historicalToAstronomical(year: number, era: 'BC' | 'AD'): number {
  if (era === 'AD') {
    return year;
  }
  // year 1 BC = 0, year 2 BC = -1, etc.
  // Use explicit 0 to avoid -0
  const result = -(year - 1);
  return result === 0 ? 0 : result;
}
