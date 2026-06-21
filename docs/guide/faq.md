<!--
  WORKING DOC — internal notes (HTML comments are stripped from the built site).

  This FAQ is a living scratchpad we iterate on. TODO before it's "done":
    - Add adapter-specific Q&A (Svelte snippet vs React prop differences).
    - Add a StackBlitz/demo link once published.
    - Revisit the "404 / catch-all" answer if the 2.0 per-route notFound lands
      (currently documents the `*`-route approach, which works today).
    - Trim/merge once real user questions come in from the public launch.
  Keep everything here publicly safe — no unreleased security details.
-->

# FAQ

Common questions, and the design rationale behind the answers. If something
here is unclear or missing, [open an issue](https://github.com/pidkhvatylin-my/isorouter/issues).

## General

### Why another router?

isorouter delegates everything the browser now does natively — click
interception, history entries, scroll restoration, focus management — to the
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API),
and keeps only what a router *must* own: matching, guards, lazy-loading and an
async commit state machine. The result is a **~1.8 KB gzipped core with zero
runtime dependencies** that serves Svelte, React and Vue from one
implementation. See [What is isorouter?](./introduction) for the architecture.

### Is it production-ready?

The core API is stable as of `1.x` and covered by unit, property-based and
cross-browser e2e tests (the e2e suite runs twice — once against the native
Navigation API, once against the polyfill — to verify parity). The honest
caveat is reach: the Navigation API is [Baseline 2026](./browser-support), so
without a polyfill your audience is modern browsers only.

### Does it do server-side rendering?

**No — by design.** isorouter is a client-side SPA router built on a browser
API that doesn't exist on the server. If you need SSR/SSG, use a meta-framework
(SvelteKit, Next, Nuxt) — that's a different layer of the stack.

### Does it have data loading / loaders?

**No — by design.** There is no loader/action layer. Fetch data inside your
components or in a `beforeLoad` guard (which can `await`). Keeping data-fetching
out of the router is what keeps the core tiny and framework-agnostic.

### Does it parse or validate search params?

