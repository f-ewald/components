import { test, expect } from "@playwright/test";

test.describe("map-point", () => {
  test("renders a gradient SVG circle with no point/tail, no slotted content, and distinct colors produce distinct gradients", async ({ page }) => {
    await page.goto("/");

    const plain = page.locator("#point-plain");
    await expect(plain.locator("svg")).toBeVisible();
    await expect(plain.locator("circle")).toHaveAttribute("fill", /^url\(#map-point-grad-/);
    await expect(plain.locator("path")).toHaveCount(0); // no pin-shaped path

    const plainStops = plain.locator("stop");
    await expect(plainStops).toHaveCount(2);
    const transitStops = page.locator("#point-transit stop");
    await expect(plainStops.first()).not.toHaveAttribute(
      "stop-color",
      await transitStops.first().getAttribute("stop-color") ?? ""
    );
  });

  test("`ring-width` and `size` are configurable and drive the rendered SVG", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#point-thin-ring circle")).toHaveAttribute("stroke-width", "1.5");
    await expect(page.locator("#point-default-ring circle")).toHaveAttribute("stroke-width", "3");
    await expect(page.locator("#point-thick-ring circle")).toHaveAttribute("stroke-width", "5");

    await expect(page.locator("#point-small svg")).toHaveAttribute("width", "8");
    await expect(page.locator("#point-big svg")).toHaveAttribute("width", "28");
  });
});
