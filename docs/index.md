---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  # The "isorouter" name is rendered as the two-tone <Wordmark> via the
  # home-hero-info-before slot (see .vitepress/theme/index.ts).
  text: "One router. Any framework. The platform underneath."
  tagline: A lightweight SPA router built on the browser Navigation API — a zero-dependency TypeScript core with thin Svelte 5, React and Vue 3 adapters.
  image:
    light: /logo-light.svg
    dark: /logo.svg
    alt: isorouter
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/pidkhvatylin-my/isorouter

features:
  - icon: 🧩
    title: Framework-agnostic core
    details: Matching, guards, lazy-loading and the async-commit state machine live in pure TypeScript with zero runtime dependencies. Use it directly, or through a 1-file adapter.
  - icon: 🌐
    title: Built on the Navigation API
    details: Link clicks are intercepted natively — modifier-clicks, target="_blank" and downloads behave correctly for free. No History API guesswork.
  - icon: 🪶
    title: Tiny
    details: The core is ~4 KB minified (1.8 KB gzipped) with zero runtime dependencies and sideEffects&nbsp;false for full tree-shaking. Each adapter adds only ~0.5 KB gzipped on top.
  - icon: 🔒
    title: Type-safe navigation
    details: Declare routes "as const" and navigate() only accepts known paths at compile time — "/users/:id" becomes `/users/${string}`, with optional ?query / #hash.
  - icon: ⚛️
    title: Svelte 5, React & Vue 3
    details: One immutable-snapshot external store, three native bridges — createSubscriber, useSyncExternalStore and shallowRef. Correct, tear-free updates everywhere.
  - icon: 🛡️
    title: Guards, lazy & nested layouts
    details: beforeLoad guards run root→leaf with an abort signal, redirects and blocking. Layout components persist across child navigations via stable identity.
---
