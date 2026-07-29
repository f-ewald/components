import { test, expect } from "@playwright/test";

test.describe("timeline-entry", () => {
  test("renders a dot, headline, relative time, and nested content as a list item", async ({
    page,
  }) => {
    await page.goto("/");
    const entry = page.locator('[data-testid="timeline-e2"]');
    await expect(entry).toHaveAttribute("role", "listitem");
    await expect(entry.locator(".dot")).toBeVisible();
    await expect(entry).toContainText("Review approved"); // headline slot
    await expect(entry.locator("relative-time")).toContainText(/ago|now/i);
    await expect(entry.locator("user-avatar")).toHaveCount(1); // nested default-slot content
  });

  test("collapses the headline row when no headline is slotted", async ({ page }) => {
    await page.goto("/");
    const display = await page.evaluate(async () => {
      const entry = document.createElement("timeline-entry") as HTMLElement & {
        updateComplete: Promise<unknown>;
      };
      entry.setAttribute("datetime", new Date().toISOString());
      entry.textContent = "Content only";
      document.body.append(entry);
      await entry.updateComplete;
      const headline = entry.shadowRoot!.querySelector(".headline")!;
      const value = getComputedStyle(headline).display;
      entry.remove();
      return value;
    });
    expect(display).toBe("none");
  });

  test("colors the dot from the shared status-pill palette", async ({ page }) => {
    await page.goto("/");
    const expected: Record<string, string> = {
      "timeline-e1": "primary", // default (no color attribute)
      "timeline-e2": "success",
      "timeline-e3": "info",
      "timeline-e4": "warning",
      "timeline-e5": "danger",
      "timeline-e6": "neutral",
    };
    for (const [testid, color] of Object.entries(expected)) {
      await expect(
        page.locator(`[data-testid="${testid}"]`).locator(`.dot.${color}`),
      ).toHaveCount(1);
    }
  });

  test("compact entry tightens spacing and mutes the content", async ({ page }) => {
    await page.goto("/");
    const entry = page.locator('[data-testid="timeline-e7"]');
    await expect(entry).toHaveAttribute("compact", "");
    const paddingBottom = await entry.evaluate(
      (el) => getComputedStyle(el.shadowRoot!.querySelector(".body")!).paddingBottom,
    );
    // 0.5rem compact vs the default 1.5rem (24px) — assert it's tightened.
    expect(parseFloat(paddingBottom)).toBeLessThan(24);
  });

  test("running entry shows a spinner instead of the dot", async ({ page }) => {
    await page.goto("/");
    const entry = page.locator('[data-testid="timeline-e8"]');
    await expect(entry).toHaveAttribute("running", "");
    await expect(entry.locator(".spinner")).toBeVisible();
    await expect(entry.locator(".dot")).toHaveCount(0);
  });

  test("reduced motion makes the running spinner static", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const animationName = await page
      .locator('[data-testid="timeline-e8"]')
      .evaluate((el) => getComputedStyle(el.shadowRoot!.querySelector(".spinner")!).animationName);
    expect(animationName).toBe("none");
  });
});
