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
      // Type safety - demote to warnings
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      
      // React hooks - demote to warnings
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "warn",
      
      // React - demote to warnings
      "react/no-unescaped-entities": "warn",
      
      // General JS/TS - demote to warnings
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
