# isorouter

isorouter is a lightweight, framework-agnostic SPA router built on the browser Navigation API. A pure-TypeScript core with zero framework deps, plus thin React/Vue/Svelte adapters.

## Structural code discovery — use codebase-memory-mcp first

> Use the `codebase-memory-mcp` tool FIRST for structural code discovery: `search_graph` to find symbols, `trace_path` for callers/callees, `get_code_snippet` for exact source, `query_graph`/`get_architecture` for structure. Fall back to grep/glob/read for literals, config, non-code files, or when the graph returns too little. Call `check_index_coverage` for any file a conclusion depends on.

## Monorepo layout

npm workspaces monorepo (`workspaces: ["packages/*"]`), ESM-only (`"type": "module"`), Node `^20.19.0 || >=22.12.0` (see `.nvmrc`). Package manager is **npm — never pnpm**. TypeScript ≥ 6.0 is required (its `lib.dom.d.ts` ships Navigation API types).

All published packages are at v1.2.1:

| Package | Role | Source |
| --- | --- | --- |
| `@isorouter/core` | pure-TS core, zero framework deps | `packages/core/src/router.ts` (`Router` class + `createCoreRouter`), `matcher.ts` (`matchRoutes` + specificity ranking), `lazy.ts` (`lazy`/`isLazy`), `types.ts` (contract + compile-time path-template types), `index.ts` (barrel) |
| `@isorouter/react` | React adapter, `useSyncExternalStore` bridge | `packages/react/src/createRouter.ts`, `hooks.ts`, `Router.tsx`, `Outlet.tsx`, `Link.tsx`, `context.ts` |
| `@isorouter/vue` | Vue 3 adapter, `shallowRef` bridge | `packages/vue/src/createRouter.ts`, `composables.ts`, `RouterView.ts`, `Outlet.ts`, `Link.ts`, `context.ts` |
| `@isorouter/svelte` | Svelte 5 adapter, `createSubscriber` bridge | `packages/svelte/src/Router.svelte`, `Outlet.svelte`, `Link.svelte`, `reactive.svelte.ts`, `context.ts` |
| `@isorouter/test-utils` | private, not published; shared `FakeNavigation` test double | `packages/test-utils/src/fake-navigation.ts`, used by all package tests |

`demos/{react,svelte,vue}` and `docs/` (VitePress) are not published.

## Core architecture (read this before touching `packages/core`)

