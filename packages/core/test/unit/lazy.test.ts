/**
 * Unit tests for `lazy` and `isLazy` from @isorouter/core.
 */

import { describe, expect, it, vi } from "vitest";
import { isLazy, lazy, type LazyComponent } from "../../src/lazy";

describe("lazy", () => {
  it("wraps a loader without invoking it eagerly", () => {
    const load = vi.fn(() => Promise.resolve({ default: "Component" }));
    const component = lazy(load);

    expect(load).not.toHaveBeenCalled();
    expect(component.resolved).toBeUndefined();
    expect(isLazy(component)).toBe(true);
  });

  it("exposes the loader for later resolution", async () => {
    const load = vi.fn(() => Promise.resolve({ default: "Component" }));
    const component = lazy(load);

    await expect(component.load()).resolves.toEqual({ default: "Component" });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("allows the resolved value to be cached on the component", () => {
    const component: LazyComponent<string> = lazy(() =>
      Promise.resolve({ default: "Component" }),
    );

    component.resolved = "Component";
    expect(component.resolved).toBe("Component");
  });
});

describe("isLazy", () => {
  it("identifies values created by lazy()", () => {
    expect(isLazy(lazy(() => Promise.resolve({ default: "x" })))).toBe(true);
  });

  const nonLazyValues: unknown[] = [
    null,
    undefined,
    "Component",
    42,
    () => "Component",
    {},
    { load: () => undefined },
  ];

  it.each(nonLazyValues)("rejects %p", (value) => {
    expect(isLazy(value)).toBe(false);
  });
});
