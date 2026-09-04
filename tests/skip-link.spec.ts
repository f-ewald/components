import { test, expect } from "@playwright/test";

test.describe("skip-link", () => {
  test("is visually hidden at rest but becomes visible on keyboard focus", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("#skip-link-demo a");

    const clipped = (await link.boundingBox())!;
    expect(clipped.width).toBeLessThanOrEqual(1);
    expect(clipped.height).toBeLessThanOrEqual(1);

    await link.focus();
    const revealed = (await link.boundingBox())!;
    expect(revealed.width).toBeGreaterThan(1);
    expect(revealed.height).toBeGreaterThan(1);
  });

  test("points at an in-page target that resolves", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("#skip-link-demo a");
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href!.startsWith("#")).toBe(true);
    expect(await page.locator(href!).count()).toBeGreaterThan(0);
  });
});
