import { test, expect } from "@playwright/test";

test.describe("scroll-to-bottom", () => {
  test("container-target button is hidden near the bottom and appears once scrolled up", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator("#scroll-bottom-container-btn");
    const container = page.locator("#scroll-bottom-container");

    // The container starts scrolled to the top, i.e. far from the bottom.
    await expect(btn).toHaveAttribute("visible", "");

    await container.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(btn).not.toHaveAttribute("visible", "");
  });

  test("click scrolls the container to the bottom and fires the event", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("#scroll-bottom-container");
    const btn = page.locator("#scroll-bottom-container-btn");

    await expect(btn).toHaveAttribute("visible", "");
    await btn.locator("button").click();
    await expect(page.locator("#scroll-bottom-log")).toHaveText("scroll-to-bottom-triggered: container");
    await expect(async () => {
      const atBottom = await container.evaluate(
        (el) => el.scrollHeight - el.scrollTop - el.clientHeight <= 1,
      );
      expect(atBottom).toBe(true);
    }).toPass();
  });

  test("hidden button is out of tab order", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("#scroll-bottom-container");
    await container.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    const btn = page.locator("#scroll-bottom-container-btn button");
    await expect(btn).not.toBeVisible();
  });

  test("renders a secondary-styled button containing its visible label text", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("#scroll-bottom-window button");
    await expect(button).toHaveText("Scroll to bottom");
    // Same metrics as ui-button's secondary variant, not a pill.
    await expect(button).toHaveCSS("border-radius", "4px");
    await expect(button).toHaveCSS("padding", "8px 16px");
    await expect(button).toHaveCSS("height", "32px");
  });

  test("a target instance is position: absolute (contained); the window instance stays fixed", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#scroll-bottom-window")).toHaveCSS("position", "fixed");
    await expect(page.locator("#scroll-bottom-container-btn")).toHaveAttribute("contained", "");
    await expect(page.locator("#scroll-bottom-container-btn")).toHaveCSS("position", "absolute");
  });
});
