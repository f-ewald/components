import { test, expect } from "@playwright/test";

interface SpecListElement extends HTMLElement {
  items: unknown;
  layout: string;
  dividers: boolean;
  caption: string;
  updateComplete: Promise<unknown>;
}

/** Mounts a configured spec-list, runs a probe against it, and always removes it. */
async function withSpecList<T>(
  page: import("@playwright/test").Page,
  setup: { innerHTML?: string; props?: Record<string, unknown> },
  probe: (element: SpecListElement) => T,
): Promise<T> {
  return page.evaluate(
    async ({ setup, probeSource }) => {
      const el = document.createElement("spec-list") as SpecListElement;
      if (setup.innerHTML !== undefined) el.innerHTML = setup.innerHTML;
      Object.assign(el, setup.props ?? {});
      document.body.append(el);
      await el.updateComplete;
      // Let a slotchange-driven re-render settle before measuring.
      await el.updateComplete;
      try {
        return (0, eval)(`(${probeSource})`)(el);
      } finally {
        el.remove();
      }
    },
    { setup, probeSource: probe.toString() },
  ) as Promise<T>;
}

test.describe("spec-list", () => {
  test("renders the data-driven items as dt/dd pairs", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#spec-list-demo");
    await expect(el.locator("dl dt")).toHaveText(["Material", "Weight", "Warranty"]);
    await expect(el.locator("dl dd")).toHaveText(["Anodized aluminum", "1.2 kg", "2 years"]);
  });

  test("slotted dt/dd inherit the component's own key styling", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#spec-list-slotted");
    await expect(el.locator("dt")).toContainText(["Homepage"]);
    const link = el.locator("dd a");
    await expect(link).toHaveText("example.com");
    await expect(link).toHaveAttribute("href", /example\.com/);

    // The zero-external-CSS promise: a bare slotted key must pick up the muted,
    // wide-tracked, small key treatment from the component, not UA defaults
    // (16px, weight 400, black). Case is theme-driven, so it is not asserted.
    const key = el.locator("dt").first();
    await expect(key).toHaveCSS("letter-spacing", /.+/);
    const keyStyle = await key.evaluate((node) => {
      const style = getComputedStyle(node);
      return { size: parseFloat(style.fontSize), weight: style.fontWeight, color: style.color };
    });
    expect(keyStyle.size).toBeLessThan(16);
    expect(Number(keyStyle.weight)).toBeGreaterThan(400);
    expect(keyStyle.color).not.toBe("rgb(0, 0, 0)");
    // The UA's 40px margin-inline-start on <dd> must not survive either.
    const ddMargin = await el
      .locator("dd")
      .first()
      .evaluate((node) => getComputedStyle(node).marginInlineStart);
    expect(ddMargin).toBe("0px");
  });

  test("slotted content wins over items that are also set", async ({ page }) => {
    await page.goto("/");
    const text = await withSpecList(
      page,
      {
        innerHTML: "<dt>Slotted key</dt><dd>Slotted value</dd>",
        props: { items: [{ label: "Item key", value: "Item value" }] },
      },
      (el) => el.shadowRoot!.textContent ?? "",
    );
    expect(text).not.toContain("Item key");
  });

  test("whitespace-only slot content still renders the items path", async ({ page }) => {
    await page.goto("/");
    const text = await withSpecList(
      page,
      { innerHTML: "\n  \n", props: { items: [{ label: "Item key", value: "Item value" }] } },
      (el) => el.shadowRoot!.textContent ?? "",
    );
    expect(text).toContain("Item key");
  });

  test("survives non-array and null-entry items assigned at runtime", async ({ page }) => {
    await page.goto("/");
    for (const items of [null, undefined, "nope", 42, {}]) {
      const rows = await withSpecList(page, { props: { items } }, (el) => el.shadowRoot!.querySelectorAll("dt").length);
      expect(rows).toBe(0);
    }
    const rows = await withSpecList(
      page,
      { props: { items: [{ label: "Kept", value: "1" }, null, { label: "Also kept", value: "2" }] } },
      (el) => Array.from(el.shadowRoot!.querySelectorAll("dt")).map((node) => node.textContent),
    );
    expect(rows).toEqual(["Kept", "Also kept"]);
  });

  test("hides the list entirely when there is neither items nor slotted content", async ({ page }) => {
    await page.goto("/");
    const display = await withSpecList(page, {}, (el) => {
      const list = el.shadowRoot!.querySelector(".list")!;
      return { display: getComputedStyle(list).display, height: list.getBoundingClientRect().height };
    });
    expect(display.height).toBe(0);
  });

  test("dividers=false removes the hairline rules", async ({ page }) => {
    await page.goto("/");
    const widths = await withSpecList(
      page,
      { props: { items: [{ label: "A", value: "1" }, { label: "B", value: "2" }], dividers: false } },
      (el) =>
        Array.from(el.shadowRoot!.querySelectorAll("dt")).map(
          (node) => getComputedStyle(node).borderBottomWidth,
        ),
    );
    expect(widths.every((width) => width === "0px")).toBe(true);
  });

  test("the caption labels the list", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#spec-list-demo");
    const labelledBy = await el.locator("dl").getAttribute("aria-labelledby");
    expect(labelledBy).toBe("caption");
    await expect(el.locator("#caption")).toHaveText("Specifications");
  });

  test("stacks the key over the value when layout is stacked", async ({ page }) => {
    await page.goto("/");
    const boxes = await withSpecList(
      page,
      { props: { layout: "stacked", items: [{ label: "Material", value: "Anodized aluminum" }] } },
      (el) => {
        const dt = el.shadowRoot!.querySelector("dt")!.getBoundingClientRect();
        const dd = el.shadowRoot!.querySelector("dd")!.getBoundingClientRect();
        return { dtBottom: dt.bottom, ddTop: dd.top };
      },
    );
    expect(boxes.ddTop).toBeGreaterThanOrEqual(boxes.dtBottom - 1);
  });

  test("auto layout stacks below the 48rem breakpoint and pairs above it", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#spec-list-demo");

    await page.setViewportSize({ width: 1280, height: 900 });
    const wide = await el.evaluate((node) => {
      const dt = node.shadowRoot!.querySelector("dt")!.getBoundingClientRect();
      const dd = node.shadowRoot!.querySelector("dd")!.getBoundingClientRect();
      return dd.left - dt.left;
    });
    expect(wide).toBeGreaterThan(0);

    await page.setViewportSize({ width: 640, height: 900 });
    const narrow = await el.evaluate((node) => {
      const dt = node.shadowRoot!.querySelector("dt")!.getBoundingClientRect();
      const dd = node.shadowRoot!.querySelector("dd")!.getBoundingClientRect();
      return { sameLeft: Math.abs(dd.left - dt.left) < 1, below: dd.top >= dt.bottom - 1 };
    });
    expect(narrow.sameLeft).toBe(true);
    expect(narrow.below).toBe(true);
  });
});
