# `<percent-bar-chart>`

Horizontal bar chart for labeled percentage rows, using D3's linear scale.
Each group gets its own labeled row; bars are proportional to percentage of 100.

## Install

```js
import "@f-ewald/components/percent-bar-chart.js";
```

## Usage

```html
<percent-bar-chart></percent-bar-chart>
<script type="module">
  document.querySelector("percent-bar-chart").groups = [
    { key: "a", label: "White", pct: 45.2, color: "#4f46e5" },
    { key: "b", label: "Asian", pct: 28.1, color: "#0d9488" },
  ];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `groups` | _(JS property only)_ | `PercentBarGroup[]` | `[]` | Rows to render, one per group. |

## Events

_None._

## Slots

_None._

## CSS custom properties

_None._
