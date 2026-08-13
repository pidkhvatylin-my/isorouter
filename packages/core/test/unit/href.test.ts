/**
 * Unit tests for `buildHref` from @isorouter/core.
 *
 * Covers string passthrough, `:param`/`*` splat resolution and their
 * `encodeURIComponent` symmetry with `matcher.ts`'s decoding, search/hash
 * normalization, and the missing-param error. The round-trip test at the
 * bottom is the actual symmetry guard: it feeds a `buildHref` output back
 * through `matchRoutes` and asserts the original value comes back out.
 */

import { describe, expect, it } from "vitest";
import { buildHref } from "../../src/href";
import { matchRoutes } from "../../src/matcher";
import type { RouteConfig } from "../../src/types";

describe("buildHref", () => {
  it("returns a plain string target unchanged", () => {
    expect(buildHref("/about")).toBe("/about");
    expect(buildHref("/search?q=1")).toBe("/search?q=1");
  });

  describe(":param substitution", () => {
    it("percent-encodes a value containing a space", () => {
      expect(
        buildHref({ to: "/users/:name", params: { name: "John Doe" } }),
      ).toBe("/users/John%20Doe");
    });

    it("percent-encodes a value containing a slash (escaped, not a separator)", () => {
      expect(buildHref({ to: "/files/:name", params: { name: "a/b" } })).toBe(
        "/files/a%2Fb",
      );
    });

    it("substitutes multiple params", () => {
      expect(
        buildHref({
          to: "/users/:userId/posts/:postId",
          params: { userId: "42", postId: "7" },
        }),
      ).toBe("/users/42/posts/7");
    });

    it("throws a helpful error when a param is missing", () => {
      expect(() => buildHref({ to: "/users/:id", params: {} })).toThrow(
        /missing param "id" for "\/users\/:id"/,
      );
    });

    it("throws when params is omitted entirely", () => {
      expect(() => buildHref({ to: "/users/:id" })).toThrow(
        /missing param "id"/,
      );
    });
  });

  describe("* splat", () => {
    it("encodes each segment but preserves '/' as a separator", () => {
      expect(buildHref({ to: "/files/*", params: { "*": "a/b/c" } })).toBe(
        "/files/a/b/c",
      );
    });

    it("percent-encodes special characters within a splat segment", () => {
      expect(buildHref({ to: "/files/*", params: { "*": "a b/c d" } })).toBe(
        "/files/a%20b/c%20d",
      );
    });

    it("leaves the trailing '*' untouched when no splat param is given", () => {
      expect(buildHref({ to: "/files/*" })).toBe("/files/*");
    });
  });

  describe("search / hash normalization", () => {
    it("adds a leading '?' when missing", () => {
      expect(buildHref({ to: "/about", search: "q=1" })).toBe("/about?q=1");
    });

    it("keeps an existing leading '?'", () => {
      expect(buildHref({ to: "/about", search: "?q=1" })).toBe("/about?q=1");
    });

    it("adds a leading '#' when missing", () => {
      expect(buildHref({ to: "/about", hash: "top" })).toBe("/about#top");
    });

    it("keeps an existing leading '#'", () => {
      expect(buildHref({ to: "/about", hash: "#top" })).toBe("/about#top");
    });

    it("combines search and hash", () => {
      expect(buildHref({ to: "/about", search: "q=1", hash: "top" })).toBe(
        "/about?q=1#top",
      );
    });
  });

  describe("encode/decode round-trip with matchRoutes", () => {
    it("decodes back to the original param value after matching the built href", () => {
      const routes: RouteConfig<string>[] = [
        { path: "/users/:id", component: "user" },
      ];
      const original = "John Doe";

      const href = buildHref({ to: "/users/:id", params: { id: original } });
      const match = matchRoutes(routes, href);

      expect(match?.params.id).toBe(original);
    });

    it("round-trips a splat value through matchRoutes", () => {
      const routes: RouteConfig<string>[] = [
        { path: "/files/*", component: "files" },
      ];
      const original = "a/b c/d";

      const href = buildHref({ to: "/files/*", params: { "*": original } });
      const match = matchRoutes(routes, href);

      expect(match?.params["*"]).toBe(original);
    });
  });
});
