import { test, expect } from "@playwright/test";

test.describe("status-pill", () => {
  test("renders label text, applies the color variant, and shows the spinner when set", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#pill-neutral")).toContainText("Backlog");

    const dangerPill = page.locator("#pill-danger .pill");
    await expect(dangerPill).toHaveClass(/danger/);
    const dangerColor = await dangerPill.evaluate((el) => getComputedStyle(el).color);
    expect(dangerColor).toBe("rgb(220, 38, 38)");

    await expect(page.locator("#pill-primary .spin")).toBeVisible();
    await expect(page.locator("#pill-neutral .spin")).toHaveCount(0);
  });

  test("uses semantic dark tokens and makes reduced-motion spinners static", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const info = page.locator("#pill-info");
    const warning = page.locator("#pill-warning");
    await info.evaluate((element) => element.style.setProperty("--ui-info", "#38bdf8"));
    await warning.evaluate((element) => element.style.setProperty("--ui-warning", "#f59e0b"));

    await expect(info.locator(".pill")).toHaveCSS("color", "rgb(56, 189, 248)");
    await expect(warning.locator(".pill")).toHaveCSS("color", "rgb(245, 158, 11)");
    await expect(page.locator("#pill-primary .spin")).toHaveCSS("animation-name", "none");
    await expect(page.locator("#pill-primary .spin")).toHaveAttribute("aria-hidden", "true");
  });
});
