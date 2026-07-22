# `<data-table>`

A generic, presentational table shell: renders a `<thead>` from `columns`
and one `<tr>` per entry in `rows`, with each cell's content produced by
`renderCell` (default: plain property lookup on the row object). Knows
nothing about what a "row" means — callers own the data shape entirely.

Optional `rowHref` makes whole rows clickable (navigating via `location.hash`),
without hijacking clicks on nested interactive elements (links/buttons) a
cell's rendered content might contain.

## Install

```js
import "@f-ewald/components/data-table.js";
```

## Usage

```html
<data-table></data-table>
<script type="module">
  const table = document.querySelector("data-table");
  table.columns = [
    { key: "title", label: "Title" },
    { key: "state", label: "State" },
  ];
  table.rows = [
    { id: "tsk_1", title: "Write onboarding docs", state: "Backlog" },
    { id: "tsk_2", title: "Fix the login bug", state: "Done" },
  ];
  table.rowHref = (row) => `#/tasks/${row.id}`;
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `columns` | _(JS property only)_ | `DataTableColumn[]` | `[]` | Column headers, in display order. |
| `rows` | _(JS property only)_ | `unknown[]` | `[]` | Row data; opaque to this component beyond what `renderCell` does with it. |
| `rowKey` | _(JS property only)_ | `(row: unknown, index: number) => string | number` | `—` | Stable identity for `rows[i]`, used as the repeat-directive key. Defaults to the row's index. |
| `renderCell` | _(JS property only)_ | `(row: unknown, key: string) => unknown` | `—` | Produces a cell's rendered content for `row`/`column.key`. Default: `row[key]`. |
| `rowHref` | _(JS property only)_ | `((row: unknown) => string | null) | null` | `null` | When set, clicking a row (outside any nested link/button) navigates to this hash. |
| `rowLabel` | _(JS property only)_ | `((row: unknown) => string) | null` | `null` | Accessible label for a row's keyboard link; defaults to primitive cell values. |

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
| `--ui-font-size-sm` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
