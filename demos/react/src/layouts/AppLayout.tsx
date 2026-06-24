import { Link, Outlet } from "@isorouter/react";
import { useAuth } from "../auth";

export default function AppLayout() {
  const { loggedIn, toggle } = useAuth();

  return (
    <>
      <nav className="app-nav">
        {/* `exact` — active only on an exact URL match, not on child routes */}
        <Link href="/" exact>
          Home
        </Link>
        <Link href="/about" exact>
          About
        </Link>
        <Link href="/users/42">User #42</Link>
        {/* `exact` — prevents /dashboard/settings from also highlighting this link */}
        <Link href="/dashboard" exact>
          Dashboard
        </Link>
        <Link href="/dashboard/settings">Settings</Link>
        {/* No route matches /nowhere → triggers the notFound prop on <Router> */}
        <Link href="/nowhere">404</Link>
        {/* beforeLoad throws → triggers the error prop on <Router> */}
        <Link href="/error-demo">Error</Link>

        {/* Toggles loggedIn; the beforeLoad guard on /dashboard/settings reads it */}
        <button onClick={toggle}>{loggedIn ? "Log out" : "Log in"}</button>
      </nav>

      <main className="app-main">
        {/* Renders the matched child route (Home, About, User, DashboardLayout…) */}
        <Outlet />
      </main>
    </>
  );
}
