import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRouter } from "../src/createRouter";
import { RouterContext } from "../src/context";
import { Link } from "../src/Link";
import { Router } from "../src/Router";
import { FakeNavigation } from "@isorouter/test-utils";
import { DashboardLayout, Home, Settings, routes } from "./fixtures";

import type { RouteConfig } from "@isorouter/core";
import type { ReactComponentType } from "../src/context";

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

const errorRoutes = [
  { path: "/", component: Home },
  {
    path: "broken",
    beforeLoad: () => {
      throw new Error("boom");
    },
  },
] as const satisfies readonly RouteConfig<ReactComponentType>[];

const layoutOnlyRoutes = [
  {
    path: "shell",
    component: DashboardLayout,
    children: [{ path: "deep", component: Settings }],
  },
] as const satisfies readonly RouteConfig<ReactComponentType>[];

describe("<Router>", () => {
  it("starts the router on mount and stops it on unmount", () => {
    const router = createRouter(routes);
    const startSpy = vi.spyOn(router, "start");
    const stopSpy = vi.spyOn(router, "stop");

    const { unmount } = render(<Router router={router} />);

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).not.toHaveBeenCalled();

    unmount();

    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it("renders the matched root component for the initial route", async () => {
    const router = createRouter(routes);
    render(<Router router={router} />);

    await act(async () => {
      await flush();
    });

    expect(screen.getByTestId("page")).toHaveTextContent("home");
  });

  it("renders null before the first commit when no loading prop is given", () => {
    const router = createRouter(routes);
    const { container } = render(<Router router={router} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the loading prop before the first commit", () => {
    const router = createRouter(routes);
    render(
      <Router router={router} loading={<p data-testid="page">loading</p>} />,
    );

    expect(screen.getByTestId("page")).toHaveTextContent("loading");
  });

  it("renders the notFound prop for an unmatched path", async () => {
    const router = createRouter(routes);
    render(
      <Router router={router} notFound={<p data-testid="page">missing</p>} />,
    );
    await act(async () => {
      await flush();
    });

    await act(async () => {
      router.navigate("/does-not-exist" as never);
      await flush();
    });

    expect(screen.getByTestId("page")).toHaveTextContent("missing");
  });

  it("renders null for a not-found status when no notFound prop is given", async () => {
    const router = createRouter(routes);
    render(<Router router={router} />);
    await act(async () => {
      await flush();
    });

    await act(async () => {
      router.navigate("/does-not-exist" as never);
      await flush();
    });

    expect(screen.queryByTestId("page")).not.toBeInTheDocument();
  });

  it("renders error(err) when the route status is 'error'", async () => {
    const router = createRouter(errorRoutes);
    render(
      <Router
        router={router}
        error={(err) => <p data-testid="page">error:{String(err)}</p>}
      />,
    );
    await act(async () => {
      await flush();
    });

    await act(async () => {
      router.navigate("/broken");
      await flush();
    });

    expect(screen.getByTestId("page")).toHaveTextContent("error:Error: boom");
  });

  it("renders null for an error status when no error prop is given", async () => {
    const router = createRouter(errorRoutes);
    render(<Router router={router} />);
    await act(async () => {
      await flush();
    });

    await act(async () => {
      router.navigate("/broken");
      await flush();
    });

    expect(screen.queryByTestId("page")).not.toBeInTheDocument();
  });

  it("swaps the rendered component and updates params on navigation", async () => {
    const router = createRouter(routes);
    render(<Router router={router} />);
    await act(async () => {
      await flush();
    });
    expect(screen.getByTestId("page")).toHaveTextContent("home");

    await act(async () => {
      router.navigate("/concerts/kyiv");
      await flush();
    });

    expect(screen.getByTestId("page")).toHaveTextContent("concerts:kyiv");
  });

  describe("StrictMode", () => {
    it("does not leak a subscription when effects double-fire", async () => {
      const router = createRouter(routes);
      const originalSubscribe = router.subscribe.bind(router);
      let active = 0;
      vi.spyOn(router, "subscribe").mockImplementation((fn) => {
        active++;
        const unsubscribe = originalSubscribe(fn);
        return () => {
          active--;
          unsubscribe();
        };
      });

      const { unmount } = render(
        <StrictMode>
          <Router router={router} />
        </StrictMode>,
      );
      await act(async () => {
        await flush();
      });

      expect(active).toBe(1);

      unmount();

      expect(active).toBe(0);
    });
  });
});

describe("<Outlet>", () => {
  it("renders a 2-level nested route parent -> child", async () => {
    const router = createRouter(routes);
    render(<Router router={router} />);
    await act(async () => {
      await flush();
    });

    await act(async () => {
      router.navigate("/dashboard/settings");
      await flush();
    });

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    expect(screen.getByTestId("page")).toHaveTextContent("settings");
  });

  it("renders nothing when there is no matching child", async () => {
    const router = createRouter(layoutOnlyRoutes);
    render(<Router router={router} />);
    await act(async () => {
      await flush();
    });

    await act(async () => {
      router.navigate("/shell");
      await flush();
    });

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    expect(screen.queryByTestId("page")).not.toBeInTheDocument();
  });
});

describe("<Link>", () => {
  it("renders an <a>, forwarding ref and rest props", () => {
    const router = createRouter(routes);
    const ref = createRef<HTMLAnchorElement>();

    render(
      <RouterContext.Provider value={router}>
        <Link href="/about" ref={ref} data-testid="link-about" target="_blank">
          About
        </Link>
      </RouterContext.Provider>,
    );

    const link = screen.getByTestId("link-about");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/about");
    expect(link).toHaveAttribute("target", "_blank");
    expect(ref.current).toBe(link);
  });

  it("merges className with activeClassName and sets aria-current when active", async () => {
    const router = createRouter(routes);
    router.start();
    await flush();

    render(
      <RouterContext.Provider value={router}>
        <Link href="/" className="nav-link" data-testid="link-home">
          Home
        </Link>
        <Link href="/about" className="nav-link" data-testid="link-about">
          About
        </Link>
      </RouterContext.Provider>,
    );

    const home = screen.getByTestId("link-home");
    const about = screen.getByTestId("link-about");

    expect(home.className).toBe("nav-link active");
    expect(home).toHaveAttribute("aria-current", "page");
    expect(about.className).toBe("nav-link");
    expect(about).not.toHaveAttribute("aria-current");

    await act(async () => {
      router.navigate("/about");
      await flush();
    });

    expect(home.className).toBe("nav-link");
    expect(home).not.toHaveAttribute("aria-current");
    expect(about.className).toBe("nav-link active");
    expect(about).toHaveAttribute("aria-current", "page");
  });

  it("uses a custom activeClassName and respects exact", async () => {
    const router = createRouter(routes);
    router.start();
    await flush();

    await act(async () => {
      router.navigate("/dashboard/settings");
      await flush();
    });

    render(
      <RouterContext.Provider value={router}>
        <Link
          href="/dashboard"
          activeClassName="is-active"
          data-testid="link-dashboard"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard"
          exact
          activeClassName="is-active"
          data-testid="link-dashboard-exact"
        >
          Dashboard
        </Link>
      </RouterContext.Provider>,
    );

    expect(screen.getByTestId("link-dashboard")).toHaveClass("is-active");
    const exactLink = screen.getByTestId("link-dashboard-exact");
    expect(exactLink).not.toHaveClass("is-active");
    expect(exactLink.className).toBe("");
  });
});
