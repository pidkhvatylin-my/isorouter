---
"@isorouter/core": patch
"@isorouter/react": patch
"@isorouter/svelte": patch
"@isorouter/vue": patch
---

Restrict `beforeLoad` guard redirects to same-origin targets, closing an
open-redirect. When a guard returns a string, the router now resolves it against
the current URL and throws if the result is cross-origin (including
protocol-relative `//host` and `javascript:` URLs) instead of navigating — the
snapshot moves to `status: "error"` / `onError` rather than sending visitors to an
external site (e.g. via a user-derived `?next=` param). Same-origin and relative
redirects are unchanged. The framework adapters are republished so the fix ships
in a fresh adapter release for consumers that pin the adapter packages.
