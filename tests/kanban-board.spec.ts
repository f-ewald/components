import { test, expect, type Page } from "@playwright/test";

/**
 * Drives the board's HTML5 drag-and-drop by dispatching the drag event
 * sequence directly. The board tracks the active drag in its own state (not the
 * DataTransfer payload), so synthetic events faithfully exercise the real move
 * logic. `where` picks the drop position within the destination column.
 */
async function dragCard(
  page: Page,
  boardSelector: string,
  cardId: string,
  toColumnId: string,
  where: "start" | "end",
): Promise<void> {
  await page.evaluate(
    ({ boardSelector, cardId, toColumnId, where }) => {
      const board = document.querySelector(boardSelector)!;
      const root = board.shadowRoot!;
      const card = root.querySelector<HTMLElement>(`kanban-card[data-card-id="${cardId}"]`)!;
      const column = root.querySelector<HTMLElement>(`kanban-column[data-column-id="${toColumnId}"]`)!;
      const dataTransfer = new DataTransfer();
      const fire = (target: HTMLElement, type: string, clientY?: number) =>
        target.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            composed: true,
            cancelable: true,
            dataTransfer,
            ...(clientY === undefined ? {} : { clientY }),
          }),
        );

      const cards = [...root.querySelectorAll<HTMLElement>(`kanban-card[data-column-id="${toColumnId}"]`)];
      let clientY: number;
      if (cards.length === 0) {
        const rect = column.getBoundingClientRect();
        clientY = rect.top + rect.height / 2;
      } else if (where === "start") {
        clientY = cards[0].getBoundingClientRect().top + 1;
      } else {
        clientY = cards[cards.length - 1].getBoundingClientRect().bottom - 1;
      }

      fire(card, "dragstart");
      fire(column, "dragover", clientY);
      fire(column, "drop", clientY);
      fire(card, "dragend");
    },
    { boardSelector, cardId, toColumnId, where },
  );
}

async function trackEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    const board = document.getElementById("kanban-demo")!;
    (window as unknown as { __moves: unknown[]; __opens: unknown[] }).__moves = [];
    (window as unknown as { __moves: unknown[]; __opens: unknown[] }).__opens = [];
    board.addEventListener("card-move", (e) =>
      (window as unknown as { __moves: unknown[] }).__moves.push((e as CustomEvent).detail),
    );
    board.addEventListener("card-open", (e) =>
      (window as unknown as { __opens: unknown[] }).__opens.push((e as CustomEvent).detail),
    );
  });
}

const moves = (page: Page) =>
  page.evaluate(() => (window as unknown as { __moves: unknown[] }).__moves);
const opens = (page: Page) =>
  page.evaluate(() => (window as unknown as { __opens: unknown[] }).__opens);

