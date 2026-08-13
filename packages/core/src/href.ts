/**
 * Pure target → href resolution for @isorouter/core.
 *
 * `buildHref` is the single place a `NavTarget` (a plain path string, or an
 * object form of `{ to, params, search, hash }`) turns into a concrete href
 * string. Both `Router#navigate` and the public `Router#href` sit on top of
 * it, so "where a link points" and "where we navigate" can never drift apart.
 *
 * Encode/decode symmetry contract: params are percent-encoded here with
 * `encodeURIComponent` and later decoded by `matcher.ts`'s `safeDecode`
 * (itself a guarded `decodeURIComponent`). Both sides MUST agree on the same
 * escaping scheme — if one changes without the other, round-tripping a param
 * through `buildHref` and back through `matchRoutes` silently produces the
 * wrong value instead of failing loudly. `encodeURIComponent` escapes `/`,
 * which is what lets a param value containing a slash survive as a single
 * segment; the `*` splat is handled separately below precisely because it is
 * the one place a literal `/` must pass through as a segment separator.
 */

/** Loosely-typed resolution target — the widened `NavTargetObject` collapses to this at runtime. */
export interface HrefTarget {
  to: string;
  params?: Record<string, string>;
  search?: string;
  hash?: string;
}

/**
 * Resolve a navigation target to a concrete href string.
 *
 * A plain string is assumed to already be a resolved path (or `path?search#hash`)
 * and is returned unchanged — this is the back-compat path callers have always
 * used. The object form fills in `:param` placeholders and an optional trailing
 * `*` splat, then appends a normalized `search`/`hash`.
 */
export function buildHref(target: string | HrefTarget): string {
  if (typeof target === "string") return target;

  let path = target.to.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => {
    const value = target.params?.[key];

    if (value == null)
      throw new Error(`[isorouter] missing param "${key}" for "${target.to}"`);

    return encodeURIComponent(value); // symmetric to matcher's safeDecode
  });

  const splat = target.params?.["*"];

  if (splat != null)
    path = path.replace(
      /\*$/,
      splat.split("/").map(encodeURIComponent).join("/"),
    );

  const search = target.search
    ? target.search.startsWith("?")
      ? target.search
      : `?${target.search}`
    : "";

  const hash = target.hash
    ? target.hash.startsWith("#")
      ? target.hash
      : `#${target.hash}`
    : "";

  return path + search + hash;
}
