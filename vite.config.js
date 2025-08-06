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
    rollupOptions: {
      // Optimize external dependencies
      external: [],
      output: {
        // Advanced chunking strategy for optimal loading
        manualChunks: (id) => {
          // Vendor chunk for React ecosystem
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router")
          ) {
            return "vendor-react"
          }

          // UI Library chunk
          if (id.includes("node_modules/antd") || id.includes("node_modules/@ant-design")) {
            return "vendor-ui"
          }

          // State management chunk
          if (
            id.includes("node_modules/@reduxjs") ||
            id.includes("node_modules/redux") ||
            id.includes("node_modules/react-redux")
          ) {
            return "vendor-state"
          }

          // Animation libraries
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/lottie")) {
            return "vendor-animation"
          }

          // Text editor chunk
          if (
            id.includes("node_modules/@tiptap") ||
            id.includes("node_modules/prosemirror") ||
            id.includes("node_modules/codemirror")
          ) {
            return "vendor-editor"
          }

          // Utility libraries
          if (
            id.includes("node_modules/lodash") ||
            id.includes("node_modules/moment") ||
            id.includes("node_modules/dayjs") ||
            id.includes("node_modules/date-fns")
          ) {
            return "vendor-utils"
          }

          // HTTP and API libraries
          if (id.includes("node_modules/axios") || id.includes("node_modules/fetch")) {
            return "vendor-http"
          }

          // Icons and assets
          if (
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/@heroicons") ||
            id.includes("node_modules/react-icons")
          ) {
            return "vendor-icons"
          }

          // PDF and document processing
          if (
            id.includes("node_modules/html2pdf") ||
            id.includes("node_modules/jspdf") ||
            id.includes("node_modules/docx") ||
            id.includes("node_modules/marked") ||
            id.includes("node_modules/dompurify")
          ) {
            return "vendor-documents"
          }

          // Other large vendor libraries
          if (id.includes("node_modules/")) {
            return "vendor-misc"
          }
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const fileName = path.basename(facadeModuleId, path.extname(facadeModuleId))
            return `chunks/${fileName}-[hash].js`
          }
          return "chunks/[name]-[hash].js"
        },
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".")
          const ext = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/media/[name]-[hash].${ext}`
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
      },
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
