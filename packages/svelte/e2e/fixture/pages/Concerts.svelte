<script lang="ts">
  import { getRouter } from "../../../src/index";

  const router = getRouter();
</script>

<h1>Concerts</h1>
<p data-testid="page">concerts:{router.current.params.city}</p>
