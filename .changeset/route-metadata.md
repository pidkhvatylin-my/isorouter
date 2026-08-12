---
"@isorouter/core": major
"@isorouter/react": major
"@isorouter/svelte": major
"@isorouter/vue": major
---

Replace the route `title` field with a general `metadata` bag, and remove the
core's only DOM side effect: it no longer writes `document.title`.

**BREAKING CHANGE**

- `RouteConfig["title"]` (`string | ((ctx: GuardContext) => string)`) is
  removed. Use `RouteConfig["metadata"]`
  (`RouteMetadata | ((ctx: MetadataContext) => RouteMetadata)`) instead —
  merged root → leaf across the matched chain, deeper routes override keys.
  The migration is mostly mechanical: `title: "X"` → `metadata: { title: "X" }`,
  `title: (ctx) => f(ctx)` → `metadata: (ctx) => ({ title: f(ctx) })`.
- `@isorouter/core` no longer sets `document.title` on commit. Nothing does,
  by design — wire it up yourself via the now-mandatory `onCommit`:
  ```ts
  createRouter(routes, {
    onCommit: (snapshot) => {
      if (typeof snapshot.metadata.title === "string")
        document.title = snapshot.metadata.title;
    },
  });
  ```
  Skipping this is a **silent** regression: there's no compile error, your app
  still runs, the document title just stops updating on navigation.
- `RouterSnapshot["metadata"]` (`RouteMetadata`) is added. `RouteMetadata` is
  empty by design (`{}`) — augment it via declaration merging to type the keys
  your app uses. Note the inherited index signature keeps unknown keys legal,
  so augmenting types the keys you declare but won't catch a misspelled one.
- `onCommit` now fires for **every** snapshot the router settles on, including
  `not-found` and `error` landings; previously it fired only on success. This
  is what lets the `onCommit` above retitle a 404 instead of leaving the
  previous page's title in the tab. Navigations a guard blocks or redirects
  still never fire it. If your handler assumed `status === "idle"`, branch on
  `snapshot.status`.
- React and Vue gain `useMetadata()` mirroring `useParams()`/`useLocation()`.
  Svelte needs no new API: `router.current.metadata` is already reactive.

See the [migration guide](https://pidkhvatylin-my.github.io/isorouter/guide/migration)
for the full walkthrough.
