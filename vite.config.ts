import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
      },
      plugins: [
        tailwindcss(),
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'logo.jpg'],
          devOptions: {
            enabled: true
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf,eot}'],
            maximumFileSizeToCacheInBytes: 6000000,
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api/],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
          manifest: {
            id: '/',
            start_url: '/',
            scope: '/',
            name: 'Kampus Kit - Personal Growth OS',
            short_name: 'KampusKit',
            description: 'Sistem operasi perkuliahan super (all-in-one) untuk mahasiswa',
            theme_color: '#09090b',
            background_color: '#09090b',
            display: 'standalone',
            orientation: 'any',
            categories: ['education', 'productivity'],
            icons: [
              {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
              {
                name: 'Dashboard Utama',
                short_name: 'Dashboard',
                description: 'Buka Dashboard Utama Kampus Kit',
                url: '/?view=dashboard',
                icons: [{ src: '/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Tugas & Proyek',
                short_name: 'Tugas',
                description: 'Kelola tugas dan deadline kuliah',
                url: '/?view=tasks',
                icons: [{ src: '/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Catatan Cerdas',
                short_name: 'Catatan',
                description: 'Buka catatan dan ringkasan kuliah',
                url: '/?view=notes',
                icons: [{ src: '/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'Jadwal Kuliah',
                short_name: 'Jadwal',
                description: 'Lihat jadwal kuliah mingguan',
                url: '/?view=schedule',
                icons: [{ src: '/icon-192.png', sizes: '192x192' }]
              },
              {
                name: 'GPS Pelacakan Lokasi',
                short_name: 'GPS Live',
                description: 'Pelacakan lokasi GPS real-time & zona aman',
                url: '/?view=location',
                icons: [{ src: '/icon-192.png', sizes: '192x192' }]
              }
            ],
            share_target: {
              action: '/?shared=1',
              method: 'GET',
              params: {
                title: 'share_title',
                text: 'share_text',
                url: 'share_url'
              }
            }
          }
        })
      ],
      define: {
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'motion': ['motion'],
              'icons': ['lucide-react'],
              'charts': ['recharts'],
              'markdown': ['react-markdown', 'remark-gfm'],
              'maps': ['leaflet'],
              'confetti': ['canvas-confetti'],
              'firebase-app': ['firebase/app'],
              'firebase-auth': ['firebase/auth'],
              'firebase-firestore': ['firebase/firestore'],
              'firebase-storage': ['firebase/storage'],
              'notes-core': ['@blocknote/core'],
              'notes-react': ['@blocknote/react'],
              'notes-ui': ['@blocknote/mantine'],
              'notes-emoji': ['@emoji-mart/data']
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
