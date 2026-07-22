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

  test("is named, traps focus, closes with Escape, and restores trigger focus", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.locator("#confirm-open");
    const dialog = page.locator("#confirm-demo");
    const modal = dialog.getByRole("dialog");
    const cancel = dialog.locator(".btn-cancel");
    const confirm = dialog.locator(".btn-danger");

    await trigger.click();
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAccessibleName("Confirmation");
    await expect(cancel).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(confirm).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.locator("#cancel-count")).toHaveText("1");
    await expect(modal).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("stops spinner motion when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => {
      const el = document.getElementById("confirm-demo") as HTMLElement & {
        busy: boolean;
        open: boolean;
      };
      el.busy = true;
      el.open = true;
    });

    await expect(page.locator("#confirm-demo .spin")).toHaveCSS("animation-name", "none");
  });

  test("only the topmost modal traps focus and handles Escape", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/");
    const centered = page.locator("#popover-centered-demo");
    const confirm = page.locator("#confirm-demo");

    await page.locator("#popover-centered-open").click();
    await expect(centered).toBeVisible();
    await confirm.evaluate((element) => {
      (element as HTMLElement & { open: boolean }).open = true;
    });
    await expect(confirm.locator(".btn-cancel")).toBeFocused();
    expect(pageErrors).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(confirm.getByRole("dialog")).not.toBeVisible();
    await expect(centered).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(centered).not.toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("disconnecting an open dialog releases the underlying layer", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator("#panel-demo");
    await page.locator("#panel-open").click();
    await page.locator("#confirm-demo").evaluate((element) => {
      (element as HTMLElement & { open: boolean }).open = true;
    });
    const wasClosed = await page.locator("#confirm-demo").evaluate((element) => {
      element.remove();
      return !(element as HTMLElement & { open: boolean }).open;
    });
    expect(wasClosed).toBe(true);

    await page.keyboard.press("Escape");
    await expect(panel.getByRole("dialog")).not.toBeVisible();
  });

  test("newer layers render and behave above older layers", async ({ page }) => {
    await page.goto("/");
    const confirm = page.locator("#confirm-demo");
    const panel = page.locator("#panel-demo");
    await confirm.evaluate((element) => {
      (element as HTMLElement & { open: boolean }).open = true;
    });
    await panel.evaluate((element) => {
      (element as HTMLElement & { open: boolean }).open = true;
    });

    const zIndexes = await Promise.all(
      [confirm.locator(".overlay"), panel.locator(".panel")].map((layer) =>
        layer.evaluate((element) => Number(getComputedStyle(element).zIndex)),
      ),
    );
    expect(zIndexes[1]).toBeGreaterThan(zIndexes[0]);
    await expect(panel.locator(".close-btn")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(panel.getByRole("dialog")).not.toBeVisible();
    await expect(confirm.getByRole("dialog")).toBeVisible();
  });

  test("applies dialog measurement contract: 25rem width, tokenized body leading, and role-based padding", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#confirm-open").click();
    const dialog = page.locator("#confirm-demo .dialog");
    await expect(dialog).toHaveCSS("border-radius", "8px");
    await expect(dialog).toHaveCSS("max-width", "400px");
    await expect(dialog).toHaveCSS("padding", "16px");

    const body = page.locator("#confirm-demo .dialog-text");
    await expect(body).toHaveCSS("line-height", "21px");
    await expect(page.locator("#confirm-demo .btn-danger")).toHaveCSS(
      "font-weight",
      "500",
    );
    await expect(page.locator("#confirm-demo .btn-danger")).toHaveCSS("height", "32px");
    await expect(page.locator("#confirm-demo .btn-danger")).toHaveCSS("line-height", "15px");
  });

  test("shrinks dialog body padding at the shared mobile breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto("/");
    await page.locator("#confirm-open").click();
    await expect(page.locator("#confirm-demo .dialog")).toHaveCSS("padding", "12px");
  });
});
