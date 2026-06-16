# Browser support

isorouter is built directly on the browser
[Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation_API).
There is **no History API fallback** — that's a deliberate design choice, not
an omission.

## Baseline status

The Navigation API reached **Baseline Newly available** in early 2026 (Chrome,
Edge, Firefox, Safari). It is **not yet Widely available**, so browsers still
in production from before then lack it.

::: warning Supported contract
The supported contract is the **pure Navigation API**. If a browser has it,
isorouter works. If it doesn't, load a polyfill (below) — but the polyfill is
**best-effort**, with known gaps. isorouter does not ship or maintain its own
History-based shim.
:::

## Polyfill (opt-in)

If you must support pre-2026 engines, load a polyfill **before** starting the
router (the "unix way": one small dependency, opt-in):

```ts twoslash
// @noErrors
declare const router: { start(): void };
// ---cut---
if (!window.navigation) {
  const { applyPolyfill } = await import(
    "@virtualstate/navigation/apply-polyfill"
  );
  applyPolyfill();
}
router.start(); // or mount <Router> / <RouterView>
```

[`@virtualstate/navigation`](https://github.com/virtualstate/navigation) is the
only polyfill we're aware of that implements `navigate` + `event.intercept()`,
which isorouter's interception model depends on. The e2e suite runs the full
test matrix a **second time** with the native Navigation API hidden, against
this polyfill, to verify behavioural parity.

### Known limitation

As of `@virtualstate/navigation@1.0.1-alpha.212`, `interceptWindowClicks`
reports `downloadRequest: ""` (instead of `null`) for plain `<a>` clicks, so the
`navigate` event isn't intercepted and the polyfill falls back to a full-page
navigation for **link clicks**. The route still renders correctly (the fresh
page load re-runs `router.start()`), but the transition isn't client-side.

**Imperative navigation** — `router.navigate`, `back`, `forward`, guards,
redirects, lazy loading — is unaffected and works identically to native.

## What happens with no Navigation API and no polyfill

- `router.start()` is a **no-op**.
- `router.navigate(...)` **throws**.
- `router.back()` / `router.forward()` are **no-ops**.

So a feature-detect like the snippet above is all you need to degrade safely.
