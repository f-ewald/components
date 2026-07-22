import { test, expect } from "@playwright/test";

test.describe("map-circle", () => {
  test("renders a gradient SVG circle with no point/tail, optional slotted content, and distinct colors produce distinct gradients", async ({ page }) => {
    await page.goto("/");

    const plain = page.locator("#circle-plain");
    await expect(plain.locator("svg")).toBeVisible();
    await expect(plain.locator("circle")).toHaveAttribute("fill", /^url\(#map-circle-grad-/);
    await expect(plain.locator("path")).toHaveCount(0); // no pin-shaped path

    const rank = page.locator("#circle-rank");
    await expect(rank).toContainText("1");
    const pointStyle = page.locator("#circle-point");
    await expect(pointStyle.locator("svg")).toHaveAttribute("width", "14");
    await expect(pointStyle.locator("circle")).toHaveAttribute("stroke-width", "3");
    await expect(pointStyle.locator(".content")).toHaveText("");

    const plainStops = plain.locator("stop");
    await expect(plainStops).toHaveCount(2);
    const homeStops = page.locator("#circle-home stop");
    await expect(plainStops.first()).not.toHaveAttribute(
      "stop-color",
      await homeStops.first().getAttribute("stop-color") ?? ""
    );
  });

  test("`highlighted` reflects as an attribute and toggles via the demo button", async ({ page }) => {
    await page.goto("/");
    const circle = page.locator("#circle-highlight-demo");

    await expect(circle).not.toHaveAttribute("highlighted", "");
    await page.locator("#circle-highlight-toggle").click();
    await expect(circle).toHaveAttribute("highlighted", "");
    await page.locator("#circle-highlight-toggle").click();
    await expect(circle).not.toHaveAttribute("highlighted", "");
  });

  test("`ring-width` and `size` are configurable and drive the rendered SVG", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#circle-thin-ring circle")).toHaveAttribute("stroke-width", "1.5");
    await expect(page.locator("#circle-default-ring circle")).toHaveAttribute("stroke-width", "4");
    await expect(page.locator("#circle-thick-ring circle")).toHaveAttribute("stroke-width", "6");

    await expect(page.locator("#circle-small svg")).toHaveAttribute("width", "12");
    await expect(page.locator("#circle-big svg")).toHaveAttribute("width", "36");
  });

  test("preserves map colors and geometry while removing highlight motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const circle = page.locator("#circle-plain");

    await expect(circle.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(circle.locator("circle")).toHaveAttribute("stroke", "#ffffff");
    await expect(circle.locator("stop").first()).toHaveAttribute("stop-color", "#979ca6");
    await expect(circle.locator("svg")).toHaveCSS("transition-duration", "0s");
  });
});
