import { test, expect } from "@playwright/test";

type VoteState = "up" | "down" | null;

interface VoteElement extends HTMLElement {
  value: number;
  vote: VoteState;
  disabled: boolean;
}

test.describe("vote-control", () => {
  test("renders the initial score and progress toward the target", async ({ page }) => {
    await page.goto("/");
    const vote = page.locator("#vote-control-demo");

    await expect(vote.locator(".score")).toHaveText("7");
    await expect(vote.locator(".track")).toHaveAttribute("role", "progressbar");
    await expect(vote.locator(".track")).toHaveAttribute("aria-valuenow", "7");
    await expect(vote.locator(".track")).toHaveAttribute("aria-valuemax", "10");
    await expect(vote.locator(".track")).toHaveAttribute("aria-valuetext", "7 of 10");
    await expect(vote.locator(".track")).toHaveAttribute("aria-label", /.+/);
    await expect(vote.locator(".fill")).toHaveAttribute("style", /width:\s*70%/);
    await expect(vote.locator(".caption")).toHaveText("7 / 10");
    await expect(vote.locator(".score")).toHaveAttribute("aria-live", "polite");
  });

  // Every transition of the three-state vote, since the score delta depends on
  // both the previous and the next state and an off-by-one here is invisible
  // until a user toggles in exactly the wrong order.
  const transitions: Array<{ from: VoteState; click: "up" | "down"; vote: VoteState; score: string }> = [
    { from: null, click: "up", vote: "up", score: "8" },
    { from: null, click: "down", vote: "down", score: "6" },
    { from: "up", click: "up", vote: null, score: "6" },
    { from: "down", click: "down", vote: null, score: "8" },
    { from: "up", click: "down", vote: "down", score: "5" },
    { from: "down", click: "up", vote: "up", score: "9" },
  ];

  for (const { from, click, vote: expected, score } of transitions) {
    test(`${from ?? "no vote"} then clicking ${click} yields ${expected ?? "no vote"} and ${score}`, async ({ page }) => {
      await page.goto("/");
      const vote = page.locator("#vote-control-demo");
      // Seed both halves of the state so the delta is measured from a known
      // pair rather than from whatever the previous assertion left behind.
      await vote.evaluate((element, state) => {
        const el = element as VoteElement;
        el.value = 7;
        el.vote = state as VoteState;
      }, from);

      await vote.getByRole("button", { name: click === "up" ? "Vote up" : "Vote down" }).click();

      await expect(vote.locator(".score")).toHaveText(score);
      if (expected === null) {
        await expect(vote).not.toHaveAttribute("vote", /.+/);
      } else {
        await expect(vote).toHaveAttribute("vote", expected);
      }
      await expect(vote.getByRole("button", { name: "Vote up" })).toHaveAttribute(
        "aria-pressed",
        String(expected === "up"),
      );
      await expect(vote.getByRole("button", { name: "Vote down" })).toHaveAttribute(
        "aria-pressed",
        String(expected === "down"),
      );
    });
  }

  test("vote-change crosses the shadow boundary and carries both vote and value", async ({ page }) => {
    await page.goto("/");
    const vote = page.locator("#vote-control-demo");
    const captured = vote.evaluate(
      (element) =>
        new Promise<{ vote: VoteState; value: number; bubbles: boolean; composed: boolean }>((resolve) => {
          document.addEventListener(
            "vote-change",
            (event) => {
              const e = event as CustomEvent<{ vote: VoteState; value: number }>;
              resolve({ ...e.detail, bubbles: e.bubbles, composed: e.composed });
            },
            { once: true },
          );
        }),
    );

    await vote.getByRole("button", { name: "Vote up" }).click();
    expect(await captured).toEqual({ vote: "up", value: 8, bubbles: true, composed: true });
  });

  test("disabled blocks voting and emits nothing", async ({ page }) => {
    await page.goto("/");
    const vote = page.locator("#vote-control-demo");
    await vote.evaluate((element) => ((element as VoteElement).disabled = true));
    await expect(vote.getByRole("button", { name: "Vote up" })).toBeDisabled();
    await expect(vote.getByRole("button", { name: "Vote down" })).toBeDisabled();

    const events = await vote.evaluate(async (element) => {
      let count = 0;
      document.addEventListener("vote-change", () => (count += 1));
      const up = element.shadowRoot?.querySelector<HTMLButtonElement>('button[aria-label="Vote up"]');
      up?.click();
      return count;
    });
    expect(events).toBe(0);
    await expect(vote.locator(".score")).toHaveText("7");
    await expect(vote).not.toHaveAttribute("vote", /.+/);
  });
});
