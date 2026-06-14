import type { RouteConfig, RouteMatch } from "./types";

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

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function isParam(segment: string): boolean {
  return segment.startsWith(PARAM_PREFIX);
}

/** Higher score = more specific. Ties are broken by source order (stable sort). */
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
      params[SPLAT] = pathSegs.slice(i).map(decodeURIComponent).join("/");
      return { params, rest: [], splat: true };
    }

    const pathSeg = pathSegs[i];
    if (pathSeg === undefined) return null; // route is longer than the path

    const decoded = decodeURIComponent(pathSeg);
    if (isParam(routeSeg)) params[routeSeg.slice(1)] = decoded;
    else if (routeSeg !== decoded) return null; // static segment mismatch
  }

  return { params, rest: pathSegs.slice(routeSegs.length), splat: false };
}

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

/**
 * Resolve a pathname against a route config, returning the matched route chain
 * (root → leaf) and the merged path params, or `null` when nothing matches.
 */
export function matchRoutes<C>(
  routes: readonly RouteConfig<C>[],
  pathname: string,
): RouteMatch<C> | null {
  return matchLevel(routes, segments(pathname), {});
}
