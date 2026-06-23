import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRouter, SvelteRouter } from "../src/reactive.svelte";
import type { SvelteComponentType } from "../src/index";
import { routes } from "./helpers/routes";

import { FakeNavigation } from "@isorouter/test-utils";

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

describe("createRouter", () => {
  it("returns a SvelteRouter instance", () => {
    const router = createRouter(routes);
    expect(router).toBeInstanceOf(SvelteRouter);
  });
});

describe("navigate / back / forward", () => {
  it("navigate delegates to navigation.navigate with the given target and options", () => {
    const router = createRouter(routes);
    const navigateSpy = vi.spyOn(nav, "navigate");

    router.navigate("/about", { replace: true, state: { from: "test" } });

    expect(navigateSpy).toHaveBeenCalledWith(
      "/about",
      expect.objectContaining({ history: "replace", state: { from: "test" } }),
    );
  });

  it("back and forward delegate to navigation.back/forward", () => {
    const router = createRouter(routes);
    const backSpy = vi.spyOn(nav, "back");
    const forwardSpy = vi.spyOn(nav, "forward");

    router.back();
    router.forward();

    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(forwardSpy).toHaveBeenCalledTimes(1);
  });
});

describe("start / stop", () => {
  it("start registers the navigate listener and commits the initial url", async () => {
    const router = createRouter(routes);
    const addSpy = vi.spyOn(nav, "addEventListener");

    router.start();

    expect(addSpy).toHaveBeenCalledWith("navigate", expect.any(Function));

    await flush();
    expect(router.current.status).toBe("idle");
    expect(router.current.url.pathname).toBe("/");
  });

  it("stop removes the navigate listener", () => {
    const router = createRouter(routes);
    const removeSpy = vi.spyOn(nav, "removeEventListener");

    router.start();
    router.stop();

    expect(removeSpy).toHaveBeenCalledWith("navigate", expect.any(Function));
  });
});

describe("isActive", () => {
  it("delegates to the core router's snapshot url", async () => {
    const router = createRouter(routes);
    router.start();
    await flush();

    expect(router.isActive("/")).toBe(true);
    expect(router.isActive("/about")).toBe(false);

    router.navigate("/about");
    await flush();

    expect(router.isActive("/")).toBe(false);
    expect(router.isActive("/about")).toBe(true);
    expect(router.isActive("/about", { exact: true })).toBe(true);
  });
});

describe("current", () => {
  it("returns a referentially stable snapshot between commits", () => {
    const router = createRouter(routes);
    expect(router.current).toBe(router.current);
  });

  it("re-runs an $effect that reads current on every commit", async () => {
    const router = createRouter(routes);
    const seen: SvelteComponentType[][] = [];

    const dispose = $effect.root(() => {
      $effect(() => {
        seen.push(router.current.components);
      });
    });

    await tick();
    expect(seen).toEqual([[]]);

    router.start();
    await flush();
    await tick();

    expect(seen.length).toBeGreaterThan(1);
    expect(seen.at(-1)).toEqual(router.current.components);

    dispose();
  });

  it("stops re-running the effect once the reactive scope is disposed", async () => {
    const router = createRouter(routes);
    let runs = 0;

    const dispose = $effect.root(() => {
      $effect(() => {
        void router.current;
        runs++;
      });
    });

    await tick();
    expect(runs).toBe(1);

    dispose();

    router.start();
    await flush();
    await tick();

    // The effect was destroyed before the commit, so it must not re-run --
    // but the router itself keeps working for any other consumer.
    expect(runs).toBe(1);
    expect(router.current.status).toBe("idle");
  });
});
