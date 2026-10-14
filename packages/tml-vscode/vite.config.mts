import { defineConfig } from 'vite'
import { resolve } from 'path'
import { builtinModules } from 'module'

export default defineConfig(({ mode }) => ({
  build: {
    target: 'node16',
    outDir: 'out',
    emptyOutDir: true,
    minify: true,
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    rollupOptions: {
      external: [
        'vscode',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
      ],
      output: {
        entryFileNames: 'extension.js',
        format: 'cjs',
      },
    },
  },
  resolve: {
    alias: {
      '@typedml/parser': resolve(import.meta.dirname, '../tml-parser/dist'),
      '@typedml/utils': resolve(import.meta.dirname, '../tml-utils/dist'),
    },
  },
  watch:
    mode === 'development'
      ? {
          include: ['src/**'],
        }
      : null,
}))
