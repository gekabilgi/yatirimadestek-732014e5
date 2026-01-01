import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildTime = new Date();
  const istanbulOptions = { timeZone: 'Europe/Istanbul' };
  
  return {
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(buildTime.toISOString()),
      __BUILD_DATE__: JSON.stringify(buildTime.toLocaleDateString('tr-TR', istanbulOptions)),
      __BUILD_TIME__: JSON.stringify(buildTime.toLocaleTimeString('tr-TR', istanbulOptions)),
      __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI components
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-popover',
            ],
            // Charts (lazy loaded)
            'charts-vendor': ['recharts'],
            // PDF generation (lazy loaded)
            'pdf-vendor': ['@react-pdf/renderer', 'jspdf'],
            // Data utilities
            'data-vendor': ['xlsx', 'date-fns'],
            // Supabase
            'supabase-vendor': ['@supabase/supabase-js'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
  };
});