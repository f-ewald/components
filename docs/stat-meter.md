# `<stat-meter>`

A compact labeled meter for a single percentage reading — e.g. CPU or
memory usage in a dashboard header. `percent` may be `null` when no
reading is available yet (e.g. the first tick of a polling metric); the
bar then renders empty and the value shows an em dash instead of "0%".

## Install

```js
import "@f-ewald/components/stat-meter.js";
```

## Usage

```html
<stat-meter label="CPU" percent="42"></stat-meter>
<stat-meter label="MEM" percent="76"></stat-meter>
<stat-meter label="I/O"></stat-meter> <!-- percent unset -> null -> renders "—" -->
<stat-meter label="GPU" percent="88" color="#dc2626"></stat-meter>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Short label shown before the bar, e.g. "CPU" or "MEM". |
| `percent` | `percent` | `number | null` | `null` | Percentage 0-100. `null` renders an empty bar and a "—" value instead of "0%". |
| `color` | `color` | `string` | `""` | Fill color override; falls back to the `--ui-success` token. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-success` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
