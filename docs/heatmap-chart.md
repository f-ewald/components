# `<heatmap-chart>`

Interactive row × column matrix chart encoding cell values along a sequential
or diverging color ramp, with a gradient legend, missing-data cells,
contrast-checked value labels, sticky row headings, selectable columns/cells,
floating tooltips, and arrow-key grid navigation.

## Install

```js
import "@f-ewald/components/heatmap-chart.js";
```

## Usage

```html
<heatmap-chart x-label="Training data used" row-label="Endpoint" meta-label="Traces" selected-column="100%"></heatmap-chart>
<script type="module">
  const map = document.querySelector("heatmap-chart");
  map.columns = ["100%", "50%", "20%", "5%"];
  map.domain = [0, 0.25];
  map.valueFormat = (v) => `${Math.round(v * 100)}%`;
  map.rows = [
    { label: "GET /feed", meta: 4200, cells: [0.02, 0.04, 0.09, 0.19] },
    { label: "GET /profile", meta: 1850, cells: [0.03, 0.05, { value: 0.14, marker: "*", note: "1 of 3 seeds missing" }, null] },
  ];
  map.addEventListener("heatmap-column-select", (e) => (map.selectedColumn = e.detail.col));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `columns` | _(JS property only)_ | `HeatmapColumn[]` | `[]` | Column definitions or labels across the top of the matrix. |
| `rows` | _(JS property only)_ | `HeatmapRow[]` | `[]` | Rows of cells; each row's `cells` aligns index-for-index with `columns`. |
| `xLabel` | `x-label` | `string` | `""` | Optional column-axis header drawn above the column labels. |
| `rowLabel` | `row-label` | `string` | `""` | Optional heading for the row-label column. |
| `metaLabel` | `meta-label` | `string` | `""` | Optional heading for the secondary `meta` column (shown when any row has `meta`). |
| `colorScheme` | `color-scheme` | `HeatmapColorScheme` | `"heat"` | Built-in sequential or diverging color ramp. |
| `colorScale` | _(JS property only)_ | `((value: number, t: number) => string) | null` | `null` | Optional custom color function `(value, normalized01) => cssColor`, overriding `color-scheme`. |
| `domain` | _(JS property only)_ | `[number, number] | null` | `null` | Fixed `[min, max]` value domain for color mapping; `null` computes it from the data. |
| `showValues` | `show-values` | `boolean` | `true` | Renders formatted values inside cells. |
| `showLegend` | `show-legend` | `boolean` | `true` | Renders the gradient color legend above the matrix. |
| `missingLabel` | `missing-label` | `string` | `"No data"` | Label shown for missing (`null`) cells and in the legend. |
| `selectedColumn` | `selected-column` | `number | string | null` | `null` | Highlighted column by zero-based index, column `id`, or column `label`. |
| `selectedCell` | _(JS property only)_ | `{ row: number; col: number } | null` | `null` | Optional highlighted cell coordinates `{ row, col }`. |
| `cellWidth` | `cell-width` | `number` | `56` | Minimum width of each data column in CSS pixels. |
| `cellHeight` | `cell-height` | `number` | `28` | Height of each cell button in CSS pixels. |
| `caption` | `caption` | `string` | `""` | Visible or accessible table caption. |
| `locale` | `locale` | `string` | `"en-US"` | BCP 47 locale for default number formatting. |
| `valueFormat` | _(JS property only)_ | `((value: number) => string) | null` | `null` | Custom value formatter for cells, legend ticks, and tooltips. |
| `interactive` | `interactive` | `boolean` | `true` | Enables clicking cells and column headers (default `true`; accepts `interactive="false"`). |
| `tooltip` | `tooltip` | `boolean` | `true` | Shows floating cell tooltips on hover and focus (default `true`; accepts `tooltip="false"`). |

## Events

| Event | Description |
| --- | --- |
| `heatmap-column-select` | User clicked a column header. `detail: { col, columnId, columnLabel }`. |
| `heatmap-cell-select` | User clicked or activated a cell. `detail: { row, col, rowId, columnId, rowLabel, columnLabel, value, cell }`. |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-border-width` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-bold` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-regular` |
| `--ui-font-weight-semibold` |
| `--ui-label-transform` |
| `--ui-line-height-glyph` |
| `--ui-line-height-normal` |
| `--ui-numeric` |
| `--ui-primary` |
| `--ui-radius` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tooltip` |
| `--ui-tooltip-text` |
| `--ui-tracking-wide` |
