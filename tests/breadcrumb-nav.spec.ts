import { test, expect } from "@playwright/test";

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

  test("collapses the middle and reveals it when the overflow button is activated", async ({
    page,
  }) => {
    await page.goto("/");
    const host = page.locator("#breadcrumb-nav-collapsed");
    const overflow = host.locator("button.overflow");

    await expect(overflow).toHaveAttribute("aria-expanded", "false");
    const collapsedCrumbs = await host.locator("a.crumb, .static").count();

    await overflow.click();
    await expect(overflow).toHaveAttribute("aria-expanded", "true");
    const expandedCrumbs = await host.locator("a.crumb, .static").count();
    expect(expandedCrumbs).toBeGreaterThan(collapsedCrumbs);
  });

  test("activating a crumb fires breadcrumb-navigate with the item and index", async ({ page }) => {
    await page.goto("/");
    const host = page.locator("#breadcrumb-nav-demo");

    const detail = await host.evaluate((el) => {
      return new Promise<{ label: string; index: number }>((resolve) => {
        el.addEventListener("breadcrumb-navigate", (event) => {
          const e = event as CustomEvent<{ item: { label: string }; index: number }>;
          resolve({ label: e.detail.item.label, index: e.detail.index });
        });
        el.shadowRoot!.querySelector<HTMLAnchorElement>("a.crumb")!.click();
      });
    });

    expect(detail.index).toBe(0);
    expect(detail.label.length).toBeGreaterThan(0);
  });
});
