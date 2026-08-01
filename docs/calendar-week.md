# `<calendar-week>`

Sunday-through-Saturday week rendered as one shared hourly time grid — the
seven-day sibling of `calendar-day`. Unlike `calendar-year` composing 12
`calendar-month` children, this is its own independent 7-column layout
(not 7 nested `<calendar-day>` elements): a single hour gutter is drawn
once, and multi-day/all-day entries span the days they cover as one
continuous bar in a shared all-day band, since lanes for that band are
assigned once across the whole visible week (unlike `calendar-month`'s
documented per-instance lane limitation). Timed entries stack into
side-by-side columns independently per day, same as `calendar-day`.
Read-only.

Shares its slotted-entry observation, resolution, and hover/focus
interaction sync with `calendar-day` via `CalendarTimelineBase`.

## Install

```js
import "@f-ewald/components/calendar-week.js";
```

## Usage

```html
<calendar-week date="2026-07-15">
  <calendar-entry start="2026-07-13" end="2026-07-15" label="Offsite" color="primary" href="#offsite"></calendar-entry>
  <calendar-entry start="2026-07-14T09:00" end="2026-07-14T09:30" label="Standup" color="info"></calendar-entry>
  <calendar-entry start="2026-07-16T14:00" end="2026-07-16T15:00" label="Customer demo" color="success"></calendar-entry>
</calendar-week>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `date` | `date` | `string` | `—` | Any date within the displayed week (`"YYYY-MM-DD"`) — the week runs Sunday through Saturday. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Declarative `calendar-entry` elements to render for this week. |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-lg` |
| `--ui-font-size-sm` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-semibold` |
| `--ui-hover-overlay` |
| `--ui-info` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-warning` |
