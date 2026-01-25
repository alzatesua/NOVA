import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html', // reporte treemap
      template: 'treemap',         // treemap | sunburst | network
      gzipSize: true,
      brotliSize: true,
      open: false,                 // en server headless mejor dejar false
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    reportCompressedSize: true,    // ver gzip/brotli en consola
    // sourcemap: true,            // <-- activa esto si usarás source-map-explorer
    // chunkSizeWarningLimit: 1000, // <-- opcional: sube umbral del warning
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router', 'react-router-dom'],
          heroicons: ['@heroicons/react'],
          sweetalert2: ['sweetalert2'],
          // agrega aquí otros paquetes grandes si el treemap los muestra
          // charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
});
