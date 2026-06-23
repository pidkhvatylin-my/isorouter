import { getContext, setContext } from "svelte";

import type { AnySvelteRouter, RegisteredRouter } from "./types";

const KEY = Symbol("isorouter");

export interface OutletContext {
  depth: number;
  router: AnySvelteRouter;
}

export function setOutletContext(ctx: OutletContext): void {
  setContext(KEY, ctx);
}

export function getOutletContext(): OutletContext {
  return getContext(KEY);
}

export function getRouter(): RegisteredRouter {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return getOutletContext().router as unknown as RegisteredRouter;
}
