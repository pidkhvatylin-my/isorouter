/**
 * Lazy-component wrapper for @isorouter/core.
 * Boxes a dynamic `import()` call so the router can resolve and cache it on demand.
 */

const LAZY = Symbol.for("isorouter.lazy");

export interface LazyComponent<C = unknown> {
  readonly [LAZY]: true;
  load: () => Promise<{ default: C }>;
  resolved?: C;
}

/** Wrap a dynamic import so the router resolves it lazily and caches the result. */
export function lazy<C>(load: () => Promise<{ default: C }>): LazyComponent<C> {
  return { [LAZY]: true, load };
}

export function isLazy(value: unknown): value is LazyComponent {
  return typeof value === "object" && value !== null && LAZY in value;
}
