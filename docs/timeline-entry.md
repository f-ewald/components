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

`label` is a free-text alternative for a timeline whose axis is not a wall
clock — a year, an era, a phase. It wins over `datetime` when both are set.
Slot `label` instead when it needs its own styling, since a property is
rendered inside this component's shadow DOM and cannot be reached from
outside.

`alternating` is set by `timeline-container` and should not be set by hand:
it switches the entry to three columns — label, line, body — with the sides
swapping on every second entry. The entry fills whatever height it is given,
so the line spans it rather than only its content — do not override the
host's `display` from outside, since a light-DOM rule beats the `:host`
declaration this relies on.

The dot's `color` types the entry using the shared status-pill palette —
`primary` by default, plus `neutral`, `info`, `success`, `warning`, and
`danger`.

Set `compact` for dense, one-line system-status entries: it tightens the
vertical spacing and renders the content smaller and muted.

Set `running` to replace the dot with an animated gray ring spinner,
indicating the entry represents in-progress work; `color` has no visible
effect while `running` is set.

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
| `label` | `label` | `string | null` | `null` | Free-text label shown in place of the relative time; wins over `datetime`. |
| `alternating` | `alternating` | `boolean` | `false` | Three-column alternating presentation. Set by `timeline-container` from its own `layout`; setting it directly is not supported. |
| `color` | `color` | `StatusPillColor` | `"primary"` | Visual type of the entry's dot, from the shared status-pill palette: `primary` (default), `neutral`, `info`, `success`, `warning`, or `danger`. |
| `compact` | `compact` | `boolean` | `false` | Dense, one-line presentation for system-status entries: tighter vertical spacing and smaller, muted content. |
| `running` | `running` | `boolean` | `false` | Shows an animated ring spinner in place of the dot, indicating the entry represents in-progress work. Overrides `color` while set — the spinner always uses the muted/gray palette. |

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
| `--ui-font-size-lg` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-semibold` |
| `--ui-info` |
| `--ui-line-height-normal` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius-pill` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-tracking-wide` |
| `--ui-warning` |
