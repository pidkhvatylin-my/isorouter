---
"@isorouter/react": minor
---

Add `Register` interface and `RegisteredRouter` type for module augmentation.

Users can now declare the router type once and get precise `navigate()` types everywhere — including in `useRouter()` and `useNavigate()` across package boundaries:

```ts
import { createRouter } from "@isorouter/react";

export const router = createRouter([
  { path: "/", component: Home },
  { path: "/about", component: About },
] as const);

declare module "@isorouter/react" {
  interface Register {
    router: typeof router;
  }
}
```

Without augmentation, `useRouter()` returns `AnyReactRouter` (same behaviour as before). With augmentation, it returns the precise `Router<T>` so `router.navigate("/about")` type-checks and invalid paths are rejected at compile time.

Also renames `ReactRouter` → `AnyReactRouter` for consistency with `@isorouter/svelte`, and moves `ReactComponentType` / `AnyReactRouter` to a dedicated `types.ts` — both are still re-exported from the package root, so no import paths need changing.
