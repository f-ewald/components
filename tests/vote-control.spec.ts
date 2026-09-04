import { test, expect } from "@playwright/test";

test.describe("vote-control", () => {
  test("renders the initial score and progress toward the target", async ({ page }) => {
    await page.goto("/");
    const vote = page.locator("#vote-control-demo");

    await expect(vote.locator(".score")).toHaveText("7");
    await expect(vote.locator(".track")).toHaveAttribute("role", "progressbar");
    await expect(vote.locator(".track")).toHaveAttribute("aria-valuenow", "7");
    await expect(vote.locator(".track")).toHaveAttribute("aria-valuemax", "10");
    await expect(vote.locator(".fill")).toHaveAttribute("style", /width:\s*70%/);
    await expect(vote.locator(".caption")).toHaveText("7 / 10");
    await expect(vote.locator(".score")).toHaveAttribute("aria-live", "polite");
  });

  test("casting up increments and reflects the pressed vote, then withdrawing reverts it", async ({ page }) => {
    await page.goto("/");
    const vote = page.locator("#vote-control-demo");
    const up = vote.getByRole("button", { name: "Vote up" });

    await up.click();
    await expect(vote.locator(".score")).toHaveText("8");
    await expect(vote).toHaveAttribute("vote", "up");
    await expect(up).toHaveAttribute("aria-pressed", "true");
    await expect(vote.locator(".fill")).toHaveAttribute("style", /width:\s*80%/);
    await expect(page.locator("#vote-control-log")).toHaveText(/up.*8|8.*up/);

    // Clicking the same button again withdraws the vote and reverts the score.
    await up.click();
    await expect(vote.locator(".score")).toHaveText("7");
    await expect(vote).not.toHaveAttribute("vote", /.+/);
    await expect(up).toHaveAttribute("aria-pressed", "false");
  });

  test("switching from up to down is a two-point swing", async ({ page }) => {
    await page.goto("/");
    const vote = page.locator("#vote-control-demo");
    await vote.getByRole("button", { name: "Vote up" }).click();
    await expect(vote.locator(".score")).toHaveText("8");

    await vote.getByRole("button", { name: "Vote down" }).click();
    await expect(vote.locator(".score")).toHaveText("6");
    await expect(vote).toHaveAttribute("vote", "down");
    await expect(vote.getByRole("button", { name: "Vote down" })).toHaveAttribute("aria-pressed", "true");
    await expect(vote.getByRole("button", { name: "Vote up" })).toHaveAttribute("aria-pressed", "false");
  });

  test("disabled blocks voting", async ({ page }) => {
    await page.goto("/");
    const vote = page.locator("#vote-control-demo");
    await vote.evaluate((element) => ((element as HTMLElement & { disabled: boolean }).disabled = true));
    await expect(vote.getByRole("button", { name: "Vote up" })).toBeDisabled();
    await expect(vote.getByRole("button", { name: "Vote down" })).toBeDisabled();
  });
});
