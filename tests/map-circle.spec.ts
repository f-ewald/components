import { test, expect } from "@playwright/test";

test.describe("map-circle", () => {
  test("renders a gradient SVG circle with no point/tail, optional slotted content, and distinct colors produce distinct gradients", async ({ page }) => {
    await page.goto("/");

    const plain = page.locator("#circle-plain");
    await expect(plain.locator("svg")).toBeVisible();
    await expect(plain.locator("circle")).toHaveCount(2); // separate fill + ring circles
    await expect(plain.locator("circle.fill")).toHaveAttribute("fill", /^url\(#map-circle-grad-/);
    await expect(plain.locator("circle.ring")).toHaveAttribute("fill", "none");
    await expect(plain.locator("path")).toHaveCount(0); // no pin-shaped path

    const rank = page.locator("#circle-rank");
    await expect(rank).toContainText("1");
    await expect(rank.locator(".content")).toHaveCSS("font-weight", "700");
    const pointStyle = page.locator("#circle-point");
    await expect(pointStyle.locator("svg")).toHaveAttribute("width", "14");
    await expect(pointStyle.locator("circle.ring")).toHaveAttribute("stroke-width", "3");
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

    await expect(page.locator("#circle-thin-ring circle.ring")).toHaveAttribute("stroke-width", "1.5");
    await expect(page.locator("#circle-default-ring circle.ring")).toHaveAttribute("stroke-width", "2");
    await expect(page.locator("#circle-thick-ring circle.ring")).toHaveAttribute("stroke-width", "6");

    await expect(page.locator("#circle-small svg")).toHaveAttribute("width", "12");
    await expect(page.locator("#circle-big svg")).toHaveAttribute("width", "36");
  });

  test("`ring-opacity` is configurable and drives the rendered ring's translucency", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#circle-ring-opaque circle.ring")).toHaveAttribute("stroke", "rgb(255 255 255 / 1)");
    await expect(page.locator("#circle-ring-default-opacity circle.ring")).toHaveAttribute("stroke", "rgb(255 255 255 / 1)");
    await expect(page.locator("#circle-ring-faint circle.ring")).toHaveAttribute("stroke", "rgb(255 255 255 / 0.25)");
  });

  test("preserves map colors and geometry while removing highlight motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const circle = page.locator("#circle-plain");

    await expect(circle.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(circle.locator("circle.ring")).toHaveAttribute("stroke", "rgb(255 255 255 / 1)");
    await expect(circle.locator("stop").first()).toHaveAttribute("stop-color", "#979ca6");
    await expect(circle.locator("svg")).toHaveCSS("transition-duration", "0s");
  });
});
