import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'tml-parser',
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  plugins: [dts()],
})
