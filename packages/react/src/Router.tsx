import { useEffect, type ReactNode } from "react";

import { DepthContext, RouterContext, type ReactRouter } from "./context";
import { useRouterState } from "./hooks";

export interface RouterProps {
  router: ReactRouter;
  notFound?: ReactNode;
  error?: (err: unknown) => ReactNode;
  loading?: ReactNode;
}

export function Router({ router, notFound, error, loading }: RouterProps) {
  useEffect(() => {
    router.start();
    return () => router.stop();
  }, [router]);

  return (
    <RouterContext.Provider value={router}>
      <DepthContext.Provider value={0}>
        <RouterView notFound={notFound} error={error} loading={loading} />
      </DepthContext.Provider>
    </RouterContext.Provider>
  );
}

function RouterView({ notFound, error, loading }: Omit<RouterProps, "router">) {
  const state = useRouterState();
  if (state.status === "error" && error) return <>{error(state.error)}</>;
  if (state.status === "not-found" && notFound) return <>{notFound}</>;
  const Root = state.components[0];
  if (Root) return <Root />;
  return <>{loading ?? null}</>;
}
