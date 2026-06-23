import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
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
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // Build/test tooling configs live outside `tsconfig.json`'s `include`,
    // so they're linted via the project service's default (non-typed) project.
    files: ["*.config.js", "*.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["src/types.ts"],
    rules: {
      // `ComponentType<any>` / `Router<readonly any[], C>` is the intentional
      // "erase the component/route type" pattern shared with core's
      // `RouteConfig<any>`; `unknown` doesn't satisfy these constraints.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier,
);
