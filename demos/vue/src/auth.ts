import { reactive } from "vue";

// Module-level variable — beforeLoad guards in router.ts read this synchronously,
// outside Vue's reactivity system. The store keeps it in sync.
let _loggedIn = false;

export function getLoggedIn(): boolean {
  return _loggedIn;
}

// Shared reactive store — import `auth` directly in any component.
// No provider/injector needed; Vue tracks reactive reads automatically.
export const auth = reactive({
  loggedIn: false,

  toggle() {
    _loggedIn = !_loggedIn;
    this.loggedIn = _loggedIn;
  },

  // Exposed separately so Settings can log out without knowing the current state.
  logout() {
    _loggedIn = false;
    this.loggedIn = false;
  },
});
