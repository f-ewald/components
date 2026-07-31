import { test, expect } from "@playwright/test";

test.describe("audio-player", () => {
  test("toggles play/pause, fires play/pause events, and exposes seek/volume controls", async ({
    page,
  }) => {
    await page.goto("/");
    const player = page.locator("#audio-player-demo");
    const playButton = player.getByRole("button", { name: "Play", exact: true });
    const log = page.locator("#audio-player-log");

    // Total time resolves to the known 8s sample duration once metadata loads.
    await expect(player.locator(".time").last()).toHaveText("0:08", { timeout: 10000 });

    await expect(player.locator('input[aria-label="Seek"]')).toBeVisible();
    await expect(player.locator('input[aria-label="Volume"]')).toHaveJSProperty("value", "1");

    await playButton.click();
    await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await expect(log).toHaveText("play");

    await player.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(playButton).toBeVisible();
    await expect(log).toHaveText("pause");
  });

  test("mute toggle flips the speaker icon's accessible name", async ({ page }) => {
    await page.goto("/");
    const player = page.locator("#audio-player-demo");
    const muteButton = player.getByRole("button", { name: "Mute", exact: true });

    await expect(muteButton).toBeVisible();
    await muteButton.click();
    await expect(player.getByRole("button", { name: "Unmute", exact: true })).toBeVisible();
  });
});
