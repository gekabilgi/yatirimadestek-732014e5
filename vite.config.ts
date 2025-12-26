import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildTime = new Date();
  
  return {
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(buildTime.toISOString()),
      __BUILD_DATE__: JSON.stringify(buildTime.toLocaleDateString('tr-TR')),
      __BUILD_TIME__: JSON.stringify(buildTime.toLocaleTimeString('tr-TR')),
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
  };
});
