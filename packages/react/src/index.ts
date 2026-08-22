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

export { createRouter } from "./createRouter";
export { Router, type RouterProps } from "./Router";
export { Outlet } from "./Outlet";
export { Link, type LinkProps } from "./Link";
export {
  useRouter,
  useRouterState,
  useParams,
  useLocation,
  useMetadata,
  useNavigate,
} from "./hooks";
export type {
  AnyReactRouter,
  ReactComponentType,
  Register,
  RegisteredRouter,
} from "./types";
