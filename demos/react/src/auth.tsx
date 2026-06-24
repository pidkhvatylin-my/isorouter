import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

// Module-level variable — beforeLoad guards in router.ts read this synchronously,
// outside of React's render cycle. AuthProvider keeps it in sync with React state.
let _loggedIn = false;

// Called by beforeLoad guards in router.ts
export function getLoggedIn(): boolean {
  return _loggedIn;
}

interface AuthContextValue {
  loggedIn: boolean;
  toggle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);

  const toggle = useCallback(() => {
    _loggedIn = !_loggedIn;
    setLoggedIn(_loggedIn);
  }, []);

  // Exposed separately so Settings can log out without knowing the current state
  const logout = useCallback(() => {
    _loggedIn = false;
    setLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ loggedIn, toggle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
