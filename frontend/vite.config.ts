import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const BACKEND = "http://localhost:8000";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Lennox Thermostats",
        short_name: "Lennox",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#020617",
        theme_color: "#020617",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        // Live control data (temperature/setpoints) must never be served from cache.
        navigateFallbackDenylist: [/^\/units/, /^\/health/],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    proxy: {
      "/units": { target: BACKEND, changeOrigin: true, ws: true },
      "/health": { target: BACKEND, changeOrigin: true },
    },
  },
  build: {
    outDir: "../app/static",
    emptyOutDir: true,
  },
});
