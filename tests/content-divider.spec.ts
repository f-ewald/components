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

  test("keeps an identical footprint whether or not a label is present", async ({ page }) => {
    await page.goto("/");
    const plainRule = page.locator("#content-divider-demo .rule");
    const labeledRule = page.locator("#content-divider-labeled .rule");
    const plainBox = await plainRule.boundingBox();
    const labeledBox = await labeledRule.boundingBox();
    expect(plainBox).not.toBeNull();
    expect(labeledBox).not.toBeNull();
    // Same reserved middle-row height, so toggling a label never shifts layout.
    expect(Math.round(plainBox!.height)).toBe(Math.round(labeledBox!.height));
  });

  test("exposes vertical spacing as an overridable custom property", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#content-divider-demo");
    const rule = host.locator(".rule");
    // Spacing is block padding inside the shadow DOM, so a consumer's global
    // `* { margin: 0 }`/`* { padding: 0 }` reset cannot collapse it.
    await expect(rule).toHaveCSS("padding-top", "16px");
    await expect(rule).toHaveCSS("padding-bottom", "16px");
    // The custom property inherits through the shadow boundary and retunes it.
    await host.evaluate((node) => node.style.setProperty("--component-divider-spacing", "2rem"));
    await expect(rule).toHaveCSS("padding-top", "32px");
  });
});
