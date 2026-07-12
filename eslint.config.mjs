import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Legacy codebase — track as warnings; CI fails only on errors.
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off doc generators and ops scripts (CommonJS require is expected).
    "scripts/**",
    "supabase/**",
    "lib/**",
    "generate-test-data.js",
    "lint-src.json",
  ]),
]);

export default eslintConfig;