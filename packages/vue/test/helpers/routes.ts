import {
  About,
  Concerts,
  DashboardLayout,
  Home,
  Overview,
  Settings,
} from "./components";

import type { VueComponentType } from "../../src/context";
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
] as const satisfies readonly RouteConfig<VueComponentType>[];
