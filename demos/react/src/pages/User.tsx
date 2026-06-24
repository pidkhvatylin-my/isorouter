import { useParams } from "@isorouter/react";

export default function User() {
  // useParams() is typed as Record<string, string> by default;
  // pass a generic to narrow it: useParams<{ id: string }>()
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <h1>User profile</h1>
      <p>
        ID: <strong>{id}</strong>
      </p>
      <p>
        <em>This component is lazy-loaded (code-split by Vite).</em>
      </p>
    </>
  );
}
