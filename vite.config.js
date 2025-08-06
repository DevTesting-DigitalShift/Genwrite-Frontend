import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize React production builds
      jsxRuntime: "automatic",
    }),
  ],
  server: {
    host: true,
    port: 5174,
    // Enable HTTP/2 for better performance
    https: false,
    // Optimize dev server
    hmr: {
      overlay: false,
    },
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
  },
  build: {
    // Optimize build output
    target: "es2015",
    cssCodeSplit: true,
    cssMinify: "esbuild",
    minify: "esbuild",
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable module preloading for better performance
    modulePreload: {
      polyfill: true,
    },

    // Optimize asset handling
    assetsInlineLimit: 4096, // 4kb - inline smaller assets as base64
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      // Pre-bundle these dependencies for faster dev server startup
      "react",
      "react-dom",
      "react-router-dom",
      "antd",
      "@reduxjs/toolkit",
      "react-redux",
      "framer-motion",
      "lucide-react",
      "@tiptap/extension-font-family",
      "@tiptap/extension-history",
      "axios",
      "marked",
      "dompurify",
    ],
    exclude: [
      // Exclude these from pre-bundling if they cause issues
    ],
  },
  // Enable esbuild optimizations
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    // Optimize for modern browsers
    target: "es2015",
    // Enable tree shaking
    treeShaking: true,
  },
})
