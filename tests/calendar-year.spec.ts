import { test, expect } from "@playwright/test";

// The demo renders year 2026 with entries exercising: a month-boundary
// crossing entry (Offsite, Jan 28 - Feb 3), a same-day entry overlapping it
// in February (Q1 Planning, Feb 1), a long March launch entry, a same-month
// overlap pair in July (Vacation/Conference), and a year-boundary crossing
// entry (Renewal, Dec 31 2026 - Jan 2 2027).
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
    const januaryBody = janRows.nth(28).locator(".entry-body-cell.primary");
    await expect(januaryBody).toHaveAttribute("rowspan", "3");
    await expect(januaryBody).toContainText("New York");
    await expect(januaryBody).toContainText("Team workshops");
    await expect(januaryBody).not.toContainText("Closing dinner Friday");
    await expect(january.getByText("Offsite", { exact: true })).toHaveCount(1);

    // February: Offsite continues from day 1 (its first visible day here) through day 3,
    // labeled only on day 1, and overlaps Q1 Planning (also day 1) in a second lane.
    const febRows = february.locator("tbody tr");
    await expect(february.getByText("Offsite", { exact: true })).toHaveCount(1);
    await expect(febRows.nth(0)).toContainText("Q1 Planning");
    await expect(febRows.nth(0).locator(".entry-bar")).toHaveCount(2);
    const februaryBody = febRows.nth(1).locator(".entry-body-cell.primary");
    await expect(februaryBody).toHaveAttribute("rowspan", "2");
    await expect(februaryBody).toContainText("New York");
    await expect(februaryBody).toContainText("Team workshops");
    await expect(februaryBody).toContainText("Closing dinner Friday");
    await expect(febRows.nth(2).locator(".entry-bar")).toHaveCount(0);
    const clippedDetails = await februaryBody.locator(".entry-details").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        clamp: style.webkitLineClamp,
        clientHeight: element.clientHeight,
        lineHeight: Number.parseFloat(style.lineHeight),
        scrollHeight: element.scrollHeight,
        textOverflow: style.textOverflow,
      };
    });
    expect(clippedDetails.clamp).toBe("1");
    expect(clippedDetails.clientHeight).toBeGreaterThanOrEqual(clippedDetails.lineHeight - 1);
    expect(clippedDetails.clientHeight).toBeLessThan(clippedDetails.lineHeight * 1.5);
    expect(clippedDetails.scrollHeight).toBeGreaterThan(clippedDetails.clientHeight);
    expect(clippedDetails.textOverflow).toBe("ellipsis");
    const bodyText = "Offsite\nNew York\nTeam workshops\nClosing dinner Friday";
    await expect(februaryBody).not.toHaveAttribute("title");
    await expect(februaryBody.locator(".entry-link")).not.toHaveAttribute("title");
    await expect(februaryBody.locator(".entry-link")).toHaveAttribute("aria-label", bodyText);
  });

  test("uses a larger event to show the complete shared body and footer", async ({ page }) => {
    await page.goto("/");
    const march = page.locator("#calendar-year-demo calendar-month").nth(2);
    const rows = march.locator("tbody tr");
    const title = rows.nth(4).locator(".entry-bar.success");
    const body = rows.nth(5).locator(".entry-body-cell.success");

    await expect(title).toContainText("Product launch");
    await expect(body).toHaveAttribute("rowspan", "13");
    await expect(body).toContainText(
      "Coordinate the release across engineering, design, support, and marketing.",
    );
    await expect(body).toContainText("Monitor adoption and production health throughout the rollout.");
    await expect(body.locator(".entry-footer")).toHaveText("Public launch · March 18 at 9 AM");
    const details = await body.locator(".entry-details").evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(details.scrollHeight).toBeLessThanOrEqual(details.clientHeight + 1);
  });

  test("reprojects live changes to slotted detail text into every overlapping month", async ({ page }) => {
    await page.goto("/");
    const january = page.locator("#calendar-year-demo calendar-month").nth(0);
    const february = page.locator("#calendar-year-demo calendar-month").nth(1);
    const firstDetail = page.locator('#cy-entry-offsite > [slot="detail"]').first();

    await firstDetail.evaluate((element) => {
      element.textContent = "Boston";
    });

    await expect(january.locator(".entry-body-cell.primary")).toContainText("Boston");
    await expect(february.locator(".entry-body-cell.primary")).toContainText("Boston");

    const calendar = page.locator("#calendar-year-demo");
    await calendar.evaluate((element) => {
      const parent = element.parentElement!;
      element.remove();
      element.querySelector('[slot="detail"]')!.textContent = "Chicago";
      parent.append(element);
    });
    await expect(january.locator(".entry-body-cell.primary")).toContainText("Chicago");
    await expect(february.locator(".entry-body-cell.primary")).toContainText("Chicago");
  });

  test("preserves ending metadata when a cross-month event occupies one day per month", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-year-demo");
    await calendar.evaluate((element) => {
      const entry = document.createElement("calendar-entry");
      entry.setAttribute("start", "2026-01-31");
      entry.setAttribute("end", "2026-02-01");
      entry.setAttribute("label", "Boundary");
      entry.setAttribute("color", "danger");
      entry.setAttribute("href", "#boundary");

      const detail = document.createElement("span");
      detail.slot = "detail";
      detail.textContent = "Crossing midnight";
      const footer = document.createElement("span");
      footer.slot = "footer";
      footer.textContent = "Arrive February 1";
      entry.append(detail, footer);
      element.append(entry);
    });

    const january = calendar.locator("calendar-month").nth(0);
    const february = calendar.locator("calendar-month").nth(1);
    const januaryTitle = january.locator("tbody tr").nth(30).locator(".entry-title-cell.danger");
    const februaryBody = february.locator("tbody tr").nth(0).locator(".entry-body-cell.danger");

    await expect(januaryTitle.locator(".entry-title")).toHaveText("Boundary");
    await expect(januaryTitle.locator(".entry-footer")).toHaveCount(0);
    await expect(februaryBody).toHaveAttribute("rowspan", "1");
    await expect(februaryBody.locator(".entry-details")).toHaveCount(0);
    await expect(februaryBody.locator(".entry-footer")).toHaveText("Arrive February 1");
    await expect(februaryBody.locator(".entry-link")).toHaveAccessibleName(
      "Boundary\nCrossing midnight\nArrive February 1",
    );

    await calendar.evaluate((element) => {
      const entry = document.createElement("calendar-entry");
      entry.setAttribute("start", "2026-01-31");
      entry.setAttribute("end", "2026-02-01");
      entry.setAttribute("label", "Label only");
      entry.setAttribute("color", "neutral");
      element.append(entry);
    });
    await expect(
      february.locator("tbody tr").nth(0).locator(".entry-body-cell.neutral .entry-detail"),
    ).toHaveText("Label only");
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
