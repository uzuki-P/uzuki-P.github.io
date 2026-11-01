import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  // relative asset URLs so the build works at a user site root or a /<repo>/ path
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { host: "127.0.0.1" },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
})
