import { useAuth } from "../auth";

export default function Settings() {
  // Reaching this page means beforeLoad in router.ts returned undefined (allowed).
  // Log out below to see the guard redirect you back to "/" on next visit.
  const { logout } = useAuth();

  return (
    <>
      <h2>Settings</h2>
      <p>
        You passed the <code>beforeLoad</code> guard — you are logged in.
      </p>
      <button className="logout-btn" onClick={logout}>
        Log out
      </button>
    </>
  );
}
