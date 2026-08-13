# Navigation guards

A route can declare a `beforeLoad` guard. Guards run **root → leaf** over the
matched chain **before any component commits**, so a blocked or redirected
navigation never flashes the target UI.

## Signature

```ts twoslash
type Awaitable<T> = T | Promise<T>;

interface GuardLocation {
  url: URL;
  params: Record<string, string>;
}

interface GuardContext {
  params: Record<string, string>;
  url: URL;
  pathname: string;
  navigationType: "reload" | "push" | "replace" | "traverse";
  /** Where the navigation came from, or `null` on the first load. */
  from: GuardLocation | null;
  /** Aborts when this navigation is superseded by a newer one. */
  signal: AbortSignal;
}

type BeforeLoad = (ctx: GuardContext) => Awaitable<void | boolean | string>;
```

## Return values

| Return            | Effect                                                |
| ----------------- | ----------------------------------------------------- |
| `undefined` / `true` | **Allow** the navigation.                          |
| `false`           | **Block** — the current URL is restored.              |
| `string`          | **Redirect** (via `replace`) to that **same-origin** path. |

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

::: warning Same-origin only
A redirect string must resolve to the **same origin**. If a guard returns a
cross-origin target (including protocol-relative `//host` or `javascript:` URLs),
the router throws instead of navigating and the snapshot moves to
`status: "error"` — this closes the open-redirect class where a user-derived
`?next=` could send visitors to an external site. Same-origin and relative paths
are unaffected.
:::

## Where the navigation came from: `from`

Every guard sees `ctx.from` — the location the user is **leaving**, as
`{ url, params }`, or `null` on the very first navigation after a page load.

```ts twoslash
import { createCoreRouter } from "@isorouter/core";

declare const Dashboard: unknown;
declare function track(event: string, data: unknown): void;
// ---cut---
const router = createCoreRouter([
  {
    path: "/dashboard",
    component: Dashboard,
    beforeLoad: ({ url, from }) => {
      // Referrer analytics — `from` is null on a cold load, so guard with `?.`
      track("nav", { to: url.pathname, from: from?.url.pathname ?? "(direct)" });

      // Origin-aware redirect: skip the intro when arriving from inside the app.
      if (from?.url.pathname.startsWith("/app")) return "/app/dashboard";
    },
  },
] as const);
```

`from` is the last location the router **committed** — never a navigation that
was blocked, redirected, or superseded mid-flight, so the next guard always sees
the location the user actually saw. A `not-found` or `error` landing *does*
count: the URL changed and the user is looking at that address.

::: tip Where from, not a leave-guard
`from` answers "where did we come from", not "may we leave". You can't cancel
the exit from here — by the time a guard runs, that navigation has already
started. It's also not a history direction: back vs. forward can't be inferred
from two URLs (use `navigationType` for `"traverse"`).
:::

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
