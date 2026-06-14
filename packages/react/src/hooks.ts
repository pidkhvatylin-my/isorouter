import { useCallback, useSyncExternalStore } from "react";

import { useRouterInstance } from "./context";

import type { ReactComponentType, ReactRouter } from "./context";
import type { RouterSnapshot } from "@isorouter/core";

/** Subscribe to the router snapshot (re-renders on navigation). */
export function useRouterState(): RouterSnapshot<ReactComponentType> {
  const router = useRouterInstance();
  // subscribe / getSnapshot are stable bound fields on the instance.
  return useSyncExternalStore(
    router.subscribe,
    router.getSnapshot,
    router.getSnapshot,
  );
}

export function useParams<
  P extends Record<string, string> = Record<string, string>,
>(): P {
  return useRouterState().params as P;
}

export function useLocation(): URL {
  return useRouterState().url;
}

export function useRouter(): ReactRouter {
  return useRouterInstance();
}

export function useNavigate() {
  const router = useRouterInstance();
  return useCallback(
    (to: string, opts?: { replace?: boolean; state?: unknown }) =>
      router.navigate(to as never, opts),
    [router],
  );
}
