import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, isShallow, provide } from "vue";

import { createRouter } from "../src/createRouter";
import { RouterKey } from "../src/context";
import {
  useLocation,
  useNavigate,
  useParams,
  useRouter,
  useRouterState,
} from "../src/composables";
import { routes } from "./helpers/routes";

import { FakeNavigation } from "@isorouter/test-utils";

import type { AnyVueRouter } from "../src/index";

let nav: FakeNavigation;

beforeEach(() => {
  nav = new FakeNavigation("http://localhost/");
  vi.stubGlobal("navigation", nav);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Mount a host component that provides `router` and run `setupFn` inside a
 * child component — a component can't `inject` what it `provide`s itself.
 */
function mountWithRouter<T>(router: AnyVueRouter, setupFn: () => T) {
  let result!: T;
  const Child = defineComponent({
    setup() {
      result = setupFn();
      return () => h("div");
    },
  });
  const Host = defineComponent({
    setup() {
      provide(RouterKey, router);
      return () => h(Child);
    },
  });
  const wrapper = mount(Host);
  return { wrapper, result };
}

describe("injectRouter", () => {
  it("throws when used outside <RouterView>", () => {
    const Host = defineComponent({
      setup() {
        useRouter();
        return () => h("div");
      },
    });

    expect(() => mount(Host)).toThrow(
      "[isorouter] must be used within <RouterView>",
    );
  });
});

describe("useRouter", () => {
  it("returns the provided router instance", () => {
    const router = createRouter(routes);
    const { result } = mountWithRouter(router, () => useRouter());

    expect(result).toBe(router);
  });
});

describe("useRouterState", () => {
  it("seeds a shallowRef with the current snapshot and updates it on commit", async () => {
    const router = createRouter(routes);
    const { result: state } = mountWithRouter(router, () => useRouterState());

    expect(isShallow(state)).toBe(true);
    const initial = state.value;
    expect(initial).toBe(router.getSnapshot());

    router.start();
    await flushPromises();

    expect(state.value).not.toBe(initial);
    expect(state.value).toBe(router.getSnapshot());
    expect(state.value.components).toEqual([routes[0].component]);
  });

  it("stops updating once the host component is unmounted", async () => {
    const router = createRouter(routes);
    const { wrapper, result: state } = mountWithRouter(router, () =>
      useRouterState(),
    );

    router.start();
    await flushPromises();
    const afterStart = state.value;

    wrapper.unmount();

    router.navigate("/about");
    await flushPromises();

    expect(state.value).toBe(afterStart);
    expect(router.getSnapshot().url.pathname).toBe("/about");
  });
});

describe("useParams", () => {
  it("tracks route params across navigations", async () => {
    const router = createRouter(routes);
    const { result: params } = mountWithRouter(router, () => useParams());

    router.start();
    await flushPromises();
    expect(params.value).toEqual({});

    router.navigate("/concerts/kyiv");
    await flushPromises();
    expect(params.value).toEqual({ city: "kyiv" });
  });
});

describe("useLocation", () => {
  it("exposes the current URL and updates across navigations", async () => {
    const router = createRouter(routes);
    const { result: location } = mountWithRouter(router, () => useLocation());

    router.start();
    await flushPromises();
    expect(location.value.pathname).toBe("/");

    router.navigate("/about");
    await flushPromises();
    expect(location.value.pathname).toBe("/about");
  });
});

describe("useNavigate", () => {
  it("delegates to router.navigate with the given target and options", () => {
    const router = createRouter(routes);
    const navigateSpy = vi.spyOn(router, "navigate");
    const { result: navigate } = mountWithRouter(router, () => useNavigate());

    navigate("/about", { replace: true });

    expect(navigateSpy).toHaveBeenCalledWith("/about", { replace: true });
  });
});
