# `<percent-bar-chart>`

Bar chart for labeled rows, using D3's linear scale. Horizontal (default)
renders stacked rows with bars growing rightward; `orientation="vertical"`
renders side-by-side columns growing upward instead. `mode="percent"`
(default) scales `value` against a fixed 0-100 domain and labels it with a
`%` suffix; `mode="value"` scales it against `max` (or the largest `value`
present) and formats it with `valueFormat`.

## Install

```js
import "@f-ewald/components/percent-bar-chart.js";
```

## Usage

```html
<percent-bar-chart></percent-bar-chart>
<script type="module">
  const chart = document.querySelector("percent-bar-chart");
  chart.groups = [
    { key: "a", label: "White", value: 45.2, color: "#4f46e5" },
    { key: "b", label: "Asian", value: 28.1, color: "#0d9488" },
  ];

  // Absolute values instead of percentages, as vertical columns:
  chart.mode = "value";
  chart.orientation = "vertical";
  chart.valueFormat = (value) => `$${value.toLocaleString()}`;
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `groups` | _(JS property only)_ | `PercentBarGroup[]` | `[]` | Rows to render, one per group. |
| `mode` | `mode` | `PercentBarMode` | `"percent"` | Whether `value` is a 0-100 percentage (fixed domain) or an arbitrary number (domain from data/`max`). |
| `orientation` | `orientation` | `PercentBarOrientation` | `"horizontal"` | Bar direction: stacked rows growing rightward, or columns growing upward. |
| `max` | `max` | `number | undefined` | `—` | Explicit domain max for `mode="value"`; auto-computed from `groups` when unset. Ignored in `mode="percent"`. |
| `valueFormat` | _(JS property only)_ | `(value: number) => string` | `—` | Formats a row's value for its label in `mode="value"`. Defaults to locale-formatted number. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-text-muted` |