test.describe("kanban-board", () => {
  test("renders a column per entry with card counts; overview shows only ticket + title", async ({
    page,
  }) => {
    await page.goto("/");
    const board = page.locator("#kanban-demo");

    const columns = board.locator("kanban-column");
    await expect(columns).toHaveCount(3);
    await expect(columns.locator(".heading")).toHaveText(["To Do", "In Progress", "Done"]);
    await expect(columns.locator(".count")).toHaveText(["2", "1", "1"]);

    const firstCard = board.locator('kanban-card[data-card-id="c1"]');
    await expect(firstCard).toContainText("PROJ-142");
    await expect(firstCard).toContainText("Wire up auth callback");
    // The description is detail-only and must not leak into the overview.
    await expect(board).not.toContainText("Handle the OAuth redirect");
  });

  test("a card overview is a draggable button named by its ticket and title", async ({ page }) => {
    await page.goto("/");
    const card = page.locator('#kanban-demo kanban-card[data-card-id="c1"]');
    await expect(card).toHaveAttribute("draggable", "true");
    await expect(card.getByRole("button")).toHaveAccessibleName("PROJ-142: Wire up auth callback");
  });

  test("opening a card shows its detail popover with description, state, and metadata", async ({
    page,
  }) => {
    await page.goto("/");
    await trackEvents(page);
    await page.locator('#kanban-demo kanban-card[data-card-id="c1"]').click();

    const popover = page.locator("#kanban-demo popover-panel");
    const dialog = popover.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName("Wire up auth callback");
    await expect(popover).toContainText("Handle the OAuth redirect");

    const pills = popover.locator("radio-pills");
    await expect(pills.locator("span")).toHaveText(["To Do", "In Progress", "Done"]);
    await expect(pills.locator("input:checked")).toHaveCount(1);

    await expect(popover).toContainText("PROJ-142");
    await expect(popover.locator("relative-time")).toHaveCount(2);

    expect(await opens(page)).toEqual([{ cardId: "c1" }]);
  });

  test("changing state in the popover moves the card and fires card-move", async ({ page }) => {
    await page.goto("/");
    await trackEvents(page);
    await page.locator('#kanban-demo kanban-card[data-card-id="c1"]').click();

    const pills = page.locator("#kanban-demo popover-panel radio-pills");
    await pills.getByText("Done", { exact: true }).click();

    expect(await moves(page)).toEqual([
      { cardId: "c1", fromColumnId: "todo", toColumnId: "done", toIndex: 1 },
    ]);

    const columns = page.locator("#kanban-demo kanban-column");
    await expect(columns.locator(".count")).toHaveText(["1", "1", "2"]);
    await expect(
      page.locator('#kanban-demo kanban-column[data-column-id="done"] kanban-card[data-card-id="c1"]'),
    ).toBeVisible();
  });

  test("dragging a card to another column moves it and fires card-move", async ({ page }) => {
    await page.goto("/");
    await trackEvents(page);

    await dragCard(page, "#kanban-demo", "c1", "doing", "end");

    expect(await moves(page)).toEqual([
      { cardId: "c1", fromColumnId: "todo", toColumnId: "doing", toIndex: 1 },
    ]);
    await expect(
      page.locator('#kanban-demo kanban-column[data-column-id="doing"] kanban-card[data-card-id="c1"]'),
    ).toBeVisible();
    await expect(page.locator("#kanban-demo kanban-column").locator(".count")).toHaveText([
      "1",
      "2",
      "1",
    ]);
  });

  test("dragging within a column reorders the cards", async ({ page }) => {
    await page.goto("/");
    await trackEvents(page);

    // c2 starts below c1 in To Do; drop it at the top.
    await dragCard(page, "#kanban-demo", "c2", "todo", "start");

    expect(await moves(page)).toEqual([
      { cardId: "c2", fromColumnId: "todo", toColumnId: "todo", toIndex: 0 },
    ]);
    const todoCards = page.locator('#kanban-demo kanban-column[data-column-id="todo"] kanban-card');
    await expect(todoCards.first()).toHaveAttribute("data-card-id", "c2");
    await expect(todoCards.nth(1)).toHaveAttribute("data-card-id", "c1");
  });

  test("keyboard: pick up, move across columns, and drop fires card-move", async ({ page }) => {
    await page.goto("/");
    await trackEvents(page);

    await page.locator('#kanban-demo kanban-card[data-card-id="c3"]').focus();
    await page.keyboard.press("Space"); // pick up c3 (In Progress)
    await page.keyboard.press("ArrowRight"); // move to Done (top)
    await page.keyboard.press("Space"); // drop

    expect(await moves(page)).toEqual([
      { cardId: "c3", fromColumnId: "doing", toColumnId: "done", toIndex: 0 },
    ]);
    await expect(
      page.locator('#kanban-demo kanban-column[data-column-id="done"] kanban-card[data-card-id="c3"]'),
    ).toBeVisible();
  });

  test("keyboard: Escape cancels a pick-up without moving the card", async ({ page }) => {
    await page.goto("/");
    await trackEvents(page);

    await page.locator('#kanban-demo kanban-card[data-card-id="c3"]').focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");

    expect(await moves(page)).toEqual([]);
    await expect(
      page.locator('#kanban-demo kanban-column[data-column-id="doing"] kanban-card[data-card-id="c3"]'),
    ).toBeVisible();
  });

  test("Enter opens the detail rather than picking up the card", async ({ page }) => {
    await page.goto("/");
    await trackEvents(page);

    await page.locator('#kanban-demo kanban-card[data-card-id="c1"]').focus();
    await page.keyboard.press("Enter");

    await expect(page.locator("#kanban-demo popover-panel").getByRole("dialog")).toBeVisible();
    expect(await opens(page)).toEqual([{ cardId: "c1" }]);
  });

  test("manual mode emits card-move without moving the card locally", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const board = document.createElement("kanban-board") as HTMLElement & {
        manual: boolean;
        columns: unknown;
        updateComplete: Promise<boolean>;
      };
      board.id = "manual-board";
      board.manual = true;
      board.columns = [
        { id: "a", title: "A", cards: [{ id: "x", ticket: "T-1", title: "X" }] },
        { id: "b", title: "B", cards: [] },
      ];
      (window as unknown as { __manualMoves: unknown[] }).__manualMoves = [];
      board.addEventListener("card-move", (e) =>
        (window as unknown as { __manualMoves: unknown[] }).__manualMoves.push((e as CustomEvent).detail),
      );
      document.body.append(board);
      await board.updateComplete;
    });

    await dragCard(page, "#manual-board", "x", "b", "end");

    // The move is announced...
    expect(await page.evaluate(() => (window as unknown as { __manualMoves: unknown[] }).__manualMoves)).toEqual(
      [{ cardId: "x", fromColumnId: "a", toColumnId: "b", toIndex: 0 }],
    );
    // ...but the board did NOT apply it locally — the card is still in column A.
    await expect(
      page.locator('#manual-board kanban-column[data-column-id="a"] kanban-card[data-card-id="x"]'),
    ).toBeVisible();
    await expect(
      page.locator('#manual-board kanban-column[data-column-id="b"] kanban-card'),
    ).toHaveCount(0);

    // Assigning the authoritative columns back (the socket echo) applies it.
    await page.evaluate(async () => {
      const board = document.getElementById("manual-board") as HTMLElement & {
        columns: unknown;
        updateComplete: Promise<boolean>;
      };
      board.columns = [
        { id: "a", title: "A", cards: [] },
        { id: "b", title: "B", cards: [{ id: "x", ticket: "T-1", title: "X" }] },
      ];
      await board.updateComplete;
    });
    await expect(
      page.locator('#manual-board kanban-column[data-column-id="b"] kanban-card[data-card-id="x"]'),
    ).toBeVisible();
  });

  test("keyed rendering reuses the same card element across a reordering columns update", async ({
    page,
  }) => {
    await page.goto("/");

    // Simulate a realtime update that reorders To Do (c1 moves below c2) with
    // the same card ids. Keyed rendering must reuse the existing c1 element
    // rather than rebinding a different positional element to c1's data.
    const result = await page.evaluate(async () => {
      const board = document.getElementById("kanban-demo") as HTMLElement & {
        columns: unknown;
        updateComplete: Promise<boolean>;
      };
      const root = board.shadowRoot!;
      const before = root.querySelector('kanban-card[data-card-id="c1"]') as
        | (HTMLElement & { __probe?: string })
        | null;
      if (before) before.__probe = "keep";

      board.columns = [
        {
          id: "todo",
          title: "To Do",
          cards: [
            { id: "c2", ticket: "PROJ-148", title: "Empty-state illustration" },
            { id: "c1", ticket: "PROJ-142", title: "Wire up auth callback" },
          ],
        },
        { id: "doing", title: "In Progress", cards: [] },
        { id: "done", title: "Done", cards: [] },
      ];
      await board.updateComplete;

      const after = root.querySelector('kanban-card[data-card-id="c1"]') as
        | (HTMLElement & { __probe?: string })
        | null;
      return {
        sameElement: before === after,
        probed: after?.__probe === "keep",
        order: [...root.querySelectorAll('kanban-card[data-column-id="todo"]')].map((card) =>
          card.getAttribute("data-card-id"),
        ),
      };
    });

    expect(result.sameElement).toBe(true);
    expect(result.probed).toBe(true);
    expect(result.order).toEqual(["c2", "c1"]);
  });

  test("the moved card briefly flashes a highlight, then clears it", async ({ page }) => {
    await page.goto("/");
    await dragCard(page, "#kanban-demo", "c1", "doing", "end");

    const moved = page.locator(
      '#kanban-demo kanban-column[data-column-id="doing"] kanban-card[data-card-id="c1"]',
    );
    // The highlight attribute is applied on drop...
    await expect(moved).toHaveAttribute("just-moved", "");
    // ...and an unrelated card never gets it...
    await expect(
      page.locator('#kanban-demo kanban-card[data-card-id="c4"]'),
    ).not.toHaveAttribute("just-moved", "");
    // ...then it clears itself after the highlight window.
    await expect(moved).not.toHaveAttribute("just-moved", "", { timeout: 3000 });
  });

  test("with reorderable=false, same-column drags are ignored but cross-column moves append", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (document.getElementById("kanban-demo") as HTMLElement & { reorderable: boolean }).reorderable =
        false;
    });
    await trackEvents(page);

    // Same-column reorder is a no-op (no event, order preserved).
    await dragCard(page, "#kanban-demo", "c2", "todo", "start");
    expect(await moves(page)).toEqual([]);
    const todo = page.locator('#kanban-demo kanban-column[data-column-id="todo"] kanban-card');
    await expect(todo.first()).toHaveAttribute("data-card-id", "c1");

    // Cross-column move still works and appends to the destination's end.
    await dragCard(page, "#kanban-demo", "c1", "doing", "start");
    expect(await moves(page)).toEqual([
      { cardId: "c1", fromColumnId: "todo", toColumnId: "doing", toIndex: 1 },
    ]);
    await expect(
      page.locator('#kanban-demo kanban-column[data-column-id="doing"] kanban-card').last(),
    ).toHaveAttribute("data-card-id", "c1");
  });

  test("with reorderable=false, keyboard up/down are inert but left/right still move columns", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (document.getElementById("kanban-demo") as HTMLElement & { reorderable: boolean }).reorderable =
        false;
    });
    await trackEvents(page);

    // Pick up, try to reorder within the column, drop — nothing changes.
    await page.locator('#kanban-demo kanban-card[data-card-id="c1"]').focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    expect(await moves(page)).toEqual([]);

    // Left/right still moves across columns (appending to the target).
    await page.locator('#kanban-demo kanban-card[data-card-id="c1"]').focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    expect(await moves(page)).toEqual([
      { cardId: "c1", fromColumnId: "todo", toColumnId: "doing", toIndex: 1 },
    ]);
  });
});
