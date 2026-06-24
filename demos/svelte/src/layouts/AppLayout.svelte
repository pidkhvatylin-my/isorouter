<script lang="ts">
  import { Link, Outlet } from "@isorouter/svelte";

  import { auth } from "../auth.svelte";

  const handleAuthButtonClick = () => {
    auth.loggedIn = !auth.loggedIn;
  };
</script>

<nav>
  <Link href="/" exact>Home</Link>
  <Link href="/about" exact>About</Link>
  <Link href="/users/42">User #42</Link>
  <Link href="/dashboard" exact>Dashboard</Link>
  <Link href="/dashboard/settings">Settings</Link>
  <Link href="/nowhere">404</Link>
  <Link href="/error-demo">Error</Link>

  <button onclick={handleAuthButtonClick}>
    {auth.loggedIn ? "Log out" : "Log in"}
  </button>
</nav>

<main>
  <Outlet />
</main>

<style>
  nav {
    background: #1a1a2e;
    padding: 0.75rem 1.25rem;
    display: flex;
    gap: 0.25rem;
    align-items: center;
    flex-wrap: wrap;
  }

  nav :global(a) {
    color: #c8c8e8;
    text-decoration: none;
    padding: 0.3rem 0.65rem;
    border-radius: 5px;
    font-size: 0.9rem;
    transition: background 0.15s;
  }

  nav :global(a:hover) {
    background: #2e2e50;
  }

  nav :global(a.active) {
    background: #4a4aaa;
    color: #fff;
  }

  button {
    margin-left: auto;
    padding: 0.3rem 0.85rem;
    border: 1px solid #4a4aaa;
    background: transparent;
    color: #c8c8e8;
    border-radius: 5px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  button:hover {
    background: #4a4aaa;
    color: #fff;
  }

  main {
    padding: 2rem;
  }
</style>
