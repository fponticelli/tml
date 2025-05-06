import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: '@typedml/parser',
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  plugins: [dts()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
