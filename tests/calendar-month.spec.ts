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

  test("highlights today with a muted primary row background", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");
    const today = await page.evaluate(() => {
      const date = new Date();
      return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
    });

    await el.evaluate((element, date) => {
      const calendar = element as HTMLElement & { year: number; month: number };
      calendar.year = date.year;
      calendar.month = date.month;
    }, today);

    const rows = el.locator("tbody tr");
    const todayRow = rows.nth(today.day - 1);
    const comparisonRow = rows.nth(today.day === 1 ? 1 : 0);
    await expect(todayRow).toHaveClass(/today/);

    const todayStyles = await todayRow.evaluate((row) => {
      const dayNumber = row.querySelector(".day-number")!;
      const weekday = row.querySelector(".day-weekday")!;
      return {
        background: getComputedStyle(row).backgroundColor,
        dayColor: getComputedStyle(dayNumber).color,
        weekdayColor: getComputedStyle(weekday).color,
        dayShadow: getComputedStyle(dayNumber).boxShadow,
      };
    });
    const comparisonBackground = await comparisonRow.evaluate((row) => getComputedStyle(row).backgroundColor);

    expect(todayStyles.background).not.toBe(comparisonBackground);
    expect(todayStyles.dayColor).toBe(todayStyles.weekdayColor);
    expect(todayStyles.dayShadow).toBe("none");
  });

  test("stacks overlapping entries into aligned lanes", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");
    const rows = el.locator("tbody tr");

    // July 10: only Vacation is active -> one bar, one empty spacer.
    const day10 = rows.nth(9);
    await expect(day10.locator(".entry-bar")).toHaveCount(1);
    await expect(day10.locator(".lane-cell.empty")).toHaveCount(1);

    // Row-spanning bodies stay in their assigned lanes while they overlap.
    const vacationBody = rows.nth(10).locator(".entry-body-cell.success");
    const conferenceTitle = rows.nth(14).locator(".entry-bar.warning");
    const conferenceBody = rows.nth(15).locator(".entry-body-cell.warning");
    await expect(vacationBody).toHaveAttribute("rowspan", "8");
    await expect(conferenceBody).toHaveAttribute("rowspan", "5");
    const lanePositions = await Promise.all(
      [vacationBody, conferenceTitle, conferenceBody].map((cell) =>
        cell.evaluate((element) => element.getBoundingClientRect().left),
      ),
    );
    expect(lanePositions[1]).toBeGreaterThan(lanePositions[0]);
    expect(Math.abs(lanePositions[1] - lanePositions[2])).toBeLessThan(1);
  });

  test("renders multi-day entries as continuous segments with rounded endpoints", async ({ page }) => {
    await page.goto("/");
    const rows = page.locator("#calendar-month-demo tbody tr");
    const start = rows.nth(9).locator(".entry-bar.success");
    const body = rows.nth(10).locator(".entry-body-cell.success");

    await expect(start).toHaveClass(/segment-start/);
    await expect(body).toHaveClass(/segment-end/);
    await expect(body).toHaveAttribute("rowspan", "8");
    for (let dayIndex = 11; dayIndex <= 17; dayIndex++) {
      await expect(rows.nth(dayIndex).locator(".entry-bar.success")).toHaveCount(0);
    }

    const styles = await Promise.all(
      [start, body].map((segment) =>
        segment.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            top: style.borderTopLeftRadius,
            bottom: style.borderBottomLeftRadius,
            divider: style.borderBottomWidth,
          };
        }),
      ),
    );

    expect(styles[0].top).not.toBe("0px");
    expect(styles[0].bottom).toBe("0px");
    expect(styles[0].divider).toBe("0px");
    expect(styles[1].top).toBe("0px");
    expect(styles[1].bottom).not.toBe("0px");
  });

  test("uses all remaining days as one shared details body with a pinned footer", async ({ page }) => {
    await page.goto("/");
    const pageRows = page.locator("#calendar-month-demo tbody tr");
    const vacationStart = pageRows.nth(9).locator(".entry-bar.success");
    const vacationBody = pageRows.nth(10).locator(".entry-body-cell.success");
    const oneDayEntry = pageRows.nth(22).locator(".entry-bar.info");

    await expect(vacationStart).toHaveText("Vacation");
    await expect(vacationStart.locator(".entry-title")).toHaveCount(1);
    await expect(vacationBody).toHaveAttribute("rowspan", "8");
    await expect(vacationBody.locator(".entry-detail")).toHaveCount(2);
    await expect(vacationBody.locator(".entry-detail").nth(0)).toHaveText("Out of office");
    await expect(vacationBody.locator(".entry-detail").nth(1)).toHaveText(
      "Road trip along the California coast with several scenic stops",
    );
    const footer = vacationBody.locator(".entry-footer");
    await expect(footer).toHaveText("Return July 19 at 6 PM");
    const footerOffset = await vacationBody.evaluate((cell) => {
      const body = cell.querySelector(".entry-body")!.getBoundingClientRect();
      const footerElement = cell.querySelector(".entry-footer")!.getBoundingClientRect();
      return body.bottom - footerElement.bottom;
    });
    expect(footerOffset).toBeLessThan(5);
    const contentLeftEdges = await Promise.all(
      [
        vacationStart.locator(".entry-title"),
        vacationBody.locator(".entry-detail").first(),
        vacationBody.locator(".entry-footer"),
      ].map((content) =>
        content.evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return range.getBoundingClientRect().left;
        }),
      ),
    );
    expect(Math.max(...contentLeftEdges) - Math.min(...contentLeftEdges)).toBeLessThan(1);
    await expect(oneDayEntry).toHaveText("Dentist");
    await expect(oneDayEntry).not.toContainText("Bring insurance card");
    await expect(oneDayEntry).not.toContainText("Appointment complete");
    await expect(oneDayEntry).not.toContainText("Appointment");
  });

  test("prioritizes the footer when a short body cannot fit a complete detail line", async ({ page }) => {
    await page.goto("/");
    const entry = page.locator("#cm-entry-dentist");
    await entry.evaluate((element) => {
      (element as HTMLElement & { end: string }).end = "2026-07-24";
    });

    const body = page.locator("#calendar-month-demo tbody tr").nth(23).locator(".entry-body-cell.info");
    await expect(body).toHaveAttribute("rowspan", "1");
    await expect(body.locator(".entry-details")).toHaveCount(0);
    await expect(body.locator(".entry-footer")).toHaveText("Appointment complete");
    await expect(body).toHaveAttribute(
      "title",
      "Dentist\nBring insurance card\nAppointment complete",
    );
  });

  test("updates rendered details when slotted text changes", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-month-demo");
    const firstDetail = page.locator('#cm-entry-vacation > [slot="detail"]').first();
    await firstDetail.evaluate((element) => {
      element.textContent = "Offline until July 19";
    });

    const body = calendar.locator("tbody tr").nth(10).locator(".entry-body-cell.success");
    await expect(body.locator(".entry-detail").first()).toHaveText("Offline until July 19");

    await calendar.evaluate((element) => {
      const parent = element.parentElement!;
      element.remove();
      element.querySelector('[slot="detail"]')!.textContent = "Changed while detached";
      parent.append(element);
    });
    await expect(body.locator(".entry-detail").first()).toHaveText("Changed while detached");
  });

  test("preserves intentionally empty detail slots inside the shared body", async ({ page }) => {
    await page.goto("/");
    const entry = page.locator("#cm-entry-vacation");
    await entry.evaluate((element) => {
      const emptyDetail = document.createElement("span");
      emptyDetail.slot = "detail";
      element.insertBefore(emptyDetail, element.querySelector('[slot="detail"]'));
    });

    const details = page.locator("#calendar-month-demo .entry-body-cell.success .entry-detail");
    await expect(details).toHaveCount(3);
    await expect(details.nth(0)).toHaveText("");
    await expect(details.nth(1)).toHaveText("Out of office");
  });

  test("keeps every permitted detail line fully inside the clamp", async ({ page }) => {
    await page.goto("/");
    const entry = page.locator("#cm-entry-vacation");
    await entry.evaluate((element) => {
      (element as HTMLElement & { end: string }).end = "2026-07-13";
      element.querySelector('[slot="footer"]')?.remove();
    });

    const details = page.locator("#calendar-month-demo tbody tr").nth(10).locator(".entry-details");
    await expect(details.locator(".entry-detail")).toHaveCount(2);
    const clipping = await details.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const finalLine = element.lastElementChild!.getBoundingClientRect();
      return {
        overflow: finalLine.bottom - bounds.bottom,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      };
    });
    expect(clipping.overflow).toBeLessThanOrEqual(1);
    expect(clipping.scrollHeight).toBeLessThanOrEqual(clipping.clientHeight + 1);
  });

  test("wraps long details with smaller, lighter, tightly spaced text without widening", async ({ page }) => {
    await page.goto("/");
    const calendar = page.locator("#calendar-month-demo");
    const longDetail = "A detailed calendar note ".repeat(30).trim();
    await page.locator('#cm-entry-vacation > [slot="detail"]').first().evaluate((element, text) => {
      element.textContent = text;
    }, longDetail);

    const renderedDetail = calendar.locator("tbody tr").nth(10).locator(".entry-detail").first();
    await expect(renderedDetail).toHaveText(longDetail);
    const metrics = await calendar.evaluate((element) => {
      const table = element.shadowRoot!.querySelector("table")!.getBoundingClientRect();
      const title = element.shadowRoot!.querySelector<HTMLElement>(".entry-title")!;
      const detail = element.shadowRoot!.querySelector<HTMLElement>(".entry-detail")!;
      const titleStyle = getComputedStyle(title);
      const detailStyle = getComputedStyle(detail);
      return {
        calendarWidth: element.getBoundingClientRect().width,
        tableWidth: table.width,
        titleFontSize: Number.parseFloat(titleStyle.fontSize),
        titleFontWeight: Number(titleStyle.fontWeight),
        detailFontSize: Number.parseFloat(detailStyle.fontSize),
        detailFontWeight: Number(detailStyle.fontWeight),
        detailLineHeight: Number.parseFloat(detailStyle.lineHeight),
        detailHeight: detail.getBoundingClientRect().height,
        detailClientWidth: detail.clientWidth,
        detailScrollWidth: detail.scrollWidth,
        detailWhiteSpace: detailStyle.whiteSpace,
      };
    });

    expect(metrics.tableWidth).toBeLessThanOrEqual(metrics.calendarWidth + 1);
    expect(metrics.detailFontSize).toBeLessThan(metrics.titleFontSize);
    expect(metrics.detailFontWeight).toBeLessThan(metrics.titleFontWeight);
    expect(metrics.detailLineHeight / metrics.detailFontSize).toBeLessThanOrEqual(1.2);
    expect(metrics.detailHeight).toBeGreaterThan(metrics.detailLineHeight * 1.5);
    expect(metrics.detailScrollWidth).toBeLessThanOrEqual(metrics.detailClientWidth + 1);
    expect(metrics.detailWhiteSpace).toBe("normal");
  });

  test("keeps day columns left-aligned when the month has no entries", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");
    const firstRow = el.locator("tbody tr").first();
    const positions = () =>
      firstRow.evaluate((row) => {
        const table = row.closest("table")!.getBoundingClientRect();
        const dayNumber = row.querySelector(".day-number")!.getBoundingClientRect();
        const weekday = row.querySelector(".day-weekday")!.getBoundingClientRect();
        return {
          dayRight: dayNumber.right - table.left,
          weekdayLeft: weekday.left - table.left,
          weekdayRight: weekday.right - table.left,
        };
      });

    const populated = await positions();
    await el.locator("calendar-entry").evaluateAll((entries) => entries.forEach((entry) => entry.remove()));
    await expect(el.locator(".entry-bar")).toHaveCount(0);
    await expect(firstRow.locator(".lane-cell.empty")).toHaveCount(1);
    const empty = await positions();

    expect(Math.abs(empty.dayRight - populated.dayRight)).toBeLessThan(1);
    expect(Math.abs(empty.weekdayLeft - populated.weekdayLeft)).toBeLessThan(1);
    expect(empty.weekdayRight).toBeLessThan(100);
  });

  test("shows each entry's title only on its first visible day", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");
    const renderedEntries = el.locator(".entry-bar");

    await expect(renderedEntries.getByText("Conference", { exact: true })).toHaveCount(1);
    await expect(renderedEntries.getByText("Vacation", { exact: true })).toHaveCount(1);
  });

  test("renders an href entry as a link and a plain entry as text", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#calendar-month-demo");
    const titleCell = el.locator("tbody tr").nth(14).locator(".entry-bar.warning");
    const bodyCell = el.locator("tbody tr").nth(15).locator(".entry-body-cell.warning");
    const titleLink = titleCell.locator("a.entry-link");
    const bodyLink = bodyCell.locator("a.entry-link");

    await expect(el.locator(".entry-bar.warning a[href='#conf']")).toHaveCount(2);
    await expect(titleLink).toHaveText("");
    await expect(bodyLink).toHaveText("");
    await expect(titleLink).toHaveAttribute("aria-label", "Conference");
    await expect(bodyLink).toHaveAttribute(
      "aria-label",
      "Conference\nTalks and workshops\nClosing keynote · July 20",
    );
    await expect(bodyLink).not.toHaveAttribute("title");
    await expect(bodyCell).not.toHaveAttribute("title");
    await expect(titleLink).toHaveAccessibleName("Conference");
    await expect(bodyLink).toHaveAccessibleName(
      "Conference\nTalks and workshops\nClosing keynote · July 20",
    );
    await expect(titleLink).toHaveAccessibleDescription("");
    await expect(bodyLink).toHaveAccessibleDescription("");
    await expect(titleCell.locator(".entry-title")).toHaveText("Conference");
    await expect(bodyCell.locator(".entry-detail")).toHaveText("Talks and workshops");
    await expect(bodyCell.locator(".entry-footer")).toHaveText("Closing keynote · July 20");
    await expect(titleCell.locator(".entry-title")).toHaveAttribute("aria-hidden", "true");
    await expect(bodyCell.locator(".entry-body")).toHaveAttribute("aria-hidden", "true");
    await expect(el.locator(".entry-bar.success").first().locator(".entry-title")).not.toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(await titleCell.locator(".entry-title").evaluate((text) => text.closest("a") === null)).toBe(true);
    expect(await bodyCell.locator(".entry-detail").evaluate((text) => text.closest("a") === null)).toBe(true);

    for (const cell of [titleCell, bodyCell]) {
      const inset = await cell.evaluate((element) => {
        const cellRect = element.getBoundingClientRect();
        const linkRect = element.querySelector(".entry-link")!.getBoundingClientRect();
        return {
          top: Math.abs(cellRect.top - linkRect.top),
          right: Math.abs(cellRect.right - linkRect.right),
          bottom: Math.abs(cellRect.bottom - linkRect.bottom),
          left: Math.abs(cellRect.left - linkRect.left),
        };
      });
      expect(Math.max(inset.top, inset.right, inset.bottom, inset.left)).toBeLessThan(1);
    }

    const idleShadow = await titleCell.evaluate((element) => getComputedStyle(element).boxShadow);
    await titleLink.hover();
    const hoverShadow = await titleCell.evaluate((element) => getComputedStyle(element).boxShadow);
    expect(hoverShadow).not.toBe(idleShadow);
    await expect(titleCell.locator(".entry-title")).toHaveCSS("text-decoration-line", "none");
    await expect(bodyCell.locator(".entry-detail")).toHaveCSS("text-decoration-line", "none");
    await expect(bodyCell.locator(".entry-footer")).toHaveCSS("white-space", "nowrap");
    await expect(bodyCell.locator(".entry-footer")).toHaveCSS("text-overflow", "ellipsis");
    await page.emulateMedia({ forcedColors: "active" });
    await titleLink.focus();
    await expect(titleLink).toHaveCSS("outline-style", "solid");
    await page.emulateMedia({ forcedColors: "none" });
    await bodyLink.click({ position: { x: 2, y: 2 } });
    await expect(page).toHaveURL(/#conf$/);
    await expect(el.locator(".entry-bar.success").first().locator("a")).toHaveCount(0);
  });
});
