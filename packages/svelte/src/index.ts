export { lazy } from "@isorouter/core";
export type {
  BeforeLoad,
  GuardContext,
  Href,
  MetadataContext,
  NavTarget,
  RouteConfig,
  RouteMetadata,
  RouteMetadataInput,
  RouterOptions,
  RouterSnapshot,
} from "@isorouter/core";

export { default as Router } from "./Router.svelte";
export { default as Outlet } from "./Outlet.svelte";
export { default as Link } from "./Link.svelte";
export { createRouter, SvelteRouter } from "./reactive.svelte";
export { getRouter } from "./context";
export type {
  AnySvelteRouter,
  Register,
  RegisteredRouter,
  SvelteComponentType,
} from "./types";
