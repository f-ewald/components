# `<price-history-chart>`

D3-powered SVG line chart for property price history.

Uses scaleTime (X) + scaleLinear (Y) from d3-scale and line/area path
generators from d3-shape. Adapts to container width via ResizeObserver.

## Install

```js
import "@f-ewald/components/price-history-chart.js";
```

## Usage

```html
<price-history-chart></price-history-chart>
<script type="module">
  document.querySelector("price-history-chart").history = [
    { date: "2023-01-01", price: 620000, eventType: "Listed" },
    { date: "2024-02-01", price: 680000, eventType: "Sold" },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `history` | `history` | `PricePoint[]` | `[]` | Array of price points (points with null price/date are skipped). |
| `yLabels` | `y-labels` | `"auto" | "always" | "never"` | `"auto"` | "auto" (default) | "always" | "never" |
| `maxXLabels` | `max-x-labels` | `number` | `3` | Max X-axis date ticks (default 3). |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
