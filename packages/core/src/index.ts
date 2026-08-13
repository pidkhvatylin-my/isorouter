/** Public surface / barrel export for @isorouter/core. */

export {
  Router,
  createCoreRouter,
  type AnyRouter,
  type Unsubscribe,
} from "./router";
export { matchRoutes } from "./matcher";
export { lazy, isLazy, type LazyComponent } from "./lazy";
export { buildHref, type HrefTarget } from "./href";
export type {
  Awaitable,
  BeforeLoad,
  ExtractParams,
  GuardContext,
  GuardLocation,
  Href,
  MetadataContext,
  NavTarget,
  NavTargetObject,
  NavigationKind,
  ResolveRegister,
  RouteConfig,
  RouteMatch,
  RouteMetadata,
  RouteTemplate,
  RouterOptions,
  RouterSnapshot,
  RouterStatus,
  ScrollMode,
} from "./types";
