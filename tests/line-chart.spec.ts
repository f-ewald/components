import { test, expect, type Page } from "@playwright/test";

const fixture = [
  {
    id: "truth",
    label: "Truth",
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 30 },
      { x: 100, y: 80 },
    ],
  },
  {
    id: "pred",
    label: "Prediction",
    dashed: true,
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 35 },
      { x: 100, y: 75 },
    ],
    band: [
      { x: 0, low: 0, high: 0 },
      { x: 50, low: 25, high: 45 },
      { x: 100, low: 65, high: 85 },
    ],
  },
];

async function mount(page: Page, props: Record<string, unknown> = {}) {
  await page.goto("/");
  await page.evaluate(
    ({ series, props }) => {
      const chart = document.createElement("line-chart");
      chart.id = "line-fixture";
      chart.style.cssText = "display:block;width:600px";
      chart.series = series;
      Object.assign(chart, props);
      document.body.prepend(chart);
    },
    { series: fixture, props },
  );
  const chart = page.locator("#line-fixture");
  await expect(chart.locator("svg")).toBeVisible();
  return chart;
}

test.describe("line-chart", () => {
  test("playground renders series, band, references, and updates selected-x on point click", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("line-chart-demo");
    await expect(chart.locator("path.series-line")).toHaveCount(3);
    await expect(chart.locator("path.band")).toHaveCount(1);
    await expect(chart.locator(".ref-diagonal")).toHaveCount(1);
    await expect(chart.locator(".selected-line")).toHaveCount(1);
    await expect(chart.locator(".x-title")).toHaveText("Added delay (ms)");
    await expect(chart.locator(".y-title")).toHaveText("Change at p90 (ms)");

    await page.getByTestId("line-chart-band").uncheck();
    await expect(chart.locator("path.band")).toHaveCount(0);

    const box = (await chart.locator(".plot").boundingBox())!;
    await page.mouse.click(box.x + box.width - 24, box.y + box.height / 2);
    await expect(page.getByTestId("line-chart-selected")).toHaveText("Selected delay: 100 ms");
  });

  test("legend isolates and toggles series, and keyboard inspects and selects points", async ({ page }) => {
    const chart = await mount(page, {
      references: [
        { axis: "diagonal", label: "y = x" },
        { axis: "y", value: 50, label: "Budget" },
      ],
    });
    const legend = chart.locator(".legend-item");
    await expect(legend).toHaveCount(2);

    await legend.nth(0).click();
    await expect(chart.locator("path.series-line")).toHaveCount(1);
    await expect(legend.nth(1)).toHaveAttribute("aria-pressed", "false");
    await legend.nth(0).click();
    await expect(chart.locator("path.series-line")).toHaveCount(2);

    await chart.evaluate((el) => {
      (window as unknown as { picked?: unknown }).picked = null;
      el.addEventListener("line-point-select", (e) => {
        (window as unknown as { picked?: unknown }).picked = (e as CustomEvent).detail;
      });
    });

    await chart.locator(".plot").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(chart.locator(".tooltip")).toBeVisible();
    await expect(chart.locator(".tooltip-head")).toHaveText("50");
    await expect(chart.locator("[role=status]")).toContainText("Truth 30");
    await page.keyboard.press("Enter");

    const picked = await page.evaluate(() => (window as unknown as { picked: { x: number; points: unknown[] } }).picked);
    expect(picked.x).toBe(50);
    expect(picked.points).toHaveLength(2);

    await page.keyboard.press("Escape");
    await expect(chart.locator(".tooltip")).toHaveCount(0);
  });

  test("supports log and reversed x axes, time axes, and empty state", async ({ page }) => {
    const chart = await mount(page, {
      xType: "log",
      xReverse: true,
      series: [
        {
          id: "log",
          label: "Error",
          points: [
            { x: 0, y: 99 },
            { x: 1, y: 20 },
            { x: 10, y: 8 },
            { x: 100, y: 2 },
          ],
        },
      ],
    });
    await chart.locator(".plot").focus();
    await page.keyboard.press("Home");
    // Reversed log axis starts visually at 100 and drops x = 0.
    await expect(chart.locator(".tooltip-head")).toHaveText("100");
    await page.keyboard.press("End");
    await expect(chart.locator(".tooltip-head")).toHaveText("1");

    await chart.evaluate((el: HTMLElementTagNameMap["line-chart"]) => {
      el.series = [];
    });
    await expect(chart.locator(".message")).toHaveText("No data");
  });

  test("interactive=false disables clicking and legend buttons, and tooltip=false disables tooltips", async ({ page }) => {
    const chart = await mount(page);
    await chart.evaluate((el) => {
      el.setAttribute("interactive", "false");
      el.setAttribute("tooltip", "false");
      (window as unknown as { fired: number }).fired = 0;
      el.addEventListener("line-point-select", () => ((window as unknown as { fired: number }).fired += 1));
      el.addEventListener("series-visibility-change", () => ((window as unknown as { fired: number }).fired += 1));
    });
    await expect(chart.locator("button.legend-item")).toHaveCount(0);
    await expect(chart.locator("span.legend-item.static")).toHaveCount(2);
    await expect(chart.locator(".plot")).toHaveAttribute("tabindex", "-1");

    const box = (await chart.locator(".plot").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(chart.locator(".tooltip")).toHaveCount(0);
    await expect(chart.locator(".crosshair")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { fired: number }).fired)).toBe(0);
  });
});
