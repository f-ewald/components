import { test, expect } from "@playwright/test";

test.describe("roman-numeral", () => {
  test("renders subtractive notation and updates when the input changes", async ({ page }) => {
    await page.goto("/");
    const output = page.locator("#roman-output");
    await expect(output).toHaveText("MMIV");

    await page.locator("#roman-input").fill("1994");
    await expect(output).toHaveText("MCMXCIV");
  });

  test("rejects nonpositive, fractional, and nonfinite values without throwing", async ({ page }) => {
    await page.goto("/");
    const output = page.locator("#roman-output");

    const rendered = await output.evaluate(async (element) => {
      const romanNumeral = element as HTMLElement & {
        value?: number;
        updateComplete: Promise<boolean>;
      };
      const render = async (value: number | undefined) => {
        romanNumeral.value = value;
        await romanNumeral.updateComplete;
        return romanNumeral.shadowRoot?.textContent ?? "";
      };
      return [
        await render(0),
        await render(-1),
        await render(1.5),
        await render(Number.NaN),
        await render(Number.POSITIVE_INFINITY),
        await render(Number.NEGATIVE_INFINITY),
        await render(undefined),
      ];
    });

    expect(rendered).toEqual(["NaN", "NaN", "NaN", "NaN", "NaN", "NaN", "NaN"]);
  });
});
