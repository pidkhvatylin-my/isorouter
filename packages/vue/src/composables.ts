import { computed, onScopeDispose, shallowRef } from "vue";

import { injectRouter } from "./context";

import type { VueComponentType, VueRouter } from "./context";
import type { RouterSnapshot } from "@isorouter/core";
import type { ComputedRef, ShallowRef } from "vue";

/**
 * Bridge the core's immutable snapshot into Vue reactivity.
 * `shallowRef` is correct here: each commit is a fresh object, so we want
 * reference replacement, not deep proxying of the URL / component list.
 */
export function useRouterState(): ShallowRef<RouterSnapshot<VueComponentType>> {
  const router = injectRouter();
  const state = shallowRef(router.getSnapshot());
  const unsub = router.subscribe((s) => {
    state.value = s;
  });
  onScopeDispose(unsub);
  return state;
}

export function useRouter(): VueRouter {
  return injectRouter();
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
  const router = injectRouter();
  return (to: string, opts?: { replace?: boolean; state?: unknown }) =>
    router.navigate(to as never, opts);
}
