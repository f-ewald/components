import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Counts screenshot pixels that differ clearly from white paper. WebGL canvases can't be read back after
 * compositing, so this measures what the user actually sees.
 */
async function ink(page: Page, target: Locator): Promise<number> {
  const png = (await target.screenshot()).toString("base64");
  return page.evaluate(async (png) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${png}`)).blob());
    const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    let count = 0;
    for (let i = 0; i < data.length; i += 4) if (765 - data[i] - data[i + 1] - data[i + 2] > 90) count++;
    return count;
  }, png);
}

const labelOf = (view: Locator, id: string) => view.locator(`.label[data-id="${id}"]`);

test.describe("dag-graph-3d", () => {
  test("draws the graph from the first root and keeps requests flowing", async ({ page }) => {
    await page.goto("/#dag-graph-3d");
    const view = page.getByTestId("dag3d-demo");
    await expect(view.locator("canvas")).toHaveAttribute("aria-hidden", "true");
    await expect(view.locator(".stage")).toHaveAttribute("aria-label", /Service call graph: 18 nodes, 21 edges, street view, at edge-proxy with 2 outgoing/);
    await expect(labelOf(view, "edge-proxy")).toHaveAttribute("aria-current", "location");
    await expect(labelOf(view, "api-gateway")).toBeVisible();

    await expect.poll(() => ink(page, view)).toBeGreaterThan(2000);
    const before = (await view.screenshot()).toString("base64");
    await expect.poll(async () => (await view.screenshot()).toString("base64")).not.toBe(before);
  });

  test("speed 0 stops requests where they are", async ({ page }) => {
    // Comparing WebGL screenshots until they settle is slow on a loaded machine.
    test.slow();
    await page.goto("/#dag-graph-3d");
    const view = page.getByTestId("dag3d-demo");
    await expect.poll(() => ink(page, view)).toBeGreaterThan(2000);
    await view.evaluate((el) => {
      el.rate = 0;
      el.speed = 0;
    });
    // Once any node glow from the last arrivals has faded, nothing moves any more.
    const settled = async () => {
      const first = (await view.screenshot()).toString("base64");
      await page.waitForTimeout(300);
      return (await view.screenshot()).toString("base64") === first;
    };
    await expect.poll(settled, { timeout: 30_000 }).toBe(true);
  });

  test("hide-pins draws nodes flat, with their labels lowered onto the disks", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#dag-graph-3d");
    const view = page.getByTestId("dag3d-demo");
    const label = labelOf(view, "api-gateway");
    await expect(label).toBeVisible();
    const pinned = { ink: await ink(page, view), y: (await label.boundingBox())!.y };

    await page.getByTestId("dag3d-hide-pins").click();
    await expect(view).toHaveAttribute("hide-pins", "");
    await expect.poll(async () => (await label.boundingBox())!.y).toBeGreaterThan(pinned.y + 5);
    expect(await ink(page, view)).toBeLessThan(pinned.ink);
  });

  test("overview and top views show the whole graph with the flow left to right", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#dag-graph-3d");
    const view = page.getByTestId("dag3d-demo");
    const visibleLabels = () =>
      view.evaluate(
        (el) =>
          [...el.shadowRoot!.querySelectorAll<HTMLElement>(".label")].filter((label) => label.style.visibility === "visible")
            .length,
      );
    await expect.poll(visibleLabels).toBeLessThan(18);

    const segment = (index: number) => view.locator('button-group[data-control="view"] input').nth(index);
    for (const [index, name] of [[1, "overview"], [2, "top"]] as const) {
      await segment(index).click({ force: true });
      await expect(view).toHaveAttribute("view", name);
      await expect(page.getByTestId("dag3d-view-output")).toHaveText(name);
      await expect.poll(visibleLabels).toBe(18);
      const root = (await labelOf(view, "edge-proxy").boundingBox())!;
      const leaf = (await labelOf(view, "ledger-db").boundingBox())!;
      expect(leaf.x).toBeGreaterThan(root.x + 100);
    }
  });

  test("zooms with Ctrl + wheel and the keyboard, tilts with Shift + arrows, and 0 resets", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#dag-graph-3d");
    const view = page.getByTestId("dag3d-demo");
    await view.locator('button-group[data-control="view"] input').nth(2).click({ force: true });
    await expect(view).toHaveAttribute("view", "top");
    const spread = async () => {
      // Two labels near the middle, which stay in view when zoomed in.
      const a = (await labelOf(view, "checkout").boundingBox())!;
      const b = (await labelOf(view, "payments").boundingBox())!;
      return Math.hypot(b.x - a.x, b.y - a.y);
    };
    const fitted = await spread();

    const box = (await view.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Control");
    await expect.poll(spread).toBeGreaterThan(fitted * 1.5);

    await view.locator(".stage").focus();
    await page.keyboard.press("0");
    await expect.poll(spread).toBeCloseTo(fitted, 0);
    await page.keyboard.press("-");
    await expect.poll(spread).toBeLessThan(fitted);

    await page.keyboard.press("0");
    const hubY = async () => (await labelOf(view, "payments").boundingBox())!.y;
    const top = await hubY();
    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Shift+ArrowDown");
    await expect.poll(hubY).not.toBeCloseTo(top, 0);
  });

  test("controls choose the toolbar buttons, and static fixes the camera", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#dag-graph-3d");
    const view = page.getByTestId("dag3d-demo");
    const shown = () =>
      view.locator(".toolbar [data-control]").evaluateAll((els) => els.map((el) => el.getAttribute("data-control")));
    await expect.poll(shown).toEqual(["back", "home", "view", "zoom-in", "zoom-out"]);

    await page.getByTestId("dag3d-control-back").click();
    await page.getByTestId("dag3d-control-zoom").click();
    await expect.poll(shown).toEqual(["home", "view"]);

    const label = labelOf(view, "api-gateway");
    // The label's projected placement, which only the camera changes; a static view leaves the wheel to the page,
    // which may smoothly scroll in the meantime.
    const where = () => label.evaluate((el) => el.style.transform);
    const before = await where();
    await page.getByTestId("dag3d-static").click();
    await expect(view).toHaveAttribute("static", "");
    await expect.poll(shown).toEqual(["home"]);
    await expect(view.locator(".stage")).not.toHaveAttribute("tabindex", /.*/);

    await view.scrollIntoViewIfNeeded();
    const box = (await view.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + box.height * 0.75);
    await page.mouse.down();
    await page.mouse.move(box.x + 190, box.y + box.height * 0.6, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -200);
    await page.keyboard.up("Control");
    expect(await where()).toBe(before);

    await label.click();
    await expect(view).toHaveAttribute("selected", "api-gateway");

    await page.getByTestId("dag3d-control-home").click();
    await expect(view.locator(".toolbar")).toHaveCount(0);
  });

  test("travels to a clicked node and back", async ({ page }) => {
    await page.goto("/#dag-graph-3d");
    const view = page.getByTestId("dag3d-demo");
    const back = view.locator('icon-button[data-control="back"]');
    await expect(back).toHaveAttribute("disabled", "");

    await labelOf(view, "api-gateway").click();
    await expect(view).toHaveAttribute("selected", "api-gateway");
    await expect(page.getByTestId("dag3d-output")).toHaveText("api-gateway");
    await expect(labelOf(view, "api-gateway")).toHaveAttribute("aria-current", "location");
    await expect(labelOf(view, "edge-proxy")).not.toHaveAttribute("aria-current", /.*/);

    await back.click();
    await expect(view).toHaveAttribute("selected", "edge-proxy");
    await expect(page.getByTestId("dag3d-output")).toHaveText("edge-proxy");
    await expect(back).toHaveAttribute("disabled", "");
  });

  test("shows a still picture under reduced motion and pans with the arrow keys", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#dag-graph-3d");
    const view = page.getByTestId("dag3d-demo");
    await expect(view.locator('icon-button[data-control="pause"]')).toHaveCount(0);
    await expect.poll(() => ink(page, view)).toBeGreaterThan(2000);
    const still = (await view.screenshot()).toString("base64");
    await page.waitForTimeout(300);
    expect((await view.screenshot()).toString("base64")).toBe(still);

    const label = labelOf(view, "api-gateway");
    const x = async () => (await label.boundingBox())!.x;
    const start = await x();
    await view.locator(".stage").focus();
    await page.keyboard.press("ArrowLeft");
    await expect.poll(x).toBeGreaterThan(start + 20);
  });
});
