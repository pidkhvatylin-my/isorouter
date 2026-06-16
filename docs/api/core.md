# @isorouter/core

The framework-agnostic core: matcher, guards, lazy loading and the async-commit
state machine. Zero runtime dependencies.

```sh
npm install @isorouter/core
```

## `createCoreRouter(routes, options?)`

Creates a router. A thin wrapper around `new Router(routes, options)`.

```ts twoslash
// @filename: User.ts
export default {};
// @filename: index.ts
import { createCoreRouter, lazy } from "@isorouter/core";

declare const Home: unknown;
declare const Concerts: unknown;
// ---cut---
const router = createCoreRouter([
  { path: "/", component: Home },
  { path: "/concerts/:city", component: Concerts },
  { path: "/users/:id", component: lazy(() => import("./User")) },
] as const);
```

Declare routes `as const` to unlock [type-safe
navigation](../guide/type-safe-navigation).

## The external-store contract

The router publishes state as an **immutable snapshot** — a fresh object
reference on every commit, stable in between.

- `router.subscribe(fn)` — registers `fn(snapshot)`, returns an unsubscribe.
- `router.getSnapshot()` — the current snapshot (referentially stable until the
  next commit).

This is the lowest common denominator across reactivity systems: it plugs
straight into React's `useSyncExternalStore`, Svelte 5's `createSubscriber`,
Vue's `shallowRef`, or anything else that reacts to a changed reference.

## Instance methods

### Navigation

```ts twoslash
import { createCoreRouter } from "@isorouter/core";
const router = createCoreRouter([{ path: "/concerts/:city" }] as const);
// ---cut---
router.navigate("/concerts/kyiv");
router.navigate("/concerts/kyiv", { replace: true, state: { from: "search" } });
router.back();
router.forward();
```

`navigate` **throws** if `navigation` is unavailable (no polyfill loaded).
`back` and `forward` are **no-ops** in that case. See
[Browser support](../guide/browser-support).

### `isActive(path, options?)`

```ts twoslash
import { createCoreRouter } from "@isorouter/core";
const router = createCoreRouter([{ path: "/concerts/:city" }] as const);
// ---cut---
router.isActive("/concerts"); // true for "/concerts" and "/concerts/kyiv"
router.isActive("/concerts", { exact: true }); // true only for "/concerts"
```

### Lifecycle

```ts twoslash
import { createCoreRouter } from "@isorouter/core";
const router = createCoreRouter([{ path: "/" }] as const);
// ---cut---
router.start(); // begins intercepting same-origin navigations
router.stop(); // removes the listener, aborts any in-flight commit
```

`start()` is a no-op if `navigation` is unavailable. Adapters call `start`/`stop`
for you on mount/unmount.

## Types

### `RouteConfig`

```ts twoslash
type Awaitable<T> = T | Promise<T>;
interface GuardContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
  signal: AbortSignal;
  navigationType: "reload" | "push" | "replace" | "traverse";
}
type BeforeLoad = (ctx: GuardContext) => Awaitable<void | boolean | string>;
interface LazyComponent<C> {
  (): Promise<{ default: C }>;
}
// ---cut---
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
  (`params["*"]` gets the remaining path, decoded). Static > param > splat,
  regardless of declaration order; ties broken by source order.
- **`index`** — matches when the parent's path is matched exactly (no remaining
  segments).
- **`component`** — a value, or `lazy(() => import("./Page"))`. Routes with no
  `component` are matched (e.g. as pass-through layouts) but contribute nothing
  to `snapshot.components`.
- **`children`** — nested routes. A matched parent with no matching child still
  resolves on its own if the path is fully consumed.
- **`title`** — sets `document.title` on commit. The **deepest** route in the
  matched chain that defines a `title` wins.

### `RouterSnapshot`

```ts twoslash
interface RouterSnapshot<C> {
  /** Matched chain's components, root → leaf (routes with no component removed). */
  components: C[];
  params: Record<string, string>;
  url: URL;
  status: "idle" | "navigating" | "not-found" | "error";
  error: unknown;
}
```

### `GuardContext` & `BeforeLoad`

```ts twoslash
type Awaitable<T> = T | Promise<T>;
// ---cut---
interface GuardContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
  /** Aborts when this navigation is superseded by a newer one. */
  signal: AbortSignal;
  navigationType: "reload" | "push" | "replace" | "traverse";
}

type BeforeLoad = (ctx: GuardContext) => Awaitable<void | boolean | string>;
```

Return nothing/`true` to allow, `false` to block (current URL restored), or a
`string` to redirect (`replace`). See [Navigation guards](../guide/guards).

## `lazy(loader)`

```ts twoslash
// @filename: User.ts
export default {};
// @filename: index.ts
import { lazy } from "@isorouter/core";
// ---cut---
const User = lazy(() => import("./User"));
```

The dynamic import runs **once** on first match; its `default` export is cached
for subsequent navigations. `isLazy(value)` narrows a value to a
`LazyComponent`. See [Lazy loading](../guide/lazy-loading).

## Options

```ts twoslash
interface RouterSnapshot<C> {
  components: C[];
  params: Record<string, string>;
  url: URL;
  status: "idle" | "navigating" | "not-found" | "error";
  error: unknown;
}
// ---cut---
interface RouterOptions {
  scroll?: "after-transition" | "manual";
  onError?: (err: unknown) => void;
  onCommit?: (snapshot: RouterSnapshot<unknown>) => void;
}
```

- **`scroll`** — `"after-transition"` (default) restores/resets scroll once the
  commit settles; `"manual"` leaves scroll to you.
- **`onError`** — called with any error thrown during a guard or lazy import.
- **`onCommit`** — called with each committed snapshot.

## Exports

`createCoreRouter`, `Router`, `matchRoutes`, `lazy`, `isLazy`, and the types
`AnyRouter`, `Unsubscribe`, `LazyComponent`, `Awaitable`, `BeforeLoad`,
`ExtractParams`, `GuardContext`, `Href`, `NavTarget`, `NavigationKind`,
`RouteConfig`, `RouteMatch`, `RouteTemplate`, `RouterOptions`, `RouterSnapshot`.

## Other targets (TypeScript)

`@isorouter/core` targets **TypeScript ≥ 6.0**, whose `lib.dom.d.ts` ships the
Navigation API types — no extra `@types` package needed. On TypeScript < 6,
install `@types/dom-navigation`. See [Installation](../guide/installation#typescript-6-0).
