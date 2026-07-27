import { test, expect } from "@playwright/test";

test.describe("scroll-to-top", () => {
  test("container-target button is visible when scrolled down, hides once scrolled to the top", async ({
    page,
  }) => {
    await page.goto("/");
    const btn = page.locator("#scroll-top-container-btn");
    const container = page.locator("#scroll-top-container");

    // The demo starts the container pre-scrolled to the bottom.
    await expect(btn).toHaveAttribute("visible", "");

    await container.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect(btn).not.toHaveAttribute("visible", "");
  });

  test("click scrolls the container to the top and fires the event", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("#scroll-top-container");
    const btn = page.locator("#scroll-top-container-btn");

    await expect(btn).toHaveAttribute("visible", "");
    await btn.locator("button").click();
    await expect(page.locator("#scroll-top-log")).toHaveText("scroll-to-top-triggered: container");
    await expect(async () => {
      const atTop = await container.evaluate((el) => el.scrollTop <= 1);
      expect(atTop).toBe(true);
    }).toPass();
  });

  test("hidden button is out of tab order", async ({ page }) => {
    await page.goto("/");
    const container = page.locator("#scroll-top-container");
    await container.evaluate((el) => {
      el.scrollTop = 0;
    });
    const btn = page.locator("#scroll-top-container-btn button");
    await expect(btn).not.toBeVisible();
  });

  test("renders a pill containing its visible label text", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("#scroll-top-container-btn button");
    await expect(button).toHaveText("Scroll to top");
    await expect(button).toHaveCSS("border-radius", "999px");
  });

  test("a target instance is position: absolute (contained); the window instance stays fixed", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#scroll-top-window")).toHaveCSS("position", "fixed");
    await expect(page.locator("#scroll-top-container-btn")).toHaveAttribute("contained", "");
    await expect(page.locator("#scroll-top-container-btn")).toHaveCSS("position", "absolute");
  });
});
