import { test, expect, type Locator } from "@playwright/test";

/** Counts the canvas pixels the fire currently paints (non-transparent). */
async function litPixels(fire: Locator): Promise<number> {
  return fire.evaluate((el) => {
    const canvas = el.shadowRoot!.querySelector("canvas")!;
    const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    let lit = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit++;
    return lit;
  });
}

test.describe("pixel-fire", () => {
  test("burns full width along the bottom of its container", async ({ page }) => {
    await page.goto("/#pixel-fire");
    const fire = page.getByTestId("pixel-fire-demo");
    const canvas = fire.locator("canvas");
    await expect(canvas).toHaveAttribute("aria-hidden", "true");
    await expect.poll(() => litPixels(fire)).toBeGreaterThan(0);

    const container = await fire.evaluate((el) => {
      const host = el.getBoundingClientRect();
      const parent = el.parentElement!.getBoundingClientRect();
      const box = el.shadowRoot!.querySelector("canvas")!;
      return {
        widthGap: parent.width - host.width,
        bottomGap: parent.bottom - host.bottom,
        cols: box.width,
        hostWidth: el.clientWidth,
      };
    });
    expect(Math.abs(container.widthGap)).toBeLessThanOrEqual(2);
    expect(Math.abs(container.bottomGap)).toBeLessThanOrEqual(1);
    expect(container.cols).toBe(Math.ceil(container.hostWidth / 4));

    await page.getByTestId("pixel-fire-size").selectOption("8");
    await expect
      .poll(() => fire.evaluate((el) => el.shadowRoot!.querySelector("canvas")!.width))
      .toBe(Math.ceil(container.hostWidth / 8));
  });

  test("burns out at zero intensity", async ({ page }) => {
    await page.goto("/#pixel-fire");
    const fire = page.getByTestId("pixel-fire-demo");
    await expect.poll(() => litPixels(fire)).toBeGreaterThan(0);

    await page.getByTestId("pixel-fire-intensity").fill("0");
    await expect.poll(() => litPixels(fire), { timeout: 10_000 }).toBe(0);
  });

  test("pins to the bottom of the viewport unless contained", async ({ page }) => {
    await page.goto("/#pixel-fire");
    const toggle = page.getByTestId("pixel-fire-page-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    const fire = page.getByTestId("pixel-fire-page");
    const viewport = page.viewportSize()!;
    const box = (await fire.boundingBox())!;
    expect(box.x).toBe(0);
    expect(box.width).toBe(viewport.width);
    expect(box.y + box.height).toBe(viewport.height);
    expect(await fire.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");

    await toggle.click();
    await expect(fire).toHaveCount(0);
  });

  test("draws one still frame for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#pixel-fire");
    await page.evaluate(() => {
      window.requestAnimationFrame = () => {
        document.body.dataset.pixelFireAnimated = "true";
        return 1;
      };
      const box = document.createElement("div");
      box.style.cssText = "position: relative; width: 20rem; height: 8rem";
      box.innerHTML = '<pixel-fire data-testid="still-fire" contained></pixel-fire>';
      document.body.appendChild(box);
    });

    const fire = page.getByTestId("still-fire");
    await expect.poll(() => litPixels(fire)).toBeGreaterThan(0);
    await expect(page.locator("body")).not.toHaveAttribute("data-pixel-fire-animated", "true");
  });
});
