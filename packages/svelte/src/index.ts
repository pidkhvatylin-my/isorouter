export {
  createRouter,
  SvelteRouter,
  type AnySvelteRouter,
  type SvelteComponentType,
} from "./reactive.svelte";
export { default as Router } from "./Router.svelte";
export { default as Outlet } from "./Outlet.svelte";
export { default as Link } from "./Link.svelte";
export { getRouter } from "./context";
export { lazy } from "@isorouter/core";
export type {
  BeforeLoad,
  GuardContext,
  Href,
  NavTarget,
  RouteConfig,
  RouterOptions,
  RouterSnapshot,
} from "@isorouter/core";
