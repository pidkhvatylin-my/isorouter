# @isorouter/core

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
