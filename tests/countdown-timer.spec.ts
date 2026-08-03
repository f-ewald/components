import { test, expect } from "@playwright/test";

test.describe("countdown-timer", () => {
  test("ticks deterministically across duration boundaries", async ({ page }) => {
    // `install` alone lets real wall-clock time keep progressing; `pauseAt`
    // freezes it so only explicit `fastForward` calls advance the timer.
    await page.clock.install({ time: new Date("2026-07-21T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-07-21T12:00:00Z"));
    await page.goto("/");

    const secondsTimer = page.locator("#countdown-seconds");
    const compactTimer = page.locator("#countdown-compact");
    await secondsTimer.evaluate(async (element) => {
      const timer = element as HTMLElement & {
        until: string;
        updateComplete: Promise<boolean>;
      };
      timer.until = "2026-07-21T12:01:00Z";
      await timer.updateComplete;
    });
    await compactTimer.evaluate(async (element) => {
      const timer = element as HTMLElement & {
        until: string;
        updateComplete: Promise<boolean>;
      };
      timer.until = "2026-07-21T13:01:00Z";
      await timer.updateComplete;
    });

    await expect(secondsTimer).toHaveText("Retrying in 60 seconds");
    await expect(compactTimer).toHaveText("retrying in 1h 01m 00s");

    await page.clock.fastForward(1000);
    await expect(secondsTimer).toHaveText("Retrying in 59 seconds");
    await expect(compactTimer).toHaveText("retrying in 1h 00m 59s");
  });

  test("clamps a past target to zero, hides an invalid target, and is not a live region", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-07-21T12:00:00Z") });
    await page.goto("/");
    const timer = page.locator("#countdown-seconds");

    await timer.evaluate(async (element) => {
      const countdownTimer = element as HTMLElement & {
        until: string;
        updateComplete: Promise<boolean>;
      };
      countdownTimer.until = "2026-07-21T11:55:00Z";
      await countdownTimer.updateComplete;
    });
    await expect(timer).toHaveText("Retrying in 0 seconds");

    await timer.evaluate(async (element) => {
      const countdownTimer = element as HTMLElement & {
        until: string;
        updateComplete: Promise<boolean>;
      };
      countdownTimer.until = "not-a-date";
      await countdownTimer.updateComplete;
    });
    await expect(timer).toHaveText("");
    await expect(timer).not.toHaveAttribute("aria-live");
    await expect(timer).not.toHaveAttribute("role");
    await expect(timer.locator("[aria-live]")).toHaveCount(0);
  });
});
