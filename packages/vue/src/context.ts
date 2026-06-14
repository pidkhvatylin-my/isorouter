import { inject } from "vue";

import type { AnyRouter } from "@isorouter/core";
import type { Component, InjectionKey } from "vue";

export type VueComponentType = Component;
export type VueRouter = AnyRouter<VueComponentType>;

export const RouterKey: InjectionKey<VueRouter> = Symbol("isorouter");
export const DepthKey: InjectionKey<number> = Symbol("isorouter-depth");

export function injectRouter(): VueRouter {
  const router = inject(RouterKey);
  if (!router) throw new Error("[isorouter] must be used within <RouterView>");
  return router;
}
