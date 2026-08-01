import { test, expect } from "@playwright/test";

// The demo renders the week containing 2026-07-15: an all-day entry
// spanning Mon-Wed (Offsite, href="#offsite"), a single-day all-day entry
// on Friday (All-hands), two overlapping timed entries on Tuesday (Standup
// 09:00-09:30, Sprint planning 09:15-10:00) that must stack into 2 lanes
// *only within that day*, and a standalone timed entry on Thursday
// (Customer demo) that should NOT be halved by Tuesday's lanes.
const HOUR_PX = 48; // HOUR_HEIGHT_REM (3rem) at the default 16px root font-size.
const WEEK_START = new Date(2026, 6, 15);
WEEK_START.setDate(WEEK_START.getDate() - WEEK_START.getDay());
WEEK_START.setHours(0, 0, 0, 0);

function dayIndex(y: number, m: number, d: number): number {
  const date = new Date(y, m - 1, d);
  return Math.round((date.getTime() - WEEK_START.getTime()) / 86_400_000);
}

test.describe("calendar-week", () => {
  test("uses semantic dark tokens and removes entry transitions for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const calendar = page.locator("#calendar-week-demo");
    await calendar.evaluate((element) => {
      element.style.setProperty("--ui-info", "#38bdf8");
      element.style.setProperty("--ui-border", "#334155");
    });

    await expect(calendar.locator(".entry-bar.info")).toHaveCSS("color", "rgb(56, 189, 248)");
    await expect(calendar.locator(".entry-bar").first()).toHaveCSS("transition-duration", "0s");
    await expect(calendar.locator(".hour-line").first()).toHaveCSS("border-bottom-color", "rgb(51, 65, 85)");
  });

  test("renders 7 day headers and 24 hour rows", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-week-demo");

    await expect(el.locator(".day-header")).toHaveCount(7);
    await expect(el.locator(".hour-label-cell")).toHaveCount(24);
    await expect(el.locator(".day-header").nth(dayIndex(2026, 7, 15)).locator(".day-number")).toHaveText("15");
    await expect(el.locator(".week-days .day-column")).toHaveCount(7);
  });

  test("spans a multi-day all-day entry across its columns in one shared band", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-week-demo");
    const offsite = el.locator(".all-day-lanes .entry-bar.primary");
    const allHands = el.locator(".all-day-lanes .entry-bar.neutral");

    await expect(el.locator(".all-day-band")).not.toHaveClass(/empty/);
    await expect(offsite).toHaveText("Offsite");
    await expect(allHands).toHaveText("All-hands");

    const startCol = dayIndex(2026, 7, 13) + 1;
    const endCol = dayIndex(2026, 7, 15) + 2;
    await expect(offsite).toHaveCSS("grid-column-start", String(startCol));
    await expect(offsite).toHaveCSS("grid-column-end", String(endCol));

    // Non-overlapping all-day entries share the same lane/row.
    const [offsiteTop, allHandsTop] = await Promise.all(
      [offsite, allHands].map((locator) => locator.evaluate((el) => el.getBoundingClientRect().top)),
    );
    expect(Math.abs(offsiteTop - allHandsTop)).toBeLessThan(1);
  });

  test("stacks overlapping timed entries per day, independent of other days", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-week-demo");
    const tuesday = el.locator(".week-days .day-column").nth(dayIndex(2026, 7, 14));
    const thursday = el.locator(".week-days .day-column").nth(dayIndex(2026, 7, 16));

    const standup = tuesday.locator(".entry-block.info");
    const planning = tuesday.locator(".entry-block.warning");
    const demo = thursday.locator(".entry-block.success");

    await expect(standup).toHaveCSS("top", `${9 * HOUR_PX}px`);
    await expect(planning).toHaveCSS("top", `${9.25 * HOUR_PX}px`);
    await expect(demo).toHaveCSS("top", `${14 * HOUR_PX}px`);
    await expect(demo).toHaveCSS("height", `${1 * HOUR_PX}px`);

    const [standupBox, planningBox, demoBox, tuesdayBox] = await Promise.all(
      [standup, planning, demo, tuesday].map((locator) => locator.evaluate((el) => el.getBoundingClientRect())),
    );
    expect(planningBox.left).toBeGreaterThan(standupBox.left + standupBox.width / 2);
    // Thursday's lone entry isn't halved by Tuesday's overlapping pair — it
    // fills its own day column (Tuesday and Thursday columns are ~equal width,
    // modulo the day column's 1px border).
    expect(Math.abs(demoBox.width - tuesdayBox.width)).toBeLessThan(2);
  });

  test("renders an href all-day entry as a link with hover/focus sync inherited from the base class", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#calendar-week-demo");
    const offsite = el.locator(".all-day-lanes .entry-bar.primary");
    const link = offsite.locator("a.entry-link");

    await expect(link).toHaveAttribute("href", "#offsite");
    await link.hover();
    await expect(offsite).toHaveClass(/entry-hovered/);
    await page.mouse.move(0, 0);
    await expect(offsite).not.toHaveClass(/entry-hovered/);
    await link.click({ position: { x: 2, y: 2 } });
    await expect(page).toHaveURL(/#offsite$/);
  });

  test("updates rendered entries when slotted attributes change", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-week-demo");
    const entry = page.locator("#cw-entry-demo");

    await entry.evaluate((element) => {
      (element as HTMLElement & { label: string }).label = "Renewal call";
    });
    await expect(calendar.locator(".entry-block.success .entry-title")).toHaveText("Renewal call");

    await entry.evaluate((element) => {
      const calendarEntry = element as HTMLElement & { start: string; end: string };
      calendarEntry.start = "2026-08-16T14:00";
      calendarEntry.end = "2026-08-16T15:00";
    });
    await expect(calendar.locator(".entry-block.success")).toHaveCount(0);
  });

  test("switching the date control re-renders the week", async ({ page }) => {
    await page.goto("/");
    const dateInput = page.locator("#calendar-week-select");
    const calendar = page.locator("#calendar-week-demo");

    await expect(calendar).toHaveJSProperty("date", "2026-07-15");
    await dateInput.fill("2026-08-15");
    await dateInput.dispatchEvent("change");
    await expect(calendar).toHaveJSProperty("date", "2026-08-15");
    await expect(calendar.locator(".entry-block")).toHaveCount(0);
    await expect(calendar.locator(".all-day-band")).toHaveClass(/empty/);
  });

  test("renders slotted actions beside the day headers and lets them drive navigation", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-week-demo");
    const prev = page.locator('[data-testid="calendar-week-prev"]');
    const next = page.locator('[data-testid="calendar-week-next"]');

    await expect(prev).toBeVisible();
    await expect(next).toBeVisible();

    await next.click();
    await expect(calendar).toHaveJSProperty("date", "2026-07-22");
    await expect(page.locator("#calendar-week-select")).toHaveValue("2026-07-22");

    await prev.click();
    await prev.click();
    await expect(calendar).toHaveJSProperty("date", "2026-07-08");
  });

  test("renders a slotted location with a marker icon on timed entries", async ({ page }) => {
    await page.goto("/");
    const location = page.locator("#calendar-week-demo .entry-block.success .entry-location");

    await expect(location).toBeVisible();
    await expect(location).toContainText("Main conference room");
    await expect(location.locator("svg")).toBeVisible();
  });
});
