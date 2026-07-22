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

  test("uses assertive error semantics and provides a keyboard-focusable dismiss action", async ({
    page,
  }) => {
    await page.goto("/");
    const toastHost = page.locator("toast-notification");
    await page.evaluate(() => {
      const el = document.querySelector("toast-notification") as HTMLElement & {
        show: (message: string, options: { variant: string; duration: number }) => number;
      };
      el.show("Connection failed", { variant: "error", duration: 0 });
    });

    await expect(toastHost.getByRole("alert")).toContainText("Connection failed");
    const dismiss = toastHost.getByRole("button", { name: "Dismiss notification" });
    await dismiss.focus();
    await expect(dismiss).toBeFocused();
  });

  test("uses tokenized body leading and an 8px surface radius", async ({ page }) => {
    await page.goto("/");
    await page.locator("#toast-success").click();
    const toast = page.locator("toast-notification .toast");
    await expect(toast).toHaveCSS("line-height", "21px");
    await expect(toast).toHaveCSS("border-radius", "8px");
    await expect(toast).toHaveCSS("padding", "12px");
    const close = toast.locator(".close");
    await expect(close).toHaveCSS("width", "32px");
    await expect(close).toHaveCSS("height", "32px");
    await expect(close.locator("svg")).toHaveAttribute("width", "18");
  });
});
