import { test, expect, type Page } from "@playwright/test";

const fixture = [
  { id: "p1", x: 10, y: 12, group: "+25 ms", label: "GET /feed", linked: true, detail: "What-if run" },
  { id: "p2", x: 40, y: 38, group: "+50 ms", label: "GET /feed", linked: true },
  { id: "p3", x: 75, y: 82, group: "+50 ms", label: "GET /profile" },
];

async function mount(page: Page, props: Record<string, unknown> = {}) {
  await page.goto("/");
  await page.evaluate(
    ({ points, props }) => {
      const chart = document.createElement("scatter-chart");
      chart.id = "scatter-fixture";
      chart.style.cssText = "display:block;width:600px";
      chart.points = points;
      Object.assign(chart, props);
      document.body.prepend(chart);
    },
    { points: fixture, props },
  );
  const chart = page.locator("#scatter-fixture");
  await expect(chart.locator("svg")).toBeVisible();
  return chart;
}

test.describe("scatter-chart", () => {
  test("playground renders grouped points, diagonal reference, and updates keyed dots with the slider", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("scatter-demo");
    await expect(chart.locator(".dot-group")).toHaveCount(9);
    await expect(chart.locator(".dot.linked")).toHaveCount(6);
    await expect(chart.locator(".ref-diagonal")).toHaveCount(1);
    await expect(chart.locator(".legend-item")).toHaveCount(3);

    const before = await chart.locator('.dot-group[data-id="feed-100"]').getAttribute("style");
    await page.getByTestId("scatter-share").fill("3");
    await expect(page.getByTestId("scatter-share-label")).toHaveText("5%");
    const after = await chart.locator('.dot-group[data-id="feed-100"]').getAttribute("style");
    expect(after).not.toBe(before);
  });

  test("legend filters groups, and keyboard inspects and selects points", async ({ page }) => {
    const chart = await mount(page, {
      equalAxes: true,
      xLabel: "True (ms)",
      yLabel: "Predicted (ms)",
      references: [{ axis: "diagonal", label: "Ideal" }],
    });
    const legend = chart.locator(".legend-item");
    await expect(legend).toHaveCount(2);

    await legend.nth(0).click();
    await expect(chart.locator(".dot-group")).toHaveCount(1);
    await legend.nth(0).click();
    await expect(chart.locator(".dot-group")).toHaveCount(3);

    await chart.evaluate((el) => {
      (window as unknown as { picked?: unknown }).picked = null;
      el.addEventListener("scatter-point-select", (e) => {
        (window as unknown as { picked?: unknown }).picked = (e as CustomEvent).detail;
      });
    });

    await chart.locator(".plot").focus();
    await page.keyboard.press("ArrowRight");
    await expect(chart.locator(".tooltip")).toBeVisible();
    await expect(chart.locator(".tooltip-title")).toHaveText("GET /feed");
    await expect(chart.locator(".tooltip-detail")).toHaveText("What-if run");
    await expect(chart.locator("[role=status]")).toContainText("GET /feed");

    await page.keyboard.press("Enter");
    const picked = await page.evaluate(() => (window as unknown as { picked: { index: number; point: { id: string } } }).picked);
    expect(picked.point.id).toBe("p1");
    expect(picked.index).toBe(0);

    await page.keyboard.press("Escape");
    await expect(chart.locator(".tooltip")).toHaveCount(0);
  });

  test("shows empty message when no points are valid", async ({ page }) => {
    const chart = await mount(page);
    await chart.evaluate((el: HTMLElementTagNameMap["scatter-chart"]) => {
      el.points = [];
    });
    await expect(chart.locator(".message")).toHaveText("No data");
  });

  test("interactive=false disables point/legend clicking and tooltip=false disables hover tooltips", async ({ page }) => {
    const chart = await mount(page);
    await chart.evaluate((el) => {
      el.setAttribute("interactive", "false");
      el.setAttribute("tooltip", "false");
      (window as unknown as { scatterFired: number }).scatterFired = 0;
      el.addEventListener("scatter-point-select", () => ((window as unknown as { scatterFired: number }).scatterFired += 1));
      el.addEventListener("series-visibility-change", () => ((window as unknown as { scatterFired: number }).scatterFired += 1));
    });
    await expect(chart.locator("button.legend-item")).toHaveCount(0);
    await expect(chart.locator("span.legend-item.static")).toHaveCount(2);
    await expect(chart.locator(".plot")).toHaveAttribute("tabindex", "-1");

    const dot = (await chart.locator(".dot").first().boundingBox())!;
    await page.mouse.move(dot.x + dot.width / 2, dot.y + dot.height / 2);
    await page.mouse.click(dot.x + dot.width / 2, dot.y + dot.height / 2);
    await expect(chart.locator(".tooltip")).toHaveCount(0);
    await expect(chart.locator(".hover-ring")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { scatterFired: number }).scatterFired)).toBe(0);
  });
});
