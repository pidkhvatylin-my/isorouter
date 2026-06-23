import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  type PropType,
  type SlotsType,
} from "vue";

import { DepthKey, RouterKey } from "./context";
import type { AnyVueRouter } from "./types";

export const RouterView = defineComponent({
  name: "RouterView",
  props: {
    router: { type: Object as PropType<AnyVueRouter>, required: true },
  },
  slots: Object as SlotsType<{
    notFound?: () => unknown;
    error?: (props: { error: unknown }) => unknown;
    loading?: () => unknown;
  }>,
  setup(props, { slots }) {
    provide(RouterKey, props.router);
    provide(DepthKey, 0);

    // Subscribe locally — a component cannot inject what it provides itself.
    const state = shallowRef(props.router.getSnapshot());
    const unsubscribe = props.router.subscribe((routerSnapshot) => {
      state.value = routerSnapshot;
    });

    onMounted(() => props.router.start());
    onUnmounted(() => {
      props.router.stop();
      unsubscribe();
    });

    return () => {
      const s = state.value;

      if (s.status === "error" && slots.error)
        return slots.error({ error: s.error });

      if (s.status === "not-found" && slots.notFound) return slots.notFound();

      const Root = s.components[0];

      if (Root) return h(Root);

      return slots.loading ? slots.loading() : null;
    };
  },
});
