import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

// Router is imported directly inside App.svelte (created and exported from router.ts).
// Alternative pattern: mount(App, { target: ..., props: { router } }) for prop injection.
mount(App, { target: document.getElementById("app")! });
