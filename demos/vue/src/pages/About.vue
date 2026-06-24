<template>
  <h1>About</h1>

  <p>
    <code>@isorouter/vue</code> is a thin Vue 3 adapter over
    <code>@isorouter/core</code>, a Navigation API–first isomorphic router.
  </p>

  <p>
    State is bridged to Vue via <code>shallowRef</code> — the snapshot reference
    is replaced on every commit so Vue's reactivity tracks changes correctly
    without deep proxying.
  </p>
</template>
