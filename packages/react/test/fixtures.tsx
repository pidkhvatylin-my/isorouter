import { Outlet } from "../src/Outlet";
import { useParams } from "../src/hooks";

import type { ReactComponentType } from "../src/index";
import type { RouteConfig } from "@isorouter/core";

export function Home() {
  return <p data-testid="page">home</p>;
}

export function About() {
  return <p data-testid="page">about</p>;
}

export function Concerts() {
  const { city } = useParams<{ city: string }>();
  return <p data-testid="page">concerts:{city}</p>;
}

export function DashboardLayout() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Outlet />
    </div>
  );
}

export function Overview() {
  return <p data-testid="page">overview</p>;
}

export function Settings() {
  return <p data-testid="page">settings</p>;
}

export const routes = [
  { path: "/", component: Home },
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
] as const satisfies readonly RouteConfig<ReactComponentType>[];
