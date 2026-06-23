# @isorouter/react

React adapter. **Requires React ≥ 18.** For a walkthrough see the
[React guide](../frameworks/react).

```sh
npm install @isorouter/react
```

## Exports

| Export            | Kind      | Description                                                            |
| ----------------- | --------- | --------------------------------------------------------------------- |
| `createRouter`    | function  | `createCoreRouter` with the component type fixed to a React `ComponentType`. |
| `Router`          | component | Root component — calls `start`/`stop`, renders matched component or `loading`/`notFound`/`error`. |
| `Outlet`          | component | Renders the next component in the matched chain; nothing if no child. |
| `Link`            | component | A plain `<a>` intercepted by the Navigation API; forwards `ref`.      |
| `useRouter`       | hook      | The `RegisteredRouter` instance.                                      |
| `useRouterState`  | hook      | Current `RouterSnapshot`, re-rendering on every commit.               |
| `useParams`       | hook      | `snapshot.params`, typed as `P`.                                      |
| `useLocation`     | hook      | `snapshot.url`.                                                       |
| `useNavigate`     | hook      | Referentially-stable `(to, opts?) => void`.                          |
| `lazy`            | function  | Re-exported from `@isorouter/core`.                                   |

## Types

`RouterProps`, `LinkProps`, `AnyReactRouter`, `ReactComponentType`, `Register`,
`RegisteredRouter`, plus the core re-exports `BeforeLoad`, `GuardContext`,
`Href`, `NavTarget`, `RouteConfig`, `RouterOptions`, `RouterSnapshot`.

Augment `Register` to narrow `useRouter()` and `useNavigate()` to the concrete
router type — see [Type-safe navigation](../guide/type-safe-navigation#module-augmentation).

## `<Router>` props

| Prop       | Type                          | Shown when                                            |
| ---------- | ----------------------------- | ---------------------------------------------------- |
| `router`   | `Router` instance             | —                                                    |
| `loading`  | `ReactNode`                   | no matched root component yet; no `error`/`notFound` applies. |
| `notFound` | `ReactNode`                   | `snapshot.status === "not-found"`.                   |
| `error`    | `(err: unknown) => ReactNode` | `snapshot.status === "error"`.                       |

## `<Link>` props

Extends `AnchorHTMLAttributes<HTMLAnchorElement>`. Adds `href`,
`activeClassName` (default `"active"`, appended to `className`) and `exact`. Sets
`aria-current="page"` when active. See [Links & active state](../guide/links).

## Hooks

All must be used within `<Router>`. `useNavigate()` is **referentially stable**,
so it's safe in dependency arrays without re-subscribing.

> Bridge primitive: `useSyncExternalStore(subscribe, getSnapshot)` — detects
> change via `Object.is(prev, next)`, which the immutable-snapshot contract
> satisfies with a fresh reference per commit.
