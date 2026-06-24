# Svelte 5

`@isorouter/svelte` wraps the core router's immutable-snapshot external store
with Svelte 5's `createSubscriber`: reading `router.current` inside a
`$derived`, `$effect` or the template subscribes to commits, and the
subscription is torn down automatically once nothing reads it anymore — no
manual `$effect`, no leaks.

**Requires Svelte ≥ 5.7.** `@isorouter/core` is installed automatically.

```sh
npm install @isorouter/svelte
```

::: tip Live demo
A full working demo with guards, lazy loading, nested layouts and type-safe
navigation is available on
[StackBlitz](https://stackblitz.com/github/pidkhvatylin-my/isorouter/tree/master/demos/svelte)
— every key concept is annotated inline.
:::

## Quick start

Create the router in a dedicated file and import it wherever it's needed:

```ts
// router.ts
import { createRouter, lazy } from "@isorouter/svelte";
import type { GuardContext } from "@isorouter/svelte";

import AppLayout from "./AppLayout.svelte";
import Home from "./Home.svelte";
import About from "./About.svelte";
import DashboardLayout from "./DashboardLayout.svelte";
import Overview from "./Overview.svelte";
import Settings from "./Settings.svelte";

export const router = createRouter([
  {
    path: "/",
    component: AppLayout,
    children: [
      { index: true, title: "Home", component: Home },
      { path: "about", title: "About", component: About },
      {
        path: "dashboard",
        component: DashboardLayout,
        children: [
          { index: true, component: Overview },
          { path: "settings", component: Settings },
        ],
      },
    ],
  },
] as const); // `as const` is required for type-safe navigation

// Module augmentation — see below
declare module "@isorouter/svelte" {
  interface Register {
    router: typeof router;
  }
}
```

```ts
// main.ts
import { mount } from "svelte";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app")! });
```

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { Router } from "@isorouter/svelte";
  import { router } from "./router";
</script>

<Router {router}>
  {#snippet notFound()}<p>Not found</p>{/snippet}
</Router>
```

`createRouter` returns a `SvelteRouter` wrapping the core router, with the
component type fixed to Svelte's `Component`. `<Router>` calls `router.start()`
on mount and `router.stop()` on unmount.

::: details Alternative: pass the router as a prop
If you prefer prop-based injection (e.g. for testing or SSR), pass `router` via
`props` and accept it with `$props()`:

```ts
// main.ts
mount(App, { target: document.getElementById("app")!, props: { router } });
```

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { Router } from "@isorouter/svelte";
  import type { AnySvelteRouter } from "@isorouter/svelte";

  let { router }: { router: AnySvelteRouter } = $props();
</script>

<Router {router}>
  {#snippet notFound()}<p>Not found</p>{/snippet}
</Router>
```
:::

## Components

### `<Router>`

Mount once near the app root. Provide UI for the non-content states via
snippets:

```svelte
<Router {router}>
  {#snippet loading()}<Spinner />{/snippet}
  {#snippet notFound()}<NotFound />{/snippet}
  {#snippet error(err)}<ErrorPage error={err} />{/snippet}
</Router>
```

- `notFound` — `router.current.status === "not-found"`.
- `error` — called with `router.current.error` when status is `"error"`.
- `loading` — when there's no matched root component yet (e.g. before the first
  commit) and neither `error` nor `notFound` applies.

Priority when multiple conditions apply: `error` > `notFound` > matched
component > `loading`. In particular, if you provide `loading` but not `error`,
a thrown guard will show the loading snippet.

Otherwise it renders the root matched component, `router.current.components[0]`.

### `<Outlet>`

Renders the next component in the matched chain at the current nesting depth;
renders nothing when there's no matching child.

```svelte
<!-- DashboardLayout.svelte -->
<script lang="ts">
  import { Outlet } from "@isorouter/svelte";
</script>

<h1>Dashboard</h1>
<Outlet />
```

The layout component **stays mounted** across child navigations — only the
`<Outlet>` content swaps. See [Nested layouts](../guide/nested-layouts).

### `<Link>`

```svelte
<Link href="/dashboard" activeClass="active" exact>Dashboard</Link>
```

A plain `<a>` intercepted by the Navigation API. `activeClass` is appended to
`class` when `router.isActive(href, { exact })` (default `"active"`); `exact`
requires an exact match (without it, a parent link stays active on all child
routes). When active, also sets `aria-current="page"`. Must be used within
`<Router>` (or `<Outlet>`). See [Links & active state](../guide/links).

## `getRouter()`

Reads the `SvelteRouter` from context. Must be used within `<Router>` (or
`<Outlet>`):

```svelte
<script lang="ts">
  import { getRouter } from "@isorouter/svelte";
  const router = getRouter();
</script>

<p>{router.current.params.city}</p>
```

`router.current` is a **getter** — read it inside a `$derived`, `$effect` or the
template to subscribe to commits; the subscription is dropped once nothing reads
it. `router.navigate`, `router.back`, `router.forward` and `router.isActive` are
also available on the instance.

## Route `title`

A route can declare a `title` to identify itself:

```ts
{ path: "about", title: "About", component: About }
```

`title` can also be a function that receives [`GuardContext`](../api/svelte#types)
and runs before the component renders — useful for dynamic titles from URL params:

```ts
{
  path: "users/:id",
  title: (ctx) => `User #${ctx.params.id}`,
  component: lazy(() => import("./User.svelte")),
}
```

## Module augmentation

Augmenting the `Register` interface narrows `getRouter()` to the **concrete**
router type everywhere in the project:

```ts
// router.ts
import { createRouter } from "@isorouter/svelte";

export const router = createRouter([
  { path: "/", component: Home },
  { path: "/about", component: About },
] as const);

declare module "@isorouter/svelte" {
  interface Register {
    router: typeof router;
  }
}
```

Place the `declare module` block in the same file as `createRouter` (e.g.
`router.ts`). TypeScript merges it globally — `getRouter()` in any component now
returns the concrete `SvelteRouter<T>`, so `router.navigate("/about")`
type-checks and invalid paths are rejected at compile time.

Without the augmentation `getRouter()` returns `AnySvelteRouter`, which is the
same behaviour as before.

See [Type-safe navigation → Module augmentation](../guide/type-safe-navigation#module-augmentation).

## See also

- [Type-safe navigation](../guide/type-safe-navigation)
- [Navigation guards](../guide/guards)
- [Nested layouts](../guide/nested-layouts)
- [`@isorouter/svelte` API reference](../api/svelte)
