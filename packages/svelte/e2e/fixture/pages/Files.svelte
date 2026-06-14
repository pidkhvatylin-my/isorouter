<script lang="ts">
  import { getRouter } from "../../../src/index";

  const router = getRouter();
</script>

<p data-testid="page">files:{router.current.params["*"]}</p>
