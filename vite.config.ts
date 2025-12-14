import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  // Use base path only in production builds for GitHub Pages
  // In development, use "/" for seamless local preview
  base: mode === "production" ? "/mars-space-gym-buddy/" : "/",

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Bundle analyzer - generates stats.html in dist folder after build
    mode === "production" && visualizer({
      open: false,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
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
          // React core libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI component libraries
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-tabs",
            "@radix-ui/react-label",
            "@radix-ui/react-switch",
            "@radix-ui/react-toast",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
          ],
          // Chart library
          "chart-vendor": ["recharts"],
          // Form libraries
          "form-vendor": ["react-hook-form", "zod", "@hookform/resolvers"],
          // Supabase client
          "supabase-vendor": ["@supabase/supabase-js"],
          // Date utilities
          "date-vendor": ["date-fns"],
          // React Query
          "query-vendor": ["@tanstack/react-query"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    target: "esnext",
    minify: "esbuild",
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
    ],
  },
}));

