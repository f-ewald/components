# `<line-chart>`

Multi-series line chart supporting linear, logarithmic, and time axes,
optional shaded bands, horizontal/vertical/diagonal reference lines, a
highlighted `selected-x` cursor, and clickable points.

The interactive legend isolates a series on click (clicking it again shows
all) and toggles one on Ctrl/Cmd-click or a touch long press. Hover, tap, or
drag — or focus the plot and use `←`/`→`/`Home`/`End` — to inspect values;
click or press `Enter`/`Space` to emit `line-point-select`; `Escape` or a
tap outside dismisses the tooltip.

## Install

```js
import "@f-ewald/components/line-chart.js";
```

## Usage

```html
<line-chart x-label="Added delay (ms)" y-label="Change at p90 (ms)" show-points selected-x="50"></line-chart>
<script type="module">
  const chart = document.querySelector("line-chart");
  chart.references = [{ axis: "diagonal", label: "Full pass-through" }];
  chart.series = [
    { id: "truth", label: "Truth (replay)", points: [{ x: 0, y: 0 }, { x: 25, y: 12 }, { x: 50, y: 31 }, { x: 100, y: 78 }] },
    { id: "pred", label: "Prediction", points: [{ x: 0, y: 0 }, { x: 25, y: 14 }, { x: 50, y: 34 }, { x: 100, y: 74 }] },
    { id: "naive", label: "Naive", dashed: true, points: [{ x: 0, y: 0 }, { x: 25, y: 25 }, { x: 50, y: 50 }, { x: 100, y: 100 }] },
  ];
  chart.addEventListener("line-point-select", (e) => (chart.selectedX = e.detail.x));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `series` | _(JS property only)_ | `LineChartSeries[]` | `[]` | Series to draw. Assign a new array to redraw. |
| `xType` | `x-type` | `ChartAxisType` | `"linear"` | X axis scale: numeric `"linear"` (default), `"log"`, or `"time"`. |
| `yType` | `y-type` | `"linear" | "log"` | `"linear"` | Y axis scale: `"linear"` (default) or `"log"`. |
| `xLabel` | `x-label` | `string` | `""` | Optional x axis title drawn below tick labels. |
| `yLabel` | `y-label` | `string` | `""` | Optional y axis title drawn along the left edge. |
| `xDomain` | _(JS property only)_ | `[ChartAxisValue, ChartAxisValue] | null` | `null` | Fixed x axis range `[start, end]`; `null` fits the data. |
| `yDomain` | _(JS property only)_ | `[number, number] | null` | `null` | Fixed y axis range `[min, max]`; `null` fits the visible data. |
| `xReverse` | `x-reverse` | `boolean` | `false` | Runs the x axis right to left; keyboard arrows still move visually. |
| `curve` | `curve` | `"linear" | "monotone"` | `"linear"` | Line interpolation: `"linear"` (default) or `"monotone"`. |
| `showPoints` | `show-points` | `boolean` | `false` | Draws markers on every point; series can also set `showPoints` individually. |
| `selectedX` | `selected-x` | `ChartAxisValue | null` | `null` | Optional vertical selection highlight at an x position. |
| `references` | _(JS property only)_ | `LineChartReference[]` | `[]` | Horizontal, vertical, or diagonal (`y = x`) reference lines. |
| `visible` | _(JS property only)_ | `string[] | null` | `null` | Visible series IDs; `null` (default) shows all. Updated by the legend. |
| `height` | `height` | `number` | `300` | Plot height in CSS pixels, excluding the legend. |
| `locale` | `locale` | `string` | `"en-US"` | BCP 47 locale for default number and date formatting. |
| `xFormat` | _(JS property only)_ | `((x: number) => string) | null` | `null` | Custom formatter for x ticks, tooltip header, and summary. |
| `yFormat` | _(JS property only)_ | `((y: number) => string) | null` | `null` | Custom formatter for y ticks, tooltip values, and summary. |
| `interactive` | `interactive` | `boolean` | `true` | Enables clicking points and legend toggling (default `true`; accepts `interactive="false"`). |
| `tooltip` | `tooltip` | `boolean` | `true` | Shows the hover/tap/keyboard tooltip and crosshair (default `true`; accepts `tooltip="false"`). |

## Events

| Event | Description |
| --- | --- |
| `line-point-select` | User clicked a point/x position or pressed Enter/Space. `detail: { x: number, rawX: ChartAxisValue, points: LineChartSelectedValue[] }`. |
| `series-visibility-change` | Legend changed visible series. `detail: { visible: string[] | null }` (null = all). |

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-numeric` |
| `--ui-primary` |
| `--ui-radius-circle` |
| `--ui-radius-pill` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tooltip` |
| `--ui-tooltip-text` |
