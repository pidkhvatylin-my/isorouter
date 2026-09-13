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
  Href,
  MetadataContext,
  NavTarget,
  NavigationKind,
  ResolveRegister,
  RouteConfig,
  RouteMatch,
  RouteMetadata,
  RouteMetadataInput,
  RouteTemplate,
  RouterOptions,
  RouterSnapshot,
  RouterStatus,
  ScrollMode,
} from "./types";
