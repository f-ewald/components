# `<kanban-board>`

A configurable kanban board: a horizontally scrolling row of columns, each
holding cards. **A card's column is its state** — moving a card to another
column (by drag-and-drop, keyboard, or the detail popover's state selector)
changes its state, and the board emits a single `card-move` for all three.

Data-driven: set the `columns` property to `KanbanColumnData[]`. The board
keeps its own working copy and mutates it optimistically on every move, so it
works standalone; re-assign `columns` at any time to stay controlled from a
store. Cards show only their ticket number and title in the overview; the
full detail (description, state, created/updated timestamps) opens in a
screen-centered `popover-panel`.

Pointer drag-and-drop supports both cross-column moves and within-column
reordering with a live drop indicator (set `reorderable` false to keep only
cross-column moves when intra-column order isn't persisted). Keyboard parity:
focus a card and press Space to pick it up, arrow keys to move it (left/right
across columns, up/down within a column), Space to drop, or Escape to cancel;
Enter opens the detail. Moves are announced in a polite live region, and the
moved card briefly flashes a warm highlight so you can see where it landed.

Set `manual` for a server-authoritative board (API + WebSocket/SSE): every
move still emits `card-move`, but the board does NOT apply it locally, so it
reflects only what you assign to `columns` — e.g. the change echoed back over
the socket. The default is optimistic local updates.

## Install

```js
import "@f-ewald/components/kanban-board.js";
```

## Usage

```html
<kanban-board label="Project tasks"></kanban-board>
<script type="module">
  const board = document.querySelector("kanban-board");
  board.columns = [
    {
      id: "todo",
      title: "To Do",
      cards: [
        {
          id: "c1",
          ticket: "PROJ-142",
          title: "Wire up auth callback",
          description: "Handle the OAuth redirect and persist the session token.",
          createdAt: "2026-07-18T09:12:00Z",
          updatedAt: "2026-07-21T14:03:00Z",
        },
      ],
    },
    { id: "doing", title: "In Progress", cards: [] },
    { id: "done", title: "Done", cards: [] },
  ];
  // A card's column is its state; drag-and-drop, keyboard, and the detail
  // popover state selector all emit the same card-move event.
  board.addEventListener("card-move", (e) => console.log(e.detail));
  board.addEventListener("card-open", (e) => console.log(e.detail.cardId));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `columns` | _(JS property only)_ | `KanbanColumnData[]` | `[]` | Columns (with their cards) to render, in display order. |
| `label` | `label` | `string` | `"Board"` | Accessible label for the board's group role. |
| `manual` | `manual` | `boolean` | `false` | Server-authoritative mode. When true, moves emit `card-move` but are not applied to the board locally; it reflects only what you assign to `columns` (e.g. echoed back over WebSocket/SSE), keeping the server as the single source of truth. Defaults to optimistic local updates. |
| `reorderable` | `reorderable` | `boolean` | `true` | Whether cards can be reordered within a column. Defaults to true. Set false when intra-column order isn't persisted (no server `rank`): drag and keyboard still move cards *between* columns (appended to the target), but reordering inside a column is disabled, so the UI only offers what sticks. |

## Events

| Event | Description |
| --- | --- |
| `card-move` | A card changed column/position; detail: { cardId, fromColumnId, toColumnId, toIndex }. |
| `card-open` | A card's detail view was opened; detail: { cardId }. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-line-height-normal` |
| `--ui-primary` |
| `--ui-text` |
| `--ui-text-muted` |
