import { test, expect } from "@playwright/test";

test.describe("data-table", () => {
  test("renders a header per column and a row per data entry", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#table-tasks");

    await expect(el.locator("th")).toHaveText(["Title", "State"]);
    const rows = el.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator("td")).toHaveText(["Write onboarding docs", "Backlog"]);
    await expect(rows.nth(1).locator("td")).toHaveText(["Fix the login bug", "Done"]);
  });

  test("clicking a row navigates via rowHref", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#table-tasks");

    await el.locator("tbody tr").first().click();
    await expect(page).toHaveURL(/#tsk_1$/);
  });
});
