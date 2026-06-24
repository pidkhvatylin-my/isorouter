import { Link, Outlet } from "@isorouter/react";

export default function DashboardLayout() {
  return (
    <>
      <h1>Dashboard</h1>

      <nav className="sub-nav">
        <Link href="/dashboard" exact>
          Overview
        </Link>
        <Link href="/dashboard/settings">Settings</Link>
      </nav>

      {/*
        Nested <Outlet>: renders Overview or Settings depending on the child URL.
        DashboardLayout itself stays mounted when switching between children —
        only the Outlet content swaps (scroll, focus and local state are preserved).
      */}
      <Outlet />
    </>
  );
}
