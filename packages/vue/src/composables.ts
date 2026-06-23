import { computed, onScopeDispose, shallowRef } from "vue";

import { injectRouter } from "./context";

import type { ComputedRef, ShallowRef } from "vue";
import type { RouterSnapshot } from "@isorouter/core";
import type { VueComponentType, RegisteredRouter } from "./types";

export function useRouterState(): ShallowRef<RouterSnapshot<VueComponentType>> {
  const router = injectRouter();
  const state = shallowRef(router.getSnapshot());

  onScopeDispose(
    router.subscribe((routerSnapshot) => {
      state.value = routerSnapshot;
    }),
  );

  return state;
}

export function useRouter(): RegisteredRouter {
  return injectRouter() as unknown as RegisteredRouter;
}

export function useParams(): ComputedRef<Record<string, string>> {
  const state = useRouterState();

  return computed(() => state.value.params);
}

export function useLocation(): ComputedRef<URL> {
  const state = useRouterState();

  return computed(() => state.value.url);
}

export function useNavigate() {
  const router = useRouter();

  return (
    to: Parameters<RegisteredRouter["navigate"]>[0],
    opts?: { replace?: boolean; state?: unknown },
  ) => router.navigate(to, opts);
}
