# `<scatter-chart>`

Interactive 2D scatter plot with optional grouped colors and legend,
diagonal (`y = x`) and axis reference lines, equal-axis scaling, ringed
clickable points, smooth keyed updates (respecting `prefers-reduced-motion`),
floating tooltips, touch tap pinning, and arrow-key navigation.

## Install

```js
import "@f-ewald/components/scatter-chart.js";
```

## Usage

```html
<scatter-chart x-label="True change (ms)" y-label="Predicted change (ms)" legend-label="Delay" equal-axes></scatter-chart>
<script type="module">
  const chart = document.querySelector("scatter-chart");
  chart.references = [{ axis: "diagonal", label: "Prediction = truth" }];
  chart.points = [
    { id: "feed-50", x: 31, y: 34, group: "+50 ms", label: "GET /feed", linked: true },
    { id: "feed-100", x: 78, y: 74, group: "+100 ms", label: "GET /feed", linked: true },
    { id: "prof-50", x: 12, y: 16, group: "+50 ms", label: "GET /profile" },
  ];
  chart.addEventListener("scatter-point-select", (e) => console.log(e.detail.point));
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `points` | _(JS property only)_ | `ScatterPoint[]` | `[]` | Points to plot. Assign a new array to update; give points stable `id`s for smooth movement. |
| `groups` | _(JS property only)_ | `ScatterGroup[] | null` | `null` | Optional explicit group order, labels, and colors for the legend. |
| `visible` | _(JS property only)_ | `string[] | null` | `null` | Visible group IDs; `null` (default) shows all. Updated by the legend. |
| `xType` | `x-type` | `"linear" | "log"` | `"linear"` | X axis scale: `"linear"` (default) or `"log"`. |
| `yType` | `y-type` | `"linear" | "log"` | `"linear"` | Y axis scale: `"linear"` (default) or `"log"`. |
| `xLabel` | `x-label` | `string` | `""` | Optional x axis title drawn below tick labels. |
| `yLabel` | `y-label` | `string` | `""` | Optional y axis title drawn along the left edge. |
| `xDomain` | _(JS property only)_ | `[number, number] | null` | `null` | Fixed x axis range `[min, max]`; `null` fits the data. |
| `yDomain` | _(JS property only)_ | `[number, number] | null` | `null` | Fixed y axis range `[min, max]`; `null` fits the data. |
| `equalAxes` | `equal-axes` | `boolean` | `false` | Uses the same `[min, max]` extent on both axes (ideal for predicted-vs-true diagonal plots). |
| `references` | _(JS property only)_ | `ScatterReference[]` | `[]` | Diagonal (`y = x`), horizontal, or vertical reference lines. |
| `legendLabel` | `legend-label` | `string` | `""` | Optional prefix label shown before the group legend items (e.g. `"Delay"`). |
| `animated` | `animated` | `boolean` | `true` | Smoothly transitions dot positions across updates (disabled under `prefers-reduced-motion`). |
| `height` | `height` | `number` | `340` | Plot height in CSS pixels, excluding the legend. |
| `locale` | `locale` | `string` | `"en-US"` | BCP 47 locale for default number formatting. |
| `xFormat` | _(JS property only)_ | `((x: number) => string) | null` | `null` | Custom formatter for x ticks, tooltip, and summary. |
| `yFormat` | _(JS property only)_ | `((y: number) => string) | null` | `null` | Custom formatter for y ticks, tooltip, and summary. |
| `interactive` | `interactive` | `boolean` | `true` | Enables clicking points and legend toggling (default `true`; accepts `interactive="false"`). |
| `tooltip` | `tooltip` | `boolean` | `true` | Shows the hover/tap/keyboard tooltip and focus ring (default `true`; accepts `tooltip="false"`). |

## Events

| Event | Description |
| --- | --- |
| `scatter-point-select` | User clicked a dot or pressed Enter/Space while inspecting it. `detail: { point: ScatterPoint, index: number }`. |
| `series-visibility-change` | Legend changed visible groups. `detail: { visible: string[] | null }` (null = all). |

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
| `--ui-label-transform` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-numeric` |
| `--ui-primary` |
| `--ui-radius-circle` |
| `--ui-radius-sm` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tooltip` |
| `--ui-tooltip-text` |
| `--ui-tracking-wide` |
