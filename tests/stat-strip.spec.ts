import { test, expect } from "@playwright/test";

test.describe("stat-strip", () => {
  test("renders each item's figure and caption in order", async ({ page }) => {
    await page.goto("/");
    const items = page.locator("#stat-strip-demo .item");
    await expect(items).toHaveCount(4);
    await expect(items.nth(0).locator(".value")).toHaveText("54%");
    await expect(items.nth(0).locator(".label")).toHaveText("less code");
    await expect(items.nth(3).locator(".value")).toHaveText("100%");
    await expect(items.nth(3).locator(".label")).toHaveText("safety kept");
  });

  test("renders nothing when items is empty", async ({ page }) => {
    await page.goto("/");
    const isEmpty = await page.evaluate(async () => {
      const el = document.createElement("stat-strip") as HTMLElement & {
        updateComplete: Promise<unknown>;
      };
      document.body.append(el);
      await el.updateComplete;
      const empty = el.shadowRoot!.textContent!.trim().length === 0;
      el.remove();
      return empty;
    });
    expect(isEmpty).toBe(true);
  });
});
