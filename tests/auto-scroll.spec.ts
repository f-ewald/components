import { test, expect } from "@playwright/test";

test.describe("auto-scroll", () => {
  test("stays pinned and auto-follows when a child is appended while at the bottom", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#auto-scroll-demo");
    await expect(host).toHaveAttribute("pinned", "");

    await page.locator("#auto-scroll-add").click();
    await expect(async () => {
      const atBottom = await host.evaluate(
        (el) => el.scrollHeight - el.scrollTop - el.clientHeight <= 1,
      );
      expect(atBottom).toBe(true);
    }).toPass();
  });

  test("does not yank the scroll position when the user has scrolled up", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#auto-scroll-demo");
    const add = page.locator("#auto-scroll-add");

    // Grow the content enough to overflow the fixed-height host first.
    await add.click();
    await add.click();

    await host.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect(host).not.toHaveAttribute("pinned", "");
    const scrollTopBefore = await host.evaluate((el) => el.scrollTop);

    await add.click();
    const scrollTopAfter = await host.evaluate((el) => el.scrollTop);
    expect(scrollTopAfter).toBe(scrollTopBefore);
  });

  test("pinned-change shows the jump-to-latest affordance, scrollToBottom() re-pins", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#auto-scroll-demo");
    const jump = page.locator("#auto-scroll-jump");
    const add = page.locator("#auto-scroll-add");

    await add.click();
    await add.click();
    await expect(jump).toBeHidden();

    await host.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect(jump).toBeVisible();

    await jump.click();
    await expect(host).toHaveAttribute("pinned", "");
    await expect(jump).toBeHidden();
  });
});
