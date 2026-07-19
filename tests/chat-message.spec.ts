import { test, expect } from "@playwright/test";

test.describe("chat-message", () => {
  test("renders slotted body, applies the user role tint, and toggles a collapsible variant", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#msg-user")).toContainText("Write notes.md containing a haiku.");
    await expect(page.locator("#msg-user")).toHaveAttribute("role", "user");

    const toolMessage = page.locator("#msg-tool");
    await expect(toolMessage.locator(".summary")).toBeVisible();
    await expect(toolMessage.locator(".body-card")).toBeHidden();

    await toolMessage.locator(".header").click();
    await expect(toolMessage.locator(".body-card")).toBeVisible();
    await expect(page.locator("#chat-toggle-log")).toHaveText("msg-tool collapsed: false");
  });
});
