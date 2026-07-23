import { defineConfig } from "vite";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";

const dir = import.meta.dirname;

// Multi-page build: the component catalog (index.html) plus one full-page
// template demo per docs/layouts recipe. The dev server serves each .html by
// path automatically; these inputs are what the static builds emit.
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "demo-dist",
    rollupOptions: {
      input: {
        main: resolve(dir, "index.html"),
        "list-only": resolve(dir, "demo/layouts/list-only.html"),
        "list-detail": resolve(dir, "demo/layouts/list-detail.html"),
        "detail-only": resolve(dir, "demo/layouts/detail-only.html"),
        "record-detail": resolve(dir, "demo/layouts/record-detail.html"),
        "form-page": resolve(dir, "demo/layouts/form-page.html"),
      },
    },
  },
});
