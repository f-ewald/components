import { test, expect } from "@playwright/test";

test.describe("autocomplete-input", () => {
  test("filters the playground's local options, fires option-select, and submits via the form", async ({ page }) => {
    let apiRequests = 0;
    await page.route("**/api/autocomplete**", async (route) => {
      apiRequests += 1;
      await route.abort();
    });

    await page.goto("/");
    const autocomplete = page.locator("#autocomplete-demo");
    const input = autocomplete.locator("input");

    await input.fill("Jav");
    const suggestions = autocomplete.locator(".suggestion");
    await expect(suggestions).toHaveCount(2);
    await expect(suggestions.first()).toContainText("JavaScript");
    await expect(suggestions.nth(1)).toContainText("Java");

    await suggestions.first().click();
    await expect(input).toHaveValue("JavaScript");
    await expect(page.locator("#autocomplete-selected")).toContainText("JavaScript (key: js)");

    await page.locator('#autocomplete-form button[type="submit"]').click();
    await expect(page.locator("#autocomplete-selected")).toContainText("Submitted form value: JavaScript");

    expect(apiRequests).toBe(0);
  });

  test("fetches options from the endpoint in API mode", async ({ page }) => {
    await page.route("**/api/autocomplete**", async (route) => {
      const url = new URL(route.request().url());
      expect(url.searchParams.get("q")).toBe("Pyt");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { key: "py", value: "Python" },
          { key: "py2", value: "Python 2" },
        ]),
      });
    });

    await page.goto("/");
    await page.evaluate(() => {
      const el = document.createElement("autocomplete-input") as HTMLElement & { endpoint: string };
      el.id = "autocomplete-api-demo";
      el.endpoint = "/api/autocomplete";
      document.body.appendChild(el);
    });

    const autocomplete = page.locator("#autocomplete-api-demo");
    const input = autocomplete.locator("input");
    await input.fill("Pyt");

    const suggestions = autocomplete.locator(".suggestion");
    await expect(suggestions).toHaveCount(2);
    await suggestions.first().click();
    await expect(input).toHaveValue("Python");
  });
});
