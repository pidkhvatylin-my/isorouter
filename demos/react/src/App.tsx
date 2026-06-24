import { Router } from "@isorouter/react";
import { router } from "./router";
import { AuthProvider } from "./auth";

// AuthProvider wraps Router so AppLayout and pages can call useAuth().
// <Router> starts/stops the router lifecycle and renders the matched component tree.
//
// Three optional props handle non-content states:
//   notFound → no route matched the current URL (try the "404" nav link)
//   error    → a guard threw or lazy() rejected (try the "Error" nav link)
//   loading  → shown before the first route commits, if neither above applies
// Priority: error > notFound > matched component > loading.
export default function App() {
  return (
    <AuthProvider>
      <Router
        router={router}
        notFound={
          <div className="state-page">
            <h2>404 — Page not found</h2>
            <a href="/">Go home</a>
          </div>
        }
        error={(err) => (
          <div className="state-page">
            <h2>Something went wrong</h2>
            <pre>{String(err)}</pre>
            <a href="/">Go home</a>
          </div>
        )}
        loading={<div className="state-page">Loading...</div>}
      />
    </AuthProvider>
  );
}
