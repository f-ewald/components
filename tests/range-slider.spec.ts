import { test, expect } from "@playwright/test";

test.describe("range-slider", () => {
  test("dragging via keyboard updates the value and fires input", async ({ page }) => {
    await page.goto("/");
    const slider = page.locator("#range-slider-demo");
    const input = slider.locator("input");

    await expect(input).toHaveJSProperty("value", "1000");
    await expect(page.locator("#range-slider-value")).toHaveText("1,000 ft");

    await input.focus();
    await input.press("ArrowRight");
    await expect(input).toHaveJSProperty("value", "1050");
    await expect(page.locator("#range-slider-value")).toHaveText("1,050 ft");
  });

  test("participates in form submission and reset", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#range-slider-form");
    const input = page.locator("#range-slider-form-input input");
    const log = page.locator("#range-slider-form-log");

    await form.locator('button[type="submit"]').click();
    await expect(log).toHaveText("submitted volume=5");

    await input.focus();
    await input.press("ArrowRight");
    await expect(input).toHaveJSProperty("value", "6");
    await form.evaluate((el: HTMLFormElement) => el.reset());
    await expect(input).toHaveJSProperty("value", "5");
  });

  test(":focus-visible ring appears via keyboard", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("#range-slider-demo input");
    await input.focus();
    await expect(input).toHaveCSS("cursor", "pointer");
  });
});
