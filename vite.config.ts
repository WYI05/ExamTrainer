/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    // "/src" is root-relative for Vite (dev, build and vitest alike).
    alias: {
      '@': '/src',
    },
  },
  server: { port: 5173, open: false },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
