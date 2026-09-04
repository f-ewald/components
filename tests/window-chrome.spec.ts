import { test, expect } from "@playwright/test";

test.describe("window-chrome", () => {
  test("renders three decorative dots, the label, and slotted actions", async ({ page }) => {
    await page.goto("/");
    const chrome = page.locator("#window-chrome-demo");
    await expect(chrome.locator(".dots")).toHaveAttribute("aria-hidden", "true");
    await expect(chrome.locator(".dot")).toHaveCount(3);
    await expect(chrome.locator(".label")).toHaveText("~/product — README.md");
    await expect(page.locator("#window-chrome-toggle")).toBeVisible();
  });

  test("sticks to the top of its scroll container", async ({ page }) => {
    await page.goto("/");
    const position = await page
      .locator("#window-chrome-demo")
      .evaluate((el) => getComputedStyle(el).position);
    // The playground overrides this to "static" for the demo box (see index.html);
    // a plain instance defaults to sticky.
    expect(position).toBe("static");
    const defaultPosition = await page.evaluate(async () => {
      const el = document.createElement("window-chrome") as HTMLElement & {
        updateComplete: Promise<unknown>;
      };
      document.body.append(el);
      await el.updateComplete;
      const value = getComputedStyle(el).position;
      el.remove();
      return value;
    });
    expect(defaultPosition).toBe("sticky");
  });
});
