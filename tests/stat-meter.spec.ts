import { test, expect } from "@playwright/test";

test.describe("stat-meter", () => {
  test("renders label, fill width, and value for a percent reading", async ({ page }) => {
    await page.goto("/");

    const cpu = page.locator("#meter-cpu");
    await expect(cpu.locator(".label")).toHaveText("CPU");
    await expect(cpu.locator(".value")).toHaveText("42%");
    await expect(cpu.locator(".fill")).toHaveAttribute("style", /width:\s*42%/);
  });

  test("a null percent renders an empty bar and a dash instead of 0%", async ({ page }) => {
    await page.goto("/");

    const pending = page.locator("#meter-pending");
    await expect(pending.locator(".value")).toHaveText("—");
    await expect(pending.locator(".fill")).toHaveAttribute("style", /width:\s*0%/);
  });

  test("randomize button assigns a new percent reading to CPU/MEM", async ({ page }) => {
    await page.goto("/");

    await page.locator("#meter-randomize").click();
    await expect(page.locator("#meter-cpu .value")).toHaveText(/^\d{1,3}%$/);
    await expect(page.locator("#meter-mem .value")).toHaveText(/^\d{1,3}%$/);
  });

  test("a custom color overrides the default fill color", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#meter-color")).toHaveAttribute("color", "#dc2626");
    await expect(page.locator("#meter-color .fill")).toHaveAttribute("style", /--fill-color:\s*#dc2626/);
  });
});
