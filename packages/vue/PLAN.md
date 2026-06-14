# @isorouter/vue — finishing plan

Goal: bring this package to the **exact quality bar of `@isorouter/core`** so it
is publish-ready. The runtime implementation is **already complete**
(`createRouter`, `<RouterView>`, `<Outlet>`, `<Link>`, composables — all
authored as `h()` render functions in `.ts`, no SFCs). Missing: metadata,
lint/format, README, LICENSE, and a full unit + integration + e2e suite.

Use `packages/core` as the reference for every decision. **Do not change the
public API or runtime behaviour** unless a test reveals a genuine bug (then stop
and report).

---

## 0. Current state

```
vue/
  src/{index.ts,createRouter.ts,context.ts,composables.ts,RouterView.ts,Outlet.ts,Link.ts}  ✅ done
  package.json          ⚠️ only build + check scripts; files:["dist"]; no LICENSE
  rolldown.config.js    ✅ done (matches core)
  tsconfig.json         ✅ ok  (add "test"/"e2e" to include — see §1)
  tsconfig.build.json   ✅ done
```

Public surface (freeze — tests assert it):
`createRouter`, `RouterView`, `Outlet`, `Link`, `useRouter`, `useRouterState`,
`useParams`, `useLocation`, `useNavigate`, re-exported `lazy` + core types.

Note the naming: the **root** component is `RouterView` (mount once, takes the
`router` prop + `notFound`/`error`/`loading` **slots**); `<Outlet>` renders the
next nested component. `<Link>` props are `href`, `activeClass`, `exact`.

---

## 1. Config, metadata, tooling (parity with core)

**`package.json`**:

- Add `description`, `license`, `author`, `homepage`, `repository`
  (`directory: "packages/vue"`), `bugs`, `keywords`
  (`[...,"vue","typescript"]`); `files: ["dist", "LICENSE"]`.
- Keep `peerDependencies: { "vue": "^3.4.0" }`.
- Scripts — copy core's set verbatim (build/check/lint/lint:fix/format/
  format:check/test/test:watch/coverage/test:e2e/test:all). No polyfill e2e
  project (§4).
