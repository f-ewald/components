import { defineConfig, devices } from "@playwright/test";

/**
 * Happy-path suite for the component playground: one spec per component,
 * run against the Vite dev server (Playwright locators pierce shadow DOM
 * automatically, so no special setup is needed to reach component internals).
 */
export default defineConfig({
  testDir: "./tests",
  reporter: "list",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    baseURL: "http://localhost:5173",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
