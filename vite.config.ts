import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
   plugins: [
     react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      workbox: {
        // Don't precache HTML — always fetch fresh navigations so mobile clients
        // see new builds immediately instead of being stuck on an old shell.
        globPatterns: ['assets/index-*.js', 'assets/index-*.css', 'assets/router-*.js', 'assets/db-client-*.js', 'assets/ui-primitives-*.js'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Prompt mode: don't auto-skip — wait for the user to click "Atualizar".
        clientsClaim: true,
        skipWaiting: false,
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'NetworkOnly',
          },
          {
            // HTML navigations: always try network first, fall back to cache only when offline.
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' && !url.pathname.startsWith('/~oauth'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-navigations',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 30,
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
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
       // The HTML-linked public manifest is the sole install metadata source.
       manifest: false,
      devOptions: {
        enabled: false
      }
    }),
     mode === "development" && componentTagger()
   ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    chunkSizeWarningLimit: 800,
    reportCompressedSize: false, // Otimiza build
    cssCodeSplit: true,
    minify: 'terser', // Melhor minificação
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/jspdf/') || id.includes('/jspdf-autotable/')) return 'pdf-gen';
          if (id.includes('/recharts/')) return 'charts';
          if (id.includes('/framer-motion/')) return 'animation';
          if (id.includes('/date-fns/')) return 'dates';
          if (id.includes('/react-markdown/') || id.includes('/@ai-sdk/') || id.includes('/node_modules/ai/')) return 'guide';
          if (id.includes('/@radix-ui/')) return 'ui-primitives';
          if (id.includes('/@supabase/') || id.includes('/@tanstack/react-query/')) return 'db-client';
          if (id.includes('/react-router-dom/')) return 'router';
          return undefined;
        },
      },
    },
  },
}));