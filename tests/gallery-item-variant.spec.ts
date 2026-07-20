import { test, expect } from "@playwright/test";

test.describe("gallery-item-variant", () => {
  test("stores responsive source metadata and reflects property changes", async ({ page }) => {
    await page.goto("/");
    const variant = page.locator("#gallery-coast-mobile");

    const initial = await variant.evaluate(async (element) => {
      const metadata = element as HTMLElement & {
        media?: string;
        srcset: string;
        updateComplete: Promise<boolean>;
      };
      await metadata.updateComplete;
      return {
        media: metadata.media,
        srcset: metadata.srcset,
        display: getComputedStyle(metadata).display,
      };
    });

    expect(initial.media).toBe("(max-width: 640px)");
    expect(initial.srcset).toContain("coast-portrait");
    expect(initial.display).toBe("none");

    await variant.evaluate(async (element) => {
      const metadata = element as HTMLElement & {
        media?: string;
        srcset: string;
        updateComplete: Promise<boolean>;
      };
      metadata.media = "(max-width: 480px)";
      metadata.srcset = "/photos/mobile.jpg 1x";
      await metadata.updateComplete;
    });

    await expect(variant).toHaveAttribute("media", "(max-width: 480px)");
    await expect(variant).toHaveAttribute("srcset", "/photos/mobile.jpg 1x");
  });
});
