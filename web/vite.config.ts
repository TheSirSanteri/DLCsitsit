import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true }
    },
    watch: {
      ignored: [
        // älä HMR-reloadaa backendin dataa
        '**/models/**/*.json',
        '**/models/**/*.tmp',
        '**/products.json',
        '**/users.json',
        '**/*.tmp'
      ]
    }
  }
});