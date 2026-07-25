# `<timeline-entry>`

One event on a `timeline-container`: a dot on the vertical line, an optional
headline, a relative timestamp ("3 hours ago"), and freely nested content.
The connecting line is drawn here — its segment above the dot is hidden on
the first entry and the segment below is hidden on the last, so the line caps
exactly at the first and last dots. Only meaningful inside a
`timeline-container`; demonstrated through it.

`datetime` is the entry's one timestamp. A nested element that has its own
timestamp prop (e.g. `chat-message`'s `timestamp`) should leave it unset —
setting both renders the same time twice.

The dot's `color` types the entry using the shared status-pill palette —
`primary` by default, plus `neutral`, `info`, `success`, `warning`, and
`danger`.

Set `compact` for dense, one-line system-status entries (running spinners,
state changes): it tightens the vertical spacing and renders the content
smaller and muted.

## Install

```js
import "@f-ewald/components/timeline-entry.js";
```

## Usage

```html
<timeline-entry datetime="2026-07-23T09:00:00Z" color="danger">
  <span slot="headline">Build failed</span>
  The release pipeline halted on the test stage.
</timeline-entry>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `datetime` | `datetime` | `string | null` | `null` | ISO 8601 or SQLite datetime string, rendered as a relative time. |
| `color` | `color` | `StatusPillColor` | `"primary"` | Visual type of the entry's dot, from the shared status-pill palette: `primary` (default), `neutral`, `info`, `success`, `warning`, or `danger`. |
| `compact` | `compact` | `boolean` | `false` | Dense, one-line presentation for system-status entries: tighter vertical spacing and smaller, muted content. |

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
| `--ui-font-size` |
| `--ui-font-size-sm` |
| `--ui-font-weight-semibold` |
| `--ui-info` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-success` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-warning` |
