# Routing & matching

Routes are a plain array of config objects. The same shape is used by the core
and every adapter.

```ts twoslash
import type { RouteConfig } from "@isorouter/core";
// ---cut---
interface Route {
  path?: string;
  index?: boolean;
  component?: unknown; // a value or lazy(() => import(...))
  beforeLoad?: unknown;
  title?: string | ((ctx: unknown) => string);
  children?: readonly Route[];
}
```

## Path segments

| Segment      | Example        | Matches                                         |
| ------------ | -------------- | ----------------------------------------------- |
| Static       | `"about"`      | exactly `/about`                                 |
| Param        | `"users/:id"`  | `/users/42` → `params.id === "42"`              |
| Splat (`*`)  | `"files/*"`    | `/files/a/b/c` → `params["*"] === "a/b/c"` (decoded) |

```ts twoslash
import { createCoreRouter } from "@isorouter/core";

declare const Home: unknown;
declare const User: unknown;
declare const Files: unknown;
// ---cut---
const router = createCoreRouter([
  { path: "/", component: Home },
  { path: "/users/:id", component: User },
  { path: "/files/*", component: Files },
] as const);
```

## Matching priority

When multiple routes could match a segment, isorouter resolves the conflict
deterministically, **regardless of declaration order**:

1. **Static** segments win over
2. **params**, which win over
3. **splats**.

Ties within the same kind are broken by **source order**.

## Index routes

`index: true` matches when the parent's path is matched **exactly**, with no
remaining segments. It's how you render content at a layout's own URL:

```ts twoslash
import { createCoreRouter } from "@isorouter/core";

declare const DashboardLayout: unknown;
declare const Overview: unknown;
declare const Settings: unknown;
// ---cut---
const router = createCoreRouter([
  {
    path: "/dashboard",
    component: DashboardLayout,
    children: [
      { index: true, component: Overview }, // /dashboard
      { path: "settings", component: Settings }, // /dashboard/settings
    ],
  },
] as const);
```

## Components are optional

A route with no `component` is still **matched** — useful as a pass-through
layout — but contributes nothing to `snapshot.components`. A matched parent
with no matching child still resolves on its own if the path is fully consumed.

## The snapshot

Every commit produces an immutable `RouterSnapshot`:

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

- `components` is the matched chain, root → leaf — render `components[0]` and
  let each layout pull in the next with [`<Outlet>`](./nested-layouts).
- `status` drives the loading / not-found / error UI in the adapters.

See the [core API reference](../api/core) for the full surface.

## Setting the document title

A route can set `document.title` on commit via `title` — a string or a function
of the guard context. The **deepest** route in the matched chain that defines a
`title` wins:

```ts twoslash
import { createCoreRouter } from "@isorouter/core";

declare const User: unknown;
// ---cut---
const router = createCoreRouter([
  {
    path: "/users/:id",
    component: User,
    title: (ctx) => `User ${ctx.params.id}`,
  },
] as const);
```
