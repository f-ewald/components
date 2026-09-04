import { test, expect } from "@playwright/test";

test.describe("spec-list", () => {
  test("renders the data-driven items as dt/dd pairs", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#spec-list-demo");
    const keys = el.locator(".row dt");
    const values = el.locator(".row dd");
    await expect(keys).toHaveText(["Material", "Weight", "Warranty"]);
    await expect(values).toHaveText(["Anodized aluminum", "1.2 kg", "2 years"]);
  });

  test("renders slotted markup instead of the items path", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#spec-list-slotted");
    // The consumer's own markup (with a link) is projected, not the shadow rows.
    await expect(el.locator("dt")).toContainText(["Homepage"]);
    const link = el.locator("dd a");
    await expect(link).toHaveText("example.com");
    await expect(link).toHaveAttribute("href", /example\.com/);
    // No shadow-DOM `.row` is emitted when the slot wins.
    await expect(el.locator("dl .row")).toHaveCount(0);
  });

  test("stacks the key over the value when layout is stacked", async ({ page }) => {
    await page.goto("/");
    const boxes = await page.evaluate(async () => {
      const el = document.createElement("spec-list") as HTMLElement & {
        items: Array<{ label: string; value: string }>;
        layout: string;
        updateComplete: Promise<unknown>;
      };
      el.layout = "stacked";
      el.items = [{ label: "Material", value: "Anodized aluminum" }];
      document.body.append(el);
      await el.updateComplete;
      const dt = el.shadowRoot!.querySelector("dt")!.getBoundingClientRect();
      const dd = el.shadowRoot!.querySelector("dd")!.getBoundingClientRect();
      el.remove();
      return { dtBottom: dt.bottom, ddTop: dd.top };
    });
    expect(boxes.ddTop).toBeGreaterThanOrEqual(boxes.dtBottom - 1);
  });
});
