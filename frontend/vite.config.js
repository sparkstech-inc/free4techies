import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pure static build — no backend, no dev proxy.
// `base: './'` produces relative asset paths so the build works at any
// deployment path (root domain, sub-path, or local file preview).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
