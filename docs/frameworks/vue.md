# Vue 3

`@isorouter/vue` wraps the core router's immutable-snapshot external store with
`shallowRef`, so navigation updates stay correct and reactive. The snapshot is
already immutable, so shallow-ref replacement is exactly right — no deep proxy.

**Requires Vue ≥ 3.4.** `@isorouter/core` is installed automatically.

```sh
npm install @isorouter/vue
```

::: tip Live demo
A full working demo with guards, lazy loading, nested layouts and type-safe
navigation is available on
[StackBlitz](https://stackblitz.com/github/pidkhvatylin-my/isorouter/tree/master/demos/vue)
— every key concept is annotated inline.
:::

## Quick start

Create the router in a dedicated file and import it wherever it's needed:

```ts
// router.ts
import { createRouter } from "@isorouter/vue";
import AppLayout from "./AppLayout.vue";
import DashboardLayout from "./DashboardLayout.vue";
import Home from "./Home.vue";
import Overview from "./Overview.vue";

export const router = createRouter([
  {
    path: "/",
    component: AppLayout,
    children: [
      { index: true, component: Home },
      {
        path: "dashboard",
        component: DashboardLayout,
        children: [{ index: true, component: Overview }],
      },
    ],
  },
] as const); // `as const` is required for type-safe navigation

// Module augmentation — see below
declare module "@isorouter/vue" {
  interface Register {
    router: typeof router;
  }
}
```

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { RouterView } from "@isorouter/vue";
import { router } from "./router";
</script>

<template>
  <RouterView :router="router">
    <template #notFound><p>Not found</p></template>
  </RouterView>
</template>
```

```vue
<!-- DashboardLayout.vue -->
<script setup lang="ts">
import { Outlet } from "@isorouter/vue";
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <Outlet />
  </div>
</template>
```

`createRouter` is `createCoreRouter` with the component type fixed to Vue's
`Component`. `<RouterView>` calls `router.start()` on mount and `router.stop()`
on unmount.

## Components

### `<RouterView>`

Root component. Mount once near the app root and pass the router via the
`router` prop, with optional named slots:

```vue
<script setup lang="ts">
import { RouterView } from "@isorouter/vue";
import { router } from "./router";
</script>

<template>
  <RouterView :router="router">
    <template #loading><Spinner /></template>
    <template #notFound><NotFound /></template>
    <template #error="{ error }"><ErrorPage :error="error" /></template>
  </RouterView>
</template>
```

- `notFound` — rendered when `snapshot.status === "not-found"`.
- `error` — receives `{ error: snapshot.error }` when status is `"error"`.
- `loading` — when there's no matched root component yet (e.g. before the first
  commit) and neither `error` nor `notFound` applies.

Otherwise renders the root matched component, `snapshot.components[0]`.

### `<Outlet>`

Renders the next component in the matched chain at the current nesting depth;
renders nothing when there's no matching child. Use it inside a layout:

```vue
<!-- DashboardLayout.vue -->
<script setup lang="ts">
import { Outlet } from "@isorouter/vue";
</script>

<template>
  <h1>Dashboard</h1>
  <Outlet />
</template>
```

The layout component **stays mounted** across child navigations — only the
`<Outlet>` content swaps. See [Nested layouts](../guide/nested-layouts).

### `<Link>`

```vue
<script setup lang="ts">
import { Link } from "@isorouter/vue";
</script>

<template>
  <Link href="/dashboard" activeClass="active" exact>Dashboard</Link>
</template>
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

```vue
<script setup lang="ts">
import { useParams, useNavigate } from "@isorouter/vue";

// useParams() returns ComputedRef<Record<string, string>>;
// Vue auto-unwraps refs in templates, so params.id works directly.
const params = useParams();
const navigate = useNavigate();
</script>

<template>
  <button @click="navigate('/')">User {{ params.id }} — go home</button>
</template>
```

`useRouterState()`'s subscription is torn down automatically via
`onScopeDispose`.

## Module augmentation

Augmenting the `Register` interface narrows `useRouter()` and `useNavigate()`
to the **concrete** router type everywhere in the project:

```ts
// router.ts
import { createRouter } from "@isorouter/vue";

export const router = createRouter([
  { path: "/", component: Home },
  { path: "/about", component: About },
] as const);

declare module "@isorouter/vue" {
  interface Register {
    router: typeof router;
  }
}
```

Place the `declare module` block in the same file as `createRouter`. TypeScript
merges it globally — `useNavigate()` in any composable or component now accepts
only `"/"` or `"/about"`, and invalid paths become compile-time errors.

Without the augmentation `useRouter()` returns `AnyVueRouter` and
`useNavigate()` accepts any string, which is the same behaviour as before.

See [Type-safe navigation → Module augmentation](../guide/type-safe-navigation#module-augmentation).

## See also

- [Type-safe navigation](../guide/type-safe-navigation)
- [Nested layouts](../guide/nested-layouts)
- [`@isorouter/vue` API reference](../api/vue)
