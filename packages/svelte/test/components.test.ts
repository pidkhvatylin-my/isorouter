import { render, screen } from "@testing-library/svelte";
import { createRawSnippet, tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRouter } from "../src/reactive.svelte";
import Router from "../src/Router.svelte";
import About from "./fixtures/About.svelte";
import DashboardLayout from "./fixtures/DashboardLayout.svelte";
import Home from "./fixtures/Home.svelte";
import NavLayout from "./fixtures/NavLayout.svelte";
import Settings from "./fixtures/Settings.svelte";
import { routes } from "./helpers/routes";

import { FakeNavigation } from "@isorouter/test-utils";

import type { SvelteComponentType } from "../src/reactive.svelte";
import type { RouteConfig } from "@isorouter/core";

let nav: FakeNavigation;

beforeEach(() => {
  nav = new FakeNavigation("http://localhost/");
  vi.stubGlobal("navigation", nav);
  vi.stubGlobal("location", new URL("http://localhost/"));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Wait for any pending `#commit` microtasks to settle, then let Svelte flush. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await tick();
}

const errorRoutes = [
  { path: "/", component: Home },
  {
    path: "broken",
    beforeLoad: () => {
      throw new Error("boom");
    },
  },
] as const satisfies readonly RouteConfig<SvelteComponentType>[];

const layoutOnlyRoutes = [
  {
    path: "shell",
    component: DashboardLayout,
    children: [{ path: "deep", component: Settings }],
  },
] as const satisfies readonly RouteConfig<SvelteComponentType>[];

// A persistent layout (NavLayout) wrapping the `/` and `/about` pages, so that
// the <Nav> Links stay mounted across navigation between them.
const navRoutes = [
  {
    path: "/",
    component: NavLayout,
    children: [
      { index: true, component: Home },
      { path: "about", component: About },
    ],
  },
] as const satisfies readonly RouteConfig<SvelteComponentType>[];

const notFoundSnippet = createRawSnippet(() => ({
  render: () => `<p data-testid="page">missing</p>`,
}));

const loadingSnippet = createRawSnippet(() => ({
  render: () => `<p data-testid="page">loading</p>`,
}));

const errorSnippet = createRawSnippet<[unknown]>((getError) => ({
  render: () => `<p data-testid="page"></p>`,
  setup: (element) => {
    element.textContent = `error:${String(getError())}`;
  },
}));

describe("<Router>", () => {
  it("starts the router on mount and stops it on unmount", () => {
    const router = createRouter(routes);
    const startSpy = vi.spyOn(router, "start");
    const stopSpy = vi.spyOn(router, "stop");

    const { unmount } = render(Router, { props: { router } });

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).not.toHaveBeenCalled();

    unmount();

    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it("renders the matched root component for the initial route", async () => {
    const router = createRouter(routes);
    render(Router, { props: { router } });

    await flush();

    expect(screen.getByTestId("page")).toHaveTextContent("home");
  });

  it("renders nothing before the first commit when no loading prop is given", () => {
    const router = createRouter(routes);
    render(Router, { props: { router } });

    expect(screen.queryByTestId("page")).not.toBeInTheDocument();
  });

  it("renders the loading snippet before the first commit", () => {
    const router = createRouter(routes);
    render(Router, { props: { router, loading: loadingSnippet } });

    expect(screen.getByTestId("page")).toHaveTextContent("loading");
  });

  it("renders the notFound snippet for an unmatched path", async () => {
    const router = createRouter(routes);
    render(Router, { props: { router, notFound: notFoundSnippet } });
    await flush();

    router.navigate("/does-not-exist" as never);
    await flush();

    expect(screen.getByTestId("page")).toHaveTextContent("missing");
  });

  it("renders nothing for a not-found status when no notFound snippet is given", async () => {
    const router = createRouter(routes);
    render(Router, { props: { router } });
    await flush();

    router.navigate("/does-not-exist" as never);
    await flush();

    expect(screen.queryByTestId("page")).not.toBeInTheDocument();
  });

  it("renders error(err) via the error snippet when the route status is 'error'", async () => {
    const router = createRouter(errorRoutes);
    render(Router, { props: { router, error: errorSnippet } });
    await flush();

    router.navigate("/broken");
    await flush();

    expect(screen.getByTestId("page")).toHaveTextContent("error:Error: boom");
  });

  it("renders nothing for an error status when no error snippet is given", async () => {
    const router = createRouter(errorRoutes);
    render(Router, { props: { router } });
    await flush();

    router.navigate("/broken");
    await flush();

    expect(screen.queryByTestId("page")).not.toBeInTheDocument();
  });

  it("swaps the rendered component and updates params on navigation", async () => {
    const router = createRouter(routes);
    render(Router, { props: { router } });
    await flush();

    expect(screen.getByTestId("page")).toHaveTextContent("home");

    router.navigate("/concerts/kyiv");
    await flush();

    expect(screen.getByTestId("page")).toHaveTextContent("concerts:kyiv");
  });
});

describe("<Outlet>", () => {
  it("renders a 2-level nested route parent -> child", async () => {
    const router = createRouter(routes);
    render(Router, { props: { router } });
    await flush();

    router.navigate("/dashboard/settings");
    await flush();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    expect(screen.getByTestId("page")).toHaveTextContent("settings");
  });

  it("renders nothing when there is no matching child", async () => {
    const router = createRouter(layoutOnlyRoutes);
    render(Router, { props: { router } });
    await flush();

    router.navigate("/shell");
    await flush();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    expect(screen.queryByTestId("page")).not.toBeInTheDocument();
  });
});

describe("<Link>", () => {
  it("renders an <a>, merges class + activeClass, sets aria-current, and updates on navigation", async () => {
    const router = createRouter(navRoutes);
    render(Router, { props: { router } });
    await flush();

    const home = screen.getByTestId("link-home");
    const about = screen.getByTestId("link-about");

    expect(home.tagName).toBe("A");
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveTextContent("Home");
    expect(home.className).toBe("nav-link active");
    expect(home).toHaveAttribute("aria-current", "page");
    expect(about.className).toBe("nav-link");
    expect(about).not.toHaveAttribute("aria-current");

    router.navigate("/about");
    await flush();

    expect(home.className).toBe("nav-link");
    expect(home).not.toHaveAttribute("aria-current");
    expect(about.className).toBe("nav-link is-active");
    expect(about).toHaveAttribute("aria-current", "page");
  });

  it("uses a custom activeClass and respects exact", async () => {
    const router = createRouter(routes);
    render(Router, { props: { router } });
    await flush();

    router.navigate("/dashboard/settings");
    await flush();

    expect(screen.getByTestId("link-dashboard")).toHaveClass("is-active");
    const exactLink = screen.getByTestId("link-dashboard-exact");
    expect(exactLink).not.toHaveClass("is-active");
    expect(exactLink.className).toBe("");
  });
});
