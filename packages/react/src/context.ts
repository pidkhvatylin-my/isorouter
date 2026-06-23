import { createContext, useContext } from "react";

import type { AnyReactRouter } from "./types";

export const RouterContext = createContext<AnyReactRouter | null>(null);

export const DepthContext = createContext<number>(0);

export function useRouterInstance(): AnyReactRouter {
  const router = useContext(RouterContext);

  if (!router)
    throw new Error("[isorouter] hooks must be used within <Router>");

  return router;
}
