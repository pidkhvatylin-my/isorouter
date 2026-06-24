<script lang="ts">
  import { Router } from "@isorouter/svelte";
  import { router } from "./router";
</script>

<Router {router}>
  {#snippet notFound()}
    <div class="state-page">
      <h2>404 — Page not found</h2>
      <a href="/">Go home</a>
    </div>
  {/snippet}

  {#snippet error(err)}
    <div class="state-page">
      <h2>Something went wrong</h2>
      <pre>{String(err)}</pre>
      <a href="/">Go home</a>
    </div>
  {/snippet}

  {#snippet loading()}
    <div class="state-page">Loading...</div>
  {/snippet}
</Router>

<style>
  .state-page {
    padding: 2rem;
  }
</style>
