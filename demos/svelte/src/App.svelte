<script lang="ts">
  import { Router } from "@isorouter/svelte";
  import { router } from "./router";
</script>

<!--
  <Router> starts/stops the router lifecycle and renders the matched component tree.
  Three optional snippets handle non-content states:
    notFound → no route matched the current URL (try the "404" nav link)
    error    → a guard threw or lazy() rejected (try the "Error" nav link); receives the error
    loading  → shown before the first route commits, if no other snippet applies
  Priority: error > notFound > matched component > loading.
-->
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
