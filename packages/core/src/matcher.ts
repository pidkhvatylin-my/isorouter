/**
 * Route matching algorithm for @isorouter/core.
 *
 * Resolves a pathname against a `RouteConfig` tree and returns the first matched
 * chain (root → leaf) together with the merged path params, or `null` when
 * nothing matches.
 *
 * Specificity order (high → low): index > static segment > `:param` > `*` splat.
 * Equal-specificity siblings fall back to declaration order (first wins).
 */

import type { RouteConfig, RouteMatch } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PARAM_PREFIX = ":";
const SPLAT = "*";

/**
 * Per-segment specificity weights. Sibling routes are matched most-specific
 * first, so a static segment must outrank a param, which must outrank a splat,
 * regardless of declaration order. The exact magnitudes are arbitrary — only
 * their relative ordering matters — but the gaps are wide enough that no
 * realistic combination of lower-tier segments can overtake a higher tier.
 */
const SEGMENT_SCORE = {
  static: 10,
  param: 4,
  splat: 1,
} as const;

/**
 * An index route is the most specific thing a level can offer (it matches the
 * parent's exact URL), so it always wins its level. A sentinel above any
 * achievable path score guarantees that without depending on segment counts.
 */
const INDEX_SCORE = Number.MAX_SAFE_INTEGER;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function isParam(segment: string): boolean {
  return segment.startsWith(PARAM_PREFIX);
}

/**
 * Decode a path segment, falling back to the raw value when it contains
 * malformed percent-encoding. The Navigation API hands us `url.pathname`
 * verbatim and it is NOT guaranteed to be well-formed (a lone `%`, bad hex, or
 * invalid UTF-8 byte sequences all survive URL parsing), so an unguarded
 * `decodeURIComponent` would throw `URIError` mid-match and crash navigation.
 */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Higher score = more specific. Equal scores are broken by declaration order (see `matchLevel`). */
function specificity(route: RouteConfig): number {
  if (route.index) return INDEX_SCORE;

  let score = 0;

  for (const segment of segments(route.path ?? "")) {
    if (segment === SPLAT) score += SEGMENT_SCORE.splat;
    else if (isParam(segment)) score += SEGMENT_SCORE.param;
    else score += SEGMENT_SCORE.static;
  }

  return score;
}

// ─── Core Algorithm ───────────────────────────────────────────────────────────

/** Outcome of matching a single route's own segments against the head of a path. */
interface SegmentMatch {
  params: Record<string, string>;
  /** Path segments left for child routes to consume; empty when a splat ate the rest. */
  rest: string[];
  /** True when a `*` segment consumed the remainder of the path. */
  splat: boolean;
}

/** Match a single route's own path segments against the head of `pathSegs`. */
function matchSegments(
  routeSegs: string[],
  pathSegs: string[],
): SegmentMatch | null {
  const params: Record<string, string> = {};

  for (let i = 0; i < routeSegs.length; i++) {
    const routeSeg = routeSegs[i]!;

    if (routeSeg === SPLAT) {
      params[SPLAT] = pathSegs.slice(i).map(safeDecode).join("/");

      return { params, rest: [], splat: true };
    }

    const pathSeg = pathSegs[i];

    if (pathSeg === undefined) return null; // route is longer than the path

    const decoded = safeDecode(pathSeg);

    if (isParam(routeSeg)) params[routeSeg.slice(1)] = decoded;
    else if (routeSeg !== decoded) return null; // static segment mismatch
  }

  return { params, rest: pathSegs.slice(routeSegs.length), splat: false };
}

/**
 * Try to match `pathSegs` against one level of the route tree, recursing into
 * children when a layout route partially consumes the path. Siblings are tried
 * most-specific-first (stable by declaration order); the first full match wins.
 */
function matchLevel<C>(
  routes: readonly RouteConfig<C>[],
  pathSegs: string[],
  parentParams: Record<string, string>,
): RouteMatch<C> | null {
  const ordered = [...routes].sort((a, b) => specificity(b) - specificity(a));

  for (const route of ordered) {
    if (route.index) {
      if (pathSegs.length === 0)
        return { chain: [route], params: parentParams };

      continue;
    }

    const matched = matchSegments(segments(route.path ?? ""), pathSegs);

    if (!matched) continue;

    const params = { ...parentParams, ...matched.params };

    if (route.children) {
      const child = matchLevel(route.children, matched.rest, params);

      if (child)
        return { chain: [route, ...child.chain], params: child.params };
      // A layout route still matches its own URL even with no matching child.

      if (matched.rest.length === 0) return { chain: [route], params };

      continue;
    }

    if (matched.rest.length === 0 || matched.splat) {
      return { chain: [route], params };
    }
  }

  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve a pathname against a route config tree.
 *
 * @param routes - The root-level route config (as passed to `createCoreRouter`).
 * @param pathname - A raw `url.pathname` string. Malformed percent-encoding is
 *   tolerated; callers do not need to sanitise it first.
 * @returns The matched route chain (root → leaf) and merged path params, or
 *   `null` when no route claims the pathname.
 */
export function matchRoutes<C>(
  routes: readonly RouteConfig<C>[],
  pathname: string,
): RouteMatch<C> | null {
  return matchLevel(routes, segments(pathname), {});
}
