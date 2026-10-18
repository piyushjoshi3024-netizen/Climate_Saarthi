import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Same-origin proxy: the browser calls /api/... on the Vite server, which forwards to Express.
  // This keeps session cookies first-party and avoids CORS problems in development and preview.
  const proxy = {
    '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:5000', changeOrigin: false },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, proxy },
  };
});
