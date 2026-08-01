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
<calendar-day date="2026-07-15">
  <calendar-entry start="2026-07-15" end="2026-07-15" label="Company holiday" color="neutral"></calendar-entry>
  <calendar-entry start="2026-07-15T09:00" end="2026-07-15T09:30" label="Standup" color="info"></calendar-entry>
  <calendar-entry start="2026-07-15T09:15" end="2026-07-15T10:00" label="Design review" color="primary" href="#review">
    <span slot="detail">Walk through the new onboarding flow</span>
  </calendar-entry>
</calendar-day>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `date` | `date` | `string` | `—` | The day shown, `"YYYY-MM-DD"`. |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Declarative `calendar-entry` elements to render for this day. |

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
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-warning` |
