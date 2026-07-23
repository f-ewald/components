import { test, expect, type Page } from "@playwright/test";

/**
 * The playground registers `<multi-select>` through `src/index.ts`; each test
 * mounts an isolated fixture through a small in-page factory. `iconTag` is
 * imported directly so icon-bearing options get a real template.
 */
const SETUP = `
  import { iconTag } from "/src/icons.ts";
  window.__mkMultiSelect = (config) => {
    const el = document.createElement("multi-select");
    let count = 0;
    el.addEventListener("change", (e) => {
      count += 1;
      el.dataset.changeCount = String(count);
      el.dataset.lastValues = JSON.stringify(e.detail.values);
    });
    el.dataset.changeCount = "0";
    if (config.id) el.id = config.id;
    if (config.name) el.name = config.name;
    if (config.label) el.label = config.label;
    if (config.placeholder) el.placeholder = config.placeholder;
    if (config.searchable) el.searchable = true;
    if (config.variant) el.variant = config.variant;
    if (typeof config.visibleRows === "number") el.visibleRows = config.visibleRows;
    if (config.showChips) el.showChips = true;
    if (config.disabled) el.disabled = true;
    if (config.required) el.required = true;
    if (typeof config.max === "number") el.max = config.max;
    if (config.dir) el.setAttribute("dir", config.dir);
    el.options = (config.options || []).map((o) => ({
      value: o.value,
      label: o.label,
      disabled: o.disabled,
      icon: o.icon ? iconTag(o.iconSize || 16) : undefined,
      iconSize: o.iconSize,
    }));
    if (config.values) el.values = config.values;
    return el;
  };
`;

const OPTIONS = [
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "amber", label: "Amber" },
];

/** Loads the source and installs the in-page factory. */
async function setup(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => document.getElementById("multi-select")?.remove());
  await page.addScriptTag({ type: "module", content: SETUP });
  await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__mkMultiSelect === "function");
  await page.evaluate(() => customElements.whenDefined("multi-select"));
}

interface FixtureConfig {
  id: string;
  name?: string;
  label?: string;
  placeholder?: string;
  searchable?: boolean;
  variant?: "dropdown" | "list";
  visibleRows?: number;
  showChips?: boolean;
  disabled?: boolean;
  required?: boolean;
  max?: number;
  dir?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean; icon?: boolean; iconSize?: number }>;
  values?: string[];
  inFieldset?: boolean;
  inForm?: boolean;
}

/** Mounts a `<multi-select>` fixture, optionally inside a form/fieldset. */
async function mount(page: Page, config: FixtureConfig): Promise<void> {
  await page.evaluate((cfg) => {
    const make = (window as unknown as { __mkMultiSelect: (c: unknown) => HTMLElement }).__mkMultiSelect;
    const el = make(cfg);
    let host: HTMLElement = document.body;
    if (cfg.inForm) {
      const form = document.createElement("form");
      form.id = `${cfg.id}-form`;
      form.addEventListener("submit", (e) => e.preventDefault());
      document.body.appendChild(form);
      host = form;
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.textContent = "Submit";
      form.appendChild(submit);
    }
    if (cfg.inFieldset) {
      const fieldset = document.createElement("fieldset");
      fieldset.id = `${cfg.id}-fieldset`;
      fieldset.disabled = true;
      host.appendChild(fieldset);
      host = fieldset;
    }
    host.appendChild(el);
  }, config as unknown as Record<string, unknown>);
}

