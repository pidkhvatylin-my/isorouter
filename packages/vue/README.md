# @isorouter/vue

[![npm version](https://img.shields.io/npm/v/%40isorouter%2Fvue.svg)](https://www.npmjs.com/package/@isorouter/vue)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Vue 3 bindings for
[`@isorouter/core`](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core) —
a lightweight SPA router built on the browser
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API).

`<RouterView>`, `<Outlet>`, `<Link>` and a handful of composables wrap the
core router's immutable-snapshot external store with `shallowRef`, so
navigation updates stay correct and reactive.

## Install

```sh
npm install @isorouter/vue
```

`@isorouter/core` is a regular dependency and is installed automatically.

### Requirements

- Vue ≥ 3.4.
- Everything in
  [`@isorouter/core`'s Requirements](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core#requirements) —
  notably the **Navigation API**. Load a polyfill if you need to support older
  engines, before `<RouterView>` mounts (it calls `router.start()` for you).

## Quick start

```ts
import { createApp, defineComponent, h } from "vue";
import { createRouter, RouterView, Outlet } from "@isorouter/vue";

const router = createRouter([
  { path: "/", component: Home },
  { path: "about", component: About },
  {
    path: "dashboard",
    component: DashboardLayout,
    children: [
      { index: true, component: Overview },
      { path: "settings", component: Settings },
    ],
  },
] as const);

const DashboardLayout = defineComponent({
  render: () => h("div", [h("h1", "Dashboard"), h(Outlet)]),
});

const App = defineComponent({
  render: () =>
    h(RouterView, { router }, { notFound: () => h("p", "Not found") }),
});

createApp(App).mount("#app");
```

`createRouter` is `createCoreRouter` with the component type fixed to Vue's
`Component`. `<RouterView>` calls `router.start()` on mount and
`router.stop()` on unmount.

## Components

### `<RouterView>`

Root component. Mount once near the app root and pass the router instance via
the `router` prop, with optional named slots:

```ts
h(
  RouterView,
  { router },
  {
    loading: () => h(Spinner),
    notFound: () => h(NotFound),
    error: ({ error }) => h(ErrorPage, { error }),
  },
);
```

- `router` — a `Router` instance from `createRouter`.
- `notFound` — rendered when `snapshot.status === "not-found"`.
- `error` — called with `{ error: snapshot.error }` when
  `snapshot.status === "error"`.
- `loading` — rendered whenever there's no matched root component yet (e.g.
  before the first commit) and neither `error` nor `notFound` applies.

Otherwise renders the root matched component, `snapshot.components[0]`.

### `<Outlet>`

Renders the next component in the matched chain at the current nesting depth.
Used inside a layout component to render its matched child route; renders
nothing when there is no matching child.

### `<Link>`

```ts
h(
  Link,
  { href: "/dashboard", activeClass: "active", exact: true },
  () => "Dashboard",
);
```

A plain `<a>` — the Navigation API intercepts the click, so modifier-clicks,
`target="_blank"` and downloads behave natively.

- `href` — the target path.
- `activeClass` — applied as the element's `class` when
  `router.isActive(href, { exact })` (default `"active"`).
- `exact` — passed through to `isActive`; when set, only an exact match is
  considered active.

When active, also sets `aria-current="page"`. Slot content (the default slot)
is rendered as the link's children.

Must be used within `<RouterView>`.

## Composables

All composables must be used within `<RouterView>` (they `inject` the router
instance provided there).

- **`useRouter()`** — the `Router` instance.
- **`useRouterState()`** — a `ShallowRef<RouterSnapshot>` holding the current
  snapshot; a fresh reference is assigned on every commit. The subscription
  is torn down automatically via `onScopeDispose`.
- **`useParams()`** — a `ComputedRef<Record<string, string>>` of the current
  route params.
- **`useLocation()`** — a `ComputedRef<URL>` of the current location.
- **`useNavigate()`** — `(to, opts?: { replace?: boolean; state?: unknown }) => void`
  delegating to `router.navigate`.

## Type-safe navigation

Declare routes `as const` and `router.navigate` / `useNavigate()` only accept
known paths — see
[`@isorouter/core`'s Type-safe navigation](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core#type-safe-navigation).

## License

[MIT](./LICENSE) © Mykhailo Pidkhvatylin
