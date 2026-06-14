import type { PageComponent } from "../types";

declare global {
  interface Window {
    __userLoadCount: number;
  }
}

// Evaluated once per dynamic import — the router caches `.resolved`, so a
// page that's visited twice should only trigger this module evaluation once.
window.__userLoadCount = (window.__userLoadCount ?? 0) + 1;

const User: PageComponent = ({ params }) =>
  `<h1>User</h1><p data-testid="page">user:${params.id}</p>`;

export default User;
