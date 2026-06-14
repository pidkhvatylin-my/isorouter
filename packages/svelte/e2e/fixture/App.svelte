<script lang="ts">
  import { setOutletContext } from "../../src/context";
  import Link from "../../src/Link.svelte";
  import Router from "../../src/Router.svelte";

  import type { AnySvelteRouter } from "../../src/reactive.svelte";

  const { router }: { router: AnySvelteRouter } = $props();

  setOutletContext({
    depth: 0,
    get router() {
      return router;
    },
  });
</script>

<nav>
  <Link href="/" data-testid="link-home">Home</Link>
  <Link href="/about" data-testid="link-about">About</Link>
  <Link href="/concerts/kyiv" data-testid="link-concerts">Concerts</Link>
  <Link href="/users/42" data-testid="link-user">User</Link>
  <Link href="/dashboard" data-testid="link-dashboard">Dashboard</Link>
  <Link href="/dashboard/settings" data-testid="link-settings">Settings</Link>
  <Link href="/files/a/b/c" data-testid="link-files">Files</Link>
</nav>

<Router {router}>
  {#snippet notFound()}
    <h1>404</h1>
    <p data-testid="page">not-found</p>
  {/snippet}
  {#snippet error(err)}
    <h1>Error</h1>
    <pre data-testid="page">{String(err)}</pre>
  {/snippet}
  {#snippet loading()}
    <p data-testid="page">loading...</p>
  {/snippet}
</Router>
