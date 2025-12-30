import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'EDTF-TS',
  description: 'Modern TypeScript implementation of Extended Date/Time Format',

  base: '/edtf-ts/',

  ignoreDeadLinks: true,  // TODO: Remove when all pages are created

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
          { text: 'Changelog', link: 'https://github.com/yourusername/edtf-ts/blob/main/CHANGELOG.md' },
          { text: 'Contributing', link: 'https://github.com/yourusername/edtf-ts/blob/main/CONTRIBUTING.md' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is EDTF?', link: '/guide/what-is-edtf' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why EDTF-TS?', link: '/guide/why-edtf-ts' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'EDTF Levels', link: '/guide/edtf-levels' },
            { text: 'Date Types', link: '/guide/date-types' },
            { text: 'Uncertainty & Approximation', link: '/guide/uncertainty' },
            { text: 'Intervals & Ranges', link: '/guide/intervals' }
          ]
        },
        {
          text: 'Working with Dates',
          items: [
            { text: 'Parsing', link: '/guide/parsing' },
            { text: 'Formatting', link: '/guide/formatting' },
            { text: 'Validation', link: '/guide/validation' },
            { text: 'Comparison', link: '/guide/comparison' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Sets & Lists', link: '/guide/sets-lists' },
            { text: 'Seasons', link: '/guide/seasons' },
            { text: 'Type Safety', link: '/guide/type-safety' },
            { text: 'Migration Guide', link: '/guide/migration' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: '@edtf-ts/core', link: '/api/core' },
            { text: '@edtf-ts/utils', link: '/api/utils' },
            { text: '@edtf-ts/compare', link: '/api/compare' },
            { text: '@edtf-ts/natural', link: '/api/natural' }
          ]
        },
        {
          text: 'Core Types',
          items: [
            { text: 'EDTFDate', link: '/api/types/date' },
            { text: 'EDTFDateTime', link: '/api/types/datetime' },
            { text: 'EDTFInterval', link: '/api/types/interval' },
            { text: 'EDTFSeason', link: '/api/types/season' },
            { text: 'EDTFSet', link: '/api/types/set' },
            { text: 'EDTFList', link: '/api/types/list' },
            { text: 'Member (Four-Bound)', link: '/api/types/member' }
          ]
        },
        {
          text: 'Utilities',
          items: [
            { text: 'Validators', link: '/api/validators' },
            { text: 'Formatters', link: '/api/formatters' },
            { text: 'Comparators', link: '/api/comparators' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/examples/basic-usage' },
            { text: 'Parsing Dates', link: '/examples/parsing' },
            { text: 'Formatting Output', link: '/examples/formatting' },
            { text: 'Working with Intervals', link: '/examples/intervals' },
            { text: 'Uncertainty Handling', link: '/examples/uncertainty' },
            { text: 'Sets & Lists', link: '/examples/sets-lists' }
          ]
        },
        {
          text: 'Use Cases',
          items: [
            { text: 'Cultural Heritage', link: '/examples/cultural-heritage' },
            { text: 'Historical Research', link: '/examples/historical-research' },
            { text: 'Genealogy', link: '/examples/genealogy' },
            { text: 'Archives', link: '/examples/archives' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/edtf-ts' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@edtf-ts/core' }
    ],

    editLink: {
      pattern: 'https://github.com/yourusername/edtf-ts/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present'
    },

    search: {
      provider: 'local'
    }
  }
});
