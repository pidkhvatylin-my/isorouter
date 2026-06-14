<script lang="ts">
  import { getRouter } from "../../src/context";

  const router = getRouter();
</script>

<p data-testid="page">concerts:{router.current.params.city}</p>
