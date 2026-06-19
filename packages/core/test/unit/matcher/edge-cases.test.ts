/**
 * Edge cases ported from the public path-matching suites of:
 *   - remix-run/react-router  (packages/react-router/__tests__/matchPath-test.tsx)
 *   - TanStack/router         (packages/router-core/tests/match-by-path.test.ts, path.test.ts)
 *
 * Their patterns are translated to this matcher's API:
 *   `$id`/`:id` -> `:id`,  `$`/`{$}` splat -> `*`,  index route -> `{ index: true }`.
 *
 * Where our semantics deliberately diverge from those routers it is called out
 * inline — chiefly: (a) matching is CASE-SENSITIVE (react-router is not by
 * default), and (b) trailing/duplicate slashes are normalized away on BOTH the
 * route and the pathname (TanStack is trailing-slash sensitive by default).
 */

import { describe, expect, it } from "vitest";
import { matchRoutes } from "../../../src/matcher";
import type { RouteConfig } from "../../../src/types";

const r = (...routes: RouteConfig<string>[]) => routes;
const chain = (m: ReturnType<typeof matchRoutes<string>>) =>
  m?.chain.map((route) => route.component);

describe("static matching", () => {
  it("matches exact static paths and rejects mismatches", () => {
    const routes = r({ path: "a/b", component: "ab" });
    expect(chain(matchRoutes(routes, "/a/b"))).toEqual(["ab"]);
    expect(matchRoutes(routes, "/b")).toBeNull();
    expect(matchRoutes(routes, "/a")).toBeNull();
  });

  it("matches the empty pathname and the bare root against '/'", () => {
    const routes = r({ path: "/", component: "home" });
    expect(chain(matchRoutes(routes, ""))).toEqual(["home"]);
    expect(chain(matchRoutes(routes, "/"))).toEqual(["home"]);
  });

  // react-router: "/usersblah" must NOT match "/users" — a static segment is
  // matched whole, never as a prefix of a longer segment.
  it("does not match a static segment as a prefix of a longer segment", () => {
    const routes = r({ path: "users", component: "users" });
    expect(matchRoutes(routes, "/usersblah")).toBeNull();
  });
});

describe("trailing & duplicate slashes (normalized on both sides)", () => {
  // TanStack distinguishes "/a" from "/a/"; we treat them as identical because
  // `segments()` drops every empty token.
  it("ignores a trailing slash on the pathname", () => {
    const routes = r({ path: "a/b", component: "ab" });
    expect(chain(matchRoutes(routes, "/a/b/"))).toEqual(["ab"]);
  });

  it("ignores a trailing slash declared on the route", () => {
    const routes = r({ path: "a/", component: "a" });
    expect(chain(matchRoutes(routes, "/a"))).toEqual(["a"]);
    expect(chain(matchRoutes(routes, "/a/"))).toEqual(["a"]);
  });

  it("ignores a missing leading slash and collapses interior empties", () => {
    const routes = r({ path: "a/b", component: "ab" });
    expect(chain(matchRoutes(routes, "a/b"))).toEqual(["ab"]);
    expect(chain(matchRoutes(routes, "/a//b"))).toEqual(["ab"]);
    expect(chain(matchRoutes(routes, "///a///b///"))).toEqual(["ab"]);
  });
});

describe("dynamic params", () => {
  it("captures single and multiple params", () => {
    expect(
      matchRoutes(r({ path: "a/:id", component: "x" }), "/a/1")?.params,
    ).toEqual({
      id: "1",
    });
    expect(
      matchRoutes(r({ path: "a/:id/b/:other", component: "x" }), "/a/1/b/2")
        ?.params,
    ).toEqual({ id: "1", other: "2" });
  });

  it("lets a later duplicate param name overwrite the earlier one", () => {
    // Mirrors TanStack `'/a/$id/b/$id'` -> `{ id: '2' }`.
    expect(
      matchRoutes(r({ path: "a/:id/b/:id", component: "x" }), "/a/1/b/2")
        ?.params,
    ).toEqual({ id: "2" });
  });

  it("captures the raw segment text without trimming trailing characters", () => {
    expect(
      matchRoutes(r({ path: "a/:id", component: "x" }), "/a/1_")?.params,
    ).toEqual({
      id: "1_",
    });
  });

  it("requires a value for a param segment (no zero-length match)", () => {
    // "/users" cannot satisfy "users/:id" — the param segment has no value.
    expect(
      matchRoutes(r({ path: "users/:id", component: "x" }), "/users"),
    ).toBeNull();
  });

  it("captures values with hyphens, underscores and symbols verbatim", () => {
    // Ported from wouter: a param matches the whole segment, so punctuation
    // and symbols inside a value are captured (and decoded) as-is.
    expect(
      matchRoutes(r({ path: "users/:name", component: "x" }), "/users/1-alex")
        ?.params,
    ).toEqual({ name: "1-alex" });
    expect(
      matchRoutes(
        r({ path: "users/:name/bio", component: "x" }),
        "/users/$102_Kathrine&/bio",
      )?.params,
    ).toEqual({ name: "$102_Kathrine&" });
  });

  describe("decoding", () => {
    it("decodes %20 to a space in a param", () => {
      expect(
        matchRoutes(
          r({ path: "users/:name", component: "x" }),
          "/users/John%20Doe",
        )?.params,
      ).toEqual({ name: "John Doe" });
    });

    it("decodes an encoded slash without splitting the segment", () => {
      // "%2F" is literal text in the pathname, so it is one segment that
      // decodes to contain a "/".
      expect(
        matchRoutes(r({ path: "users/:id", component: "x" }), "/users/a%2Fb")
          ?.params,
      ).toEqual({ id: "a/b" });
    });

    it("leaves '+' untouched (decodeURIComponent does not treat it as space)", () => {
      expect(
        matchRoutes(r({ path: "users/:id", component: "x" }), "/users/a+b")
          ?.params,
      ).toEqual({ id: "a+b" });
    });
  });
});

