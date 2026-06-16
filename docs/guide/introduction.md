# What is isorouter?

**isorouter** is a lightweight, framework-agnostic SPA router built on the
browser [Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API).

The interception, matching, guards, lazy-loading and async-commit state machine
live in a pure-TypeScript core with **zero framework dependencies**. Thin
adapters bind that core into Svelte 5, React and Vue 3.

```
@isorouter/core     ← pure TS: matcher, guards, lazy, commit state machine
   ├── @isorouter/svelte   ← createSubscriber bridge
   ├── @isorouter/react    ← useSyncExternalStore bridge
   └── @isorouter/vue      ← shallowRef bridge
```

## Why this shape

The core is an **external store**: it exposes `subscribe(fn)` + `getSnapshot()`
and publishes an **immutable snapshot with a fresh reference on every commit**.
That contract is the lowest common denominator across the three reactivity
systems — each adapter wraps it with the framework's native primitive:

| Framework | Bridge primitive                                | Why                                                                                   |
| --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| React     | `useSyncExternalStore(subscribe, getSnapshot)`  | Detects change via `Object.is(prev, next)` — **requires** a new reference per update.  |
| Svelte 5  | `createSubscriber(update => subscribe(update))` | Subscription is live only while `current` is read in a reactive scope; auto-torn-down. |
| Vue 3     | `shallowRef(snapshot)` + `subscribe`            | Snapshot is already immutable, so shallow ref replacement is exactly right.            |

::: tip A Proxy-based core was considered and rejected
A `Proxy` that mutates in place keeps the **same reference**, so
`useSyncExternalStore` would never see a change and React would not re-render.
The immutable-snapshot contract is what makes **one core serve all three
frameworks**.
:::

## Design principles

- **The platform does the hard part.** Click interception, history entries,
  scroll restoration and focus are the browser's job via the Navigation API —
  isorouter orchestrates matching and commits on top, it doesn't reimplement
  the history stack.
- **No History API fallback by design.** isorouter targets the Navigation API
  directly. If you must support pre-2026 engines, load a polyfill before
  starting the router — see [Browser support](./browser-support).
- **Type-safety is not bolted on.** Declaring routes `as const` makes
  `navigate` reject unknown paths at compile time. See
  [Type-safe navigation](./type-safe-navigation).
- **Small and tree-shakeable.** The core is a single ESM file (~4 KB minified /
  1.8 KB gzipped) with zero runtime dependencies and `"sideEffects": false`.

## Next steps

- [Installation](./installation) — pick the package for your framework.
- [Quick start](./quick-start) — a running router in a few lines.
- [Type-safe navigation](./type-safe-navigation) — the headline TypeScript feature.
