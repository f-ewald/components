# `<distribution-chart>`

Renders a KDE distribution curve for a named metric with one or more value
markers. The SVG viewBox is kept in sync with the element's pixel width via
ResizeObserver so that font sizes and stroke widths are always in real pixels
regardless of container width.

Pass `fontSize` to control all text size (default 11). Pass a single
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
| `markerColors` | _(JS property only)_ | `string[]` | `["#4f46e5", "#d97706", "#0d9488", "#e11d48"]` | Colors assigned to markers in order. Defaults to indigo/amber/teal/rose 600s. |
| `fontSize` | `font-size` | `number` | `11` | Target font size in CSS pixels (default 11). Always renders at this size regardless of container width. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-danger` |
| `--ui-font-size-sm` |
| `--ui-radius-sm` |
| `--ui-text-muted` |
