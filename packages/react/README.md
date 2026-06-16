# @isorouter/react

[![npm version](https://img.shields.io/npm/v/%40isorouter%2Freact.svg)](https://www.npmjs.com/package/@isorouter/react)
[![minzip](https://img.shields.io/bundlephobia/minzip/%40isorouter%2Freact?label=gzip)](https://bundlephobia.com/package/@isorouter/react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

React bindings for
[`@isorouter/core`](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core) —
a lightweight SPA router built on the browser
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API).

`<Router>`, `<Outlet>`, `<Link>` and a handful of hooks wrap the core router's
immutable-snapshot external store with `useSyncExternalStore`, so navigation
re-renders stay correct and tear-free under React 18's concurrent renderer.

## Install

```sh
npm install @isorouter/react
```

`@isorouter/core` is a regular dependency and is installed automatically.

### Requirements

- React ≥ 18.
- Everything in
  [`@isorouter/core`'s Requirements](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core#requirements) —
  notably the **Navigation API**. Load a polyfill if you need to support older
  engines, before `<Router>` mounts (it calls `router.start()` for you).

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

- `router` — a `Router` instance from `createRouter`.
- `notFound` — rendered when `snapshot.status === "not-found"`.
- `error` — called with `snapshot.error` when `snapshot.status === "error"`.
- `loading` — rendered whenever there's no matched root component yet (e.g.
  before the first commit) and neither `error` nor `notFound` applies.

Otherwise renders the root matched component, `snapshot.components[0]`.

### `<Outlet>`

Renders the next component in the matched chain at the current nesting depth.
Used inside a layout component to render its matched child route; renders
nothing when there is no matching child.

### `<Link>`

```tsx
<Link href="/dashboard" activeClassName="active" exact>
  Dashboard
</Link>
```

A plain `<a>` — the Navigation API intercepts the click, so modifier-clicks,
`target="_blank"` and downloads behave natively. Extends
`AnchorHTMLAttributes<HTMLAnchorElement>` and forwards `ref` and any other
props.

- `href` — the target path.
- `activeClassName` — appended to `className` when
  `router.isActive(href, { exact })` (default `"active"`).
- `exact` — passed through to `isActive`; when set, only an exact match is
  considered active.

When active, also sets `aria-current="page"`.

## Hooks

All hooks must be used within `<Router>`.

- **`useRouter()`** — the `Router` instance.
- **`useRouterState()`** — the current `RouterSnapshot`, re-rendering on
  every commit (`useSyncExternalStore` under the hood).
- **`useParams<P>()`** — `snapshot.params`, typed as `P`.
- **`useLocation()`** — `snapshot.url`.
- **`useNavigate()`** — a referentially stable
  `(to, opts?: { replace?: boolean; state?: unknown }) => void` bound to
  `router.navigate`.

## Type-safe navigation

Declare routes `as const` and `router.navigate` / `useNavigate()` only accept
known paths — see
[`@isorouter/core`'s Type-safe navigation](https://github.com/pidkhvatylin-my/isorouter/tree/master/packages/core#type-safe-navigation).

## License

[MIT](./LICENSE) © Mykhailo Pidkhvatylin
