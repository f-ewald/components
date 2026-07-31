import { test, expect } from "@playwright/test";

test.describe("video-player", () => {
  test("toggles play/pause, fires play/pause events, and exposes transport controls", async ({
    page,
  }) => {
    await page.goto("/");
    const player = page.locator("#video-player-demo");
    const playButton = player.getByRole("button", { name: "Play", exact: true });
    const log = page.locator("#video-player-log");

    await expect(player.locator("video")).toBeVisible();
    // Total time resolves to the known 6s sample duration once metadata loads.
    await expect(player.locator(".time").last()).toHaveText("0:06", { timeout: 10000 });

    await expect(player.locator('input[aria-label="Seek"]')).toBeVisible();
    await expect(player.locator('input[aria-label="Volume"]')).toHaveJSProperty("value", "1");
    await expect(
      player.getByRole("button", { name: "Enter fullscreen", exact: true }),
    ).toBeVisible();

    await playButton.click();
    await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await expect(log).toHaveText("play");

    await player.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(playButton).toBeVisible();
    await expect(log).toHaveText("pause");
  });
});
