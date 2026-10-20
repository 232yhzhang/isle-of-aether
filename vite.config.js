import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    allowedHosts: ['localhost', '127.0.0.1', '.trycloudflare.com'],
  },
  preview: {
    allowedHosts: ['localhost', '127.0.0.1', '.trycloudflare.com'],
  },
});
