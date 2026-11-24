import { test, expect, type Locator } from "@playwright/test";

/** The glow's center relative to its host's box, in 0–1 units. */
async function spotCenter(field: Locator): Promise<{ x: number; y: number }> {
  return field.evaluate((el) => {
    const host = el.getBoundingClientRect();
    const spot = el.shadowRoot!.querySelector(".spot")!.getBoundingClientRect();
    return {
      x: (spot.left + spot.width / 2 - host.left) / host.width,
      y: (spot.top + spot.height / 2 - host.top) / host.height,
    };
  });
}

test.describe("blur-background", () => {
  test("paints a recolorable glow behind its container's content and drifts", async ({ page }) => {
    await page.goto("/#blur-background");
    const field = page.getByTestId("blur-background-demo");
    await expect(field.locator(".spot")).toHaveAttribute("aria-hidden", "true");
    expect(await field.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");

    const layout = await field.evaluate((el) => {
      const host = el.getBoundingClientRect();
      const parent = el.parentElement!.getBoundingClientRect();
      const spot = el.shadowRoot!.querySelector(".spot")!;
      return {
        widthGap: parent.width - host.width,
        heightGap: parent.height - host.height,
        diameter: spot.clientWidth / Math.min(host.width, host.height),
      };
    });
    expect(Math.abs(layout.widthGap)).toBeLessThanOrEqual(2);
    expect(Math.abs(layout.heightGap)).toBeLessThanOrEqual(2);
    expect(layout.diameter).toBeCloseTo(0.9, 2);

    await page.getByTestId("blur-background-color").fill("#008080");
    await expect
      .poll(() => field.evaluate((el) => getComputedStyle(el.shadowRoot!.querySelector(".spot")!).backgroundImage))
      .toContain("rgb(0, 128, 128)");

    const before = await spotCenter(field);
    await expect.poll(async () => (await spotCenter(field)).x).not.toBeCloseTo(before.x, 3);
  });

  test("follow mode eases the glow toward the pointer", async ({ page }) => {
    await page.goto("/#blur-background");
    const field = page.getByTestId("blur-background-demo");
    await field.scrollIntoViewIfNeeded();
    const box = (await field.boundingBox())!;

    await page.mouse.move(box.x + box.width * 0.12, box.y + box.height * 0.25);
    await expect.poll(async () => (await spotCenter(field)).x).toBeLessThan(0.2);
    expect((await spotCenter(field)).y).toBeLessThan(0.4);

    await page.mouse.move(box.x + box.width * 0.88, box.y + box.height * 0.75);
    await expect.poll(async () => (await spotCenter(field)).x).toBeGreaterThan(0.8);
    expect((await spotCenter(field)).y).toBeGreaterThan(0.6);
  });

  test("fills the viewport behind the page unless contained", async ({ page }) => {
    await page.goto("/#blur-background");
    const toggle = page.getByTestId("blur-background-page-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    const field = page.getByTestId("blur-background-page");
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

  test("rests in the center without animating under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#blur-background");
    await page.evaluate(() => {
      window.requestAnimationFrame = () => {
        document.body.dataset.blurAnimated = "true";
        return 1;
      };
      const box = document.createElement("div");
      box.style.cssText = "position: relative; isolation: isolate; width: 30rem; height: 16rem";
      box.innerHTML = '<blur-background data-testid="still-glow" contained mode="follow"></blur-background>';
      document.body.prepend(box);
    });

    const field = page.getByTestId("still-glow");
    const box = (await field.boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + 10);
    const center = await spotCenter(field);
    expect(center.x).toBeCloseTo(0.5, 2);
    expect(center.y).toBeCloseTo(0.5, 2);
    await expect(page.locator("body")).not.toHaveAttribute("data-blur-animated", "true");
  });
});
