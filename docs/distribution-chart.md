# `<distribution-chart>`

Renders a KDE distribution curve for a named metric with one or more value
markers. The SVG viewBox is kept in sync with the element's pixel width via
ResizeObserver so that font sizes and stroke widths are always in real pixels
regardless of container width.

Pass `fontSize` to control all text size (default 10). Pass a single
`{label:'', value}` for a single-value display or multiple
`{label:'A'|'B'|...}` entries to compare several values.

## Install

```js
import "@f-ewald/components/distribution-chart.js";
```

## Usage

```html
<distribution-chart metric="sqft"></distribution-chart>
<script type="module">
  document.querySelector("distribution-chart").values = [{ label: "", value: 1450 }];
</script>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `metric` | `metric` | `string` | `""` | Metric name, fetched from `/api/distribution/<metric>` on change. |
| `values` | _(JS property only)_ | `DistributionValue[]` | `[]` | One or more values to mark on the distribution curve. |
| `markerColors` | _(JS property only)_ | `string[]` | `[ "var(--ui-primary, #4f46e5)", "var(--ui-warning, #d97706)", "var(--ui-success, #16a34a)", "var(--ui-danger, #dc2626)", ]` | CSS colors assigned to markers in order. Defaults to the theme's primary, warning, success, and danger tokens, so markers follow light/dark themes. |
| `fontSize` | `font-size` | `number` | `10` | Target font size in CSS pixels (default 10). Always renders at this size regardless of container width. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-danger` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-primary` |
| `--ui-radius-circle` |
| `--ui-radius-sm` |
| `--ui-success` |
| `--ui-surface-muted` |
| `--ui-text-muted` |
| `--ui-warning` |
