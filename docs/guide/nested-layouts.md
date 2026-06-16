# Nested layouts

A route with `children` becomes a **layout**: its `component` renders, and you
place an `<Outlet>` where the matched child should appear. The matched chain is
rendered root → leaf, each layout pulling in the next via its `Outlet`.

::: info Why layouts persist
Layout component **identity is stable** across child navigations — navigating
from `/dashboard/overview` to `/dashboard/settings` keeps the same
`DashboardLayout` instance mounted (and its state, scroll, focus). Only the
`<Outlet>` content swaps.
:::

## Example

::: code-group

```svelte [Svelte 5]
<!-- DashboardLayout.svelte -->
<script lang="ts">
  import { Outlet } from "@isorouter/svelte";
</script>

<h1>Dashboard</h1>
<Outlet />
```

```tsx [React]
import { Outlet } from "@isorouter/react";

function DashboardLayout() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet />
    </div>
  );
}
```

```ts [Vue 3]
import { defineComponent, h } from "vue";
import { Outlet } from "@isorouter/vue";

const DashboardLayout = defineComponent({
  render: () => h("div", [h("h1", "Dashboard"), h(Outlet)]),
});
```

:::

Wire it up with `children`. An `index` route renders at the layout's own URL:

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

## Behaviour notes

- `<Outlet>` renders the next component in the matched chain at the current
  nesting depth, and **renders nothing** when there is no matching child.
- A matched parent **with no matching child** still resolves on its own if the
  path is fully consumed (e.g. `/dashboard` with no `index` route just renders
  the layout with an empty `Outlet`).
- Routes with no `component` are matched as **pass-through** layouts — they
  group children under a path prefix without adding to `snapshot.components`.
