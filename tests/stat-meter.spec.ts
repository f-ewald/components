import { test, expect } from "@playwright/test";
import { parseGradientLuminances } from "./utils/gradient";

test.describe("stat-meter", () => {
  test("renders label, fill width, and value for a percent reading", async ({ page }) => {
    await page.goto("/");

    const cpu = page.locator("#meter-cpu");
    await expect(cpu.locator(".label")).toHaveText("CPU");
    await expect(cpu.locator(".value")).toHaveText("42%");
    await expect(cpu.locator(".fill")).toHaveAttribute("style", /width:\s*42%/);
  });

  test("a null percent renders an empty bar and a dash instead of 0%", async ({ page }) => {
    await page.goto("/");

    const pending = page.locator("#meter-pending");
    await expect(pending.locator(".value")).toHaveText("—");
    await expect(pending.locator(".fill")).toHaveAttribute("style", /width:\s*0%/);
  });

  test("randomize button assigns a new percent reading to CPU/MEM", async ({ page }) => {
    await page.goto("/");

    await page.locator("#meter-randomize").click();
    await expect(page.locator("#meter-cpu .value")).toHaveText(/^\d{1,3}%$/);
    await expect(page.locator("#meter-mem .value")).toHaveText(/^\d{1,3}%$/);
  });

  test("a custom color overrides the default fill color", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#meter-color")).toHaveAttribute("color", "#dc2626");
    await expect(page.locator("#meter-color .fill")).toHaveAttribute("style", /--fill-color:\s*#dc2626/);
  });

  test("exposes the reading and disables fill transitions for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const meter = page.locator("#meter-cpu");
    await meter.evaluate((element) => {
      element.style.setProperty("--ui-text", "#f1f5f9");
      element.style.setProperty("--ui-surface-muted", "#1e293b");
    });

    await expect(meter.locator('[role="img"]')).toHaveAccessibleName("CPU 42%");
    await expect(meter.locator(".fill")).toHaveCSS("transition-duration", "0s");
    await expect(meter.locator(".value")).toHaveCSS("color", "rgb(241, 245, 249)");
    await expect(meter.locator(".track")).toHaveCSS("background-color", "rgb(30, 41, 59)");
  });

  test("fill fades top-to-bottom using the same success-token gradient recipe as map-circle/weight-bar-chart/user-avatar", async ({
    page,
  }) => {
    await page.goto("/");
    const fill = page.locator("#meter-cpu .fill");

    // Chromium omits the default to-bottom direction; exact stops plus
    // luminance distinguish this from a plain solid fill.
    const gradient = await fill.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(gradient).toBe(
      "linear-gradient(color(srgb 0.360392 0.747451 0.503137) 0%, color(srgb 0.0603922 0.447451 0.203137) 100%)",
    );
    expect(gradient).not.toMatch(/^linear-gradient\(\s*\d+deg/);

    const [topLuminance, bottomLuminance] = parseGradientLuminances(gradient);
    expect(topLuminance).toBeGreaterThan(bottomLuminance);
  });

  test("a custom color drives the gradient base while keeping the same 70/30 recipe", async ({ page }) => {
    await page.goto("/");
    const fill = page.locator("#meter-color .fill");

    const gradient = await fill.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(gradient).toBe(
      "linear-gradient(color(srgb 0.903922 0.404314 0.404314) 0%, color(srgb 0.603922 0.104314 0.104314) 100%)",
    );
    expect(gradient).not.toMatch(/^linear-gradient\(\s*\d+deg/);

    const [topLuminance, bottomLuminance] = parseGradientLuminances(gradient);
    expect(topLuminance).toBeGreaterThan(bottomLuminance);
  });

  test("clamps out-of-range percents to a 0-100% width without disturbing the gradient", async ({ page }) => {
    await page.goto("/");
    const meter = page.locator("#meter-cpu");
    const fill = meter.locator(".fill");
    const baselineGradient = await fill.evaluate((el) => getComputedStyle(el).backgroundImage);

    await meter.evaluate((element) => ((element as HTMLElement & { percent: number }).percent = 150));
    await expect(fill).toHaveAttribute("style", /width:\s*100%/);
    await expect(fill.evaluate((el) => getComputedStyle(el).backgroundImage)).resolves.toBe(baselineGradient);

    await meter.evaluate((element) => ((element as HTMLElement & { percent: number }).percent = -30));
    await expect(fill).toHaveAttribute("style", /width:\s*0%/);
    await expect(fill.evaluate((el) => getComputedStyle(el).backgroundImage)).resolves.toBe(baselineGradient);
  });

  test("a null (unset) reading still renders the gradient fill without tinting the track or value text", async ({
    page,
  }) => {
    await page.goto("/");
    const pending = page.locator("#meter-pending");

    const gradient = await pending.locator(".fill").evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(gradient).toMatch(/^linear-gradient\(/);
    await expect(pending.locator(".track")).toHaveCSS("background-color", "rgb(248, 250, 252)");
    await expect(pending.locator(".value")).toHaveCSS("color", "rgb(15, 23, 42)");
  });
});
