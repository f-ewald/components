import { test, expect } from "@playwright/test";

// The demo renders 2026-07-15 with: an all-day entry (Company holiday),
// two overlapping timed entries (Standup 09:00-09:30, Design review
// 09:15-10:00, href="#review") that must stack into 2 lanes, and a
// non-overlapping timed entry (Lunch 12:00-13:00) that still gets halved
// into the same 2-lane width since lanes are assigned once across the day.
const HOUR_PX = 48; // HOUR_HEIGHT_REM (3rem) at the default 16px root font-size.

test.describe("calendar-day", () => {
  test("uses semantic dark tokens and removes entry transitions for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const calendar = page.locator("#calendar-day-demo");
    await calendar.evaluate((element) => {
      element.style.setProperty("--ui-info", "#38bdf8");
      element.style.setProperty("--ui-border", "#334155");
    });

    await expect(calendar.locator(".entry-bar.info")).toHaveCSS("color", "rgb(56, 189, 248)");
    await expect(calendar.locator(".entry-bar").first()).toHaveCSS("transition-duration", "0s");
    await expect(calendar.locator(".hour-line").first()).toHaveCSS("border-bottom-color", "rgb(51, 65, 85)");
  });

  test("renders 24 hour rows and separates all-day entries from timed blocks", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-day-demo");

    await expect(el.locator(".hour-label-cell")).toHaveCount(24);
    await expect(el.locator(".all-day-band")).not.toHaveClass(/empty/);
    await expect(el.locator(".all-day-lanes .entry-bar")).toHaveCount(1);
    await expect(el.locator(".all-day-lanes .entry-bar")).toHaveText("Company holiday");
    await expect(el.locator(".day-column .entry-block")).toHaveCount(3);
  });

  test("positions timed entries by time-of-day and sizes them by duration", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-day-demo");
    const standup = el.locator(".entry-block.info");
    const review = el.locator(".entry-block.primary");
    const lunch = el.locator(".entry-block.success");

    await expect(standup).toHaveCSS("top", `${9 * HOUR_PX}px`);
    await expect(standup).toHaveCSS("height", `${0.5 * HOUR_PX}px`);
    await expect(review).toHaveCSS("top", `${9.25 * HOUR_PX}px`);
    await expect(review).toHaveCSS("height", `${0.75 * HOUR_PX}px`);
    await expect(lunch).toHaveCSS("top", `${12 * HOUR_PX}px`);
    await expect(lunch).toHaveCSS("height", `${1 * HOUR_PX}px`);
  });

  test("stacks overlapping timed entries into side-by-side lanes", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-day-demo");
    const standup = el.locator(".entry-block.info");
    const review = el.locator(".entry-block.primary");
    const lunch = el.locator(".entry-block.success");

    const [standupBox, reviewBox, lunchBox] = await Promise.all(
      [standup, review, lunch].map((locator) => locator.evaluate((el) => el.getBoundingClientRect())),
    );
    expect(standupBox.width).toBeCloseTo(reviewBox.width, 0);
    expect(reviewBox.left).toBeGreaterThan(standupBox.left + standupBox.width / 2);
    // Lunch doesn't overlap anything, but still gets the day's lane width,
    // and reuses the first lane since it starts after Standup/Review end.
    expect(Math.abs(lunchBox.left - standupBox.left)).toBeLessThan(1);
    expect(lunchBox.width).toBeCloseTo(standupBox.width, 0);
  });

  test("renders an href entry as a link with hover/focus sync inherited from the base class", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#calendar-day-demo");
    const review = el.locator(".entry-block.primary");
    const link = review.locator("a.entry-link");

    await expect(link).toHaveAttribute("href", "#review");
    await expect(link).toHaveAccessibleName("Design review\nWalk through the new onboarding flow\nRoom A");

    const idleShadow = await review.evaluate((element) => getComputedStyle(element).boxShadow);
    await link.hover();
    await expect(review).toHaveClass(/entry-hovered/);
    const hoverShadow = await review.evaluate((element) => getComputedStyle(element).boxShadow);
    expect(hoverShadow).not.toBe(idleShadow);
    await page.mouse.move(0, 0);
    await expect(review).not.toHaveClass(/entry-hovered/);

    await link.focus();
    await expect(review).toHaveClass(/entry-focused/);
    await link.click({ position: { x: 2, y: 2 } });
    await expect(page).toHaveURL(/#review$/);
  });

  test("updates rendered entries when slotted attributes change", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-day-demo");
    const entry = page.locator("#cd-entry-lunch");

    await entry.evaluate((element) => {
      (element as HTMLElement & { label: string }).label = "Team lunch";
    });
    await expect(calendar.locator(".entry-block.success .entry-title")).toHaveText("Team lunch");

    await entry.evaluate((element) => {
      const calendarEntry = element as HTMLElement & { start: string; end: string };
      calendarEntry.start = "2026-07-16T12:00";
      calendarEntry.end = "2026-07-16T13:00";
    });
    await expect(calendar.locator(".entry-block.success")).toHaveCount(0);
  });

  test("switching the date control re-renders the day", async ({ page }) => {
    await page.goto("/");
    const dateInput = page.locator("#calendar-day-select");
    const calendar = page.locator("#calendar-day-demo");

    await expect(calendar).toHaveJSProperty("date", "2026-07-15");
    await dateInput.fill("2026-07-16");
    await dateInput.dispatchEvent("change");
    await expect(calendar).toHaveJSProperty("date", "2026-07-16");
    await expect(calendar.locator(".entry-block")).toHaveCount(0);
    await expect(calendar.locator(".all-day-band")).toHaveClass(/empty/);
  });

  test("renders slotted actions beside the day name and lets them drive navigation", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-day-demo");
    const prev = page.locator('[data-testid="calendar-day-prev"]');
    const next = page.locator('[data-testid="calendar-day-next"]');

    await expect(prev).toBeVisible();
    await expect(next).toBeVisible();

    await next.click();
    await expect(calendar).toHaveJSProperty("date", "2026-07-16");
    await expect(page.locator("#calendar-day-select")).toHaveValue("2026-07-16");

    await prev.click();
    await prev.click();
    await expect(calendar).toHaveJSProperty("date", "2026-07-14");
  });

  test("highlights weekends and clears the class on weekdays", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-day-demo");

    // Default demo date, 2026-07-15, is a Wednesday.
    await expect(calendar.locator(".day-column")).not.toHaveClass(/weekend/);
    await expect(calendar.locator(".day-name")).not.toHaveClass(/weekend/);

    await calendar.evaluate((element) => {
      (element as HTMLElement & { date: string }).date = "2026-07-18"; // Saturday
    });
    await expect(calendar.locator(".day-column")).toHaveClass(/weekend/);
    await expect(calendar.locator(".day-name")).toHaveClass(/weekend/);
  });

  test("shows the current-time marker only when time-marker is set and the date is today", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-day-demo");

    // Default demo date is fixed, so the marker starts hidden even without touching time-marker.
    await expect(calendar.locator(".now-line")).toHaveCount(0);

    await calendar.evaluate((element) => {
      const now = new Date();
      const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      (element as HTMLElement & { date: string; timeMarker: boolean }).date = iso;
      (element as HTMLElement & { date: string; timeMarker: boolean }).timeMarker = true;
    });
    await expect(calendar.locator(".now-line")).toHaveCount(1);

    await calendar.evaluate((element) => {
      (element as HTMLElement & { timeMarker: boolean }).timeMarker = false;
    });
    await expect(calendar.locator(".now-line")).toHaveCount(0);

    await calendar.evaluate((element) => {
      const el = element as HTMLElement & { date: string; timeMarker: boolean };
      el.timeMarker = true;
      el.date = "2026-07-15"; // not today
    });
    await expect(calendar.locator(".now-line")).toHaveCount(0);
  });

  test("renders a slotted location with a marker icon on timed entries", async ({ page }) => {
    await page.goto("/");
    const location = page.locator("#calendar-day-demo .entry-block.primary .entry-location");

    await expect(location).toBeVisible();
    await expect(location).toContainText("Room A");
    await expect(location.locator("svg")).toBeVisible();
  });

  test("multi-day row: lines up N calendar-day elements in ascending date order and scrolls horizontally", async ({
    page,
  }) => {
    await page.goto("/");
    const row = page.locator('[data-testid="calendar-day-row"]');
    const items = page.locator('[data-testid="calendar-day-row-item"]');
    const countLabel = page.locator('[data-testid="calendar-day-row-count"]');

    await expect(items).toHaveCount(3);
    await expect(countLabel).toHaveText("3");
    await expect(row).toHaveCSS("overflow-x", "auto");

    const dates = await items.evaluateAll((els) => els.map((el) => (el as HTMLElement & { date: string }).date));
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
    expect(new Set(dates).size).toBe(3);

    await page.locator('[data-testid="calendar-day-row-inc"]').click();
    await expect(items).toHaveCount(4);
    await expect(countLabel).toHaveText("4");

    await page.locator('[data-testid="calendar-day-row-dec"]').click();
    await page.locator('[data-testid="calendar-day-row-dec"]').click();
    await expect(items).toHaveCount(2);
    await expect(countLabel).toHaveText("2");
  });
});
