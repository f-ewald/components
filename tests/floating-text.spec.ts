import { test, expect, type Locator } from "@playwright/test";

/** Each floating character's vertical lift, in `em` of the host's font size (up is positive). */
function lifts(text: Locator): Promise<number[]> {
  return text.evaluate((el) => {
    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    return [...el.shadowRoot!.querySelectorAll<HTMLElement>(".float")].map(
      (float) => -new DOMMatrix(getComputedStyle(float).transform).m42 / fontSize,
    );
  });
}

test.describe("floating-text", () => {
  test("reads as one word and floats its last characters, highest last", async ({ page }) => {
    await page.goto("/#floating-text");
    const text = page.getByTestId("floating-text-demo");
    await expect(text.locator(".sr-only")).toHaveText("Antigravity");
    await expect(text.locator(".word")).toHaveAttribute("aria-hidden", "true");
    await expect(text.locator(".float")).toHaveText(["i", "t", "y"]);

    await expect.poll(async () => (await lifts(text))[2]).toBeCloseTo(0.45, 2);
    const [first, second, last] = await lifts(text);
    expect(first).toBeGreaterThan(0);
    expect(second).toBeGreaterThan(first);
    expect(last).toBeGreaterThan(second);
  });

  test("settles below the viewport and floats again when scrolled back", async ({ page }) => {
    await page.goto("/#floating-text");
    const text = page.getByTestId("floating-text-demo");
    await expect.poll(async () => (await lifts(text))[2]).toBeGreaterThan(0.4);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(text).not.toBeInViewport();
    await expect.poll(async () => Math.max(...(await lifts(text)))).toBeLessThan(0.01);

    await text.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await lifts(text))[2]).toBeGreaterThan(0.4);
  });

  test("re-splits when its text or float-count changes", async ({ page }) => {
    await page.goto("/#floating-text");
    const text = page.getByTestId("floating-text-demo");
    await page.getByTestId("floating-text-count").selectOption("5");
    await page.getByTestId("floating-text-input").fill("Lift 🚀 off");
    await expect(text.locator(".sr-only")).toHaveText("Lift 🚀 off");
    await expect(text.locator(".float")).toHaveText(["🚀", " ", "o", "f", "f"]);
  });

  test("sits in its floated pose without animating for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#floating-text");
    const text = page.getByTestId("floating-text-demo");
    await expect.poll(async () => (await lifts(text))[2]).toBeCloseTo(0.45, 2);
    expect(await text.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
  });
});
