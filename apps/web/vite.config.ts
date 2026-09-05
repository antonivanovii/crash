import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * Vite, не Next.
 *
 * SSR тут не нужен: приложение за авторизацией, SEO неактуально, а гидратация
 * с сокетами и canvas только мешает.
 *
 * Компилятор React намеренно выключен: анимируемые значения в этом приложении
 * живут в ref и canvas, а не в состоянии, и автоматическая мемоизация ничего
 * не даёт там, где ре-рендеров и так нет.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // FSD опирается на абсолютные импорты между слоями: относительные пути
    // вида ../../../entities скрывают нарушение порядка слоёв.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true, changeOrigin: true },
    },
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Разделы и игры уезжают в свои чанки через ленивые импорты;
        // здесь только каркас, который нужен всем и меняется редко.
        // Спортивное дерево лиг не должно грузиться тому, кто пришёл в Mines.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (id.includes('@tanstack')) return 'tanstack';
          return 'vendor';
        },
      },
    },
  },
});
