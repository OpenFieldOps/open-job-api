import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
    },
    rules: {
      "@typescript-eslint/no-namespace": "off",
    },
  },
]);
