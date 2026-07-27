import { test, expect } from "@playwright/test";

test.describe("loading-spinner", () => {
  test("exposes an accessible status role and default label", async ({ page }) => {
    await page.goto("/");
    const spinner = page.locator("#loading-spinner-md");
    await expect(spinner).toHaveAttribute("role", "status");
    await expect(spinner).toHaveAttribute("aria-label", "Loading");
    await expect(spinner.locator("svg")).toBeVisible();
  });

  test("uses a custom label as the accessible name", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#loading-spinner-label")).toHaveAttribute(
      "aria-label",
      "Loading results",
    );
  });

  test("renders a track plus a primary-colored arc", async ({ page }) => {
    await page.goto("/");
    const arc = page.locator("#loading-spinner-md svg .arc");
    await expect(arc).toHaveCSS("stroke", "rgb(79, 70, 229)");
  });

  test("size scales the rendered spinner", async ({ page }) => {
    await page.goto("/");
    const sm = await page.locator("#loading-spinner-sm svg").boundingBox();
    const lg = await page.locator("#loading-spinner-lg svg").boundingBox();
    expect(sm).not.toBeNull();
    expect(lg).not.toBeNull();
    expect(lg!.width).toBeGreaterThan(sm!.width);
  });
});
