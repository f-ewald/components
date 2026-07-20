import { test, expect, type Locator, type Page } from "@playwright/test";

const gallerySelector = "#photo-gallery-demo";

/** Disables autoplay so interaction assertions are deterministic. */
async function disableAutoplay(gallery: Locator): Promise<void> {
  await gallery.evaluate((element) => {
    (element as HTMLElement & { delay: number }).delay = 0;
  });
}

/** Returns the currently exposed image in the gallery shadow root. */
function activeImage(gallery: Locator): Locator {
  return gallery.locator('picture:not([aria-hidden="true"]) img');
}

/** Moves the mouse outside the gallery to release hover pausing. */
async function leaveGallery(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
}

test.describe("photo-gallery", () => {
  test("renders responsive image metadata, caption, viewport, and default navigation", async ({ page }) => {
    await page.goto("/");
    const gallery = page.locator(gallerySelector);
    await disableAutoplay(gallery);

    await expect(activeImage(gallery)).toHaveAttribute(
      "alt",
      "Rocky California coastline beneath a cloudy sky",
    );
    await expect(gallery.locator('picture:not([aria-hidden="true"]) source')).toHaveAttribute(
      "media",
      "(max-width: 640px)",
    );
    await expect(gallery.locator("figcaption")).toHaveText("California coast");
    await expect(gallery.locator(".arrow-button")).toHaveCount(2);
    await expect(gallery.locator(".counter")).toHaveText("1 / 3");
    await expect(gallery.locator(".indicator")).toHaveCount(3);

    const viewportStyles = await gallery.locator(".viewport").evaluate((element) => ({
      aspectRatio: getComputedStyle(element).aspectRatio,
      objectFit: getComputedStyle(element.querySelector("img")!).objectFit,
    }));
    expect(viewportStyles.aspectRatio).toBe("16 / 9");
    expect(viewportStyles.objectFit).toBe("cover");
  });

  test("wraps arrow navigation, exposes currentIndex, and emits slide-change", async ({ page }) => {
    await page.goto("/");
    const gallery = page.locator(gallerySelector);
    await disableAutoplay(gallery);
    await gallery.evaluate((element) => {
      element.addEventListener("slide-change", (event) => {
        const detail = (event as CustomEvent<{ currentIndex: number; reason: string }>).detail;
        document.body.dataset.galleryChange = `${detail.currentIndex}:${detail.reason}`;
      });
    });

    await gallery.locator(".next").click();
    await expect(gallery).toHaveAttribute("current-index", "1");
    await expect(activeImage(gallery)).toHaveAttribute(
      "alt",
      "Golden Gate Bridge stretching across San Francisco Bay",
    );
    await expect(page.locator("body")).toHaveAttribute("data-gallery-change", "1:next");

    await gallery.locator(".previous").click();
    await expect(gallery).toHaveAttribute("current-index", "0");
    await gallery.locator(".previous").click();
    await expect(gallery).toHaveAttribute("current-index", "2");

    await gallery.evaluate((element) => {
      (element as HTMLElement & { currentIndex: number }).currentIndex = 1;
    });
    await expect(gallery).toHaveAttribute("current-index", "1");
    await expect(page.locator("body")).toHaveAttribute("data-gallery-change", "1:programmatic");
  });

  test("configures arrows, counter, indicators, and indicator navigation", async ({ page }) => {
    await page.goto("/");
    const gallery = page.locator(gallerySelector);
    await disableAutoplay(gallery);

    await gallery.evaluate((element) => {
      const component = element as HTMLElement & {
        showControls: boolean;
        showCounter: boolean;
        showIndicators: boolean;
      };
      component.showControls = false;
      component.showCounter = false;
      component.showIndicators = false;
    });
    await expect(gallery.locator(".arrow-button")).toHaveCount(0);
    await expect(gallery.locator(".counter")).toHaveCount(0);
    await expect(gallery.locator(".indicator")).toHaveCount(0);

    await gallery.evaluate((element) => {
      const component = element as HTMLElement & {
        showControls: boolean;
        showCounter: boolean;
        showIndicators: boolean;
      };
      component.showControls = true;
      component.showCounter = true;
      component.showIndicators = true;
    });
    await gallery.locator(".indicator").nth(2).click();
    await expect(gallery).toHaveAttribute("current-index", "2");
    await expect(gallery.locator(".indicator").nth(2)).toHaveAttribute("aria-current", "true");
    await expect(gallery.locator(".counter")).toHaveText("3 / 3");

    await gallery.evaluate((element) => {
      const component = element as HTMLElement & {
        aspectRatio: string;
        objectFit: "cover" | "contain";
      };
      component.aspectRatio = "4 / 3";
      component.objectFit = "contain";
    });
    await expect(gallery.locator(".viewport")).toHaveCSS("aspect-ratio", "4 / 3");
    await expect(activeImage(gallery)).toHaveCSS("object-fit", "contain");
  });

  test("supports keyboard navigation and horizontal pointer swipes", async ({ page }) => {
    await page.goto("/");
    const gallery = page.locator(gallerySelector);
    await disableAutoplay(gallery);
    const keyboardTarget = gallery.locator(".gallery");

    await keyboardTarget.focus();
    await keyboardTarget.press("ArrowRight");
    await expect(gallery).toHaveAttribute("current-index", "1");
    await keyboardTarget.press("ArrowLeft");
    await expect(gallery).toHaveAttribute("current-index", "0");

    const viewport = gallery.locator(".viewport");
    const box = await viewport.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.75, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 5 });
    await page.mouse.up();
    await expect(gallery).toHaveAttribute("current-index", "1");
  });

  test("autoplays, pauses for interaction, restarts, and supports explicit pause", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await page.clock.pauseAt(await page.evaluate(() => Date.now()));
    const gallery = page.locator(gallerySelector);
    const viewport = gallery.locator(".viewport");

    await page.clock.fastForward(4000);
    await expect(gallery).toHaveAttribute("current-index", "1");

    await viewport.hover();
    await page.clock.fastForward(8000);
    await expect(gallery).toHaveAttribute("current-index", "1");

    await leaveGallery(page);
    await page.clock.fastForward(3999);
    await expect(gallery).toHaveAttribute("current-index", "1");
    await page.clock.fastForward(1);
    await expect(gallery).toHaveAttribute("current-index", "2");

    const keyboardTarget = gallery.locator(".gallery");
    await keyboardTarget.focus();
    await page.clock.fastForward(8000);
    await expect(gallery).toHaveAttribute("current-index", "2");
    await keyboardTarget.press("ArrowRight");
    await expect(gallery).toHaveAttribute("current-index", "0");
    await page.clock.fastForward(8000);
    await expect(gallery).toHaveAttribute("current-index", "0");
    await keyboardTarget.blur();
    await page.evaluate(() => new Promise<void>((resolve) => queueMicrotask(resolve)));
    await page.clock.fastForward(3999);
    await expect(gallery).toHaveAttribute("current-index", "0");
    await page.clock.fastForward(1);
    await expect(gallery).toHaveAttribute("current-index", "1");

    await viewport.hover();
    const autoplayButton = gallery.locator(".autoplay-button");
    await autoplayButton.click();
    await expect(gallery).toHaveAttribute("paused", "");
    await expect(autoplayButton).toHaveText("Play");
    await leaveGallery(page);
    await page.clock.fastForward(8000);
    await expect(gallery).toHaveAttribute("current-index", "1");

    await autoplayButton.click();
    await autoplayButton.blur();
    await leaveGallery(page);
    await page.clock.fastForward(3999);
    await expect(gallery).toHaveAttribute("current-index", "1");
    await page.clock.fastForward(1);
    await expect(gallery).toHaveAttribute("current-index", "2");
  });

  test("handles dynamic empty and single-item states safely", async ({ page }) => {
    await page.goto("/");
    const dynamic = page.locator("#dynamic-gallery");

    await page.evaluate(() => {
      const gallery = document.createElement("photo-gallery");
      gallery.id = "dynamic-gallery";
      gallery.setAttribute("show-counter", "");
      const item = document.createElement("gallery-item");
      item.setAttribute("src", "/demo/assets/photo-gallery/golden-gate.jpg");
      item.setAttribute("alt", "A single bridge");
      gallery.append(item);
      document.body.append(gallery);
    });

    await expect(activeImage(dynamic)).toHaveAttribute("alt", "A single bridge");
    await expect(dynamic.locator(".arrow-button")).toHaveCount(0);
    await expect(dynamic.locator(".counter")).toHaveText("1 / 1");

    await dynamic.evaluate((element) => {
      const secondItem = document.createElement("gallery-item");
      secondItem.setAttribute("src", "/demo/assets/photo-gallery/coast-landscape.jpg");
      secondItem.setAttribute("alt", "A second coast");
      element.append(secondItem);
      (element as HTMLElement & { currentIndex: number }).currentIndex = 1;
    });
    await expect(activeImage(dynamic)).toHaveAttribute("alt", "A second coast");
    await dynamic.evaluate((element) => element.querySelector("gallery-item")?.remove());
    await expect(dynamic).toHaveAttribute("current-index", "0");
    await expect(activeImage(dynamic)).toHaveAttribute("alt", "A second coast");

    await dynamic.evaluate((element) => {
      element.addEventListener("slide-change", (event) => {
        const detail = (event as CustomEvent<{ currentIndex: number; reason: string }>).detail;
        document.body.dataset.dynamicGalleryChange = `${detail.currentIndex}:${detail.reason}`;
      });
      const replacement = document.createElement("gallery-item");
      replacement.setAttribute("src", "/demo/assets/photo-gallery/golden-gate.jpg");
      replacement.setAttribute("alt", "A replacement bridge");
      element.append(replacement);
      element.querySelector("gallery-item")?.remove();
    });
    await expect(activeImage(dynamic)).toHaveAttribute("alt", "A replacement bridge");
    await expect(page.locator("body")).toHaveAttribute("data-dynamic-gallery-change", "0:items");

    await dynamic.evaluate((element) => element.replaceChildren());
    await expect(dynamic.locator("picture")).toHaveCount(0);
    await expect(dynamic.locator(".counter")).toHaveCount(0);
  });

  test("removes crossfade animation for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const gallery = page.locator(gallerySelector);
    await disableAutoplay(gallery);

    await gallery.locator(".next").click();
    await expect(gallery.locator(".entering")).toHaveCSS("animation-name", "none");
    await expect(gallery.locator(".leaving")).toHaveCSS("animation-name", "none");
  });
});
