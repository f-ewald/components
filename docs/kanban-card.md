# `<kanban-card>`

A single kanban card's compact overview: its ticket number and title only.
Purely presentational and metadata-only — it is created and driven by
`kanban-board`, which owns drag-and-drop, selection, and the richer detail
view (description, state, and timestamps live in the board's popover, not
here). The board sets `draggable`, toggles the `dragging`/`grabbed`
attributes for pointer and keyboard moves, and binds the open/keyboard
handlers; focus is delegated to the inner control so the board can move
keyboard focus to a card after a move.

## Install

```js
import "@f-ewald/components/kanban-card.js";
```

## Usage

```html
<kanban-card></kanban-card>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `ticket` | `ticket` | `string` | `""` | Ticket identifier shown before the title, e.g. `"PROJ-142"`. |
| `heading` | `heading` | `string` | `""` | Card title shown in the overview. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-highlight` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-shadow` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
