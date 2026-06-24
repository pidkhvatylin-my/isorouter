/**
 * Baseline specification for `matchRoutes`.
 *
 * Covers the canonical behaviour of every feature in isolation: static paths,
 * specificity ranking, dynamic params, splat capture, index routes, nested
 * layouts, path normalisation, and pathless wrappers. Each case is the minimum
 * reproducer for its contract.
 */

import { describe, expect, it } from "vitest";
import { matchRoutes } from "../../../src/matcher";
import type { RouteConfig } from "../../../src/types";

describe("matchRoutes", () => {
  it("matches a static route", () => {
    const routes: RouteConfig<string>[] = [
      { path: "/", component: "home" },
      { path: "about", component: "about" },
    ];
    expect(matchRoutes(routes, "/about")).toEqual({
      chain: [routes[1]],
      params: {},
    });
  });

  it("returns null when nothing matches", () => {
    const routes: RouteConfig<string>[] = [
      { path: "about", component: "about" },
    ];
    expect(matchRoutes(routes, "/missing")).toBeNull();
  });

  it("matches the root path against a '/' route", () => {
    const routes: RouteConfig<string>[] = [{ path: "/", component: "home" }];
    expect(matchRoutes(routes, "/")?.chain).toEqual([routes[0]]);
  });

  describe("specificity", () => {
    it("prefers a static segment over a dynamic one, regardless of order", () => {
      const routes: RouteConfig<string>[] = [
        { path: ":id", component: "dynamic" },
        { path: "new", component: "static" },
      ];
      expect(matchRoutes(routes, "/new")?.chain).toEqual([routes[1]]);
      expect(matchRoutes(routes, "/123")?.chain).toEqual([routes[0]]);
    });

    it("prefers a dynamic segment over a splat", () => {
      const routes: RouteConfig<string>[] = [
        { path: "*", component: "splat" },
        { path: ":id", component: "dynamic" },
      ];
      const match = matchRoutes(routes, "/123");
      expect(match?.chain).toEqual([routes[1]]);
      expect(match?.params).toEqual({ id: "123" });
    });

    it("breaks ties between equally-specific routes by source order", () => {
      // "a/:id" and ":x/b" both score static+param for "/a/b" — first wins.
      const routes: RouteConfig<string>[] = [
        { path: "a/:id", component: "first" },
        { path: ":x/b", component: "second" },
      ];
      const match = matchRoutes(routes, "/a/b");
      expect(match?.chain).toEqual([routes[0]]);
      expect(match?.params).toEqual({ id: "b" });
    });
  });

  describe("dynamic segments", () => {
    it("captures and decodes params", () => {
      const routes: RouteConfig<string>[] = [
        { path: "users/:name", component: "user" },
      ];
      const match = matchRoutes(routes, "/users/John%20Doe");
      expect(match?.params).toEqual({ name: "John Doe" });
    });
  });

  describe("splat", () => {
    it("captures and decodes the remaining path segments joined by '/'", () => {
      const routes: RouteConfig<string>[] = [
        { path: "files/*", component: "files" },
      ];
      const match = matchRoutes(routes, "/files/a/b%20c/d");
      expect(match?.params).toEqual({ "*": "a/b c/d" });
    });

    it("captures an empty string when nothing remains", () => {
      const routes: RouteConfig<string>[] = [
        { path: "*", component: "catchall" },
      ];
      expect(matchRoutes(routes, "/")?.params).toEqual({ "*": "" });
    });

    it("does not match the root '/' route when a more specific path: '/' route is declared first", () => {
      const routes: RouteConfig<string>[] = [
        { path: "/", component: "home" },
        { path: "*", component: "catchall" },
      ];
      expect(matchRoutes(routes, "/")?.chain[0]?.component).toBe("home");
      expect(matchRoutes(routes, "/missing")?.chain[0]?.component).toBe("catchall");
    });

    it("catches unmatched paths inside a nested route subtree", () => {
      const routes: RouteConfig<string>[] = [
        {
          path: "dashboard",
          component: "layout",
          children: [
            { path: "settings", component: "settings" },
            { path: "*", component: "not-found" },
          ],
        },
      ];
      expect(matchRoutes(routes, "/dashboard/settings")?.chain.at(-1)?.component).toBe("settings");
      expect(matchRoutes(routes, "/dashboard/unknown")?.chain.at(-1)?.component).toBe("not-found");
    });
  });

  describe("index routes", () => {
    it("matches only when the parent path is fully consumed", () => {
      const routes: RouteConfig<string>[] = [
        {
          path: "dashboard",
          component: "layout",
          children: [
            { index: true, component: "overview" },
            { path: "settings", component: "settings" },
          ],
        },
      ];

      const root = matchRoutes(routes, "/dashboard");
      expect(root?.chain.map((r) => r.component)).toEqual([
        "layout",
        "overview",
      ]);

      const settings = matchRoutes(routes, "/dashboard/settings");
      expect(settings?.chain.map((r) => r.component)).toEqual([
        "layout",
        "settings",
      ]);
    });
  });

  describe("nested routes", () => {
    it("returns the chain root -> leaf and bubbles parent params to children", () => {
      const routes: RouteConfig<string>[] = [
        {
          path: "users/:userId",
          component: "userLayout",
          children: [{ path: "posts/:postId", component: "post" }],
        },
      ];
      const match = matchRoutes(routes, "/users/42/posts/7");
      expect(match?.chain.map((r) => r.component)).toEqual([
        "userLayout",
        "post",
      ]);
      expect(match?.params).toEqual({ userId: "42", postId: "7" });
    });

    it("matches a parent alone when no child matches but its own path is fully consumed", () => {
      const routes: RouteConfig<string>[] = [
        {
          path: "dashboard",
          component: "layout",
          children: [{ path: "settings", component: "settings" }],
        },
      ];
      const match = matchRoutes(routes, "/dashboard");
      expect(match?.chain.map((r) => r.component)).toEqual(["layout"]);
    });

    it("does not match a parent whose path is only partially consumed and no child matches", () => {
      const routes: RouteConfig<string>[] = [
        {
          path: "dashboard",
          component: "layout",
          children: [{ path: "settings", component: "settings" }],
        },
      ];
      expect(matchRoutes(routes, "/dashboard/unknown")).toBeNull();
    });
  });

  describe("path normalization", () => {
    it("ignores leading/trailing slashes on both routes and pathnames", () => {
      const routes: RouteConfig<string>[] = [
        { path: "/a/b/", component: "ab" },
      ];
      expect(matchRoutes(routes, "/a/b")?.chain).toEqual([routes[0]]);
      expect(matchRoutes(routes, "a/b/")?.chain).toEqual([routes[0]]);
    });
  });

  describe("pathless routes", () => {
    it("treats a route with no path as a transparent layout, passing the full path to its children", () => {
      // A sibling with a `path` is required so `specificity()` (which
      // computes `route.path ?? ""`) actually runs for the pathless route —
      // `Array.prototype.sort` skips the comparator for single-element arrays.
      const routes: RouteConfig<string>[] = [
        { path: "standalone", component: "standalone" },
        {
          component: "shell",
          children: [{ path: "dashboard", component: "dashboard" }],
        },
      ];
      const match = matchRoutes(routes, "/dashboard");
      expect(match?.chain.map((r) => r.component)).toEqual([
        "shell",
        "dashboard",
      ]);
    });

    it("matches a pathless route alone when no child matches and the path is fully consumed", () => {
      const routes: RouteConfig<string>[] = [
        {
          component: "shell",
          children: [{ path: "about", component: "about" }],
        },
      ];
      const match = matchRoutes(routes, "/");
      expect(match?.chain.map((r) => r.component)).toEqual(["shell"]);
    });
  });
});
