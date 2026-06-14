import { getContext, setContext } from "svelte";

import type { AnySvelteRouter } from "./reactive.svelte";

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

/** Read the router instance from context (use inside a route component). */
export function getRouter(): AnySvelteRouter {
  return getOutletContext().router;
}
