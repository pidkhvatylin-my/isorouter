import { useParams } from "../../../src/index";

declare global {
  interface Window {
    __userLoadCount: number;
  }
}

// Evaluated once per dynamic import — the router caches `.resolved`, so a
// page that's visited twice should only trigger this module evaluation once.
window.__userLoadCount = (window.__userLoadCount ?? 0) + 1;

export default function User() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <h1>User</h1>
      <p data-testid="page">user:{id}</p>
    </>
  );
}
