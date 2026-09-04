import { test, expect } from "@playwright/test";

test.describe("step-ladder", () => {
  test("renders each item as a titled, described rung", async ({ page }) => {
    await page.goto("/");
    const rungs = page.locator("#step-ladder-demo .rung");
    await expect(rungs).toHaveCount(3);
    await expect(rungs.nth(0).locator(".title")).toHaveText("Does this need to exist?");
    await expect(rungs.nth(0).locator(".description")).toHaveText("Speculative need = skip it.");

    // The ordinal is a CSS counter (`::before { content: counter(...) }`), which
    // getComputedStyle reports as the unresolved function rather than "01" —
    // resolving it to text is a paint-time concern, not a computed-style one —
    // so its presence is checked structurally instead of asserting the digits.
    const beforeContent = await rungs
      .nth(0)
      .evaluate((el) => getComputedStyle(el, "::before").content);
    expect(beforeContent).toContain("counter(rung");
  });

  test("slotted content takes precedence over items", async ({ page }) => {
    await page.goto("/");
    const rungCount = await page.evaluate(async () => {
      const el = document.createElement("step-ladder") as HTMLElement & {
        updateComplete: Promise<unknown>;
        items: unknown;
      };
      el.items = [{ title: "Ignored", description: "Should not render" }];
      el.innerHTML = "<li>Custom slotted rung</li>";
      document.body.append(el);
      await el.updateComplete;
      await el.updateComplete;
      const count = el.shadowRoot!.querySelectorAll(".rung").length;
      el.remove();
      return count;
    });
    expect(rungCount).toBe(0);
  });
});
