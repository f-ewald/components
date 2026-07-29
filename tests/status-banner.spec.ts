import { test, expect } from "@playwright/test";

test.describe("status-banner", () => {
  test("renders the message, applies the variant color, and shows a leading icon", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("#banner-warning")).toContainText("Reconnecting…");

    const dangerBar = page.locator("#banner-danger .bar");
    await expect(dangerBar).toHaveClass(/danger/);
    await expect(dangerBar).toHaveCSS("color", "rgb(220, 38, 38)");
    // Tokenized small type, and a bar at least 3x the font size so a passive
    // page-level notice still reads as prominent.
    await expect(dangerBar).toHaveCSS("font-size", "12px");
    const { height, fontSize } = await dangerBar.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        height: el.getBoundingClientRect().height,
        fontSize: Number.parseFloat(style.fontSize),
      };
    });
    expect(height).toBeGreaterThanOrEqual(fontSize * 3);

    // The `icon` property is a consumer-supplied 14px inline template.
    await expect(page.locator("#banner-warning .icon svg")).toHaveAttribute("width", "14");
    await expect(page.locator("#banner-success .icon")).toHaveCount(0);
  });

  test("announces politely, escalates to alert for danger, and renders the actions slot", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("#banner-info .bar")).toHaveAttribute("role", "status");
    await expect(page.locator("#banner-danger .bar")).toHaveAttribute("role", "alert");

    // Slotted trailing controls stay usable.
    const reload = page.locator("#banner-reload");
    await expect(reload).toBeVisible();
    await reload.click();
    await expect(page.locator("#banner-info")).toContainText("Reloaded.");
  });

  test("honors dark-mode token overrides", async ({ page }) => {
    await page.goto("/");
    const info = page.locator("#banner-info");
    await info.evaluate((element) => element.style.setProperty("--ui-info", "#38bdf8"));
    await expect(info.locator(".bar")).toHaveCSS("color", "rgb(56, 189, 248)");
  });
});
