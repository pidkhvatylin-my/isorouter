<script setup lang="ts">
import { Link, Outlet } from "@isorouter/vue";
import { auth } from "../auth";
</script>

<template>
  <nav class="app-nav">
    <!-- exact — active only on an exact URL match, not on child routes -->
    <Link href="/" exact>Home</Link>
    <Link href="/about" exact>About</Link>
    <Link href="/users/42">User #42</Link>
    <!-- exact — prevents /dashboard/settings from also highlighting this link -->
    <Link href="/dashboard" exact>Dashboard</Link>
    <Link href="/dashboard/settings">Settings</Link>
    <!-- No route matches /nowhere → triggers the notFound slot on <RouterView> -->
    <Link href="/nowhere">404</Link>
    <!-- beforeLoad throws → triggers the error slot on <RouterView> -->
    <Link href="/error-demo">Error</Link>

    <!-- Toggles auth.loggedIn; the beforeLoad guard on /dashboard/settings reads it -->
    <button @click="auth.toggle">
      {{ auth.loggedIn ? "Log out" : "Log in" }}
    </button>
  </nav>

  <main class="app-main">
    <!-- Renders the matched child route (Home, About, User, DashboardLayout…) -->
    <Outlet />
  </main>
</template>
