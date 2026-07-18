import { test, expect } from "@playwright/test";

test.describe("address-autocomplete", () => {
  test("filters the playground's locally-supplied suggestions array with no network request", async ({ page }) => {
    let geocodeRequests = 0;
    await page.route("**/api/geocode**", async (route) => {
      geocodeRequests += 1;
      await route.abort();
    });

    await page.goto("/");
    const autocomplete = page.locator("#address-demo");
    const input = autocomplete.locator("input");
    // "ing" (>= the default min-length of 3) matches "Washington" and "Downing".
    await input.fill("ing");

    const suggestions = autocomplete.locator(".suggestion");
    await expect(suggestions).toHaveCount(2);
    await expect(suggestions.first()).toContainText("Washington");
    await expect(suggestions.nth(1)).toContainText("Downing");

    await suggestions.first().click();
    await expect(input).toHaveValue("1600 Pennsylvania Ave NW, Washington, DC");
    await expect(page.locator("#address-selected")).toContainText("1600 Pennsylvania Ave NW, Washington, DC");

    expect(geocodeRequests).toBe(0);
  });

  test("shows suggestions from the geocoder and fills the input on selection (API mode)", async ({ page }) => {
    await page.route("**/api/geocode**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          features: [
            {
              properties: { full_address: "1600 Amphitheatre Parkway, Mountain View, CA" },
              geometry: { coordinates: [-122.084, 37.4224] },
            },
            {
              properties: { full_address: "1601 Amphitheatre Parkway, Mountain View, CA" },
              geometry: { coordinates: [-122.085, 37.4225] },
            },
          ],
        }),
      });
    });

    await page.goto("/");
    await page.evaluate(() => {
      const el = document.createElement("address-autocomplete") as HTMLElement & {
        endpoint: string;
        accessToken: string;
      };
      el.id = "address-api-demo";
      el.endpoint = "/api/geocode";
      el.accessToken = "demo-token";
      document.body.appendChild(el);
    });

    const autocomplete = page.locator("#address-api-demo");
    const input = autocomplete.locator("input");

    await input.fill("1600 Amp");
    const suggestions = autocomplete.locator(".suggestion");
    await expect(suggestions.first()).toBeVisible();
    await expect(suggestions).toHaveCount(2);

    await suggestions.first().click();
    await expect(input).toHaveValue("1600 Amphitheatre Parkway, Mountain View, CA");
  });
});
