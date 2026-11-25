import { test, expect, type Page } from "@playwright/test";

const fixture = [
  {
    id: "a",
    label: "Alpha",
    actual: [
      { date: "2024-01-01", value: 100 },
      { date: "2024-07-01", value: 200 },
      { date: "2025-01-01", value: 300 },
    ],
    projection: [
      { date: "2026-01-01", values: [250, 400, 600], goalProbability: 0.4 },
      { date: "2027-01-01", values: [300, 600, 1200], goalProbability: 0.7 },
    ],
    samples: [[350, 900]],
  },
  {
    id: "b",
    label: "Beta",
    actual: [
      { date: "2024-01-01", value: 0 },
      { date: "2025-01-01", value: 50 },
    ],
  },
];

/** Mounts a 600px-wide fan-chart with the fixture data and 10/50/90 percentiles. */
async function mount(page: Page, props: Record<string, unknown> = {}) {
  await page.goto("/");
  await page.evaluate(
    ({ series, props }) => {
      const chart = document.createElement("fan-chart");
      chart.id = "fan-fixture";
      chart.style.cssText = "display:block;width:600px";
      chart.percentiles = [10, 50, 90];
      chart.series = series;
      Object.assign(chart, props);
      document.body.prepend(chart);
    },
    { series: fixture, props },
  );
  const chart = page.locator("#fan-fixture");
  await expect(chart.locator("svg")).toBeVisible();
  return chart;
}

