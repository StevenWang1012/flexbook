import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // 已移除 API_KEY 的 define 設定，徹底消除資安風險
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});