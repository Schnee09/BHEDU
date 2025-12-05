import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
      // Type safety - turn off for legacy code
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      
      // React hooks - turn off for legacy code  
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "warn",
      
      // React - turn off
      "react/no-unescaped-entities": "off",
      
      // General JS/TS - turn off
      "prefer-const": "off",
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
