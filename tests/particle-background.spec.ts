import { test, expect, type Locator, type Page } from "@playwright/test";

interface Region {
  x0: number;
  x1: number;
}

/**
 * Counts screenshot pixels that differ clearly from white paper, optionally
 * within a horizontal band given as fractions of the element's width. WebGL
 * canvases can't be read back after compositing, so this measures what the
 * user actually sees.
 */
async function ink(page: Page, target: Locator, region: Region = { x0: 0, x1: 1 }): Promise<number> {
  const png = (await target.screenshot()).toString("base64");
  return page.evaluate(
    async ({ png, region }) => {
      const blob = await (await fetch(`data:image/png;base64,${png}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(bitmap, 0, 0);
      const left = Math.round(bitmap.width * region.x0);
      const width = Math.round(bitmap.width * region.x1) - left;
      const { data } = context.getImageData(left, 0, width, bitmap.height);
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (765 - data[i] - data[i + 1] - data[i + 2] > 90) count++;
      }
      return count;
    },
    { png, region },
  );
}

test.describe("particle-background", () => {
  test("paints and animates behind its container's content", async ({ page }) => {
    await page.goto("/#particle-background");
    const field = page.getByTestId("particle-background-demo");
    await expect(field.locator("canvas")).toHaveAttribute("aria-hidden", "true");
    expect(await field.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");

    const layout = await field.evaluate((el) => {
      const host = el.getBoundingClientRect();
      const parent = el.parentElement!.getBoundingClientRect();
      const canvas = el.shadowRoot!.querySelector("canvas")!;
      return {
        widthGap: parent.width - host.width,
        heightGap: parent.height - host.height,
        backing: canvas.width,
        expected: Math.round(el.clientWidth * Math.min(devicePixelRatio, 2)),
      };
    });
    expect(Math.abs(layout.widthGap)).toBeLessThanOrEqual(2);
    expect(Math.abs(layout.heightGap)).toBeLessThanOrEqual(2);
    expect(layout.backing).toBe(layout.expected);

    await expect.poll(() => ink(page, field)).toBeGreaterThan(200);
    const before = (await field.screenshot()).toString("base64");
    await expect.poll(async () => (await field.screenshot()).toString("base64")).not.toBe(before);
  });

  test("follow mode draws the ring around the pointer", async ({ page }) => {
    await page.goto("/#particle-background");
    const field = page.getByTestId("particle-background-demo");
    await field.scrollIntoViewIfNeeded();
    const box = (await field.boundingBox())!;
    const left = { x0: 0, x1: 0.25 };
    const right = { x0: 0.75, x1: 1 };

    await page.mouse.move(box.x + box.width * 0.12, box.y + box.height / 2);
    await expect
      .poll(async () => (await ink(page, field, left)) - 3 * (await ink(page, field, right)))
      .toBeGreaterThan(0);

    await page.mouse.move(box.x + box.width * 0.88, box.y + box.height / 2);
    await expect
      .poll(async () => (await ink(page, field, right)) - 3 * (await ink(page, field, left)))
      .toBeGreaterThan(0);
  });

  test("fills the viewport behind the page unless contained", async ({ page }) => {
    await page.goto("/#particle-background");
    const toggle = page.getByTestId("particle-background-page-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    const field = page.getByTestId("particle-background-page");
    const viewport = page.viewportSize()!;
    expect(await field.boundingBox()).toEqual({ x: 0, y: 0, ...viewport });
    expect(
      await field.evaluate((el) => {
        const style = getComputedStyle(el);
        return [style.position, style.zIndex, style.pointerEvents];
      }),
    ).toEqual(["fixed", "-1", "none"]);

    await toggle.click();
    await expect(field).toHaveCount(0);
  });

  test("draws one still frame for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#particle-background");
    await page.evaluate(() => {
      window.requestAnimationFrame = () => {
        document.body.dataset.particlesAnimated = "true";
        return 1;
      };
      const box = document.createElement("div");
      box.style.cssText = "position: relative; isolation: isolate; width: 30rem; height: 16rem; background: #fff";
      box.innerHTML = '<particle-background data-testid="still-field" contained></particle-background>';
      document.body.prepend(box);
    });

    const field = page.getByTestId("still-field");
    await expect.poll(() => ink(page, field)).toBeGreaterThan(200);
    await expect(page.locator("body")).not.toHaveAttribute("data-particles-animated", "true");
  });
});
