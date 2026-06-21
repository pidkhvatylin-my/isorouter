---
"@isorouter/core": minor
---

Export `RouterStatus` and `ScrollMode` as named types. These were previously
inline string-literal unions on `RouterSnapshot.status` and `RouterOptions.scroll`;
naming and exporting them lets consumers reference the exact value sets directly
(e.g. when narrowing on `status` or typing a `scroll` option). No runtime change.
