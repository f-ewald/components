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
        src: string;
        alt: string;
        caption?: string;
        updateComplete: Promise<boolean>;
      };
      galleryItem.src =
        "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      galleryItem.alt = "Updated coastline";
      galleryItem.caption = "Updated coast caption";
      await galleryItem.updateComplete;
    });

    await expect(item).toHaveCSS("display", "none");
    await expect(item).toHaveAttribute("alt", "Updated coastline");
    await expect(item).toHaveAttribute("caption", "Updated coast caption");
    const currentImage = page
      .locator("#photo-gallery-demo")
      .locator('picture:not([aria-hidden="true"]) img');
    await expect(currentImage).toHaveAttribute(
      "alt",
      "Updated coastline",
    );
    await expect(currentImage).toHaveAttribute(
      "src",
      "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
    );
    await expect(page.locator("#photo-gallery-demo").locator("figcaption")).toHaveText("Updated coast caption");
  });
});
