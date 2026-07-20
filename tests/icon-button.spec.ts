import { test, expect } from "@playwright/test";

test.describe("icon-button", () => {
  test("renders the passed-in icon and fires click", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#icon-button-edit");
    await expect(el.locator("button")).toHaveAttribute("aria-label", "Edit");
    await expect(el.locator("svg")).toBeVisible();

    await el.locator("button").click();
    await expect(page.locator("#icon-button-click-log")).toHaveText("icon-button-edit: clicked");
  });

  test("a disabled icon-button does not fire click", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#icon-button-disabled");
    await expect(el.locator("button")).toBeDisabled();
  });
});
