import { defineConfig } from 'vitepress';
import { version } from '../../packages/core/package.json';

export default defineConfig({
  title: 'EDTF-TS',
  description: 'Modern TypeScript implementation of Extended Date/Time Format',

  base: '/edtf-ts/',

  head: [
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'EDTF-TS' }],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/what-is-edtf' },
      { text: 'Playground', link: '/playground' },
      { text: 'API Reference', link: '/api/core' },
      { text: 'Examples', link: '/examples/basic-usage' },
      {
        text: `v${version}`,
        items: [
          {
            text: 'Changelog',
            link: '/changelog',
          },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is EDTF?', link: '/guide/what-is-edtf' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why EDTF-TS?', link: '/guide/why-edtf-ts' },
          ],
        },
        {
          text: 'Working with Dates',
          items: [
            { text: 'Parsing', link: '/guide/parsing' },
            { text: 'Interoperability and Policies', link: '/guide/interoperability' },
            { text: 'Natural Parsing Outcomes', link: '/guide/parsing-policies' },
            { text: 'Formatting', link: '/guide/formatting' },
            { text: 'Comparison', link: '/guide/comparison' },
            { text: 'Migrating to 0.6.0', link: '/guide/semantics-migration' },
            { text: 'Tested Language Examples', link: '/guide/language-examples' },
            { text: 'Locales and Bundle Sizes', link: '/guide/locales-and-bundles' },
            { text: 'Compatibility Review', link: '/guide/compatibility-review' },
          ],
        },
        {
          text: 'Advanced',
          items: [{ text: 'Search & Discovery', link: '/guide/search-and-discovery' }],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: '@edtf-ts/core', link: '/api/core' },
            { text: '@edtf-ts/natural', link: '/api/natural' },
          ],
        },
        {
          text: 'FuzzyDate API',
          items: [{ text: 'FuzzyDate (Recommended)', link: '/specs/fuzzy-date-api' }],
        },
        {
          text: 'Core Types (Functional)',
          items: [
            { text: 'EDTFDate', link: '/api/types/date' },
            { text: 'EDTFDateTime', link: '/api/types/datetime' },
            { text: 'EDTFInterval', link: '/api/types/interval' },
            { text: 'EDTFSeason', link: '/api/types/season' },
            { text: 'EDTFSet', link: '/api/types/set' },
            { text: 'EDTFList', link: '/api/types/list' },
            { text: 'Member (Four-Bound)', link: '/api/types/member' },
          ],
        },
        {
          text: 'Utilities',
          items: [
            { text: 'Validators', link: '/api/validators' },
            { text: 'Formatters', link: '/api/formatters' },
            { text: 'Comparators', link: '/api/comparators' },
            { text: 'Canonicalization and Operations', link: '/api/operations' },
          ],
        },
      ],
      '/specs/': [
        {
          text: 'Specifications',
          items: [{ text: 'FuzzyDate API', link: '/specs/fuzzy-date-api' }],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [{ text: 'Basic Usage', link: '/examples/basic-usage' }],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/BobPritchett/edtf-ts' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@edtf-ts/core' },
    ],

    editLink: {
      pattern: 'https://github.com/BobPritchett/edtf-ts/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2025 Bob Pritchett',
    },

    search: {
      provider: 'local',
    },
  },
});
