import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const { configs } = js
const { node } = globals
const { configs: _configs, parser: _parser } = tseslint

export default [
  // Base ESLint recommended rules
  configs.recommended,

  // TypeScript parser and recommended rules
  ..._configs.recommended,

  // Global ignores
  {
    ignores: ['node_modules/**', 'dist/**', '.turbo/**', '.yarn/**']
  },

  // Base configuration for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...node
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn'
    }
  },

  // TypeScript source files configuration
  {
    files: ['**/src/**/*.ts', '**/src/**/*.tsx'],
    languageOptions: {
      parser: _parser,
      parserOptions: {
        project: './packages/*/tsconfig.json'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }]
    }
  },

  // TypeScript test files configuration
  {
    files: ['**/test/**/*.ts', '**/test/**/*.tsx'],
    languageOptions: {
      parser: _parser,
      parserOptions: {
        project: './packages/*/tsconfig.test.json'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }]
    }
  }
]
