import { test, expect } from "@playwright/test";

test.describe("form-actions", () => {
  test("orders start left, then secondary, then primary rightmost regardless of source order", async ({
    page,
  }) => {
    await page.goto("/");
    const del = page.locator('[data-testid="form-actions-delete"]');
    const cancel = page.locator('[data-testid="form-actions-cancel"]');
    const save = page.locator('[data-testid="form-actions-save"]');

    const [delBox, cancelBox, saveBox] = await Promise.all([
      del.boundingBox(),
      cancel.boundingBox(),
      save.boundingBox(),
    ]);
    expect(delBox!.x).toBeLessThan(cancelBox!.x);
    expect(cancelBox!.x).toBeLessThan(saveBox!.x);
  });

  test("does not intercept the submit button or the secondary action", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-testid="form-actions-save"]').click();
    await expect(page.locator("#form-actions-status")).toHaveText("Saved (submit fired).");

    await page.locator('[data-testid="form-actions-cancel"]').click();
    await expect(page.locator("#form-actions-status")).toHaveText("Cancelled.");
  });
});
