import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: [
          "history.aigc.green",
          'localhost',
          '127.0.0.1',
          'history.aigc24.com',
          '.aigc24.com'
        ],
        proxy: {
          '/api/timeline': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/api': 'http://localhost:4000',
          '/timeline-api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/timeline-api/, '/api/timeline')
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
        'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        'process.env.NEXT_PUBLIC_SUPABASE_BUCKET': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_BUCKET || 'podcasts')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext',
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html'),
            player: path.resolve(__dirname, 'player.html'),
            admin: path.resolve(__dirname, 'admin.html'),
            admin_index: path.resolve(__dirname, 'admin/index.html')
          }
        }
      }
    };
});
