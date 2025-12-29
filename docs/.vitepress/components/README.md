# VitePress Components

Custom Vue components for the EDTF-TS documentation site.

## EDTFPlayground.vue

Interactive playground component that allows users to:
- Parse EDTF strings in real-time
- Select from predefined examples
- View parsed results with full details
- See JSON output
- Explore all EDTF levels (0, 1, 2)

### Features

- **Real-time parsing**: Updates as you type
- **Example buttons**: Quick access to common EDTF patterns
- **Detailed output**: Shows all parsed properties
- **Error handling**: Displays helpful error messages
- **Responsive design**: Works on mobile and desktop
- **Dark mode support**: Follows VitePress theme

### Usage in Markdown

```md
<EDTFPlayground />
```

The component is globally registered in `.vitepress/theme/index.ts`.

### Dependencies

- `@edtf-ts/core` - For parsing EDTF strings
- Vue 3 - Component framework (from VitePress)

### Styling

The component uses VitePress CSS variables for theming:
- `--vp-c-brand` - Primary color
- `--vp-c-bg` - Background color
- `--vp-c-text-1` - Primary text
- `--vp-c-divider` - Borders
- etc.

Custom styles are in `.vitepress/theme/custom.css`.
