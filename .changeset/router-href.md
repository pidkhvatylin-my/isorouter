---
"@isorouter/core": minor
---

Add `router.href(target)` and an object form for navigation targets (`{ to, params, search, hash }`), resolved through a single internal `buildHref`. `navigate()` now routes through `href()`, so link resolution and navigation stay consistent. Params are percent-encoded symmetrically to path matching.
