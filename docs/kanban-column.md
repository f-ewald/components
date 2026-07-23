# `<kanban-column>`

A single kanban column: a titled, vertically scrollable region that holds
its `kanban-card` children (its default `<slot>`), with a header showing the
column title and card count. Purely presentational and metadata-only —
`kanban-board` creates it, positions the cards inside it, and drives the
drop-target highlight via the reflected `dragover` attribute and the empty
hint via `empty`.

## Install

```js
import "@f-ewald/components/kanban-column.js";
```

## Usage

```html
<kanban-column></kanban-column>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | Column title shown in the header. |
| `count` | `count` | `number` | `0` | Number of cards in the column, shown as a count badge. |
| `dragover` | `dragover` | `boolean` | `false` | Set by the board while a card is dragged over this column, for highlight. |
| `empty` | `empty` | `boolean` | `false` | Whether the column currently has no cards, so it renders an empty hint. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-glyph` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
