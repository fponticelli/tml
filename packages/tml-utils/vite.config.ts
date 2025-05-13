import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: '@typedml/utils',
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  plugins: [
    dts({
      outDir: 'dist', // Explicitly set the output directory for declarations
      include: ['src/**/*.ts'], // Include all TypeScript files in src
      exclude: ['**/*.test.ts', '**/*.spec.ts'], // Exclude test files
      rollupTypes: true, // Roll up all types into a single file
      insertTypesEntry: true, // Insert a .d.ts file into the output directory
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@typedml/parser': resolve(__dirname, '../tml-parser/dist'),
    },
  },
})
