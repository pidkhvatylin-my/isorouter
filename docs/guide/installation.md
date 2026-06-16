# Installation

Pick the package for your framework. Each adapter declares `@isorouter/core`
as a regular dependency, so it's installed automatically.

::: code-group

```sh [core (any / none)]
npm install @isorouter/core
```

```sh [Svelte 5]
npm install @isorouter/svelte
```

```sh [React]
npm install @isorouter/react
```

```sh [Vue 3]
npm install @isorouter/vue
```

:::

## Requirements

### Navigation API

isorouter is built on the browser
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API). It
reached **Baseline Newly available** in early 2026 (Chrome, Edge, Firefox,
Safari) but is **not yet Widely available**.

isorouter ships **no History API fallback** by design. If you need to support
older engines, load a polyfill before starting the router — see
[Browser support](./browser-support) for the full story.

### TypeScript ≥ 6.0

For full type support, use **TypeScript 6.0 or newer**. Its `lib.dom.d.ts`
ships the Navigation API types (`Navigation`, `NavigateEvent`,
`NavigationResult`, the global `navigation`), so **no extra `@types` package is
needed**.

On TypeScript < 6, install `@types/dom-navigation` yourself.

### Framework versions

| Adapter             | Peer requirement |
| ------------------- | ---------------- |
| `@isorouter/svelte` | Svelte ≥ 5.7     |
| `@isorouter/react`  | React ≥ 18       |
| `@isorouter/vue`    | Vue ≥ 3.4        |

## Bundle size

Every package is ESM-only with `"sideEffects": false` for full tree-shaking.
Measured by [Bundlephobia](https://bundlephobia.com/package/@isorouter/core)
(minified / minified + gzipped); adapter figures **include** the core:

| Package              | Minified | Gzipped |
| -------------------- | -------- | ------- |
| `@isorouter/core`    | ~4.0 KB  | ~1.8 KB |
| `@isorouter/react`   | ~5.4 KB  | ~2.3 KB |
| `@isorouter/vue`     | ~5.6 KB  | ~2.3 KB |
| `@isorouter/svelte`  | —        | ~2.3 KB\* |

`@isorouter/core` has **zero runtime dependencies**; the adapters add only
their bridge code on top (~0.5 KB gzipped each).

\* Bundlephobia can't build Svelte's compiled `.svelte` exports, so the Svelte
figure is an estimate (core ~1.8 KB + adapter ~0.5 KB), in line with the React
and Vue adapters.

## Next

Head to the [Quick start](./quick-start) for a running router.
