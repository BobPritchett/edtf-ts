const fs = require('node:fs');
const path = require('node:path');
const fixtures = require('../tests/fixtures/languages.json');
const root = path.resolve(__dirname, '../../..');
const header =
  '# Tested language examples\n\nGenerated from `packages/natural/tests/fixtures/languages.json` by `node packages/natural/scripts/generate-examples.cjs`. The English suite uses `en-GB`; Spanish uses `es-ES`; French uses `fr-FR`. Age examples use June 1, 2025. Alternative outputs are listed in confidence order.\n\n| Feature | English | Español | Français | EDTF |\n|---|---|---|---|---|\n';
const rows = fixtures
  .map(
    (f) =>
      `| ${f.id} | ${f.en} | ${f.es} | ${f.fr} | ${f.reject ? 'Rejected' : f.expected.map((s) => '`' + s + '`').join('; ')} |`
  )
  .join('\n');
fs.writeFileSync(path.join(root, 'docs/guide/language-examples.md'), header + rows + '\n');

// The playground buttons use the same phrases as the language contract suites.
const features = {
  natural: [
    'date.full',
    'date.knownDayUnknownMonth',
    'interval.monthSeason',
    'qualifier.approximate',
    'numeric.qualified',
    'boundary.before',
    'boundary.inclusiveAfter',
    'boundary.pre',
    'boundary.post',
    'interval.since',
    'interval.sharedDays',
    'set.sharedDays',
    'interval.crossYear',
    'set.finiteRange',
    'period.century',
    'season.north',
    'season.south',
  ],
  age: [
    'age.exact',
    'age.range',
    'age.birthday',
    'age.birthdayMonth',
    'birthday.only',
    'age.bornConstraint',
    'age.months',
  ],
};
const examples = Object.fromEntries(
  Object.entries(features).map(([group, ids]) => [
    group,
    ids.map((id) => {
      const fixture = fixtures.find((f) => f.id === id);
      if (!fixture || fixture.reject) throw new Error(`Missing valid playground fixture: ${id}`);
      return { id, en: fixture.en, es: fixture.es, fr: fixture.fr };
    }),
  ])
);
const examplesDirectory = path.join(root, 'docs/.vitepress/data');
fs.mkdirSync(examplesDirectory, { recursive: true });
fs.writeFileSync(
  path.join(examplesDirectory, 'playground-examples.json'),
  JSON.stringify(examples, null, 2) + '\n'
);
