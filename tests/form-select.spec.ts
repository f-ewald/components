import { test, expect } from "@playwright/test";

test.describe("form-select", () => {
  test("click opens the listbox, picking an option commits, fires change, and closes", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#select-state");
    const trigger = el.locator("button.trigger");

    await expect(trigger).toHaveText("Open");
    await expect(el.locator("input.search-input")).toHaveCount(0);
    await trigger.click();

    const options = el.locator("li[role='option']");
    await expect(options).toHaveCount(5);
    await options.filter({ hasText: "Done" }).click();

    await expect(trigger).toHaveText("Done");
    const selectedIcon = trigger.locator(".option-icon");
    await expect(selectedIcon).toHaveCount(1);
    const selectedIconBounds = await selectedIcon.boundingBox();
    expect(selectedIconBounds?.width).toBe(16);
    expect(selectedIconBounds?.height).toBe(16);
    await expect(page.locator("#select-change-log")).toHaveText("select-state: done");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("Escape closes the listbox without committing", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-state");
    const trigger = el.locator("button.trigger");

    await trigger.click();
    await expect(el.locator("ul.options")).toBeVisible();
    await trigger.press("Escape");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("a disabled select does not open on click", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-disabled");
    await el.locator("button.trigger").click({ force: true });
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("searchable mode filters labels by case-insensitive infix and clearing restores all options", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");

    await expect(el.locator("button.trigger")).toHaveCount(0);
    await input.click();
    await expect(el.locator("li[role='option']")).toHaveCount(5);
    await expect(input).toHaveAttribute("role", "combobox");
    await expect(input).toHaveAttribute("aria-autocomplete", "list");

    await input.fill("GRESS");
    const filtered = el.locator("li[role='option']");
    await expect(filtered).toHaveCount(1);
    await expect(filtered).toHaveText("In progress");
    await expect(input).toHaveAttribute("aria-activedescendant", "form-select-option-0");
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "open",
    );

    await input.fill("");
    await expect(el.locator("li[role='option']")).toHaveCount(5);
  });

  test("searchable mode commits only explicit mouse selections and emits change once", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");
    await el.evaluate((element) => {
      const changes: string[] = [];
      (element as HTMLElement & { testChanges: string[] }).testChanges = changes;
      element.addEventListener("change", (event) => {
        changes.push((event as CustomEvent<{ value: string }>).detail.value);
      });
    });

    await input.fill("VIEW");
    await expect(el.locator(".selected-icon")).toHaveCount(0);
    await el.locator("li[role='option']").click();

    await expect(input).toHaveValue("Needs review");
    const selectedIcon = el.locator(".selected-icon");
    await expect(selectedIcon).toHaveCount(1);
    const selectedIconBounds = await selectedIcon.boundingBox();
    expect(selectedIconBounds?.width).toBe(18);
    expect(selectedIconBounds?.height).toBe(18);
    await expect(el.locator("ul.options")).toHaveCount(0);
    await expect(page.locator("#select-searchable-log")).toHaveText("select-searchable: review");
    const state = await el.evaluate((element) => {
      const select = element as HTMLElement & { value: string; testChanges: string[] };
      return { value: select.value, changes: select.testChanges };
    });
    expect(state).toEqual({ value: "review", changes: ["review"] });
  });

  test("searchable keyboard navigation selects from the filtered list", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");

    await input.fill("re");
    const options = el.locator("li[role='option']");
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toHaveText("In progress");
    await expect(options.nth(1)).toHaveText("Needs review");
    await expect(options.nth(0)).toHaveClass(/active/);

    await input.press("ArrowDown");
    await expect(options.nth(1)).toHaveClass(/active/);
    await input.press("Enter");

    await expect(input).toHaveValue("Needs review");
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "review",
    );
  });

  test("invalid searchable text cannot be committed and Escape restores the selected label", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");

    await input.fill("not a task state");
    await expect(el.locator("li[role='option']")).toHaveCount(0);
    await expect(el.getByRole("status")).toHaveText("No options found");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await input.press("Enter");
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "open",
    );
    await expect(page.locator("#select-searchable-log")).toHaveText("");

    await input.press("Escape");
    await expect(input).toHaveValue("Open");
    await expect(el.locator("ul.options")).toHaveCount(0);

    await input.click();
    await expect(el.locator("ul.options")).toBeVisible();
  });

  test("blur and outside click discard uncommitted text without changing value", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");

    await input.fill("temporary");
    await page.getByRole("heading", { name: "form-select" }).click();
    await expect(input).toHaveValue("Open");
    await expect(el.locator("ul.options")).toHaveCount(0);
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "open",
    );
    await expect(page.locator("#select-searchable-log")).toHaveText("");
  });

  test("disabled searchable mode stays closed and unknown programmatic values remain compatible", async ({
    page,
  }) => {
    await page.goto("/");
    const disabled = page.locator("#select-disabled");
    await disabled.evaluate((element) => {
      (element as HTMLElement & { searchable: boolean }).searchable = true;
    });
    const disabledInput = disabled.locator("input.search-input");
    await expect(disabledInput).toBeDisabled();
    await disabledInput.click({ force: true });
    await expect(disabled.locator("ul.options")).toHaveCount(0);

    const searchable = page.locator("#select-searchable");
    const input = searchable.locator("input.search-input");
    await searchable.evaluate((element) => {
      (element as HTMLElement & { value: string }).value = "custom";
    });
    await expect(input).toHaveValue("custom");
    await input.fill("invalid");
    await input.press("Escape");
    await expect(input).toHaveValue("custom");
    expect(
      await searchable.evaluate((element) => (element as HTMLElement & { value: string }).value),
    ).toBe("custom");
  });

  test("searchable mode ignores IME confirmation Enter", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");

    await input.fill("re");
    await input.evaluate((element) => {
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
          isComposing: true,
        }),
      );
    });

    await expect(input).toHaveValue("re");
    await expect(el.locator("ul.options")).toBeVisible();
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "open",
    );
  });

  test("searchable mode ignores Safari-style Enter immediately after composition ends", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");
    await input.fill("re");

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
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "open",
    );
    await expect(el.locator("ul.options")).toBeVisible();

    await page.waitForTimeout(0);
    await input.press("Enter");
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "in_progress",
    );
  });

  test("searchable list stays open while its scrollbar is used", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    await el.evaluate((element) => {
      (element as HTMLElement & { options: Array<{ value: string; label: string }> }).options =
        Array.from({ length: 100 }, (_, index) => ({
          value: `option-${index}`,
          label: `Option ${index}`,
        }));
    });
    const input = el.locator("input.search-input");
    await input.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await input.fill("Option");
    const listbox = el.locator("ul.options");
    await expect(el.locator("li[role='option']")).toHaveCount(100);
    await input.evaluate((element) => element.setSelectionRange(2, 4));
    const bounds = await listbox.boundingBox();
    expect(bounds).not.toBeNull();

    await page.mouse.move(bounds!.x + bounds!.width - 2, bounds!.y + bounds!.height / 2);
    await page.mouse.down();
    await expect(listbox).toBeVisible();
    await page.mouse.move(bounds!.x + bounds!.width - 2, bounds!.y + bounds!.height - 4);
    await page.mouse.up();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    const focusState = await input.evaluate((element) => {
      const root = element.getRootNode() as ShadowRoot;
      const inputElement = element as HTMLInputElement;
      return {
        focused: root.activeElement === element,
        selectionStart: inputElement.selectionStart,
        selectionEnd: inputElement.selectionEnd,
      };
    });
    expect(focusState).toEqual({ focused: true, selectionStart: 2, selectionEnd: 4 });
    await expect(input).toHaveValue("Option");
    await expect(el.locator("li[role='option']")).toHaveCount(100);

    await input.press("Tab");
    await expect(listbox).toHaveCount(0);
  });

  test("keyboard navigation scrolls a wrapped active option into view", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    await el.evaluate((element) => {
      const select = element as HTMLElement & {
        options: Array<{ value: string; label: string }>;
        value: string;
      };
      select.options = Array.from({ length: 100 }, (_, index) => ({
        value: `option-${index}`,
        label: `Option ${index}`,
      }));
      select.value = "";
    });
    const input = el.locator("input.search-input");
    await input.click();
    await input.press("ArrowUp");

    const options = el.locator("li[role='option']");
    await expect(options.nth(99)).toHaveClass(/active/);
    await expect(input).toHaveAttribute("aria-activedescendant", "form-select-option-99");
    expect(await el.locator("ul.options").evaluate((list) => list.scrollTop)).toBeGreaterThan(0);
  });

  test("keyboard focus leaving a passively hovered list closes it", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");
    await input.click();
    await el.locator("li[role='option']").first().hover();

    await input.press("Shift+Tab");
    await expect(el.locator("ul.options")).toHaveCount(0);
    await expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("disconnecting an open searchable select resets it before reconnection", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    await el.locator("input.search-input").click();
    await expect(el.locator("ul.options")).toBeVisible();

    await el.evaluate((element) => {
      const parent = element.parentElement!;
      element.remove();
      parent.append(element);
    });

    await expect(el.locator("ul.options")).toHaveCount(0);
    await page.getByRole("heading", { name: "form-select" }).click();
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("RTL scrollbar gutter does not block valid right-edge option clicks", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    await el.evaluate((element) => element.setAttribute("dir", "rtl"));
    await el.locator("input.search-input").click();
    const option = el.locator("li[role='option']").filter({ hasText: "Done" });
    const bounds = await option.boundingBox();
    expect(bounds).not.toBeNull();

    await page.mouse.click(bounds!.x + bounds!.width - 2, bounds!.y + bounds!.height / 2);
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "done",
    );
  });

  test("non-primary option clicks never commit a value", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const input = el.locator("input.search-input");
    await input.click();
    const done = el.locator("li[role='option']").filter({ hasText: "Done" });

    await done.click({ button: "right" });
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "open",
    );
    await input.click();
    await done.dispatchEvent("mousedown", { button: 1 });
    expect(await el.evaluate((element) => (element as HTMLElement & { value: string }).value)).toBe(
      "open",
    );
    await expect(page.locator("#select-searchable-log")).toHaveText("");
  });

  test("non-primary trigger presses do not open searchable mode", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    const trigger = el.locator(".search-trigger");
    const bounds = await trigger.boundingBox();
    expect(bounds).not.toBeNull();
    const chevronX = bounds!.x + bounds!.width - 4;
    const centerY = bounds!.y + bounds!.height / 2;

    await page.mouse.click(chevronX, centerY, { button: "right" });
    await expect(el.locator("ul.options")).toHaveCount(0);
    await trigger.dispatchEvent("mousedown", { button: 1 });
    await expect(el.locator("ul.options")).toHaveCount(0);
    await expect(el.locator("input.search-input")).not.toBeFocused();

    const input = el.locator("input.search-input");
    const inputBounds = await input.boundingBox();
    expect(inputBounds).not.toBeNull();
    const inputCenter = {
      x: inputBounds!.x + inputBounds!.width / 2,
      y: inputBounds!.y + inputBounds!.height / 2,
    };
    await page.mouse.click(inputCenter.x, inputCenter.y, { button: "right" });
    await expect(el.locator("ul.options")).toHaveCount(0);
    await expect(input).not.toBeFocused();
    await page.mouse.click(inputCenter.x, inputCenter.y, { button: "middle" });
    await expect(el.locator("ul.options")).toHaveCount(0);
    await expect(input).not.toBeFocused();
  });

  test("renders square per-option icons without reserving space for iconless labels", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#select-state");
    await el.evaluate((element) => {
      element.style.setProperty("--ui-surface", "#000");
      element.style.setProperty("--ui-text", "#fff");
    });
    await el.locator("button.trigger").click();
    const backlog = el.locator("li[role='option']").filter({ hasText: "Backlog" });
    const open = el.locator("li[role='option']").filter({ hasText: "Open" });
    const review = el.locator("li[role='option']").filter({ hasText: "Needs review" });

    const backlogIcon = backlog.locator(".option-icon");
    const reviewIcon = review.locator(".option-icon");
    await expect(backlogIcon).toHaveCount(1);
    await expect(reviewIcon).toHaveCount(1);
    await expect(open.locator(".option-icon")).toHaveCount(0);
    await expect(open.locator(".option-content > *")).toHaveCount(1);

    const dimensions = await Promise.all(
      [backlogIcon, reviewIcon].map((icon) =>
        icon.evaluate((element) => {
          const iconBounds = element.getBoundingClientRect();
          const svgBounds = element.querySelector("svg")!.getBoundingClientRect();
          return {
            wrapper: [iconBounds.width, iconBounds.height],
            svg: [svgBounds.width, svgBounds.height],
          };
        }),
      ),
    );
    expect(dimensions[0]).toEqual({ wrapper: [14, 14], svg: [14, 14] });
    expect(dimensions[1]).toEqual({ wrapper: [18, 18], svg: [18, 18] });
    await expect(backlog.locator(".option-label")).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(backlogIcon).toHaveCSS("color", "rgb(255, 255, 255)");

    const openAlignment = await open.evaluate((option) => {
      const optionLeft = option.getBoundingClientRect().left;
      const labelLeft = option.querySelector(".option-label")!.getBoundingClientRect().left;
      return labelLeft - optionLeft;
    });
    expect(openAlignment).toBeLessThan(12);
  });

  test("searchable mode has a fallback accessible name when label is omitted", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#select-searchable");
    await el.evaluate((element) => {
      (element as HTMLElement & { label: string }).label = "";
    });
    await expect(el.locator("input.search-input")).toHaveAccessibleName("Select an option");
  });
});
