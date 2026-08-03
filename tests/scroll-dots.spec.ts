import { test, expect } from "@playwright/test";

test.describe("scroll-dots", () => {
  test("renders one dot per item, elongates the active one, and shrinks muted ones", async ({
    page,
  }) => {
    await page.goto("/");
    const rail = page.locator("#scroll-dots-demo");
    const dots = rail.locator("button");
    await expect(dots).toHaveCount(6);

    await expect(dots.first()).toHaveAttribute("aria-label", "Introduction");
    await expect(dots.first()).toHaveAttribute("aria-current", "true");
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "false");

    // The active dot is an elongated bar rather than a dot; muted items are smaller.
    const active = await dots.first().boundingBox();
    const idle = await dots.nth(1).boundingBox();
    const muted = await dots.nth(4).boundingBox();
    expect(active!.height).toBeGreaterThan(idle!.height * 2);
    expect(active!.width).toBeCloseTo(idle!.width, 0);
    expect(muted!.height).toBeLessThan(idle!.height);
  });

  test("is controlled — a click only reports, and active follows the consumer", async ({
    page,
  }) => {
    await page.goto("/");
    const rail = page.locator("#scroll-dots-demo");

    await rail.locator("button").nth(3).click();
    await expect(page.getByTestId("scroll-dots-active")).toContainText("San Francisco");
    await expect(rail.locator("button").nth(3)).toHaveAttribute("aria-current", "true");

    // A second, independently rendered rail follows the same consumer state.
    await expect(page.locator("#scroll-dots-colored button").nth(3)).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.getByTestId("scroll-dots-prev").click();
    await expect(rail.locator("button").nth(2)).toHaveAttribute("aria-current", "true");
  });

  test("derives the active dot's gradient from color, and never transitions its size", async ({
    page,
  }) => {
    await page.goto("/");
    const gradientOf = (selector: string) =>
      page.locator(selector).evaluate((el) => getComputedStyle(el).backgroundImage);

    const primary = await gradientOf("#scroll-dots-demo button[aria-current='true']");
    const teal = await gradientOf("#scroll-dots-colored button[aria-current='true']");
    expect(primary).toContain("linear-gradient");
    expect(teal).toContain("linear-gradient");
    expect(teal).not.toBe(primary);

    // Size is a layout property: transitioning it would animate on the main
    // thread, where it can be starved into a couple of frames.
    const transition = await page
      .locator("#scroll-dots-demo button")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(transition).toBe("opacity");
  });
});
