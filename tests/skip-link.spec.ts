import { test, expect } from "@playwright/test";

test.describe("skip-link", () => {
  test("is visually hidden at rest but becomes visible on keyboard focus", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("#skip-link-demo a");

    const clipped = (await link.boundingBox())!;
    expect(clipped.width).toBeLessThanOrEqual(1);
    expect(clipped.height).toBeLessThanOrEqual(1);

    await link.focus();
    const revealed = (await link.boundingBox())!;
    expect(revealed.width).toBeGreaterThan(1);
    expect(revealed.height).toBeGreaterThan(1);
  });

  test("activating it moves focus into the target, not just the scroll position", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("#skip-link-demo a");
    const href = (await link.getAttribute("href"))!;
    expect(href.startsWith("#")).toBe(true);
    const targetId = href.slice(1);
    await expect(page.locator(href)).toHaveCount(1);

    await link.focus();
    await page.keyboard.press("Enter");

    // The whole point of a skip link: an ordinary, non-focusable target must
    // still receive focus, or the keyboard user is left stranded at the top.
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id ?? ""))
      .toBe(targetId);
  });

  test("stays pinned to the viewport even inside a positioned ancestor", async ({ page }) => {
    await page.goto("/");
    const box = await page.evaluate(async () => {
      const host = document.createElement("div");
      host.style.cssText = "position: relative; margin-top: 400px; margin-left: 200px;";
      const link = document.createElement("skip-link") as HTMLElement & { updateComplete: Promise<unknown> };
      host.append(link);
      document.body.append(host);
      await link.updateComplete;
      const anchor = link.shadowRoot!.querySelector("a")!;
      anchor.focus();
      const rect = anchor.getBoundingClientRect();
      host.remove();
      return { top: rect.top, left: rect.left };
    });
    // Pinned to the viewport corner, not the offset ancestor's corner.
    expect(box.top).toBeLessThan(50);
    expect(box.left).toBeLessThan(50);
  });

  test("keeps its accessible name when the slot holds only whitespace", async ({ page }) => {
    await page.goto("/");
    const names = await page.evaluate(async () => {
      const read = async (html: string) => {
        const holder = document.createElement("div");
        holder.innerHTML = html;
        document.body.append(holder);
        const link = holder.querySelector("skip-link") as HTMLElement & { updateComplete: Promise<unknown> };
        await link.updateComplete;
        await link.updateComplete;
        const text = (link.shadowRoot!.querySelector("a")!.textContent ?? "").trim();
        const slotted = (link.textContent ?? "").trim();
        holder.remove();
        return text || slotted;
      };
      return {
        fallback: await read('<skip-link label="Fallback"></skip-link>'),
        slotted: await read('<skip-link label="Fallback">Custom</skip-link>'),
        whitespace: await read('<skip-link label="Fallback">\n  \n</skip-link>'),
      };
    });
    expect(names.fallback).toBe("Fallback");
    expect(names.slotted).toBe("Custom");
    expect(names.whitespace).toBe("Fallback");
  });
});
