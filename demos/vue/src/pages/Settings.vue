<script setup lang="ts">
import { auth } from "../auth";

// Reaching this page means beforeLoad in router.ts returned undefined (allowed).
// Log out below to see the guard redirect you back to "/" on next visit.
</script>

<template>
  <h2>Settings</h2>
  <p>You passed the <code>beforeLoad</code> guard — you are logged in.</p>
  <button class="logout-btn" @click="auth.logout">Log out</button>
</template>
