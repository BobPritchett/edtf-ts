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
