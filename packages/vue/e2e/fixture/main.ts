import { createApp, defineComponent, h } from "vue";

import {
  createRouter,
  lazy,
  Link,
  Outlet,
  RouterView,
  useParams,
} from "../../src/index";

import type { GuardContext, RouteConfig } from "../../src/index";
import type { VueComponentType } from "../../src/index";

declare global {
  interface Window {
    __slowLog: string[];
  }
}

window.__slowLog = [];

const Home = defineComponent({
  name: "Home",
  render: () =>
    h("div", [h("h1", "Home"), h("p", { "data-testid": "page" }, "home")]),
});

const About = defineComponent({
  name: "About",
  render: () =>
    h("div", [h("h1", "About"), h("p", { "data-testid": "page" }, "about")]),
});

const Concerts = defineComponent({
  name: "Concerts",
  setup() {
    const params = useParams();
    return () =>
      h("div", [
        h("h1", "Concerts"),
        h("p", { "data-testid": "page" }, `concerts:${params.value.city}`),
      ]);
  },
});

const DashboardLayout = defineComponent({
  name: "DashboardLayout",
  render: () =>
    h("div", [
      h("h1", "Dashboard"),
      h(
        Link,
        {
          href: "/dashboard",
          exact: true,
          "data-testid": "dash-link-overview",
        },
        () => "Overview",
      ),
      h(
        Link,
        { href: "/dashboard/settings", "data-testid": "dash-link-settings" },
        () => "Settings",
      ),
      h(Outlet),
    ]),
});

const Overview = defineComponent({
  name: "Overview",
  render: () => h("p", { "data-testid": "page" }, "overview"),
});

const Settings = defineComponent({
  name: "Settings",
  render: () => h("p", { "data-testid": "page" }, "settings"),
});

const Files = defineComponent({
  name: "Files",
  setup() {
    const params = useParams();
    return () =>
      h("p", { "data-testid": "page" }, `files:${params.value["*"]}`);
  },
});

const RedirectTarget = defineComponent({
  name: "RedirectTarget",
  render: () => h("p", { "data-testid": "page" }, "redirect-target"),
});

const Slow = defineComponent({
  name: "Slow",
  setup() {
    const params = useParams();
    return () => h("p", { "data-testid": "page" }, `slow:${params.value.id}`);
  },
});

const routes = [
  { path: "/", component: Home, title: "Home" },
  { path: "about", component: About, title: "About" },
  {
    path: "concerts/:city",
    component: Concerts,
    title: (ctx: GuardContext) => `Concerts in ${ctx.params.city}`,
  },
  { path: "users/:id", component: lazy(() => import("./pages/user")) },
  {
    path: "dashboard",
    component: DashboardLayout,
    title: "Dashboard",
    children: [
      { index: true, component: Overview },
      { path: "settings", component: Settings, title: "Dashboard - Settings" },
    ],
  },
  { path: "files/*", component: Files },
  { path: "redirect-from", beforeLoad: () => "/redirect-to" },
  { path: "redirect-to", component: RedirectTarget },
  { path: "blocked", beforeLoad: () => false, component: Home },
  {
    path: "slow/:id",
    component: Slow,
    beforeLoad: async (ctx: GuardContext) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (ctx.signal.aborted) return;
      window.__slowLog.push(ctx.params.id);
    },
  },
] as const satisfies readonly RouteConfig<VueComponentType>[];

export const router = createRouter(routes);

const App = defineComponent({
  name: "App",
  render: () =>
    h(
      RouterView,
      { router },
      {
        notFound: () =>
          h("div", [
            h("h1", "404"),
            h("p", { "data-testid": "page" }, "not-found"),
          ]),
        error: ({ error }: { error: unknown }) =>
          h("div", [
            h("h1", "Error"),
            h("pre", { "data-testid": "page" }, String(error)),
          ]),
        loading: () => h("p", { "data-testid": "page" }, "loading..."),
      },
    ),
});

createApp(App).mount("#app");

Object.assign(window, { __router: router });

declare global {
  interface Window {
    __router: typeof router;
  }
}
