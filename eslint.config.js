import { configs } from '@eslint/js'
import { node } from 'globals'
import { configs as _configs, parser as _parser } from 'typescript-eslint'

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

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
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
  }
]
