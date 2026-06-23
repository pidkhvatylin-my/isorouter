import { markRaw } from "vue";

import { createRouter } from "../../src/createRouter";

import type { VueComponentType } from "../../src/index";
import type { RouteConfig, RouterOptions } from "@isorouter/core";

/**
 * `@vue/test-utils` deep-`reactive()`s prop objects (for `setProps`), which
 * breaks `Router`'s private fields when its prototype methods (`start`,
 * `stop`, `navigate`, ...) are called with a reactive Proxy as `this`.
 * `markRaw` opts the instance out of that wrapping — real `<RouterView
 * :router="router">` usage outside test-utils is unaffected.
 */
export function createTestRouter<
  const T extends readonly RouteConfig<VueComponentType>[],
>(routes: T, options?: RouterOptions) {
  return markRaw(createRouter(routes, options));
}
