<script lang="ts">
  import { getRouter } from "@isorouter/svelte";

  const router = getRouter();
</script>

<h1>User profile</h1>
<p>ID: <strong>{router.current.params.id}</strong></p>
<p><em>This component is lazy-loaded (code-split by Vite).</em></p>
