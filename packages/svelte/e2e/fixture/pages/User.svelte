<script module lang="ts">
  declare global {
    interface Window {
      __userLoadCount: number;
    }
  }

  // Evaluated once per dynamic import — the router caches `.resolved`, so a
  // page that's visited twice should only trigger this module evaluation once.
  window.__userLoadCount = (window.__userLoadCount ?? 0) + 1;
</script>

<script lang="ts">
  import { getRouter } from "../../../src/index";

  const router = getRouter();
</script>

<h1>User</h1>
<p data-testid="page">user:{router.current.params.id}</p>