test.describe("multi-select", () => {
  test("fills its container by default and shrinks with an inline-block host", async ({ page }) => {
    await page.goto("/");
    const fullWidth = (await page.locator("#ms-dropdown").boundingBox())!;
    const inline = (await page.locator("#ms-inline").boundingBox())!;
    expect(inline.width).toBeLessThan(fullWidth.width);
  });

  test("renders a combobox trigger with name/label ARIA and placeholder", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", name: "colors", label: "Colors", placeholder: "Pick colors", options: OPTIONS });
    const el = page.locator("#ms");
    const trigger = el.locator("button.trigger");

    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("role", "combobox");
    await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-label", "Colors");
    await expect(trigger.locator(".trigger-label")).toHaveText("Pick colors");
    await expect(el.locator(".chips")).toHaveCount(0);
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("opens, toggles the same option twice with the mouse while staying open, and reports change detail", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", name: "colors", options: OPTIONS });
    const el = page.locator("#ms");
    const trigger = el.locator("button.trigger");

    await trigger.click();
    const listbox = el.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute("aria-multiselectable", "true");
    const options = el.locator("li[role='option']");
    await expect(options).toHaveCount(4);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const green = options.filter({ hasText: "Green" });
    await green.click();
    await expect(green).toHaveAttribute("aria-selected", "true");
    await expect(listbox).toBeVisible();
    await expect(el).toHaveAttribute("data-change-count", "1");
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["green"]));

    await green.click();
    await expect(green).toHaveAttribute("aria-selected", "false");
    await expect(listbox).toBeVisible();
    await expect(el).toHaveAttribute("data-change-count", "2");
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify([]));

    await options.filter({ hasText: "Red" }).click();
    await options.filter({ hasText: "Blue" }).click();
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["red", "blue"]));
    await expect(trigger.locator(".trigger-label")).toHaveText("2 selected");
  });

  test("supports full keyboard navigation and retains focus on Escape", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS });
    const el = page.locator("#ms");
    const trigger = el.locator("button.trigger");

    await trigger.focus();
    await trigger.press(" ");
    await expect(el.getByRole("listbox")).toBeVisible();

    await trigger.press("ArrowDown");
    await trigger.press("Enter");
    await expect(el.locator("li[role='option']").nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["green"]));
    await expect(el.getByRole("listbox")).toBeVisible();

    await trigger.press("End");
    await expect(el.locator("li[role='option']").nth(3)).toHaveClass(/active/);
    await trigger.press("Home");
    await expect(el.locator("li[role='option']").nth(0)).toHaveClass(/active/);

    await trigger.press("Escape");
    await expect(el.locator("ul.options")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(el).toHaveAttribute("data-change-count", "1");

    await trigger.press("Tab");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("searchable mode infix-filters labels and keeps typed text out of the value", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", searchable: true, options: OPTIONS });
    const el = page.locator("#ms");
    const input = el.locator("input.search-input");

    await expect(el.locator("button.trigger")).toHaveCount(0);
    await expect(input).toHaveAttribute("role", "combobox");
    await expect(input).toHaveAttribute("aria-autocomplete", "list");

    await input.click();
    await expect(el.locator("li[role='option']")).toHaveCount(4);
    await input.fill("re");
    const filtered = el.locator("li[role='option']");
    await expect(filtered).toHaveCount(2);
    await expect(filtered.nth(0)).toHaveText("Red");
    await expect(filtered.nth(1)).toHaveText("Green");

    await filtered.filter({ hasText: "Green" }).click();
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["green"]));
    // The query is unaffected by selecting and only clears on close.
    await expect(input).toHaveValue("re");
    await input.press("Escape");
    await expect(input).toHaveValue("");
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("guards IME composition and the post-composition Enter", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", searchable: true, options: OPTIONS });
    const el = page.locator("#ms");
    const input = el.locator("input.search-input");
    await input.click();
    await expect(el.getByRole("listbox")).toBeVisible();

    const changesAfterGuardedEnters = await el.evaluate((host) => {
      const field = host.shadowRoot!.querySelector("input.search-input")!;
      field.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      field.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      return (host as HTMLElement).dataset.changeCount;
    });
    expect(changesAfterGuardedEnters).toBe("0");

    // After the post-composition tick, Enter commits again.
    await page.waitForFunction(() => true);
    await input.press("Enter");
    await expect(el).toHaveAttribute("data-change-count", "1");
  });

  test("hides selection chips unless show-chips is set", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS, values: ["red", "blue"] });
    // Default (show-chips off): the selection shows only in the trigger summary.
    await expect(page.locator("#ms").locator(".chips")).toHaveCount(0);
    await expect(page.locator("#ms").locator(".chip")).toHaveCount(0);

    await mount(page, { id: "ms-chips", options: OPTIONS, values: ["red", "blue"], showChips: true });
    await expect(page.locator("#ms-chips").locator(".chip")).toHaveCount(2);
  });

  test("renders removable chips with 32px controls and supports keyboard removal", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS, values: ["red", "blue"], showChips: true });
    const el = page.locator("#ms");

    const chips = el.locator(".chip");
    await expect(chips).toHaveCount(2);
    const removeRed = el.locator(".chip", { hasText: "Red" }).locator(".chip-remove");
    await expect(removeRed).toHaveAttribute("aria-label", "Remove Red");
    const box = await removeRed.boundingBox();
    expect(box?.width).toBe(32);
    expect(box?.height).toBe(32);
    const svgBox = await removeRed.locator("svg").boundingBox();
    expect(svgBox?.width).toBe(18);
    expect(svgBox?.height).toBe(18);

    // Programmatic values do not fire change.
    await expect(el).toHaveAttribute("data-change-count", "0");

    await el.locator(".chip", { hasText: "Blue" }).locator(".chip-remove").focus();
    await page.keyboard.press("Enter");
    await expect(el.locator(".chip")).toHaveCount(1);
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["red"]));
    await expect(el).toHaveAttribute("data-change-count", "1");
  });

  test("reserves no chip space when nothing is selected", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS, showChips: true });
    await expect(page.locator("#ms").locator(".chips")).toHaveCount(0);
  });

  test("a long chip label does not widen the host beyond the trigger's own width", async ({ page }) => {
    await setup(page);
    const longLabel = "A very extremely long color label indeed wow";
    await mount(page, {
      id: "ms",
      options: [
        { value: "long", label: longLabel },
        { value: "blue", label: "Blue" },
      ],
      values: ["long", "blue"],
      showChips: true,
    });
    const el = page.locator("#ms");
    // With two values selected the trigger collapses to the short "2
    // selected" summary; the long chip label must wrap/truncate within that
    // width instead of forcing the whole control wider.
    await expect(el.locator(".trigger-label")).toHaveText("2 selected");
    const hostBox = await el.boundingBox();
    const triggerBox = await el.locator("button.trigger").boundingBox();
    const longChipBox = await el.locator(".chip", { hasText: longLabel }).boundingBox();
    expect(hostBox?.width).toBeCloseTo(triggerBox!.width, 0);
    expect(longChipBox?.width).toBeLessThanOrEqual(triggerBox!.width + 0.5);
  });

  test("Backspace on an empty search query removes the last selection", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", searchable: true, options: OPTIONS, values: ["red", "blue"] });
    const el = page.locator("#ms");
    const input = el.locator("input.search-input");

    await input.focus();
    await input.press("Backspace");
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["red"]));
    await expect(el).toHaveAttribute("data-change-count", "1");
  });

  test("enforces max by disabling only currently-unselected options", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS, values: ["red", "green"], max: 2 });
    const el = page.locator("#ms");
    await el.locator("button.trigger").click();

    const blue = el.locator("li[role='option']").filter({ hasText: "Blue" });
    const red = el.locator("li[role='option']").filter({ hasText: "Red" });
    await expect(blue).toHaveAttribute("aria-disabled", "true");
    await expect(red).not.toHaveAttribute("aria-disabled", "true");

    await blue.click({ force: true });
    await expect(el).toHaveAttribute("data-change-count", "0");
    await red.click();
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["green"]));
    await expect(blue).not.toHaveAttribute("aria-disabled", "true");
  });

  test("does not select disabled options and does not open a disabled control", async ({ page }) => {
    await setup(page);
    await mount(page, {
      id: "ms-opt",
      options: [{ value: "red", label: "Red" }, { value: "gray", label: "Gray", disabled: true }],
    });
    const el = page.locator("#ms-opt");
    await el.locator("button.trigger").click();
    const gray = el.locator("li[role='option']").filter({ hasText: "Gray" });
    await expect(gray).toHaveAttribute("aria-disabled", "true");
    await gray.click({ force: true });
    await expect(el).toHaveAttribute("data-change-count", "0");

    await mount(page, { id: "ms-dis", options: OPTIONS, disabled: true });
    const disabled = page.locator("#ms-dis");
    await expect(disabled.locator("button.trigger")).toBeDisabled();
    await disabled.locator("button.trigger").click({ force: true });
    await expect(disabled.locator("ul.options")).toHaveCount(0);
  });

  test("mirrors an ancestor fieldset's disabled state", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS, inFieldset: true });
    const trigger = page.locator("#ms").locator("button.trigger");
    await expect(trigger).toBeDisabled();
  });

  test("stays legible in forced colors and drops the chevron transition in reduced motion", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS, values: ["green"] });
    const el = page.locator("#ms");
    await el.locator("button.trigger").click();

    const selected = el.locator("li[aria-selected='true']");
    const colors = await selected.evaluate((node) => {
      const style = getComputedStyle(node);
      return { color: style.color, background: style.backgroundColor };
    });
    expect(colors.color).not.toBe(colors.background);

    const transition = await el.evaluate((host) => {
      const chevron = host.shadowRoot!.querySelector(".chevron")!;
      return getComputedStyle(chevron).transitionDuration;
    });
    expect(transition).toBe("0s");
  });

  test("closes on an outside pointer, ignores non-primary option clicks, and keeps RTL/scrollbar chrome", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS, dir: "rtl" });
    const el = page.locator("#ms");
    await el.locator("button.trigger").click();
    const listbox = el.getByRole("listbox");
    await expect(listbox).toBeVisible();

    const chrome = await listbox.evaluate((node) => {
      const style = getComputedStyle(node);
      return { gutter: style.scrollbarGutter, direction: style.direction };
    });
    expect(chrome.gutter).toContain("stable");
    expect(chrome.direction).toBe("rtl");

    // Non-primary click on an option toggles nothing and keeps the list open.
    await el.locator("li[role='option']").first().click({ button: "right" });
    await expect(el).toHaveAttribute("data-change-count", "0");
    await expect(listbox).toBeVisible();

    await page.mouse.click(2, 2);
    await expect(el.locator("ul.options")).toHaveCount(0);
  });

  test("deduplicates programmatic values, renders unknown values as raw chips, and removes them", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS, values: ["red", "red", "blue", "zzz"], showChips: true });
    const el = page.locator("#ms");

    const values = await el.evaluate((host) => (host as HTMLElement & { values: string[] }).values);
    expect(values).toEqual(["red", "blue", "zzz"]);
    await expect(el).toHaveAttribute("data-change-count", "0");

    const unknownChip = el.locator(".chip", { hasText: "zzz" });
    await expect(unknownChip.locator(".chip-label")).toHaveText("zzz");
    await unknownChip.locator(".chip-remove").click();
    await expect(el.locator(".chip", { hasText: "zzz" })).toHaveCount(0);
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["red", "blue"]));
  });

  test("submits each selected value under the host name like a native multiple select", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", name: "colors", options: OPTIONS, values: ["red", "blue"], inForm: true });
    const submitted = await page.evaluate(() => {
      const form = document.getElementById("ms-form") as HTMLFormElement;
      return new FormData(form).getAll("colors");
    });
    expect(submitted).toEqual(["red", "blue"]);
  });

  test("reports valueMissing when required and empty, then validates once a value is chosen", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", name: "colors", required: true, options: OPTIONS, inForm: true });
    const el = page.locator("#ms");

    const invalid = await page.evaluate(() => {
      const form = document.getElementById("ms-form") as HTMLFormElement;
      return form.checkValidity();
    });
    expect(invalid).toBe(false);

    await el.locator("button.trigger").click();
    await el.locator("li[role='option']").first().click();
    const valid = await page.evaluate(() => {
      const form = document.getElementById("ms-form") as HTMLFormElement;
      return form.checkValidity();
    });
    expect(valid).toBe(true);
  });

  test("disabled required controls are barred from validation for property and fieldset states", async ({
    page,
  }) => {
    await setup(page);
    await mount(page, {
      id: "ms",
      name: "colors",
      required: true,
      options: OPTIONS,
      inForm: true,
    });

    const validity = () =>
      page.evaluate(() =>
        (document.getElementById("ms-form") as HTMLFormElement).checkValidity(),
      );
    expect(await validity()).toBe(false);

    await page.locator("#ms").evaluate(async (host) => {
      const control = host as HTMLElement & {
        disabled: boolean;
        updateComplete: Promise<boolean>;
      };
      control.disabled = true;
      await control.updateComplete;
    });
    expect(await validity()).toBe(true);

    await page.locator("#ms").evaluate(async (host) => {
      const control = host as HTMLElement & {
        disabled: boolean;
        updateComplete: Promise<boolean>;
      };
      control.disabled = false;
      await control.updateComplete;
    });
    expect(await validity()).toBe(false);

    await page.evaluate(() => {
      const control = document.getElementById("ms")!;
      const fieldset = document.createElement("fieldset");
      fieldset.disabled = true;
      control.replaceWith(fieldset);
      fieldset.appendChild(control);
    });
    expect(await validity()).toBe(true);
  });

  test("restores the initial selection on form reset without firing change", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", name: "colors", options: OPTIONS, values: ["red"], inForm: true });
    const el = page.locator("#ms");

    await el.locator("button.trigger").click();
    await el.locator("li[role='option']").filter({ hasText: "Blue" }).click();
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["red", "blue"]));
    await expect(el).toHaveAttribute("data-change-count", "1");

    await page.evaluate(() => (document.getElementById("ms-form") as HTMLFormElement).reset());
    const values = await el.evaluate((host) => (host as HTMLElement & { values: string[] }).values);
    expect(values).toEqual(["red"]);
    await expect(el).toHaveAttribute("data-change-count", "1");
  });

  test("cleans up and keeps working across disconnect and reconnect", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS });
    const el = page.locator("#ms");
    await el.locator("button.trigger").click();
    await expect(el.getByRole("listbox")).toBeVisible();

    await page.evaluate(() => {
      const node = document.getElementById("ms")!;
      const parent = node.parentElement!;
      node.remove();
      parent.appendChild(node);
    });
    await expect(el.locator("ul.options")).toHaveCount(0);
    await el.locator("button.trigger").click();
    await expect(el.getByRole("listbox")).toBeVisible();
  });

  test("uses the exact control metrics, icon sizes, and selected-token color", async ({ page }) => {
    await setup(page);
    await mount(page, {
      id: "ms",
      options: [
        { value: "red", label: "Red", icon: true, iconSize: 16 },
        { value: "green", label: "Green" },
      ],
      values: ["red"],
    });
    const el = page.locator("#ms");
    const trigger = el.locator("button.trigger");

    const triggerBox = await trigger.boundingBox();
    expect(triggerBox?.height).toBe(32);
    const styles = await trigger.evaluate((node) => {
      const style = getComputedStyle(node);
      return { padding: style.padding, fontSize: style.fontSize, fontWeight: style.fontWeight };
    });
    expect(styles.padding).toBe("8px 12px");
    expect(styles.fontSize).toBe("12px");
    expect(styles.fontWeight).toBe("500");

    const chevronBox = await trigger.locator(".chevron svg").boundingBox();
    expect(chevronBox?.width).toBe(14);
    expect(chevronBox?.height).toBe(14);

    await trigger.click();
    const selected = el.locator("li[aria-selected='true']");
    const checkBox = await selected.locator(".check svg").boundingBox();
    expect(checkBox?.width).toBe(14);
    const iconBox = await selected.locator(".option-icon").boundingBox();
    expect(iconBox?.width).toBe(16);
    const selectedColor = await selected.evaluate((node) => getComputedStyle(node).color);
    expect(selectedColor).toBe("rgb(79, 70, 229)");
  });

  test("defaults to the dropdown variant and reflects the variant attribute", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", options: OPTIONS });
    const el = page.locator("#ms");

    await expect(el).toHaveJSProperty("variant", "dropdown");
    await expect(el).toHaveAttribute("variant", "dropdown");
    await expect(el.locator("button.trigger")).toBeVisible();
    await expect(el.locator("ul.persistent")).toHaveCount(0);

    await el.evaluate((host) => {
      (host as HTMLElement & { variant: string }).variant = "list";
    });
    await expect(el).toHaveAttribute("variant", "list");
    await expect(el.locator("ul.persistent")).toBeVisible();
    await expect(el.locator("button.trigger")).toHaveCount(0);
  });

  test("list variant shows a persistent listbox with no chevron, no open state, and an exact visibleRows height", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", variant: "list", options: OPTIONS });
    const el = page.locator("#ms");
    const listbox = el.locator("ul.persistent");

    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute("role", "listbox");
    await expect(listbox).toHaveAttribute("aria-multiselectable", "true");
    await expect(el.locator(".chevron")).toHaveCount(0);
    await expect(el.locator("li[role='option']")).toHaveCount(4);

    // No popover host state.
    const hasOpen = await el.evaluate((host) => host.hasAttribute("open"));
    expect(hasOpen).toBe(false);

    // 8px enclosing surface radius.
    const radius = await listbox.evaluate((node) => getComputedStyle(node).borderRadius);
    expect(radius).toBe("8px");

    // Default 5 rows: 5*32 + 8 padding + 2 border.
    const box = await listbox.boundingBox();
    expect(box?.height).toBe(170);
  });

  test("list variant toggles options by pointer while staying visible", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", variant: "list", options: OPTIONS });
    const el = page.locator("#ms");
    const listbox = el.locator("ul.persistent");
    const green = el.locator("li[role='option']").filter({ hasText: "Green" });

    await green.click();
    await expect(green).toHaveAttribute("aria-selected", "true");
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["green"]));
    await expect(listbox).toBeVisible();

    await green.click();
    await expect(green).toHaveAttribute("aria-selected", "false");
    await expect(el).toHaveAttribute("data-change-count", "2");
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify([]));
  });

  test("non-searchable list is a focusable listbox with wrapping keyboard navigation and no Escape hide", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", variant: "list", options: OPTIONS });
    const el = page.locator("#ms");
    const listbox = el.locator("ul.persistent");

    await expect(listbox).toHaveAttribute("tabindex", "0");
    // Options themselves are not tabbable.
    await expect(el.locator("li[role='option'][tabindex]")).toHaveCount(0);

    await listbox.focus();
    await expect(listbox).toBeFocused();
    await expect(listbox).toHaveAttribute("aria-activedescendant", /option-0$/);

    await listbox.press("ArrowDown");
    await expect(listbox).toHaveAttribute("aria-activedescendant", /option-1$/);
    await listbox.press("ArrowUp");
    await listbox.press("ArrowUp"); // wraps from index 0 to the last option
    await expect(listbox).toHaveAttribute("aria-activedescendant", /option-3$/);
    await listbox.press("Home");
    await expect(listbox).toHaveAttribute("aria-activedescendant", /option-0$/);
    await listbox.press("End");
    await expect(listbox).toHaveAttribute("aria-activedescendant", /option-3$/);

    await listbox.press(" ");
    await expect(el.locator("li[role='option']").nth(3)).toHaveAttribute("aria-selected", "true");
    await listbox.press("Enter");
    await expect(el.locator("li[role='option']").nth(3)).toHaveAttribute("aria-selected", "false");

    // Escape neither hides the list nor moves focus away from it.
    await listbox.press("Escape");
    await expect(listbox).toBeVisible();
    await expect(listbox).toBeFocused();
  });

  test("searchable list filters infix, isolates the query, and Escape only clears it", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", variant: "list", searchable: true, options: OPTIONS });
    const el = page.locator("#ms");
    const input = el.locator("input.list-search");
    const listbox = el.locator("ul.persistent");

    await expect(input).toBeVisible();
    await expect(listbox).toBeVisible();
    await expect(el.locator("button.trigger")).toHaveCount(0);
    const fieldBox = await el.locator(".search-field").boundingBox();
    expect(fieldBox?.height).toBe(32);

    await input.fill("re");
    const filtered = el.locator("li[role='option']");
    await expect(filtered).toHaveCount(2);
    await expect(filtered.nth(0)).toHaveText("Red");
    await expect(filtered.nth(1)).toHaveText("Green");

    await filtered.filter({ hasText: "Green" }).click();
    await expect(el).toHaveAttribute("data-last-values", JSON.stringify(["green"]));
    // Selecting keeps the query intact (query-only, never a value).
    await expect(input).toHaveValue("re");

    await input.press("Escape");
    await expect(input).toHaveValue("");
    await expect(el.locator("li[role='option']")).toHaveCount(4);
    // Escape restores the full list without hiding it.
    await expect(listbox).toBeVisible();
  });

  test("normalizes visibleRows to a whole number of at least one", async ({ page }) => {
    await setup(page);
    await mount(page, { id: "ms", variant: "list", visibleRows: 2, options: OPTIONS });
    const el = page.locator("#ms");
    const listbox = el.locator("ul.persistent");

    expect((await listbox.boundingBox())?.height).toBe(74); // 2*32 + 10

    await el.evaluate((host) => {
      (host as HTMLElement & { visibleRows: number }).visibleRows = 3.9;
    });
    expect((await listbox.boundingBox())?.height).toBe(106); // floor(3.9)=3 -> 3*32 + 10

    await el.evaluate((host) => {
      (host as HTMLElement & { visibleRows: number }).visibleRows = 0;
    });
    expect((await listbox.boundingBox())?.height).toBe(42); // clamped to 1 -> 1*32 + 10

    await el.evaluate((host) => {
      (host as HTMLElement & { visibleRows: number }).visibleRows = -5;
    });
    expect((await listbox.boundingBox())?.height).toBe(42);
  });

  test("list variant honors disabled, max, form submission, and reset", async ({ page }) => {
    await setup(page);

    // Disabled list stays visible but inert and not focusable.
    await mount(page, { id: "ms-dis", variant: "list", options: OPTIONS, disabled: true });
    const dis = page.locator("#ms-dis");
    const disList = dis.locator("ul.persistent");
    await expect(disList).toBeVisible();
    expect(await disList.getAttribute("tabindex")).toBeNull();
    await expect(disList).toHaveAttribute("aria-disabled", "true");
    await disList.locator("li[role='option']").first().click({ force: true });
    await expect(dis).toHaveAttribute("data-change-count", "0");

    // Max caps currently-unselected options in list mode.
    await mount(page, { id: "ms-max", variant: "list", options: OPTIONS, values: ["red", "green"], max: 2 });
    const max = page.locator("#ms-max");
    const blue = max.locator("li[role='option']").filter({ hasText: "Blue" });
    await expect(blue).toHaveAttribute("aria-disabled", "true");
    await blue.click({ force: true });
    await expect(max).toHaveAttribute("data-change-count", "0");

    // Form submission + reset via a list-mode route.
    await mount(page, {
      id: "ms-form",
      variant: "list",
      name: "colors",
      options: OPTIONS,
      values: ["red"],
      inForm: true,
    });
    const form = page.locator("#ms-form");
    await form.locator("li[role='option']").filter({ hasText: "Blue" }).click();
    const submitted = await page.evaluate(() => {
      const f = document.getElementById("ms-form-form") as HTMLFormElement;
      return new FormData(f).getAll("colors");
    });
    expect(submitted).toEqual(["red", "blue"]);

    await page.evaluate(() => (document.getElementById("ms-form-form") as HTMLFormElement).reset());
    const values = await form.evaluate((host) => (host as HTMLElement & { values: string[] }).values);
    expect(values).toEqual(["red"]);
    await expect(form.locator("ul.persistent")).toBeVisible();
  });
});
