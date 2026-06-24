<script lang="ts">
  import { getRouter } from "@isorouter/svelte";

  const router = getRouter();
</script>

<h1>isorouter — Svelte demo</h1>

<p>Explore the features via the nav above:</p>

<ul>
  <li><strong>About</strong> — plain page</li>
  <li>
    <strong>User #42</strong> — dynamic params + <code>lazy()</code> load
  </li>
  <li>
    <strong>Dashboard</strong> — nested layout with <code>&lt;Outlet&gt;</code>
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

<div class="buttons">
  <button onclick={() => router.navigate("/about")}>
    navigate('/about')
  </button>
  <button onclick={() => router.navigate("/users/99")}>
    navigate('/users/99')
  </button>
  <button onclick={() => router.navigate("/about", { replace: true })}>
    navigate('/about', &#123; replace: true &#125;)
  </button>
  <button onclick={() => router.back()}>back()</button>
</div>

<style>
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  button {
    padding: 0.4rem 0.85rem;
    border: 1px solid #4a4aaa;
    background: transparent;
    color: #4a4aaa;
    border-radius: 5px;
    font-size: 0.85rem;
    font-family: monospace;
    cursor: pointer;
  }

  button:hover {
    background: #4a4aaa;
    color: #fff;
  }
</style>
