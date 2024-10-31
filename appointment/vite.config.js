import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Use 'esnext' to support the latest JavaScript features including top-level await
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'process.env': process.env,
    },
  },
})

