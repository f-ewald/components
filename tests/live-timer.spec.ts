import { test, expect } from "@playwright/test";

test.describe("live-timer", () => {
  test("ticks deterministically across duration boundaries", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-07-21T12:00:00Z") });
    await page.goto("/");

    const secondsTimer = page.locator("#timer-seconds");
    const compactTimer = page.locator("#timer-compact");
    await secondsTimer.evaluate(async (element) => {
      const timer = element as HTMLElement & {
        since: string;
        updateComplete: Promise<boolean>;
      };
      timer.since = "2026-07-21T11:59:00Z";
      await timer.updateComplete;
    });
    await compactTimer.evaluate(async (element) => {
      const timer = element as HTMLElement & {
        since: string;
        updateComplete: Promise<boolean>;
      };
      timer.since = "2026-07-21T10:59:00Z";
      await timer.updateComplete;
    });

    await expect(secondsTimer).toHaveText("Sleeping for 60 seconds");
    await expect(compactTimer).toHaveText("running for 1h 01m 00s");

    await page.clock.fastForward(1000);
    await expect(secondsTimer).toHaveText("Sleeping for 61 seconds");
    await expect(compactTimer).toHaveText("running for 1h 01m 01s");
  });

  test("clamps future starts, hides invalid starts, and is not a live region", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-07-21T12:00:00Z") });
    await page.goto("/");
    const timer = page.locator("#timer-seconds");

    await timer.evaluate(async (element) => {
      const liveTimer = element as HTMLElement & {
        since: string;
        updateComplete: Promise<boolean>;
      };
      liveTimer.since = "2026-07-21T12:05:00Z";
      await liveTimer.updateComplete;
    });
    await expect(timer).toHaveText("Sleeping for 0 seconds");

    await timer.evaluate(async (element) => {
      const liveTimer = element as HTMLElement & {
        since: string;
        updateComplete: Promise<boolean>;
      };
      liveTimer.since = "not-a-date";
      await liveTimer.updateComplete;
    });
    await expect(timer).toHaveText("");
    await expect(timer).not.toHaveAttribute("aria-live");
    await expect(timer).not.toHaveAttribute("role");
    await expect(timer.locator("[aria-live]")).toHaveCount(0);
  });
});
