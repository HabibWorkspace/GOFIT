import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    // Brotli compression only (better than gzip, skip gzip to speed up build)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    // Bundle analyzer
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
        // Aggressive code splitting - separate heavy libraries
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React (keep together to avoid loading order issues)
            if (id.includes('react-dom') || id.includes('react-router') || (id.includes('react') && !id.includes('chart'))) {
              return 'vendor-react'
            }
            // Axios (needed for login)
            if (id.includes('axios')) {
              return 'vendor-axios'
            }
            // Charts (only for analytics page - lazy load)
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'vendor-charts'
            }
            // QR Scanner (only for scanner page - lazy load)
            if (id.includes('html5-qrcode') || id.includes('qrcode')) {
              return 'vendor-qr'
            }
            // Socket.io (only for real-time features - lazy load)
            if (id.includes('socket.io')) {
              return 'vendor-socket'
            }
            // Date picker (only for forms - lazy load)
            if (id.includes('react-datepicker')) {
              return 'vendor-datepicker'
            }
            // Lucide icons (used across app)
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            // Everything else
            return 'vendor'
          }
        },
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    sourcemap: false,
    emptyOutDir: true,
    cssCodeSplit: true,
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'habib.go-fit.me',
      'go-fit.me',
      'web.go-fit.me',
      '.go-fit.me',
      '.pages.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
