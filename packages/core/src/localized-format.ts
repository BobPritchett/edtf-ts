import { collectionYearGroups } from './collections.js';
import type {
  EDTFBase,
  EDTFDate,
  EDTFDateTime,
  EDTFInterval,
  EDTFSeason,
  EDTFSet,
  EDTFList,
  Qualification,
} from './types/index.js';
import type { FormatOptions } from './formatters.js';

export const messages = {
  es: {
    uncertain: 'incierto',
    approximate: 'aproximado',
    both: 'incierto y aproximado',
    year: 'año',
    month: 'mes',
    day: 'día',
    someDay: 'algún día de',
    someMonth: 'algún mes de',
    sometime: 'en algún momento de',
    unknown: 'desconocido',
    unknownYear: 'año desconocido',
    unknownMonth: 'mes desconocido',
    openStart: 'inicio abierto',
    openEnd: 'fin abierto',
    to: 'a',
    oneOf: 'Una de estas fechas',
    allOf: 'Todas estas fechas',
    earlierPrefix: 'Antes o',
    allEarlierPrefix: 'Antes y',
    earlier: 'o antes',
    later: 'o después',
    allEarlier: 'y antes',
    allLater: 'y después',
    northern: 'hemisferio norte',
    southern: 'hemisferio sur',
    seasons: ['Primavera', 'Verano', 'Otoño', 'Invierno'],
    quarter: 'Trimestre',
    quadrimester: 'Cuatrimestre',
    semester: 'Semestre',
    age: ['año', 'años'],
    birthday: 'cumpleaños',
    born: 'Fecha de nacimiento',
  },
  fr: {
    uncertain: 'incertain',
    approximate: 'approximatif',
    both: 'incertain et approximatif',
    year: 'année',
    month: 'mois',
    day: 'jour',
    someDay: 'un jour de',
    someMonth: 'un mois de',
    sometime: 'à un moment de',
    unknown: 'inconnu',
    unknownYear: 'année inconnue',
    unknownMonth: 'mois inconnu',
    openStart: 'début ouvert',
    openEnd: 'fin ouverte',
    to: 'à',
    oneOf: 'Une de ces dates',
    allOf: 'Toutes ces dates',
    earlierPrefix: 'Plus tôt ou',
    allEarlierPrefix: 'Plus tôt et',
    earlier: 'ou avant',
    later: 'ou après',
    allEarlier: 'et avant',
    allLater: 'et après',
    northern: 'hémisphère nord',
    southern: 'hémisphère sud',
    seasons: ['Printemps', 'Été', 'Automne', 'Hiver'],
    quarter: 'Trimestre',
    quadrimester: 'Quadrimestre',
    semester: 'Semestre',
    age: ['an', 'ans'],
    birthday: 'anniversaire',
    born: 'Date de naissance',
  },
};
export function calendarDateObject(year: number, month = 1, day = 1): Date {
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, day);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}
export function formatLocalized(
  value: EDTFBase,
  options: FormatOptions,
  language: 'es' | 'fr'
): string {
  const msg = messages[language],
    locale = options.locale ?? language;
  const render = (v: EDTFBase) => formatLocalized(v, options, language);
  const qualification = (q?: Qualification) =>
    q?.uncertainApproximate || (q?.uncertain && q?.approximate)
      ? msg.both
      : q?.uncertain
        ? msg.uncertain
        : q?.approximate
          ? msg.approximate
          : '';
  let text: string;
  switch (value.type) {
    case 'Date': {
      const d = value as EDTFDate;
      const displayYear =
        typeof d.year === 'number'
          ? String(d.year <= 0 ? 1 - d.year : d.year)
          : d.year === 'XXXX'
            ? msg.unknownYear
            : d.year;
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'UTC',
        calendar: 'gregory',
        year: 'numeric',
      };
      const hasMonth = typeof d.month === 'number',
        hasDay = typeof d.day === 'number';
      if (hasMonth)
        dateOptions.month =
          options.dateStyle === 'short'
            ? '2-digit'
            : options.dateStyle === 'medium'
              ? 'short'
              : 'long';
      if (hasDay) dateOptions.day = options.dateStyle === 'short' ? '2-digit' : 'numeric';
      if (typeof d.year === 'number' && Math.abs(d.year) <= 270000 && hasMonth) {
        // Render a real calendar date; era markers are added independently below.
        text = new Intl.DateTimeFormat(locale, dateOptions).format(
          calendarDateObject(d.year, d.month as number, hasDay ? (d.day as number) : 1)
        );
      } else {
        text = displayYear;
        if (hasMonth) {
          const monthName = new Intl.DateTimeFormat(locale, {
            month: 'long',
            timeZone: 'UTC',
          }).format(calendarDateObject(2000, d.month as number));
          text = `${hasDay ? d.day + ' ' : ''}${monthName} ${displayYear}`;
        }
      }
      if (typeof d.year === 'string' && /^\d{3}X$/.test(d.year) && d.month === undefined)
        text = (language === 'fr' ? 'Les années ' : 'Los años ') + d.year.slice(0, 3) + '0';
      if (d.year === 'XXXX' && hasMonth) text = text.replace('XXXX', msg.unknownYear);
      if (d.month === 'XX' && hasDay)
        text =
          language === 'es'
            ? `día ${d.day} de ${msg.unknownMonth}, ${d.year === 'XXXX' ? msg.unknownYear : displayYear}`
            : `${d.day === 1 ? '1er' : d.day} d'un ${msg.unknownMonth}, ${d.year === 'XXXX' ? msg.unknownYear : displayYear}`;
      else if (d.month === 'XX' && d.day === 'XX') text = `${msg.sometime} ${displayYear}`;
      else if (d.month === 'XX')
        text = `${hasDay ? msg.day + ' ' + d.day + ', ' : ''}${msg.someMonth} ${displayYear}`;
      else if (d.day === 'XX') text = `${msg.someDay} ${text}`;
      // Preserve partial masks that cannot be expressed as a named calendar component.
      if (typeof d.month === 'string' && d.month !== 'XX') text += ` (${msg.month} ${d.month})`;
      if (typeof d.day === 'string' && d.day !== 'XX') text += ` (${msg.day} ${d.day})`;
      if (
        typeof d.year === 'number' &&
        options.eraDisplay !== 'never' &&
        (d.year <= 0 || options.eraDisplay === 'always')
      ) {
        const before = d.year <= 0;
        const common = options.eraNotation === 'bce-ce';
        const era =
          language === 'es'
            ? common
              ? before
                ? 'a. e. c.'
                : 'e. c.'
              : before
                ? 'a. C.'
                : 'd. C.'
            : common
              ? before
                ? 'avant notre ère'
                : 'de notre ère'
              : before
                ? 'av. J.-C.'
                : 'ap. J.-C.';
        text += ` ${era}`;
      }
      if (options.includeQualifications !== false) {
        const qs = [qualification(d.qualification)];
        for (const key of ['year', 'month', 'day'] as const) {
          const q = qualification(d[`${key}Qualification`]);
          if (q)
            qs.push(
              `${msg[key]} ${language === 'fr' && key === 'year' ? q.replace(/incertain/g, 'incertaine').replace(/approximatif/g, 'approximative') : q}`
            );
        }
        if (qs.some(Boolean)) text += ` (${qs.filter(Boolean).join(', ')})`;
      }
      const digits = d.significantDigitsYear ?? d.significantDigits;
      if (digits !== undefined && /S\d/.test(d.edtf))
        text +=
          language === 'es'
            ? ` (${digits} cifras significativas)`
            : ` (${digits} chiffres significatifs)`;
      return text;
    }
    case 'DateTime': {
      const d = value as EDTFDateTime,
        date = calendarDateObject(d.year, d.month, d.day);
      date.setUTCHours(d.hour, d.minute, d.second);
      return (
        new Intl.DateTimeFormat(locale, {
          dateStyle: options.dateStyle ?? 'long',
          timeStyle: 'medium',
          timeZone: 'UTC',
          calendar: 'gregory',
        }).format(date) + (d.timezone ? ` ${d.timezone}` : '')
      );
    }
    case 'Interval': {
      const interval = value as EDTFInterval;
      text = `${interval.start ? render(interval.start) : interval.openStart ? msg.openStart : msg.unknown} ${msg.to} ${interval.end ? render(interval.end) : interval.openEnd ? msg.openEnd : msg.unknown}`;
      break;
    }
    case 'Season': {
      const season = value as EDTFSeason,
        n = season.season;
      const name =
        n <= 32
          ? `${msg.seasons[(n - 21) % 4]}${n >= 25 ? ` (${n <= 28 ? msg.northern : msg.southern})` : ''}`
          : n <= 36
            ? `${msg.quarter} ${n - 32}`
            : n <= 39
              ? `${msg.quadrimester} ${n - 36}`
              : `${msg.semester} ${n - 39}`;
      text = `${name} ${season.year}`;
      break;
    }
    case 'Set':
    case 'List': {
      const collection = value as EDTFSet | EDTFList,
        all = value.type === 'List';
      const groups = collectionYearGroups(collection);
      const items = groups.map(({ first, last }) =>
        last ? render(first) + ' ' + msg.to + ' ' + render(last) : render(first)
      );
      // An earlier marker refers to the first year, even when it starts a run.
      const earlierPrefix = collection.earlier && groups[0]?.last;
      if (collection.earlier && !earlierPrefix)
        items[0] += ' ' + (all ? msg.allEarlier : msg.earlier);
      if (collection.later) items[items.length - 1] += ' ' + (all ? msg.allLater : msg.later);
      return `${earlierPrefix ? (all ? msg.allEarlierPrefix : msg.earlierPrefix) + ' ' : ''}${all ? msg.allOf : msg.oneOf}: ${new Intl.ListFormat(locale, { type: all ? 'conjunction' : 'disjunction' }).format(items)}`;
    }
    default:
      return value.edtf;
  }
  const q = qualification((value as EDTFSeason).qualification);
  return text + (q && options.includeQualifications !== false ? ` (${q})` : '');
}
