import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import { Link } from "../src/Link";
import { RouterView } from "../src/RouterView";
import { DashboardLayout, Home, Settings } from "./helpers/components";
import { createTestRouter } from "./helpers/router";
import { routes } from "./helpers/routes";

import { FakeNavigation } from "@isorouter/test-utils";

import type { VueComponentType } from "../src/context";
import type { RouteConfig, Unsubscribe } from "@isorouter/core";
import type { Mock } from "vitest";

let nav: FakeNavigation;

beforeEach(() => {
  nav = new FakeNavigation("http://localhost/");
  vi.stubGlobal("navigation", nav);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RouterView", () => {
  it("starts the router on mount and stops + unsubscribes on unmount", async () => {
    const router = createTestRouter(routes);
    const startSpy = vi.spyOn(router, "start");
    const stopSpy = vi.spyOn(router, "stop");
    const realSubscribe = router.subscribe.bind(router);
    let unsubscribeSpy: Mock<Unsubscribe> | undefined;
    vi.spyOn(router, "subscribe").mockImplementation((fn) => {
      unsubscribeSpy = vi.fn<Unsubscribe>(realSubscribe(fn));
      return unsubscribeSpy;
    });

    const wrapper = mount(RouterView, { props: { router } });
    await flushPromises();

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).not.toHaveBeenCalled();

    wrapper.unmount();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it("renders the matched root component", async () => {
    const router = createTestRouter(routes);
    const wrapper = mount(RouterView, { props: { router } });

    await flushPromises();

    expect(wrapper.find('[data-testid="page"]').text()).toBe("home");
  });

  it("renders the loading slot before the first commit settles", () => {
    const router = createTestRouter(routes);
    const wrapper = mount(RouterView, {
      props: { router },
      slots: {
        loading: () => h("p", { "data-testid": "loading" }, "loading..."),
      },
    });

    expect(wrapper.find('[data-testid="loading"]').text()).toBe("loading...");
  });

  it("renders the notFound slot for an unmatched path", async () => {
    const router = createTestRouter(routes);
    const wrapper = mount(RouterView, {
      props: { router },
      slots: {
        notFound: () => h("p", { "data-testid": "notfound" }, "404"),
      },
    });
    await flushPromises();

    router.navigate("/does-not-exist" as never);
    await flushPromises();

    expect(wrapper.find('[data-testid="notfound"]').text()).toBe("404");
  });

  it("renders the error slot with the thrown error", async () => {
    const boom = new Error("boom");
    const errorRoutes = [
      { path: "/", component: Home },
      {
        path: "broken",
        component: Home,
        beforeLoad: () => {
          throw boom;
        },
      },
    ] as const satisfies readonly RouteConfig<VueComponentType>[];
    const router = createTestRouter(errorRoutes);
    const wrapper = mount(RouterView, {
      props: { router },
      slots: {
        error: ({ error }: { error: unknown }) =>
          h("pre", { "data-testid": "error" }, String(error)),
      },
    });
    await flushPromises();

    router.navigate("/broken");
    await flushPromises();

    expect(wrapper.find('[data-testid="error"]').text()).toContain("boom");
  });

  it("swaps the rendered component and updates params/location on navigation", async () => {
    const router = createTestRouter(routes);
    const wrapper = mount(RouterView, { props: { router } });
    await flushPromises();

    expect(wrapper.find('[data-testid="page"]').text()).toBe("home");

    router.navigate("/concerts/kyiv");
    await flushPromises();

    expect(wrapper.find('[data-testid="page"]').text()).toBe("concerts:kyiv");
    expect(router.getSnapshot().params).toEqual({ city: "kyiv" });
    expect(router.getSnapshot().url.pathname).toBe("/concerts/kyiv");
  });
});

describe("Outlet", () => {
  it("renders a nested child inside its parent's outlet", async () => {
    const router = createTestRouter(routes);
    const wrapper = mount(RouterView, { props: { router } });
    await flushPromises();

    router.navigate("/dashboard/settings");
    await flushPromises();

    expect(wrapper.find("h1").text()).toBe("Dashboard");
    expect(wrapper.find('[data-testid="page"]').text()).toBe("settings");
  });

  it("renders nothing when there is no matching child route", async () => {
    const layoutOnlyRoutes = [
      { path: "/", component: Home },
      {
        path: "empty",
        component: DashboardLayout,
        children: [{ path: "settings", component: Settings }],
      },
    ] as const satisfies readonly RouteConfig<VueComponentType>[];
    const router = createTestRouter(layoutOnlyRoutes);
    const wrapper = mount(RouterView, { props: { router } });
    await flushPromises();

    router.navigate("/empty");
    await flushPromises();

    expect(wrapper.find("h1").text()).toBe("Dashboard");
    expect(wrapper.find('[data-testid="page"]').exists()).toBe(false);
  });
});

describe("Link", () => {
  const Nav = defineComponent({
    name: "Nav",
    render: () => [
      h(Link, { href: "/", exact: true }, () => "Home"),
      h(Link, { href: "/about", activeClass: "is-active" }, () => "About"),
    ],
  });

  const linkRoutes = [
    { path: "/", component: Nav },
    { path: "about", component: Nav },
  ] as const satisfies readonly RouteConfig<VueComponentType>[];

  it("renders <a href>, applies activeClass + aria-current, respects exact, and updates after navigation", async () => {
    const router = createTestRouter(linkRoutes);
    const wrapper = mount(RouterView, { props: { router } });
    await flushPromises();

    let [home, about] = wrapper.findAll("a");

    expect(home.attributes("href")).toBe("/");
    expect(home.text()).toBe("Home");
    expect(about.attributes("href")).toBe("/about");
    expect(about.text()).toBe("About");

    // "/" matches exactly -> active; "/about" does not.
    expect(home.classes()).toContain("active");
    expect(home.attributes("aria-current")).toBe("page");
    expect(about.classes()).not.toContain("is-active");
    expect(about.attributes("aria-current")).toBeUndefined();

    router.navigate("/about");
    await flushPromises();

    [home, about] = wrapper.findAll("a");
    expect(home.classes()).not.toContain("active");
    expect(about.classes()).toContain("is-active");
    expect(about.attributes("aria-current")).toBe("page");
  });
});
