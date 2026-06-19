<!--
  WORKING DOC — internal notes (stripped from the built site).
  Keep this comparison FAIR — no strawmanning. If a competitor adds a feature
  we list as missing, update promptly. Competitor bundle sizes intentionally
  kept qualitative (they drift); only our own ~1.8 KB is a hard number.
  TODO: revisit when TanStack Router ships more framework targets.
-->

# Comparison

A short, honest look at how isorouter differs from other client-side routers,
so you can tell when it's the right fit — and when it isn't.

## At a glance

| Router | Frameworks | Built on | Type-safe paths | Data layer | SSR | Size |
| --- | --- | --- | --- | --- | --- | --- |
| **isorouter** | Svelte · React · Vue (+ headless core) | **Navigation API** | ✅ `as const` | ❌ by design | ❌ by design | **~1.8 KB** |
| react-router | React | History API | ⚠️ via typegen | ✅ loaders/actions | ✅ | Larger |
| TanStack Router | React · Solid | History API | ✅ best-in-class | ✅ loaders | ✅ | Larger |
| wouter | React · Preact | History API | ❌ | ❌ | ⚠️ partial | Small (~2 KB) |

::: tip Sizes are approximate
Only isorouter's `~1.8 KB` gzip is a measured figure
([Bundlephobia](https://bundlephobia.com/package/@isorouter/core)). The others
drift across versions and configurations — check Bundlephobia for current
numbers. "Larger" reflects the built-in data/SSR layers, not bloat.
:::

## What makes isorouter different

Two things no other router in the table does:

1. **It's built on the [Navigation API](./browser-support), not the History
   API.** Click interception, history entries, scroll restoration and focus are
   the browser's job — isorouter orchestrates matching and commits on top
   instead of reimplementing the history stack. That's why the core stays
   ~1.8 KB.
2. **It's framework-agnostic from one implementation.** A single core publishes
   an immutable snapshot; thin adapters bridge it into Svelte, React and Vue
   (and you can use the core headless). The others are tied to one ecosystem.

## Choose isorouter when

- You target **modern browsers** (or will ship a [polyfill](./browser-support))
  and want to lean on the platform rather than re-implement it.
- You want a **tiny, type-safe** SPA router with zero runtime dependencies.
- You build for **more than one framework**, or want a framework-agnostic core
  you can wrap yourself.
- You **don't need** SSR or a built-in data-loading layer — you fetch in
  components or guards.

## Consider something else when

- **You need SSR/SSG.** Reach for a meta-framework (SvelteKit, Next, Nuxt) — the
  Navigation API is a browser API and doesn't exist on the server.
- **You want a built-in data-loading / caching layer.** TanStack Router and
  react-router ship loaders, actions and revalidation; isorouter deliberately
  doesn't.
- **You need typed, validated search params.** That's TanStack Router's
  headline feature; isorouter hands you the raw `URL` and stays out of the way.
- **You must support older browsers without shipping a polyfill.** A
  History-API router works everywhere today; isorouter's reach follows
  [Navigation API Baseline](./browser-support).

::: warning The honest limitation
isorouter's biggest trade-off is **browser reach**, not features. The Navigation
API reached Baseline in early 2026 but is not yet *Widely available* — if a
meaningful slice of your users are on older engines and you can't ship a
polyfill, a History-API router is the safer choice today.
:::

## Next steps

- [Browser support](./browser-support) — the polyfill story in detail.
- [Type-safe navigation](./type-safe-navigation) — the headline TypeScript feature.
- [FAQ](./faq) — non-goals and design rationale.
