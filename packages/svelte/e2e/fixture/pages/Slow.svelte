<script lang="ts">
  import { getRouter } from "../../../src/index";

  const router = getRouter();
</script>

<p data-testid="page">slow:{router.current.params.id}</p>
