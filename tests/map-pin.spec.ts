import { test, expect } from "@playwright/test";

test.describe("map-pin", () => {
  test("renders a gradient SVG pin with slotted content, and distinct colors produce distinct gradients", async ({ page }) => {
    await page.goto("/");

    const rank1 = page.locator("#pin-rank-1");
    await expect(rank1).toContainText("1");
    await expect(rank1.locator(".content")).toHaveCSS("font-weight", "700");
    await expect(rank1.locator("svg")).toBeVisible();
    await expect(rank1.locator("path")).toHaveCount(2); // separate ring + fill paths
    await expect(rank1.locator("path.fill")).toHaveAttribute("fill", /^url\(#map-pin-grad-/);
    await expect(rank1.locator("path.ring")).toHaveAttribute("fill", "none");

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

  test("`ring-opacity` is configurable and drives the rendered ring's translucency", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#pin-ring-opaque path.ring")).toHaveAttribute("stroke", "rgb(255 255 255 / 1)");
    await expect(page.locator("#pin-ring-default-opacity path.ring")).toHaveAttribute("stroke", "rgb(255 255 255 / 1)");
    await expect(page.locator("#pin-ring-faint path.ring")).toHaveAttribute("stroke", "rgb(255 255 255 / 0.25)");
  });

  test("preserves map colors and geometry while removing highlight motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const pin = page.locator("#pin-rank-1");

    await expect(pin.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(pin.locator("path.ring")).toHaveAttribute("stroke", "rgb(255 255 255 / 1)");
    await expect(pin.locator("stop").first()).toHaveAttribute("stop-color", "#5f9def");
    await expect(pin.locator("svg")).toHaveCSS("transition-duration", "0s");
  });
});
