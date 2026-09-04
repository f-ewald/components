import { test, expect } from "@playwright/test";

test.describe("comment-label", () => {
  test("renders the default ## prefix before the slotted text", async ({ page }) => {
    await page.goto("/");
    const label = page.locator("#comment-label-demo");
    await expect(label.locator(".prefix")).toHaveText("##");
    // The slotted text lives in the light DOM; the shadow `.content` span only
    // hosts the <slot> element, so its own textContent reads empty.
    await expect(label).toContainText("the_whole_idea");
  });

  test("a custom prefix and italic render for the footer-quote usage", async ({ page }) => {
    await page.goto("/");
    const quote = page.locator("comment-label[prefix='//'][italic]");
    await expect(quote.locator(".prefix")).toHaveText("//");
    const fontStyle = await quote.evaluate((el) => getComputedStyle(el).fontStyle);
    expect(fontStyle).toBe("italic");
    // The marker itself stays upright even while the message turns italic.
    const prefixStyle = await quote
      .locator(".prefix")
      .evaluate((el) => getComputedStyle(el).fontStyle);
    expect(prefixStyle).toBe("normal");
  });
});
