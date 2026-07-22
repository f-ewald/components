import { test, expect } from "@playwright/test";

test.describe("slide-panel", () => {
  test("the open attribute slides the panel in and the close button fires panel-close", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator("#panel-demo");
    const panelInner = panel.locator(".panel");
    await expect(panelInner).not.toHaveClass(/open/);

    await page.locator("#panel-open").click();
    await expect(panelInner).toHaveClass(/open/);

    await page.evaluate(() => {
      document.getElementById("panel-demo")!.addEventListener("panel-close", () => {
        document.body.setAttribute("data-panel-closed", "true");
      });
    });
    await panelInner.locator(".close-btn").click();
    await expect(page.locator("body")).toHaveAttribute("data-panel-closed", "true");
  });

  test("is named, closes with Escape, and restores focus without acting modal", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.locator("#panel-open");
    const panel = page.locator("#panel-demo");
    const dialog = panel.getByRole("dialog");

    await trigger.click();
    await expect(dialog).toHaveAccessibleName("Property details");
    await expect(dialog).toHaveAttribute("aria-modal", "false");
    await expect(panel.locator(".close-btn")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("removes the slide transition when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("#panel-demo .panel")).toHaveCSS("transition-duration", "0s");
  });

  test("uses slotted title text as its accessible name", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const panel = document.createElement("slide-panel");
      panel.id = "slotted-title-panel";
      const title = document.createElement("span");
      title.slot = "title";
      title.textContent = "Actual panel title";
      panel.append(title);
      (panel as HTMLElement & { open: boolean }).open = true;
      document.body.append(panel);
    });

    await expect(page.locator("#slotted-title-panel").getByRole("dialog")).toHaveAccessibleName(
      "Actual panel title",
    );
  });

  test("disconnecting an open panel resets it closed", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator("#panel-demo");
    await page.locator("#panel-open").click();
    const openAfterReconnect = await panel.evaluate((element) => {
      const parent = element.parentElement!;
      element.remove();
      parent.append(element);
      return (element as HTMLElement & { open: boolean }).open;
    });
    expect(openAfterReconnect).toBe(false);
    await expect(panel.getByRole("dialog")).not.toBeVisible();
  });
});
