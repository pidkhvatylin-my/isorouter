---
"@isorouter/svelte": minor
---

Add `Register` interface and `RegisteredRouter` type for module augmentation.

Users can now declare the router type once and get precise `navigate()` types everywhere — including in `getRouter()` across package boundaries:

```ts
import { createRouter } from "@isorouter/svelte";

export const router = createRouter([
  { path: "/", component: Home },
  { path: "/about", component: About },
] as const);

declare module "@isorouter/svelte" {
  interface Register {
    router: typeof router;
  }
}
```

Without augmentation, `getRouter()` returns `AnySvelteRouter` (same behaviour as before). With augmentation, it returns the precise `SvelteRouter<T>` so `router.navigate("/about")` type-checks and invalid paths are rejected at compile time.

Also moves `SvelteComponentType` and `AnySvelteRouter` to a dedicated `types.ts` — both are still re-exported from the package root, so no import paths need changing.
