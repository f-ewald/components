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
    await expect(popover.getByRole("dialog")).not.toHaveAttribute("aria-modal");
    await expect(page.locator("#popover-open")).toBeFocused();

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

  test("centered mode is named and modal, traps focus, and restores focus", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.locator("#popover-centered-open");
    const popover = page.locator("#popover-centered-demo");
    const dialog = popover.getByRole("dialog");
    const close = popover.locator(".close-btn");

    await trigger.click();
    await expect(dialog).toHaveAccessibleName("New task");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(close).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(popover).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("uses slotted title text as its accessible name", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const popover = document.createElement("popover-panel");
      popover.id = "slotted-title-popover";
      const title = document.createElement("span");
      title.slot = "title";
      title.textContent = "Actual popover title";
      popover.append(title);
      (popover as HTMLElement & { open: boolean }).open = true;
      document.body.append(popover);
    });

    await expect(
      page.locator("#slotted-title-popover").getByRole("dialog"),
    ).toHaveAccessibleName("Actual popover title");
  });

  test("disconnecting an open popover resets it closed", async ({ page }) => {
    await page.goto("/");
    const popover = page.locator("#popover-centered-demo");
    await page.locator("#popover-centered-open").click();
    const openAfterReconnect = await popover.evaluate((element) => {
      const parent = element.parentElement!;
      element.remove();
      parent.append(element);
      return (element as HTMLElement & { open: boolean }).open;
    });
    expect(openAfterReconnect).toBe(false);
    await expect(popover).not.toBeVisible();
  });
});
