# Type-safe navigation

Declaring routes `as const` gives the router **compile-time path templates**.
`navigate` (and the adapters' `useNavigate`) then only accept paths your routes
actually define — typos and stale links become **type errors**, not runtime
404s.

::: tip Hover the code
The examples on this page are powered by Twoslash — hover any identifier to see
its inferred type, exactly as your editor would.
:::

## Known paths only

```ts twoslash
// @errors: 2345
import { createCoreRouter } from "@isorouter/core";

const router = createCoreRouter([
  { path: "/" },
  { path: "/concerts/:city" },
  { path: "/users/:id" },
] as const);

router.navigate("/concerts/kyiv"); // ok
router.navigate("/concerts/kyiv?from=search"); // ok — optional ?query
router.navigate("/users/42#bio"); // ok — optional #hash
router.navigate("/no-such-route"); // type error
```

The param segment `"/concerts/:city"` becomes the template
`` `/concerts/${string}` ``, so any city value type-checks while the **shape**
is enforced. An optional `?query` and/or `#hash` may be appended to any known
path.

## Extracting param types

`ExtractParams` resolves a path template to its params object — handy for typing
params you read elsewhere:

```ts twoslash
import type { ExtractParams } from "@isorouter/core";

type Params = ExtractParams<"/concerts/:city">;
//   ^?
```

## With the adapters

`useNavigate()` carries the same path types through. Declare routes `as const`,
and the returned function rejects unknown paths:

::: code-group

```tsx [React]
import { useNavigate } from "@isorouter/react";

function Search() {
  const navigate = useNavigate();
  // navigate("/concerts/kyiv") ✓   navigate("/nope") ✗ (type error)
  return <button onClick={() => navigate("/concerts/kyiv")}>Go</button>;
}
```

```ts [Vue 3]
import { useNavigate } from "@isorouter/vue";

const navigate = useNavigate();
// navigate("/concerts/kyiv") ✓   navigate("/nope") ✗ (type error)
navigate("/concerts/kyiv");
```

```svelte [Svelte 5]
<script lang="ts">
  import { getRouter } from "@isorouter/svelte";
  const router = getRouter();
  // router.navigate("/concerts/kyiv") ✓   router.navigate("/nope") ✗
</script>
```

:::

## Module augmentation

By default `useRouter()` / `useNavigate()` / `getRouter()` return the widened
`AnyXxxRouter` type, which is fine for runtime but loses the precise path union.
Augmenting the `Register` interface narrows every helper to the **concrete**
router type — across package boundaries, with no extra imports:

```ts twoslash
// @errors: 2345
import { createRouter } from "@isorouter/react";
import type { ComponentType } from "react";

const router = createRouter([
  { path: "/", component: null! as ComponentType },
  { path: "/about", component: null! as ComponentType },
] as const);

declare module "@isorouter/react" {
  interface Register {
    router: typeof router;
  }
}

import type { RegisteredRouter } from "@isorouter/react";

type To = Parameters<RegisteredRouter["navigate"]>[0];
//   ^?

router.navigate("/about"); // ok
router.navigate("/nonexistent"); // type error
```

Declare the augmentation once in the file where `router` lives (e.g.
`router.ts`). TypeScript merges it globally — every call to `useNavigate()`,
`useRouter()`, or `getRouter()` in the project picks up the narrowed type
automatically.

The same pattern works identically for `@isorouter/vue` and
`@isorouter/svelte` — swap the module name.

## Navigation options

`navigate` takes an optional second argument:

```ts twoslash
import { createCoreRouter } from "@isorouter/core";
const router = createCoreRouter([{ path: "/concerts/:city" }] as const);
// ---cut---
router.navigate("/concerts/kyiv", {
  replace: true, // replace the current history entry instead of pushing
  state: { from: "search" }, // attach state to the navigation entry
});
```
