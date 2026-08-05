# `<progress-bar>`

A determinate horizontal progress indicator — a page-level "step 3 of 14"
bar. `stat-meter` is the closest existing thing but is an inline
CPU-gauge-style meter with a leading label and a computed percent value;
`progress-bar` instead takes a raw `value`/`max` pair and renders an
optional plain-text `label` to the right of the bar rather than a percent
inside it.

## Install

```js
import "@f-ewald/components/progress-bar.js";
```

## Usage

```html
<progress-bar value="3" max="14" label="Question 3 out of 14"></progress-bar>
<progress-bar value="7" max="10" color="#dc2626" track-color="#fecaca"></progress-bar>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `number` | `0` | Current progress. Clamped into [0, max]. |
| `max` | `max` | `number` | `100` | Value representing a full bar. |
| `label` | `label` | `string` | `""` | Optional text rendered to the right of the bar (e.g. "Question 3 out of 14"). |
| `color` | `color` | `string` | `""` | Fill color; defaults to the themed accent. |
| `trackColor` | `track-color` | `string` | `""` | Track color behind the fill. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-button-accent` |
| `--ui-font` |
| `--ui-font-size-sm` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-surface-muted` |
| `--ui-text-muted` |
