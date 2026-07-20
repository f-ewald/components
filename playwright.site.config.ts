import {defineConfig, devices} from "@playwright/test";

/**
 * Smoke-tests the complete static artifact that GitHub Pages receives.
 */
export default defineConfig({
  testDir: "./site-tests",
  reporter: "list",
  projects: [{name: "chromium", use: {...devices["Desktop Chrome"]}}],
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: "npm run preview:site -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
