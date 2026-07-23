import { test, expect } from "@playwright/test";

test.describe("app-sidebar", () => {
  test("renders slotted nav items and marks the active one", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("#app-sidebar-demo");
    await expect(sidebar.locator('a[aria-current="page"]')).toContainText("Dashboard");
    await expect(sidebar).toContainText("Members");
  });

  test("collapsing hides the labels and brand name while keeping the icons and logo", async ({
    page,
  }) => {
    await page.goto("/");
    const sidebar = page.locator("#app-sidebar-demo");
    const label = sidebar.locator('a[aria-label="Dashboard"] span');
    const icon = sidebar.locator('a[aria-label="Dashboard"] svg');
    const brandName = sidebar.locator('[data-testid="app-sidebar-brand-name"]');
    const logo = sidebar.locator('[data-testid="app-sidebar-logo"]');
    await expect(label).toBeVisible();
    await expect(brandName).toBeVisible();

    await page.locator("#app-sidebar-toggle").click();
    await expect(sidebar).toHaveAttribute("collapsed", "");
    await expect(label).toBeHidden();
    await expect(icon).toBeVisible();
    await expect(brandName).toBeHidden();
    await expect(logo).toBeVisible();
  });
});
