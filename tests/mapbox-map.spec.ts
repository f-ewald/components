import { test, expect } from "@playwright/test";

test.describe("mapbox-map", () => {
  test("does not construct a map (no canvas) until both access-token and style-url are set", async ({ page }) => {
    await page.goto("/");
    const withStyleOnly = await page.evaluate(() => {
      const el = document.createElement("mapbox-map");
      el.setAttribute("style-url", "mapbox://styles/mapbox/light-v11");
      document.body.appendChild(el);
      const found = !!el.querySelector("canvas");
      el.remove();
      return found;
    });
    expect(withStyleOnly).toBe(false);

    const withTokenOnly = await page.evaluate(() => {
      const el = document.createElement("mapbox-map");
      el.setAttribute("access-token", "pk.test");
      document.body.appendChild(el);
      const found = !!el.querySelector("canvas");
      el.remove();
      return found;
    });
    expect(withTokenOnly).toBe(false);
  });

  // A real construction attempt (both properties set) requires a genuine
  // Mapbox access token — mapbox-gl validates token shape synchronously in
  // its constructor and throws before creating any DOM otherwise, so it
  // can't be exercised with a fake one. Not tested here for the same reason
  // address-autocomplete's playground demo runs in local mode: a public
  // suite shouldn't embed a real API credential. Exercised live in the
  // consuming app instead (real-estate-map's map-view.ts).
});
