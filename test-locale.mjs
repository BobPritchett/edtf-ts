import { parse } from './packages/core/dist/index.js';
import { formatHuman } from './packages/utils/dist/index.js';

console.log('\n=== Testing Localized Month Names ===\n');

const testDate = parse('1985-04-12');
if (!testDate.success) {
  console.error('Failed to parse test date');
  process.exit(1);
}

const locales = [
  { locale: 'en-US', name: 'English (US)' },
  { locale: 'es-ES', name: 'Spanish (Spain)' },
  { locale: 'fr-FR', name: 'French (France)' },
  { locale: 'de-DE', name: 'German (Germany)' },
  { locale: 'ja-JP', name: 'Japanese (Japan)' },
];

const dateStyles = ['full', 'long', 'medium', 'short'];

for (const { locale, name } of locales) {
  console.log(`\n${name} (${locale}):`);
  for (const dateStyle of dateStyles) {
    const formatted = formatHuman(testDate.value, { locale, dateStyle });
    console.log(`  ${dateStyle.padEnd(6)}: ${formatted}`);
  }
}

// Test month-only format
console.log('\n=== Testing Month-Only Format ===\n');
const monthOnly = parse('1985-04');
if (monthOnly.success) {
  for (const { locale, name } of locales) {
    console.log(`${name} (${locale}):`);
    for (const dateStyle of dateStyles) {
      const formatted = formatHuman(monthOnly.value, { locale, dateStyle });
      console.log(`  ${dateStyle.padEnd(6)}: ${formatted}`);
    }
    console.log();
  }
}
