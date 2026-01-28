import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM environment
    environment: "jsdom",

    // Setup files to run before each test file
    setupFiles: ["./src/__tests__/setup.ts"],

    // Enable globals like describe, it, expect
    globals: true,

    // Include test files pattern
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/__tests__/setup.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@context": resolve(__dirname, "./src/context"),
      "@store": resolve(__dirname, "./src/store"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@pages": resolve(__dirname, "./src/pages"),
      "@api": resolve(__dirname, "./src/api"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@data": resolve(__dirname, "./src/data"),
    },
  },
})
