# @isorouter/svelte

Svelte 5 adapter. **Requires Svelte ≥ 5.7.** For a walkthrough see the
[Svelte guide](../frameworks/svelte).

```sh
npm install @isorouter/svelte
```

## Exports

| Export             | Kind      | Description                                                            |
| ------------------ | --------- | --------------------------------------------------------------------- |
| `createRouter`     | function  | `createCoreRouter` with the component type fixed to Svelte's `Component`; returns a `SvelteRouter`. |
| `SvelteRouter`     | class     | The reactive wrapper around the core router.                          |
| `Router`           | component | Root component — calls `start`/`stop`, renders matched component or `loading`/`notFound`/`error` snippets. |
| `Outlet`           | component | Renders the next component in the matched chain; nothing if no child. |
| `Link`             | component | A plain `<a>` intercepted by the Navigation API.                      |
| `getRouter`        | function  | Reads the `SvelteRouter` from context (within `<Router>`/`<Outlet>`). |
| `lazy`             | function  | Re-exported from `@isorouter/core`.                                   |

## Types

`AnySvelteRouter`, `SvelteComponentType`, plus the core re-exports `BeforeLoad`,
`GuardContext`, `Href`, `NavTarget`, `RouteConfig`, `RouterOptions`,
`RouterSnapshot`.

## `<Router>` snippets

| Snippet     | Shown when                                                              |
| ----------- | --------------------------------------------------------------------- |
| `loading`   | no matched root component yet, and neither `error` nor `notFound` applies. |
| `notFound`  | `router.current.status === "not-found"`.                               |
| `error(err)`| `router.current.status === "error"` — receives `router.current.error`. |

## `<Link>` props

`href`, `class` (merged with `activeClass`), `activeClass` (default `"active"`),
`exact`. Sets `aria-current="page"` when active. Other attributes forwarded to
the `<a>`. See [Links & active state](../guide/links).

## `getRouter()`

Returns the `SvelteRouter`. `router.current` is a getter — read it inside a
`$derived`, `$effect` or the template to subscribe to commits; the subscription
drops once nothing reads it. `router.navigate`, `router.back`, `router.forward`
and `router.isActive` are available on the instance too.

> Bridge primitive: Svelte 5's `createSubscriber` — the subscription is live
> only while `current` is read in a reactive scope, and is auto-torn-down.
