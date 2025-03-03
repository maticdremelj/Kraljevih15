import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html', 
      template: 'sunburst', // 'sunburst', 'treemap', 'network'
      open: true,
      gzipSize: true,
      brotliSize: true 
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase";
            if (id.includes("react-dom")) return "react-dom";
            if (id.includes("react")) return "react";
            if (id.includes("lodash")) return "lodash";
            return "vendor";
          }
        }
      }
    }
  }
})
