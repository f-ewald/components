import { defineConfig, devices } from "@playwright/test";

/** Static/catalog/accessibility contracts kept outside the fast component suite. */
export default defineConfig({
  testDir: "./design-tests",
  reporter: "list",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    baseURL: "http://localhost:5173",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
