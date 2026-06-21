---
"@isorouter/core": patch
---

fix(core): harden normalizePath against ReDoS (CodeQL js/polynomial-redos)

Replace the `/\/+$/` regex in `normalizePath` with a linear index-scan. The
regex was quadratic on slash-heavy strings that don't reach end-of-string —
reachable via `URL.pathname` (which does not collapse slashes) in both
`isActive` callers.
