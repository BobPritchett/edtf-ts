import { dateToEpochMs } from './normalization/epoch.js';
import { getDaysInMonth } from './compare-utils/calendar.js';

export interface CalendarDate {
  year: number;
  month?: number;
  day?: number;
}

/** Inverse of the Gregorian epoch conversion, including negative epochs. */
export function calendarFromEpoch(ms: bigint): Required<CalendarDate> {
  const floor = (a: bigint, b: bigint) => a / b - (a % b < 0n ? 1n : 0n);
  const z = floor(ms, 86400000n) + 719468n;
  const era = floor(z, 146097n),
    doe = z - era * 146097n;
  const yoe = (doe - doe / 1460n + doe / 36524n - doe / 146096n) / 365n;
  let year = yoe + era * 400n;
  const doy = doe - (365n * yoe + yoe / 4n - yoe / 100n);
  const mp = (5n * doy + 2n) / 153n;
  const day = doy - (153n * mp + 2n) / 5n + 1n;
  const month = mp + (mp < 10n ? 3n : -9n);
  if (month <= 2n) year++;
  return { year: Number(year), month: Number(month), day: Number(day) };
}

export function formatYear(year: number): string {
  const digits = String(Math.abs(year)).padStart(4, '0');
  return (Math.abs(year) > 9999 ? 'Y' : '') + (year < 0 ? '-' : '') + digits;
}

export function formatCalendarDate(date: CalendarDate): string {
  return (
    formatYear(date.year) +
    (date.month === undefined ? '' : '-' + String(date.month).padStart(2, '0')) +
    (date.day === undefined ? '' : '-' + String(date.day).padStart(2, '0'))
  );
}

/** Move by one unit at the date's precision, without Date's year/DST rules. */
export function shiftCalendarDate(date: CalendarDate, direction: -1 | 1): CalendarDate {
  let { year, month, day } = date;
  if (month === undefined) return { year: year + direction };
  if (day !== undefined) {
    day += direction;
    if (day >= 1 && day <= getDaysInMonth(year, month)) return { year, month, day };
  }
  month += direction;
  if (month === 0) {
    month = 12;
    year--;
  }
  if (month === 13) {
    month = 1;
    year++;
  }
  if (day !== undefined) day = direction > 0 ? 1 : getDaysInMonth(year, month);
  return { year, month, ...(day === undefined ? {} : { day }) };
}

function matches(pattern: number | string | undefined, n: number, width: number): boolean {
  if (pattern === undefined) return true;
  if (typeof pattern === 'number') return pattern === n;
  const digits = String(Math.abs(n)).padStart(width, '0');
  return pattern
    .replace('-', '')
    .split('')
    .every((c, i) => c === 'X' || c === digits[i]);
}

/** First and last possible calendar dates. Invalid combinations are never clamped. */
export function possibleDateBounds(
  year: number | string,
  month?: number | string,
  day?: number | string
) {
  const years =
    typeof year === 'number'
      ? [year]
      : Array.from({ length: 10000 }, (_, n) => (year.startsWith('-') ? -n : n))
          .filter((n) => matches(year, n, 4))
          .sort((a, b) => a - b);
  function endpoint(reverse: boolean): CalendarDate | undefined {
    for (const y of reverse ? [...years].reverse() : years) {
      for (let i = 0; i < 12; i++) {
        const m = reverse ? 12 - i : i + 1;
        if (!matches(month, m, 2)) continue;
        const last = getDaysInMonth(y, m);
        for (let j = 0; j < last; j++) {
          const d = reverse ? last - j : j + 1;
          if (matches(day, d, 2)) return { year: y, month: m, day: d };
        }
      }
    }
    return undefined;
  }
  const first = endpoint(false),
    last = endpoint(true);
  if (!first || !last) return undefined;
  return {
    first,
    last,
    minMs: dateToEpochMs({ year: first.year, month: first.month!, day: first.day! }),
    maxMs: dateToEpochMs({
      year: last.year,
      month: last.month!,
      day: last.day!,
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    }),
  };
}
