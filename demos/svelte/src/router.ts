import { createRouter, lazy } from "@isorouter/svelte";
import type { GuardContext } from "@isorouter/svelte";

import AppLayout from "./layouts/AppLayout.svelte";
import DashboardLayout from "./layouts/DashboardLayout.svelte";
import Home from "./pages/Home.svelte";
import About from "./pages/About.svelte";
import Overview from "./pages/Overview.svelte";

import { auth } from "./auth.svelte";

export const router = createRouter([
  {
    path: "/",
    component: AppLayout,
    children: [
      { index: true, title: "Home", component: Home },
      { path: "about", title: "About", component: About },
      {
        path: "users/:id",
        title: (ctx: GuardContext) => `User #${ctx.params.id}`,
        component: lazy(() => import("./pages/User.svelte")),
      },
      {
        path: "dashboard",
        title: "Dashboard",
        component: DashboardLayout,
        children: [
          { index: true, component: Overview },
          {
            path: "settings",
            title: "Settings",
            component: lazy(() => import("./pages/Settings.svelte")),
            beforeLoad: (): string | undefined =>
              auth.loggedIn ? undefined : "/",
          },
        ],
      },
      {
        path: "error-demo",
        component: Home,
        beforeLoad: () => {
          throw new Error("Intentional error from beforeLoad");
        },
      },
    ],
  },
] as const);

declare module "@isorouter/svelte" {
  interface Register {
    router: typeof router;
  }
}
