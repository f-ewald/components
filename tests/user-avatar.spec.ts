import { test, expect } from "@playwright/test";
import { parseGradientLuminances } from "./utils/gradient";

test.describe("user-avatar", () => {
  test("shows an image, an initial fallback, an icon fallback, and recovers from a broken image", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#avatar-image img")).toBeVisible();

    const initialAvatar = page.locator("#avatar-initial");
    await expect(initialAvatar.locator("img")).toHaveCount(0);
    await expect(initialAvatar).toContainText("F");
    await expect(initialAvatar.locator(".avatar")).toHaveCSS("font-weight", "600");

    const fallbackAvatar = page.locator("#avatar-fallback");
    await expect(fallbackAvatar.locator("img")).toHaveCount(0);
    await expect(fallbackAvatar.locator("svg")).toBeVisible();

    const brokenAvatar = page.locator("#avatar-broken");
    await expect(brokenAvatar.locator("img")).toHaveCount(0);
    await expect(brokenAvatar).toContainText("B");

    await brokenAvatar.evaluate(async (element) => {
      const avatar = element as HTMLElement & {
        src: string;
        updateComplete: Promise<boolean>;
      };
      avatar.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      await avatar.updateComplete;
    });
    await expect(brokenAvatar.locator("img")).toHaveAttribute("alt", "");
    await expect(brokenAvatar.locator("img")).toHaveAttribute(
      "src",
      "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
    );
  });

  test("resolves named size presets to pixel diameters", async ({ page }) => {
    await page.goto("/");

    const xs = page.locator("#avatar-preset-xs").locator(".avatar");
    await expect(xs).toHaveCSS("width", "18px");

    const lg = page.locator("#avatar-preset-lg").locator(".avatar");
    await expect(lg).toHaveCSS("width", "48px");
  });

  test("keeps fallback foregrounds legible against default and overridden backgrounds", async ({ page }) => {
    await page.goto("/");
    const initialAvatar = page.locator("#avatar-initial");
    const fallbackAvatar = page.locator("#avatar-fallback");

    await expect(initialAvatar.locator(".avatar")).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(initialAvatar.locator(".avatar")).toHaveCSS("text-shadow", /rgba?\(0, 0, 0/);
    await expect(fallbackAvatar.locator("svg")).toHaveAttribute("aria-hidden", "true");

    await fallbackAvatar.evaluate((element) => {
      element.style.setProperty("--ui-primary", "#000");
      element.style.setProperty("--ui-on-accent", "#f8fafc");
    });
    await expect(fallbackAvatar.locator(".avatar")).toHaveCSS("color", "rgb(248, 250, 252)");
  });

  test("fades the fallback background top-to-bottom using the same primary-token gradient as map-circle/weight-bar-chart", async ({
    page,
  }) => {
    await page.goto("/");
    const initialAvatar = page.locator("#avatar-initial").locator(".avatar");

    // Chromium omits the default to-bottom direction; exact stops plus
    // luminance distinguish this from a plain solid background.
    const gradient = await initialAvatar.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(gradient).toBe(
      "linear-gradient(color(srgb 0.516863 0.492157 0.928627) 0%, color(srgb 0.216863 0.192157 0.628627) 100%)",
    );
    expect(gradient).not.toMatch(/^linear-gradient\(\s*\d+deg/);

    const [topLuminance, bottomLuminance] = parseGradientLuminances(gradient);
    expect(topLuminance).toBeGreaterThan(bottomLuminance);
  });

  test("fallback gradient follows a consumer-overridden --ui-primary token, still lighter on top", async ({
    page,
  }) => {
    await page.goto("/");
    const fallbackAvatar = page.locator("#avatar-fallback");
    await fallbackAvatar.evaluate((element) => {
      element.style.setProperty("--ui-primary", "#ff0000");
    });

    const gradient = await fallbackAvatar
      .locator(".avatar")
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(gradient).toBe("linear-gradient(color(srgb 1 0.3 0.3) 0%, color(srgb 0.7 0 0) 100%)");
    expect(gradient).not.toMatch(/^linear-gradient\(\s*\d+deg/);

    const [topLuminance, bottomLuminance] = parseGradientLuminances(gradient);
    expect(topLuminance).toBeGreaterThan(bottomLuminance);
  });

  test("never tints the actual image — the gradient stays behind a fully opaque, unfiltered <img>", async ({
    page,
  }) => {
    await page.goto("/");
    const img = page.locator("#avatar-image img");

    await expect(img).toBeVisible();
    await expect(img).toHaveCSS("filter", "none");
    await expect(img).toHaveCSS("mix-blend-mode", "normal");
    await expect(img).toHaveCSS("opacity", "1");
    // The <img> fully covers its circular parent, so the parent's gradient
    // background (still present underneath) never shows through or blends.
    await expect(img).toHaveCSS("object-fit", "cover");
    await expect(img).toHaveCSS("width", "40px");
    await expect(img).toHaveCSS("height", "40px");
  });
});
