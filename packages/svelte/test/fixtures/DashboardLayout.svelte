<script lang="ts">
  import Link from "../../src/Link.svelte";
  import Outlet from "../../src/Outlet.svelte";
</script>

<h1>Dashboard</h1>
<Link href="/dashboard" activeClass="is-active" data-testid="link-dashboard"
  >Dashboard</Link
>
<Link
  href="/dashboard"
  exact
  activeClass="is-active"
  data-testid="link-dashboard-exact">Dashboard</Link
>
<Outlet />
