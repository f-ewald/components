import { test, expect } from "@playwright/test";

test.describe("content-divider", () => {
  test("renders a plain horizontal separator", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#content-divider-demo");
    const rule = el.locator(".rule");
    await expect(rule).toHaveAttribute("role", "separator");
    await expect(rule).toHaveAttribute("aria-orientation", "horizontal");
    // Plain mode has no label and a single full-width rule line.
    await expect(el.locator(".label")).toHaveCount(0);
    await expect(el.locator(".line")).toHaveCount(1);
    await expect(el.locator(".line")).toHaveCSS("border-top-width", "1px");
    await expect(el.locator(".line")).toHaveCSS("border-top-color", "rgb(226, 232, 240)");
  });

  test("centers a label between two lines and names the separator", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#content-divider-labeled");
    await expect(el.locator(".label")).toHaveText("OR");
    await expect(el.locator(".line")).toHaveCount(2);
    await expect(el.locator(".rule")).toHaveAccessibleName("OR");
    // Tokenized muted label type.
    await expect(el.locator(".label")).toHaveCSS("font-weight", "500");
    await expect(el.locator(".label")).toHaveCSS("color", "rgb(100, 116, 139)");
  });
});
