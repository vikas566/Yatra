import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'prompt',
      includeAssets: ['/icons/yatrasangamlogo.png'],
      manifest: {
        name: 'YatraSangam',
        short_name: 'YatraSangam',
        description: 'Your Cultural Travel Companion',
        theme_color: '#4F46E5',
        start_url: '/',
        id: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icons/yatrasangamlogo.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/yatrasangamlogo.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/yatrasangamlogo.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/yatrasangamlogo.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/yatrasangamlogo.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/yatrasangamlogo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/yatrasangamlogo.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/yatrasangamlogo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3001,
    strictPort: false,
    open: true,
    proxy: {
      '/api': {
        target: 'https://api.pinata.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '^/api/ipfs/(.*)': {
        target: 'https://gateway.pinata.cloud/ipfs/',
        changeOrigin: true,
        rewrite: (path) => {
          const hash = path.replace('/api/ipfs/', '');
          console.log('Proxying IPFS request for hash:', hash);
          return hash;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('IPFS proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending IPFS Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received IPFS Response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
}) 