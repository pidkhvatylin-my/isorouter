import { computed, defineComponent, h } from "vue";

import { injectRouter } from "./context";
import { useRouterState } from "./composables";

export const Link = defineComponent({
  name: "RouterLink",
  props: {
    href: { type: String, required: true },
    activeClass: { type: String, default: "active" },
    exact: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const router = injectRouter();
    const state = useRouterState();
    const active = computed(() => {
      void state.value; // track navigation
      return router.isActive(props.href, { exact: props.exact });
    });

    return () =>
      h(
        "a",
        {
          href: props.href,
          class: active.value ? props.activeClass : undefined,
          "aria-current": active.value ? "page" : undefined,
        },
        slots.default?.(),
      );
  },
});
