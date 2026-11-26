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
    await expect(svg.locator("line[stroke-dasharray]").first()).toHaveCSS("stroke", "rgb(99, 102, 241)");
  });

  test("renders SVG axis labels at the 10px data-label size", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#distribution-demo");
    const svg = chart.locator("svg");
    await expect(svg).toBeVisible({ timeout: 5000 });
    await expect(svg.locator(".chart-label").first()).toHaveAttribute("font-size", "10");
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

  test("shows the latest metric when an older response arrives last, and survives empty data", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const pending = new Map<string, (points: { x: number; y: number }[]) => void>();
      (window as unknown as Record<string, unknown>).__resolveMetric = (metric: string, empty: boolean) =>
        pending.get(metric)!(empty ? [] : [{ x: 0, y: 0 }, { x: 10, y: 1 }, { x: 20, y: 0 }]);
      window.fetch = (input: RequestInfo | URL) => {
        const metric = String(input).split("/").pop()!;
        return new Promise((resolve) => {
          pending.set(metric, (points) =>
            resolve(
              new Response(
                JSON.stringify({ points, unit: "u", label: `Metric ${metric}`, min: 0, max: 20, mean: 10 }),
              ),
            ),
          );
        });
      };
      const chart = document.createElement("distribution-chart");
      chart.id = "dist-race";
      chart.style.display = "block";
      chart.style.width = "400px";
      document.body.append(chart);
      chart.metric = "a";
      return chart.updateComplete.then(() => {
        chart.metric = "b";
      });
    });
    const resolveMetric = (metric: string, empty = false) =>
      page.evaluate(
        ([m, e]) => ((window as unknown as Record<string, (m: string, e: boolean) => void>).__resolveMetric(m, e)),
        [metric, empty] as const,
      );
    await resolveMetric("b");
    await resolveMetric("a");
    const chart = page.locator("#dist-race");
    await expect(chart.locator("svg")).toHaveAccessibleName(/^Metric b:/);

    await chart.evaluate((element) => {
      (element as HTMLElement & { metric: string }).metric = "empty";
    });
    await resolveMetric("empty", true);
    await expect(chart.locator(".empty")).toHaveText("No distribution data");
  });

  test("resumes measuring after the chart is removed and reattached", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#distribution-demo");
    await expect(chart.locator("svg")).toBeVisible();
    await chart.evaluate((element: HTMLElement) => {
      element.style.display = "block";
      element.style.width = "300px";
    });
    await expect(chart.locator("svg")).toHaveAttribute("width", "300");

    await chart.evaluate((element: HTMLElement) => {
      element.remove();
      element.style.width = "600px";
      document.body.append(element);
    });
    await expect(chart.locator("svg")).toHaveAttribute("width", "600");
  });
});
