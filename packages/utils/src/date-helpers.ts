/**
 * Date arithmetic helpers for age and birthday calculations.
 * All operations are calendar-based (not fixed-day approximations).
 */

/**
 * Get the number of days in a given month.
 */
export function daysInMonth(year: number, month: number): number {
  // month is 1-indexed (1 = January, 12 = December)
  // new Date(year, month, 0) gives last day of previous month
  // So we use month (not month-1) to get last day of the target month
  return new Date(year, month, 0).getDate();
}

// isLeapYear is exported from validators.ts, import from there if needed

/**
 * Create a date from year, month, day components.
 * Month is 1-indexed (1 = January).
 */
export function createDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/**
 * Extract year, month (1-indexed), day from a Date.
 */
export function getDateComponents(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * Clamp a day to the valid range for a given month.
 * Handles month-end clamping (e.g., Aug 31 - 6 months = Feb 28).
 */
function clampDay(year: number, month: number, day: number): number {
  const maxDay = daysInMonth(year, month);
  return Math.min(day, maxDay);
}

/**
 * Subtract years from a date, handling Feb 29 edge cases.
 * Feb 29 in a leap year becomes Feb 28 if the target year is not a leap year.
 */
export function subtractYears(date: Date, years: number): Date {
  const { year, month, day } = getDateComponents(date);
  const newYear = year - years;
  const newDay = clampDay(newYear, month, day);
  return createDate(newYear, month, newDay);
}

/**
 * Add years to a date, handling Feb 29 edge cases.
 */
export function addYears(date: Date, years: number): Date {
  return subtractYears(date, -years);
}

/**
 * Subtract months from a date, handling month-end clamping.
 * Aug 31 - 6 months = Feb 28 (not Feb 31).
 */
export function subtractMonths(date: Date, months: number): Date {
  const { year, month, day } = getDateComponents(date);

  // Calculate total months from epoch
  let totalMonths = year * 12 + (month - 1) - months;

  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  const newDay = clampDay(newYear, newMonth, day);

  return createDate(newYear, newMonth, newDay);
}

/**
 * Add months to a date, handling month-end clamping.
 */
export function addMonths(date: Date, months: number): Date {
  return subtractMonths(date, -months);
}

/**
 * Subtract weeks from a date.
 */
export function subtractWeeks(date: Date, weeks: number): Date {
  return subtractDays(date, weeks * 7);
}

/**
 * Add weeks to a date.
 */
export function addWeeks(date: Date, weeks: number): Date {
  return subtractWeeks(date, -weeks);
}

/**
 * Subtract days from a date.
 */
export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Add days to a date.
 */
export function addDays(date: Date, days: number): Date {
  return subtractDays(date, -days);
}

/**
 * Calculate age in complete years from birthdate to reference date.
 * Returns integer years (floor).
 */
export function calculateAge(birthdate: Date, referenceDate: Date): number {
  const birth = getDateComponents(birthdate);
  const ref = getDateComponents(referenceDate);

  let age = ref.year - birth.year;

  // Check if birthday hasn't occurred yet this year
  if (ref.month < birth.month || (ref.month === birth.month && ref.day < birth.day)) {
    age--;
  }

  return age;
}

/**
 * Compare two dates by year, month, day (ignoring time).
 * Returns true if date1 is before date2.
 */
export function isBefore(date1: Date, date2: Date): boolean {
  const d1 = getDateComponents(date1);
  const d2 = getDateComponents(date2);

  if (d1.year !== d2.year) return d1.year < d2.year;
  if (d1.month !== d2.month) return d1.month < d2.month;
  return d1.day < d2.day;
}

/**
 * Compare two dates by year, month, day (ignoring time).
 * Returns true if date1 is after date2.
 */
export function isAfter(date1: Date, date2: Date): boolean {
  return isBefore(date2, date1);
}

/**
 * Check if two dates are equal by year, month, day (ignoring time).
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = getDateComponents(date1);
  const d2 = getDateComponents(date2);
  return d1.year === d2.year && d1.month === d2.month && d1.day === d2.day;
}

/**
 * Check if a date (month/day) has already passed in the given reference year.
 * Used to determine birth year from age and birthday.
 */
export function hasBirthdayPassedThisYear(
  birthdayMonth: number,
  birthdayDay: number,
  referenceDate: Date
): boolean {
  const ref = getDateComponents(referenceDate);

  if (birthdayMonth < ref.month) return true;
  if (birthdayMonth > ref.month) return false;
  return birthdayDay <= ref.day;
}

/**
 * Format a date as YYYY-MM-DD string.
 */
export function formatDateISO(date: Date): string {
  const { year, month, day } = getDateComponents(date);
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format a date component with optional uncertainty marker.
 */
export function formatComponent(value: number, digits: number, uncertain: boolean): string {
  const formatted = String(value).padStart(digits, '0');
  return uncertain ? `?${formatted}` : formatted;
}
