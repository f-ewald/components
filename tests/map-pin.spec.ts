import { test, expect } from "@playwright/test";

test.describe("map-pin", () => {
  test("renders a gradient SVG pin with slotted content, and distinct colors produce distinct gradients", async ({ page }) => {
    await page.goto("/");

    const rank1 = page.locator("#pin-rank-1");
    await expect(rank1).toContainText("1");
    await expect(rank1.locator("svg")).toBeVisible();
    await expect(rank1.locator("path")).toHaveAttribute("fill", /^url\(#map-pin-grad-/);

    const rank1Stops = rank1.locator("stop");
    await expect(rank1Stops).toHaveCount(2);
    const homeStops = page.locator("#pin-home stop");
    // Different `color` props must produce different gradient stops (not a shared/cached gradient).
    await expect(rank1Stops.first()).not.toHaveAttribute(
      "stop-color",
      await homeStops.first().getAttribute("stop-color") ?? ""
    );
  });

  test("`highlighted` reflects as an attribute and toggles via the demo button", async ({ page }) => {
    await page.goto("/");
    const pin = page.locator("#pin-highlight-demo");

    await expect(pin).not.toHaveAttribute("highlighted", "");
    await page.locator("#pin-highlight-toggle").click();
    await expect(pin).toHaveAttribute("highlighted", "");
    await page.locator("#pin-highlight-toggle").click();
    await expect(pin).not.toHaveAttribute("highlighted", "");
  });
});
