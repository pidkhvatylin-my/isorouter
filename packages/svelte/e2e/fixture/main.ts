import { mount } from "svelte";

import { createRouter, lazy } from "../../src/index";

import App from "./App.svelte";
import About from "./pages/About.svelte";
import Concerts from "./pages/Concerts.svelte";
import DashboardLayout from "./pages/DashboardLayout.svelte";
import Files from "./pages/Files.svelte";
import Home from "./pages/Home.svelte";
import Overview from "./pages/Overview.svelte";
import RedirectTarget from "./pages/RedirectTarget.svelte";
import Settings from "./pages/Settings.svelte";
import Slow from "./pages/Slow.svelte";

import type {
  GuardContext,
  MetadataContext,
  RouteConfig,
} from "../../src/index";
import type { SvelteComponentType } from "../../src/index";

declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
  }
}

declare global {
  interface Window {
    __slowLog: string[];
  }
}

window.__slowLog = [];

const routes = [
  { path: "/", component: Home, metadata: { title: "Home" } },
  { path: "about", component: About, metadata: { title: "About" } },
  {
    path: "concerts/:city",
    component: Concerts,
    metadata: (ctx: MetadataContext) => ({
      title: `Concerts in ${ctx.params.city}`,
    }),
  },
  { path: "users/:id", component: lazy(() => import("./pages/User.svelte")) },
  {
    path: "dashboard",
    component: DashboardLayout,
    metadata: { title: "Dashboard" },
    children: [
      { index: true, component: Overview },
      {
        path: "settings",
        component: Settings,
        metadata: { title: "Dashboard - Settings" },
      },
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
] as const satisfies readonly RouteConfig<SvelteComponentType>[];

export const router = createRouter(routes, {
  onCommit: (s) => {
    if (s.metadata.title) document.title = s.metadata.title;
  },
});

mount(App, {
  target: document.getElementById("app")!,
  props: { router },
});

Object.assign(window, { __router: router });

declare global {
  interface Window {
    __router: typeof router;
  }
}
