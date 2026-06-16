# Quick start

A running router in a few lines. Pick your framework below — the route config
shape is identical across all of them.

## Core (any framework / none)

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

router.subscribe((snapshot) => render(snapshot));
router.start();

function render(snapshot: unknown) {}
```

`createCoreRouter` is a thin wrapper around `new Router(routes, options)`. It
returns an [external store](./introduction#why-this-shape) you can subscribe
to; `router.start()` begins intercepting same-origin navigations.

## With a framework

::: code-group

```svelte [Svelte 5]
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

```tsx [React]
import { createRoot } from "react-dom/client";
import { createRouter, Router } from "@isorouter/react";

const router = createRouter([
  { path: "/", component: Home },
  { path: "about", component: About },
] as const);

createRoot(document.getElementById("root")!).render(
  <Router router={router} notFound={<p>Not found</p>} />,
);
```

```ts [Vue 3]
import { createApp, defineComponent, h } from "vue";
import { createRouter, RouterView } from "@isorouter/vue";

const router = createRouter([
  { path: "/", component: Home },
  { path: "about", component: About },
] as const);

const App = defineComponent({
  render: () =>
    h(RouterView, { router }, { notFound: () => h("p", "Not found") }),
});

createApp(App).mount("#app");
```

:::

`createRouter` is `createCoreRouter` with the component type fixed to your
framework's component type. The root component (`<Router>` / `<RouterView>`)
calls `router.start()` on mount and `router.stop()` on unmount, so you never
manage the lifecycle by hand.

## Where to go next

- [Routing & matching](./routing) — params, splats, index routes, priority.
- [Navigation guards](./guards) — `beforeLoad`, redirects, abort signals.
- [Nested layouts](./nested-layouts) — `children` + `<Outlet>`.
- Per-framework walkthroughs: [Svelte](../frameworks/svelte),
  [React](../frameworks/react), [Vue](../frameworks/vue).
