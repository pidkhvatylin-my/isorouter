# Migrating from v1

v2 removes the only DOM side effect in `@isorouter/core`: the router no longer
writes `document.title` for you. The narrow `title` route field is replaced by
a general `metadata` bag that the router carries but never interprets — see
[Route metadata](./routing#route-metadata).

## The type migration is mechanical

```ts
// v1
{ path: "about", title: "About", component: About }
{ path: "users/:id", title: (ctx) => `User #${ctx.params.id}`, component: User }

// v2
{ path: "about", metadata: { title: "About" }, component: About }
{
  path: "users/:id",
  metadata: (ctx) => ({ title: `User #${ctx.params.id}` }),
  component: User,
}
```

The `metadata` function receives `MetadataContext` — `params`, `url`,
`pathname` — a narrower type than `GuardContext` (no `signal`, `navigationType`,
or `from`, since it isn't part of the guard pipeline).

## The one line you must add: `onCommit`

This is the part that isn't just a find-and-replace. In v1, the core wrote
`document.title` for you automatically. In v2, **nothing** does that anymore —
`metadata` is inert data until your app acts on it:

```ts
const router = createRouter(routes, {
  onCommit: (snapshot) => {
    if (typeof snapshot.metadata.title === "string")
      document.title = snapshot.metadata.title;
  },
});
```

::: warning Skipping `onCommit` is a silent regression
There is no compile error, no runtime warning — your routes still typecheck
and your app still runs. The document title just quietly stops updating on
navigation. If your `title` fields survived the mechanical rename but your
tab titles stopped changing, this is why: add the `onCommit` above.
:::

`onCommit` fires for every snapshot the router settles on, including
`not-found` and `error` — so the same handler can retitle a 404 instead of
leaving the previous page's title in the tab:

```ts
onCommit: (snapshot) => {
  if (snapshot.status === "not-found") {
    document.title = "Page not found";
    return;
  }

  if (typeof snapshot.metadata.title === "string")
    document.title = snapshot.metadata.title;
};
```

A navigation that a guard blocks or redirects never settles, so it never fires
`onCommit` — you won't see a title flash for a page the user never reached.

## Optional: type your metadata keys

`RouteMetadata` is empty by design — augment it via declaration merging so
`metadata` and `snapshot.metadata` are typed everywhere in your project:

```ts
declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
  }
}
```

This types the keys you declare — `metadata: { title: 123 }` is an error. It
does **not** turn `metadata` into a closed shape: `RouteMetadata` inherits an
index signature so any other key stays legal, a misspelled `titel` included.
That is the price of letting `metadata` work without augmentation at all.

(Adapters re-export `RouteMetadata`, so augment `@isorouter/react`,
`@isorouter/vue` or `@isorouter/svelte` instead if you don't depend on
`@isorouter/core` directly.)

## Reading metadata in components

React and Vue gained a `useMetadata()` hook/composable mirroring
`useParams()`/`useLocation()`. Svelte needs no new API —
`router.current.metadata` is already reactive. See the
[core API reference](../api/core#routemetadata-metadatacontext) for the full
`RouteMetadata` / `MetadataContext` surface.
