import { test, expect } from "@playwright/test";

test.describe("confirm-dialog", () => {
  test("opens, fires confirm/cancel events, and disables buttons while busy", async ({ page }) => {
    await page.goto("/");
    const dialog = page.locator("#confirm-demo");
    const overlay = dialog.locator(".overlay");
    await expect(overlay).not.toHaveClass(/open/);

    await page.locator("#confirm-open").click();
    await expect(overlay).toHaveClass(/open/);

    await dialog.locator("button.btn-danger").click();
    await expect(page.locator("#confirm-count")).toHaveText("1");

    await page.locator("#confirm-open").click();
    await dialog.locator("button.btn-cancel").click();
    await expect(page.locator("#cancel-count")).toHaveText("1");

    await page.evaluate(() => {
      const el = document.getElementById("confirm-demo") as HTMLElement & { busy: boolean; open: boolean };
      el.busy = true;
      el.open = true;
    });
    await expect(dialog.locator("button.btn-cancel")).toBeDisabled();
    await expect(dialog.locator("button.btn-danger")).toBeDisabled();
  });
});
