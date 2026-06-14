<script lang="ts">
  import Link from "../../../src/Link.svelte";
  import Outlet from "../../../src/Outlet.svelte";
</script>

<h1>Dashboard</h1>
<Link href="/dashboard" exact data-testid="dash-link-overview">Overview</Link>
<Link href="/dashboard/settings" data-testid="dash-link-settings">Settings</Link
>
<Outlet />
