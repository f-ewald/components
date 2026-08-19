# `<calendar-day>`

A single day rendered as an hourly time grid — a Google-Calendar-style
view distinct from `calendar-month`'s whole-day table. Declarative
`calendar-entry` children with a time-of-day in `start`/`end` (e.g.
`start="2026-03-05T09:00"`) render as positioned/sized blocks; entries
with only a date (no time) render in an all-day band above the grid.
Overlapping timed entries stack into side-by-side columns; overlapping
all-day/multi-day entries stack into lanes, same as `calendar-month`.
Read-only.

Shares its slotted-entry observation, resolution, and hover/focus
interaction sync with `calendar-week` via `CalendarTimelineBase`.

## Install

```js
import "@f-ewald/components/calendar-day.js";
```

## Usage

```html
<calendar-day date="2026-07-15" time-marker>
  <calendar-entry start="2026-07-15" end="2026-07-15" label="Company holiday" color="neutral"></calendar-entry>
  <calendar-entry start="2026-07-15T09:00" end="2026-07-15T09:30" label="Standup" color="info"></calendar-entry>
  <calendar-entry start="2026-07-15T09:15" end="2026-07-15T10:00" label="Design review" color="primary" href="#review">
    <span slot="detail">Walk through the new onboarding flow</span>
    <span slot="location">Room A</span>
  </calendar-entry>
</calendar-day>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `date` | `date` | `string` | `—` | The day shown, `"YYYY-MM-DD"`. |
| `timeMarker` | `time-marker` | `boolean` | `false` | Shows a fine live line marking the current time, with a rounded pill in the hour gutter reading the current clock time. The hour label the pill covers is hidden while it does. Only rendered when `date` is today. |
| `minWidth` | `min-width` | `string` | `""` | Minimum width for the day column, as a CSS length (e.g. `"18rem"`). Unset leaves the host's width fully controlled by its container — useful as the sizing floor when placing several `calendar-day` elements in a scrollable row. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Declarative `calendar-entry` elements to render for this day. |
| `actions` | Optional controls rendered beside the day name (e.g. day-navigation buttons). |

## CSS custom properties

| Custom property |
| --- |
| `--ui-border` |
| `--ui-danger` |
| `--ui-focus-ring` |
| `--ui-font` |
| `--ui-font-size-lg` |
| `--ui-font-size-sm` |
| `--ui-font-size-xs` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-regular` |
| `--ui-font-weight-semibold` |
| `--ui-hover-overlay` |
| `--ui-info` |
| `--ui-line-height-tight` |
| `--ui-on-accent` |
| `--ui-primary` |
| `--ui-radius-pill` |
| `--ui-radius-sm` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-warning` |