**No.** You get the raw [`URL`](https://developer.mozilla.org/docs/Web/API/URL)
in `snapshot.url` and `ctx.url`, so use `url.searchParams` directly. A typed
search-param schema is a deliberate non-goal — it's a large feature that pulls
the core away from "thin layer over the platform."

## Browser support & polyfill

### Why the Navigation API and not the History API?

The History API gives you `pushState` and a `popstate` event — and nothing
else. Click interception, scroll restoration, focus, and a coherent async
"navigation in progress → commit/abort" model all have to be reimplemented on
top of it (which is most of what large routers *are*). The Navigation API
provides all of that natively, so the router shrinks to orchestration. See
[Browser support](./browser-support).

### Which browsers are supported?

The Navigation API reached **Baseline Newly available** in early 2026 (Chrome,
Edge, Firefox, Safari). It is not yet *Widely available*, so engines older than
that need a polyfill.

### When do I need a polyfill?

Only if you must support browsers without the Navigation API. isorouter ships
**no History API fallback** — load [`@virtualstate/navigation`](https://github.com/virtualstate/navigation)
before `router.start()` if you need older-engine support. The exact snippet and
a known link-click limitation are documented in [Browser support](./browser-support).

## Routing & matching

### Which route wins when several match?

Most specific wins, regardless of declaration order: **index > static segment >
`:param` > `*` splat**. Equal-specificity siblings fall back to declaration
order (first wins). See [Routing & matching](./routing).

### Is matching case-sensitive?

**Yes.** `/Users` does not match `/users`. This differs from react-router
(case-insensitive by default) and is intentional: URLs are case-sensitive per
spec, and implicit case-folding hides real routing bugs.

### How are trailing and duplicate slashes handled?

They're normalized away on **both** the route and the pathname — `/a/b`,
`/a/b/` and `//a//b//` all match a route declared as `a/b`. Matching is done on
non-empty segments, so empty tokens never matter.

### Does it support optional params like `:title?`?

**No — use a nested route with an `index` child instead:**

```ts
{
  path: "books/:genre",
  children: [
    { index: true, component: GenreList },    // /books/scifi
    { path: ":title", component: BookDetail }, // /books/scifi/dune
  ],
}
```

This is more expressive than an optional param (distinct components per case
instead of one component branching on `params.title`), keeps the type-safe
`Href` union exact, and keeps the matcher a single forward pass. See
[Nested layouts](./nested-layouts).

### Does it support regex routes?

**No.** Routes are plain segment patterns (`:param`, `*`). Regex routes would
defeat the compile-time `Href`/`NavTarget` typing, which is a core feature.

### How do I add a 404 / catch-all page?

Declare a `*` route. At the root it catches anything unmatched; as a child it
catches anything unmatched **within that subtree** (rendering inside the
parent's layout):

```ts
[
  { path: "/", component: Home },
  {
    path: "dashboard",
    component: DashboardLayout,
    children: [
      { path: "settings", component: Settings },
      { path: "*", component: DashboardNotFound }, // 404 inside the dashboard
    ],
  },
  { path: "*", component: NotFound }, // global 404
]
```

If nothing matches and you declared no `*` route, the snapshot reports
`status: "not-found"` and renders nothing.

### What happens to encoded slashes (`%2F`) in a param?

They're decoded — `/users/a%2Fb` captures `{ id: "a/b" }`. The segment is one
path segment that happens to contain a slash after decoding; it is **not** split
into two. (This differs from routers built on `decodeURI`, which leave `%2F`
encoded.) Param values are decoded with a guard, so malformed percent-encoding
like a lone `%` never throws — it falls back to the raw text.

### Can a param value contain spaces or special characters?

Yes. `/:name` matches `/John%20Doe` → `{ name: "John Doe" }`, and characters
like `-`, `_`, `$`, `&` pass through untouched.

## Framework adapters

### Can I use it without a framework?

Yes — `@isorouter/core` is fully usable on its own. Call `router.subscribe()`
and read `getSnapshot()`; the adapters are thin wrappers over exactly that.

### Why one core and three adapters instead of three routers?

The core publishes an **immutable snapshot with a fresh reference on every
commit**. That's the lowest common denominator across reactivity systems, so
each adapter just bridges it with the framework's native primitive
(`useSyncExternalStore` / `createSubscriber` / `shallowRef`). See
[Why this shape](./introduction#why-this-shape) for why a Proxy-based core was
rejected.

## Guards & navigation

### How do I protect a route (auth guard)?

Return from `beforeLoad`: nothing/`true` to allow, `false` to block (the
previous URL is restored), or a path `string` to redirect. Guards run root →
leaf and may be `async`. See [Navigation guards](./guards).

### How do I redirect safely?

Return a path string from `beforeLoad`. Redirects are restricted to **same-origin**
targets: if a guard returns a cross-origin string (e.g. a `?next=https://evil.com`
query param), the router throws instead of navigating — the snapshot goes to
`status: "error"` rather than open-redirecting to the external site. So an
unchecked `?next=` can't be turned into an open redirect.

You should still validate user-derived targets against an allowlist of known
paths if you want to control *which* same-origin routes are reachable — the
origin check stops external redirects, not arbitrary internal ones.

### What is `ctx.signal` for?

It aborts when the navigation is superseded by a newer one. Pass it to `fetch`
(or check `signal.aborted` after an `await`) so a stale, slower navigation
can't overwrite a newer commit. See [Navigation guards](./guards).

## TypeScript

### Why does `navigate()` reject my path?

When routes are declared `as const`, `navigate` only accepts paths in the
compile-time `Href` union derived from your config. A rejected path usually
means a typo or a route that isn't declared. See
[Type-safe navigation](./type-safe-navigation).

### Do I need an extra `@types` package for the Navigation API?

On **TypeScript ≥ 6.0**, no — `lib.dom.d.ts` ships the Navigation API types. On
older TypeScript, install `@types/dom-navigation` yourself.
