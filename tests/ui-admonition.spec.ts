import { test, expect } from "@playwright/test";

test.describe("ui-admonition", () => {
  test("renders the message, a bordered/rounded box, the variant color, and a leading icon", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("#admonition-info")).toContainText("take the quiz");

    const dangerBox = page.locator("#admonition-danger .box");
    await expect(dangerBox).toHaveClass(/danger/);
    await expect(dangerBox).toHaveCSS("border-style", "solid");
    const { borderWidth, borderRadius } = await dangerBox.evaluate((el) => {
      const style = getComputedStyle(el);
      return { borderWidth: style.borderWidth, borderRadius: style.borderRadius };
    });
    expect(borderWidth).not.toBe("0px");
    expect(borderRadius).not.toBe("0px");

    // The `icon` property is a consumer-supplied 18px inline template.
    await expect(page.locator("#admonition-info .icon svg")).toHaveAttribute("width", "18");
  });

  test("announces politely, escalates to alert for danger, and renders a primary ui-button in the actions slot", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("#admonition-info .box")).toHaveAttribute("role", "status");
    await expect(page.locator("#admonition-danger .box")).toHaveAttribute("role", "alert");

    const cta = page.locator("#admonition-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("variant", "primary");
    await cta.click();
    await expect(page.locator("#admonition-info")).toContainText("quiz started");
  });

  test("honors dark-mode token overrides", async ({ page }) => {
    await page.goto("/");
    const info = page.locator("#admonition-info");
    await info.evaluate((element) => element.style.setProperty("--ui-info", "#38bdf8"));
    await expect(info.locator(".icon")).toHaveCSS("color", "rgb(56, 189, 248)");
  });
});
