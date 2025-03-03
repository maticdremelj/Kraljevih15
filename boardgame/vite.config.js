import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html', 
      template: 'network', // 'sunburst', 'treemap', 'network'
      open: false,
      gzipSize: true,
      brotliSize: true 
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) {
              if (id.includes("firebase/firestore")) return "firebase-firestore";
              if (id.includes("firebase/functions")) return "firebase-functions";
              if (id.includes("firebase/hosting")) return "firebase-hosting";
              return "firebase-core";
            }
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
