import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  minify: false,
  splitting: false,
  // Bundle moo and nearley into the output since they're CommonJS modules
  // that don't have proper ESM support for browser environments
  noExternal: ['moo', 'nearley'],
});
