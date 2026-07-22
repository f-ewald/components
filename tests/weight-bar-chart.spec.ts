import { test, expect } from "@playwright/test";
import { parseGradientLuminances } from "./utils/gradient";

test.describe("weight-bar-chart", () => {
  test("sorts rows descending by weight", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#weight-bar-demo");

    await page.evaluate(() => {
      const el = document.getElementById("weight-bar-demo") as HTMLElement & {
        items: { id: string; label: string; value: number }[];
      };
      el.items = [
        { id: "a", label: "Price", value: 0.2 },
        { id: "b", label: "Schools", value: 0.5 },
        { id: "c", label: "Commute", value: 0.3 },
      ];
    });

    const labels = chart.locator(".label");
    await expect(labels).toHaveCount(3);
    await expect(labels.nth(0)).toHaveText("Schools");
    await expect(labels.nth(1)).toHaveText("Commute");
    await expect(labels.nth(2)).toHaveText("Price");
  });

  test("keeps its summary legible and removes width transitions for reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const chart = page.locator("#weight-bar-demo");
    await chart.evaluate((element) => {
      const component = element as HTMLElement & {
        items: { id: string; label: string; value: number }[];
      };
      component.items = [
        { id: "price", label: "Price", value: 0.6 },
        { id: "schools", label: "Schools", value: 0.4 },
      ];
      element.style.setProperty("--ui-text", "#f1f5f9");
      element.style.setProperty("--ui-text-muted", "#94a3b8");
    });

    await expect(chart.locator('[role="img"]')).toHaveAccessibleName("Weights: Price 60%, Schools 40%");
    await expect(chart.locator(".bar").first()).toHaveCSS("transition-duration", "0s");
    await expect(chart.locator(".label").first()).toHaveCSS("color", "rgb(241, 245, 249)");
  });

  test("bars fade top-to-bottom using the same primary-token gradient fallback as map-circle", async ({
    page,
  }) => {
    await page.goto("/");
    const chart = page.locator("#weight-bar-demo");
    await chart.evaluate((element) => {
      const component = element as HTMLElement & {
        items: { id: string; label: string; value: number }[];
      };
      component.items = [{ id: "price", label: "Price", value: 1 }];
    });

    // Chromium omits the default to-bottom direction; exact stops plus
    // luminance distinguish this from the previous horizontal fade.
    const gradient = await chart.locator(".bar").first().evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(gradient).toBe("linear-gradient(color(srgb 0.516863 0.492157 0.928627) 0%, color(srgb 0.216863 0.192157 0.628627) 100%)");
    expect(gradient).not.toMatch(/^linear-gradient\(\s*\d+deg/);

    const [topLuminance, bottomLuminance] = parseGradientLuminances(gradient);
    expect(topLuminance).toBeGreaterThan(bottomLuminance);
  });

  test("bar gradient follows a consumer-overridden --ui-primary token, still lighter on top", async ({
    page,
  }) => {
    await page.goto("/");
    const chart = page.locator("#weight-bar-demo");
    await chart.evaluate((element) => {
      const component = element as HTMLElement & {
        items: { id: string; label: string; value: number }[];
      };
      component.items = [{ id: "price", label: "Price", value: 1 }];
      element.style.setProperty("--ui-primary", "#ff0000");
    });

    const gradient = await chart.locator(".bar").first().evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(gradient).toBe("linear-gradient(color(srgb 1 0.3 0.3) 0%, color(srgb 0.7 0 0) 100%)");
    expect(gradient).not.toMatch(/^linear-gradient\(\s*\d+deg/);

    const [topLuminance, bottomLuminance] = parseGradientLuminances(gradient);
    expect(topLuminance).toBeGreaterThan(bottomLuminance);
  });
});
