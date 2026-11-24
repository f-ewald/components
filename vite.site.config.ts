import { defineConfig } from "vite";
import { resolve } from "node:path";

// Bundles the documentation landing page's script into pages-dist/assets/
// alongside docs.css. Runs after generate-docs.mjs --site, so it must not
// empty the output directory.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: "pages-dist/assets",
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, "site/landing.ts"),
      formats: ["es"],
      fileName: () => "landing.js",
    },
  },
});
