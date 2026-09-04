import { test, expect } from "@playwright/test";

test.describe("code-diff", () => {
  test("renders the header bar and each line with its always-on +/- prefix", async ({ page }) => {
    await page.goto("/");
    const diff = page.locator("#code-diff-demo");
    await expect(diff.locator(".filename")).toHaveText("cache.py");
    await expect(diff.locator(".stat")).toHaveText("−48  +1");

    const lines = diff.locator(".line");
    await expect(lines).toHaveCount(5);
    await expect(lines.nth(0)).toHaveClass(/del/);
    await expect(lines.nth(0).locator(".text")).toContainText("- class CacheManager:");
    await expect(lines.nth(3)).toHaveClass(/add/);
    await expect(lines.nth(3).locator(".text")).toContainText("+ @lru_cache(maxsize=1000)");

    // Line numbers count every row, including the blank context line.
    await expect(lines.nth(2).locator(".number")).toHaveText("3");
  });
});
