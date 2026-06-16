# Navigation guards

A route can declare a `beforeLoad` guard. Guards run **root → leaf** over the
matched chain **before any component commits**, so a blocked or redirected
navigation never flashes the target UI.

## Signature

```ts twoslash
type Awaitable<T> = T | Promise<T>;

interface GuardContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
  /** Aborts when this navigation is superseded by a newer one. */
  signal: AbortSignal;
  navigationType: "reload" | "push" | "replace" | "traverse";
}

type BeforeLoad = (ctx: GuardContext) => Awaitable<void | boolean | string>;
```

## Return values

| Return            | Effect                                                |
| ----------------- | ----------------------------------------------------- |
| `undefined` / `true` | **Allow** the navigation.                          |
| `false`           | **Block** — the current URL is restored.              |
| `string`          | **Redirect** (via `replace`) to that path.            |

```ts twoslash
import { createCoreRouter } from "@isorouter/core";

declare const Dashboard: unknown;
declare function isLoggedIn(): boolean;
// ---cut---
const router = createCoreRouter([
  {
    path: "/dashboard",
    component: Dashboard,
    beforeLoad: () => {
      if (!isLoggedIn()) return "/login"; // redirect
    },
  },
] as const);
```

## Async guards & the abort signal

Guards can be `async`. Because navigations can be superseded (the user clicks
another link mid-flight), the context carries an `AbortSignal` that fires when
**this** navigation is no longer the latest. Forward it to `fetch` and bail out
on abort:

```ts twoslash
import { createCoreRouter } from "@isorouter/core";

declare const Profile: unknown;
// ---cut---
const router = createCoreRouter([
  {
    path: "/profile/:id",
    component: Profile,
    beforeLoad: async (ctx) => {
      const res = await fetch(`/api/users/${ctx.params.id}`, {
        signal: ctx.signal,
      });
      if (res.status === 404) return false; // block: restore current URL
    },
  },
] as const);
```

::: tip
Guards run **root → leaf**: a parent layout's guard runs before its children's.
This makes the parent the natural place for shared auth checks — children only
add what's specific to them.
:::

## Errors

If a guard throws (or a lazy import rejects), the snapshot transitions to
`status: "error"` and `snapshot.error` holds the thrown value. The adapters
render their `error` slot/prop for it — see the framework guides. You can also
observe errors globally via the `onError` [option](../api/core#options).
