import { test, expect } from "@playwright/test";

test.describe("comment-composer", () => {
  test("click expands to a focused textarea; Escape cancels and collapses", async ({ page }) => {
    await page.goto("/");
    const composer = page.locator("#comment-composer-demo");
    const input = composer.locator("input");

    await input.click();
    const textarea = composer.locator("textarea");
    await expect(textarea).toBeFocused();
    await expect(composer.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(composer.getByRole("button", { name: "Submit" })).toBeVisible();

    await textarea.fill("Draft that should be discarded");
    await textarea.press("Escape");
    await expect(composer.locator("textarea")).toHaveCount(0);
    await expect(composer.locator("input")).toHaveValue("");
  });

  test("Cmd/Ctrl+Enter submits, clears the field, collapses, and fires submit", async ({
    page,
  }) => {
    await page.goto("/");
    const composer = page.locator("#comment-composer-demo");
    const log = page.locator("#comment-composer-log");

    await composer.locator("input").click();
    const textarea = composer.locator("textarea");
    await textarea.fill("Nice work on this PR!");
    await textarea.press("ControlOrMeta+Enter");

    await expect(composer.locator("textarea")).toHaveCount(0);
    await expect(composer.locator("input")).toHaveValue("");
    await expect(log).toHaveText("Nice work on this PR!");
  });

  test("Submit button is disabled for an empty/whitespace-only draft", async ({ page }) => {
    await page.goto("/");
    const composer = page.locator("#comment-composer-demo");

    await composer.locator("input").click();
    const submit = composer.getByRole("button", { name: "Submit" });
    await expect(submit).toBeDisabled();

    await composer.locator("textarea").fill("   ");
    await expect(submit).toBeDisabled();

    await composer.locator("textarea").fill("   real text   ");
    await expect(submit).toBeEnabled();
    await composer.locator("textarea").press("Escape");
  });
});
