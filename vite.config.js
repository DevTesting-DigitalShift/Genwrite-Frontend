import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { visualizer } from "rollup-plugin-visualizer"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize React production builds
      jsxRuntime: "automatic",
      // Ensure TypeScript files are processed correctly
      include: ["**/*.jsx", "**/*.tsx"],
    }),
    // visualizer({ emitFile: true, filename: "stats.html", open: true }),
  ],
  server: {
    host: true,
    port: 5174,
    hmr: {
      // Try these one at a time — pick the one that helps most
      // Option A: force client to use the exact host/port you're seeing in browser
      // host: 'localhost',   // or '127.0.0.1' — try both
      // port: 5174,          // must match server.port

      // Option B: if you're on Wi-Fi / sometimes IP changes
      // clientPort: 5174,    // forces client websocket to this port

      // Option C: most reliable when HMR feels flaky
      overlay: true,         // keep error overlay
      protocol: 'ws',        // force ws instead of auto wss (if no https)
    },

    watch: {
      // If you're on WSL, Docker, VirtualBox, network drive, or large node_modules
      usePolling: true,      // fallback to polling (slower but more reliable)
      interval: 1000,        // don't set too low or CPU spikes
    },
    // Optimize dev server
    // hmr: true,
    // hmr: {
    //   host: "distinguishingly-postpeduncular-annalisa.ngrok-free.dev",
    //   protocol: "wss",
    // },
  },
  resolve: {
    alias: {
      "@api": path.resolve(__dirname, "./src/api"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@constants": path.resolve(__dirname, "./src/constants"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@": path.resolve(__dirname, "./src"),
    },
    // Add .ts and .tsx extensions for TypeScript support
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    dedupe: ["react", "react-dom"],
  },
  build: {
    // Optimize build output
    target: "es2015",
    cssCodeSplit: true,
    cssMinify: "esbuild",
    minify: "esbuild",
    sourcemap: false,
    // Enable module preloading for better performance
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          tiptap: ["@tiptap/core", "@tiptap/react", "@tiptap/starter-kit"],
          utils: ["axios", "dayjs", "lodash-es"],
        },
      },
    },

    // Optimize asset handling
    assetsInlineLimit: 4096, // 4kb - inline smaller assets as base64
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    force: true, // Force re-bundling on each start (useful during development)
    include: [
      // Pre-bundle these dependencies for faster dev server startup
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "lucide-react",
      "axios",
      "marked",
      "dompurify",
      "@emailjs/browser",
      "@tanstack/react-table",
      "exceljs",
    ],
    exclude: ["lexical", "lexical-react"],
  },

  define: {
    'process.env': 'import.meta.env',
  }
})
