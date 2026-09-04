import { test, expect } from "@playwright/test";

test.describe("empty-state", () => {
  test("renders heading, description, and slotted actions", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#empty-state-demo");
    await expect(el.locator(".heading")).toHaveText("No results found");
    await expect(el.locator(".description")).not.toHaveText("");
    await expect(el.locator('[slot="actions"]')).toBeVisible();
  });

  test("renders no description element when compact and heading-only", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#empty-state-compact");
    await expect(el).toHaveAttribute("size", "sm");
    await expect(el.locator(".heading")).not.toHaveText("");
    await expect(el.locator(".description")).toHaveCount(0);
  });

  test("whitespace-only slot content does not reserve space", async ({ page }) => {
    await page.goto("/");
    const heights = await page.evaluate(async () => {
      const measure = async (html: string) => {
        const holder = document.createElement("div");
        holder.innerHTML = html;
        document.body.append(holder);
        const el = holder.querySelector("empty-state") as HTMLElement & { updateComplete: Promise<unknown> };
        await el.updateComplete;
        await el.updateComplete;
        const height = el.getBoundingClientRect().height;
        holder.remove();
        return height;
      };
      return {
        bare: await measure('<empty-state heading="Nothing here"></empty-state>'),
        whitespace: await measure('<empty-state heading="Nothing here">\n  \n</empty-state>'),
      };
    });
    // Indented-but-empty markup must not push the layout around.
    expect(Math.abs(heights.whitespace - heights.bare)).toBeLessThan(1);
  });

  test("heading-level re-levels the heading for the surrounding document outline", async ({ page }) => {
    await page.goto("/");
    const levels = await page.evaluate(async () => {
      const read = async (level: unknown) => {
        const el = document.createElement("empty-state") as HTMLElement & {
          heading: string;
          headingLevel: unknown;
          updateComplete: Promise<unknown>;
        };
        el.heading = "Nothing here";
        if (level !== undefined) el.headingLevel = level;
        document.body.append(el);
        await el.updateComplete;
        const node = el.shadowRoot!.querySelector(".heading")!;
        const result = { tag: node.tagName.toLowerCase(), level: node.getAttribute("aria-level") };
        el.remove();
        return result;
      };
      return {
        fallback: await read(undefined),
        three: await read(3),
        tooLow: await read(0),
        tooHigh: await read(99),
        garbage: await read("nope"),
      };
    });
    expect(levels.fallback).toEqual({ tag: "h2", level: "2" });
    expect(levels.three.level).toBe("3");
    // Out-of-range values are clamped rather than emitting an invalid aria-level.
    expect(levels.tooLow.level).toBe("1");
    expect(levels.tooHigh.level).toBe("6");
    expect(levels.garbage.level).toBe("2");
  });
});
