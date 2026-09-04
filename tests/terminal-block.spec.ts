import { test, expect } from "@playwright/test";

test.describe("terminal-block", () => {
  test("renders each line with its type-driven treatment, in order", async ({ page }) => {
    await page.goto("/");
    const lines = page.locator("#terminal-block-demo .line");
    await expect(lines).toHaveCount(3);
    await expect(lines.nth(0)).toHaveClass(/comment/);
    await expect(lines.nth(0)).toHaveText("# Claude Code");
    await expect(lines.nth(1)).toHaveClass(/prompt/);
    await expect(lines.nth(1)).toHaveText("/plugin marketplace add example/example");
  });

  test("an empty lines array still renders the visible terminal shell", async ({ page }) => {
    await page.goto("/");
    const hasPanel = await page.evaluate(async () => {
      const el = document.createElement("terminal-block") as HTMLElement & {
        updateComplete: Promise<unknown>;
      };
      document.body.append(el);
      await el.updateComplete;
      const present = el.shadowRoot!.querySelector(".panel") !== null;
      el.remove();
      return present;
    });
    expect(hasPanel).toBe(true);
  });
});