test.describe("fan-chart", () => {
  test("playground renders lines, fans, goal, events, and sample runs", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("fan-chart-demo");
    await expect(chart.locator(".legend-item")).toHaveCount(4);
    await expect(chart.locator("path.actual")).toHaveCount(4);
    await expect(chart.locator("path.median")).toHaveCount(4);
    await expect(chart.locator("path.band")).toHaveCount(8);
    await expect(chart.locator("path.sample-path")).toHaveCount(5);
    await expect(chart.locator(".today-line")).toHaveCount(1);
    await expect(chart.locator(".event-label")).toHaveText(["House", "College", "Retirement"]);
    await expect(chart.locator(".goal-label")).toHaveText("Goal $1M");
    await expect(chart.locator("svg")).toHaveAccessibleName(/^Fan chart, 4 series\. Total: \$/);

    const before = await chart.locator("path.median").first().getAttribute("d");
    await page.getByTestId("fan-chart-contribution").fill("5000");
    await expect(chart.locator("path.median").first()).not.toHaveAttribute("d", before!);
  });

  test("legend click shows only one series, again shows all, and Ctrl/Cmd-click toggles", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("fan-chart-demo");
    const items = chart.locator(".legend-item");
    const status = page.getByTestId("fan-chart-visible");

    await items.nth(1).click();
    await expect(status).toHaveText("Visible: brokerage");
    await expect(items.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(items.nth(0)).toHaveAttribute("aria-pressed", "false");
    await expect(chart.locator("path.actual")).toHaveCount(1);

    await items.nth(1).click();
    await expect(status).toHaveText("Visible: all");
    await expect(chart.locator("path.actual")).toHaveCount(4);

    await items.nth(2).click({ modifiers: ["ControlOrMeta"] });
    await expect(status).toHaveText("Visible: total, brokerage, cash");
    await expect(chart.locator("path.actual")).toHaveCount(3);
    await items.nth(2).click({ modifiers: ["ControlOrMeta"] });
    await expect(status).toHaveText("Visible: all");
  });

  test("log scale is opt-in, thins ticks to decades, and clamps non-positive values", async ({ page }) => {
    const chart = await mount(page);
    await expect(chart).not.toHaveAttribute("log");
    await expect(chart.locator(".y-tick").first()).toHaveText("$0");

    await chart.evaluate((element) => ((element as HTMLElement & { log: boolean }).log = true));
    await expect(chart).toHaveAttribute("log", "");
    const ticks = await chart.locator(".y-tick").allTextContents();
    expect(ticks).toEqual(["$10", "$100", "$1K", "$10K"]);
    for (const d of await chart.locator("path.actual").evaluateAll((paths) => paths.map((p) => p.getAttribute("d")))) {
      expect(d).not.toMatch(/NaN|Infinity/);
    }
  });

  test("keyboard steps a tooltip through dates and announces values", async ({ page }) => {
    const chart = await mount(page);
    const plot = chart.locator(".plot");
    await plot.focus();
    await page.keyboard.press("ArrowRight");
    const tooltip = chart.locator(".tooltip");
    await expect(tooltip.locator(".tooltip-date")).toHaveText("Jan 2025");
    await expect(chart.locator("[role=status]")).toHaveText("Jan 2025: Alpha $300; Beta $50");

    await page.keyboard.press("End");
    await expect(tooltip.locator(".tooltip-date")).toHaveText("Jan 2027");
    await expect(tooltip.locator(".range-value")).toHaveText(["$300", "$1.2K"]);
    await expect(tooltip.locator(".range-median")).toHaveAttribute("style", /left: 33\.3+\d*%/);
    await expect(tooltip.locator(".tooltip-caption")).toHaveText("Range: P10–P90");
    await expect(tooltip.locator(".tooltip-goal")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
  });

  test("loader replaces series, ignores superseded loads, and keeps data on error", async ({ page }) => {
    const chart = await mount(page);
    const result = await chart.evaluate(async (element) => {
      const chart = element as HTMLElement & {
        loader: ((signal: AbortSignal) => Promise<unknown[]>) | null;
        series: { id: string }[];
        refresh(): Promise<void>;
      };
      const resolvers: Array<(value: unknown[]) => void> = [];
      const signals: AbortSignal[] = [];
      const events: string[] = [];
      chart.addEventListener("fan-chart-load", () => events.push("load"));
      chart.addEventListener("fan-chart-error", () => events.push("error"));
      chart.loader = (signal) => {
        signals.push(signal);
        return new Promise((resolve) => resolvers.push(resolve));
      };
      await chart.updateComplete;
      const second = chart.refresh();
      resolvers[1]([{ id: "new", label: "New", actual: [{ date: "2024-01-01", value: 1 }, { date: "2024-02-01", value: 2 }] }]);
      await second;
      resolvers[0]([{ id: "stale", label: "Stale" }]);
      await new Promise((r) => setTimeout(r, 0));
      const afterLoad = chart.series.map((s) => s.id);

      chart.loader = () => Promise.reject(new Error("offline"));
      await new Promise((r) => setTimeout(r, 0));
      await chart.updateComplete;
      return { afterLoad, firstAborted: signals[0].aborted, events, afterError: chart.series.map((s) => s.id) };
    });
    expect(result).toEqual({ afterLoad: ["new"], firstAborted: true, events: ["load", "error"], afterError: ["new"] });
    await expect(chart.locator("path.actual")).toHaveCount(1);
  });

  test("series colors follow theme tokens", async ({ page }) => {
    const chart = await mount(page);
    await chart.evaluate((element) => {
      element.style.setProperty("--ui-primary", "#00ff00");
      element.style.setProperty("--ui-warning", "#ff0000");
    });
    await expect(chart.locator("path.actual").nth(0)).toHaveCSS("stroke", "rgb(0, 255, 0)");
    await expect(chart.locator("path.actual").nth(1)).toHaveCSS("stroke", "rgb(255, 0, 0)");
  });

  test("draws goal, events, samples, and legend values, and reads them in the tooltip", async ({ page }) => {
    const chart = await mount(page, {
      goal: { value: 500, label: "Target" },
      events: [{ date: "2026-01-01", label: "Move" }],
    });
    await expect(chart.locator(".goal-label")).toHaveText("Target $500");
    await expect(chart.locator(".event-label")).toHaveText("Move");
    await expect(chart.locator("path.sample-path")).toHaveCount(1);
    await expect(chart.locator(".legend-value")).toHaveText(["$600 · 2027", "$50 · 2025"]);
    await expect(chart.locator("svg")).toHaveAccessibleName(/Target \$500\. Events: Move \(Jan 2026\)\.$/);

    await chart.locator(".plot").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const tooltip = chart.locator(".tooltip");
    await expect(tooltip.locator(".tooltip-date")).toHaveText("Jan 2026 · Move");
    await expect(tooltip.locator(".tooltip-goal")).toHaveText("40% ≥ Target $500");
    await expect(chart.locator("[role=status]")).toHaveText(
      "Jan 2026 (Move): Alpha $400, $250 to $600, 40% at or above Target $500",
    );
  });

  test("formats values and dates for the locale and currency", async ({ page }) => {
    const chart = await mount(page, { locale: "de-DE", currency: "EUR" });
    await expect(chart.locator(".legend-value")).toHaveText(["600 € · 2027", "50 € · 2025"]);
    await chart.locator(".plot").focus();
    await page.keyboard.press("End");
    await expect(chart.locator(".tooltip-date")).toHaveText("Jan. 2027");
    await expect(chart.locator(".range-value")).toHaveText(["300 €", "1200 €"]);
  });

  test("playground numeric demo plots against age and switches axis type and direction", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("fan-chart-numeric-demo");
    await expect(chart.locator(".x-title")).toHaveText("Age");
    await expect(chart.locator(".x-tick").first()).toHaveText("30");
    await page.getByTestId("fan-chart-x-type").selectOption("log");
    await page.getByTestId("fan-chart-x-reverse").check();
    await expect(chart).toHaveAttribute("x-reverse", "");
    await expect(chart.locator(".x-tick").first()).toHaveText("65");
  });

  test("plots a numeric log x axis with a title, custom format, nearest-point events, and reverse", async ({ page }) => {
    const series = [
      {
        id: "n",
        label: "Numeric",
        actual: [{ date: 0, value: 50 }, { date: 1, value: 100 }, { date: 2, value: 200 }],
        projection: [{ date: "4", values: [150, 300, 900] }, { date: 8, values: [200, 600, 4000] }],
      },
    ];
    const chart = await mount(page, { series, xType: "log", xLabel: "Years", events: [{ date: 3.6, label: "Bonus" }] });
    await chart.evaluate((element: HTMLElementTagNameMap["fan-chart"]) => (element.xFormat = (x) => `${x} y`));
    await expect(chart.locator(".x-title")).toHaveText("Years");
    for (const tick of await chart.locator(".x-tick").allTextContents()) expect(tick).toMatch(/ y$/);

    const plot = chart.locator(".plot");
    await plot.focus();
    await page.keyboard.press("Home");
    // x = 0 is dropped on a log axis, so the first point is 1.
    await expect(chart.locator(".tooltip-date")).toHaveText("1 y");
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowLeft");
    await expect(chart.locator(".tooltip-date")).toHaveText("4 y · Bonus");

    await chart.evaluate((element: HTMLElementTagNameMap["fan-chart"]) => (element.xReverse = true));
    await page.keyboard.press("Home");
    await expect(chart.locator(".tooltip-date")).toHaveText("8 y");
    const leftX = Number(await chart.locator(".crosshair").getAttribute("x1"));
    await page.keyboard.press("ArrowRight");
    await expect(chart.locator(".tooltip-date")).toHaveText("4 y · Bonus");
    expect(Number(await chart.locator(".crosshair").getAttribute("x1"))).toBeGreaterThan(leftX);
  });

  test("fits the y axis to a fixed x-domain and shows day precision for daily data", async ({ page }) => {
    const chart = await mount(page, { xDomain: ["2024-01-01", "2025-01-01"] });
    await expect(chart.locator(".y-tick").last()).toHaveText("$600");
    await chart.locator(".plot").focus();
    await page.keyboard.press("End");
    await expect(chart.locator(".tooltip-date")).toHaveText("Jan 2025");

    await chart.evaluate((element: HTMLElementTagNameMap["fan-chart"]) => {
      element.xDomain = null;
      element.series = [
        { id: "d", label: "Daily", actual: ["2024-03-01", "2024-03-02", "2024-03-03"].map((date, i) => ({ date, value: i })) },
      ];
    });
    await page.keyboard.press("End");
    await expect(chart.locator(".tooltip-date")).toHaveText("Mar 3, 2024");
  });

  test.describe("on touch screens", () => {
    test.use({ hasTouch: true });

    test("a tap pins the tooltip until a tap outside, and a long press toggles a series", async ({ page }) => {
      const chart = await mount(page);
      const plot = chart.locator(".plot");
      const box = (await plot.boundingBox())!;
      await page.touchscreen.tap(box.x + box.width * 0.6, box.y + box.height / 2);
      await expect(chart.locator(".tooltip")).toBeVisible();
      await page.waitForTimeout(100);
      await expect(chart.locator(".tooltip")).toBeVisible();
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height + 120);
      await expect(chart.locator(".tooltip")).toHaveCount(0);

      const beta = chart.locator(".legend-item").nth(1);
      await beta.dispatchEvent("pointerdown", { pointerType: "touch" });
      await page.waitForTimeout(600);
      await beta.dispatchEvent("pointerup", { pointerType: "touch" });
      await beta.dispatchEvent("click");
      await expect(beta).toHaveAttribute("aria-pressed", "false");
      await expect(chart.locator(".legend-item").nth(0)).toHaveAttribute("aria-pressed", "true");
    });
  });

  test("summarizePaths computes per-date percentiles and goal shares, and rejects ragged paths", async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(async () => {
      const { summarizePaths } = await import("/src/utils/percentiles.ts");
      const paths = [
        [1, 10],
        [2, 20],
        [3, 30],
        [4, 40],
        [5, 50],
      ];
      let error = "";
      try {
        summarizePaths(["2030-01-01"], paths);
      } catch (e) {
        error = (e as Error).name;
      }
      return { points: summarizePaths(["2030-01-01", "2031-01-01"], paths, [0, 50, 100], { goal: 30 }), error };
    });
    expect(result).toEqual({
      points: [
        { date: "2030-01-01", values: [1, 3, 5], goalProbability: 0 },
        { date: "2031-01-01", values: [10, 30, 50], goalProbability: 0.6 },
      ],
      error: "RangeError",
    });
  });

  test("samplePaths picks runs by final rank and sumPaths adds runs", async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(async () => {
      const { samplePaths, sumPaths } = await import("/src/utils/percentiles.ts");
      const runs = [[0, 5], [0, 1], [0, 4], [0, 2], [0, 3]];
      let error = "";
      try {
        sumPaths(runs, runs.slice(1));
      } catch (e) {
        error = (e as Error).name;
      }
      return {
        picked: samplePaths(runs, 2).map((run) => run[1]),
        summed: sumPaths([[1, 2]], [[10, 20]], [[100, 200]]),
        error,
      };
    });
    expect(result).toEqual({ picked: [2, 4], summed: [[111, 222]], error: "RangeError" });
  });
});
