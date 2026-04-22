import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  // ── Ignore build output ────────────────────────────────
  { ignores: ['**/dist/**', '**/node_modules/**', '**/*.js', '**/*.cjs'] },

  // ── Base: all TS/TSX files ─────────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── Shared rules ───────────────────────────────────────
  {
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-empty-function': 'off',

      // General quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['warn', 'multi-line'],
      'no-throw-literal': 'error',
    },
  },

  // ── Client (React) ────────────────────────────────────
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ── Server (Node) ─────────────────────────────────────
  {
    files: ['server/src/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // console.log is fine on the server for request logging
      'no-console': 'off',
    },
  },
);

