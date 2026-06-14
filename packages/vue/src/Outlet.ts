import { defineComponent, h, inject, provide } from "vue";

import { DepthKey } from "./context";
import { useRouterState } from "./composables";

/** Renders the next route component in the matched chain. */
export const Outlet = defineComponent({
  name: "RouterOutlet",
  setup() {
    const depth = inject(DepthKey, 0);
    const childDepth = depth + 1;
    provide(DepthKey, childDepth);

    const state = useRouterState();
    return () => {
      const Child = state.value.components[childDepth];
      return Child ? h(Child) : null;
    };
  },
});
