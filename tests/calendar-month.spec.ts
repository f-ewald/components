import { test, expect } from "@playwright/test";

// The demo renders July 2026 (31 days) with two overlapping entries:
// Vacation (Jul 10-18, no href) and Conference (Jul 15-20, href="#conf").
const YEAR = 2026;
const MONTH = 7; // July
const TOTAL_DAYS = 31;

function isWeekend(day: number): boolean {
  const dow = new Date(YEAR, MONTH - 1, day).getDay();
  return dow === 0 || dow === 6;
}

test.describe("calendar-month", () => {
  test("renders one row per day with weekends highlighted", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");
    const rows = el.locator("tbody tr");

    await expect(rows).toHaveCount(TOTAL_DAYS);

    const expectedWeekendCount = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).filter(isWeekend).length;
    await expect(el.locator(".day-row.weekend")).toHaveCount(expectedWeekendCount);

    // July 11, 2026 is a Saturday.
    await expect(rows.nth(10)).toHaveClass(/weekend/);
    // July 13, 2026 is a Monday.
    await expect(rows.nth(12)).not.toHaveClass(/weekend/);
  });

  test("stacks overlapping entries into aligned lanes", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");
    const rows = el.locator("tbody tr");

    // July 10: only Vacation is active -> one bar, one empty spacer.
    const day10 = rows.nth(9);
    await expect(day10.locator(".entry-bar")).toHaveCount(1);
    await expect(day10.locator(".lane-cell.empty")).toHaveCount(1);

    // July 16: Vacation and Conference both active -> two bars, no spacer.
    const day16 = rows.nth(15);
    await expect(day16.locator(".entry-bar")).toHaveCount(2);
    await expect(day16.locator(".lane-cell.empty")).toHaveCount(0);
  });

  test("shows each entry's label only on its first visible day", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");

    await expect(el.getByText("Conference", { exact: true })).toHaveCount(1);
    await expect(el.getByText("Vacation", { exact: true })).toHaveCount(1);
  });

  test("renders an href entry as a link and a plain entry as text", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");

    await expect(el.locator(".entry-bar.warning a[href='#conf']").first()).toHaveText("Conference");
    await expect(el.locator(".entry-bar.warning a[href='#conf']")).toHaveCount(6);
    await expect(el.locator(".entry-bar.success").first().locator("a")).toHaveCount(0);
  });
});
