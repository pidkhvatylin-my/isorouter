<script lang="ts">
  import { getOutletContext, setOutletContext } from "./context";

  const ctx = getOutletContext();
  const depth = ctx.depth + 1;

  setOutletContext({ depth, router: ctx.router });

  const Child = $derived(ctx.router.current.components[depth]);
</script>

{#if Child}
  <Child />
{/if}
