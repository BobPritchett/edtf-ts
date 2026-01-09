import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'EDTF-TS',
  description: 'Modern TypeScript implementation of Extended Date/Time Format',

  base: '/edtf-ts/',

  ignoreDeadLinks: true, // TODO: Remove when all pages are created

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/edtf-ts/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'EDTF-TS' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/what-is-edtf' },
      { text: 'Playground', link: '/playground' },
      { text: 'API Reference', link: '/api/core' },
      { text: 'Examples', link: '/examples/basic-usage' },
      {
        text: 'v0.1.0',
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/BobPritchett/edtf-ts/blob/main/CHANGELOG.md',
          },
          {
            text: 'Contributing',
            link: 'https://github.com/BobPritchett/edtf-ts/blob/main/CONTRIBUTING.md',
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
            { text: 'Formatting', link: '/guide/formatting' },
            { text: 'Comparison', link: '/guide/comparison' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Search & Discovery', link: '/guide/search-and-discovery' },
          ],
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
          items: [
            { text: 'FuzzyDate (Recommended)', link: '/specs/fuzzy-date-api' },
          ],
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
          ],
        },
      ],
      '/specs/': [
        {
          text: 'Specifications',
          items: [
            { text: 'FuzzyDate API', link: '/specs/fuzzy-date-api' },
          ],
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
