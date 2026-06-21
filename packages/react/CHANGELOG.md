# @isorouter/react

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
- Updated dependencies [[`791bb2a`](https://github.com/pidkhvatylin-my/isorouter/commit/791bb2aee706f33e0c0b8db07b56427f103156c9)]:
  - @isorouter/core@1.1.1

## 1.0.0

### Major Changes

- Initial release. React adapter for `@isorouter/core`: `<Router>`,
  `<Outlet>`, `<Link>`, and `useParams`/`useLocation`/`useNavigate`/`useRouter`
  hooks, built on `useSyncExternalStore`.
