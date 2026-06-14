import About from "../fixtures/About.svelte";
import Concerts from "../fixtures/Concerts.svelte";
import DashboardLayout from "../fixtures/DashboardLayout.svelte";
import Home from "../fixtures/Home.svelte";
import Overview from "../fixtures/Overview.svelte";
import Settings from "../fixtures/Settings.svelte";

import type { SvelteComponentType } from "../../src/reactive.svelte";
import type { RouteConfig } from "@isorouter/core";

export const routes = [
  { path: "/", component: Home, title: "Home" },
  { path: "about", component: About },
  { path: "concerts/:city", component: Concerts },
  {
    path: "dashboard",
    component: DashboardLayout,
    children: [
      { index: true, component: Overview },
      { path: "settings", component: Settings },
    ],
  },
] as const satisfies readonly RouteConfig<SvelteComponentType>[];
