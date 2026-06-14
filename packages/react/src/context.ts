import { createContext, useContext } from "react";

import type { Router } from "@isorouter/core";
import type { ComponentType } from "react";

export type ReactComponentType = ComponentType<any>;
export type ReactRouter = Router<readonly any[], ReactComponentType>;

export const RouterContext = createContext<ReactRouter | null>(null);
export const DepthContext = createContext<number>(0);

export function useRouterInstance(): ReactRouter {
  const router = useContext(RouterContext);
  if (!router)
    throw new Error("[isorouter] hooks must be used within <Router>");
  return router;
}
