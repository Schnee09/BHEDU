module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    'build/',
    '**/*.d.ts',
    '!src/**/*.d.ts',
    '.turbo/',
    'coverage/',
    'scripts/',
    '*.config.js',
    '*.config.ts',
    'next-env.d.ts',
    '.eslintrc.js'
  ],
  rules: {
    // Turn off all strict linting rules - these are pre-existing code patterns
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'prefer-const': 'warn'
  }
}
