<script setup lang="ts">
import { Link, Outlet } from "@isorouter/vue";
</script>

<template>
  <h1>Dashboard</h1>

  <nav class="sub-nav">
    <Link href="/dashboard" exact>Overview</Link>
    <Link href="/dashboard/settings">Settings</Link>
  </nav>

  <!--
    Nested <Outlet>: renders Overview or Settings depending on the child URL.
    DashboardLayout stays mounted when switching between children —
    only the Outlet content swaps (scroll, focus and local state are preserved).
  -->
  <Outlet />
</template>
