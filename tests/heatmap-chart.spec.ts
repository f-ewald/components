import { test, expect, type Page } from "@playwright/test";

const fixtureColumns = ["100%", "50%", "10%"];
const fixtureRows = [
  {
    id: "feed",
    label: "GET /feed",
    meta: 4000,
    cells: [0.02, 0.08, { value: 0.2, marker: "*", note: "1 seed missing" }],
  },
  {
    id: "profile",
    label: "GET /profile",
    meta: 1200,
    cells: [0.04, 0.12, null],
  },
];

async function mount(page: Page, props: Record<string, unknown> = {}) {
  await page.goto("/");
  await page.evaluate(
    ({ columns, rows, props }) => {
      const map = document.createElement("heatmap-chart");
      map.id = "heatmap-fixture";
      map.columns = columns;
      map.rows = rows;
      map.domain = [0, 0.25];
      map.valueFormat = (v) => `${Math.round(v * 100)}%`;
      Object.assign(map, props);
      document.body.prepend(map);
    },
    { columns: fixtureColumns, rows: fixtureRows, props },
  );
  const map = page.locator("#heatmap-fixture");
  await expect(map.locator("table")).toBeVisible();
  return map;
}

test.describe("heatmap-chart", () => {
  test("playground renders matrix, legend, missing cells, and updates selection on click", async ({ page }) => {
    await page.goto("/");
    const map = page.getByTestId("heatmap-demo");
    await expect(map.locator("tbody tr")).toHaveCount(4);
    await expect(map.locator(".ramp-bar")).toBeVisible();
    await expect(map.locator(".legend-missing")).toContainText("No data");
    await expect(map.locator(".col-btn.selected")).toHaveText("100%");

    await map.locator(".col-btn", { hasText: "25%" }).click();
    await expect(page.getByTestId("heatmap-status")).toHaveText("Selected column: 25%");
    await expect(map.locator(".col-btn.selected")).toHaveText("25%");

    await page.getByTestId("heatmap-values").uncheck();
    await expect(map.locator(".cell-btn").first()).toHaveText("");
  });

  test("emits cell/column events, shows tooltips on focus, and supports arrow-key grid navigation", async ({ page }) => {
    const map = await mount(page, { selectedColumn: "100%" });
    await expect(map.locator(".cell-btn.missing")).toHaveCount(1);
    await expect(map.locator('.cell-btn[data-row="0"][data-col="2"]')).toHaveText("20%*");

    await map.evaluate((el) => {
      const log: unknown[] = [];
      (window as unknown as { heatLog: unknown[] }).heatLog = log;
      el.addEventListener("heatmap-cell-select", (e) => log.push({ type: "cell", detail: (e as CustomEvent).detail }));
      el.addEventListener("heatmap-column-select", (e) =>
        log.push({ type: "col", detail: (e as CustomEvent).detail }),
      );
    });

    const firstCell = map.locator('.cell-btn[data-row="0"][data-col="0"]');
    await firstCell.focus();
    await expect(map.locator(".tooltip")).toBeVisible();
    await expect(map.locator(".tooltip-title")).toHaveText("GET /feed");

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(map.locator('.cell-btn[data-row="0"][data-col="2"]')).toBeFocused();
    await expect(map.locator(".tooltip-note").last()).toHaveText("1 seed missing");

    await page.keyboard.press("ArrowDown");
    await expect(map.locator('.cell-btn[data-row="1"][data-col="2"]')).toBeFocused();
    await page.keyboard.press("Enter");
    await map.locator(".col-btn").nth(1).click();

    const log = await page.evaluate(() => (window as unknown as { heatLog: { type: string; detail: Record<string, unknown> }[] }).heatLog);
    expect(log).toHaveLength(2);
    expect(log[0].type).toBe("cell");
    expect(log[0].detail).toMatchObject({ row: 1, col: 2, rowId: "profile", columnId: "10%", value: null });
    expect(log[1].type).toBe("col");
    expect(log[1].detail).toMatchObject({ col: 1, columnId: "50%" });
  });

  test("shows empty message when rows are empty", async ({ page }) => {
    const map = await mount(page);
    await map.evaluate((el: HTMLElementTagNameMap["heatmap-chart"]) => {
      el.rows = [];
    });
    await expect(map.locator(".message")).toHaveText("No data");
  });

  test("interactive=false removes clickable controls and tooltip=false disables tooltips", async ({ page }) => {
    const map = await mount(page);
    await map.evaluate((el) => {
      el.setAttribute("interactive", "false");
      el.setAttribute("tooltip", "false");
      (window as unknown as { heatFired: number }).heatFired = 0;
      el.addEventListener("heatmap-cell-select", () => ((window as unknown as { heatFired: number }).heatFired += 1));
      el.addEventListener("heatmap-column-select", () => ((window as unknown as { heatFired: number }).heatFired += 1));
    });
    await expect(map.locator("button.col-btn")).toHaveCount(0);
    await expect(map.locator("span.col-label")).toHaveCount(3);
    await expect(map.locator("button.cell-btn")).toHaveCount(0);
    await expect(map.locator("div.cell-btn.static")).toHaveCount(6);

    await map.locator(".cell-btn").first().hover();
    await map.locator(".cell-btn").first().click();
    await map.locator(".col-label").first().click();
    await expect(map.locator(".tooltip")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { heatFired: number }).heatFired)).toBe(0);
  });
});
