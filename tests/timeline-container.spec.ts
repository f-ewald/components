import { test, expect } from "@playwright/test";

test.describe("timeline-container", () => {
  test("renders a list of entries with relative times and nested content", async ({ page }) => {
    await page.goto("/");
    const timeline = page.locator("#timeline-demo");
    await expect(timeline).toHaveAttribute("role", "list");
    await expect(timeline.locator("timeline-entry")).toHaveCount(8);

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

  test("alternating layout centers the line and swaps the sides every second entry", async ({
    page,
  }) => {
    await page.goto("/");
    const timeline = page.locator("#timeline-alternating");
    await expect(timeline).toHaveAttribute("layout", "alternating");

    const entries = timeline.locator("timeline-entry");
    await expect(entries.first()).toHaveAttribute("alternating", "");

    const container = (await timeline.boundingBox())!;
    const center = container.x + container.width / 2;

    // Every dot sits on the same centered line, regardless of which side the
    // label and body are on.
    for (let index = 0; index < 4; index += 1) {
      const dot = (await entries.nth(index).locator(".dot").boundingBox())!;
      expect(dot.x + dot.width / 2).toBeCloseTo(center, 0);
    }

    const sideOf = async (index: number, selector: string) => {
      const box = (await entries.nth(index).locator(selector).boundingBox())!;
      return box.x + box.width / 2 < center ? "left" : "right";
    };
    expect(await sideOf(0, ".meta")).toBe("left");
    expect(await sideOf(0, ".body")).toBe("right");
    expect(await sideOf(1, ".meta")).toBe("right");
    expect(await sideOf(1, ".body")).toBe("left");
  });

  test("alternating entries take a free-text label, a slotted one, or none", async ({ page }) => {
    await page.goto("/");
    const entries = page.locator("#timeline-alternating timeline-entry");

    await expect(entries.nth(0).locator(".meta")).toHaveText("1987");
    // A slotted label replaces the property, and is styled from the light DOM.
    await expect(entries.nth(2).locator('[slot="label"]')).toBeVisible();
    // With neither a label nor a datetime, that side collapses instead of
    // leaving an empty box holding the head row's gap open.
    await expect(entries.nth(3).locator(".time")).toBeHidden();
  });

  test("an alternating entry stretches its line over a consumer-set height", async ({ page }) => {
    await page.goto("/");
    const entry = page.locator("#timeline-alternating timeline-entry").nth(1);

    // A consumer sizing entries taller than their content — a snapped deck,
    // say — must not leave the line spanning only the content, which would
    // break it between consecutive entries.
    await entry.evaluate((el) => {
      (el as HTMLElement).style.minHeight = "500px";
    });

    const host = (await entry.boundingBox())!;
    const above = (await entry.locator(".line-top").boundingBox())!;
    const below = (await entry.locator(".line-bottom").boundingBox())!;
    expect(above.y).toBeCloseTo(host.y, 0);
    expect(below.y + below.height).toBeCloseTo(host.y + host.height, 0);
  });

  test("switching back to the left layout restores the inline arrangement", async ({ page }) => {
    await page.goto("/");
    const timeline = page.locator("#timeline-alternating");
    const first = timeline.locator("timeline-entry").first();

    await page.getByTestId("timeline-layout-toggle").click();
    await expect(timeline).toHaveAttribute("layout", "left");
    await expect(first).not.toHaveAttribute("alternating", "");
    await expect(first.locator(".meta")).toHaveCount(0);
    await expect(first.locator(".head .time")).toHaveText("1987");
  });
});
