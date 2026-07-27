import { test, expect } from "@playwright/test";

test.describe("loading-dots", () => {
  test("renders three dots with an accessible status role", async ({ page }) => {
    await page.goto("/");
    const dots = page.locator("#loading-dots-md");
    await expect(dots).toHaveAttribute("role", "status");
    await expect(dots).toHaveAttribute("aria-label", "Loading");
    await expect(dots.locator(".dot")).toHaveCount(3);
  });

  test("uses a custom label as the accessible name", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#loading-dots-label")).toHaveAttribute(
      "aria-label",
      "Sending message",
    );
  });

  test("size scales the rendered dots", async ({ page }) => {
    await page.goto("/");
    const sm = await page.locator("#loading-dots-sm .dot").first().boundingBox();
    const lg = await page.locator("#loading-dots-lg .dot").first().boundingBox();
    expect(sm).not.toBeNull();
    expect(lg).not.toBeNull();
    expect(lg!.width).toBeGreaterThan(sm!.width);
  });
});
