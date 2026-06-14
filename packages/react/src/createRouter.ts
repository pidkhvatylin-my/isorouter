import { createCoreRouter } from "@isorouter/core";

import type { ReactComponentType } from "./context";
import type { RouteConfig, RouterOptions } from "@isorouter/core";

export function createRouter<
  const T extends readonly RouteConfig<ReactComponentType>[],
>(routes: T, options?: RouterOptions) {
  return createCoreRouter<T, ReactComponentType>(routes, options);
}
