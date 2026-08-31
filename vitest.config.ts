import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Exit 0 until task-108 lands the converted engine validation suite — the
    // scaffold must be green with zero tests.
    passWithNoTests: true,
    exclude: ['**/node_modules/**', '**/.next/**', '_archive/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
