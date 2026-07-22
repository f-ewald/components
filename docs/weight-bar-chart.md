# `<weight-bar-chart>`

Sorted horizontal bar chart of labeled weights (normalized fractions
summing to ~1). Bars sort descending — the order IS the priority ranking.
Widths scale relative to the largest weight (which fills its track); the
percent labels carry the absolute values. Rows are keyed by item id
(repeat directive) so a re-render with new weights moves the existing
rows; bar widths animate via CSS, re-sorting is instant.

## Install

```js
import "@f-ewald/components/weight-bar-chart.js";
```

## Usage

```html
<weight-bar-chart></weight-bar-chart>
<script type="module">
  document.querySelector("weight-bar-chart").items = [
    { id: "price", label: "Price", value: 0.4 },
    { id: "schools", label: "Schools", value: 0.35 },
    { id: "commute", label: "Commute", value: 0.25 },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | _(JS property only)_ | `WeightBarItem[]` | `[]` | Items to render as weighted rows, sorted descending by value. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-primary` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
