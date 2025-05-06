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
  plugins: [dts()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@typedml/parser': resolve(__dirname, '../tml-parser/dist'),
    },
  },
})
