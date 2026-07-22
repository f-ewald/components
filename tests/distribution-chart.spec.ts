import { test, expect } from "@playwright/test";

test.describe("distribution-chart", () => {
  test("renders an svg with a curve path given sample data", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#distribution-demo");
    const svg = chart.locator("svg");
    await expect(svg).toBeVisible({ timeout: 5000 });
    await expect(svg.locator("path.curve")).toHaveCount(1);
  });

  test("exposes a data summary and tokenizes dark chart chrome", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#distribution-demo");
    const svg = chart.locator("svg");
    await expect(svg).toHaveAccessibleName(
      "Square footage: 600 to 2,160 sqft, mean 1,400 sqft. Markers: value 1,450 sqft.",
    );

    await chart.evaluate((element) => {
      element.style.setProperty("--ui-primary", "#6366f1");
      element.style.setProperty("--ui-text-muted", "#94a3b8");
    });
    await expect(svg.locator(".curve")).toHaveCSS("stroke", "rgb(99, 102, 241)");
    await expect(svg.locator(".chart-label").first()).toHaveCSS("fill", "rgb(148, 163, 184)");
  });

  test("stops skeleton shimmer for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const skeleton = page.locator("#distribution-demo .skeleton");
    await page.locator("#distribution-demo").evaluate((element) => {
      const node = document.createElement("div");
      node.className = "skeleton";
      element.shadowRoot!.append(node);
    });
    await expect(skeleton).toHaveCSS("animation-name", "none");
  });
});
