import { test, expect } from "@playwright/test";

/** Reads the theme actually in effect, which is the attribute real consumers key off. */
const activeTheme = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.dataset.theme ?? "default");

test.describe("playground theme in the URL", () => {
  test("a shared ?theme link applies that theme on load", async ({ page }) => {
    await page.goto("/?theme=blueprint");
    await expect.poll(() => activeTheme(page)).toBe("blueprint");
    // The picker agrees with what is rendered, rather than silently disagreeing.
    await expect
      .poll(() => page.locator("#theme-picker").evaluate((el) => (el as HTMLElement & { value: string }).value))
      .toBe("blueprint");
  });

  test("the link wins over the visitor's own stored preference", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "metro"));
    await page.goto("/?theme=blueprint");
    await expect.poll(() => activeTheme(page)).toBe("blueprint");
  });

  test("choosing a theme rewrites the URL without pushing history", async ({ page }) => {
    await page.goto("/#button-group");
    const picker = page.locator("#theme-picker");
    await picker.evaluate((el) => {
      const select = el as HTMLElement & { value: string };
      select.value = "metro";
      el.dispatchEvent(new CustomEvent("change", { detail: { value: "metro" }, bubbles: true }));
    });

    await expect(page).toHaveURL(/\?theme=metro#button-group$/);
    // The section anchor has to survive, or switching themes would lose the
    // reader's place.
    await expect.poll(() => activeTheme(page)).toBe("metro");

    // Back must leave the playground rather than stepping through each theme
    // the reader tried.
    await page.goBack();
    await expect(page).not.toHaveURL(/theme=metro/);
  });

  test("the default theme leaves no redundant parameter behind", async ({ page }) => {
    await page.goto("/?theme=metro");
    await expect.poll(() => activeTheme(page)).toBe("metro");
    await page.locator("#theme-picker").evaluate((el) => {
      (el as HTMLElement & { value: string }).value = "default";
      el.dispatchEvent(new CustomEvent("change", { detail: { value: "default" }, bubbles: true }));
    });
    await expect(page).not.toHaveURL(/theme=/);
    await expect.poll(() => activeTheme(page)).toBe("default");
  });

  test("an unknown theme in the URL falls back instead of half-applying", async ({ page }) => {
    await page.goto("/?theme=not-a-theme");
    await expect.poll(() => activeTheme(page)).toBe("default");
    // A bogus name must not be written onto the element as if it were real.
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "not-a-theme");
  });

  test("the URL reflects the stored theme so the address bar is always shareable", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme", "gradient"));
    await page.goto("/");
    await expect(page).toHaveURL(/\?theme=gradient/);
    await expect.poll(() => activeTheme(page)).toBe("gradient");
  });

  test("developer-dark/developer-light repaint the playground's own page chrome, not just the components", async ({
    page,
  }) => {
    const bodyColors = (p: import("@playwright/test").Page) =>
      p.evaluate(() => {
        const style = getComputedStyle(document.body);
        return { background: style.backgroundColor, color: style.color };
      });

    await page.goto("/");
    const defaultColors = await bodyColors(page);

    await page.goto("/?theme=developer-dark");
    await expect.poll(() => activeTheme(page)).toBe("developer-dark");
    const darkColors = await bodyColors(page);
    expect(darkColors.background).not.toBe(defaultColors.background);
    // A near-black surface with light text, not the reverse.
    expect(darkColors.background).toBe("rgb(14, 13, 11)");
    expect(darkColors.color).toBe("rgb(216, 211, 197)");

    await page.goto("/?theme=developer-light");
    await expect.poll(() => activeTheme(page)).toBe("developer-light");
    const lightColors = await bodyColors(page);
    expect(lightColors.background).not.toBe(darkColors.background);
    expect(lightColors.background).toBe("rgb(243, 238, 225)");
    expect(lightColors.color).toBe("rgb(26, 24, 19)");

    // Secondary chrome (the nav's active-section highlight) follows too,
    // rather than keeping the fixed indigo tint every other theme uses.
    await page.locator("#nav-filter input").fill("code-diff");
    const activeLink = page.locator('.demo-nav a[href="#code-diff"]');
    await activeLink.click();
    await expect.poll(() => activeLink.evaluate((el) => el.classList.contains("active"))).toBe(
      true,
    );
    const activeBg = await activeLink.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(activeBg).not.toBe("rgb(238, 242, 255)"); // bg-indigo-50, the un-themed default
  });
});
