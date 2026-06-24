<script lang="ts">
  import { getRouter } from "@isorouter/svelte";

  // getRouter() returns the narrowed SvelteRouter because Register is augmented in router.ts.
  // router.current is a reactive getter — reading it here subscribes the template to commits.
  const router = getRouter();
</script>

<h1>User profile</h1>
<p>ID: <strong>{router.current.params.id}</strong></p>
<p><em>This component is lazy-loaded (code-split by Vite).</em></p>
