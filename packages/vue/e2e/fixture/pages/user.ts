import { defineComponent, h } from "vue";

import { useParams } from "../../../src/index";

declare global {
  interface Window {
    __userLoadCount: number;
  }
}

// Evaluated once per dynamic import — the router caches `.resolved`, so a
// page that's visited twice should only trigger this module evaluation once.
window.__userLoadCount = (window.__userLoadCount ?? 0) + 1;

const User = defineComponent({
  name: "User",
  setup() {
    const params = useParams();
    return () =>
      h("div", [
        h("h1", "User"),
        h("p", { "data-testid": "page" }, `user:${params.value.id}`),
      ]);
  },
});

export default User;
