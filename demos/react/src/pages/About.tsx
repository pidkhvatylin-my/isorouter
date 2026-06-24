export default function About() {
  return (
    <>
      <h1>About</h1>

      <p>
        <code>@isorouter/react</code> is a thin React adapter over{" "}
        <code>@isorouter/core</code>, a Navigation API–first isomorphic router.
      </p>

      <p>
        State is bridged to React via <code>useSyncExternalStore</code> — navigation
        re-renders are correct and tear-free under React 18's concurrent renderer.
      </p>
    </>
  );
}
