<script lang="ts">
  import { onMount } from "svelte";

  import { setOutletContext } from "./context";

  import type { Snippet } from "svelte";
  import type { AnySvelteRouter } from "./reactive.svelte";

  let {
    router,
    notFound,
    error,
    loading,
  }: {
    router: AnySvelteRouter;
    notFound?: Snippet;
    error?: Snippet<[unknown]>;
    loading?: Snippet;
  } = $props();

  setOutletContext({ depth: 0, router });

  onMount(() => {
    router.start();
    return () => router.stop();
  });

  const Root = $derived(router.current.components[0]);
  const status = $derived(router.current.status);
</script>

{#if status === "error" && error}
  {@render error(router.current.error)}
{:else if status === "not-found" && notFound}
  {@render notFound()}
{:else if Root}
  <Root />
{:else if loading}
  {@render loading()}
{/if}
