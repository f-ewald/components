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

    // Move the cursor away first — it's still sitting where .close was just
    // clicked, which is exactly where the next toast renders (same fixed
    // corner), and hovering now pauses the countdown.
    await page.mouse.move(0, 0);
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

  test("gradient theme hooks (--ui-toast-*-background/-highlight/-text-shadow) layer a glossy gradient per variant", async ({
    page,
  }) => {
    await page.goto("/");
    const host = page.locator("toast-notification");
    // Same literal values gradientTokenValues (src/tokens.ts) ships for
    // data-theme="gradient" — set directly here since the dev playground
    // never loads the built dist/tokens.css that mechanism relies on.
    const gradients = {
      success: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
      error: "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)",
      info: "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)",
      warning: "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)",
    } as const;
    // Computed background-image drops the (default) 180deg angle and
    // resolves hex stops to rgb() — one per variant, so a wire-up mixup
    // between variants (e.g. success accidentally reading error's token)
    // would fail these exact-match assertions.
    const computedGradients = {
      success: "linear-gradient(rgb(34, 197, 94) 0%, rgb(22, 163, 74) 100%)",
      error: "linear-gradient(rgb(239, 68, 68) 0%, rgb(220, 38, 38) 100%)",
      info: "linear-gradient(rgb(56, 189, 248) 0%, rgb(14, 165, 233) 100%)",
      warning: "linear-gradient(rgb(245, 158, 11) 0%, rgb(217, 119, 6) 100%)",
    } as const;

    await host.evaluate((element, gradients) => {
      element.style.setProperty("--ui-toast-highlight", "inset 0 1px 0 rgb(255 255 255 / 0.35)");
      element.style.setProperty("--ui-toast-text-shadow", "0 1px 1px rgb(0 0 0 / 0.25)");
      element.style.setProperty("--ui-toast-success-background", gradients.success);
      element.style.setProperty("--ui-toast-error-background", gradients.error);
      element.style.setProperty("--ui-toast-info-background", gradients.info);
      element.style.setProperty("--ui-toast-warning-background", gradients.warning);
      const el = element as HTMLElement & {
        show: (msg: string, opts?: { variant?: string; duration?: number }) => number;
      };
      for (const variant of ["success", "error", "info", "warning"]) {
        el.show(variant, { variant, duration: 0 });
      }
    }, gradients);

    for (const [variant, gradient] of Object.entries(computedGradients)) {
      const toast = host.locator(`.toast.${variant}`);
      await expect(toast).toHaveCSS("background-image", gradient);
      await expect(toast).toHaveCSS("text-shadow", "rgba(0, 0, 0, 0.25) 0px 1px 1px");
    }
  });

  test("a timed toast shows a countdown ring/number instead of the close button until hovered or focused", async ({
    page,
  }) => {
    await page.goto("/");
    await page.mouse.move(0, 0);
    const toastHost = page.locator("toast-notification");
    await page.evaluate(() => {
      const el = document.querySelector("toast-notification") as HTMLElement & {
        show: (msg: string, opts?: { duration?: number }) => number;
      };
      el.show("Timed toast", { duration: 5000 });
    });

    const toast = toastHost.locator(".toast");
    const countdown = toast.locator(".countdown-number");
    const closeBtn = toast.locator(".close");
    await expect(toast).toHaveClass(/has-countdown/);
    await expect(countdown).toHaveText("5");
    // Close button is opacity:0 (still present/focusable), not display:none —
    // Playwright's toBeVisible() doesn't treat opacity:0 as hidden, so assert
    // on the computed opacity directly.
    await expect(closeBtn).toHaveCSS("opacity", "0");

    await toast.hover();
    await expect(closeBtn).toHaveCSS("opacity", "1");

    await page.mouse.move(0, 0);
    await expect(closeBtn).toHaveCSS("opacity", "0");
  });

  test("focusing the close button reveals it the same way hover does", async ({ page }) => {
    await page.goto("/");
    await page.mouse.move(0, 0);
    const toastHost = page.locator("toast-notification");
    await page.evaluate(() => {
      const el = document.querySelector("toast-notification") as HTMLElement & {
        show: (msg: string, opts?: { duration?: number }) => number;
      };
      el.show("Focus toast", { duration: 5000 });
    });
    const closeBtn = toastHost.locator(".toast .close");
    await expect(closeBtn).toHaveCSS("opacity", "0");
    await closeBtn.focus();
    await expect(closeBtn).toHaveCSS("opacity", "1");
  });

  test("a duration:0 toast never shows a countdown, only the always-visible close button", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const el = document.querySelector("toast-notification") as HTMLElement & {
        show: (msg: string, opts?: { duration?: number }) => number;
      };
      el.show("Manual only", { duration: 0 });
    });
    const toast = page.locator("toast-notification .toast");
    await expect(toast).not.toHaveClass(/has-countdown/);
    await expect(toast.locator(".countdown")).toHaveCount(0);
    await expect(toast.locator(".close")).toBeVisible();
  });

  test("hovering pauses the real auto-dismiss timer, which resumes for the remaining time once the pointer leaves", async ({
    page,
  }) => {
    await page.goto("/");
    await page.mouse.move(0, 0);
    const toastHost = page.locator("toast-notification");
    await page.evaluate(() => {
      const el = document.querySelector("toast-notification") as HTMLElement & {
        show: (msg: string, opts?: { duration?: number }) => number;
      };
      el.show("Pausable", { duration: 3000 });
    });
    const toast = toastHost.locator(".toast");

    await toast.hover();
    await page.waitForTimeout(4000); // well past the original 3000ms duration
    await expect(toast).toBeVisible(); // still here: paused while hovered

    await page.mouse.move(0, 0); // resumes with ~3000ms remaining
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCount(0, { timeout: 3500 });
  });
});
