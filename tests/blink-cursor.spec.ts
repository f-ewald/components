import { test, expect } from "@playwright/test";

test.describe("blink-cursor", () => {
  test("renders the default glyph, hidden from assistive technology", async ({ page }) => {
    await page.goto("/");
    const cursor = page.locator("#blink-cursor-demo");
    await expect(cursor).toHaveAttribute("aria-hidden", "true");
    await expect(cursor.locator(".cursor")).toHaveText("▋");
  });

  test("the char property swaps the rendered glyph", async ({ page }) => {
    await page.goto("/");
    const custom = page.locator('blink-cursor[char="|"]');
    await expect(custom.locator(".cursor")).toHaveText("|");
  });

  test("the blink animation stops under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const animationName = await page
      .locator("#blink-cursor-demo .cursor")
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).toBe("none");
  });
});
