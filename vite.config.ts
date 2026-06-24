import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePath = process.env.CF_PAGES === '1' ? '/' : './';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: basePath,
      server: {
        port: 3000,
        host: '0.0.0.0',
        open: true,
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: [
            'favicon.ico',
            'artwork.png',
            'icons/*.png',
            'data/*.json'
          ],
          manifest: {
            name: '偶成 Ou Cheng',
            short_name: '偶成',
            description: '极简高审美的纯本地诗词创作与辅助系统。融合传统排版美学与现代 AI 技术，完全离线可用，打造沉浸式心流数字古籍。',
            lang: 'zh-CN',
            display: 'standalone',
            orientation: 'portrait',
            theme_color: '#F7F1E3',
            background_color: '#F7F1E3',
            start_url: basePath,
            scope: basePath,
            icons: [
              {
                src: 'icons/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png'
              },
              {
                src: 'icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,json,woff2,woff,ttf,eot,svg,png,ico}'],
            runtimeCaching: [
              {
                urlPattern: /\/(?:icons|artwork)\/.*\.(?:png|webp|jpg|jpeg|gif)/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'app-images',
                  expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 90 },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.(googleapis|gstatic|loli)\.net\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
              {
                urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'cdn-assets',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              }
            ],
            cacheId: 'ou-cheng-v1.0.0',
            cleanupOutdatedCaches: true,
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': __dirname,
        }
      }
    };
});
