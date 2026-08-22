# Metadata & SEO

A route can carry arbitrary `metadata` — a title, a description, `og:*` tags,
`robots`, a canonical URL, anything SEO- or head-related. The router **carries
and merges** this bag onto `snapshot.metadata`; it never interprets it or
touches `document` itself. Applying it — to `document.title`, to a `<meta>`
tag, to a head library — is your app's job.

## Declare your schema first

`RouteMetadata` ships as an **empty** interface. Nothing is privileged by
core, not even `title`. Before any field is readable, declare it via module
augmentation — always against `@isorouter/core`, even if you're using an
adapter package:

```ts twoslash
import "@isorouter/core";

declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
    description?: string;
  }
}
```

This is mandatory, not optional: an object literal like
`{ title: "About" }` still assigns to `{}` without error, but **reading**
`snapshot.metadata.title` is a compile error until the interface above is
merged in. Put the `declare module` block in a file that's part of your
program (e.g. next to where you create the router) — TypeScript merges it
globally from there.

## Declaring metadata on a route

```ts twoslash
declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
    description?: string;
  }
}
import { createCoreRouter } from "@isorouter/core";

declare const About: unknown;
// ---cut---
const router = createCoreRouter([
  {
    path: "/about",
    component: About,
    metadata: { title: "About", description: "Who we are" },
  },
] as const);
```

`metadata` can also be a **synchronous, pure** function of `MetadataContext`
— narrower than [`GuardContext`](../api/core#guardcontext-beforeload): just
`params`, `url` and `pathname`, no `signal` or `navigationType`, because a
metadata function must be synchronous:

```ts twoslash
declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
  }
}
import { createCoreRouter } from "@isorouter/core";

declare const Concerts: unknown;
// ---cut---
const router = createCoreRouter([
  {
    path: "/concerts/:city",
    component: Concerts,
    metadata: (ctx) => ({
      title: `Concerts in ${ctx.params.city}`,
    }),
  },
] as const);
```

Metadata functions are evaluated **just before the final commit emit** — they
never run for a navigation that's blocked, redirected, or superseded/aborted
by a newer one.

## Merge rule: shallow, root → leaf

Every route in the matched chain that declares `metadata` contributes to
`snapshot.metadata`, merged **root → leaf** with `Object.assign`-style shallow
semantics: a child's keys **override** the parent's same-named keys, but keys
the child doesn't set still come from the parent (or an ancestor further up).

```ts twoslash
declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
    section?: string;
  }
}
import { createCoreRouter } from "@isorouter/core";

declare const AppLayout: unknown;
declare const Settings: unknown;
// ---cut---
const router = createCoreRouter([
  {
    path: "/",
    component: AppLayout,
    metadata: { section: "app" },
    children: [
      // snapshot.metadata === { section: "app", title: "Settings" }
      { path: "settings", component: Settings, metadata: { title: "Settings" } },
    ],
  },
] as const);
```

::: warning Behaviour change from `title`
This is a deliberate change from the 1.x `title` field, which was strictly
"deepest wins, nothing inherited". `metadata` inherits by default because it's
a general-purpose bag (a shared `og:site_name` or `section` at the root is a
common case); the merge is shallow, not deep — nested objects are replaced
wholesale, not recursively merged. That's Nuxt/unhead territory, not this
router's job.
:::

A route with no `metadata` (and no matching ancestor) resolves to `{}` — the
same empty object every time, so it never breaks referential-equality checks
downstream. `not-found` and `error` snapshots also reset `metadata` to `{}`.

## Applying metadata

isorouter never touches `document`. Pick whichever of these fits your stack —
they all read from the same `snapshot.metadata` / `useMetadata()`.

### `onCommit` (framework-agnostic)

The simplest option, and the direct migration path from 1.x's `title`:

```ts twoslash
declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
  }
}
import { createCoreRouter } from "@isorouter/core";

declare const Home: unknown;
// ---cut---
const router = createCoreRouter([{ path: "/", component: Home }] as const, {
  onCommit: (snapshot) => {
    if (snapshot.metadata.title) document.title = snapshot.metadata.title;
  },
});
```

### A framework effect

React:

```tsx
import { useEffect } from "react";
import { useMetadata } from "@isorouter/react";

function TitleEffect() {
  const metadata = useMetadata();
  useEffect(() => {
    if (metadata.title) document.title = metadata.title;
  }, [metadata.title]);
  return null;
}
```

Vue:

```vue
<script setup lang="ts">
import { watchEffect } from "vue";
import { useMetadata } from "@isorouter/vue";

const metadata = useMetadata();
watchEffect(() => {
  if (metadata.value.title) document.title = metadata.value.title;
});
</script>
```

Svelte:

```svelte
<script lang="ts">
  import { getRouter } from "@isorouter/svelte";

  const router = getRouter();

  $effect(() => {
    if (router.metadata.title) document.title = router.metadata.title;
  });
</script>
```

### Feeding a head library

`snapshot.metadata` (or `useMetadata()`) is just data — pass it straight into
whatever head-management library you already use (`@unhead/*`,
`react-helmet-async`, `@vueuse/head`, …), extending your `RouteMetadata`
schema with the fields that library expects (`og:*`, `robots`, `link`
entries, and so on).

## See also

- [Routing & matching](./routing) — where `metadata` sits in `RouteConfig`.
- [`@isorouter/core` API reference](../api/core#metadata-types) — full type
  signatures.
- Framework adapter guides for `useMetadata()` /
  `router.metadata`: [React](../frameworks/react#route-metadata),
  [Vue](../frameworks/vue#route-metadata),
  [Svelte](../frameworks/svelte#route-metadata).
