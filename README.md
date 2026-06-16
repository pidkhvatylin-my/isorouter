<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo.svg">
    <img src="public/logo-light.svg" alt="isorouter logo" width="120" height="120">
  </picture>
</p>

<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/wordmark.svg">
    <img src="public/wordmark-light.svg" alt="isorouter" height="56">
  </picture>
</h1>

[![CI](https://github.com/pidkhvatylin-my/isorouter/actions/workflows/ci.yml/badge.svg)](https://github.com/pidkhvatylin-my/isorouter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-online-brightgreen.svg)](https://pidkhvatylin-my.github.io/isorouter/)

[![core minzip](https://img.shields.io/bundlephobia/minzip/%40isorouter%2Fcore?label=core%20gzip)](https://bundlephobia.com/package/@isorouter/core)
[![react minzip](https://img.shields.io/bundlephobia/minzip/%40isorouter%2Freact?label=react%20gzip)](https://bundlephobia.com/package/@isorouter/react)
[![vue minzip](https://img.shields.io/bundlephobia/minzip/%40isorouter%2Fvue?label=vue%20gzip)](https://bundlephobia.com/package/@isorouter/vue)
[![svelte gzip](https://img.shields.io/badge/svelte%20gzip-~2.3%20KB-blue.svg)](https://www.npmjs.com/package/@isorouter/svelte)

A lightweight, **framework-agnostic SPA router built on the browser
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API)**.

📖 **[Documentation](https://pidkhvatylin-my.github.io/isorouter/)** — guide, framework adapters and full API reference.

The interception, matching, guards, lazy-loading and async-commit state machine
live in a pure-TypeScript core with **zero framework dependencies**. Thin
adapters bind that core into Svelte 5, React and Vue 3.

```
@isorouter/core     ← pure TS: matcher, guards, lazy, commit state machine
   ├── @isorouter/svelte   ← createSubscriber bridge
   ├── @isorouter/react    ← useSyncExternalStore bridge
   └── @isorouter/vue      ← shallowRef bridge
```

## Why this shape

The core is an **external store**: it exposes `subscribe(fn)` + `getSnapshot()`
and publishes an **immutable snapshot with a fresh reference on every commit**.
That contract is the lowest common denominator across the three reactivity
systems — each adapter wraps it with the framework's native primitive:

| Framework | Bridge primitive                                | Why                                                                                         |
| --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| React     | `useSyncExternalStore(subscribe, getSnapshot)`  | Detects change via `Object.is(prev, next)` — **requires** a new reference per update.       |
| Svelte 5  | `createSubscriber(update => subscribe(update))` | Subscription is live only while `current` is read in a reactive scope; auto-torn-down.      |
| Vue 3     | `shallowRef(snapshot)` + `subscribe`            | Snapshot is already immutable, so shallow ref replacement is exactly right (no deep proxy). |

> A `Proxy`-based core was considered and rejected: a Proxy that mutates in
> place keeps the **same reference**, so `useSyncExternalStore` would never see a
> change and React would not re-render. The immutable-snapshot contract is what
> makes one core serve all three frameworks.

## Browser support / polyfill

The Navigation API reached **Baseline Newly available** in early 2026 (Chrome,
Edge, Firefox, Safari). It is **not yet Widely available**, so older browsers
still in production lack it. isorouter ships **no History API fallback** by
design — if you must support pre-2026 engines, load a polyfill before starting
the router (the "unix way": one small dependency, opt-in):

```ts
if (!("navigation" in window)) {
  await import("@virtualstate/navigation/polyfill");
}
router.start(); // or mount <Router> / <RouterView>
```

## Quick start

### Core (any framework / none)

```ts
import { createCoreRouter, lazy } from "@isorouter/core";

const router = createCoreRouter([
  { path: "/", component: Home },
  { path: "/users/:id", component: lazy(() => import("./User")) },
] as const);

router.subscribe((s) => render(s.components, s.params));
router.start();
```

### Svelte 5

```svelte
<script lang="ts">
  import { createRouter, Router } from "@isorouter/svelte";
  import Home from "./Home.svelte";
  const router = createRouter([{ path: "/", component: Home }] as const);
</script>

<Router {router}>
  {#snippet notFound()}<h1>404</h1>{/snippet}
</Router>
```

### React

```tsx
import { createRouter, Router } from "@isorouter/react";
const router = createRouter([{ path: "/", component: Home }] as const);

<Router router={router} notFound={<h1>404</h1>} />;
```

### Vue 3

```ts
import { createRouter, RouterView } from "@isorouter/vue";
const router = createRouter([{ path: "/", component: Home }] as const);

// <RouterView :router="router" />
```

## API (shared across adapters)

- **Route config**: `{ path?, index?, component?, beforeLoad?, title?, children? }`
  — `component` may be a value or `lazy(() => import(...))`.
- **Guards**: `beforeLoad(ctx)` runs root→leaf. Return `false` to block (restores
  current URL), a `string` to redirect, or nothing to allow. `ctx.signal` aborts
  when the navigation is superseded.
- **Nested layouts**: parent `component` + `children`; render the child with
  `<Outlet />` (Svelte/React) / `<Outlet />` component (Vue). Layout instances
  persist across child navigations because component identity is stable.
- **Active links**: `<Link href="..." />` renders a plain `<a>` — the Navigation
  API intercepts the click natively (modifier-clicks, `target=_blank`, downloads
  are handled for free). `exact` + `activeClass` for active styling.
- **Hooks/composables**: React `useParams/useLocation/useNavigate/useRouter`;
  Vue `useParams/useLocation/useNavigate/useRouter`; Svelte read
  `getRouter().current`.

## Type-safe navigation

Declaring routes `as const` gives compile-time path templates: `router.navigate`
only accepts known paths (`"/users/:id"` → `\`/users/${string}\``), with optional
`?query`/`#hash`.

## Build

`@isorouter/core`, `@isorouter/react` and `@isorouter/vue` ship their JS via
[rolldown](https://rolldown.rs) and their `.d.ts` via `tsc` (rolldown's
`--dts` path currently injects a deprecated `baseUrl`, so declarations are
emitted separately). `@isorouter/svelte` uses `svelte-package` instead.

`@isorouter/core` targets **TypeScript ≥ 6.0**, whose `lib.dom.d.ts` ships the
Navigation API types (`Navigation`, `NavigateEvent`, `NavigationResult`, the
global `navigation`) — no extra `@types` package needed. On TypeScript < 6,
install `@types/dom-navigation` yourself.
