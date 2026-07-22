import { test, expect } from "@playwright/test";

test.describe("chat-message", () => {
  test("renders slotted body, applies the user role tint, and toggles a collapsible variant", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#msg-user")).toContainText("Write notes.md containing a haiku.");
    await expect(page.locator("#msg-user")).toHaveAttribute("role", "user");

    const toolMessage = page.locator("#msg-tool");
    await expect(toolMessage.locator(".summary")).toBeVisible();
    await expect(toolMessage.locator(".body-card")).toBeHidden();
    const toggle = toolMessage.getByRole("button");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-controls", "message-body");

    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toolMessage.locator(".body-card")).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#chat-toggle-log")).toHaveText("msg-tool collapsed: false");
  });

  test("uses semibold author labels, normal body leading, and an 8px bubble radius", async ({
    page,
  }) => {
    await page.goto("/");
    const user = page.locator("#msg-user");
    await expect(user.locator(".author")).toHaveCSS("font-weight", "600");
    const bubble = user.locator(".body-card");
    await expect(bubble).toHaveCSS("line-height", "21px");
    await expect(bubble).toHaveCSS("border-radius", "8px");
    await expect(bubble).toHaveCSS("padding", "12px");

    const toggle = page.locator("#msg-tool button.header");
    await expect(toggle).toHaveCSS("min-height", "32px");
    await expect(toggle.locator("svg")).toHaveAttribute("width", "14");
  });
});
