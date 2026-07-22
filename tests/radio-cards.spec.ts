import { test, expect } from "@playwright/test";

test.describe("radio-cards", () => {
  test("renders options, reflects the selected value, and fires change", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("#radio-cards-demo");

    await expect(cards.locator(".card")).toHaveCount(2);
    await expect(cards.locator(".card").nth(0).locator("input")).toBeChecked();

    await cards.locator(".card").nth(1).click();
    await expect(cards.locator(".card").nth(1).locator("input")).toBeChecked();
    await expect(cards.locator(".card").nth(0).locator("input")).not.toBeChecked();
    await expect(page.locator("#radio-cards-selected")).toHaveText("detailed");
  });

  test("preserves native keyboard focus and disabled behavior", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("#radio-cards-demo");
    const first = cards.locator("input").first();
    await first.focus();
    expect(
      await cards.locator(".card").first().evaluate((element) => getComputedStyle(element).boxShadow),
    ).not.toBe("none");
    await first.press("ArrowRight");
    await expect(cards.locator("input").nth(1)).toBeChecked();

    await cards.evaluate((element) => {
      (element as HTMLElement & { disabled: boolean }).disabled = true;
    });
    await expect(cards.locator("input:disabled")).toHaveCount(2);

    await page.emulateMedia({ forcedColors: "active" });
    const disabledColors = await cards.locator(".card").first().evaluate((card) => {
      const cardStyle = getComputedStyle(card);
      const labelStyle = getComputedStyle(card.querySelector(".card-label")!);
      const descriptionStyle = getComputedStyle(card.querySelector(".card-description")!);
      return {
        card: cardStyle.color,
        label: labelStyle.color,
        description: descriptionStyle.color,
      };
    });
    expect(disabledColors.label).toBe(disabledColors.card);
    expect(disabledColors.description).toBe(disabledColors.card);
  });
});
