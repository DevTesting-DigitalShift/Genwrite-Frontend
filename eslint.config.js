import js from "@eslint/js"
import globals from "globals"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"

export default [
  { ignores: ["dist", "node_modules"] },

  // ============================
  // JS / JSX (NO TS PARSER)
  // ============================
  // {
  //   files: ["**/*.{js,jsx}"],
  //   languageOptions: {
  //     parser: null,
  //     ecmaVersion: "latest",
  //     sourceType: "module",
  //     globals: {
  //       ...globals.browser,
  //       ...globals.node,
  //     },
  //   },
  //   rules: {
  //     ...js.configs.recommended.rules,
  //     "no-undef": "off",
  //     "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  //   },
  // },

  // ============================
  // TS / TSX (NO PROJECT)
  // ============================
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      "no-unused-vars": "off",
      "no-undef": "off",

      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // ============================
  // TYPE-AWARE TS (LIMITED)
  // ============================
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: { parser: tsParser, parserOptions: { project: "./tsconfig.json" } },
    plugins: { "@typescript-eslint": tseslint },
    rules: { "@typescript-eslint/no-floating-promises": "warn" },
  },
]
