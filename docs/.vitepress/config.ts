import { defineConfig } from "vitepress";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";

const ogUrl = "https://pidkhvatylin-my.github.io/isorouter/";
const ogDescription =
  "A lightweight, framework-agnostic SPA router built on the browser Navigation API. Zero-dependency TypeScript core with thin Svelte 5, React and Vue 3 adapters.";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "isorouter",
  description: ogDescription,

  // Project page lives at https://pidkhvatylin-my.github.io/isorouter/
  base: "/isorouter/",
  lang: "en-US",
  cleanUrls: true,
  lastUpdated: true,
  metaChunk: true,

  head: [
    ["meta", { name: "theme-color", content: "#646cff" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "isorouter" }],
    ["meta", { property: "og:description", content: ogDescription }],
    ["meta", { property: "og:url", content: ogUrl }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "isorouter" }],
    ["meta", { name: "twitter:description", content: ogDescription }],
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: "/isorouter/logo.svg" },
    ],
  ],

  markdown: {
    codeTransformers: [transformerTwoslash()],
    // Twoslash adds its own language servers; keep these languages aliased so
    // ```ts twoslash fences resolve cleanly.
    languages: ["js", "jsx", "ts", "tsx"],
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { light: "/logo-light.svg", dark: "/logo.svg", alt: "isorouter" },
    // The default text title is replaced by the two-tone <Wordmark> injected
    // via the nav-bar-title-after slot (see theme/index.ts).
    siteTitle: false,

    nav: [
      { text: "Guide", link: "/guide/introduction", activeMatch: "/guide/" },
      { text: "API", link: "/api/core", activeMatch: "/api/" },
      {
        text: "Frameworks",
        items: [
          { text: "Svelte 5", link: "/frameworks/svelte" },
          { text: "React", link: "/frameworks/react" },
          { text: "Vue 3", link: "/frameworks/vue" },
        ],
      },
      {
        text: "v1.0.0",
        items: [
          {
            text: "Changelog",
            link: "https://github.com/pidkhvatylin-my/isorouter/blob/master/packages/core/CHANGELOG.md",
          },
          {
            text: "Contributing",
            link: "https://github.com/pidkhvatylin-my/isorouter/blob/master/CONTRIBUTING.md",
          },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is isorouter?", link: "/guide/introduction" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Core concepts",
          items: [
            { text: "Routing & matching", link: "/guide/routing" },
            { text: "Navigation guards", link: "/guide/guards" },
            { text: "Lazy loading", link: "/guide/lazy-loading" },
            { text: "Nested layouts", link: "/guide/nested-layouts" },
            { text: "Links & active state", link: "/guide/links" },
            {
              text: "Type-safe navigation",
              link: "/guide/type-safe-navigation",
            },
            { text: "Browser support", link: "/guide/browser-support" },
          ],
        },
      ],
      "/frameworks/": [
        {
          text: "Framework adapters",
          items: [
            { text: "Svelte 5", link: "/frameworks/svelte" },
            { text: "React", link: "/frameworks/react" },
            { text: "Vue 3", link: "/frameworks/vue" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API reference",
          items: [
            { text: "@isorouter/core", link: "/api/core" },
            { text: "@isorouter/svelte", link: "/api/svelte" },
            { text: "@isorouter/react", link: "/api/react" },
            { text: "@isorouter/vue", link: "/api/vue" },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/pidkhvatylin-my/isorouter",
      },
    ],

    search: {
      provider: "local",
    },

    editLink: {
      pattern:
        "https://github.com/pidkhvatylin-my/isorouter/edit/master/docs/:path",
      text: "Edit this page on GitHub",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Mykhailo Pidkhvatylin",
    },
  },
});
