import { applyPolyfill } from "@virtualstate/navigation/apply-polyfill";
import { createCoreRouter, lazy } from "../../src/index";
import type { GuardContext, RouterSnapshot } from "../../src/types";
import type { PageComponent } from "./types";

declare global {
  interface Window {
    __slowLog: string[];
  }
}

window.__slowLog = [];

const Home: PageComponent = () => `<h1>Home</h1><p data-testid="page">home</p>`;

const About: PageComponent = () =>
  `<h1>About</h1><p data-testid="page">about</p>`;

const Concerts: PageComponent = ({ params }) =>
  `<h1>Concerts</h1><p data-testid="page">concerts:${params.city}</p>`;

const DashboardLayout: PageComponent = () =>
  `<h1>Dashboard</h1><div data-testid="outlet">{{outlet}}</div>`;

const Overview: PageComponent = () => `<p data-testid="page">overview</p>`;

const Settings: PageComponent = () => `<p data-testid="page">settings</p>`;

const Files: PageComponent = ({ params }) =>
  `<p data-testid="page">files:${params["*"]}</p>`;

const RedirectTarget: PageComponent = () =>
  `<p data-testid="page">redirect-target</p>`;

const Slow: PageComponent = ({ params }) =>
  `<p data-testid="page">slow:${params.id}</p>`;

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
      window.__slowLog.push(ctx.params.id!);
    },
  },
] as const;

const app = document.querySelector<HTMLDivElement>("#app")!;
let renderCount = 0;

function render(snapshot: RouterSnapshot<PageComponent>): void {
  renderCount++;

  let html: string;
  if (snapshot.status === "not-found") {
    html = `<h1>404</h1><p data-testid="page">not-found</p>`;
  } else if (snapshot.status === "error") {
    html = `<h1>Error</h1><pre data-testid="page">${String(snapshot.error)}</pre>`;
  } else {
    html = snapshot.components.reduceRight<string>((inner, comp) => {
      const out = comp({ params: snapshot.params });
      return out.includes("{{outlet}}")
        ? out.replace("{{outlet}}", inner)
        : out;
    }, "");
  }

  app.innerHTML = html;
}

export const router = createCoreRouter<typeof routes, PageComponent>(routes);
router.subscribe(render);
render(router.getSnapshot());

// Load the Navigation API polyfill when the engine doesn't ship the API, then
// start. The polyfill e2e project strips the native `navigation` (see
// e2e/test.ts) so this branch is exercised in CI. Real apps can `await
// import()` the polyfill lazily (see README); the fixture applies it
// synchronously so `window.__router` is usable the instant the page loads.
if (!window.navigation) applyPolyfill();
router.start();

Object.assign(window, {
  __router: router,
  __getRenderCount: () => renderCount,
});

declare global {
  interface Window {
    __router: typeof router;
    __getRenderCount: () => number;
  }
}
