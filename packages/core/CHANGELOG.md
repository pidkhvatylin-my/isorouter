# @isorouter/core

## 1.2.1

### Patch Changes

- [#25](https://github.com/pidkhvatylin-my/isorouter/pull/25) [`af11d39`](https://github.com/pidkhvatylin-my/isorouter/commit/af11d39b3cfc530ce90594339cbeef27c30db7ff) Thanks [@pidkhvatylin-my](https://github.com/pidkhvatylin-my)! - fix(core): let a sibling root/pathless route win over a same-level `*` splat

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

## 1.2.0

### Patch Changes

- [#21](https://github.com/pidkhvatylin-my/isorouter/pull/21) [`f783dd0`](https://github.com/pidkhvatylin-my/isorouter/commit/f783dd0ba04eed3413f1d1f71812a16c9af76902) Thanks [@pidkhvatylin-my](https://github.com/pidkhvatylin-my)! - Export `ResolveRegister<Reg, Fallback>` utility type.

  This is the conditional type that backs the `Register`/`RegisteredRouter` pattern in all framework adapters. Exporting it from core lets adapters share the same implementation instead of each defining their own copy.

  ```ts
  // Used internally by adapters as:
  export type RegisteredRouter = ResolveRegister<Register, AnyReactRouter>;
  ```

## 1.1.2

### Patch Changes

- [#18](https://github.com/pidkhvatylin-my/isorouter/pull/18) [`afd7194`](https://github.com/pidkhvatylin-my/isorouter/commit/afd7194870079632852253c2203582e71cdee86b) Thanks [@pidkhvatylin-my](https://github.com/pidkhvatylin-my)! - fix(core): harden normalizePath against ReDoS (CodeQL js/polynomial-redos)

  Replace the `/\/+$/` regex in `normalizePath` with a linear index-scan. The
  regex was quadratic on slash-heavy strings that don't reach end-of-string —
  reachable via `URL.pathname` (which does not collapse slashes) in both
  `isActive` callers.

## 1.1.1

### Patch Changes

- [#15](https://github.com/pidkhvatylin-my/isorouter/pull/15) [`791bb2a`](https://github.com/pidkhvatylin-my/isorouter/commit/791bb2aee706f33e0c0b8db07b56427f103156c9) Thanks [@pidkhvatylin-my](https://github.com/pidkhvatylin-my)! - Restrict `beforeLoad` guard redirects to same-origin targets, closing an
  open-redirect. When a guard returns a string, the router now resolves it against
  the current URL and throws if the result is cross-origin (including
  protocol-relative `//host` and `javascript:` URLs) instead of navigating — the
  snapshot moves to `status: "error"` / `onError` rather than sending visitors to an
  external site (e.g. via a user-derived `?next=` param). Same-origin and relative
  redirects are unchanged. The framework adapters are republished so the fix ships
  in a fresh adapter release for consumers that pin the adapter packages.

## 1.1.0

### Minor Changes

- [#13](https://github.com/pidkhvatylin-my/isorouter/pull/13) [`b439dc7`](https://github.com/pidkhvatylin-my/isorouter/commit/b439dc7df9aad543c11dfe176a20066c98387e2b) Thanks [@pidkhvatylin-my](https://github.com/pidkhvatylin-my)! - Export `RouterStatus` and `ScrollMode` as named types. These were previously
  inline string-literal unions on `RouterSnapshot.status` and `RouterOptions.scroll`;
  naming and exporting them lets consumers reference the exact value sets directly
  (e.g. when narrowing on `status` or typing a `scroll` option). No runtime change.

## 1.0.1

### Patch Changes

- [#7](https://github.com/pidkhvatylin-my/isorouter/pull/7) [`f50567b`](https://github.com/pidkhvatylin-my/isorouter/commit/f50567b8a31094f2ec4284099a443f347f0f61b1) Thanks [@pidkhvatylin-my](https://github.com/pidkhvatylin-my)! - Guard the route matcher against malformed percent-encoding. A pathname segment
  containing an invalid escape — a lone `%`, bad hex digits, or invalid UTF-8 byte
  sequences — previously threw `URIError` from `decodeURIComponent` mid-match and
  aborted the navigation. Such segments now fall back to their raw value, so
  matching always resolves to a route or `null` and never crashes.

## 1.0.0

### Major Changes

- Initial release. Framework-agnostic SPA router built on the browser
  Navigation API: route matching, navigation guards (`beforeLoad`), lazy
  loading (`lazy`), nested layouts and an async commit state machine, exposed
  as an immutable-snapshot external store (`subscribe` + `getSnapshot`).
