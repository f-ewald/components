import { test, expect } from "@playwright/test";

test.describe("user-avatar", () => {
  test("shows an image, an initial fallback, an icon fallback, and recovers from a broken image", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#avatar-image img")).toBeVisible();

    const initialAvatar = page.locator("#avatar-initial");
    await expect(initialAvatar.locator("img")).toHaveCount(0);
    await expect(initialAvatar).toContainText("F");

    const fallbackAvatar = page.locator("#avatar-fallback");
    await expect(fallbackAvatar.locator("img")).toHaveCount(0);
    await expect(fallbackAvatar.locator("svg")).toBeVisible();

    const brokenAvatar = page.locator("#avatar-broken");
    await expect(brokenAvatar.locator("img")).toHaveCount(0);
    await expect(brokenAvatar).toContainText("B");
  });

  test("resolves named size presets to pixel diameters", async ({ page }) => {
    await page.goto("/");

    const xs = page.locator("#avatar-preset-xs").locator(".avatar");
    await expect(xs).toHaveCSS("width", "18px");

    const lg = page.locator("#avatar-preset-lg").locator(".avatar");
    await expect(lg).toHaveCSS("width", "48px");
  });
});
