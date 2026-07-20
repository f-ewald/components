import { test, expect } from "@playwright/test";

test.describe("form-select", () => {
  test("click opens the listbox, picking an option commits, fires change, and closes", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#select-state");
    const trigger = el.locator("button.trigger");

    await expect(trigger).toHaveText("Open");
    await trigger.click();

    const options = el.locator("li[role='option']");
    await expect(options).toHaveCount(4);
    await options.filter({ hasText: "Done" }).click();

    await expect(trigger).toHaveText("Done");
    await expect(page.locator("#select-change-log")).toHaveText("select-state: done");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("Escape closes the listbox without committing", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-state");
    const trigger = el.locator("button.trigger");

    await trigger.click();
    await expect(el.locator("ul.options")).toBeVisible();
    await trigger.press("Escape");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("a disabled select does not open on click", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-disabled");
    await el.locator("button.trigger").click({ force: true });
    await expect(el.locator("ul.options")).toHaveCount(0);
  });
});
