import { test, expect } from "@playwright/test";

test.describe("slide-panel", () => {
  test("the open attribute slides the panel in and the close button fires panel-close", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator("#panel-demo");
    const panelInner = panel.locator("dialog.panel");
    await expect(panelInner).toHaveJSProperty("open", false);

    await page.locator("#panel-open").click();
    await expect(panelInner).toHaveJSProperty("open", true);

    await page.evaluate(() => {
      document.getElementById("panel-demo")!.addEventListener("panel-close", () => {
        document.body.setAttribute("data-panel-closed", "true");
      });
    });
    await panelInner.locator(".close-btn").click();
    await expect(page.locator("body")).toHaveAttribute("data-panel-closed", "true");
  });

  test("is named, closes with Escape, and restores focus without acting modal", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.locator("#panel-open");
    const panel = page.locator("#panel-demo");
    const dialog = panel.getByRole("dialog");

    await trigger.click();
    await expect(dialog).toHaveAccessibleName("Property details");
    expect(await dialog.evaluate((el) => el.matches(":modal"))).toBe(false);
    await expect(panel.locator(".close-btn")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("slides in from off-screen and stays rendered until the closing slide finishes", async ({ page }) => {
    await page.goto("/");
    const states = await page.locator("#panel-demo").evaluate(async (element) => {
      const host = element as HTMLElement & { open: boolean; updateComplete: Promise<boolean> };
      const dialog = host.shadowRoot!.querySelector("dialog")!;
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      host.open = true;
      await host.updateComplete;
      const openStart = getComputedStyle(dialog).transform;
      await wait(400);
      const openEnd = getComputedStyle(dialog).transform;
      host.open = false;
      await host.updateComplete;
      const closeStart = getComputedStyle(dialog).display;
      await wait(400);
      return { openStart, openEnd, closeStart, closeEnd: getComputedStyle(dialog).display };
    });
    expect(states.openStart).toBe("matrix(1, 0, 0, 1, 352, 0)"); // 110% of the 20rem panel, i.e. @starting-style
    expect(states.openEnd).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(states.closeStart).toBe("flex"); // display transitions discretely, so the slide-out stays visible
    expect(states.closeEnd).toBe("none");
  });

  test("removes the slide transition when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("#panel-demo .panel")).toHaveCSS("transition-duration", "0s");
  });

  test("uses slotted title text as its accessible name", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const panel = document.createElement("slide-panel");
      panel.id = "slotted-title-panel";
      const title = document.createElement("span");
      title.slot = "title";
      title.textContent = "Actual panel title";
      panel.append(title);
      (panel as HTMLElement & { open: boolean }).open = true;
      document.body.append(panel);
    });

    await expect(page.locator("#slotted-title-panel").getByRole("dialog")).toHaveAccessibleName(
      "Actual panel title",
    );
  });

  test("disconnecting an open panel resets it closed", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator("#panel-demo");
    await page.locator("#panel-open").click();
    const openAfterReconnect = await panel.evaluate((element) => {
      const parent = element.parentElement!;
      element.remove();
      parent.append(element);
      return (element as HTMLElement & { open: boolean }).open;
    });
    expect(openAfterReconnect).toBe(false);
    await expect(panel.getByRole("dialog")).not.toBeVisible();
  });

  test("uses the 20rem side-panel width, tokenized title weight, and 32px close control", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#panel-open").click();
    const inner = page.locator("#panel-demo .panel");
    await expect(inner).toHaveCSS("width", "320px");
    const title = page.locator("#panel-demo .panel-title");
    await expect(title).toHaveCSS("font-weight", "600");
    await expect(title).toHaveCSS("font-size", "16px");
    await expect(title).toHaveCSS("line-height", "20px");
    await expect(page.locator("#panel-demo .panel-header")).toHaveCSS("padding", "12px");

    const close = page.locator("#panel-demo .close-btn");
    await expect(close).toHaveCSS("width", "32px");
    await expect(close).toHaveCSS("height", "32px");
    await expect(close).toHaveCSS("border-radius", "4px");
  });
});
