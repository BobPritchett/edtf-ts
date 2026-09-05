// Run after clean builds of core and natural. No browser globals or Node polyfills are needed by the bundle.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const { buildSync } = createRequire(require.resolve('tsup'))('esbuild');
const root = path.resolve(__dirname, '../../..');
const fixtures = require('../tests/fixtures/languages.json');
async function main() {
  let count = 0;
  for (const suffix of ['js', 'cjs'])
    for (const language of ['en', 'es', 'fr']) {
      const filename = path.resolve(__dirname, `../dist/${language}.${suffix}`);
      const api = suffix === 'js' ? await import(pathToFileURL(filename).href) : require(filename);
      const locale = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR' }[language];
      for (const f of fixtures) {
        const run = () =>
          f.age
            ? [api.parseAgeBirthday(f[language], { locale, currentDate: new Date(2025, 5, 1) })]
            : api.parseNatural(f[language], { locale });
        if (f.reject) assert.throws(run);
        else
          assert.deepEqual(
            run().map((r) => r.edtf),
            f.expected,
            language + ': ' + f.id
          );
        count++;
      }
    }
  // Compile an actual browser bundle from the published ESM entry point.
  const out = path.join(root, '.tmp-browser');
  fs.mkdirSync(out, { recursive: true });
  const browserSource = `import { parseNatural, parseAgeBirthday } from './packages/natural/dist/index.js';
const fixtures=${JSON.stringify(fixtures)};
let count=0;
try {
  for(const lang of ['en','es','fr']) for(const f of fixtures) {
    const locale={en:'en-GB',es:'es-ES',fr:'fr-FR'}[lang];
    let result,thrown=false;
    try { result=f.age ? [parseAgeBirthday(f[lang],{locale,currentDate:new Date(2025,5,1)})] : parseNatural(f[lang],{locale}); } catch(error) { if(!f.reject) throw error; thrown=true; }
    if(f.reject !== undefined ? !thrown : JSON.stringify(result.map(r=>r.edtf)) !== JSON.stringify(f.expected)) throw new Error(lang+': '+f.id);
    count++;
  }
  document.body.textContent='PASS: '+count+' browser language-contract cases';
} catch(error) { document.body.textContent='FAIL: '+error.message; throw error; }
`;
  buildSync({
    stdin: { contents: browserSource, resolveDir: root },
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    outfile: path.join(out, 'browser.js'),
  });
  fs.writeFileSync(
    path.join(out, 'index.html'),
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>EDTF browser validation</title><body>Running browser tests…<script type="module" src="./browser.js"></script></body></html>'
  );
  console.log(`PASS: ${count} ESM/CJS package cases. Browser bundle: ${out}`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
