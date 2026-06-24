<script setup lang="ts">
import { RouterView } from "@isorouter/vue";

import { router } from "./router";
</script>

<template>
  <RouterView :router="router">
    <template #notFound>
      <div class="state-page">
        <h2>404 — Page not found</h2>
        <a href="/">Go home</a>
      </div>
    </template>

    <template #error="{ error }">
      <div class="state-page">
        <h2>Something went wrong</h2>
        <pre>{{ String(error) }}</pre>
        <a href="/">Go home</a>
      </div>
    </template>

    <template #loading>
      <div class="state-page">Loading...</div>
    </template>
  </RouterView>
</template>
