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

export { createRouter } from "./createRouter";
export { RouterView } from "./RouterView";
export { Outlet } from "./Outlet";
export { Link } from "./Link";
export {
  useRouter,
  useRouterState,
  useParams,
  useLocation,
  useNavigate,
} from "./composables";
export type {
  AnyVueRouter,
  Register,
  RegisteredRouter,
  VueComponentType,
} from "./types";
