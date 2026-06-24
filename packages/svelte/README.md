# @isorouter/svelte

[![npm version](https://img.shields.io/npm/v/%40isorouter%2Fsvelte.svg)](https://www.npmjs.com/package/@isorouter/svelte)
[![minzip](https://img.shields.io/badge/gzip-~2.3%20KB-blue.svg)](https://www.npmjs.com/package/@isorouter/svelte)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Svelte 5 bindings for
[`@isorouter/core`](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core) —
a lightweight SPA router built on the browser
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API).

`<Router>`, `<Outlet>`, `<Link>` and `getRouter()` wrap the core router's
immutable-snapshot external store with Svelte 5's `createSubscriber`: reading
`router.current` inside a `$derived`, `$effect` or the template subscribes to
commits, and the subscription is torn down automatically once nothing reads it
anymore — no manual `$effect`, no leaks.

**[Full documentation →](https://pidkhvatylin-my.github.io/isorouter/frameworks/svelte)**  
**[Live demo on StackBlitz →](https://stackblitz.com/github/pidkhvatylin-my/isorouter/tree/master/demos/svelte)**

## Install

```sh
npm install @isorouter/svelte
```

`@isorouter/core` is a regular dependency and is installed automatically.

### Requirements

- Svelte ≥ 5.7.
- Everything in
  [`@isorouter/core`'s Requirements](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core#requirements) —
  notably the **Navigation API**. Load a polyfill if you need to support older
  engines, before `<Router>` mounts (it calls `router.start()` for you).

## Quick start

```ts
// router.ts
import { createRouter, lazy } from "@isorouter/svelte";

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
  {#snippet notFound()}
    <p>Not found</p>
  {/snippet}
</Router>
```

```svelte
<!-- DashboardLayout.svelte -->
<script lang="ts">
  import { Outlet } from "@isorouter/svelte";
</script>

<h1>Dashboard</h1>
<Outlet />
```

`createRouter` returns a `SvelteRouter` wrapping the core router, with the
component type fixed to Svelte's `Component`. `<Router>` calls
`router.start()` on mount and `router.stop()` on unmount.

## Components

### `<Router>`

```svelte
<Router {router}>
  {#snippet loading()}<Spinner />{/snippet}
  {#snippet notFound()}<NotFound />{/snippet}
  {#snippet error(err)}<ErrorPage error={err} />{/snippet}
</Router>
```

- `router` — a `SvelteRouter` instance from `createRouter`.
- `notFound` — rendered when `router.current.status === "not-found"`.
- `error` — called with `router.current.error` when
  `router.current.status === "error"`.
- `loading` — rendered whenever there's no matched root component yet (e.g.
  before the first commit) and neither `error` nor `notFound` applies.

Snippet priority: `error` > `notFound` > matched component > `loading`.

Otherwise renders the root matched component, `router.current.components[0]`.

### `<Outlet>`

Renders the next component in the matched chain at the current nesting depth.
Used inside a layout component to render its matched child route; renders
nothing when there is no matching child. The layout instance **stays mounted**
across child navigations.

### `<Link>`

```svelte
<Link href="/dashboard" activeClass="active" exact>Dashboard</Link>
```

A plain `<a>` — the Navigation API intercepts the click, so modifier-clicks,
`target="_blank"` and downloads behave natively. Any other attributes are
forwarded to the `<a>`.

- `href` — the target path.
- `class` — merged with `activeClass`.
- `activeClass` — appended to `class` when `router.isActive(href, { exact })`
  (default `"active"`).
- `exact` — when set, only an exact URL match is considered active (without it,
  a parent link stays active on all child routes).

When active, also sets `aria-current="page"`. Must be used within `<Router>`
(or `<Outlet>`).

## `getRouter()`

```svelte
<script lang="ts">
  import { getRouter } from "@isorouter/svelte";

  const router = getRouter();
</script>

<p>{router.current.params.city}</p>
```

Reads the `SvelteRouter` instance from context. Must be used within `<Router>`
(or `<Outlet>`). `router.current` is a getter — read it inside a `$derived`,
`$effect` or the template to subscribe to commits; the subscription is dropped
once nothing reads it. `router.navigate`, `router.back`, `router.forward` and
`router.isActive` are also available on the instance.

## Route `title`

Routes accept an optional `title` — a string or a function:

```ts
{ path: "about", title: "About", component: About }

// Dynamic — receives GuardContext with params, url, signal
{ path: "users/:id", title: (ctx) => `User #${ctx.params.id}`, component: User }
```

## Type-safe navigation

Declare routes `as const` and augment `Register` in the same file — then
`router.navigate` only accepts known paths and `getRouter()` returns the
concrete type everywhere:

```ts
// router.ts
export const router = createRouter([...] as const);

declare module "@isorouter/svelte" {
  interface Register { router: typeof router; }
}
```

See [`@isorouter/core`'s Type-safe navigation](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core#type-safe-navigation).

## License

[MIT](./LICENSE) © Mykhailo Pidkhvatylin
