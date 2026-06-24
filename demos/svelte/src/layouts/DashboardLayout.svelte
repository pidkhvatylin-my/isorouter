<script lang="ts">
  import { Link, Outlet } from "@isorouter/svelte";
</script>

<h1>Dashboard</h1>

<nav class="sub-nav">
  <Link href="/dashboard" exact>Overview</Link>
  <Link href="/dashboard/settings">Settings</Link>
</nav>

<Outlet />

<style>
  .sub-nav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e0e0e8;
  }

  .sub-nav :global(a) {
    color: #4a4aaa;
    text-decoration: none;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .sub-nav :global(a.active) {
    background: #4a4aaa;
    color: #fff;
  }
</style>
