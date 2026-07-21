import { test, expect } from "@playwright/test";

test.describe("calendar-entry", () => {
  test("stores entry metadata and stays hidden", async ({ page }) => {
    await page.goto("/");
    const entry = page.locator("#cm-entry-vacation");

    const metadata = await entry.evaluate(async (element) => {
      const calendarEntry = element as HTMLElement & {
        start: string;
        end: string;
        label: string;
        color: string;
        href?: string;
        updateComplete: Promise<boolean>;
      };
      await calendarEntry.updateComplete;
      return {
        start: calendarEntry.start,
        end: calendarEntry.end,
        label: calendarEntry.label,
        color: calendarEntry.color,
        href: calendarEntry.href,
        display: getComputedStyle(calendarEntry).display,
        title: calendarEntry.querySelector('[slot="title"]')?.textContent,
        details: Array.from(calendarEntry.querySelectorAll('[slot="detail"]'), (detail) => detail.textContent),
        footer: calendarEntry.querySelector('[slot="footer"]')?.textContent,
      };
    });

    expect(metadata.start).toBe("2026-07-10");
    expect(metadata.end).toBe("2026-07-18");
    expect(metadata.label).toBe("Vacation");
    expect(metadata.color).toBe("success");
    expect(metadata.href).toBeUndefined();
    expect(metadata.display).toBe("none");
    expect(metadata.title).toBe("Vacation");
    expect(metadata.details).toEqual([
      "Out of office",
      "Road trip along the California coast with several scenic stops",
    ]);
    expect(metadata.footer).toBe("Return July 19 at 6 PM");

    await expect(page.locator("#calendar-month-demo")).toContainText("Vacation");
  });
});
