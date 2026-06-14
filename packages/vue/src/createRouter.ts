import { createCoreRouter } from "@isorouter/core";

import type { VueComponentType } from "./context";
import type { RouteConfig, RouterOptions } from "@isorouter/core";

export function createRouter<
  const T extends readonly RouteConfig<VueComponentType>[],
>(routes: T, options?: RouterOptions) {
  return createCoreRouter<T, VueComponentType>(routes, options);
}
