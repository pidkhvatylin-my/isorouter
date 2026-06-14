import { defineComponent, h } from "vue";

import { Outlet } from "../../src/Outlet";
import { useParams } from "../../src/composables";

export const Home = defineComponent({
  name: "Home",
  render: () => h("p", { "data-testid": "page" }, "home"),
});

export const About = defineComponent({
  name: "About",
  render: () => h("p", { "data-testid": "page" }, "about"),
});

export const Concerts = defineComponent({
  name: "Concerts",
  setup() {
    const params = useParams();
    return () =>
      h("p", { "data-testid": "page" }, `concerts:${params.value.city}`);
  },
});

export const DashboardLayout = defineComponent({
  name: "DashboardLayout",
  render: () => h("div", [h("h1", "Dashboard"), h(Outlet)]),
});

export const Overview = defineComponent({
  name: "Overview",
  render: () => h("p", { "data-testid": "page" }, "overview"),
});

export const Settings = defineComponent({
  name: "Settings",
  render: () => h("p", { "data-testid": "page" }, "settings"),
});
