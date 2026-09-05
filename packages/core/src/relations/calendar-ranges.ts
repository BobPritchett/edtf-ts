import type { Member, Shape } from '../compare-types/member.js';
import {
  calendarFromEpoch,
  shiftCalendarDate,
  possibleDateBounds,
  type CalendarDate,
} from '../calendar.js';

/**
 * Calendar choices change an Allen inequality only at an endpoint of the other
 * value. Test the containing calendar unit and its neighbors at each endpoint.
 * Exterior witnesses retain the unbounded choices without enumerating a tail.
 */
export function calendarWitnesses(member: Member, shapes: Shape[]): Member[] {
  const range = member.calendarRange;
  if (!range) return [member];
  const seeds: bigint[] = [];
  for (const shape of shapes)
    for (const m of shape.members) {
      for (const bound of [m.sMin, m.sMax, m.eMin, m.eMax]) if (bound !== null) seeds.push(bound);
    }
  const years = seeds.map((s) => calendarFromEpoch(s).year);
  const exterior = [Math.min(...years) - 400, Math.max(...years) + 400];
  seeds.push(...exterior.map((year) => possibleDateBounds(year)!.minMs));
  const results = new Map<string, Member>();
  for (const seed of seeds) {
    const date = calendarFromEpoch(seed);
    const base: CalendarDate = {
      year: date.year,
      ...(range.anchor.month === undefined ? {} : { month: date.month }),
      ...(range.anchor.day === undefined ? {} : { day: date.day }),
    };
    for (const value of [shiftCalendarDate(base, -1), base, shiftCalendarDate(base, 1)]) {
      const bounds = possibleDateBounds(value.year, value.month, value.day)!;
      const anchorBounds = possibleDateBounds(
        range.anchor.year,
        range.anchor.month,
        range.anchor.day
      )!;
      if (
        range.direction === 'earlier'
          ? bounds.minMs > anchorBounds.minMs
          : bounds.minMs < anchorBounds.minMs
      )
        continue;
      results.set(String(bounds.minMs), {
        sMin: bounds.minMs,
        sMax: bounds.minMs,
        eMin: bounds.maxMs,
        eMax: bounds.maxMs,
        startKind: 'closed',
        endKind: 'closed',
        precision: member.precision,
        qualifiers: member.qualifiers,
      });
    }
  }
  return [...results.values()];
}
