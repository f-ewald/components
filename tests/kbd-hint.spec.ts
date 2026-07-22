import { expect, test } from "@playwright/test";

test.describe("kbd-hint", () => {
  test("renders macOS modifier glyphs with an accessible spoken label", async ({ page }) => {
    await page.goto("/");
    const hint = page.locator("#kbd-mac");

    await expect(hint.locator("kbd")).toHaveText(["⌘", "⌥", "⇧", "⏎"]);
    await expect(hint.getByRole("img")).toHaveAccessibleName(
      "Command Option Shift Enter",
    );
  });

  test("renders spelled-out modifiers on non-mac platforms", async ({ page }) => {
    await page.goto("/");
    const hint = page.locator("#kbd-other");

    await expect(hint.locator("kbd")).toHaveText(["Ctrl", "Alt", "Shift", "⏎"]);
    await expect(hint.getByRole("img")).toHaveAccessibleName(
      "Control Alt Shift Enter",
    );
  });

  test("renders special navigation keys and spoken names", async ({ page }) => {
    await page.goto("/");
    const hint = page.locator("#kbd-special");

    await expect(hint.locator("kbd")).toHaveText(["Esc", "⇥", "↑", "PgDn"]);
    await expect(hint.getByRole("img")).toHaveAccessibleName(
      "Escape Tab Up arrow Page Down",
    );
  });

  test("auto platform follows browser detection", async ({ page }) => {
    await page.goto("/");
    const isMac = await page.evaluate(() => {
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
      return /mac/i.test(
        nav.userAgentData?.platform || nav.platform || nav.userAgent || "",
      );
    });

    await expect(page.locator("#kbd-auto kbd").first()).toHaveText(
      isMac ? "⌘" : "Ctrl",
    );
  });

  test("normalizes aliases, case, whitespace, and literal keys reactively", async ({
    page,
  }) => {
    await page.goto("/");
    const hint = page.locator("#kbd-other");
    await hint.evaluate((element) => {
      const kbdHint = element as HTMLElement & {
        keys: string;
        platform: "auto" | "mac" | "other";
      };
      kbdHint.platform = "mac";
      kbdHint.keys = " command + CONTROL + option + return + del + spacebar + x + F12 ";
    });

    await expect(hint.locator("kbd")).toHaveText([
      "⌘",
      "⌃",
      "⌥",
      "⏎",
      "⌦",
      "Space",
      "X",
      "F12",
    ]);
    await expect(hint.getByRole("img")).toHaveAccessibleName(
      "Command Control Option Enter Delete Space X F12",
    );
  });

  test("keeps explicit non-mac modifier names distinct from Mod", async ({ page }) => {
    await page.goto("/");
    const hint = page.locator("#kbd-other");
    await hint.evaluate((element) => {
      (element as HTMLElement & { keys: string }).keys =
        "Mod+Cmd+Meta+Super+Win+R";
    });

    await expect(hint.locator("kbd")).toHaveText([
      "Ctrl",
      "Cmd",
      "Meta",
      "Super",
      "Win",
      "R",
    ]);
    await expect(hint.getByRole("img")).toHaveAccessibleName(
      "Control Command Meta Super Windows R",
    );
  });

  test("renders no keycap group for an empty shortcut", async ({ page }) => {
    await page.goto("/");
    const hint = page.locator("#kbd-special");
    await hint.evaluate((element) => {
      (element as HTMLElement & { keys: string }).keys = " + ";
    });

    await expect(hint.locator("kbd")).toHaveCount(0);
    await expect(hint.locator(".wrap")).toHaveCount(0);
  });

  test("removing the keys attribute clears the rendered shortcut", async ({ page }) => {
    await page.goto("/");
    const hint = page.locator("#kbd-other");
    await expect(hint.locator("kbd")).toHaveCount(4);

    await hint.evaluate((element) => element.removeAttribute("keys"));
    await expect(hint.locator("kbd")).toHaveCount(0);
    await expect(hint.locator(".wrap")).toHaveCount(0);
  });

  test("inherits currentColor and uses tokenized keycap typography", async ({ page }) => {
    await page.goto("/");
    const neutralKey = page.locator("#kbd-auto kbd").first();
    const accentKey = page.locator("#kbd-accent kbd").first();

    await expect(accentKey).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(accentKey).toHaveCSS("opacity", "1");
    const styles = await Promise.all(
      [neutralKey, accentKey].map((key) =>
        key.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            color: style.color,
            background: style.backgroundColor,
            borderRadius: style.borderRadius,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
          };
        }),
      ),
    );

    expect(styles[0].color).not.toBe(styles[1].color);
    expect(styles[0].background).not.toBe(styles[1].background);
    expect(styles[1].background).not.toBe("rgba(0, 0, 0, 0)");
    expect(styles[1].borderRadius).toBe("4px");
    expect(styles[1].fontFamily.toLowerCase()).toContain("mono");
    expect(styles[1].fontSize).toBe("11px");
  });
});
