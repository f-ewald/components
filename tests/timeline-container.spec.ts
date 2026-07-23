import { test, expect } from "@playwright/test";

test.describe("timeline-container", () => {
  test("renders a list of entries with relative times and nested content", async ({ page }) => {
    await page.goto("/");
    const timeline = page.locator("#timeline-demo");
    await expect(timeline).toHaveAttribute("role", "list");
    await expect(timeline.locator("timeline-entry")).toHaveCount(4);

    // Relative time renders from the datetime the demo sets on each entry.
    await expect(timeline.locator("relative-time").first()).toContainText(/ago|now/i);

    // Content nests seamlessly (a status pill and an avatar).
    await expect(timeline).toContainText("In Review");
    await expect(timeline.locator("user-avatar")).toHaveCount(1);
  });

  test("caps the connecting line at the first and last dots", async ({ page }) => {
    await page.goto("/");
    const entries = page.locator("#timeline-demo timeline-entry");
    const first = entries.first();
    const last = entries.last();

    await expect(first.locator(".dot")).toBeVisible();
    // First entry: no line above its dot, but a line below toward the next dot.
    await expect(first.locator(".line-top")).toBeHidden();
    await expect(first.locator(".line-bottom")).toBeVisible();
    // Last entry: a line above from the previous dot, but nothing below.
    await expect(last.locator(".line-top")).toBeVisible();
    await expect(last.locator(".line-bottom")).toBeHidden();
  });
});
