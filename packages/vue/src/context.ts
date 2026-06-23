import { inject } from "vue";

import type { InjectionKey } from "vue";
import type { AnyVueRouter } from "./types";

export const RouterKey: InjectionKey<AnyVueRouter> = Symbol("isorouter");

export const DepthKey: InjectionKey<number> = Symbol("isorouter-depth");

export function injectRouter(): AnyVueRouter {
  const router = inject(RouterKey);

  if (!router) throw new Error("[isorouter] must be used within <RouterView>");

  return router;
}
