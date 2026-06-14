import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "playwright-report",
      "test-results",
      ".svelte-kit",
      ".vite",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.js", "*.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      // TypeScript already checks for undefined references; ESLint's static
      // analysis can't see DOM/Navigation API globals (`navigation`, etc.).
      "no-undef": "off",
      // `infer _` is the standard "ignore this inferred type" convention.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_$" },
      ],
    },
  },
  {
    // Type-aware linting for `<script lang="ts">` blocks (and `.svelte.ts`
    // modules, which the svelte parser also treats as component scripts).
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    // Build/test tooling configs live outside `tsconfig.json`'s `include`,
    // so they're linted via the project service's default (non-typed) project.
    files: ["*.config.js", "*.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["src/reactive.svelte.ts"],
    rules: {
      // `Component<any>` is the intentional "any component" pattern used to
      // erase the rendered component's prop type (cf. `RouteConfig<any>` in
      // core's types.ts); `unknown` doesn't satisfy `Component<...>`.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
  ...svelte.configs.prettier,
);
