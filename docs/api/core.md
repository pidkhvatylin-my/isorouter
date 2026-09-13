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
interface MetadataContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RouteMetadata {}
type RouteMetadataInput =
  | RouteMetadata
  | ((ctx: MetadataContext) => RouteMetadata);
// ---cut---
interface RouteConfig<C = unknown> {
  path?: string;
  index?: boolean;
  component?: C | LazyComponent<C>;
  beforeLoad?: BeforeLoad;
  metadata?: RouteMetadataInput;
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
- **`metadata`** — a value, or a synchronous function of `MetadataContext`.
  **Shallow-merged root → leaf** over the matched chain (child keys override
  parent keys) into `snapshot.metadata`. The router carries and merges this
  bag but never interprets it — see [Metadata & SEO](../guide/metadata).

### Metadata types

```ts twoslash
// ---cut---
/**
 * Per-route metadata — carried and merged by the router, never interpreted by
 * it. Empty by design: declare your own schema via module augmentation,
 * always against `@isorouter/core` (even when using an adapter):
 *
 *   declare module "@isorouter/core" {
 *     interface RouteMetadata {
 *       title?: string;
 *       description?: string;
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RouteMetadata {}

/** Context for a metadata function. Narrower than `GuardContext` by design —
 * no `signal`, no `navigationType`: metadata functions must be synchronous. */
interface MetadataContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
}

type RouteMetadataInput =
  | RouteMetadata
  | ((ctx: MetadataContext) => RouteMetadata);
```

`RouteMetadata` is an **empty declaration-merging interface** — nothing is
privileged by core, not even `title`. An object literal still assigns to `{}`
without error, so the forcing function is the **read** side:
`snapshot.metadata.title` is a compile error until you augment the interface.
Metadata functions must be **synchronous and pure**; they're evaluated just
before the final commit emit, so they never run for blocked, redirected or
aborted navigations. See [Metadata & SEO](../guide/metadata) for the full
picture and migration recipes.

### `RouterSnapshot`

```ts twoslash
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RouteMetadata {}
// ---cut---
interface RouterSnapshot<C> {
  /** Matched chain's components, root → leaf (routes with no component removed). */
  components: C[];
  params: Record<string, string>;
  url: URL;
  status: "idle" | "navigating" | "not-found" | "error";
  error: unknown;
  /** Shallow-merged metadata from the matched chain, root → leaf. */
  metadata: RouteMetadata;
}
```

### `ResolveRegister<Reg, Fallback>`

```ts twoslash
// @noErrors
type ResolveRegister<Reg, Fallback> = Reg extends {
  router: infer R extends Fallback;
}
  ? R
  : Fallback;
```

Resolves to `Reg["router"]` when the `Register` interface has been augmented,
or falls back to `Fallback` when it is empty. Used by all framework adapters to
implement the `Register` / `RegisteredRouter` module-augmentation pattern. See
[Type-safe navigation](../guide/type-safe-navigation#module-augmentation).

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
same-origin `string` to redirect (`replace`); a cross-origin string throws
(`status: "error"`) rather than navigating. See
[Navigation guards](../guide/guards).

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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RouteMetadata {}
interface RouterSnapshot<C> {
  components: C[];
  params: Record<string, string>;
  url: URL;
  status: "idle" | "navigating" | "not-found" | "error";
  error: unknown;
  metadata: RouteMetadata;
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
- **`onCommit`** — called with each committed snapshot. Since the core never
  touches `document`, `onCommit` is also the primary place to apply
  `snapshot.metadata` — see [Metadata & SEO](../guide/metadata).

## Exports

`createCoreRouter`, `Router`, `matchRoutes`, `lazy`, `isLazy`, and the types
`AnyRouter`, `Unsubscribe`, `LazyComponent`, `Awaitable`, `BeforeLoad`,
`ExtractParams`, `GuardContext`, `Href`, `MetadataContext`, `NavTarget`,
`NavigationKind`, `ResolveRegister`, `RouteConfig`, `RouteMatch`, `RouteMetadata`,
`RouteMetadataInput`, `RouteTemplate`, `RouterOptions`, `RouterSnapshot`.

## Other targets (TypeScript)

`@isorouter/core` targets **TypeScript ≥ 6.0**, whose `lib.dom.d.ts` ships the
Navigation API types — no extra `@types` package needed. On TypeScript < 6,
install `@types/dom-navigation`. See [Installation](../guide/installation#typescript-6-0).
