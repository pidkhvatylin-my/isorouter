import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "e2e/fixture",
  plugins: [react()],
});
