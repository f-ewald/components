import { test, expect } from "@playwright/test";

test.describe("dropdown-button", () => {
  test("click opens the menu, picking an action fires select and closes", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-resolve");
    const trigger = el.locator("button.trigger");

    await expect(trigger).toHaveText("Resolve…");
    await trigger.click();

    const options = el.locator("li[role='menuitem']");
    await expect(options).toHaveCount(3);
    await options.filter({ hasText: "Retry" }).click();

    await expect(page.locator("#dropdown-select-log")).toHaveText("dropdown-resolve: retry");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("Escape closes the menu without firing select", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-resolve");
    const trigger = el.locator("button.trigger");

    await trigger.click();
    await expect(el.locator("ul.options")).toBeVisible();
    await trigger.press("Escape");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("a disabled dropdown-button does not open on click", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#dropdown-disabled");
    await el.locator("button.trigger").click({ force: true });
    await expect(el.locator("ul.options")).toHaveCount(0);
  });
});
