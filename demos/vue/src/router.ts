import { createRouter, lazy } from "@isorouter/vue";
import type { GuardContext } from "@isorouter/vue";

import AppLayout from "./layouts/AppLayout.vue";
import DashboardLayout from "./layouts/DashboardLayout.vue";
import Home from "./pages/Home.vue";
import About from "./pages/About.vue";
import Overview from "./pages/Overview.vue";

import { getLoggedIn } from "./auth";

// Route tree:
//   /                  → AppLayout (persistent nav + <Outlet>)
//   ├── (index)        → Home
//   ├── about          → About
//   ├── users/:id      → User        (lazy-loaded / code-split by Vite)
//   └── dashboard      → DashboardLayout (nested <Outlet>)
//       ├── (index)    → Overview
//       └── settings   → Settings   (guarded: must be logged in)
//
// `as const` is required for TypeScript to infer the exact path union and
// enable type-safe navigation — router.navigate() only accepts known paths.
export const router = createRouter([
  {
    path: "/",
    component: AppLayout,
    children: [
      { index: true, title: "Home", component: Home },
      { path: "about", title: "About", component: About },
      {
        path: "users/:id",
        // title can be a function — receives GuardContext with params, url, signal…
        title: (ctx: GuardContext) => `User #${ctx.params.id}`,
        // lazy() tells Vite to code-split this component into a separate chunk.
        component: lazy(() => import("./pages/User.vue")),
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
            component: lazy(() => import("./pages/Settings.vue")),
            // beforeLoad runs before any component renders.
            // Return undefined/void → allow. Return a string → redirect (same-origin).
            // Return false → block (restores the previous URL).
            beforeLoad: (): string | undefined =>
              getLoggedIn() ? undefined : "/",
          },
        ],
      },
      {
        path: "error-demo",
        component: Home,
        // A thrown error moves the snapshot to status "error" →
        // the error slot on <RouterView> in App.vue fires instead of rendering a component.
        beforeLoad: () => {
          throw new Error("Intentional error from beforeLoad");
        },
      },
    ],
  },
] as const);

// Module augmentation: narrows useRouter() and router.navigate() to this exact
// router type everywhere in the project — no extra imports needed in page components.
// Try passing '/asd' to router.navigate() anywhere — TypeScript will reject it.
declare module "@isorouter/vue" {
  interface Register {
    router: typeof router;
  }
}
