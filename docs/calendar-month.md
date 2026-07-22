# `<calendar-month>`

One month rendered as a top-to-bottom list of days — weekends and today
highlighted, with declarative `calendar-entry` children shown as colored
bars spanning the days they cover. An entry's title uses its first visible
day; every remaining visible day becomes one shared body for wrapped
details and an optional ending footer. Overlapping entries stack into
side-by-side lanes rather than being layered/hidden. Read-only.

Lanes are computed independently per instance, from only the entries
overlapping this month — an entry spanning a month boundary may therefore
land in a different lane index in the adjacent month's `calendar-month`.
This is an accepted v1 limitation: cross-month lane continuity would
require a shared parent (`calendar-year`) to assign lanes globally.

Entry attributes and slotted title/detail text are observed, so a
standalone month re-renders when consumers update declarative metadata.

## Install

```js
import "@f-ewald/components/calendar-month.js";
```

## Usage

```html
<calendar-month year="2026" month="7">
  <calendar-entry start="2026-07-10" end="2026-07-18" label="Vacation" color="success">
    <span slot="title">Vacation</span>
    <span slot="detail">Out of office</span>
    <span slot="detail">Road trip along the California coast with several scenic stops</span>
    <span slot="footer">Return July 19 at 6 PM</span>
  </calendar-entry>
  <calendar-entry start="2026-07-15" end="2026-07-20" label="Conference" color="warning" href="#conf">
    <span slot="detail">Talks and workshops</span>
    <span slot="footer">Closing keynote · July 20</span>
  </calendar-entry>
</calendar-month>
```

## Attributes / properties

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `year` | `year` | `number` | `—` | Calendar year, e.g. `2026`. |
| `month` | `month` | `number` | `1` | Calendar month, 1-12 (January = 1). |

## Events

_None._

## Slots

| Slot | Description |
| --- | --- |
| `(default)` | Declarative `calendar-entry` elements to render for this month. |

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
| `--ui-font-weight-bold` |
| `--ui-font-weight-medium` |
| `--ui-font-weight-regular` |
| `--ui-font-weight-semibold` |
| `--ui-hover-overlay` |
| `--ui-info` |
| `--ui-line-height-tight` |
| `--ui-primary` |
| `--ui-radius-sm` |
| `--ui-success` |
| `--ui-surface` |
| `--ui-surface-muted` |
| `--ui-text` |
| `--ui-text-muted` |
| `--ui-warning` |
