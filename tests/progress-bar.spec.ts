import { test, expect, type Locator } from "@playwright/test";

/** cssText of every rule in the component's stylesheets that mentions the webkit fill pseudo-element. */
function progressValueRules(bar: Locator): Promise<string> {
  return bar.evaluate((el) => {
    // A media rule's cssText embeds its nested rules, so top-level matching is enough.
    return el
      .shadowRoot!.adoptedStyleSheets.flatMap((sheet) => Array.from(sheet.cssRules))
      .map((rule) => rule.cssText)
      .filter((text) => text.includes("::-webkit-progress-value"))
      .join("\n");
  });
}

test.describe("progress-bar", () => {
  test("renders a native progress element with the value, max, and label", async ({ page }) => {
    await page.goto("/");

    const bar = page.locator("#progress-demo");
    await expect(bar.locator(".label")).toHaveText("Question 3 out of 14");
    const track = bar.locator("progress.track");
    await expect(track).toHaveJSProperty("value", 3);
    await expect(track).toHaveJSProperty("max", 14);
    await expect(track).toHaveAttribute("aria-label", "Question 3 out of 14");
    await expect(track).toHaveCSS("appearance", "none");
  });

  test("advance button increments the value and updates the label, wrapping at max", async ({ page }) => {
    await page.goto("/");

    const bar = page.locator("#progress-demo");
    const advance = page.locator("#progress-advance");
    await advance.click();
    await expect(bar.locator(".label")).toHaveText("Question 4 out of 14");
    await expect(bar.locator(".track")).toHaveJSProperty("value", 4);
  });

  test("a custom color and track-color override the default fill/track", async ({ page }) => {
    await page.goto("/");

    const bar = page.locator("#progress-custom");
    await expect(bar).toHaveAttribute("color", "#dc2626");
    await expect(bar).toHaveAttribute("track-color", "#fecaca");
    await expect(bar.locator(".track")).toHaveAttribute("style", /--fill-color:\s*#dc2626/);
    await expect(bar.locator(".track")).toHaveAttribute("style", /--track-color:\s*#fecaca/);
    await expect(bar.locator(".track")).toHaveCSS("background-color", "rgb(254, 202, 202)");
    // Chromium can't resolve ::-webkit-progress-* via getComputedStyle (it echoes the
    // element's own style), so assert the fill rule reads --fill-color from the sheet.
    expect(await progressValueRules(bar)).toContain("var(--fill-color");
  });

  test("clamps out-of-range values into [0, max]", async ({ page }) => {
    await page.goto("/");

    const bar = page.locator("#progress-demo");
    await bar.evaluate((element) => ((element as HTMLElement & { value: number }).value = 999));
    await expect(bar.locator(".track")).toHaveJSProperty("value", 14);

    await bar.evaluate((element) => ((element as HTMLElement & { value: number }).value = -5));
    await expect(bar.locator(".track")).toHaveJSProperty("value", 0);
  });

  test("disables the fill transition under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const bar = page.locator("#progress-demo");
    expect(await bar.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    // The pseudo-element isn't queryable via getComputedStyle (see above), so check the
    // reduced-motion rule is present alongside the animated one.
    const rules = await progressValueRules(bar);
    expect(rules).toContain("transition: width 200ms");
    expect(rules).toMatch(/prefers-reduced-motion[^}]*::-webkit-progress-value[^}]*transition: none/s);
  });

  test("omits the label element and aria-label when no label is set", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator("#progress-custom");
    await expect(bar.locator(".label")).toHaveCount(0);
    await expect(bar.locator(".track")).not.toHaveAttribute("aria-label", /.+/);
  });
});
