/** Public surface / barrel export for @isorouter/core. */

export {
  Router,
  createCoreRouter,
  type AnyRouter,
  type Unsubscribe,
} from "./router";
export { matchRoutes } from "./matcher";
export { lazy, isLazy, type LazyComponent } from "./lazy";
export type {
  Awaitable,
  BeforeLoad,
  ExtractParams,
  GuardContext,
  GuardLocation,
  Href,
  MetadataContext,
  NavTarget,
  NavigationKind,
  RedirectTarget,
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
