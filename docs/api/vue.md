# @isorouter/vue

Vue 3 adapter. **Requires Vue ≥ 3.4.** For a walkthrough see the
[Vue guide](../frameworks/vue).

```sh
npm install @isorouter/vue
```

## Exports

| Export            | Kind        | Description                                                            |
| ----------------- | ----------- | --------------------------------------------------------------------- |
| `createRouter`    | function    | `createCoreRouter` with the component type fixed to Vue's `Component`. |
| `RouterView`      | component   | Root component — calls `start`/`stop`, renders matched component or `loading`/`notFound`/`error` slots. |
| `Outlet`          | component   | Renders the next component in the matched chain; nothing if no child. |
| `Link`            | component   | A plain `<a>` intercepted by the Navigation API.                      |
| `useRouter`       | composable  | The `Router` instance.                                                |
| `useRouterState`  | composable  | `ShallowRef<RouterSnapshot>`; fresh reference on every commit.        |
| `useParams`       | composable  | `ComputedRef<Record<string, string>>`.                               |
| `useLocation`     | composable  | `ComputedRef<URL>`.                                                   |
| `useNavigate`     | composable  | `(to, opts?) => void` delegating to `router.navigate`.               |
| `lazy`            | function    | Re-exported from `@isorouter/core`.                                   |

## Types

Core re-exports: `BeforeLoad`, `GuardContext`, `Href`, `NavTarget`,
`RouteConfig`, `RouterOptions`, `RouterSnapshot`.

## `<RouterView>` slots

| Slot       | Shown when                                                              |
| ---------- | --------------------------------------------------------------------- |
| `loading`  | no matched root component yet; no `error`/`notFound` applies.          |
| `notFound` | `snapshot.status === "not-found"`.                                     |
| `error`    | `snapshot.status === "error"` — receives `{ error: snapshot.error }`.  |

## `<Link>` props

`href`, `activeClass` (default `"active"`, applied as the element's `class`),
`exact`. Sets `aria-current="page"` when active; default slot is rendered as the
link's children. Must be used within `<RouterView>`. See
[Links & active state](../guide/links).

## Composables

All must be used within `<RouterView>` (they `inject` the provided router).
`useRouterState()`'s subscription is torn down automatically via
`onScopeDispose`.

> Bridge primitive: `shallowRef(snapshot)` + `subscribe` — the snapshot is
> already immutable, so shallow-ref replacement is exactly right (no deep proxy).
