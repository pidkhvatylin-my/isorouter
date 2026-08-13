---
"@isorouter/core": minor
---

`beforeLoad` guards can now return a `RedirectTarget` object (`{ to, replace?, state? }`) to control push-vs-replace and attach history state on redirect. Returning a plain string still redirects with `replace: true`. Cross-origin redirect targets remain rejected.
