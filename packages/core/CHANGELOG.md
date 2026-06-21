# @isorouter/core

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
