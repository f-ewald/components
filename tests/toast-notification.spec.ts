import { test, expect } from "@playwright/test";

test.describe("toast-notification", () => {
  test("show() renders a toast, the close button dismisses it, and it auto-dismisses", async ({ page }) => {
    await page.goto("/");
    const toastHost = page.locator("toast-notification");

    await page.locator("#toast-success").click();
    const toast = toastHost.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Saved successfully");

    await toast.locator(".close").click();
    await expect(toast).toHaveCount(0);

    await page.evaluate(() => {
      const el = document.querySelector("toast-notification") as HTMLElement & {
        show: (msg: string, opts?: { variant?: string; duration?: number }) => number;
      };
      el.show("Auto-dismiss me", { duration: 300 });
    });
    await expect(toastHost.locator(".toast")).toBeVisible();
    await expect(toastHost.locator(".toast")).toHaveCount(0, { timeout: 2000 });
  });
});
