import { defineConfig } from 'vite'
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
  resolve: {
    alias: {
      '@typedml/parser': resolve(import.meta.dirname, '../tml-parser/dist'),
    },
  },
})
