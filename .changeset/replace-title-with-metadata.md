---
"@isorouter/core": major
"@isorouter/react": major
"@isorouter/vue": major
"@isorouter/svelte": major
---

Replace `RouteConfig.title` with `RouteConfig.metadata`, and remove the core's
only DOM side effect.

Previously, a route's `title` (string or `(ctx: GuardContext) => string`) was
applied to `document.title` directly by the router on every commit — the
**deepest** route in the matched chain that declared `title` won, and nothing
was inherited from ancestors.

`title` is gone. In its place, `RouteConfig.metadata` carries an arbitrary,
user-defined bag of per-route data:

```ts
metadata?: RouteMetadata | ((ctx: MetadataContext) => RouteMetadata);
```

- `RouteMetadata` is an **empty** declaration-merging interface — nothing is
  privileged by core, not even `title`. Declare your own schema before any
  field is readable, always against `@isorouter/core`, even from an adapter:

  ```ts
  declare module "@isorouter/core" {
    interface RouteMetadata {
      title?: string;
      description?: string;
    }
  }
  ```

- `MetadataContext = { params, url, pathname }` — narrower than
  `GuardContext` (no `signal`, no `navigationType`): metadata functions must
  be **synchronous and pure**. They run just before the final commit emit, so
  they never fire for a blocked, redirected or aborted navigation.
- The matched chain's metadata is **shallow-merged root → leaf** into
  `snapshot.metadata` — a child's keys override its parent's, but a key the
  child doesn't set still comes from an ancestor. This is a **behaviour
  change** from `title`, which was strictly "deepest wins, nothing
  inherited."
- The core **no longer touches `document` at all**. Applying metadata — to
  `document.title`, to a head library, to anything — is now the app's job.
  New adapter accessors read the same `snapshot.metadata`: React
  `useMetadata()`, Vue `useMetadata(): ComputedRef<RouteMetadata>`, Svelte
  `router.metadata` (a getter on `SvelteRouter`).

## Migrating from `title`

Move `title:` to `metadata: { title: ... }` in your route configs, declare
the `RouteMetadata` schema once, and apply it yourself — the `onCommit`
option is the most direct replacement for the old built-in behaviour:

```ts
declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
  }
}

const router = createCoreRouter(routes, {
  onCommit: (snapshot) => {
    if (snapshot.metadata.title) document.title = snapshot.metadata.title;
  },
});
```

If you relied on the old deepest-wins-only semantics (no inheritance) and a
parent and child both declare `metadata`, note that the child now merges over
the parent instead of fully replacing it — set every key explicitly on the
leaf route if you need the old behaviour for a given field.

See the [Metadata & SEO guide](https://pidkhvatylin-my.github.io/isorouter/guide/metadata)
for the full merge rule and more recipes (your framework's own head API,
feeding a head library).
