import { test, expect, type Page } from "@playwright/test";

/**
 * "A bordered surface paints an opaque base" — see docs/design-language.md.
 *
 * A component that draws a border but no background is invisible on a plain
 * white page and obviously broken on a tinted, textured or image-backed one.
 * The blueprint theme is the case that exposes it, because it is the one theme
 * whose page carries a texture, so this contract runs there.
 *
 * The check is a runtime walk rather than a source scan: a background can be
 * inherited, layered, or set from any of several rules, so only the resolved
 * value is meaningful.
 */

/**
 * Surfaces that are legitimately transparent, as `host tag` -> selectors.
 *
 * These draw a *line* or a *mark*, not a panel: a divider rule, a calendar
 * entry's data underline, a sidebar footer that sits on the sidebar's own
 * paper, and a step-ladder rung's top border separating one rung from the
 * next (same role as content-divider's rule). Asserted exactly — a new entry
 * has to be justified here, and a stale one fails once its component starts
 * painting.
 */
const TRANSPARENT_BY_DESIGN: Record<string, string[]> = {
  "calendar-month": ["div.entry-footer"],
  "content-divider": ["span.line"],
  "app-sidebar": ["div.foot"],
  "step-ladder": ["li.rung"],
};

/** Collects every visible bordered element with no background of its own. */
const findTransparentBorderedSurfaces = (page: Page) =>
  page.evaluate(() => {
    const found: { host: string; selector: string }[] = [];
    const isTransparent = (color: string) =>
      color === "rgba(0, 0, 0, 0)" || color === "transparent";

    const walk = (root: ParentNode, host: string) => {
      for (const el of root.querySelectorAll("*")) {
        if (el.shadowRoot) walk(el.shadowRoot, el.tagName.toLowerCase());
        // Only shadow DOM: the playground's own light-DOM chrome is covered
        // by a separate assertion below.
        if (host === "") continue;
        const style = getComputedStyle(el);
        const borderWidth = Math.max(
          ...(["Top", "Right", "Bottom", "Left"] as const).map(
            (side) => parseFloat(style[`border${side}Width`]) || 0,
          ),
        );
        if (borderWidth <= 0 || style.borderTopStyle === "none") continue;
        if (isTransparent(style.borderTopColor)) continue;
        if (!isTransparent(style.backgroundColor) || style.backgroundImage !== "none") continue;
        // A collapsed or hidden element has no surface to see through.
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        const classes = (el.getAttribute("class") ?? "").trim().split(/\s+/).filter(Boolean);
        found.push({
          host,
          selector: `${el.tagName.toLowerCase()}${classes.map((c) => `.${c}`).join("")}`,
        });
      }
    };

    walk(document, "");
    return found;
  });

test.describe("bordered surfaces paint an opaque base", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?theme=blueprint");
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(
      "blueprint",
    );
  });

  test("no component draws a border over a see-through body", async ({ page }) => {
    const found = await findTransparentBorderedSurfaces(page);

    const actual = new Map<string, Set<string>>();
    for (const { host, selector } of found) {
      if (!actual.has(host)) actual.set(host, new Set());
      actual.get(host)!.add(selector);
    }

    const normalize = (entries: Iterable<[string, Iterable<string>]>) =>
      Object.fromEntries(
        [...entries]
          .map(([host, selectors]) => [host, [...selectors].sort()] as const)
          .sort(([a], [b]) => a.localeCompare(b)),
      );

    expect(normalize(actual), "transparent bordered surfaces match the documented exceptions").toEqual(
      normalize(Object.entries(TRANSPARENT_BY_DESIGN)),
    );
  });

  test("the playground's own example containers and controls paint paper", async ({ page }) => {
    // The demo is the first consumer of the rule: its chrome sits directly on
    // the themed page texture, so a transparent box lets the grid run through
    // the example itself.
    const seeThrough = await page.evaluate(() => {
      const transparent = (color: string) =>
        color === "rgba(0, 0, 0, 0)" || color === "transparent";
      const targets = document.querySelectorAll<HTMLElement>(
        '.demo-example, :is(button, input, select, textarea)[class*="border-slate-"]',
      );
      return [...targets]
        .filter((el) => transparent(getComputedStyle(el).backgroundColor))
        .map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute("class")}`);
    });

    expect(seeThrough, "every demo container and bordered demo control is opaque").toEqual([]);
    // Guards the selectors above against silently matching nothing.
    await expect(page.locator(".demo-example").first()).toBeVisible();
  });

  test("the opaque base follows --ui-surface rather than hardcoding white", async ({ page }) => {
    // The base has to be the theme's paper, not a literal, or a theme that
    // repaints its surface would leave these components stranded on white.
    const probe = "rgb(1, 2, 3)";
    await page.evaluate((color) => {
      document.documentElement.style.setProperty("--ui-surface", color);
    }, probe);

    const backgrounds = await page.evaluate(() => {
      const read = (tag: string, selector: string) => {
        const host = document.querySelector(tag);
        const el = host?.shadowRoot?.querySelector(selector);
        return el ? getComputedStyle(el).backgroundColor : `${tag} ${selector} not found`;
      };
      return {
        pill: read("radio-pills", ".pill:not(:has(input:checked))"),
        tile: read("tile-grid", ".tile"),
        frame: read("frame-box", ".frame"),
        group: read("button-group", ".group"),
        dayGrid: read("calendar-day", ".grid"),
        weekGrid: read("calendar-week", ".grid"),
      };
    });

    for (const [name, value] of Object.entries(backgrounds)) {
      expect(value, `${name} paints the themed surface`).toBe(probe);
    }
  });
});
