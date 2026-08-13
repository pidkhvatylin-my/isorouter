---
"@isorouter/core": minor
"@isorouter/react": minor
"@isorouter/svelte": minor
"@isorouter/vue": minor
---

Add `from` to the guard context: `beforeLoad` guards now receive `ctx.from`,
the location the navigation is leaving.

- `GuardContext` gains `from: GuardLocation | null`. It carries the previous
  **committed** location as `{ url, params }`, or `null` on the first
  navigation after a page load. A navigation that a guard blocks or redirects,
  or one superseded mid-flight, never commits — so it never becomes anyone's
  `from`. A `not-found` or `error` landing _does_ count as committed, since the
  URL changed and the user is looking at that address.
- A new `GuardLocation` type (`{ url: URL; params: Record<string, string> }`)
  is exported from the core and re-exported by each adapter. It is deliberately
  narrower than `RouterSnapshot` — a guard needs the previous location, not the
  previous render.

`from` is purely additive (guards receive an extra field); existing guards need
no changes. Use it for referrer analytics, origin-aware redirects, or reading
the previous route's params:

```ts
beforeLoad: ({ from }) => {
  if (from?.url.pathname.startsWith("/app")) return "/app/dashboard";
};
```
