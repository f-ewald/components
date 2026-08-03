import { test, expect, type Locator } from "@playwright/test";

/** Picks an option by label from a `form-select` inside a `cron-schedule`. */
async function pickOption(scope: Locator, selectSelector: string, label: string): Promise<void> {
  const select = scope.locator(selectSelector);
  await select.locator("button.trigger").click();
  await select.locator("li[role='option']", { hasText: label }).first().click();
}

test.describe("cron-schedule", () => {
  test("renders each expression as compact English on its trigger", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#cron-default .trigger-label")).toHaveText("Every hour");
    await expect(page.locator("#cron-weekly .trigger-label")).toHaveText("10:17 every Monday");
    await expect(page.locator("#cron-advanced .trigger-label")).toHaveText(
      "08:00 on day 1 and 15 of every month",
    );
    await expect(page.locator("#cron-disabled .trigger-label")).toHaveText("00:00 every day");
  });

  test("opens the panel, closes on Escape and outside click, and stays shut when disabled", async ({
    page,
  }) => {
    await page.goto("/");
    const el = page.locator("#cron-default");
    const trigger = el.locator("button.trigger[aria-haspopup='dialog']");
    const panel = el.getByRole("dialog");

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-controls", (await panel.getAttribute("id"))!);

    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(el).toHaveJSProperty("open", false);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(panel).toBeVisible();
    await page.locator("h3").first().click();
    await expect(panel).toHaveCount(0);

    const disabled = page.locator("#cron-disabled");
    await expect(disabled.locator("button.trigger[aria-haspopup='dialog']")).toBeDisabled();
    await disabled.locator("button.trigger[aria-haspopup='dialog']").click({ force: true });
    await expect(disabled.getByRole("dialog")).toHaveCount(0);
  });

  test("the frequency listbox is not clipped by the panel", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#cron-default");
    await el.locator("button.trigger[aria-haspopup='dialog']").click();
    await el.locator("form-select[label='Repeat'] button.trigger").click();

    // The panel must not be a scroll container: an overflow ancestor would clip
    // the absolutely positioned listbox, which is taller than the panel itself.
    const panel = (await el.locator(".panel").boundingBox())!;
    const listbox = (await el.locator("form-select[label='Repeat'] ul.options").boundingBox())!;
    expect(listbox.height).toBeGreaterThan(panel.height);
    expect(listbox.y + listbox.height).toBeGreaterThan(panel.y + panel.height);
    await expect(
      el.locator("form-select[label='Repeat'] li[role='option']", { hasText: "Advanced" }),
    ).toBeInViewport({ ratio: 1 });
  });

  test("picking a preset frequency rewrites the expression and fires change", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#cron-default");
    await el.locator("button.trigger[aria-haspopup='dialog']").click();

    await pickOption(el, "form-select[label='Repeat']", "Daily");
    await expect(el).toHaveJSProperty("value", "0 9 * * *");
    await expect(el.locator(".readout code")).toHaveText("0 9 * * *");
    await expect(page.locator("#cron-output")).toHaveText(
      "cron-default → 0 9 * * * (09:00 every day)",
    );

    await pickOption(el, "form-select[label='Hour']", "07");
    await pickOption(el, "form-select[label='Minute']", "45");
    await expect(el).toHaveJSProperty("value", "45 7 * * *");
    await expect(el.locator(".trigger-label")).toHaveText("07:45 every day");

    await pickOption(el, "form-select[label='Repeat']", "Every N minutes");
    await expect(el).toHaveJSProperty("value", "*/5 * * * *");
    await expect(el.locator(".trigger-label")).toHaveText("Every 5 minutes");
  });

  test("weekly mode toggles weekdays and never empties the selection", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#cron-weekly");
    await el.locator("button.trigger[aria-haspopup='dialog']").click();

    await expect(el.locator("form-select[label='Repeat'] .option-label")).toHaveText("Weekly");
    await expect(el.locator("ui-checkbox[label='Mon'] input")).toBeChecked();

    await el.locator("ui-checkbox[label='Thu'] input").click();
    await expect(el).toHaveJSProperty("value", "17 10 * * 1,4");
    await expect(el.locator(".trigger-label")).toHaveText("10:17 every Mon and Thu");

    await el.locator("ui-checkbox[label='Mon'] input").click();
    await expect(el).toHaveJSProperty("value", "17 10 * * 4");

    // A cron field must keep at least one value, so the last box is disabled.
    await expect(el.locator("ui-checkbox[label='Thu'] input")).toBeDisabled();
    await expect(el.locator("ui-checkbox[label='Mon'] input")).toBeEnabled();
  });

  test("advanced mode edits, adds, and removes individual field terms", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#cron-advanced");
    await el.locator("button.trigger[aria-haspopup='dialog']").click();
    await pickOption(el, "form-select[label='Repeat']", "Advanced");

    const editors = el.locator(".field-editor");
    await expect(editors).toHaveCount(5);
    const minuteEditor = editors.first();

    await minuteEditor.locator("button-group label", { hasText: "Step" }).locator("input").click();
    await expect(el).toHaveJSProperty("value", "*/2 8 1,15 * *");

    await minuteEditor.locator("ui-button").click();
    await expect(el).toHaveJSProperty("value", "*/2,0 8 1,15 * *");
    await expect(minuteEditor.locator(".term-row")).toHaveCount(2);

    await minuteEditor.locator("icon-button button").last().click();
    await expect(el).toHaveJSProperty("value", "*/2 8 1,15 * *");
    await expect(el.locator(".trigger-label")).toHaveText(
      "Custom: minute every 2, hour 8 and day of month 1 and 15",
    );
  });
});
