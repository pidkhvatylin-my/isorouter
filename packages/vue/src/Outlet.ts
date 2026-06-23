import { defineComponent, h, inject, provide } from "vue";

import { DepthKey } from "./context";
import { useRouterState } from "./composables";

export const Outlet = defineComponent({
  name: "RouterOutlet",
  setup() {
    const state = useRouterState();
    const depth = inject(DepthKey, 0);
    const childDepth = depth + 1;

    provide(DepthKey, childDepth);

    return () => {
      const Child = state.value.components[childDepth];

      return Child ? h(Child) : null;
    };
  },
});
