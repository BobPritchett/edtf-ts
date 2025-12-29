# EDTF-TS Documentation

Documentation site for the EDTF-TS project.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
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

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Deployment

The documentation site is automatically deployed to GitHub Pages on every push to the main branch.

Alternatively, you can deploy manually:

```bash
# Build
pnpm build

# Deploy to GitHub Pages
# (Requires gh-pages package and proper permissions)
```
