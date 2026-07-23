import { test, expect } from "@playwright/test";

// kanban-column is metadata-only: it is demonstrated through kanban-board.
test.describe("kanban-column", () => {
  test("renders each column's title and card count from the board data", async ({ page }) => {
    await page.goto("/");
    const columns = page.locator("#kanban-demo kanban-column");
    await expect(columns).toHaveCount(3);
    await expect(columns.locator(".heading")).toHaveText(["To Do", "In Progress", "Done"]);
    await expect(columns.locator(".count")).toHaveText(["2", "1", "1"]);
  });

  test("labels its region by the column title", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("#kanban-demo kanban-column").first().getByRole("region", { name: "To Do" }),
    ).toBeVisible();
  });

  test("shows an empty hint and reflects the empty attribute for a column with no cards", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const board = document.getElementById("kanban-demo") as HTMLElement & {
        columns: Array<{ id: string; title: string; cards: unknown[] }>;
      };
      board.columns = [
        { id: "todo", title: "To Do", cards: [] },
        { id: "done", title: "Done", cards: [] },
      ];
    });

    const empty = page.locator('#kanban-demo kanban-column[data-column-id="todo"]');
    await expect(empty).toHaveAttribute("empty", "");
    await expect(empty.locator(".empty")).toHaveText("No cards");
  });
});
