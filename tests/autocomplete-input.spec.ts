import { test, expect, type Locator, type Page } from "@playwright/test";

type IconName = "iconServer" | "iconBookOpen" | "iconCube" | "iconQuestionMarkCircle" | "iconGlobeAlt";

/** The first path's `d` of each named icon export, so tests can tell rendered icons apart. */
function iconPaths(page: Page): Promise<Record<IconName, string>> {
  return page.evaluate(async () => {
    const icons = (await import("/src/icons.ts")) as unknown as Record<string, () => { strings: string[] }>;
    const names = ["iconServer", "iconBookOpen", "iconCube", "iconQuestionMarkCircle", "iconGlobeAlt"];
    return Object.fromEntries(names.map((name) => [name, icons[name]().strings.join("").match(/ d="([^"]+)"/)![1]]));
  }) as Promise<Record<IconName, string>>;
}

/** The first path's `d` of the icon in each matched container, or null where there is none. */
function shownIcons(containers: Locator): Promise<Array<string | null>> {
  return containers.evaluateAll((els) => els.map((el) => el.querySelector("svg path")?.getAttribute("d") ?? null));
}

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

  test("renders optional icons and muted descriptions without matching on them", async ({ page }) => {
    await page.goto("/");
    const autocomplete = page.locator("#autocomplete-demo");
    const input = autocomplete.locator("input");

    // "TypeScript" mentions JavaScript only in its description, so it must not match.
    await input.fill("Jav");
    const suggestions = autocomplete.locator(".suggestion");
    await expect(suggestions).toHaveCount(2);
    const first = suggestions.first();
    await expect(first.locator(".suggestion-icon svg")).toBeVisible();
    await expect(first.locator(".suggestion-icon")).toHaveAttribute("aria-hidden", "true");
    await expect(first.locator(".suggestion-value")).toHaveText("JavaScript");
    const description = first.locator(".suggestion-description");
    await expect(description).toHaveText("The language of the web");
    await expect(description).toHaveCSS("color", "rgb(100, 116, 139)");
    await expect(description).toHaveCSS("font-size", "11px");
    await expect(first.locator(".suggestion-value")).toHaveCSS("font-size", "12px");
    const [valueBox, descriptionBox] = await Promise.all([
      first.locator(".suggestion-value").boundingBox(),
      description.boundingBox(),
    ]);
    expect(descriptionBox!.y).toBeGreaterThan(valueBox!.y);

    await first.click();
    await expect(page.locator("#autocomplete-selected")).toContainText("JavaScript (key: js)");

    await autocomplete.evaluate((el: HTMLElement & { options: unknown }) => {
      el.options = [{ key: "plain", value: "Plain option" }];
    });
    await input.fill("Pla");
    await expect(suggestions).toHaveCount(1);
    await expect(suggestions.first().locator(".suggestion-icon, .suggestion-description")).toHaveCount(0);
    await expect(suggestions.first()).toHaveText("Plain option");
  });

  test("shows the selected option's icon in the field until the text changes", async ({ page }) => {
    await page.goto("/");
    const autocomplete = page.locator("#autocomplete-demo");
    const input = autocomplete.locator("input");
    const fieldIcon = autocomplete.locator(".field-icon svg");
    await expect(fieldIcon).toHaveCount(0);
    await expect(input).toHaveCSS("padding-left", "12px");

    await input.fill("Jav");
    await autocomplete.locator(".suggestion").first().click();
    await expect(fieldIcon).toBeVisible();
    await expect(input).toHaveCSS("padding-left", "32px");
    expect(await autocomplete.evaluate((el: HTMLElement & { selectedKey: string }) => el.selectedKey)).toBe("js");

    await input.press("Backspace");
    await expect(fieldIcon).toHaveCount(0);

    await page.getByTestId("autocomplete-select-rust").click();
    await expect(input).toHaveValue("Rust");
    await expect(fieldIcon).toBeVisible();
  });

  test("input uses the tokenized text-field padding", async ({ page }) => {
    await page.goto("/");
    const input = page.locator("#autocomplete-demo input");
    await expect(input).toHaveCSS("padding-top", "8px");
    await expect(input).toHaveCSS("padding-right", "32px");
    await expect(input).toHaveCSS("padding-bottom", "8px");
    await expect(input).toHaveCSS("padding-left", "12px");
    await expect(input).toHaveCSS("border-radius", "4px");
    await expect(input).toHaveCSS("height", "32px");
    await expect(input).toHaveCSS("line-height", "17.5px");
  });

  test("clearable empties selected and form state without changing field size", async ({
    page,
  }) => {
    await page.goto("/");
    const autocomplete = page.locator("#autocomplete-demo");
    await autocomplete.evaluate((element) => {
      (element as HTMLElement & { clearable: boolean }).clearable = true;
    });
    const input = autocomplete.locator("input");

    await input.fill("Jav");
    await autocomplete.locator(".suggestion").first().click();
    await expect(input).toHaveValue("JavaScript");

    const clear = autocomplete.getByRole("button", { name: "Clear input" });
    await expect(clear).toBeVisible();
    await expect(clear.locator("svg")).toHaveAttribute("width", "18");
    const before = await input.boundingBox();
    await autocomplete.evaluate((element) => {
      document.body.dataset.autocompleteClearInputs = "0";
      element.addEventListener(
        "input",
        (event) => {
          if (!(event instanceof InputEvent) || event.inputType !== "deleteContentBackward") {
            return;
          }
          document.body.dataset.autocompleteClearInputs = String(
            Number(document.body.dataset.autocompleteClearInputs) + 1,
          );
        },
        { once: true },
      );
    });

    await clear.focus();
    await clear.press("Enter");

    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(clear).toHaveCount(0);
    await expect(autocomplete.getByRole("listbox")).toHaveCount(0);
    await expect(page.locator("body")).toHaveAttribute("data-autocomplete-clear-inputs", "1");
    expect(await input.boundingBox()).toEqual(before);
    expect(
      await autocomplete.evaluate(
        (element) =>
          (element as HTMLElement & { selectedOption: unknown }).selectedOption,
      ),
    ).toBeNull();
    expect(
      await page.locator("#autocomplete-form").evaluate((form) =>
        new FormData(form as HTMLFormElement).get("language"),
      ),
    ).toBe("");
  });

  test("clearable reserves space but hides its action while empty or disabled", async ({
    page,
  }) => {
    await page.goto("/");
    const autocomplete = page.locator("#autocomplete-demo");
    await autocomplete.evaluate((element) => {
      const control = element as HTMLElement & {
        clearable: boolean;
        disabled: boolean;
        value: string;
      };
      control.clearable = true;
      control.value = "Python";
      control.disabled = true;
    });

    await expect(autocomplete.getByRole("button", { name: "Clear input" })).toHaveCount(0);
    await expect(autocomplete.locator("input")).toHaveCSS("padding-right", "32px");
    await autocomplete.evaluate((element) => {
      const control = element as HTMLElement & { disabled: boolean; value: string };
      control.disabled = false;
      control.value = "";
    });
    await expect(autocomplete.getByRole("button", { name: "Clear input" })).toHaveCount(0);
  });

  test("a newer keystroke drops the response for the older query", async ({ page }) => {
    await page.goto("/");
    const shown = await page.evaluate(async () => {
      const resolvers = new Map<string, (body: unknown) => void>();
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((resolve, reject) => {
          const query = new URL(String(input), location.href).searchParams.get("q")!;
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          resolvers.set(query, (body) => resolve(new Response(JSON.stringify(body))));
        });
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const el = document.createElement("autocomplete-input");
      el.endpoint = "/api/stale";
      el.debounce = 200;
      document.body.append(el);
      await el.updateComplete;
      const input = el.shadowRoot!.querySelector("input")!;
      const type = (text: string) => {
        input.value = text;
        input.dispatchEvent(new InputEvent("input", { bubbles: true }));
      };
      type("ber");
      await sleep(250);
      type("berl");
      resolvers.get("ber")!([{ key: "old", value: "Stale result" }]);
      // Well inside the 200ms debounce for "berl", so its own request hasn't started yet.
      await sleep(20);
      await el.updateComplete;
      return [...el.shadowRoot!.querySelectorAll("[role=option]")].map((option) => option.textContent!.trim());
    });
    expect(shown).toEqual([]);
  });

  test("API options name their icons from `icons`; the rest fall back to optionIcon", async ({ page }) => {
    await page.route("**/api/services**", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([
          { key: "a", value: "Alpha", icon: "service" },
          { key: "b", value: "Beta", icon: "unknown" },
          { key: "c", value: "Gamma" },
          { key: "d", value: "Delta", icon: { _$litType$: 1, strings: ["<img src=x>"], values: [] } },
          { key: "e", value: "Epsilon", icon: "constructor" },
        ]),
      }),
    );
    await page.goto("/");
    const paths = await iconPaths(page);
    await page.evaluate(async () => {
      const { iconServer, iconQuestionMarkCircle } = await import("/src/icons.ts");
      const el = Object.assign(document.createElement("autocomplete-input"), {
        id: "autocomplete-icons",
        endpoint: "/api/services",
        icons: { service: iconServer },
        optionIcon: () => iconQuestionMarkCircle(14),
      });
      document.body.prepend(el);
    });
    const autocomplete = page.locator("#autocomplete-icons");
    const input = autocomplete.locator("input");
    const rows = autocomplete.locator(".suggestion");

    await input.fill("alp");
    await expect(rows).toHaveCount(5);
    const fallback = paths.iconQuestionMarkCircle;
    expect(await shownIcons(rows)).toEqual([paths.iconServer, fallback, fallback, fallback, fallback]);
    await expect(autocomplete.locator(".suggestion img")).toHaveCount(0);

    await rows.first().click();
    expect(await shownIcons(autocomplete.locator(".field-icon"))).toEqual([paths.iconServer]);

    await autocomplete.evaluate((el: HTMLElement & { optionIcon: unknown }) => {
      el.optionIcon = null;
    });
    await input.fill("bet");
    await expect(rows).toHaveCount(5);
    expect(await shownIcons(rows)).toEqual([paths.iconServer, null, null, null, null]);
  });

  test("a local option's own icon wins over optionIcon, which covers the rest", async ({ page }) => {
    await page.goto("/");
    const paths = await iconPaths(page);
    const autocomplete = page.locator("#autocomplete-demo");
    await autocomplete.evaluate(async (el: HTMLElement & { optionIcon: unknown; options: unknown }) => {
      const { iconGlobeAlt, iconQuestionMarkCircle } = await import("/src/icons.ts");
      el.options = [
        { key: "js", value: "JavaScript", icon: iconGlobeAlt(14) },
        { key: "jsx", value: "JavaScript XML" },
      ];
      el.optionIcon = () => iconQuestionMarkCircle(14);
    });
    await autocomplete.locator("input").fill("JavaScript");
    const rows = autocomplete.locator(".suggestion");
    await expect(rows).toHaveCount(2);
    expect(await shownIcons(rows)).toEqual([paths.iconGlobeAlt, paths.iconQuestionMarkCircle]);
  });

  test("the playground's endpoint shows named icons and an icon for a selection made from code", async ({
    page,
  }) => {
    await page.goto("/#autocomplete-input");
    const paths = await iconPaths(page);
    const autocomplete = page.getByTestId("autocomplete-endpoint-demo");
    const input = autocomplete.locator("input");
    const fieldIcon = autocomplete.locator(".field-icon");

    await page.getByTestId("autocomplete-endpoint-select").click();
    await expect(input).toHaveValue("checkout-api");
    expect(await shownIcons(fieldIcon)).toEqual([paths.iconQuestionMarkCircle]);
    await input.fill("checkout");
    await expect(fieldIcon.locator("svg")).toHaveCount(0);

    await input.fill("che");
    const rows = autocomplete.locator(".suggestion");
    await expect(rows).toHaveCount(4);
    expect(await shownIcons(rows)).toEqual([
      paths.iconServer,
      paths.iconBookOpen,
      paths.iconCube,
      paths.iconQuestionMarkCircle,
    ]);
    await rows.first().click();
    expect(await shownIcons(fieldIcon)).toEqual([paths.iconServer]);
  });
});
