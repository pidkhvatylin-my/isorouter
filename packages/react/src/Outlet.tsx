import { useContext } from "react";

import { DepthContext } from "./context";
import { useRouterState } from "./hooks";

export function Outlet() {
  const depth = useContext(DepthContext);
  const state = useRouterState();

  const childDepth = depth + 1;
  const Child = state.components[childDepth];

  if (!Child) return null;

  return (
    <DepthContext.Provider value={childDepth}>
      <Child />
    </DepthContext.Provider>
  );
}
