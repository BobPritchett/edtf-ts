// Run after building core and natural. Measures a real minified browser consumer,
// including core and the parser runtime; source maps and declarations are excluded.
const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { createRequire } = require('node:module');
const { buildSync } = createRequire(require.resolve('tsup'))('esbuild');

const root = path.resolve(__dirname, '..');
const size = (buffer) => ({
  bytes: buffer.length,
  gzipBytes: gzipSync(buffer, { level: 9 }).length,
});
const entries = [
  ['core', '@edtf-ts/core', 'parse', '../core/dist/index.js'],
  ['all', '@edtf-ts/natural', 'parseNatural', 'dist/index.js'],
  ...['en', 'es', 'fr'].map((language) => [
    language,
    `@edtf-ts/natural/${language}`,
    'parseNatural',
    `dist/${language}.js`,
  ]),
];
const report = entries.map(([entry, specifier, api, file]) => {
  const result = buildSync({
    stdin: { contents: `export { ${api} } from '${specifier}';`, resolveDir: root },
    bundle: true,
    minify: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    write: false,
    logLevel: 'silent',
  });
  return {
    entry,
    esm: size(fs.readFileSync(path.resolve(root, file))),
    browser: size(result.outputFiles[0].contents),
  };
});
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  const kib = (bytes) => (bytes / 1024).toFixed(1) + ' KiB';
  console.table(
    report.map(({ entry, esm, browser }) => ({
      entry,
      'Built ESM': kib(esm.bytes),
      'Browser minified': kib(browser.bytes),
      'Browser gzip': kib(browser.gzipBytes),
    }))
  );
  console.log(
    'Browser sizes include core and the parser runtime. Natural ESM files exclude external core.'
  );
  console.log('Gzip level 9; actual application bundles and server compression will vary.');
}
