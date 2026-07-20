import { test, expect } from "@playwright/test";

test.describe("gallery-item", () => {
  test("stores image metadata and exposes declarative variants", async ({ page }) => {
    await page.goto("/");
    const item = page.locator("#gallery-coast");

    const metadata = await item.evaluate(async (element) => {
      const galleryItem = element as HTMLElement & {
        src: string;
        alt: string;
        caption?: string;
        variants: Element[];
        updateComplete: Promise<boolean>;
      };
      await galleryItem.updateComplete;
      return {
        src: galleryItem.src,
        alt: galleryItem.alt,
        caption: galleryItem.caption,
        variantCount: galleryItem.variants.length,
        display: getComputedStyle(galleryItem).display,
      };
    });

    expect(metadata.src).toContain("coast-landscape");
    expect(metadata.alt).toBe("Rocky California coastline beneath a cloudy sky");
    expect(metadata.caption).toBe("California coast");
    expect(metadata.variantCount).toBe(1);
    expect(metadata.display).toBe("none");

    await item.evaluate(async (element) => {
      const galleryItem = element as HTMLElement & {
        caption?: string;
        updateComplete: Promise<boolean>;
      };
      galleryItem.caption = "Updated coast caption";
      await galleryItem.updateComplete;
    });

    await expect(item).toHaveAttribute("caption", "Updated coast caption");
    await expect(page.locator("#photo-gallery-demo").locator("figcaption")).toHaveText("Updated coast caption");
  });
});
