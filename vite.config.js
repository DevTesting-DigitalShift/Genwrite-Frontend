import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { visualizer } from "rollup-plugin-visualizer"

// https://vitejs.dev/config/
// Function form so we can branch on `command` — console/debugger are stripped from
// production builds only, and stay intact in the dev server.
export default defineConfig(({ command }) => ({
  esbuild: command === "build" ? { drop: ["console", "debugger"] } : {},
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
      "@api": path.resolve(import.meta.dirname, "./src/api"),
      "@components": path.resolve(import.meta.dirname, "./src/components"),
      "@constants": path.resolve(import.meta.dirname, "./src/constants"),
      "@utils": path.resolve(import.meta.dirname, "./src/utils"),
      "@pages": path.resolve(import.meta.dirname, "./src/pages"),
      "@store": path.resolve(import.meta.dirname, "./src/store"),
      "@admin": path.resolve(import.meta.dirname, "./src/admin"),
      "@": path.resolve(import.meta.dirname, "./src"),
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
        // Vite 8 bundles with rolldown, which only accepts a function here — the object
        // form is rejected outright. Same three groups as before, matched against the
        // resolved module id (the trailing /node_modules/<pkg>/ segment keeps "react"
        // from also catching react-icons, react-hook-form, and friends).
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (/[\\/]node_modules[\\/]react(-dom|-router|-router-dom)?[\\/]/.test(id)) return "vendor"
          if (id.includes("@tiptap")) return "tiptap"
          if (/[\\/]node_modules[\\/](axios|dayjs)[\\/]/.test(id)) return "utils"
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
}))
