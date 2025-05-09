import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: "/index.html",
    port: "8080",
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: ["/index.html"]
    },
  },
  root: "src",
  publicDir: "../public",
});
