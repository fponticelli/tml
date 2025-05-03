import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'tml-parser',
      fileName: 'index'
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  },
  plugins: [dts()]
});
