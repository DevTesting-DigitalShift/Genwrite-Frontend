import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
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
    cssCodeSplit: true, // Split CSS into separate files based on entry points
    sourcemap: false, // Optional: useful for debugging
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("tiptap")) return "chunk-tiptap"
        },
      },
    },
  },
  optimizeDeps: {
    include: ["@tiptap/extension-font-family", "@tiptap/extension-history", "prismjs"],
  },
})
