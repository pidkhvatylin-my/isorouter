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

import { DepthKey, RouterKey, type VueRouter } from "./context";

/** Root component. Mount once near the app root and pass the router instance. */
export const RouterView = defineComponent({
  name: "RouterView",
  props: {
    router: { type: Object as PropType<VueRouter>, required: true },
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
    const unsub = props.router.subscribe((s) => {
      state.value = s;
    });

    onMounted(() => props.router.start());
    onUnmounted(() => {
      props.router.stop();
      unsub();
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
