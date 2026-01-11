# Claude Code Rules for edtf-ts

## Build Requirements

### After Grammar or Parser Changes

When modifying the grammar (`packages/natural/src/grammar.ne`) or parser files (`packages/natural/src/parser.ts`, `packages/core/src/parser/**`):

1. **Compile the grammar** (if grammar.ne was changed):
   ```bash
   cd packages/natural && npm run build:grammar
   ```

2. **Build all packages** to update the playground and ensure changes are reflected:
   ```bash
   pnpm run build
   ```
   This builds `@edtf-ts/core`, `@edtf-ts/natural`, and the docs (including the playground).

3. **Run tests** to verify changes:
   ```bash
   pnpm run test
   ```

The docs/playground uses the built packages via workspace dependencies. If the dev server is running (`pnpm docs:dev`), it may need to be restarted to pick up rebuilt packages.

## Project Structure

- `packages/core` - Core EDTF parser (parses EDTF strings to objects)
- `packages/natural` - Natural language parser (parses human-readable dates to EDTF)
  - `src/grammar.ne` - Nearley grammar file (compiles to `src/grammar.ts`)
  - `src/parser.ts` - Parser entry point and post-processing
- `docs/` - VitePress documentation site with interactive playground

## Testing

- Run all tests: `pnpm run test`
- Run natural package tests: `cd packages/natural && npm test`
- Run core package tests: `cd packages/core && npm test`

## Common Commands

```bash
# Build everything
pnpm run build

# Build just the grammar
cd packages/natural && npm run build:grammar

# Run docs dev server
pnpm docs:dev

# Build docs for production
pnpm docs:build

# Preview built docs
pnpm docs:preview
```

## Publishing to npm

**IMPORTANT: Always use `pnpm publish`, never `npm publish`.**

This is a pnpm workspace monorepo. The `@edtf-ts/natural` package depends on `@edtf-ts/core` using `workspace:*` protocol. Only `pnpm publish` correctly converts this to an actual version number. Using `npm publish` will publish the literal `workspace:*` string, breaking the package for consumers.

### Release Process

1. Update version in both `packages/core/package.json` and `packages/natural/package.json`

2. Build and test:
   ```bash
   pnpm run build
   pnpm run test
   ```

3. Commit and tag:
   ```bash
   git add packages/core/package.json packages/natural/package.json
   git commit -m "chore: bump version to X.Y.Z"
   git tag vX.Y.Z
   git push origin main
   git push origin vX.Y.Z
   ```

4. Publish (core first, then natural):
   ```bash
   cd packages/core && pnpm publish --access public
   cd ../natural && pnpm publish --access public
   ```