describe("splat / wildcard", () => {
  it("captures the remaining segments joined by '/'", () => {
    expect(
      matchRoutes(r({ path: "a/*", component: "x" }), "/a/b/c")?.params,
    ).toEqual({
      "*": "b/c",
    });
  });

  // TanStack: both "/a" and "/a/" against "/a/$" capture "".
  it("captures an empty string when nothing remains, with or without a trailing slash", () => {
    const routes = r({ path: "a/*", component: "x" });
    expect(matchRoutes(routes, "/a")?.params).toEqual({ "*": "" });
    expect(matchRoutes(routes, "/a/")?.params).toEqual({ "*": "" });
  });

  it("decodes each captured segment", () => {
    // From TanStack path.test: parentheses survive, spaces/brackets decode.
    expect(
      matchRoutes(
        r({ path: "docs/*", component: "x" }),
        "/docs/file%20(copy)%20%5B2%5D.pdf",
      )?.params,
    ).toEqual({ "*": "file (copy) [2].pdf" });
  });

  it("does not let an asterisk inside a param value disturb a later splat", () => {
    // react-router `'/users/:name/*'` vs `'/users/foo*/splat'`.
    expect(
      matchRoutes(
        r({ path: "users/:name/*", component: "x" }),
        "/users/foo*/splat",
      )?.params,
    ).toEqual({ name: "foo*", "*": "splat" });
  });
});

describe("case sensitivity (DIVERGENCE: we are case-sensitive)", () => {
  // react-router matches "/systemdashboard" against "/SystemDashboard" by
  // default; we require an exact-case match on static segments.
  it("rejects a case-mismatched static segment", () => {
    expect(
      matchRoutes(
        r({ path: "SystemDashboard", component: "x" }),
        "/systemdashboard",
      ),
    ).toBeNull();
    expect(matchRoutes(r({ path: "a/b", component: "x" }), "/A/B")).toBeNull();
  });
});

describe("ranking / specificity (most specific wins, regardless of order)", () => {
  it("prefers a static segment over a param", () => {
    const routes = r(
      { path: ":id", component: "param" },
      { path: "new", component: "static" },
    );
    expect(chain(matchRoutes(routes, "/new"))).toEqual(["static"]);
    expect(chain(matchRoutes(routes, "/123"))).toEqual(["param"]);
  });

  it("prefers a param over a splat", () => {
    const routes = r(
      { path: "*", component: "splat" },
      { path: ":id", component: "param" },
    );
    expect(chain(matchRoutes(routes, "/123"))).toEqual(["param"]);
  });

  it("prefers the route with more static segments at equal depth", () => {
    const routes = r(
      { path: "a/:x", component: "param" },
      { path: "a/b", component: "static" },
    );
    expect(chain(matchRoutes(routes, "/a/b"))).toEqual(["static"]);
  });

  it("breaks an exact-score tie by source order", () => {
    // ":id/b" and "a/:x" both score static+param for "/a/b"; first declared wins.
    const routes = r(
      { path: ":id/b", component: "first" },
      { path: "a/:x", component: "second" },
    );
    const match = matchRoutes(routes, "/a/b");
    expect(chain(match)).toEqual(["first"]);
    expect(match?.params).toEqual({ id: "a" });
  });
});

describe("nested routes, index & splat fallback", () => {
  it("matches an index route only when the parent path is fully consumed", () => {
    const routes = r({
      path: "users",
      component: "layout",
      children: [
        { index: true, component: "list" },
        { path: ":id", component: "detail" },
      ],
    });
    expect(chain(matchRoutes(routes, "/users"))).toEqual(["layout", "list"]);
    expect(chain(matchRoutes(routes, "/users/42"))).toEqual([
      "layout",
      "detail",
    ]);
  });

  it("bubbles parent params down into the matched child", () => {
    const routes = r({
      path: "users/:userId",
      component: "userLayout",
      children: [{ path: "posts/:postId", component: "post" }],
    });
    const match = matchRoutes(routes, "/users/42/posts/7");
    expect(chain(match)).toEqual(["userLayout", "post"]);
    expect(match?.params).toEqual({ userId: "42", postId: "7" });
  });

  it("falls back to a root splat when no specific route matches", () => {
    const routes = r(
      { path: "users/:id", component: "user" },
      { path: "*", component: "notFound" },
    );
    expect(chain(matchRoutes(routes, "/about/team"))).toEqual(["notFound"]);
    expect(matchRoutes(routes, "/about/team")?.params).toEqual({
      "*": "about/team",
    });
  });
});
