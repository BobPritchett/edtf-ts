const fs = require('node:fs');
const path = require('node:path');
const nearley = require('nearley');
const compile = require('nearley/lib/compile');
const generate = require('nearley/lib/generate');
const language = require('nearley/lib/nearley-language-bootstrapped');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'src/generated'), { recursive: true });
for (const code of ['en', 'es', 'fr']) {
  const filename = path.join(root, 'src/languages', code + '.ne');
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(language));
  parser.feed(fs.readFileSync(filename, 'utf8') + '\n');
  const compiled = compile(parser.results[0], {
    args: [filename],
    version: require('nearley/package.json').version,
  });
  compiled.start = 'main';
  // Defer semantic reductions, including primitive helpers, until per-call resolution.
  for (const rule of compiled.rules) {
    if (typeof rule.postprocess === 'string' && rule.postprocess.trim() !== 'id') {
      const fn = rule.postprocess.replace(/^\s*d\s*=>/, '(d, context) =>');
      rule.postprocess = `d => defer(d, (children, context) => (${fn})(children, context))`;
    }
  }
  let js = generate(compiled, 'grammar');
  const imports = [];
  js = js.replace(/const (\{[^}]+\}|lexicon) = require\('([^']+)'\);/g, (_, binding, file) => {
    imports.push(`import ${binding} from '${file.replace(/\.js$/, '')}';`);
    return '';
  });
  js = js.replace('(function () {', 'const compiled = (function () {');
  js = js.replace(
    /if \(typeof module[\s\S]*?\n}\)\(\);?\s*$/,
    'return grammar;\n})();\nexport default compiled;\n'
  );
  fs.writeFileSync(path.join(root, 'src/generated', code + '.js'), imports.join('\n') + '\n' + js);
  fs.writeFileSync(
    path.join(root, 'src/generated', code + '.d.ts'),
    "import type { CompiledRules } from 'nearley';\ndeclare const grammar: CompiledRules;\nexport default grammar;\n"
  );
}
