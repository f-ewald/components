import { test, expect } from "@playwright/test";

test.describe("progress-bar", () => {
  test("renders the fill width, label, and progressbar a11y attributes", async ({ page }) => {
    await page.goto("/");

    const bar = page.locator("#progress-demo");
    await expect(bar.locator(".label")).toHaveText("Question 3 out of 14");
    await expect(bar.locator(".fill")).toHaveAttribute("style", /width:\s*21\.42857/);
    const track = bar.locator(".track");
    await expect(track).toHaveAttribute("role", "progressbar");
    await expect(track).toHaveAttribute("aria-valuenow", "3");
    await expect(track).toHaveAttribute("aria-valuemin", "0");
    await expect(track).toHaveAttribute("aria-valuemax", "14");
    await expect(track).toHaveAttribute("aria-label", "Question 3 out of 14");
  });

  test("advance button increments the value and updates the label, wrapping at max", async ({ page }) => {
    await page.goto("/");

    const bar = page.locator("#progress-demo");
    const advance = page.locator("#progress-advance");
    await advance.click();
    await expect(bar.locator(".label")).toHaveText("Question 4 out of 14");
    await expect(bar.locator(".track")).toHaveAttribute("aria-valuenow", "4");
  });

  test("a custom color and track-color override the default fill/track", async ({ page }) => {
    await page.goto("/");

    const bar = page.locator("#progress-custom");
    await expect(bar).toHaveAttribute("color", "#dc2626");
    await expect(bar).toHaveAttribute("track-color", "#fecaca");
    await expect(bar.locator(".fill")).toHaveAttribute("style", /--fill-color:\s*#dc2626/);
    await expect(bar.locator(".track")).toHaveAttribute("style", /--track-color:\s*#fecaca/);
    await expect(bar.locator(".track")).toHaveCSS("background-color", "rgb(254, 202, 202)");
  });

  test("clamps out-of-range values to a 0-100% width", async ({ page }) => {
    await page.goto("/");

    const bar = page.locator("#progress-demo");
    await bar.evaluate((element) => ((element as HTMLElement & { value: number }).value = 999));
    await expect(bar.locator(".fill")).toHaveAttribute("style", /width:\s*100%/);
    await expect(bar.locator(".track")).toHaveAttribute("aria-valuenow", "14");

    await bar.evaluate((element) => ((element as HTMLElement & { value: number }).value = -5));
    await expect(bar.locator(".fill")).toHaveAttribute("style", /width:\s*0%/);
    await expect(bar.locator(".track")).toHaveAttribute("aria-valuenow", "0");
  });

  test("disables the fill transition under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const bar = page.locator("#progress-demo");
    await expect(bar.locator(".fill")).toHaveCSS("transition-duration", "0s");
  });

  test("omits the label element and aria-label when no label is set", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator("#progress-custom");
    await expect(bar.locator(".label")).toHaveCount(0);
    await expect(bar.locator(".track")).not.toHaveAttribute("aria-label", /.+/);
  });
});
