import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRouter } from "../src/createRouter";
import { RouterContext } from "../src/context";
import {
  useLocation,
  useNavigate,
  useParams,
  useRouter,
  useRouterState,
} from "../src/hooks";
import { FakeNavigation } from "@isorouter/test-utils";
import { routes } from "./fixtures";

import type { ReactNode } from "react";
import type { AnyReactRouter } from "../src/index";

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

function wrapperFor(router: AnyReactRouter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
    );
  };
}

describe("useRouter / useRouterInstance", () => {
  it("throws when used outside <Router>", () => {
    // React logs the render error to console.error before re-throwing it.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => renderHook(() => useRouter())).toThrow(
      "[isorouter] hooks must be used within <Router>",
    );

    consoleError.mockRestore();
  });

  it("returns the router instance inside <Router>", () => {
    const router = createRouter(routes);
    const { result } = renderHook(() => useRouter(), {
      wrapper: wrapperFor(router),
    });

    expect(result.current).toBe(router);
  });
});

describe("useRouterState", () => {
  it("returns the current snapshot and re-renders on commit without tearing", async () => {
    const router = createRouter(routes);
    router.start();
    await flush();

    let renders = 0;
    const { result } = renderHook(
      () => {
        renders++;
        return useRouterState();
      },
      { wrapper: wrapperFor(router) },
    );

    expect(result.current).toBe(router.getSnapshot());
    expect(result.current.url.pathname).toBe("/");
    const rendersBefore = renders;

    await act(async () => {
      router.navigate("/about");
      await flush();
    });

    expect(result.current).toBe(router.getSnapshot());
    expect(result.current.url.pathname).toBe("/about");
    // re-rendered (React 18 batches the "navigating" + committed emits into
    // one update), and the snapshot reference is never torn.
    expect(renders).toBeGreaterThan(rendersBefore);
  });
});

describe("useParams", () => {
  it("returns decoded params for a :param route", async () => {
    const router = createRouter(routes);
    router.start();
    await flush();

    await act(async () => {
      router.navigate("/concerts/kyiv");
      await flush();
    });

    const { result } = renderHook(() => useParams<{ city: string }>(), {
      wrapper: wrapperFor(router),
    });

    expect(result.current).toEqual({ city: "kyiv" });
  });
});

describe("useLocation", () => {
  it("returns the current snapshot URL", async () => {
    const router = createRouter(routes);
    router.start();
    await flush();

    const { result } = renderHook(() => useLocation(), {
      wrapper: wrapperFor(router),
    });

    expect(result.current).toBeInstanceOf(URL);
    expect(result.current.pathname).toBe("/");

    await act(async () => {
      router.navigate("/about");
      await flush();
    });

    expect(result.current.pathname).toBe("/about");
  });
});

describe("useNavigate", () => {
  it("returns a referentially stable callback that forwards to router.navigate", async () => {
    const router = createRouter(routes);
    router.start();
    await flush();

    const navigateSpy = vi.spyOn(router, "navigate");
    const { result, rerender } = renderHook(() => useNavigate(), {
      wrapper: wrapperFor(router),
    });

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);

    act(() => {
      result.current("/about" as never, {
        replace: true,
        state: { from: "test" },
      });
    });

    expect(navigateSpy).toHaveBeenCalledWith("/about", {
      replace: true,
      state: { from: "test" },
    });
  });
});
