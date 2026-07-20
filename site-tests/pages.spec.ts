import {expect, test, type Page} from "@playwright/test";

const siteOrigin = "http://127.0.0.1:4173";

interface CustomElementsManifest {
  modules: Array<{
    declarations?: Array<{
      customElement?: boolean;
      tagName?: string;
    }>;
  }>;
}

/** Returns every custom-element tag in the checked-in manifest. */
async function expectedComponentTags(page: Page): Promise<string[]> {
  const response = await page.request.get("/custom-elements.json");
  expect(response.ok()).toBe(true);
  const manifest = (await response.json()) as CustomElementsManifest;
  return manifest.modules
    .flatMap((module) => module.declarations ?? [])
    .filter(
      (declaration): declaration is typeof declaration & {tagName: string} =>
        Boolean(declaration.customElement && declaration.tagName)
    )
    .map((declaration) => declaration.tagName)
    .sort();
}

/** Records failed requests owned by the locally previewed site. */
function watchSiteRequests(page: Page): Set<string> {
  const failures = new Set<string>();
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === siteOrigin && response.status() >= 400) {
      failures.add(`${response.status()} ${url.pathname}`);
    }
  });
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    if (url.origin === siteOrigin) {
      failures.add(`failed ${url.pathname}`);
    }
  });
  page.on("pageerror", (error) => {
    failures.add(`page error: ${error.message}`);
  });
  return failures;
}

/** Extracts and validates the live-example fragment from generated API HTML. */
function liveExampleAnchor(html: string, tagName: string): string {
  const match = html.match(/href="\.\.\/playground\/#([^"]+)">Open live example<\/a>/);
  if (!match) {
    throw new Error(`No live playground link found in docs for <${tagName}>`);
  }
  return decodeURIComponent(match[1]);
}

test.describe("GitHub Pages artifact", () => {
  test("publishes the complete generated component reference", async ({page}) => {
    const failures = watchSiteRequests(page);
    const expectedTags = await expectedComponentTags(page);

    await page.goto("/");
    await expect(
      page.getByRole("heading", {name: "Reusable components, documented and ready to explore."})
    ).toBeVisible();

    const documentedTags = await page.locator(".component-card > a > code").allTextContents();
    expect(documentedTags.sort()).toEqual(expectedTags.map((tag) => `<${tag}>`).sort());
    await expect(page.getByRole("link", {name: "custom-elements.json"})).toBeVisible();
    await expect(page.getByRole("link", {name: "llms.txt"})).toBeVisible();

    const playgroundResponse = await page.request.get("/playground/");
    expect(playgroundResponse.ok()).toBe(true);
    const playgroundHtml = await playgroundResponse.text();
    const playgroundAnchors = new Set(
      [...playgroundHtml.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1])
    );
    const documentedAnchors = await Promise.all(
      expectedTags.map(async (tag) => {
        const response = await page.request.get(`/docs/${tag}.html`);
        expect(response.ok()).toBe(true);
        return liveExampleAnchor(await response.text(), tag);
      })
    );
    for (const anchor of documentedAnchors) {
      expect(playgroundAnchors.has(anchor), `Missing playground section #${anchor}`).toBe(true);
    }

    await page.goto("/docs/confirm-dialog.html");
    await expect(page.getByRole("heading", {name: "<confirm-dialog>", level: 1})).toBeVisible();
    await expect(page.getByRole("heading", {name: "Attributes / properties"})).toBeVisible();
    await expect(page.locator("pre").nth(1)).toContainText(
      '<confirm-dialog open confirm-label="Delete" cancel-label="Cancel">'
    );
    await expect(page.getByRole("link", {name: "Open live example"})).toHaveAttribute(
      "href",
      "../playground/#confirm-dialog"
    );

    await page.waitForLoadState("networkidle");
    expect([...failures]).toEqual([]);
  });

  test("deep-links from API docs to an interactive, image-backed playground", async ({page}) => {
    const failures = watchSiteRequests(page);
    await page.goto("/docs/confirm-dialog.html");
    await page.getByRole("link", {name: "Open live example"}).click();

    await expect(page).toHaveURL(/\/playground\/#confirm-dialog$/);
    await expect(page.getByTestId("section-confirm-dialog")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect([...failures]).toEqual([]);
    const componentState = await page.getByTestId("confirm-demo").evaluate((element) => {
      const constructor = customElements.get("confirm-dialog");
      return {
        defined: Boolean(constructor),
        upgraded: constructor ? element instanceof constructor : false,
        hasShadowRoot: Boolean(element.shadowRoot),
        scripts: Array.from(document.scripts, (script) => script.src),
        resources: performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => name.includes("/playground/")),
      };
    });
    expect(componentState.scripts).toEqual([expect.stringContaining("/playground/assets/")]);
    expect(componentState.resources).toEqual(
      expect.arrayContaining([expect.stringContaining("/playground/assets/")])
    );
    expect(
      componentState.defined,
      `Playground component registration failed: ${JSON.stringify(componentState)}`
    ).toBe(true);
    expect(componentState.upgraded).toBe(true);
    expect(componentState.hasShadowRoot).toBe(true);
    await page.getByTestId("confirm-open").click();
    await expect(page.getByTestId("confirm-demo").locator(".overlay")).toHaveClass(/open/);

    const activeImage = page
      .locator('#photo-gallery-demo picture:not([aria-hidden="true"]) img')
      .first();
    await expect(activeImage).toHaveAttribute("src", /\/playground\/assets\/.+\.jpg$/);
    await expect.poll(() => activeImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);

    await page.waitForLoadState("networkidle");
    expect([...failures]).toEqual([]);
  });
});
