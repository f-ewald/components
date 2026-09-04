import { test, expect } from "@playwright/test";

interface BreadcrumbElement extends HTMLElement {
  items: unknown;
  maxVisible: unknown;
  expanded: boolean;
  updateComplete: Promise<unknown>;
}

test.describe("breadcrumb-nav", () => {
  test("renders the trail with the last item as the current page, not a link", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("#breadcrumb-nav-demo nav[aria-label='Breadcrumb']");
    await expect(nav).toBeVisible();

    const current = nav.locator(".current");
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(nav.locator("a.crumb")).toHaveCount(2);
    // The current page is text, never an anchor.
    await expect(current.locator("xpath=self::a")).toHaveCount(0);
  });

  test("the last item is never a link even when it carries an href", async ({ page }) => {
    await page.goto("/");
    const shape = await page.evaluate(async () => {
      const el = document.createElement("breadcrumb-nav") as BreadcrumbElement;
      el.items = [
        { label: "Home", href: "/" },
        { label: "Leaf", href: "/leaf" },
      ];
      document.body.append(el);
      await el.updateComplete;
      const result = {
        anchors: el.shadowRoot!.querySelectorAll("a.crumb").length,
        currentIsAnchor: el.shadowRoot!.querySelector(".current")!.tagName.toLowerCase() === "a",
        currentText: el.shadowRoot!.querySelector(".current")!.textContent?.trim(),
      };
      el.remove();
      return result;
    });
    expect(shape).toEqual({ anchors: 1, currentIsAnchor: false, currentText: "Leaf" });
  });

  // A collapse that mis-counts produces absurd chrome ("Show 0 hidden", a
  // negative count, or two aria-current nodes) only at specific length /
  // maxVisible pairs, so the whole small matrix is swept.
  for (const length of [1, 2, 3, 4, 6]) {
    for (const maxVisible of [1, 2, 3, 0.5]) {
      test(`stays coherent with ${length} items and maxVisible ${maxVisible}`, async ({ page }) => {
        await page.goto("/");
        const state = await page.evaluate(
          async ({ length, maxVisible }) => {
            const el = document.createElement("breadcrumb-nav") as BreadcrumbElement;
            el.items = Array.from({ length }, (_, i) => ({ label: `Item ${i}`, href: `/${i}` }));
            el.maxVisible = maxVisible;
            document.body.append(el);
            await el.updateComplete;
            const root = el.shadowRoot!;
            const overflow = root.querySelector("button.overflow");
            const result = {
              currents: root.querySelectorAll("[aria-current='page']").length,
              overflowLabel: overflow?.getAttribute("aria-label") ?? overflow?.textContent?.trim() ?? "",
              hasOverflow: Boolean(overflow),
              visible: root.querySelectorAll("a.crumb, .current, .static").length,
            };
            el.remove();
            return result;
          },
          { length, maxVisible },
        );

        // Exactly one current page, always.
        expect(state.currents).toBe(1);
        // Never advertise a non-positive hidden count.
        expect(state.overflowLabel).not.toMatch(/\b-?0\b|-\d/);
        if (state.hasOverflow) {
          const hidden = Number(state.overflowLabel.match(/\d+/)?.[0] ?? 0);
          expect(hidden).toBeGreaterThan(0);
        }
        expect(state.visible).toBeGreaterThan(0);
        expect(state.visible).toBeLessThanOrEqual(length);
      });
    }
  }

  test("collapses the middle and reveals it when the overflow button is activated", async ({
    page,
  }) => {
    await page.goto("/");
    const host = page.locator("#breadcrumb-nav-collapsed");
    const overflow = host.locator("button.overflow");

    await expect(overflow).toHaveAttribute("aria-expanded", "false");
    await expect(overflow).toHaveAttribute("aria-controls", "trail");
    const collapsedCrumbs = await host.locator("a.crumb, .static").count();

    await overflow.click();
    await expect(overflow).toHaveAttribute("aria-expanded", "true");
    const expandedCrumbs = await host.locator("a.crumb, .static").count();
    expect(expandedCrumbs).toBeGreaterThan(collapsedCrumbs);
  });

  test("breadcrumb-navigate reports the index into the original items, not the visible list", async ({
    page,
  }) => {
    await page.goto("/");
    const detail = await page.evaluate(async () => {
      const el = document.createElement("breadcrumb-nav") as BreadcrumbElement;
      const items = [
        { label: "Home", href: "/" },
        { label: "Hidden A", href: "/a" },
        { label: "Hidden B", href: "/b" },
        { label: "Parent", href: "/p" },
        { label: "Leaf", href: "/leaf" },
      ];
      el.items = items;
      el.maxVisible = 3;
      document.body.append(el);
      await el.updateComplete;

      return new Promise<{ label: string; index: number; bubbles: boolean; composed: boolean }>(
        (resolve) => {
          document.addEventListener(
            "breadcrumb-navigate",
            (event) => {
              const e = event as CustomEvent<{ item: { label: string }; index: number }>;
              resolve({
                label: e.detail.item.label,
                index: e.detail.index,
                bubbles: e.bubbles,
                composed: e.composed,
              });
              el.remove();
            },
            { once: true },
          );
          // Expand first, so the clicked crumb sits at a different position in
          // the visible list than in the original array — the exact case where
          // indexing off the rendered list instead of the source would slip by.
          el.shadowRoot!.querySelector<HTMLButtonElement>("button.overflow")!.click();
          void el.updateComplete.then(() => {
            const anchors = Array.from(el.shadowRoot!.querySelectorAll<HTMLAnchorElement>("a.crumb"));
            anchors.find((anchor) => anchor.textContent?.trim() === "Parent")!.click();
          });
        },
      );
    });

    expect(detail).toEqual({ label: "Parent", index: 3, bubbles: true, composed: true });
  });

  test("renders nothing at all for an empty or non-array trail", async ({ page }) => {
    await page.goto("/");
    for (const items of [[], null, "nope", 42]) {
      const html = await page.evaluate(async (items) => {
        const el = document.createElement("breadcrumb-nav") as BreadcrumbElement;
        el.items = items;
        document.body.append(el);
        await el.updateComplete;
        const result = el.shadowRoot!.querySelectorAll("nav").length;
        el.remove();
        return result;
      }, items);
      expect(html).toBe(0);
    }
  });
});
