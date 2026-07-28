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

  test("every toast shares one fixed width regardless of message length", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("toast-notification");
    // 22.5rem === 360px at the default 16px root font size.
    await expect(host).toHaveCSS("width", "360px");

    await page.evaluate(() => {
      const el = document.querySelector("toast-notification") as HTMLElement & {
        show: (msg: string, opts?: { duration?: number }) => number;
      };
      el.show("Short", { duration: 0 });
      el.show(
        "A considerably longer notification message that would otherwise stretch this toast wider than its neighbor",
        { duration: 0 },
      );
    });

    const toasts = host.locator(".toast");
    await expect(toasts).toHaveCount(2);
    const first = (await toasts.nth(0).boundingBox())!;
    const second = (await toasts.nth(1).boundingBox())!;
    expect(first.width).toBeCloseTo(second.width, 0);
  });

  test("renders an optional bold headline with a smaller, non-bold description", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("toast-notification");

    await page.locator("#toast-description").click();
    const toast = host.locator(".toast");
    await expect(toast).toBeVisible();

    const message = toast.locator(".message");
    const description = toast.locator(".description");
    await expect(message).toContainText("Listing published");
    await expect(description).toContainText("visible to buyers");
    // Headline is semibold (600) at body size; description is regular (400) and smaller.
    await expect(message).toHaveCSS("font-weight", "600");
    await expect(message).toHaveCSS("font-size", "14px");
    await expect(description).toHaveCSS("font-weight", "400");
    await expect(description).toHaveCSS("font-size", "12px");

    // A toast with no description omits the element entirely.
    await page.locator("#toast-success").click();
    const bare = host.locator(".toast", { hasText: "Saved successfully" });
    await expect(bare.locator(".description")).toHaveCount(0);
  });

  test("each variant leads with its own distinct 18px status icon", async ({ page }) => {
    await page.goto("/");
    const icons = await page.evaluate(async () => {
      const el = document.querySelector("toast-notification") as HTMLElement & {
        show: (msg: string, opts?: { variant?: string; duration?: number }) => number;
        updateComplete: Promise<boolean>;
      };
      for (const variant of ["success", "error", "info", "warning"] as const) {
        el.show(variant, { variant, duration: 0 });
      }
      await el.updateComplete;
      return [...el.shadowRoot!.querySelectorAll(".toast .icon svg")].map((svg) => ({
        width: svg.getAttribute("width"),
        markup: svg.innerHTML,
      }));
    });
    expect(icons).toHaveLength(4);
    for (const icon of icons) expect(icon.width).toBe("18");
    // Every variant maps to a different glyph.
    expect(new Set(icons.map((i) => i.markup)).size).toBe(4);
  });

  test("warning variant uses the amber fill, a polite status role, and an icon", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("toast-notification");
    await page.locator("#toast-warning").click();
    const toast = host.locator(".toast.warning");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Listing expires soon");
    await expect(toast).toHaveAttribute("role", "status");
    // --ui-warning fallback #d97706 === rgb(217, 119, 6).
    await expect(toast).toHaveCSS("background-color", "rgb(217, 119, 6)");
    await expect(toast.locator(".icon svg")).toHaveAttribute("width", "18");
  });
});
