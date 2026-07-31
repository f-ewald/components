import { test, expect } from "@playwright/test";

test.describe("modal-dialog", () => {
  test("the open attribute shows the overlay and the close button fires panel-close", async ({ page }) => {
    await page.goto("/");
    const dialog = page.locator("#modal-demo");
    const overlay = dialog.locator(".overlay");
    await expect(overlay).not.toHaveClass(/open/);

    await page.locator("#modal-open").click();
    await expect(overlay).toHaveClass(/open/);

    await page.evaluate(() => {
      document.getElementById("modal-demo")!.addEventListener("panel-close", () => {
        document.body.setAttribute("data-modal-closed", "true");
      });
    });
    await dialog.locator(".close-btn").click();
    await expect(page.locator("body")).toHaveAttribute("data-modal-closed", "true");
  });

  test("is named, traps focus, closes with Escape, and restores trigger focus", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator("#modal-open");
    const dialog = page.locator("#modal-demo");
    const modal = dialog.getByRole("dialog");

    await trigger.click();
    await expect(modal).toHaveAttribute("aria-modal", "true");
    await expect(modal).toHaveAccessibleName("Changelog");
    await expect(dialog.locator(".close-btn")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("closes on backdrop click only when dismissible", async ({ page }) => {
    await page.goto("/");
    const dialog = page.locator("#modal-demo");
    await page.evaluate(() => {
      document.getElementById("modal-demo")!.addEventListener("panel-close", () => {
        (document.getElementById("modal-demo") as HTMLElement & { open: boolean }).open = false;
      });
    });

    await page.locator("#modal-open").click();
    await expect(dialog.locator(".overlay")).toHaveClass(/open/);
    await dialog.locator(".overlay").click({ position: { x: 5, y: 5 } });
    await expect(dialog.getByRole("dialog")).not.toBeVisible();

    const nonDismissible = page.locator("#modal-lg-demo");
    await page.locator("#modal-lg-open").click();
    await expect(nonDismissible.locator(".overlay")).toHaveClass(/open/);
    await nonDismissible.locator(".overlay").click({ position: { x: 5, y: 5 } });
    await expect(nonDismissible.getByRole("dialog")).toBeVisible();
  });

  test("the lg size widens the dialog beyond the 25rem default", async ({ page }) => {
    await page.goto("/");
    await page.locator("#modal-open").click();
    await expect(page.locator("#modal-demo .dialog")).toHaveCSS("max-width", "400px");
    await page.keyboard.press("Escape");
    await expect(page.locator("#modal-demo").getByRole("dialog")).not.toBeVisible();

    await page.locator("#modal-lg-open").click();
    await expect(page.locator("#modal-lg-demo .dialog")).toHaveCSS("max-width", "960px");
  });

  test("the fullscreen size covers the viewport, closes on Escape and via the close button", async ({
    page,
  }) => {
    await page.goto("/");
    const dialog = page.locator("#modal-fullscreen-demo");
    const modal = dialog.getByRole("dialog");

    await page.locator("#modal-fullscreen-open").click();
    await expect(modal).toBeVisible();
    await expect(dialog.locator(".dialog")).toHaveCSS("border-radius", "0px");
    const viewport = page.viewportSize();
    const box = await dialog.locator(".dialog").boundingBox();
    expect(box?.width).toBe(viewport?.width);
    expect(box?.height).toBe(viewport?.height);

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();

    await page.locator("#modal-fullscreen-open").click();
    await expect(modal).toBeVisible();
    await dialog.locator(".close-btn").click();
    await expect(modal).not.toBeVisible();
  });

  test("only the topmost dialog traps focus and handles Escape", async ({ page }) => {
    await page.goto("/");
    const modal = page.locator("#modal-demo");
    const confirm = page.locator("#confirm-demo");

    await page.locator("#modal-open").click();
    await expect(modal.getByRole("dialog")).toBeVisible();
    await confirm.evaluate((element) => {
      (element as HTMLElement & { open: boolean }).open = true;
    });
    await expect(confirm.locator(".btn-cancel")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(confirm.getByRole("dialog")).not.toBeVisible();
    await expect(modal.getByRole("dialog")).toBeVisible();
  });

  test("disconnecting an open dialog releases the underlying layer", async ({ page }) => {
    await page.goto("/");
    await page.locator("#modal-open").click();
    const wasClosed = await page.locator("#modal-demo").evaluate((element) => {
      element.remove();
      return !(element as HTMLElement & { open: boolean }).open;
    });
    expect(wasClosed).toBe(true);
  });
});
