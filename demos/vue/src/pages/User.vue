<script setup lang="ts">
import { useParams } from "@isorouter/vue";

// useParams() returns a ComputedRef<Record<string, string>>.
// Vue auto-unwraps it in the template, so params.id works without .value.
const params = useParams();
</script>

<template>
  <h1>User profile</h1>
  <p>
    ID: <strong>{{ params.id }}</strong>
  </p>
  <p><em>This component is lazy-loaded (code-split by Vite).</em></p>
</template>
