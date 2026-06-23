import { createCoreRouter } from "@isorouter/core";

import type { RouteConfig, RouterOptions } from "@isorouter/core";
import type { VueComponentType } from "./types";

export function createRouter<
  const T extends readonly RouteConfig<VueComponentType>[],
>(routes: T, options?: RouterOptions) {
  return createCoreRouter<T, VueComponentType>(routes, options);
}
