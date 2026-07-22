# `<status-pill>`

Small colored status pill, optionally with a spinning icon — for task/run
states ("Open", "Blocked", "Done") and live-activity indicators ("Running").

## Install

```js
import "@f-ewald/components/status-pill.js";
```

## Usage

```html
<status-pill label="Running" color="primary" spinner></status-pill>
<status-pill label="Blocked" color="danger"></status-pill>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Text shown inside the pill. |
| `color` | `color` | `StatusPillColor` | `"neutral"` | Color variant. |
| `spinner` | `spinner` | `boolean` | `false` | Renders a small spinning icon before the label. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-danger` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-info` |
| `--ui-primary` |
| `--ui-success` |
| `--ui-text-muted` |
| `--ui-warning` |
