import { readFileSync } from "node:fs";
import { defineConfig } from "rolldown";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

export default defineConfig({
  input: "src/index.ts",
  external: (id) =>
    external.some((dep) => id === dep || id.startsWith(`${dep}/`)),
  output: {
    file: "dist/index.js",
    format: "esm",
  },
});
