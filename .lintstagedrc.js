export default {
  // TypeScript files
  '**/*.ts': [
    'pnpm lint:fix',
    'pnpm format:fix',
    () => 'pnpm lint',
    () => 'pnpm format',
  ],
  // Markdown and JSON files
  '**/*.{md,json}': ['pnpm format:fix'],
  // Run tests only once at the end
  '**/*.{ts,tsx}': [() => 'pnpm test'],
}
