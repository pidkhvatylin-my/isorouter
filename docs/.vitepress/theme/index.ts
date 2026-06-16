import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";
import "@shikijs/vitepress-twoslash/style.css";
import "./custom.css";
import Wordmark from "./components/Wordmark.vue";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // Brand wordmark next to the cube logo in the nav bar.
      "nav-bar-title-after": () => h(Wordmark),
      // …and standing in for the default name in the home hero.
      "home-hero-info-before": () =>
        h(Wordmark, { class: "iso-wordmark--hero" }),
    });
  },
  enhanceApp({ app }) {
    app.use(TwoslashFloatingVue);
  },
} satisfies Theme;
