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

  test("exposes complete combobox state, reports no results, and closes when disabled", async ({
    page,
  }) => {
    await page.goto("/");
    const autocomplete = page.locator("#address-demo");
    const input = autocomplete.locator("input");

    await input.fill("xyz");
    await expect(autocomplete.getByRole("status")).toHaveText("No suggestions found");
    await expect(input).toHaveAttribute("role", "combobox");
    await expect(input).toHaveAttribute("aria-autocomplete", "list");
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await autocomplete.evaluate((element) => {
      const form = document.createElement("form");
      const button = document.createElement("button");
      button.type = "submit";
      button.name = "action";
      button.value = "search";
      button.addEventListener("click", () => {
        document.body.dataset.addressClicked = "true";
      });
      element.parentElement!.insertBefore(form, element);
      form.append(element, button);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        document.body.dataset.addressSubmitted = "true";
        document.body.dataset.addressSubmitter =
          (event as SubmitEvent).submitter === button ? "true" : "false";
        document.body.dataset.addressAction =
          new FormData(form, (event as SubmitEvent).submitter).get("action")?.toString() ?? "";
      });
    });
    await input.press("Enter");
    await expect(page.locator("body")).toHaveAttribute("data-address-submitted", "true");
    await expect(page.locator("body")).toHaveAttribute("data-address-clicked", "true");
    await expect(page.locator("body")).toHaveAttribute("data-address-submitter", "true");
    await expect(page.locator("body")).toHaveAttribute("data-address-action", "search");

    await input.fill("ing");
    await expect(autocomplete.locator(".suggestion")).toHaveCount(2);
    await input.press("ArrowDown");
    const listboxId = await autocomplete.getByRole("listbox").getAttribute("id");
    const firstOption = autocomplete.getByRole("option").first();
    await expect(input).toHaveAttribute("aria-controls", listboxId!);
    await expect(input).toHaveAttribute("aria-activedescendant", await firstOption.getAttribute("id")!);
    await expect(firstOption).toHaveAttribute("aria-selected", "true");

    await autocomplete.evaluate((element) => {
      (element as HTMLElement & { disabled: boolean }).disabled = true;
    });
    await expect(input).toBeDisabled();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(autocomplete.getByRole("listbox")).toHaveCount(0);
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

  test("IME confirmation Enter neither selects nor submits", async ({ page }) => {
    await page.goto("/");
    const autocomplete = page.locator("#address-demo");
    const input = autocomplete.locator("input");
    await input.fill("xyz");
    await expect(autocomplete.getByRole("status")).toBeVisible();
    await autocomplete.evaluate((element) => {
      const form = document.createElement("form");
      element.parentElement!.insertBefore(form, element);
      form.append(element);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        document.body.dataset.addressImeSubmitted = "true";
      });
    });

    await input.evaluate((element) => {
      element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await page.waitForTimeout(0);
    await expect(page.locator("body")).not.toHaveAttribute("data-address-ime-submitted");

    await input.evaluate((element) => {
      element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
      const host = element.getRootNode().host as HTMLElement & { disabled: boolean };
      host.disabled = true;
    });
    await autocomplete.evaluate(async (host: HTMLElement & { updateComplete: Promise<boolean> }) => {
      await host.updateComplete;
      host.removeAttribute("disabled");
      await host.updateComplete;
    });
    await expect(input).toBeEnabled();
    await input.fill("ing");
    await expect(autocomplete.locator(".suggestion")).toHaveCount(2);
    await input.press("Enter");
    await expect(input).toHaveValue("1600 Pennsylvania Ave NW, Washington, DC");
  });
});
