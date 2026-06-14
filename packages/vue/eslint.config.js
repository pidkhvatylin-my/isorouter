import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "playwright-report", "test-results", ".vite"],
  },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.js", "*.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
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
    // Build/test tooling configs live outside `tsconfig.json`'s `include`,
    // so they're linted via the project service's default (non-typed) project.
    files: ["*.config.js", "*.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // The e2e fixture's `as const` route table — needed so `router.navigate("/literal-path")`
    // type-checks against `NavTarget<T>` — combines a recursive `RouteConfig.children` with
    // Vue's highly generic `Component` type and a `lazy()`-loaded component. `tsc --noEmit`
    // checks the resulting type without error, but typescript-eslint's type info can't
    // resolve it across files, so the `no-unsafe-*` rules misfire as if it were `any`.
    files: ["e2e/**"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
  prettier,
);
