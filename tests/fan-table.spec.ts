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

/** Mounts a fan-table with the fixture data, 10/50/90 percentiles, a goal, and one event. */
async function mount(page: Page, props: Record<string, unknown> = {}) {
  await page.goto("/");
  await page.evaluate(
    ({ series, props }) => {
      const table = document.createElement("fan-table");
      table.id = "fan-table-fixture";
      table.percentiles = [10, 50, 90];
      table.series = series;
      table.goal = { value: 500, label: "Target" };
      table.events = [{ date: "2026-01-01", label: "Move" }];
      Object.assign(table, props);
      document.body.prepend(table);
    },
    { series: fixture, props },
  );
  const table = page.locator("#fan-table-fixture");
  await expect(table.locator("table")).toBeVisible();
  return table;
}

test.describe("fan-table", () => {
  test("playground shows yearly observed and forecast rows per series and follows column toggles", async ({ page }) => {
    await page.goto("/");
    const table = page.getByTestId("fan-table-demo");
    await expect(table.getByRole("table", { name: "Savings forecast" })).toBeVisible();
    await expect(table.locator("thead th")).toHaveCount(5);
    await expect(table.locator(".group th")).toHaveText(["Observed", "Forecast"]);
    await expect(table.locator("th[scope=row] .sub")).toHaveText(["House", "College", "Retirement"]);
    await expect(table.locator("tbody tr:not(.group)").last().locator("td").first()).toContainText(/\d+% ≥ \$1M/);

    await page.getByTestId("fan-table-columns").getByLabel("Brokerage").uncheck();
    await expect(table.locator("thead th")).toHaveCount(4);
    await expect(table.locator("thead th[data-series=brokerage]")).toHaveCount(0);
  });

  test("rows follow the interval, cells show observed values or median, range, and goal share", async ({ page }) => {
    const table = await mount(page);
    await expect(table.locator("th[scope=row] .value")).toHaveText(["2024", "2025", "2026", "2027"]);
    await expect(table.locator("th[scope=row]").nth(2).locator(".sub")).toHaveText("Move");
    const last = table.locator("tbody tr:not(.group)").last().locator("td");
    await expect(last.nth(0).locator(".median")).toHaveText("$600");
    await expect(last.nth(0).locator(".sub")).toHaveText(["$300 – $1,200", "70% ≥ $500"]);
    await expect(last.nth(1)).toHaveText("—");
    await expect(table.locator("tbody tr:not(.group)").first().locator("td").first()).toHaveText("$200");
    await expect(table.locator("thead .col-head")).toHaveText(["Alpha", "Beta"]);
    await expect(table.locator("thead .col-sub")).toHaveText(["Median · P10–P90"]);

    await table.evaluate((element) => ((element as HTMLElement & { interval: string }).interval = "all"));
    await expect(table.locator("th[scope=row] .value")).toHaveText([
      "Jan 2024",
      "Jul 2024",
      "Jan 2025",
      "Jan 2026",
      "Jan 2027",
    ]);
  });

  test("shows only visible columns, in the locale and currency, optionally compact", async ({ page }) => {
    const table = await mount(page, { locale: "de-DE", currency: "EUR", compact: true, visible: ["a"] });
    await expect(table.locator("thead .col-head")).toHaveText(["Alpha"]);
    const last = table.locator("tbody tr:not(.group)").last().locator("td");
    await expect(last.locator(".median")).toHaveText("600 €");
    await expect(last.locator(".sub").first()).toHaveText("300 € – 1200 €");
  });

  test("a numeric x axis lists every point, split at a numeric now, labelled by xFormat", async ({ page }) => {
    const series = [
      {
        id: "n",
        label: "Numeric",
        actual: [{ date: 30, value: 100 }, { date: 31, value: 200 }],
        projection: [{ date: 32, values: [150, 300, 900] }, { date: 32.5, values: [200, 600, 4000] }],
      },
    ];
    const table = await mount(page, { series, xType: "linear", now: "30.5", events: [{ date: 32, label: "Move" }] });
    await expect(table.locator("th[scope=row] .value")).toHaveText(["30", "31", "32", "32.5"]);
    await expect(table.locator("tbody").nth(0).locator("th[scope=row] .value")).toHaveText(["30"]);
    await expect(table.locator("th[scope=row]").nth(2).locator(".sub")).toHaveText("Move");
    await table.evaluate((element: HTMLElementTagNameMap["fan-table"]) => (element.xFormat = (x) => `Age ${x}`));
    await expect(table.locator("th[scope=row] .value").first()).toHaveText("Age 30");
  });
});
