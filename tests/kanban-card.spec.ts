import { test, expect } from "@playwright/test";

// kanban-card is metadata-only: it is demonstrated through kanban-board.
test.describe("kanban-card", () => {
  test("shows only the ticket and title in the overview", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('#kanban-demo kanban-card[data-card-id="c1"]');
    await expect(card.locator(".ticket")).toContainText("PROJ-142");
    await expect(card.locator(".title")).toHaveText("Wire up auth callback");
    // No description, state, or timestamps in the compact overview.
    await expect(card).not.toContainText("Handle the OAuth redirect");
  });

  test("exposes a focusable button with a ticket-and-title accessible name", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('#kanban-demo kanban-card[data-card-id="c1"]');
    const button = card.getByRole("button");
    await expect(button).toHaveAccessibleName("PROJ-142: Wire up auth callback");

    await card.focus();
    await expect(button).toBeFocused();
  });

  test("opens the board's detail view when clicked", async ({ page }) => {
    await page.goto("/");
    await page.locator('#kanban-demo kanban-card[data-card-id="c2"]').click();
    await expect(page.locator("#kanban-demo popover-panel").getByRole("dialog")).toHaveAccessibleName(
      "Empty-state illustration",
    );
  });
});
