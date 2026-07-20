import { test, expect } from "@playwright/test";

// The demo renders year 2026 with entries exercising: a month-boundary
// crossing entry (Offsite, Jan 28 - Feb 3), a same-day entry overlapping it
// in February (Q1 Planning, Feb 1), a same-month overlap pair in July
// (Vacation/Conference), and a year-boundary crossing entry (Renewal,
// Dec 31 2026 - Jan 2 2027).
test.describe("calendar-year", () => {
  test("renders one calendar-month per month of the year", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#calendar-year-demo calendar-month")).toHaveCount(12);
  });

  test("clips a month-boundary entry into each month, labeling it once per month", async ({ page }) => {
    await page.goto("/");
    const january = page.locator("#calendar-year-demo calendar-month").nth(0);
    const february = page.locator("#calendar-year-demo calendar-month").nth(1);

    // January: Offsite starts on the 28th, so its row is the only one showing the label.
    const janRows = january.locator("tbody tr");
    await expect(janRows.nth(27)).toContainText("Offsite");
    await expect(january.getByText("Offsite", { exact: true })).toHaveCount(1);

    // February: Offsite continues from day 1 (its first visible day here) through day 3,
    // labeled only on day 1, and overlaps Q1 Planning (also day 1) in a second lane.
    const febRows = february.locator("tbody tr");
    await expect(february.getByText("Offsite", { exact: true })).toHaveCount(1);
    await expect(febRows.nth(0)).toContainText("Q1 Planning");
    await expect(febRows.nth(0).locator(".entry-bar")).toHaveCount(2);
    await expect(febRows.nth(2).locator(".entry-bar")).toHaveCount(1);
  });

  test("clips a year-boundary entry to only the in-year days", async ({ page }) => {
    await page.goto("/");
    const december = page.locator("#calendar-year-demo calendar-month").nth(11);
    const january = page.locator("#calendar-year-demo calendar-month").nth(0);

    const decRows = december.locator("tbody tr");
    await expect(decRows.nth(30)).toContainText("Renewal");
    await expect(december.getByText("Renewal", { exact: true })).toHaveCount(1);
    await expect(january.getByText("Renewal", { exact: true })).toHaveCount(0);
  });

  test("changing the year control re-renders without error", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-year-demo");

    await page.selectOption("#calendar-year-select", "2025");
    await expect(el).toHaveAttribute("year", "2025");
    await expect(el.locator("calendar-month")).toHaveCount(12);
  });
});
