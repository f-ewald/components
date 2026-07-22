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

  test("exposes complete combobox state, reports no results, and closes when disabled", async ({
    page,
  }) => {
    await page.goto("/");
    const autocomplete = page.locator("#autocomplete-demo");
    const input = autocomplete.locator("input");

    await input.fill("xyz");
    await expect(autocomplete.getByRole("status")).toHaveText("No suggestions found");
    await expect(input).toHaveAttribute("role", "combobox");
    await expect(input).toHaveAttribute("aria-autocomplete", "list");
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await page.evaluate(() => {
      const form = document.querySelector<HTMLFormElement>("#autocomplete-form")!;
      const button = form.querySelector<HTMLButtonElement>("button[type='submit']")!;
      button.name = "action";
      button.value = "search";
      button.addEventListener("click", () => {
        document.body.dataset.autocompleteClicked = "true";
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        document.body.dataset.autocompleteSubmitted = "true";
        document.body.dataset.autocompleteSubmitter =
          (event as SubmitEvent).submitter === button ? "true" : "false";
        document.body.dataset.autocompleteAction =
          new FormData(form, (event as SubmitEvent).submitter).get("action")?.toString() ?? "";
      });
    });
    await input.press("Enter");
    await expect(page.locator("body")).toHaveAttribute("data-autocomplete-submitted", "true");
    await expect(page.locator("body")).toHaveAttribute("data-autocomplete-clicked", "true");
    await expect(page.locator("body")).toHaveAttribute("data-autocomplete-submitter", "true");
    await expect(page.locator("body")).toHaveAttribute("data-autocomplete-action", "search");

    await input.fill("Jav");
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
    expect(
      await page.locator("#autocomplete-form").evaluate((form) =>
        new FormData(form as HTMLFormElement).has("language"),
      ),
    ).toBe(false);
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

  test("Enter submission respects cancellation and the first disabled submitter", async ({
    page,
  }) => {
    await page.goto("/");
    const form = page.locator("#autocomplete-form");
    const input = page.locator("#autocomplete-demo input");
    await input.fill("xyz");
    await expect(page.locator("#autocomplete-demo").getByRole("status")).toBeVisible();

    await form.evaluate((element) => {
      element.addEventListener(
        "keydown",
        (event) => {
          event.preventDefault();
          document.body.dataset.autocompleteCanceled = "true";
        },
        { once: true },
      );
      element.addEventListener("submit", (event) => {
        event.preventDefault();
        document.body.dataset.autocompleteUnexpectedSubmit = "true";
      });
    });
    await input.press("Enter");
    await expect(page.locator("body")).toHaveAttribute("data-autocomplete-canceled", "true");
    await expect(page.locator("body")).not.toHaveAttribute("data-autocomplete-unexpected-submit");

    await form.evaluate((element) => {
      const formElement = element as HTMLFormElement;
      const disabled = document.createElement("button");
      disabled.type = "submit";
      disabled.disabled = true;
      disabled.textContent = "Disabled default";
      formElement.insertBefore(disabled, formElement.firstChild);
      formElement.querySelector<HTMLButtonElement>("button:not(:disabled)")!.addEventListener(
        "click",
        () => {
          document.body.dataset.autocompleteWrongSubmitter = "true";
        },
      );
    });
    await input.press("Enter");
    await page.waitForTimeout(0);
    await expect(page.locator("body")).not.toHaveAttribute("data-autocomplete-wrong-submitter");
    await expect(page.locator("body")).not.toHaveAttribute("data-autocomplete-unexpected-submit");
  });

  test("IME confirmation Enter neither selects nor submits", async ({ page }) => {
    await page.goto("/");
    const autocomplete = page.locator("#autocomplete-demo");
    const input = autocomplete.locator("input");
    await input.fill("xyz");
    await expect(autocomplete.getByRole("status")).toBeVisible();
    await page.locator("#autocomplete-form").evaluate((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        document.body.dataset.autocompleteImeSubmitted = "true";
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
    await expect(page.locator("body")).not.toHaveAttribute("data-autocomplete-ime-submitted");

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
    await input.fill("Jav");
    await expect(autocomplete.locator(".suggestion")).toHaveCount(2);
    await input.press("Enter");
    await expect(input).toHaveValue("JavaScript");
  });
});
