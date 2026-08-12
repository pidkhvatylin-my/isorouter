/**
 * Integration tests for `Router` / `createCoreRouter` from @isorouter/core.
 *
 * Uses `FakeNavigation` from `@isorouter/test-utils` to drive the Navigation
 * API without a real browser, covering the full lifecycle: start/stop, guard
 * execution (root → leaf), lazy loading, abort races, and the external-store
 * contract.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeNavigation } from "@isorouter/test-utils";
import { lazy } from "../../src/lazy";
import { createCoreRouter, Router } from "../../src/router";
import type {
  GuardContext,
  MetadataContext,
  RouteConfig,
  RouterSnapshot,
} from "../../src/types";

let nav: FakeNavigation;

beforeEach(() => {
  nav = new FakeNavigation("http://localhost/");
  vi.stubGlobal("navigation", nav);
  vi.stubGlobal("location", new URL("http://localhost/"));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Wait for any pending `#commit` microtasks to settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function deferred<T = void>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const basicRoutes = [
  { path: "/", component: "home", metadata: { title: "Home" } },
  { path: "about", component: "about" },
] as const satisfies readonly RouteConfig<string>[];

describe("external-store contract", () => {
  it("notifies subscribers on each commit until unsubscribed", async () => {
    const router = createCoreRouter(basicRoutes);
    const fn = vi.fn();
    const unsubscribe = router.subscribe(fn);

    router.start();
    await flush();
    // Once for the "navigating" patch, once for the committed snapshot.
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(router.getSnapshot());

    const callsBeforeUnsubscribe = fn.mock.calls.length;
    unsubscribe();
    router.navigate("/about");
    await flush();

    expect(fn).toHaveBeenCalledTimes(callsBeforeUnsubscribe); // no further notifications
    expect(router.getSnapshot().url.pathname).toBe("/about");
  });
});

describe("lifecycle", () => {
  it("does not start or commit when the Navigation API is unavailable", () => {
    vi.stubGlobal("navigation", undefined);
    const router = new Router(basicRoutes);

    router.start();

    expect(router.getSnapshot().status).toBe("idle");
    expect(router.getSnapshot().components).toEqual([]);
  });

  it("start() is idempotent", async () => {
    const router = new Router(basicRoutes);
    const addSpy = vi.spyOn(nav, "addEventListener");

    router.start();
    router.start();
    await flush();

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(router.getSnapshot().status).toBe("idle");
    expect(router.getSnapshot().components).toEqual(["home"]);
  });

  it("stop() removes the listener and aborts an in-flight commit", async () => {
    const guard = deferred();
    const routes = [
      { path: "/", component: "home" },
      {
        path: "slow",
        component: "slow",
        beforeLoad: () => guard.promise,
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/slow");
    await flush(); // guard is pending

    router.stop();
    guard.resolve();
    await flush();

    // The abort fires inside the still-pending guard, so the commit never
    // reaches its emit — status is left at "navigating" and the URL/
    // components from before the aborted navigation are preserved.
    expect(router.getSnapshot().status).toBe("navigating");
    expect(router.getSnapshot().components).toEqual(["home"]);

    const removeSpy = vi.spyOn(nav, "removeEventListener");
    router.stop(); // second stop() is a no-op
    expect(removeSpy).not.toHaveBeenCalled();
  });
});

describe("running without browser globals", () => {
  it("falls back to a safe default URL when location is unavailable", () => {
    vi.stubGlobal("location", undefined);
    const router = new Router(basicRoutes);

    expect(router.getSnapshot().url.href).toBe("http://localhost/");
  });

  it("commits successfully with no document global at all", async () => {
    vi.stubGlobal("document", undefined);
    const router = new Router(basicRoutes);

    router.start();
    await flush();

    expect(router.getSnapshot().status).toBe("idle");
    expect(router.getSnapshot().components).toEqual(["home"]);
  });
});

describe("imperative navigation without the Navigation API", () => {
  it("navigate() throws", () => {
    vi.stubGlobal("navigation", undefined);
    const router = new Router(basicRoutes);

    expect(() => router.navigate("/about")).toThrow(
      /Navigation API unavailable/,
    );
  });

  it("back() and forward() are no-ops", () => {
    vi.stubGlobal("navigation", undefined);
    const router = new Router(basicRoutes);

    expect(() => router.back()).not.toThrow();
    expect(() => router.forward()).not.toThrow();
  });
});

describe("#onNavigate interception guards", () => {
  it("ignores hash-only navigations", async () => {
    const router = new Router(basicRoutes);
    router.start();
    await flush();

    const before = router.getSnapshot();
    nav.dispatchNavigate({
      destinationUrl: "http://localhost/#section",
      hashChange: true,
    });
    await flush();

    expect(router.getSnapshot()).toBe(before);
  });

  it("ignores navigations carrying a download request", async () => {
    const router = new Router(basicRoutes);
    router.start();
    await flush();

    const before = router.getSnapshot();
    // Per spec, `<a download>` (bare attribute) yields downloadRequest === ""
    // — a genuine download — so any non-null value is skipped. (The
    // @virtualstate/navigation polyfill separately reports "" for plain clicks
    // too, which is why link clicks degrade to full-page nav under it; see README.)
    nav.dispatchNavigate({
      destinationUrl: "http://localhost/about",
      downloadRequest: "",
    });
    await flush();

    expect(router.getSnapshot()).toBe(before);
  });

  it("ignores POST form submissions", async () => {
    const router = new Router(basicRoutes);
    router.start();
    await flush();

    const before = router.getSnapshot();
    nav.dispatchNavigate({
      destinationUrl: "http://localhost/about",
      formData: new FormData(),
    });
    await flush();

    expect(router.getSnapshot()).toBe(before);
  });

  it("ignores navigations that cannot be intercepted", async () => {
    const router = new Router(basicRoutes);
    router.start();
    await flush();

    const before = router.getSnapshot();
    nav.dispatchNavigate({
      destinationUrl: "http://localhost/about",
      canIntercept: false,
    });
    await flush();

    expect(router.getSnapshot()).toBe(before);
  });

  it("ignores cross-origin destinations", async () => {
    const router = new Router(basicRoutes);
    router.start();
    await flush();

    const before = router.getSnapshot();
    nav.dispatchNavigate({ destinationUrl: "https://example.com/" });
    await flush();

    expect(router.getSnapshot()).toBe(before);
  });

  it("intercepts a same-origin navigation it didn't initiate itself (e.g. a link click)", async () => {
    const router = new Router(basicRoutes);
    router.start();
    await flush();

    nav.dispatchNavigate({ destinationUrl: "http://localhost/about" });
    await flush();

    expect(router.getSnapshot().url.pathname).toBe("/about");
    expect(router.getSnapshot().components).toEqual(["about"]);
  });
});

describe("not-found", () => {
  it("renders a not-found snapshot for an unmatched path", async () => {
    const router = new Router(basicRoutes);
    router.start();
    await flush();

    router.navigate("/does-not-exist" as never);
    await flush();

    const snapshot = router.getSnapshot();
    expect(snapshot.status).toBe("not-found");
    expect(snapshot.components).toEqual([]);
    expect(snapshot.error).toBeNull();
  });
});

describe("guards", () => {
  it("blocks navigation and restores the previous URL when beforeLoad returns false", async () => {
    const routes = [
      { path: "/", component: "home" },
      { path: "blocked", component: "blocked", beforeLoad: () => false },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/blocked");
    await flush();

    const snapshot = router.getSnapshot();
    expect(snapshot.url.pathname).toBe("/");
    expect(snapshot.status).toBe("idle");
    expect(snapshot.components).toEqual(["home"]);
  });

  it("redirects (replace) when beforeLoad returns a path", async () => {
    const routes = [
      { path: "/", component: "home" },
      { path: "redirect", beforeLoad: () => "/about" },
      { path: "about", component: "about" },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/redirect");
    await flush();

    const snapshot = router.getSnapshot();
    expect(snapshot.url.pathname).toBe("/about");
    expect(snapshot.status).toBe("idle");
    expect(snapshot.components).toEqual(["about"]);
  });

  it("rejects a cross-origin redirect from a guard instead of navigating away", async () => {
    const routes = [
      { path: "/", component: "home" },
      { path: "evil", beforeLoad: () => "https://evil.com" },
    ] as const satisfies readonly RouteConfig<string>[];
    const onError = vi.fn();
    const router = new Router(routes, { onError });

    router.start();
    await flush();
    router.navigate("/evil");
    await flush();

    const snapshot = router.getSnapshot();
    expect(snapshot.status).toBe("error");
    expect(snapshot.url.origin).not.toBe("https://evil.com");
    expect(onError).toHaveBeenCalledOnce();
    expect(snapshot.error).toBeInstanceOf(Error);
    expect((snapshot.error as Error).message).toMatch(/cross-origin redirect/);
  });

  it("sets status to 'error' and calls onError when a guard throws", async () => {
    const boom = new Error("boom");
    const routes = [
      { path: "/", component: "home" },
      {
        path: "broken",
        component: "broken",
        beforeLoad: () => {
          throw boom;
        },
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const onError = vi.fn();
    const router = new Router(routes, { onError });

    router.start();
    await flush();
    router.navigate("/broken");
    await flush();

    const snapshot = router.getSnapshot();
    expect(snapshot.status).toBe("error");
    expect(snapshot.error).toBe(boom);
    expect(snapshot.components).toEqual([]);
    expect(onError).toHaveBeenCalledWith(boom);
  });

  it("runs guards root -> leaf across a nested chain", async () => {
    const order: string[] = [];
    const routes = [
      {
        path: "dashboard",
        component: "layout",
        beforeLoad: () => void order.push("layout"),
        children: [
          {
            path: "settings",
            component: "settings",
            beforeLoad: () => void order.push("settings"),
          },
        ],
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/dashboard/settings");
    await flush();

    expect(order).toEqual(["layout", "settings"]);
    expect(router.getSnapshot().components).toEqual(["layout", "settings"]);
  });
});

describe("abort / race", () => {
  it("a superseding navigation wins over a slower in-flight one", async () => {
    const slow = deferred();
    const routes = [
      { path: "/", component: "home" },
      { path: "slow", component: "slow", beforeLoad: () => slow.promise },
      { path: "about", component: "about" },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();

    router.navigate("/slow");
    await flush(); // commit A is awaiting `slow.promise`

    router.navigate("/about"); // commit B aborts A, completes immediately
    await flush();

    expect(router.getSnapshot().url.pathname).toBe("/about");
    expect(router.getSnapshot().status).toBe("idle");

    slow.resolve(); // A's guard resolves after being superseded
    await flush();

    // A must not clobber B's already-committed snapshot.
    expect(router.getSnapshot().url.pathname).toBe("/about");
    expect(router.getSnapshot().components).toEqual(["about"]);
  });

  it("swallows an error from a guard that throws after being superseded", async () => {
    const guard = deferred();
    const onError = vi.fn();
    const routes = [
      { path: "/", component: "home" },
      {
        path: "broken",
        component: "broken",
        beforeLoad: async () => {
          await guard.promise;
          throw new Error("too late");
        },
      },
      { path: "about", component: "about" },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes, { onError });

    router.start();
    await flush();

    router.navigate("/broken");
    await flush(); // commit A is awaiting `guard.promise`

    router.navigate("/about"); // aborts A
    await flush();

    guard.resolve(); // A's beforeLoad now throws, but its signal is aborted
    await flush();

    expect(router.getSnapshot().url.pathname).toBe("/about");
    expect(router.getSnapshot().status).toBe("idle");
    expect(onError).not.toHaveBeenCalled();
  });

  it("a superseding navigation wins over a slower lazy component load", async () => {
    const slowLoad = deferred<{ default: string }>();
    const routes = [
      { path: "/", component: "home" },
      { path: "slow", component: lazy(() => slowLoad.promise) },
      { path: "about", component: "about" },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();

    router.navigate("/slow");
    await flush(); // commit A is awaiting the lazy import

    router.navigate("/about");
    await flush();

    expect(router.getSnapshot().url.pathname).toBe("/about");

    slowLoad.resolve({ default: "slow-page" });
    await flush();

    expect(router.getSnapshot().url.pathname).toBe("/about");
    expect(router.getSnapshot().components).toEqual(["about"]);
  });
});

describe("onCommit", () => {
  it("is called with the committed snapshot on success", async () => {
    const onCommit = vi.fn();
    const router = new Router(basicRoutes, { onCommit });

    router.start();
    await flush();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenLastCalledWith(router.getSnapshot());
  });

  it("also fires for a not-found landing, so the app can retitle a 404", async () => {
    const onCommit = vi.fn();
    const router = new Router(basicRoutes, { onCommit });

    router.start();
    await flush();
    router.navigate("/does-not-exist" as never);
    await flush();

    expect(onCommit).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "not-found" }),
    );
  });

  it("also fires for an error landing", async () => {
    const routes = [
      { path: "/", component: "home" },
      {
        path: "boom",
        component: "boom",
        beforeLoad: () => {
          throw new Error("boom");
        },
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const onCommit = vi.fn();
    const router = new Router(routes, { onCommit, onError: () => undefined });

    router.start();
    await flush();
    router.navigate("/boom");
    await flush();

    expect(onCommit).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "error" }),
    );
  });

  it("does not fire for a navigation a guard blocks or redirects", async () => {
    const routes = [
      { path: "/", component: "home" },
      { path: "blocked", component: "blocked", beforeLoad: () => false },
      { path: "old", beforeLoad: () => "/" },
    ] as const satisfies readonly RouteConfig<string>[];
    const onCommit = vi.fn();
    const router = new Router(routes, { onCommit });

    router.start();
    await flush();
    onCommit.mockClear();

    router.navigate("/blocked");
    await flush();
    router.navigate("/old");
    await flush();

    // Only the restore / redirect targets settle — never "/blocked" or "/old".
    for (const call of onCommit.mock.calls)
      expect((call[0] as RouterSnapshot<string>).url.pathname).toBe("/");
  });
});

describe("lazy loading", () => {
  it("resolves a lazy component once and caches it across navigations", async () => {
    const load = vi.fn(() => Promise.resolve({ default: "user-page" }));
    const routes = [
      { path: "/", component: "home" },
      { path: "users/:id", component: lazy(load) },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();

    router.navigate("/users/1");
    await flush();
    expect(router.getSnapshot().components).toEqual(["user-page"]);

    router.navigate("/");
    await flush();
    router.navigate("/users/2");
    await flush();

    expect(router.getSnapshot().components).toEqual(["user-page"]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe("isActive", () => {
  const routes = [
    { path: "/", component: "home" },
    {
      path: "dashboard",
      component: "layout",
      children: [{ path: "settings", component: "settings" }],
    },
  ] as const satisfies readonly RouteConfig<string>[];

  it("treats '/' as exact-only", async () => {
    const router = new Router(routes);
    router.start();
    await flush();

    expect(router.isActive("/")).toBe(true);

    router.navigate("/dashboard");
    await flush();

    expect(router.isActive("/")).toBe(false);
  });

  it("matches as a prefix unless exact is set", async () => {
    const router = new Router(routes);
    router.start();
    await flush();

    router.navigate("/dashboard/settings");
    await flush();

    expect(router.isActive("/dashboard")).toBe(true);
    expect(router.isActive("/dashboard", { exact: true })).toBe(false);
    expect(router.isActive("/dashboard/settings", { exact: true })).toBe(true);
    expect(router.isActive("/about")).toBe(false);
  });
});

describe("normalizePath (trailing-slash stripping)", () => {
  const routes = [
    { path: "/", component: "home" },
    { path: "foo", component: "foo" },
  ] as const satisfies readonly RouteConfig<string>[];

  it.each([
    ["/foo/", "/foo", "strips single trailing slash"],
    ["/foo///", "/foo", "strips multiple trailing slashes"],
    ["/", "/", "root stays root"],
    ["/foo", "/foo", "no trailing slash — no-op"],
  ])("isActive treats %s same as %s (%s)", async (withSlash, withoutSlash) => {
    const router = new Router(routes);
    router.start();
    await flush();

    expect(router.isActive(withSlash)).toBe(router.isActive(withoutSlash));
  });
});

describe("metadata", () => {
  it("shallow-merges root -> leaf, a child key overriding its parent", async () => {
    const routes = [
      {
        path: "dashboard",
        component: "layout",
        metadata: { title: "Dashboard", layout: "sidebar" },
        children: [
          {
            path: "settings",
            component: "settings",
            metadata: { title: "Settings" },
          },
        ],
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/dashboard/settings");
    await flush();

    expect(router.getSnapshot().metadata).toEqual({
      title: "Settings",
      layout: "sidebar",
    });
  });

  it("inherits parent keys absent from the child", async () => {
    const routes = [
      {
        path: "dashboard",
        component: "layout",
        metadata: { layout: "sidebar" },
        children: [{ path: "overview", component: "overview" }],
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/dashboard/overview");
    await flush();

    expect(router.getSnapshot().metadata).toEqual({ layout: "sidebar" });
  });

  it("replaces nested objects wholesale rather than deep-merging them", async () => {
    const routes = [
      {
        path: "dashboard",
        component: "layout",
        metadata: { breadcrumb: { label: "Dashboard", icon: "home" } },
        children: [
          {
            path: "settings",
            component: "settings",
            metadata: { breadcrumb: { label: "Settings" } },
          },
        ],
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/dashboard/settings");
    await flush();

    expect(router.getSnapshot().metadata).toEqual({
      breadcrumb: { label: "Settings" },
    });
  });

  it("yields {} for a chain with no metadata", async () => {
    const router = new Router(basicRoutes);

    router.start();
    await flush();
    router.navigate("/about");
    await flush();

    expect(router.getSnapshot().metadata).toEqual({});
  });

  it("resets metadata to {} on a not-found navigation", async () => {
    const router = new Router(basicRoutes); // "/" carries { title: "Home" }

    router.start();
    await flush();
    router.navigate("/does-not-exist" as never);
    await flush();

    expect(router.getSnapshot().status).toBe("not-found");
    expect(router.getSnapshot().metadata).toEqual({});
  });

  it("does not mutate a route's static config object across navigations", async () => {
    const staticMeta = { title: "Home" };
    const routes = [
      { path: "/", component: "home", metadata: staticMeta },
      { path: "about", component: "about", metadata: { title: "About" } },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/about");
    await flush();
    router.navigate("/");
    await flush();

    expect(staticMeta).toEqual({ title: "Home" });
    expect(router.getSnapshot().metadata).toEqual({ title: "Home" });
  });

  it("passes params/url to a metadata function via MetadataContext", async () => {
    const routes = [
      {
        path: "concerts/:city",
        component: "concerts",
        metadata: (ctx: MetadataContext) => ({
          title: `Concerts in ${ctx.params.city}`,
          pathname: ctx.pathname,
        }),
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/concerts/kyiv");
    await flush();

    expect(router.getSnapshot().metadata).toEqual({
      title: "Concerts in kyiv",
      pathname: "/concerts/kyiv",
    });
  });

  it("merges functions and static objects mixed in one chain identically", async () => {
    const routes = [
      {
        path: "dashboard",
        component: "layout",
        metadata: (ctx: MetadataContext) => ({ pathname: ctx.pathname }),
        children: [
          {
            path: "settings",
            component: "settings",
            metadata: { title: "Settings" },
          },
        ],
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/dashboard/settings");
    await flush();

    expect(router.getSnapshot().metadata).toEqual({
      pathname: "/dashboard/settings",
      title: "Settings",
    });
  });

  it("does not call a metadata function when a guard blocks the navigation", async () => {
    const metadataFn = vi.fn(() => ({ title: "Blocked" }));
    const routes = [
      { path: "/", component: "home" },
      {
        path: "blocked",
        component: "blocked",
        beforeLoad: () => false,
        metadata: metadataFn,
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/blocked");
    await flush();

    expect(metadataFn).not.toHaveBeenCalled();
  });

  it("does not call a metadata function when a guard redirects the navigation", async () => {
    const metadataFn = vi.fn(() => ({ title: "Redirect" }));
    const routes = [
      { path: "/", component: "home" },
      {
        path: "redirect",
        beforeLoad: () => "/about",
        metadata: metadataFn,
      },
      { path: "about", component: "about" },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/redirect");
    await flush();

    expect(metadataFn).not.toHaveBeenCalled();
  });
});

describe("back / forward", () => {
  it("traverse the in-memory history", async () => {
    const router = new Router(basicRoutes);

    router.start();
    await flush();
    router.navigate("/about");
    await flush();
    expect(router.getSnapshot().url.pathname).toBe("/about");

    router.back();
    await flush();
    expect(router.getSnapshot().url.pathname).toBe("/");

    router.forward();
    await flush();
    expect(router.getSnapshot().url.pathname).toBe("/about");
  });

  it("back() at the start of history is a safe no-op", async () => {
    const router = new Router(basicRoutes);

    router.start();
    await flush();
    const before = router.getSnapshot();

    router.back();
    await flush();

    expect(router.getSnapshot()).toBe(before);
  });
});

describe("guard context: from", () => {
  /** Captures the `from` seen by the guard on the route it is attached to. */
  function spyFrom() {
    const seen: (GuardContext["from"] | undefined)[] = [];
    return {
      seen,
      guard: (ctx: GuardContext) => {
        seen.push(ctx.from);
      },
    };
  }

  it("is null on the first navigation after a page load", async () => {
    const spy = spyFrom();
    const routes = [
      { path: "/", component: "home", beforeLoad: spy.guard },
    ] as const satisfies readonly RouteConfig<string>[];

    new Router(routes).start();
    await flush();

    expect(spy.seen).toEqual([null]);
  });

  it("carries the previous committed url and params", async () => {
    const spy = spyFrom();
    const routes = [
      { path: "/", component: "home" },
      { path: "users/:id", component: "user" },
      { path: "about", component: "about", beforeLoad: spy.guard },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/users/42");
    await flush();
    router.navigate("/about");
    await flush();

    expect(spy.seen).toHaveLength(1);
    expect(spy.seen[0]?.url.pathname).toBe("/users/42");
    expect(spy.seen[0]?.params).toEqual({ id: "42" });
  });

  it("does not become the next navigation's from when a guard blocks", async () => {
    const spy = spyFrom();
    const routes = [
      { path: "/", component: "home" },
      { path: "blocked", component: "blocked", beforeLoad: () => false },
      { path: "about", component: "about", beforeLoad: spy.guard },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/blocked");
    await flush();
    router.navigate("/about");
    await flush();

    // The blocked attempt never committed — from is still the home page.
    expect(spy.seen[0]?.url.pathname).toBe("/");
  });

  it("skips the redirecting route and reports the redirect target as from", async () => {
    const spy = spyFrom();
    const routes = [
      { path: "/", component: "home" },
      { path: "old", beforeLoad: () => "/new" },
      { path: "new", component: "new" },
      { path: "about", component: "about", beforeLoad: spy.guard },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/old");
    await flush();
    router.navigate("/about");
    await flush();

    // "/old" never committed; "/new" did.
    expect(spy.seen[0]?.url.pathname).toBe("/new");
  });

  it("treats a not-found landing as a committed location", async () => {
    const spy = spyFrom();
    const routes = [
      { path: "/", component: "home" },
      { path: "about", component: "about", beforeLoad: spy.guard },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/nope" as never);
    await flush();
    router.navigate("/about");
    await flush();

    expect(router.getSnapshot().status).toBe("idle");
    expect(spy.seen[0]?.url.pathname).toBe("/nope");
    expect(spy.seen[0]?.params).toEqual({});
  });

  it("is observed by every guard in the chain, root → leaf", async () => {
    const parent = spyFrom();
    const child = spyFrom();
    const routes = [
      { path: "/", component: "home" },
      {
        path: "dashboard",
        component: "layout",
        beforeLoad: parent.guard,
        children: [
          { path: "settings", component: "settings", beforeLoad: child.guard },
        ],
      },
    ] as const satisfies readonly RouteConfig<string>[];
    const router = new Router(routes);

    router.start();
    await flush();
    router.navigate("/dashboard/settings");
    await flush();

    expect(parent.seen[0]?.url.pathname).toBe("/");
    expect(child.seen[0]?.url.pathname).toBe("/");
  });
});
