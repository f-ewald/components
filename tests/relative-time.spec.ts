import { test, expect } from "@playwright/test";

test.describe("relative-time", () => {
  test("formats past and future boundaries under deterministic time", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-07-21T12:00:00Z") });
    await page.goto("/");
    const output = page.locator("#relative-output");

    const values = await output.evaluate(async (element) => {
      const relativeTime = element as HTMLElement & {
        datetime: string;
        updateComplete: Promise<boolean>;
      };
      const render = async (datetime: string) => {
        relativeTime.datetime = datetime;
        await relativeTime.updateComplete;
        return relativeTime.shadowRoot?.textContent ?? "";
      };
      return {
        recent: await render("2026-07-21T11:59:01Z"),
        minuteAgo: await render("2026-07-21T11:59:00Z"),
        sqliteUtc: await render("2026-07-21 09:00:00"),
        future: await render("2026-07-23T12:00:00Z"),
      };
    });

    expect(values).toEqual({
      recent: "just now",
      minuteAgo: "1 minute ago",
      sqliteUtc: "3 hours ago",
      future: "in 2 days",
    });
    await expect(output.locator("span")).toHaveAttribute("title", /.+/);
  });

  test("preserves invalid input and refreshes as time advances", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-07-21T12:00:00Z") });
    await page.goto("/");
    const output = page.locator("#relative-output");

    await output.evaluate(async (element) => {
      const relativeTime = element as HTMLElement & {
        datetime: string;
        updateComplete: Promise<boolean>;
      };
      relativeTime.datetime = "not-a-date";
      await relativeTime.updateComplete;
    });
    await expect(output).toHaveText("not-a-date");
    await expect(output.locator("span")).toHaveCount(0);

    await output.evaluate(async (element) => {
      const relativeTime = element as HTMLElement & {
        datetime: string;
        updateComplete: Promise<boolean>;
      };
      relativeTime.datetime = "2026-07-21T11:59:00Z";
      await relativeTime.updateComplete;
    });
    await expect(output).toHaveText("1 minute ago");
    await page.clock.fastForward(60_000);
    await expect(output).toHaveText("2 minutes ago");
  });
});
