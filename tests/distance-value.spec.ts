import { test, expect } from "@playwright/test";

test.describe("distance-value", () => {
  test("switches units and precision at imperial and metric boundaries", async ({ page }) => {
    await page.goto("/");

    const values = await page.evaluate(async () => {
      const element = document.createElement("distance-value") as HTMLElement & {
        miles: number | null;
        km: number | null;
        updateComplete: Promise<boolean>;
      };
      document.body.append(element);

      const renderMiles = async (miles: number) => {
        element.km = null;
        element.miles = miles;
        await element.updateComplete;
        return element.shadowRoot?.textContent ?? "";
      };
      const renderKm = async (km: number) => {
        element.miles = null;
        element.km = km;
        await element.updateComplete;
        return element.shadowRoot?.textContent ?? "";
      };

      return {
        feet: await renderMiles(0.249),
        mileBoundary: await renderMiles(0.25),
        roundedMiles: await renderMiles(10),
        meters: await renderKm(0.499),
        kilometerBoundary: await renderKm(0.5),
        roundedKilometers: await renderKm(10),
      };
    });

    expect(values).toEqual({
      feet: "1,315 ft",
      mileBoundary: "0.3 mi",
      roundedMiles: "10 mi",
      meters: "499 m",
      kilometerBoundary: "0.5 km",
      roundedKilometers: "10 km",
    });
  });

  test("renders nothing for missing or nonfinite distances", async ({ page }) => {
    await page.goto("/");

    const values = await page.evaluate(async () => {
      const element = document.createElement("distance-value") as HTMLElement & {
        miles: number | null;
        km: number | null;
        updateComplete: Promise<boolean>;
      };
      document.body.append(element);
      await element.updateComplete;
      const missing = element.shadowRoot?.textContent ?? "";

      element.miles = Number.NaN;
      await element.updateComplete;
      const nan = element.shadowRoot?.textContent ?? "";

      element.miles = Number.POSITIVE_INFINITY;
      await element.updateComplete;
      const infinity = element.shadowRoot?.textContent ?? "";

      element.miles = null;
      element.km = Number.NEGATIVE_INFINITY;
      await element.updateComplete;
      return {
        missing,
        nan,
        infinity,
        negativeInfinity: element.shadowRoot?.textContent ?? "",
      };
    });

    expect(values).toEqual({
      missing: "",
      nan: "",
      infinity: "",
      negativeInfinity: "",
    });
  });
});
