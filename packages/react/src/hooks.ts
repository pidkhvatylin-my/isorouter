import { useCallback, useSyncExternalStore } from "react";

import { useRouterInstance } from "./context";

import type { ReactComponentType, RegisteredRouter } from "./types";
import type { RouterSnapshot } from "@isorouter/core";

export function useRouterState(): RouterSnapshot<ReactComponentType> {
  const router = useRouterInstance();

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

export function useRouter(): RegisteredRouter {
  return useRouterInstance() as unknown as RegisteredRouter;
}

export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (
      to: Parameters<RegisteredRouter["navigate"]>[0],
      opts?: { replace?: boolean; state?: unknown },
    ) => router.navigate(to, opts),
    [router],
  );
}
