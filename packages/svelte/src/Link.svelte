<script lang="ts">
  import { getOutletContext } from "./context";

  import type { Snippet } from "svelte";

  let {
    href,
    class: className = "",
    activeClass = "active",
    exact = false,
    children,
    ...rest
  }: {
    href: string;
    class?: string;
    activeClass?: string;
    exact?: boolean;
    children?: Snippet;
    [key: string]: unknown;
  } = $props();

  const ctx = getOutletContext();
  const active = $derived(ctx?.router?.isActive(href, { exact }) ?? false);
</script>

<a
  {href}
  class={`${className} ${active ? activeClass : ""}`.trim()}
  aria-current={active ? "page" : undefined}
  {...rest}
>
  {@render children?.()}
</a>
