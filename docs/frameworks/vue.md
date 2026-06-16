# Vue 3

`@isorouter/vue` wraps the core router's immutable-snapshot external store with
`shallowRef`, so navigation updates stay correct and reactive. The snapshot is
already immutable, so shallow-ref replacement is exactly right — no deep proxy.

**Requires Vue ≥ 3.4.** `@isorouter/core` is installed automatically.

```sh
npm install @isorouter/vue
```

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
`Component`. `<RouterView>` calls `router.start()` on mount and `router.stop()`
on unmount.

::: tip SFC templates
The examples here use the render-function form so they're framework-portable,
but everything works identically in `<template>` SFCs:
`<RouterView :router="router">`, `<Outlet />`, `<Link href="/about">`.
:::

## Components

### `<RouterView>`

Root component. Mount once near the app root and pass the router via the
`router` prop, with optional named slots:

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

- `notFound` — rendered when `snapshot.status === "not-found"`.
- `error` — called with `{ error: snapshot.error }` when status is `"error"`.
- `loading` — when there's no matched root component yet (e.g. before the first
  commit) and neither `error` nor `notFound` applies.

Otherwise renders the root matched component, `snapshot.components[0]`.

### `<Outlet>`

Renders the next component in the matched chain at the current nesting depth;
renders nothing when there's no matching child. Use it inside a layout.

### `<Link>`

```ts
h(Link, { href: "/dashboard", activeClass: "active", exact: true }, () =>
  "Dashboard",
);
```

A plain `<a>` intercepted by the Navigation API. `activeClass` is applied as the
element's `class` when `router.isActive(href, { exact })` (default `"active"`);
when active, also sets `aria-current="page"`. Slot content is rendered as the
link's children. Must be used within `<RouterView>`. See
[Links & active state](../guide/links).

## Composables

All composables must be used within `<RouterView>` (they `inject` the router
provided there).

| Composable           | Returns                                                                |
| -------------------- | --------------------------------------------------------------------- |
| `useRouter()`        | the `Router` instance.                                                 |
| `useRouterState()`   | a `ShallowRef<RouterSnapshot>`; fresh reference on every commit.       |
| `useParams()`        | a `ComputedRef<Record<string, string>>` of the current params.        |
| `useLocation()`      | a `ComputedRef<URL>` of the current location.                          |
| `useNavigate()`      | `(to, opts?) => void` delegating to `router.navigate`.                 |

`useRouterState()`'s subscription is torn down automatically via
`onScopeDispose`.

## See also

- [Type-safe navigation](../guide/type-safe-navigation)
- [Nested layouts](../guide/nested-layouts)
- [`@isorouter/vue` API reference](../api/vue)
