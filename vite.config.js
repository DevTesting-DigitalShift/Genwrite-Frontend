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
    visualizer({ emitFile: true, filename: "stats.html", open: true }),
  ],
  server: {
    host: true,
    port: 5174,
    // Optimize dev server
    hmr: true,
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
    ],
    exclude: ["lexical", "lexical-react"],
  },
})
