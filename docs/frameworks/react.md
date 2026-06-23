# React

`@isorouter/react` wraps the core router's immutable-snapshot external store
with `useSyncExternalStore`, so navigation re-renders stay correct and tear-free
under React 18's concurrent renderer.

**Requires React ≥ 18.** `@isorouter/core` is installed automatically.

```sh
npm install @isorouter/react
```

## Quick start

```tsx
import { createRoot } from "react-dom/client";
import { createRouter, Router, Outlet } from "@isorouter/react";

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

function DashboardLayout() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <Router router={router} notFound={<p>Not found</p>} />,
);
```

`createRouter` is `createCoreRouter` with the component type fixed to a React
`ComponentType`. `<Router>` calls `router.start()` on mount and `router.stop()`
on unmount.

## Components

### `<Router>`

```tsx
<Router
  router={router}
  loading={<Spinner />}
  notFound={<NotFound />}
  error={(err) => <ErrorPage error={err} />}
/>
```

- `notFound` — rendered when `snapshot.status === "not-found"`.
- `error` — called with `snapshot.error` when `snapshot.status === "error"`.
- `loading` — when there's no matched root component yet (e.g. before the first
  commit) and neither `error` nor `notFound` applies.

Otherwise renders the root matched component, `snapshot.components[0]`.

### `<Outlet>`

Renders the next component in the matched chain at the current nesting depth;
renders nothing when there's no matching child. Use it inside a layout.

### `<Link>`

```tsx
<Link href="/dashboard" activeClassName="active" exact>
  Dashboard
</Link>
```

A plain `<a>` intercepted by the Navigation API — extends
`AnchorHTMLAttributes<HTMLAnchorElement>` and forwards `ref` and any other
props. `activeClassName` is appended to `className` when
`router.isActive(href, { exact })` (default `"active"`); when active, also sets
`aria-current="page"`. See [Links & active state](../guide/links).

## Hooks

All hooks must be used within `<Router>`.

| Hook                 | Returns                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| `useRouter()`        | the `Router` instance.                                                         |
| `useRouterState()`   | the current `RouterSnapshot`, re-rendering on every commit.                    |
| `useParams<P>()`     | `snapshot.params`, typed as `P`.                                               |
| `useLocation()`      | `snapshot.url`.                                                                |
| `useNavigate()`      | a referentially-stable `(to, opts?) => void` bound to `router.navigate`.       |

```tsx
import { useParams, useNavigate } from "@isorouter/react";

function User() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <button onClick={() => navigate("/")}>User {id} — go home</button>;
}
```

`useNavigate()` is referentially stable, so it's safe in `useEffect` dependency
arrays and `useCallback` bodies without re-subscribing.

## Module augmentation

Augmenting the `Register` interface narrows `useRouter()` and `useNavigate()`
to the **concrete** router type everywhere in the project — including across
package boundaries:

```ts
// router.ts
import { createRouter } from "@isorouter/react";

export const router = createRouter([
  { path: "/", component: Home },
  { path: "/about", component: About },
] as const);

declare module "@isorouter/react" {
  interface Register {
    router: typeof router;
  }
}
```

Place the `declare module` block in the same file as `createRouter`. TypeScript
merges it globally — `useNavigate()` in any component now accepts only
`"/"` or `"/about"`, and invalid paths become compile-time errors.

Without the augmentation `useRouter()` returns `AnyReactRouter` and
`useNavigate()` accepts any string, which is the same behaviour as before.

See [Type-safe navigation → Module augmentation](../guide/type-safe-navigation#module-augmentation).

## See also

- [Type-safe navigation](../guide/type-safe-navigation)
- [Nested layouts](../guide/nested-layouts)
- [`@isorouter/react` API reference](../api/react)
