# @isorouter/core

[![npm version](https://img.shields.io/npm/v/%40isorouter%2Fcore.svg)](https://www.npmjs.com/package/@isorouter/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A lightweight, **framework-agnostic SPA router built on the browser
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API)**.

Route matching, navigation guards, lazy loading and an async commit state
machine — all in pure TypeScript, with **zero runtime dependencies**. Use it
directly, or through a thin adapter:
[`@isorouter/svelte`](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/svelte),
[`@isorouter/react`](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/react),
[`@isorouter/vue`](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/vue).

## Size

A single unminified ESM file, **8.3 KB (3.1 KB gzipped)**, with **zero
runtime dependencies** and `"sideEffects": false` for full tree-shaking —
your bundler's own minification shrinks it further. The published npm
package (incl. type declarations, README and LICENSE) is ~9 KB packed / ~25
KB unpacked across 9 files.

## Install

```sh
npm install @isorouter/core
```

### Requirements

- **Navigation API** in the browser. It reached **Baseline Newly available**
  in early 2026 (Chrome, Edge, Firefox, Safari) but is not yet _Widely
  available_. isorouter ships **no History API fallback** by design — if you
  need to support older engines, load a polyfill before starting the router:

  ```ts
  if (!window.navigation) {
    const { applyPolyfill } =
      await import("@virtualstate/navigation/apply-polyfill");
    applyPolyfill();
  }
  router.start();
  ```

  [`@virtualstate/navigation`](https://github.com/virtualstate/navigation) is
  the only polyfill we're aware of that implements `navigate` +
  `event.intercept()`, which isorouter's interception model depends on. Our
  e2e suite runs the full test matrix a second time with the native
  Navigation API hidden, against this polyfill, to verify behavioural parity
  (`npm run test:e2e:polyfill`).

  **Known limitation:** as of `@virtualstate/navigation@1.0.1-alpha.212`,
  `interceptWindowClicks` reports `downloadRequest: ""` (instead of `null`)
  for plain `<a>` clicks, so the `navigate` event isn't intercepted and the
  polyfill falls back to a full-page navigation for link clicks — the route
  still renders correctly (the fresh page load re-runs `router.start()`), but
  the transition isn't client-side. Imperative navigation (`router.navigate`,
  `back`, `forward`, guards, redirects, lazy loading) is unaffected and works
  identically to native. Tracked upstream at
  [virtualstate/navigation](https://github.com/virtualstate/navigation).

- **TypeScript ≥ 6.0** for full type support. `lib.dom.d.ts` has shipped the
  Navigation API types (`Navigation`, `NavigateEvent`, `NavigationResult`, the
  global `navigation`) since TS 6.0, so no extra `@types` package is needed.
  On TypeScript < 6, install `@types/dom-navigation` yourself.

## Quick start

```ts
import { createCoreRouter, lazy } from "@isorouter/core";

const router = createCoreRouter([
  { path: "/", component: Home },
  { path: "/concerts/:city", component: Concerts },
  { path: "/users/:id", component: lazy(() => import("./User")) },
] as const);

router.subscribe((snapshot) => render(snapshot));
router.start();
```

`createCoreRouter` is a thin wrapper around `new Router(routes, options)`.

## The external-store contract

The router publishes state as an **immutable snapshot** — a fresh object
reference on every commit, stable in between:

```ts
interface RouterSnapshot<C> {
  /** Matched chain's components, root → leaf (routes with no component removed). */
  components: C[];
  params: Record<string, string>;
  url: URL;
  status: "idle" | "navigating" | "not-found" | "error";
  error: unknown;
}
```

- `router.subscribe(fn)` — registers `fn(snapshot)`, returns an unsubscribe.
- `router.getSnapshot()` — returns the current snapshot (referentially stable
  until the next commit).

This is the lowest common denominator across reactivity systems: it plugs
straight into React's `useSyncExternalStore`, Svelte 5's `createSubscriber`,
Vue's `shallowRef`, or anything else that reacts to a changed reference.

## Route config

```ts
interface RouteConfig<C = unknown> {
  path?: string;
  index?: boolean;
  component?: C | LazyComponent<C>;
  beforeLoad?: BeforeLoad;
  title?: string | ((ctx: GuardContext) => string);
  children?: readonly RouteConfig<C>[];
}
```

- **`path`** — `"users/:id"` for a param, `"files/*"` for a catch-all splat
  (`params["*"]` gets the remaining path, decoded). Static segments win over
  params, which win over splats, regardless of declaration order; ties are
  broken by source order.
- **`index`** — matches when the parent's path is matched exactly (no
  remaining segments).
- **`component`** — a value, or `lazy(() => import("./Page"))` for
  code-splitting. Routes with no `component` are matched (e.g. as
  pass-through layouts) but contribute nothing to `snapshot.components`.
- **`children`** — nested routes. A matched parent with no matching child
  still resolves on its own if the path is fully consumed.
- **`title`** — sets `document.title` on commit. The deepest route in the
  matched chain that defines a `title` wins.

## Guards

```ts
type BeforeLoad = (ctx: GuardContext) => Awaitable<void | boolean | string>;

interface GuardContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
  /** Aborts when this navigation is superseded by a newer one. */
  signal: AbortSignal;
  navigationType: "reload" | "push" | "replace" | "traverse";
}
```

`beforeLoad` runs **root → leaf** over the matched chain before any component
commits:

- return nothing / `true` → allow
- return `false` → block (the current URL is restored)
- return a `string` → redirect (`replace`) to that path

## Lazy loading

```ts
import { lazy } from "@isorouter/core";

const User = lazy(() => import("./User"));
```

The dynamic import runs once on first match and its `default` export is
cached on the `LazyComponent` for subsequent navigations.

## Imperative navigation

```ts
router.navigate("/concerts/kyiv");
router.navigate("/concerts/kyiv", { replace: true, state: { from: "search" } });
router.back();
router.forward();
```

`navigate` throws if `navigation` is unavailable (no polyfill loaded). `back`
and `forward` are no-ops in that case.

## Active-link helper

```ts
router.isActive("/concerts"); // true for "/concerts" and "/concerts/kyiv"
router.isActive("/concerts", { exact: true }); // true only for "/concerts"
```

## Type-safe navigation

Declare routes `as const` to get compile-time path templates — `navigate`
only accepts known paths, with an optional `?query` or `#hash`:

```ts
// Href<typeof routes> -> "/" | "/concerts" | `/concerts/${string}` | `/users/${string}`
router.navigate("/concerts/kyiv"); // ok
router.navigate("/concerts/kyiv?from=search"); // ok
router.navigate("/no-such-route"); // type error
```

`ExtractParams<"/concerts/:city">` resolves to `{ city: string }` for typing
route params elsewhere.

## Lifecycle

```ts
router.start(); // begins intercepting same-origin navigations
router.stop(); // removes the listener, aborts any in-flight commit
```

`start()` is a no-op if `navigation` is unavailable. Adapters call this for
you on mount/unmount.

## Options

```ts
interface RouterOptions {
  scroll?: "after-transition" | "manual";
  onError?: (err: unknown) => void;
  onCommit?: (snapshot: RouterSnapshot<unknown>) => void;
}
```

## License

[MIT](./LICENSE) © Mykhailo Pidkhvatylin
