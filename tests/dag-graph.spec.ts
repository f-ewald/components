import { test, expect, type Locator, type Page } from "@playwright/test";

/** Returns the current pan/zoom transform of a graph's scene group. */
async function transform(graph: Locator): Promise<string | null> {
  return graph.locator('svg[role="group"] > g').getAttribute("transform");
}

/** Returns the zoom factor of a transform string. */
function scale(value: string | null): number {
  return Number(value!.match(/scale\(([-\d.]+)\)/)![1]);
}

/** Returns each node's center in layout coordinates, keyed by id. */
async function positions(graph: Locator): Promise<Record<string, { x: number; y: number }>> {
  return graph.locator(".node").evaluateAll((nodes) =>
    Object.fromEntries(
      nodes.map((node) => {
        const [, x, y] = node.getAttribute("transform")!.match(/translate\(([-\d.]+),([-\d.]+)\)/)!;
        return [(node as SVGGElement).dataset.id!, { x: Number(x), y: Number(y) }];
      }),
    ),
  );
}

async function openDemo(page: Page): Promise<Locator> {
  await page.goto("/#dag-graph");
  const graph = page.locator("#dag-demo");
  await expect(graph.locator(".node")).toHaveCount(11);
  return graph;
}

test.describe("dag-graph", () => {
  test("draws every node, edge, icon, and legend entry, and fits a small graph into view", async ({ page }) => {
    const graph = await openDemo(page);

    await expect(graph.locator('svg[role="group"]')).toHaveAttribute("aria-label", "Package dependencies: 11 nodes, 14 edges");
    await expect(graph.locator(".edge")).toHaveCount(14);
    await expect(graph.locator(".node .icon svg")).toHaveCount(11);
    await expect(graph.locator(".legend li")).toHaveText(["Service", "Library", "External package", "Unknown"]);
    // The cycle auth-lib → config-lib → metrics-lib → auth-lib is closed by exactly one backward, dashed edge.
    await expect(graph.locator(".edge.backward")).toHaveCount(1);
    await expect(graph.locator('.node[data-id="requests"]')).toHaveClass(/dashed/);
    await expect(graph.locator('.node[data-id="legacy-tool"]')).toHaveClass(/muted/);
    await expect(graph.locator('.node[data-id="api-gateway"]')).toHaveClass(/selected/);

    const canvas = (await graph.locator('svg[role="group"]').boundingBox())!;
    for (const box of await graph.locator(".node rect").evaluateAll((rects) =>
      rects.map((rect) => rect.getBoundingClientRect().toJSON() as DOMRect),
    )) {
      expect(box.left).toBeGreaterThanOrEqual(canvas.x);
      expect(box.right).toBeLessThanOrEqual(canvas.x + canvas.width);
    }
  });

  test("clicking or pressing Enter on a node selects it and fires node-select", async ({ page }) => {
    const graph = await openDemo(page);
    const auth = graph.locator('.node[data-id="auth-lib"]');

    await auth.click();
    await expect(auth).toHaveAttribute("aria-pressed", "true");
    await expect(graph).toHaveAttribute("selected", "auth-lib");
    await expect(page.getByTestId("dag-output")).toHaveText("auth-lib");

    const requests = graph.locator('.node[data-id="requests"]');
    await requests.focus();
    await page.keyboard.press("Enter");
    await expect(requests).toHaveClass(/selected/);
    await expect(auth).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("dag-output")).toHaveText("requests");
  });

  test("dragging pans without selecting, and only Ctrl/⌘ + wheel zooms", async ({ page }) => {
    const graph = await openDemo(page);
    const before = await transform(graph);
    const box = (await graph.locator('.node[data-id="auth-lib"]').boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30, { steps: 5 });
    await page.mouse.up();
    await expect(graph).toHaveAttribute("selected", "api-gateway");
    const panned = await transform(graph);
    expect(panned).not.toBe(before);
    expect(scale(panned)).toBe(scale(before));

    // A plain wheel scrolls the page instead of zooming, so the graph may move away from the pointer.
    await page.mouse.wheel(0, 200);
    expect(await transform(graph)).toBe(panned);
    await graph.locator('svg[role="group"]').scrollIntoViewIfNeeded();
    const canvas = (await graph.locator('svg[role="group"]').boundingBox())!;
    await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Control");
    await expect.poll(async () => scale(await transform(graph))).toBeGreaterThan(scale(panned));
  });

  test("keyboard and methods pan, zoom, fit, and center", async ({ page }) => {
    const graph = await openDemo(page);
    const fitted = await transform(graph);

    await graph.locator('svg[role="group"]').focus();
    await page.keyboard.press("ArrowLeft");
    expect(await transform(graph)).not.toBe(fitted);
    await page.keyboard.press("0");
    expect(await transform(graph)).toBe(fitted);
    await page.keyboard.press("+");
    expect(scale(await transform(graph))).toBeCloseTo(scale(fitted) * 1.25);

    await graph.locator('icon-button[data-control="zoom-out"]').click();
    await expect.poll(async () => scale(await transform(graph))).toBeCloseTo(scale(fitted));
    await graph.locator('icon-button[data-control="fit"]').click();
    await expect.poll(() => transform(graph)).toBe(fitted);
    await graph.locator('icon-button[data-control="zoom-in"]').click();
    await graph.locator('icon-button[data-control="center"]').click();
    // Center puts the selected node in the middle of the canvas at 100%.
    const canvas = (await graph.locator('svg[role="group"]').boundingBox())!;
    const node = (await graph.locator('.node[data-id="api-gateway"] rect').boundingBox())!;
    expect(Math.abs(node.x + node.width / 2 - (canvas.x + canvas.width / 2))).toBeLessThan(2);
    expect(Math.abs(node.y + node.height / 2 - (canvas.y + canvas.height / 2))).toBeLessThan(2);
  });

  test("hiding and showing the graph keeps its view", async ({ page }) => {
    const graph = await openDemo(page);
    await graph.locator('svg[role="group"]').focus();
    await page.keyboard.press("ArrowLeft");
    const panned = await transform(graph);
    // Two frames let the ResizeObserver report the new size.
    const settle = () => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));

    // Like an inactive tab panel, which measures 0×0.
    await graph.evaluate((element: HTMLElement) => (element.style.display = "none"));
    await settle();
    await graph.evaluate((element: HTMLElement) => (element.style.display = ""));
    await settle();

    expect(await transform(graph)).toBe(panned);
  });

  test("the direction control flips the flow and fires direction-change", async ({ page }) => {
    const graph = await openDemo(page);
    let layout = await positions(graph);
    expect(layout["http-utils"].x).toBeGreaterThan(layout["auth-lib"].x);

    const toggle = graph.locator('icon-button[data-control="direction"]');
    await expect(toggle).toHaveAttribute("label", "Lay out top to bottom");
    await toggle.click();
    await expect(graph).toHaveAttribute("direction", "TB");
    await expect(page.getByTestId("dag-direction-output")).toHaveText("TB");
    await expect(toggle).toHaveAttribute("label", "Lay out left to right");
    layout = await positions(graph);
    expect(layout["http-utils"].y).toBeGreaterThan(layout["auth-lib"].y);
  });

  test("controls choose which toolbar buttons are shown", async ({ page }) => {
    const graph = await openDemo(page);
    const shown = () => graph.locator(".toolbar icon-button").evaluateAll((buttons) =>
      buttons.map((button) => (button as HTMLElement).dataset.control),
    );
    expect(await shown()).toEqual(["zoom-in", "zoom-out", "fit", "center", "direction"]);

    await page.getByTestId("dag-control-zoom").click();
    await page.getByTestId("dag-control-direction").click();
    await expect.poll(shown).toEqual(["fit", "center"]);
    await expect(graph).toHaveAttribute("controls", "fit center");

    await page.getByTestId("dag-control-fit").click();
    await page.getByTestId("dag-control-center").click();
    await expect(graph.locator(".toolbar")).toHaveCount(0);
  });

  test("static presents a fitted picture without panning, zooming, or toolbar, but keeps selection", async ({
    page,
  }) => {
    const graph = await openDemo(page);
    const fitted = await transform(graph);
    await graph.locator('icon-button[data-control="zoom-in"]').click();
    expect(await transform(graph)).not.toBe(fitted);

    await page.getByTestId("dag-static").click();
    await expect(graph).toHaveAttribute("static", "");
    await expect.poll(() => transform(graph)).toBe(fitted);
    await expect(graph.locator(".toolbar")).toHaveCount(0);
    await expect(graph.locator('svg[role="group"]')).not.toHaveAttribute("tabindex");

    const box = (await graph.locator('.node[data-id="grpcio"]').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + 40, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -100);
    await page.keyboard.up("Control");
    expect(await transform(graph)).toBe(fitted);

    await graph.locator('.node[data-id="grpcio"]').click();
    await expect(page.getByTestId("dag-output")).toHaveText("grpcio");

    await page.getByTestId("dag-static").click();
    await expect(graph.locator(".toolbar icon-button")).toHaveCount(5);
  });

  test("highlighted nodes and edges, kind colors, and custom properties are configurable", async ({ page }) => {
    const graph = await openDemo(page);

    await page.getByTestId("dag-cycle").click();
    await expect(graph.locator(".edge.highlighted")).toHaveCount(3);
    await expect(graph.locator(".node.highlighted")).toHaveCount(3);

    const service = graph.locator('.node[data-id="api-gateway"] .icon');
    await expect(service).toHaveCSS("color", "rgb(66, 105, 208)");
    await page.getByTestId("dag-colors").click();
    await expect(service).toHaveCSS("color", "rgb(255, 114, 92)");
    await expect(graph.locator(".node.selected rect")).toHaveCSS("stroke", "rgb(255, 138, 183)");
  });

  test("edge labels get room in the layout, and weights scale edge thickness", async ({ page }) => {
    const graph = await openDemo(page);
    const edge = (source: string, target: string) =>
      graph.locator(`.edge[data-source="${source}"][data-target="${target}"]`);
    await expect(graph.locator(".edge-label")).toHaveCount(0);
    await expect(edge("api-gateway", "auth-lib")).toHaveCSS("stroke-width", "1px");

    await page.getByTestId("dag-labels").click();
    await expect(graph.locator(".edge-label text")).toHaveText([">=1.60", "~=6.0", ">=4.21", "^2.31"]);
    const layout = await positions(graph);
    const label = graph.locator('.edge-label[data-source="http-utils"]');
    const [, x] = (await label.getAttribute("transform"))!.match(/translate\(([-\d.]+),/)!;
    expect(Number(x)).toBeGreaterThan(layout["http-utils"].x);
    expect(Number(x)).toBeLessThan(layout["requests"].x);
    await expect(label.locator("title")).toHaveText("http-utils → requests: ^2.31");

    await page.getByTestId("dag-weights").click();
    await expect(edge("api-gateway", "auth-lib")).toHaveCSS("stroke-width", "6px");
    await expect(edge("api-gateway", "legacy-tool")).toHaveCSS("stroke-width", "1px");
    await expect(edge("http-utils", "requests").locator("title")).toHaveText(
      "http-utils → requests: ^2.31 (weight 15)",
    );
    await expect(edge("api-gateway", "auth-lib")).toHaveAttribute("marker-end", "url(#arrow-17)");

    // Highlighting adds a pixel on top of the weight, and labels on the hovered node's edges stay legible.
    await page.getByTestId("dag-cycle").click();
    await expect(edge("auth-lib", "config-lib")).toHaveCSS("stroke-width", "2.5px");
    await graph.locator('.node[data-id="http-utils"]').hover();
    await expect(label).toHaveCSS("opacity", "1");
    await expect(graph.locator('.edge-label[data-source="grpcio"]')).toHaveCSS("opacity", "0.25");
  });

  for (const [theme, start, end, toolbar] of [
    ["light", "rgb(255, 255, 255)", "rgb(255, 255, 255)", "none"],
    ["gradient", "rgb(248, 250, 252)", "rgb(241, 245, 249)", "linear-gradient"],
  ]) {
    test(`follows the ${theme} theme's secondary-button gloss on nodes and the toolbar`, async ({ page }) => {
      await page.goto(`/?theme=${theme}#dag-graph`);
      const graph = page.locator("#dag-demo");
      await expect(graph.locator(".node")).toHaveCount(11);

      await expect(graph.locator('.node[data-id="auth-lib"] rect')).toHaveCSS("fill", 'url("#node-fill")');
      await expect(graph.locator(".gloss-start")).toHaveCSS("stop-color", start);
      await expect(graph.locator(".gloss-end")).toHaveCSS("stop-color", end);
      expect(
        await graph.locator(".toolbar").evaluate((element) => getComputedStyle(element).backgroundImage),
      ).toContain(toolbar);
    });
  }

  test("shows the empty slot when there are no nodes", async ({ page }) => {
    await page.goto("/#dag-graph");
    const empty = page.locator("#dag-empty");

    await expect(empty.locator(".node")).toHaveCount(0);
    await expect(empty.locator('svg[role="group"]')).toHaveAttribute("aria-label", "Empty graph: 0 nodes, 0 edges");
    await expect(empty.getByText("Select a package to see its dependencies.")).toBeVisible();
  });
});
