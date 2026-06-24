<script setup lang="ts">
import { useNavigate, useRouter } from "@isorouter/vue";

// useRouter() returns the narrowed VueRouter because Register is augmented in router.ts.
// useNavigate() is a stable function reference — safe to call from event handlers.
const navigate = useNavigate();
const router = useRouter();
</script>

<template>
  <h1>isorouter — Vue demo</h1>

  <p>Explore the features via the nav above:</p>

  <ul>
    <li><strong>About</strong> — plain page</li>
    <li>
      <strong>User #42</strong> — dynamic params + <code>lazy()</code> load
    </li>
    <li>
      <strong>Dashboard</strong> — nested layout with
      <code>&lt;Outlet&gt;</code>
    </li>
    <li>
      <strong>Settings</strong> — <code>beforeLoad</code> guard (log in first)
    </li>
    <li><strong>404</strong> — not-found state</li>
    <li>
      <strong>Error</strong> — error state from a thrown <code>beforeLoad</code>
    </li>
  </ul>

  <h2>Programmatic navigation</h2>
  <p>
    All paths are type-checked — try passing <code>'/asd'</code> and TypeScript
    will error.
  </p>

  <div class="nav-buttons">
    <button @click="navigate('/about')">navigate('/about')</button>
    <button @click="navigate('/users/99')">navigate('/users/99')</button>
    <button @click="navigate('/about', { replace: true })">
      navigate('/about', { replace: true })
    </button>
    <button @click="router.back()">back()</button>
  </div>
</template>
