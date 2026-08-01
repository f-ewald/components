import { test, expect } from "@playwright/test";

test.describe("percent-bar-chart", () => {
  test("renders an svg with a rect per group and shows the labels", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    const svg = chart.locator("svg");
    await expect(svg).toBeVisible();
    await expect(svg.locator("rect")).toHaveCount(4);
    await expect(svg).toContainText("White");
    await expect(svg).toContainText("Asian");
    // Bars use the shared control radius (--ui-radius-sm), not a pill end.
    await expect(svg.locator("rect").first()).toHaveAttribute("rx", "4");
  });

  test("exposes row values while preserving data colors and dark label tokens", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    const svg = chart.locator("svg");
    await expect(svg).toHaveAccessibleName(
      "Percentages: White 45.2%, Asian 28.1%, Hispanic 18.4%, Other 8.3%",
    );
    await expect(svg.locator("rect").first()).toHaveAttribute("fill", /^url\(#percent-bar-grad-/);

    await chart.evaluate((element) => element.style.setProperty("--ui-text-muted", "#94a3b8"));
    await expect(svg.locator(".chart-label").first()).toHaveCSS("fill", "rgb(148, 163, 184)");
  });

  test("renders a top-to-bottom gradient with 70% base / 30% white-black stops derived from each row's data color", async ({
    page,
  }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    const svg = chart.locator("svg");

    // First row's data color is #4f46e5 (see demo/main.ts).
    const firstGrad = svg.locator("linearGradient").first();
    await expect(firstGrad).toHaveAttribute("x1", "0");
    await expect(firstGrad).toHaveAttribute("y1", "0");
    await expect(firstGrad).toHaveAttribute("x2", "0");
    await expect(firstGrad).toHaveAttribute("y2", "1");
    const firstStops = firstGrad.locator("stop");
    await expect(firstStops).toHaveCount(2);
    await expect(firstStops.first()).toHaveAttribute("offset", "0%");
    await expect(firstStops.first()).toHaveCSS(
      "stop-color",
      "color(srgb 0.516863 0.492157 0.928627)",
    );
    await expect(firstStops.last()).toHaveAttribute("offset", "100%");
    await expect(firstStops.last()).toHaveCSS(
      "stop-color",
      "color(srgb 0.216863 0.192157 0.628627)",
    );

    // Distinct data colors across rows produce distinct gradients, each wired
    // to its own rect via a unique url(#...) fill.
    const grads = svg.locator("linearGradient");
    await expect(grads).toHaveCount(4);
    const rects = svg.locator("rect");
    for (let i = 0; i < 4; i++) {
      const gradId = await grads.nth(i).getAttribute("id");
      await expect(rects.nth(i)).toHaveAttribute("fill", `url(#${gradId})`);
    }
    const secondStops = grads.nth(1).locator("stop");
    await expect(secondStops.first()).not.toHaveCSS(
      "stop-color",
      await firstStops.first().evaluate((stop) => getComputedStyle(stop).stopColor),
    );
  });

  test("applies gradients to hex, rgb, named, hsl, and CSS-variable data colors", async ({
    page,
  }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    await chart.evaluate((element) => {
      element.style.setProperty("--ui-primary", "#0d9488");
      (element as HTMLElement & { groups: unknown }).groups = [
        { key: "hex", label: "Hex", value: 30, color: "#4f46e5" },
        { key: "rgb", label: "Rgb", value: 25, color: "rgb(13, 148, 136)" },
        { key: "named", label: "Named", value: 20, color: "tomato" },
        { key: "hsl", label: "Hsl", value: 15, color: "hsl(42 100% 50%)" },
        { key: "var", label: "Var", value: 10, color: "var(--ui-primary, #4f46e5)" },
      ];
    });
    const svg = chart.locator("svg");
    const rects = svg.locator("rect");
    const gradients = svg.locator("linearGradient");
    await expect(rects).toHaveCount(5);
    await expect(gradients).toHaveCount(5);

    for (let i = 0; i < 5; i++) {
      const gradient = gradients.nth(i);
      const gradientId = await gradient.getAttribute("id");
      await expect(rects.nth(i)).toHaveAttribute("fill", `url(#${gradientId})`);
      const stops = gradient.locator("stop");
      await expect(stops.first()).toHaveCSS("stop-color", /^(?:color|rgb)\(/);
      await expect(stops.last()).toHaveCSS("stop-color", /^(?:color|rgb)\(/);
      expect(await stops.first().evaluate((stop) => getComputedStyle(stop).stopColor)).not.toBe(
        await stops.last().evaluate((stop) => getComputedStyle(stop).stopColor),
      );
    }
  });

  test("clamps zero-width bars and scales widths proportionally to value, independent of gradient stops", async ({
    page,
  }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    await chart.evaluate((element) => {
      (element as HTMLElement & { groups: unknown }).groups = [
        { key: "zero", label: "Zero", value: 0, color: "#4f46e5" },
        { key: "half", label: "Half", value: 50, color: "#0d9488" },
        { key: "full", label: "Full", value: 100, color: "#d97706" },
      ];
    });
    const svg = chart.locator("svg");
    const rects = svg.locator("rect");
    await expect(rects).toHaveCount(3);

    const zeroWidth = Number(await rects.nth(0).getAttribute("width"));
    const halfWidth = Number(await rects.nth(1).getAttribute("width"));
    const fullWidth = Number(await rects.nth(2).getAttribute("width"));
    expect(zeroWidth).toBe(0);
    expect(halfWidth).toBeGreaterThan(0);
    expect(fullWidth).toBeGreaterThan(halfWidth);
    // 50% should be roughly half of the 100% row's width.
    expect(halfWidth / fullWidth).toBeCloseTo(0.5, 1);
  });

  test("keeps gradient stops and geometry unchanged under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    const svg = chart.locator("svg");

    await expect(svg.locator("rect")).toHaveCount(4);
    await expect(svg.locator("linearGradient").first().locator("stop").first()).toHaveCSS(
      "stop-color",
      "color(srgb 0.516863 0.492157 0.928627)",
    );
    await expect(svg.locator("rect").first()).toHaveAttribute("fill", /^url\(#percent-bar-grad-/);
  });

  test("mode toggle switches between percent (%) and value labels/aria-label on the same data", async ({
    page,
  }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    const svg = chart.locator("svg");
    const toggle = page.locator("#percent-bar-mode-toggle");

    await expect(svg).toContainText("45.2%");
    await expect(svg).toHaveAccessibleName(/^Percentages: /);

    await toggle.click();
    await expect(chart).toHaveJSProperty("mode", "value");
    await expect(svg).toContainText("45.2");
    await expect(svg).not.toContainText("45.2%");
    await expect(svg).toHaveAccessibleName(/^Values: /);
  });

  test("orientation toggle switches between rects laid out as rows and as columns", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    const svg = chart.locator("svg");
    const toggle = page.locator("#percent-bar-orientation-toggle");

    const horizontalRect = svg.locator("rect").first();
    const horizontalWidth = Number(await horizontalRect.getAttribute("width"));
    const horizontalHeight = Number(await horizontalRect.getAttribute("height"));
    expect(horizontalHeight).toBe(10);
    expect(horizontalWidth).toBeGreaterThan(horizontalHeight);

    await toggle.click();
    await expect(chart).toHaveJSProperty("orientation", "vertical");
    const verticalRect = svg.locator("rect").first();
    const verticalWidth = Number(await verticalRect.getAttribute("width"));
    const verticalHeight = Number(await verticalRect.getAttribute("height"));
    // Columns are narrow and tall — the opposite aspect ratio from rows.
    expect(verticalWidth).toBeLessThan(verticalHeight);

    // Bars are horizontally spread across distinct column centers.
    const rects = svg.locator("rect");
    const xs = await rects.evaluateAll((els) => els.map((el) => Number(el.getAttribute("x"))));
    expect(new Set(xs).size).toBe(xs.length);
  });

  test("value mode auto-computes the domain max from the data and formats with valueFormat", async ({
    page,
  }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-value-demo");
    const svg = chart.locator("svg");

    await expect(svg).toHaveAccessibleName("Values: Q1 $42k, Q2 $59k, Q3 $40k, Q4 $71k");

    const rects = svg.locator("rect");
    const heights = await rects.evaluateAll((els) => els.map((el) => Number(el.getAttribute("height"))));
    // Q4 (71200, the largest value) should fill the full track height.
    const maxHeight = Math.max(...heights);
    expect(heights[3]).toBe(maxHeight);
    // Q3 (39750) is roughly proportional to Q4 (71200) since no explicit `max` is set.
    expect(heights[2] / heights[3]).toBeCloseTo(39750 / 71200, 1);
  });

  test("explicit max overrides the auto-computed domain in value mode", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-value-demo");
    await chart.evaluate((element) => {
      (element as HTMLElement & { max: number }).max = 200000;
    });
    const svg = chart.locator("svg");
    const rects = svg.locator("rect");
    const heights = await rects.evaluateAll((els) => els.map((el) => Number(el.getAttribute("height"))));
    // Against a 200000 domain max, even the largest value (71200) fills well under
    // the full 96px track (COL_TRACK_H) that an auto-computed domain would reach.
    expect(Math.max(...heights)).toBeLessThan(96 * 0.5);
  });
});
