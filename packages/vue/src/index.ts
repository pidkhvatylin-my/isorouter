export { lazy } from "@isorouter/core";
export type {
  BeforeLoad,
  GuardContext,
  GuardLocation,
  Href,
  MetadataContext,
  NavTarget,
  RouteConfig,
  RouteMetadata,
  RouterOptions,
  RouterSnapshot,
} from "@isorouter/core";

export { createRouter } from "./createRouter";
export { RouterView } from "./RouterView";
export { Outlet } from "./Outlet";
export { Link } from "./Link";
export {
  useRouter,
  useRouterState,
  useParams,
  useLocation,
  useMetadata,
  useNavigate,
} from "./composables";
export type {
  AnyVueRouter,
  Register,
  RegisteredRouter,
  VueComponentType,
} from "./types";
