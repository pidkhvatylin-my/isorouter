# Links & active state

## `<Link>`

Every adapter ships a `<Link>` that renders a **plain `<a>`**. The Navigation
API intercepts the click natively, so **modifier-clicks** (⌘/Ctrl/Shift),
**`target="_blank"`** and **downloads** all behave correctly — for free, with
no special-casing in isorouter.

::: code-group

```svelte [Svelte 5]
<Link href="/dashboard" activeClass="active" exact>Dashboard</Link>
```

```tsx [React]
<Link href="/dashboard" activeClassName="active" exact>
  Dashboard
</Link>
```

```ts [Vue 3]
import { h } from "vue";
import { Link } from "@isorouter/vue";

h(Link, { href: "/dashboard", activeClass: "active", exact: true }, () =>
  "Dashboard",
);
```

:::

### Props

| Prop                                  | Description                                                            |
| ------------------------------------- | --------------------------------------------------------------------- |
| `href`                                | The target path.                                                      |
| `activeClass` / `activeClassName` (React) | Class applied when the link is active (default `"active"`).        |
| `exact`                               | When set, only an **exact** match counts as active.                   |

When active, `<Link>` also sets `aria-current="page"`. All other attributes are
forwarded to the underlying `<a>`. Note the prop name difference: React uses
`activeClassName`, Svelte and Vue use `activeClass`.

## Programmatic active checks

The router exposes `isActive` for building your own active UI — it's also what
`<Link>` uses internally:

```ts twoslash
import { createCoreRouter } from "@isorouter/core";
const router = createCoreRouter([{ path: "/concerts/:city" }] as const);
// ---cut---
router.isActive("/concerts"); // true for "/concerts" AND "/concerts/kyiv"
router.isActive("/concerts", { exact: true }); // true only for "/concerts"
```

By default `isActive(path)` is a **prefix** match (a parent link stays active
while you're on its children); pass `{ exact: true }` to require an exact match.
