import { test, expect } from "@playwright/test";

test.describe("popover-panel", () => {
  test("opens on trigger click, closes via the close button, and fires panel-close", async ({
    page,
  }) => {
    await page.goto("/");
    const popover = page.locator("#popover-demo");

    await expect(popover).not.toBeVisible();
    await page.locator("#popover-open").click();
    await expect(popover).toBeVisible();

    await page.evaluate(() => {
      document.getElementById("popover-demo")!.addEventListener("panel-close", () => {
        document.body.setAttribute("data-popover-closed", "true");
      });
    });
    await popover.locator(".close-btn").click();
    await expect(page.locator("body")).toHaveAttribute("data-popover-closed", "true");
    await expect(popover).not.toBeVisible();
  });

  test("closes on outside click and on Escape", async ({ page }) => {
    await page.goto("/");
    const popover = page.locator("#popover-demo");

    await page.locator("#popover-open").click();
    await expect(popover).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(popover).not.toBeVisible();

    await page.locator("#popover-open").click();
    await expect(popover).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover).not.toBeVisible();
  });

  test("the actions slot renders next to the close button", async ({ page }) => {
    await page.goto("/");
    await page.locator("#popover-open").click();
    const actionsLink = page.locator("#popover-actions-link");
    await expect(actionsLink).toBeVisible();
    await expect(actionsLink).toHaveText(/Full page/);
  });

  test("centered mode shows a backdrop and closes on backdrop click", async ({ page }) => {
    await page.goto("/");
    const popover = page.locator("#popover-centered-demo");

    await page.locator("#popover-centered-open").click();
    await expect(popover).toBeVisible();

    await popover.click({ position: { x: 2, y: 2 } });
    await expect(popover).not.toBeVisible();
  });
});
