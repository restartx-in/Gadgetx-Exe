import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    base: './', // CRITICAL for Electron local file loading
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT || '3000', 10),
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
      allowedHosts: ['urchin-app-ckgne.ondigitalocean.app'],
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/styled-engine', '@emotion/react', '@emotion/styled'],
            'query-vendor': ['@tanstack/react-query'],
            'date-vendor': ['@mui/x-date-pickers', 'date-fns'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})