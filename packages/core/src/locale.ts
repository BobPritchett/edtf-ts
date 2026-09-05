export type Language = 'en' | 'es' | 'fr';
export type DateOrder = 'MDY' | 'DMY' | 'YMD';
export function resolveLanguage(locale = 'en-US', language?: Language): Language {
  const selected = language ?? new Intl.Locale(locale).language;
  if (selected !== 'en' && selected !== 'es' && selected !== 'fr')
    throw new RangeError(`Unsupported language: ${selected}. Supported languages: en, es, fr`);
  return selected;
}
export function resolveDateOrder(locale = 'en-US', override?: DateOrder): DateOrder {
  if (override) return override;
  const parts = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  }).formatToParts(new Date('2006-11-23T00:00:00Z'));
  const order = parts
    .filter((p) => ['year', 'month', 'day'].includes(p.type))
    .map((p) => p.type[0]!.toUpperCase())
    .join('');
  return order === 'MDY' || order === 'YMD' ? order : 'DMY';
}
