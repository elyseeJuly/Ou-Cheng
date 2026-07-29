import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePath = process.env.CF_PAGES === '1' ? '/' : './';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const finalBase = mode === 'ios' ? './' : basePath;
    return {
      base: finalBase,
      server: {
        port: 3000,
        host: '0.0.0.0',
        open: true,
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'prompt',
          includeAssets: [],
          manifest: {
            name: '偶成 Ou Cheng',
            short_name: '偶成',
            description: '极简高审美的本地诗词创作与格律辅助系统，融合传统排版美学、离线韵书与典籍数据并融合 AI 辅助。',
            lang: 'zh-CN',
            display: 'standalone',
            orientation: 'portrait',
            theme_color: '#F7F1E3',
            background_color: '#F7F1E3',
            start_url: finalBase,
            scope: finalBase,
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
            globPatterns: ['**/*.{js,css,html,woff2,woff,ttf,eot,svg,png,ico}'],
            globIgnores: ['**/data/*.json'],
            maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
            runtimeCaching: [
              {
                urlPattern: /\/data\/.*\.json$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'poetry-data-json',
                  expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.(googleapis|gstatic|loli)\.(com|net)\/.*/i,
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
            cacheId: 'ou-cheng-v0.5.1',
            cleanupOutdatedCaches: true,
          }
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': __dirname,
        }
      },
      test: {
        exclude: [...configDefaults.exclude, 'tests/browser/**'],
        coverage: {
          provider: 'v8' as const,
          exclude: [
            'node_modules/**',
            'dist/**',
            'scripts/**',
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            'src/**/*.d.ts',
            'src/pages/**',
            'src/components/**',
            'src/App.tsx',
            'src/main.tsx',
          ],
          thresholds: {
            statements: 65,
            branches: 55,
            functions: 60,
            lines: 70,
          },
        },
      },
    };
});
