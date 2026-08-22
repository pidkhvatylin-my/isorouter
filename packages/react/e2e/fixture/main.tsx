import { createRoot } from "react-dom/client";

import { RouterContext } from "../../src/context";
import {
  createRouter,
  lazy,
  Link,
  Outlet,
  Router,
  useParams,
} from "../../src/index";

import type { ReactComponentType } from "../../src/index";
import type { MetadataContext, RouteConfig } from "@isorouter/core";

declare module "@isorouter/core" {
  interface RouteMetadata {
    title?: string;
  }
}

function Home() {
  return (
    <>
      <h1>Home</h1>
      <p data-testid="page">home</p>
    </>
  );
}

function About() {
  return (
    <>
      <h1>About</h1>
      <p data-testid="page">about</p>
    </>
  );
}

function Concerts() {
  const { city } = useParams<{ city: string }>();
  return (
    <>
      <h1>Concerts</h1>
      <p data-testid="page">concerts:{city}</p>
    </>
  );
}

function DashboardLayout() {
  return (
    <>
      <h1>Dashboard</h1>
      <Outlet />
    </>
  );
}

function Overview() {
  return <p data-testid="page">overview</p>;
}

function Settings() {
  return <p data-testid="page">settings</p>;
}

function Files() {
  const { "*": rest } = useParams<{ "*": string }>();
  return <p data-testid="page">files:{rest}</p>;
}

function RedirectTarget() {
  return <p data-testid="page">redirect-target</p>;
}

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
  { path: "users/:id", component: lazy(() => import("./pages/User")) },
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
] as const satisfies readonly RouteConfig<ReactComponentType>[];

const router = createRouter(routes, {
  onCommit: (s) => {
    if (s.metadata.title) document.title = s.metadata.title;
  },
});

function App() {
  return (
    <RouterContext.Provider value={router}>
      <nav>
        <Link href="/" data-testid="link-home">
          Home
        </Link>
        <Link href="/about" data-testid="link-about">
          About
        </Link>
        <Link href="/concerts/kyiv" data-testid="link-concerts">
          Concerts
        </Link>
        <Link href="/users/42" data-testid="link-user">
          User
        </Link>
        <Link href="/dashboard" data-testid="link-dashboard">
          Dashboard
        </Link>
        <Link href="/dashboard/settings" data-testid="link-settings">
          Settings
        </Link>
        <Link href="/files/a/b/c" data-testid="link-files">
          Files
        </Link>
      </nav>
      <Router router={router} notFound={<p data-testid="page">not-found</p>} />
    </RouterContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

Object.assign(window, { __router: router });

declare global {
  interface Window {
    __router: typeof router;
  }
}
