#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const grammarPath = join(__dirname, '../src/grammar.ts');

// Read the generated grammar file
let content = readFileSync(grammarPath, 'utf-8');

// The Nearley grammar is wrapped in an IIFE
// We need to assign the result to a variable and export it

// Remove window.grammar assignment (not compatible with Node.js)
content = content.replace(
  /\s*window\.grammar = grammar;/g,
  ''
);

// Wrap the IIFE and capture its return value
content = content.replace(
  /\(function\s*\(\)\s*{/,
  'var grammar_export = (function() {'
);

// At the end, return the grammar and close the IIFE
content = content.replace(
  /}\s*\)\(\);?\s*$/,
  `
  return grammar;
})();

export default grammar_export;`
);

// Write it back
writeFileSync(grammarPath, content, 'utf-8');

console.log('✓ Added ESM export to grammar.ts');
