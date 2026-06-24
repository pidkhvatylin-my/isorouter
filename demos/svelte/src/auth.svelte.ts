// Svelte `$state` rune — reactive without stores or effects.
// Read directly inside beforeLoad guards (see router.ts) and Svelte components.
export const auth = $state({ loggedIn: false });
