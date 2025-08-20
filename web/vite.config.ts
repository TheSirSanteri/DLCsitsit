import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Deno/Oak-backendisi
        changeOrigin: true,
        secure: false
      }
    }
  }
});