- The core is an **external store**: `subscribe(fn)` + `getSnapshot()`, publishing an **immutable snapshot with a fresh reference on every commit** (`#emit` spreads a new object). This immutability is load-bearing: a Proxy/mutate-in-place core was rejected because `useSyncExternalStore` compares by `Object.is` and would never see a change — the immutable-snapshot contract is what lets one core serve all three frameworks.
- `start()` attaches a Navigation API `navigate` listener; `#onNavigate` decides interception. `shouldNotIntercept` bails on cross-document / hashChange / download / form-POST navigations; cross-origin is rejected separately in `#onNavigate`.
- `#commit` is the async state machine: abort any in-flight commit → `matchRoutes` → run `beforeLoad` guards **root→leaf** → resolve (lazy) components → `#emit` snapshot → apply title (deepest title in chain wins). `RouterStatus` = `idle | navigating | not-found | error`.
- **Matching priority** (`packages/core/src/matcher.ts`): static segments win over params (`:id`), which win over splats (`*`) — **regardless of declaration order**; ties within the same kind break by source order. `index: true` matches only when the parent path is consumed exactly (no leftover segments). A splat captures the **decoded** remainder into `params["*"]`. Routes with **no `component`** still match as pass-through layouts but contribute nothing to `snapshot.components`.
- **Lazy** (`packages/core/src/lazy.ts`): a `lazy(() => import(...))` component's import runs **once** on first match and its `default` export is cached on the `LazyComponent`. Guards run before the committing leaf's lazy import, so a blocked navigation never downloads a chunk it won't show. In flight, `status` is `navigating`.
- **Guards** (`beforeLoad(ctx)`): return `false` → block (restore current URL via a replace-navigation), a `string` → redirect (replace), else (`undefined`/`true`) allow. Guard redirect strings are resolved against the current URL and **cross-origin targets are rejected** to prevent open redirects (fix from PR #15, lives around `packages/core/src/router.ts:234-248`).
- Supersession: an `AbortController` per commit + `ctx.signal` — a newer navigation aborts the older guard/resolve chain.
- Type-safe navigation: declaring route configs `as const` drives `NavTarget` / `Href` / `ExtractParams` template-literal types in `packages/core/src/types.ts`, so `router.navigate` only accepts known paths.

## Adapter pattern

Each adapter wraps the core store with its framework's native primitive — React `useSyncExternalStore(subscribe, getSnapshot)`, Vue `shallowRef(snapshot)` + subscribe, Svelte 5 `createSubscriber(update => subscribe(update))`. Nested layouts render children via `<Outlet />`; `<Link href>` renders a plain `<a>` that the Navigation API intercepts natively. Adapters expose a `Register` interface for module-augmentation typing.

## Commands

Run from repo root with `-w @isorouter/<pkg>`, or from inside the package directory.

- **Build**: `npm run build` — core/react/vue use rolldown for JS + `tsc` for `.d.ts`; svelte uses `svelte-package`. `.d.ts` is emitted separately via `tsc` because rolldown's `--dts` injects a deprecated `baseUrl`.
- **Check** (the pre-PR gate): `npm run check` = `tsc --noEmit` + `publint` + `eslint` + `prettier --check` (svelte uses `svelte-check` instead). Also available: `npm run lint:fix`, `npm run format`.
- **Tests**: `npm run test` (vitest, property tests via fast-check), `npm run test:e2e` (Playwright — run `npx playwright install` first). `@isorouter/core` additionally runs e2e against BOTH the native Navigation API and the `@virtualstate/navigation` polyfill: `npm run test:e2e:native` / `npm run test:e2e:polyfill`.
- **Before a PR**: `npm run build` and `npm run check` must pass for every affected package, plus unit + e2e.

## Testing

- **Unit tests** (vitest) live in `packages/<pkg>/test/`; **e2e tests** (Playwright) in `packages/<pkg>/e2e/tests/`.
- The core matcher is covered by `packages/core/test/unit/matcher/{basic,edge-cases,property,stress}.test.ts` — `property` and `stress` are **fast-check** property tests. When you change matcher behavior, extend these.
- All four packages share the same five e2e specs — `active-link`, `guards`, `lazy`, `navigation`, `nested` — so when you change shared behavior, update them in parallel across core/react/vue/svelte.
- Unit tests simulate the Navigation API under jsdom via the **`FakeNavigation`** double from `@isorouter/test-utils` (`packages/test-utils/src/fake-navigation.ts`) — use it instead of a real browser for core/adapter unit tests.
- Run a single file or test from inside a package: `npx vitest run <file>` or `npx vitest -t "<name>"`.

## Conventions & release

- Changesets-driven releases with a per-package CHANGELOG. Run `npx changeset` for any change to published behavior of core/react/svelte/vue. Internal-only changes (docs/CI/tests/tooling/test-utils) skip the changeset.
- Branch model: `master` (the current 1.x line) and `2.x` (next-major development). **Publish only from master.** Prereleases are done by hand.
- Security fixes: ship via changeset + lockstep version bump; a GHSA/CVE is optional, not the default.
- **Never add `Co-Authored-By` / Claude co-author lines to commit messages** — explicit project preference.
- CI (`.github/workflows/ci.yml`) runs on **Node 24**: build → check → unit tests → e2e (native + polyfill). A `release` job (only on `master`) opens/updates a "Version Packages" PR from pending changesets and publishes to npm on merge (needs an `NPM_TOKEN` secret); the private `@isorouter/test-utils` is skipped automatically.
- All four public packages set `publishConfig.tag = "alpha"` so an accidental `npm publish` cannot move the `latest` dist-tag — **revisit this before cutting stable 2.0.0** (drop it at `changeset pre exit`, or ensure `changeset publish` passes `--tag latest`).
- The docs site is VitePress (`npm run docs:dev` / `docs:build`), deployed via `.github/workflows/docs.yml`.

## Design non-goals (do not propose these)

- No data fetching / loaders / cache — explicit non-goal ("unix way").
- No History API fallback — the Navigation API polyfill is opt-in and best-effort; the supported contract is the pure Baseline Navigation API (2026).

## Gotchas

- `.d.ts` is emitted via a separate `tsc` pass, not rolldown's `--dts` (see Commands above).
- e2e tests need `npx playwright install` before first run.
- Guard redirect strings must stay same-origin — the open-redirect guard rejects cross-origin targets.
- The snapshot object reference MUST change on every update, or React's `useSyncExternalStore` won't re-render.
- `<Link>` active-class prop name differs by framework: **React uses `activeClassName`**, Svelte and Vue use `activeClass`. An active link also gets `aria-current="page"`. `router.isActive(path)` is a **prefix** match by default (a parent link stays active on its children); pass `{ exact: true }` for an exact match.
- Polyfill limitation: under `@virtualstate/navigation`, plain **link clicks** fall back to a full-page navigation (it reports `downloadRequest: ""` instead of `null`), so client-side interception doesn't fire for `<a>` clicks — the page still renders correctly via a fresh `start()`. **Imperative** navigation (`navigate`/`back`/`forward`, guards, redirects, lazy) works identically to native. Keep this in mind when debugging polyfill e2e.
- With no Navigation API and no polyfill: `router.start()` and `back()`/`forward()` are **no-ops**, and `router.navigate(...)` **throws** — feature-detect and load the polyfill before `start()`.
