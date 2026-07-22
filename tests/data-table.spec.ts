import { test, expect } from "@playwright/test";

test.describe("data-table", () => {
  test("renders a header per column and a row per data entry", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#table-tasks");

    await expect(el.locator("th")).toHaveText(["Title", "State"]);
    const rows = el.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator("td")).toHaveText(["Write onboarding docs", "Backlog"]);
    await expect(rows.nth(1).locator("td")).toHaveText(["Fix the login bug", "Done"]);
  });

  test("clicking a row navigates via rowHref", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#table-tasks");

    await el.locator("tbody tr").first().click();
    await expect(page).toHaveURL(/#tsk_1$/);
  });

  test("clickable rows preserve row semantics and expose a keyboard link", async ({ page }) => {
    await page.goto("/");
    const row = page.locator("#table-tasks tbody tr").first();
    const link = row.getByRole("link");

    await expect(row).not.toHaveAttribute("role");
    await expect(row).not.toHaveAttribute("tabindex");
    await expect(link).toHaveAccessibleName("Open Write onboarding docs, Backlog");
    await link.focus();
    await expect(row).not.toHaveCSS("box-shadow", "none");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#tsk_1$/);
  });

  test("nested controls do not activate their clickable row", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const table = document.getElementById("table-tasks") as HTMLElement & {
        renderCell: (row: unknown, key: string) => unknown;
        updateComplete: Promise<boolean>;
      };
      table.renderCell = (row, key) => {
        if (key !== "title") return (row as Record<string, unknown>)[key];
        const button = document.createElement("button");
        button.textContent = "Nested action";
        return button;
      };
      await table.updateComplete;
    });

    await page.locator("#table-tasks tbody tr").first().getByRole("button").click();
    await expect(page).not.toHaveURL(/#tsk_1$/);
  });

  test("supports consumer-defined accessible row link labels", async ({ page }) => {
    await page.goto("/");
    const table = page.locator("#table-tasks");
    await table.evaluate(async (element) => {
      const dataTable = element as HTMLElement & {
        rows: Array<{ metadata: { title: string }; state: string }>;
        rowLabel: (row: { metadata: { title: string } }) => string;
        renderCell: (row: { metadata: { title: string }; state: string }, key: string) => string;
        updateComplete: Promise<boolean>;
      };
      dataTable.rows = [{ metadata: { title: "Visible task" }, state: "Open" }];
      dataTable.rowLabel = (row) => `Open ${row.metadata.title}`;
      dataTable.renderCell = (row, key) =>
        key === "title" ? row.metadata.title : row.state;
      await dataTable.updateComplete;
    });

    await expect(table.getByRole("link")).toHaveAccessibleName("Open Visible task");
  });

  test("renders compact 12px headers with tokenized semibold weight", async ({ page }) => {
    await page.goto("/");
    const table = page.locator("#table-tasks");
    const header = table.locator("th").first();
    await expect(header).toHaveCSS("font-weight", "600");
    await expect(header).toHaveCSS("font-size", "12px");
  });
});
