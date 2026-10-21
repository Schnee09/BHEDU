import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypeScript,
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/next-env.d.ts",
      "**/.eslintignore",
      "**/scripts/**/*.js", // Ignore CommonJS scripts
      "**/*.config.js",
      "**/*.config.ts",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
    rules: {
      // Type safety - keep off for now, will fix gradually
      "@typescript-eslint/no-explicit-any": "off",

      // Unused vars - enable to find dead code
      "@typescript-eslint/no-unused-vars": "warn",

      // React hooks - enable warnings
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      // React 19 compiler diagnostics are newly enabled by eslint-config-next 16.
      // Keep them visible without turning this dependency upgrade into a
      // repository-wide blocking migration.
      "react-hooks/static-components": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/void-use-memo": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/config": "warn",
      "react-hooks/gating": "warn",

      // React - turn off
      "react/no-unescaped-entities": "off",

      // General JS/TS - enable
      "prefer-const": "warn",
      "no-console": "off", // Allow console logs

      // TypeScript comments - allow both for now
      "@typescript-eslint/ban-ts-comment": "off",

      // Next.js specific - demote to warnings
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-assign-module-variable": "off",

      // CommonJS imports - allow in scripts and generated code
      "@typescript-eslint/no-require-imports": "off",

      // This alias - off (common in generated code)
      "@typescript-eslint/no-this-alias": "off",

      // Unused expressions - off (common in generated code)
      "@typescript-eslint/no-unused-expressions": "off",

      // Disable problematic rules that block commits
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
];

export default eslintConfig;
