# `<timeline-entry>`

One event on a `timeline-container`: a dot on the vertical line, an optional
headline, a relative timestamp ("3 hours ago"), and freely nested content.
The connecting line is drawn here — its segment above the dot is hidden on
the first entry and the segment below is hidden on the last, so the line caps
exactly at the first and last dots. Only meaningful inside a
`timeline-container`; demonstrated through it.

## Install

```js
import "@f-ewald/components/timeline-entry.js";
```

## Usage

```html
<timeline-entry datetime="2026-07-23T09:00:00Z">
  <span slot="headline">Deployment started</span>
  Release v1.4.0 is rolling out to production.
</timeline-entry>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `datetime` | `datetime` | `string | null` | `null` | ISO 8601 or SQLite datetime string, rendered as a relative time. |

## Events

_None._

## Slots

_None._

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-font` |
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-weight-semibold` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
