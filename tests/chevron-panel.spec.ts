import { test, expect } from "@playwright/test";

test.describe("chevron-panel", () => {
  test("starts collapsed, expands on click, and reports state via the toggle event", async ({ page }) => {
    await page.goto("/");

    const panel = page.locator("#chevron-demo");
    await expect(panel.locator(".body")).toBeHidden();
    const header = panel.getByRole("button");
    await expect(header).toHaveAttribute("aria-expanded", "false");
    await expect(header).toHaveAttribute("aria-controls", "panel-body");

    await header.click();
    await expect(panel.locator(".body")).toBeVisible();
    await expect(panel).toHaveAttribute("open", "");
    await expect(header).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#chevron-toggle-log")).toHaveText("open: true");

    await header.click();
    await expect(panel.locator(".body")).toBeHidden();
    await expect(page.locator("#chevron-toggle-log")).toHaveText("open: false");
  });

  test("rotates the chevron 90 degrees while open", async ({ page }) => {
    await page.goto("/");
    const chevron = page.locator("#chevron-demo .chevron");
    await expect(chevron).toHaveCSS("transform", "none");
    await page.locator("#chevron-demo").getByRole("button").click();
    await expect(chevron).toHaveCSS("transform", "matrix(0, 1, -1, 0, 0, 0)");
  });
});
