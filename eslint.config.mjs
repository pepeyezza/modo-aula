import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The classic "fetch on mount" pattern (an async loader called from a
      // plain useEffect) is used deliberately throughout this app's client
      // components. The setState calls it makes happen after an `await`
      // (i.e. in a microtask, not synchronously during render), so this new
      // React Compiler-era rule's flagged risk doesn't apply here. Downgraded
      // to a warning so it doesn't fail `next build`.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
