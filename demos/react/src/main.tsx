import { createRoot } from "react-dom/client";
import App from "./App";
import "./app.css";

// Router is created in router.ts and imported inside App.tsx.
// AuthProvider wraps Router so layout/page components can call useAuth().
createRoot(document.getElementById("root")!).render(<App />);
