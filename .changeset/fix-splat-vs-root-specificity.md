---
"@isorouter/core": patch
"@isorouter/react": patch
"@isorouter/svelte": patch
"@isorouter/vue": patch
---

fix(core): let a sibling root/pathless route win over a same-level `*` splat

`SEGMENT_SCORE.splat` was `1`, giving `path: "*"` a specificity of 1 — higher
than `path: "/"`, `path: ""`, or a pathless layout, which all score 0. The
descending-specificity sort therefore placed the splat first, so a top-level
catch-all (`{ path: "*" }`) swallowed the home route and a subtree `*` shadowed
its layout's index/empty route. The documented behaviour — "static > `:param` >
`*`, ties broken by declaration order" — never held for splats against
zero-segment siblings.

Lower `splat` to `0` so it ties with zero-segment routes and the stable sort
falls back to declaration order. Declaring an explicit `/` (or any matching
route) before the `*` now resolves correctly; the `*` only matches when nothing
above it does. Multi-segment splats (`a/*`) and splat-vs-splat ordering are
unaffected.