- devDependencies (shared versions pinned to core's):
  `@eslint/js ^10`, `eslint ^10`, `typescript-eslint ^8.61`,
  `eslint-config-prettier ^10`, `prettier ^3.8`, `publint ^0.3`,
  `rolldown ^1.1`, `typescript ^6`, `@types/node ^24`,
  `vue ^3.4` (dev, for tests/e2e), `@vue/test-utils ^2.4`,
  `vitest ^4.1`, `@vitest/coverage-v8 ^4.1`, `jsdom ^25`,
  `@vitejs/plugin-vue ^5` (only needed if the e2e fixture uses `.vue` SFCs;
  unit tests of `h()` components don't need it), `@playwright/test ^1.60`.

**`LICENSE`** — copy the root / core MIT `LICENSE` verbatim.

**`eslint.config.js`** — the adapter is **plain TypeScript** (no `.vue` files),
so core's config works almost unchanged. Copy it and adjust `ignores` to
`["dist","coverage","playwright-report","test-results",".vite"]`. Do **not**
pull in `eslint-plugin-vue` (no SFCs to parse). Keep the `*.config.{js,ts}`
override and the trailing `prettier` entry. If the e2e fixture ends up using
`.vue` SFCs, scope `eslint-plugin-vue` to `e2e/**/*.vue` only.

**`.prettierrc`** = `{}`; **`.prettierignore`** = core's.

**`tsconfig.json`** — add `"test"` and `"e2e"` to `include`.

**`vitest.config.ts`**:

```ts
import { defineConfig } from "vitest/config";
// import vue from "@vitejs/plugin-vue";   // only if any .vue files exist
export default defineConfig({
  // plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
    coverage: { provider: "v8" },
  },
});
```

Because all source components are `h()`/`defineComponent` in `.ts`, no SFC
compiler is required for unit/integration tests.

**`README.md`** — model on core's: title + one-liner, Install, Requirements
(link to core for the Navigation API/polyfill section), Quick start
(`createApp` + mount `<RouterView :router="router">` with named slots), the
component API (`RouterView` slots, `Outlet`, `Link` props), composables
(`useRouter`/`useRouterState` returns a `ShallowRef`, `useParams`/`useLocation`
return `ComputedRef`, `useNavigate`), type-safe navigation note, License.

---

## 2. Test helper (shared by unit + integration)

Port core's `test/unit/helpers/fake-navigation.ts` into
`test/helpers/fake-navigation.ts`. Tests build a **real** `createRouter(...)`
and stub globals as core does (`vi.stubGlobal("navigation"/"location"/
"document")` in `beforeEach`, `vi.unstubAllGlobals()` in `afterEach`). Drive
navigation **imperatively** (`router.navigate`, `router.back`) — anchor clicks
are an e2e concern. Define shared test components, e.g.
`defineComponent({ render: () => h("p", { "data-testid": "page" }, "home") })`,
plus a layout rendering `<Outlet/>`.

---

## 3. Tests — `test/`

### 3a. Unit — the reactivity bridge (`test/composables.test.ts`)

Mount a tiny host component inside `mount()` (or use `withSetup` helper) so
`inject`/`onScopeDispose` work, providing the router via `RouterView` or a
manual `provide(RouterKey, router)`. Cases:

- `injectRouter` (via any composable) **throws** `[isorouter] must be used
within <RouterView>` when no router is provided.
- `useRouterState` returns a `shallowRef` seeded with the current snapshot and
  **updates `.value` on commit** (drive `router.navigate`, await a tick, assert
  new snapshot reference). Confirm `shallowRef` (not deep `ref`) — the URL/
  component list are not proxied.
- The subscription is **torn down on scope dispose** (unmount the host; assert
  the router has no live subscriber — e.g. navigate again and assert `.value`
  no longer changes / spy on unsubscribe).
- `useParams` is a `ComputedRef` that tracks param changes across navigations.
- `useLocation` is a `ComputedRef<URL>`.
- `useNavigate` returns a function delegating to `router.navigate(to, opts)`.

### 3b. Integration — components (`test/components.test.ts`)

Use `@vue/test-utils` `mount`. Cases:

- `RouterView` **starts on mount (`onMounted`) / stops + unsubscribes on
  unmount (`onUnmounted`)** — spy on `router.start`/`router.stop`.
- Renders the matched **root** component initially.
- `status` routing of slots: `error` slot receives `{ error }`; `notFound`
  slot; `loading` slot when no component yet.
- `<Outlet>` renders the nested child at the right depth; 2-level nesting
  renders parent→child; missing child renders nothing.
- `<Link>` renders `<a :href>`, applies `activeClass` + `aria-current="page"`
  when active, respects `exact`, renders default slot children, and updates
  active state after an imperative navigation.
- Navigating swaps the rendered component and updates `useParams`/`useLocation`.

Target ~100% coverage of `src/` via `npm run coverage`.

---

## 4. e2e — `e2e/` (Playwright, native engine only)

No polyfill matrix. One real Vite + Vue app, single `chromium` project.

**Fixture** `e2e/fixture/`:

- `index.html` with `<div id="app">` + `<script type="module" src="./main.ts">`.
- `main.ts`: `createApp(...).mount("#app")`, rendering `<RouterView>` with the
  `router` prop and `#notFound`/`#error`/`#loading` slots, route set mirroring
  core's fixture (Home, `about`, `concerts/:city`, `users/:id` via `lazy`,
  `dashboard` layout + index `Overview` + `settings`, `files/*`, redirect &
  blocked guards), a nav of `<Link data-testid="link-...">`, pages rendering
  `<p data-testid="page">…</p>`, titles via route `title`. Expose
  `window.__router = router`. Components may be `h()` render fns (no plugin
  needed) or `.vue` SFCs (then add `@vitejs/plugin-vue`); render fns keep the
  toolchain minimal.

**`vite.config.ts`**: `root: "e2e/fixture"` (+ `plugins: [vue()]` only if SFCs).

**`playwright.config.ts`**: copy core's; single `chromium` project; webServer
`npx vite --port 5275 --strictPort`; `baseURL: "http://localhost:5275"`.

**`e2e/tests/*.spec.ts`** — port core's specs minus polyfill: initial render +
title; link-click interception (no reload) + URL + title; dynamic params; splat
join; not-found; nested layout index + deepest title; guard redirect; guard
block; lazy load; imperative `navigate`/`back`/`forward`; active-link class +
`aria-current`.

---

## 5. Acceptance criteria

From `packages/vue/`:

- `npm run check` clean (tsc, publint, eslint, prettier).
- `npm run build` emits `dist/index.js` + `dist/index.d.ts`; publint happy.
- `npm run test` green; `npm run coverage` ~100% of `src`.
- `npm run test:e2e` green on chromium.
- `npm pack --dry-run` lists only `dist/**` + `LICENSE` + `package.json` +
  `README.md`.

## 6. Vue-specific gotchas

- `useRouterState` uses `shallowRef` deliberately (snapshot is immutable, fresh
  reference per commit). Don't switch to `ref`/`reactive` — that would deep-
  proxy the `URL` and component list.
- `RouterView` subscribes **locally** (a component can't `inject` what it
  `provide`s) and must unsubscribe in `onUnmounted` — assert no leak.
- `onScopeDispose` in composables only fires inside an active effect scope;
  test them mounted, not in a bare function call.
