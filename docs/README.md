# EDTF-TS Documentation

Documentation site for the EDTF-TS project.

## Development

Use Node.js 24 and the pnpm version pinned in the root `package.json`. Run these commands from the repository root:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm docs:dev

# Build for production
pnpm build

# Preview production build
pnpm docs:preview
```

## Structure

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress configuration
├── guide/                 # User guides
│   ├── what-is-edtf.md
│   ├── getting-started.md
│   ├── why-edtf-ts.md
│   └── ...
├── api/                   # API reference
│   ├── core.md
│   ├── utils.md
│   └── ...
├── examples/              # Examples and tutorials
│   ├── basic-usage.md
│   └── ...
└── index.md              # Homepage
```

## Release notes

Edit the root [CHANGELOG.md](https://github.com/BobPritchett/edtf-ts/blob/main/CHANGELOG.md) when preparing a release. The site's [changelog page](./changelog.md) includes that file, so there is only one copy to maintain. The navigation version comes from `packages/core/package.json`.

## Deployment

The Deploy Documentation workflow builds and deploys to GitHub Pages when documentation, packages, release metadata, or build configuration changes on `main`. It can also be run manually from GitHub Actions. Deployment runs only after package builds, type checks, tests, and the documentation build succeed.

Publishing npm packages is a separate release step and does not generate this changelog automatically.
