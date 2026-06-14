<script lang="ts">
  import Link from "../../src/Link.svelte";
</script>

<Link href="/" exact class="nav-link" data-testid="link-home">Home</Link>
<Link
  href="/about"
  class="nav-link"
  activeClass="is-active"
  data-testid="link-about">About</Link
>
