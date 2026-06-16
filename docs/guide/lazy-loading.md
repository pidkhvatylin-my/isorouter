# Lazy loading

Wrap a dynamic `import()` in `lazy()` to code-split a route. The chunk loads on
**first match** and the resolved `default` export is **cached** on the
`LazyComponent` for subsequent navigations.

```ts twoslash
// @filename: User.ts
export default {};
// @filename: index.ts
import { createCoreRouter, lazy } from "@isorouter/core";

declare const Home: unknown;
// ---cut---
const router = createCoreRouter([
  { path: "/", component: Home },
  { path: "/users/:id", component: lazy(() => import("./User")) },
] as const);
```

`lazy` is re-exported from every adapter too, so you import it from the same
package as the rest of your router:

```ts twoslash
// @filename: User.ts
export default {};
// @filename: index.ts
import { lazy } from "@isorouter/react"; // or /vue, /svelte
// ---cut---
const User = lazy(() => import("./User"));
```

## How it resolves

- The import runs **once**, the first time the route matches.
- While it's in flight, the snapshot is in `status: "navigating"` — adapters
  render their `loading` slot/prop if there's no committed component yet.
- The module's **`default` export** is used as the component.
- If the import rejects, the navigation transitions to `status: "error"`.

## Combine with guards

Guards run before the lazy import is awaited for the committing leaf, so a
blocked navigation **won't pay the download cost** of a chunk it never shows.

```ts twoslash
// @filename: Admin.ts
export default {};
// @filename: index.ts
import { createCoreRouter, lazy } from "@isorouter/core";

declare function isLoggedIn(): boolean;
// ---cut---
const router = createCoreRouter([
  {
    path: "/admin",
    component: lazy(() => import("./Admin")),
    beforeLoad: () => {
      if (!isLoggedIn()) return "/login";
    },
  },
] as const);
```
