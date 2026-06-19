/**
 * Property-based proof of the matcher's core invariant. "Bulletproof" is a
 * property of the *pair* (route config × pathname), so example-based tests —
 * which pin one config — can only ever sample the space. Here we let fast-check
 * generate thousands of random route trees crossed with random adversarial
 * pathnames and assert, for every pair, that `matchRoutes`:
 *
 *   1. never throws,
 *   2. terminates promptly (a hang would trip the wall-clock guard / vitest
 *      timeout), and
 *   3. returns either `null` or a well-formed `{ chain, params }`.
 *
 * Route-tree depth is bounded deliberately: recursion follows the (developer-
 * authored) config, not the URL, so unbounded depth would only prove that *we*
 * can blow our own stack — not a property of hostile input.
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { matchRoutes } from "../../../src/matcher";
import type { RouteConfig } from "../../../src/types";

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const ROUTE_PATH = fc
  .array(fc.constantFrom("a", "b", "users", "files", ":id", ":name", "*"), {
    minLength: 1,
    maxLength: 3,
  })
  .map((segs) => segs.join("/"));

function routeArb(depth: number): fc.Arbitrary<RouteConfig<string>> {
  const leaf = fc.record({ path: ROUTE_PATH, component: fc.constant("c") });
  const index = fc.record({
    index: fc.constant(true),
    component: fc.constant("idx"),
  });
  if (depth <= 0) return fc.oneof(leaf, index);

  const layout = fc.record({
    path: ROUTE_PATH,
    component: fc.option(fc.constant("c"), { nil: undefined }),
    children: fc.array(routeArb(depth - 1), { minLength: 1, maxLength: 3 }),
  });
  return fc.oneof(leaf, index, layout);
}

const ROUTES = fc.array(routeArb(3), { minLength: 1, maxLength: 4 });

/** A pool of segment tokens spanning every way a pathname turns adversarial. */
const NASTY_TOKEN = fc.constantFrom(
  "a",
  "b",
  "users",
  "files",
  "123",
  "%", // lone percent → would throw decodeURIComponent
  "%zz", // bad hex
  "%C0%80", // invalid UTF-8
  "%2F", // encoded slash
  "%20", // encoded space
  "..", // traversal
  "%2e%2e",
  "<script>",
  "café",
  "😀", // astral / surrogate pair
  " ", // NUL
  "‮", // RTL override
  "​", // zero-width space
  "   ", // whitespace
  "*",
  ":id",
  "?q=1", // query residue
  "#frag", // hash residue
);

const PATHNAME = fc.oneof(
  // Structured: random leading/trailing/interior slashes around nasty tokens.
  fc
    .tuple(
      fc.constantFrom("/", "//", "", "/a/"),
      fc.array(fc.oneof(NASTY_TOKEN, fc.string()), { maxLength: 10 }),
      fc.constantFrom("", "/", "//", "///"),
    )
    .map(([lead, segs, trail]) => lead + segs.join("/") + trail),
  // Totally arbitrary strings — the matcher must accept literally anything.
  fc.string(),
);

// ─── Properties ───────────────────────────────────────────────────────────────

describe("matcher invariants (property-based)", () => {
  it("never throws, terminates, and returns null or a well-formed match", () => {
    fc.assert(
      fc.property(ROUTES, PATHNAME, (routes, pathname) => {
        const start = performance.now();
        const result = matchRoutes(routes, pathname); // a throw fails the property
        const elapsed = performance.now() - start;

        // Generated inputs are tiny; anything slow signals algorithmic blowup.
        expect(elapsed).toBeLessThan(500);

        if (result !== null) {
          expect(Array.isArray(result.chain)).toBe(true);
          expect(result.chain.length).toBeGreaterThan(0);
          expect(result.params).toBeTypeOf("object");
          expect(result.params).not.toBeNull();
        }
      }),
      { numRuns: 2000 },
    );
  });

  it("is deterministic: the same pair always yields the same result", () => {
    fc.assert(
      fc.property(ROUTES, PATHNAME, (routes, pathname) => {
        expect(matchRoutes(routes, pathname)).toEqual(
          matchRoutes(routes, pathname),
        );
      }),
      { numRuns: 1000 },
    );
  });
});
